import { useEffect, useState } from "react";
import { C, G, SH1, SH2, spring } from "../theme";
import { PROPERTIES, REGIONS, PROP_TYPES, DEAL_TYPES_BY_PROP, PROPERTY_TYPE_GROUPS } from "../data/data";
import { applyStatusFilter, STATUS_FILTERS, isDone, isTermExpired, isExpiringSoon, daysLeft, termLabel, priceChangeRate, updateLabel } from "../utils/helpers";
import { RoleToggle, SelectBox, MiniMap, DoneBadge, ContactBadge, NoteField, FeeEstimate, PriceTrend, PriceHistoryPanel, ListSheet, Frog, Tag } from "./common";
import { getDemoUser } from "../data/demoUsers";
import { getDefaultPointBalance, loadLocalPointBalance, loadPointBalance, loadUserMapState, loadUserMapStateLocal, savePointBalance, saveUserMapState } from "../data/cache";


function MultiFilter({ label, options, values, onToggle, tone = "gold", groups = null }) {
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const soft = tone === "gold" ? G.goldSoft : G.greenSoft;
  const col = tone === "gold" ? C.gold : C.green;
  const [open, setOpen] = useState(false);
  const summary = values.length ? `${values.slice(0, 2).join(", ")}${values.length > 2 ? ` 외 ${values.length - 2}` : ""}` : "전체";
  const optionGroups = Array.isArray(groups)
    ? groups.map(group => ({ ...group, types: group.types.filter(type => options.includes(type.value)) })).filter(group => group.types.length)
    : null;
  return (
    <div style={{ marginTop: 10, position: "relative", zIndex: open ? 80 : 1 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", border: `1.5px solid ${values.length ? col : C.line}`, background: values.length ? soft : "#fff", borderRadius: 14, padding: "11px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", fontFamily: "inherit" }}>
        <span style={{ fontSize: 11, color: C.gray, fontWeight: 900 }}>{label}</span>
        <span style={{ minWidth: 0, flex: 1, textAlign: "right", fontSize: 13, color: values.length ? ink : C.mid, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        <span style={{ color: ink, fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>⌄</span>
      </button>
      {open && <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", background: "#fff", border: `1.5px solid ${col}`, borderRadius: 16, padding: 10, boxShadow: "0 14px 32px rgba(39,57,47,.18)" }}>
        {optionGroups ? optionGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: C.gray, fontWeight: 900, margin: "2px 0 5px 2px" }}>{group.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {group.types.map(({ value: o }) => {
                const active = values.includes(o);
                return (
                  <button key={o} onClick={() => onToggle(o)} style={{ border: `1.5px solid ${active ? col : C.line}`, background: active ? soft : "#fff", color: active ? ink : C.mid, borderRadius: 18, padding: "7px 8px", fontSize: 11.5, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.25 }}>{active ? "✓ " : ""}{o}</button>
                );
              })}
            </div>
          </div>
        )) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {options.map(o => {
              const active = values.includes(o);
              return (
                <button key={o} onClick={() => onToggle(o)} style={{ border: `1.5px solid ${active ? col : C.line}`, background: active ? soft : "#fff", color: active ? ink : C.mid, borderRadius: 18, padding: "7px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>{active ? "✓ " : ""}{o}</button>
              );
            })}
          </div>
        )}
        <button onClick={() => setOpen(false)} style={{ width: "100%", marginTop: 8, border: "none", background: values.length ? G.gold : "#F2F4F3", color: values.length ? "#fff" : C.gray, borderRadius: 12, padding: "9px 0", fontSize: 12, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>닫기</button>
      </div>}
    </div>
  );
}

const sameValues = (a = [], b = []) => a.length === b.length && a.every(v => b.includes(v));

export function BuyerExplore({ properties = PROPERTIES, preset = {}, menuMode = "all", onSwitchRole, availableRoles, viewerRole = "buyer", openModal, onOpenChat }) {
  const demoUser = getDemoUser();
  const pointDefault = getDefaultPointBalance(demoUser.role);
  const [hideViewed, setHideViewed] = useState(true);
  const maxListPrice = Math.ceil(Math.max(...properties.map(p => p.priceNum || 0), 100000) / 10000) * 10000;
  const [sido, setSido] = useState("서울특별시");
  const [regionGroup, setRegionGroup] = useState([]);
  const [region, setRegion] = useState(preset.region || "전체");
  const [dong, setDong] = useState("전체");
  const [ptypes, setPtypes] = useState(Array.isArray(preset.ptypes) ? preset.ptypes : (preset.ptype && preset.ptype !== "전체" ? [preset.ptype] : []));
  const [dealTypes, setDealTypes] = useState(Array.isArray(preset.dealTypes) ? preset.dealTypes : (preset.dealType && preset.dealType !== "전체" ? [preset.dealType] : []));
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(maxListPrice);
  const [sort, setSort] = useState(preset.sort || "최신순");
  const [statusFilter, setStatusFilter] = useState(preset.statusFilter || "거래중만 보기"); // 기본: 거래중인 매물만
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [listMode, setListMode] = useState(menuMode);
  const [filterOpen, setFilterOpen] = useState(menuMode !== "viewed");
  const [appliedFilters, setAppliedFilters] = useState({ regionGroup, region, dong, ptypes, dealTypes, priceMin, priceMax, sort, statusFilter, hideViewed, listMode });
  const [favorites, setFavorites] = useState(() => loadUserMapStateLocal(demoUser.id, "buyerFavorites"));
  const [unlocked, setUnlocked] = useState(() => loadUserMapStateLocal(demoUser.id, "buyerUnlocked"));
  const [requests, setRequests] = useState(() => loadUserMapStateLocal(demoUser.id, "buyerRequests"));
  const [points, setPoints] = useState(() => loadLocalPointBalance(demoUser.id, pointDefault));
  const [chargeOpen, setChargeOpen] = useState(false);
  const [notes, setNotes] = useState({});        // 매물별 메모
  const [toast, setToast] = useState("");
  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 2000); };
  useEffect(() => {
    let alive = true;
    setPoints(loadLocalPointBalance(demoUser.id, pointDefault));
    loadPointBalance({ userId: demoUser.id, defaultBalance: pointDefault }).then(balance => {
      if (alive) setPoints(balance);
    });
    return () => { alive = false; };
  }, [demoUser.id, pointDefault]);
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadUserMapState({ userId: demoUser.id, name: "buyerFavorites" }),
      loadUserMapState({ userId: demoUser.id, name: "buyerUnlocked" }),
      loadUserMapState({ userId: demoUser.id, name: "buyerRequests" }),
    ]).then(([nextFavorites, nextUnlocked, nextRequests]) => {
      if (!alive) return;
      setFavorites(nextFavorites);
      setUnlocked(nextUnlocked);
      setRequests(nextRequests);
    });
    return () => { alive = false; };
  }, [demoUser.id]);
  const updatePoints = (updater, reason) => setPoints(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    savePointBalance({ userId: demoUser.id, balance: next, delta: next - prev, reason });
    return next;
  });
  const updateStoredMap = (name, setter, updater) => setter(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    saveUserMapState({ userId: demoUser.id, name, value: next });
    return next;
  });
  const toggleFavorite = id => updateStoredMap("buyerFavorites", setFavorites, v => ({ ...v, [id]: !v[id] }));
  const chargeOptions = [10000, 30000, 50000, 100000];
  const buyerBonusRate = amount => amount >= 100000 ? 0.1 : amount >= 50000 ? 0.05 : amount >= 30000 ? 0.03 : 0;
  const matchesPresetRegion = p => region === "전체" ? true : p.region === region;
  const matchesAppliedRegion = p => appliedFilters.region === "전체" ? true : p.region === appliedFilters.region;
  const dongOptions = ["전체", ...Array.from(new Set(properties.filter(p => matchesPresetRegion(p)).map(p => p.dong))).sort()];
  const ptypeOptions = PROP_TYPES.filter(o => o !== "전체");
  const dealOptionsFor = nextPtypes => Array.from(new Set((nextPtypes.length ? nextPtypes : ["전체"]).flatMap(t => DEAL_TYPES_BY_PROP[t] || []))).filter(o => o !== "전체");
  const dealOptions = dealOptionsFor(ptypes);
  const togglePtype = value => setPtypes(prev => {
    const next = prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
    const allowed = dealOptionsFor(next);
    setDealTypes(ds => ds.filter(d => allowed.includes(d)));
    return next;
  });
  const toggleDealType = value => setDealTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  const changeRegion = v => { setRegion(v); setRegionGroup([]); setDong("전체"); };
  const priceLabel = n => n === 0 ? "0" : n >= 10000 ? `${Math.floor(n / 10000)}억${n % 10000 ? ` ${n % 10000}만` : ""}` : `${n.toLocaleString()}만`;
  const PRICE_SLIDER_MAX = 1000;
  const PRICE_CURVE = 2.35;
  const clampPrice = v => Math.max(0, Math.min(maxListPrice, Number(v) || 0));
  const snapPrice = v => {
    const n = clampPrice(v);
    const step = n < 10000 ? 500 : n < 50000 ? 1000 : 5000;
    return Math.min(maxListPrice, Math.round(n / step) * step);
  };
  const sliderToPrice = v => snapPrice(maxListPrice * Math.pow((Number(v) || 0) / PRICE_SLIDER_MAX, PRICE_CURVE));
  const priceToSlider = v => maxListPrice ? Math.round(Math.pow(clampPrice(v) / maxListPrice, 1 / PRICE_CURVE) * PRICE_SLIDER_MAX) : 0;
  const changePriceMin = v => setPriceMin(Math.min(sliderToPrice(v), priceMax));
  const changePriceMax = v => setPriceMax(Math.max(sliderToPrice(v), priceMin));
  const changePriceMinManual = v => setPriceMin(Math.min(clampPrice(v), priceMax));
  const changePriceMaxManual = v => setPriceMax(Math.max(clampPrice(v), priceMin));
  const priceMinSlider = priceToSlider(priceMin);
  const priceMaxSlider = priceToSlider(priceMax);
  const priceMinPct = (priceMinSlider / PRICE_SLIDER_MAX) * 100;
  const priceMaxPct = (priceMaxSlider / PRICE_SLIDER_MAX) * 100;
  const charge = amount => {
    const bonus = Math.round(amount * buyerBonusRate(amount));
    updatePoints(p => p + amount + bonus, "buyer_point_charge");
    setChargeOpen(false);
    showToast(`${(amount + bonus).toLocaleString()}P 충전 완료`);
  };

  const isViewedMenu = menuMode === "viewed";
  const viewTone = { page: G.pageBg, header: G.header, chip: "#ffffff2e" };
  const inListScope = p => {
    if (isViewedMenu) return unlocked[p.id] && (appliedFilters.listMode !== "favorite" || favorites[p.id]);
    if (appliedFilters.listMode === "favorite") return favorites[p.id];
    return !appliedFilters.hideViewed || !unlocked[p.id];
  };
  const isListEligible = p => isDone(p) || p.status === "active";
  let list = properties.filter(p => isListEligible(p) && inListScope(p) && matchesAppliedRegion(p) && (appliedFilters.dong === "전체" || p.dong === appliedFilters.dong) && (!appliedFilters.ptypes.length || appliedFilters.ptypes.includes(p.propType)) && (!appliedFilters.dealTypes.length || appliedFilters.dealTypes.includes(p.dealType)) && (p.priceNum || 0) >= appliedFilters.priceMin && (p.priceNum || 0) <= appliedFilters.priceMax);
  list = applyStatusFilter(list, appliedFilters.statusFilter);
  if (appliedFilters.sort === "낮은가격순") list = [...list].sort((a, b) => a.priceNum - b.priceNum);
  else if (appliedFilters.sort === "높은가격순") list = [...list].sort((a, b) => b.priceNum - a.priceNum);
  else if (appliedFilters.sort === "인기순") list = [...list].sort((a, b) => b.views - a.views);
  else if (appliedFilters.sort === "추이 상승순") list = [...list].sort((a, b) => priceChangeRate(b) - priceChangeRate(a));
  else if (appliedFilters.sort === "추이 하락순") list = [...list].sort((a, b) => priceChangeRate(a) - priceChangeRate(b));
  const activePin = activeId && list.some(p => p.id === activeId) ? activeId : null;
  const visibleList = list;
  const hasFilter = appliedFilters.region !== "전체" || appliedFilters.dong !== "전체" || appliedFilters.ptypes.length > 0 || appliedFilters.dealTypes.length > 0 || appliedFilters.priceMin > 0 || appliedFilters.priceMax < maxListPrice || appliedFilters.sort !== "최신순" || appliedFilters.statusFilter !== "거래중만 보기" || !appliedFilters.hideViewed || appliedFilters.listMode !== menuMode;
  const hasPendingFilters = appliedFilters.region !== region || appliedFilters.dong !== dong || appliedFilters.priceMin !== priceMin || appliedFilters.priceMax !== priceMax || appliedFilters.sort !== sort || appliedFilters.statusFilter !== statusFilter || appliedFilters.hideViewed !== hideViewed || appliedFilters.listMode !== listMode || !sameValues(appliedFilters.ptypes, ptypes) || !sameValues(appliedFilters.dealTypes, dealTypes);
  const applyFilters = () => {
    setAppliedFilters({ regionGroup: [...regionGroup], region, dong, ptypes: [...ptypes], dealTypes: [...dealTypes], priceMin, priceMax, sort, statusFilter, hideViewed, listMode });
    setActiveId(null);
  };
  const toggleFavoriteFilter = () => {
    const nextMode = listMode === "favorite" ? menuMode : "favorite";
    setListMode(nextMode);
    if (isViewedMenu) {
      setAppliedFilters(f => ({ ...f, listMode: nextMode }));
      setActiveId(null);
    }
  };
  const favoriteFilterLabel = listMode === "favorite" ? "전체리스트 보기" : "즐겨찾기만 보기";
  const pickPin = id => {
    const picked = properties.find(p => p.id === id);
    setActiveId(id === activeId ? null : id);
    if (!picked) return;
    setRegionGroup([]);
    setRegion(picked.region);
    setDong(picked.dong || "전체");
  };
  const resetFilters = () => {
    const nextFilters = { regionGroup: [], region: "전체", dong: "전체", ptypes: [], dealTypes: [], priceMin: 0, priceMax: maxListPrice, sort: "최신순", statusFilter: "거래중만 보기", hideViewed: true, listMode: menuMode };
    setRegion("전체");
    setRegionGroup([]);
    setDong("전체");
    setPtypes([]);
    setDealTypes([]);
    setPriceMin(0);
    setPriceMax(maxListPrice);
    setSort("최신순");
    setStatusFilter("거래중만 보기");
    setHideViewed(true);
    setListMode(menuMode);
    setAppliedFilters(nextFilters);
    setActiveId(null);
  };

  const selectedListing = properties.find(p => p.id === selected);
  const formatMan = man => {
    const n = parseInt(man, 10) || 0;
    const eok = Math.floor(n / 10000);
    const rest = n % 10000;
    if (eok > 0) return `${eok}억${rest > 0 ? ` ${rest.toLocaleString()}만` : ""}`;
    return `${n.toLocaleString()}만`;
  };
  const leasePrice = p => {
    if (!p.tenantDeposit && !p.tenantMonthly) return "";
    const deposit = p.tenantDeposit ? formatMan(p.tenantDeposit) : "0";
    return Number(p.tenantMonthly) > 0 ? `${deposit}/${Number(p.tenantMonthly).toLocaleString()}만` : deposit;
  };
  const leaseBadge = p => p.dealType === "매매" && p.tenant === "있어요" ? (Number(p.tenantMonthly) > 0 ? "임대 승계" : "전세 승계") : null;
  const ownerPhoneFor = p => p.ownerPhone || p.owner_phone || "연락처 미등록";
  const ownerLabelFor = p => p.ownerLabel || p.ownerName || (String(p.ownerKey || "").startsWith("owner-") ? `소유주 ${String(p.ownerKey).replace("owner-", "")}` : p.ownerKey) || "소유주 미지정";
  const ContactOpenBox = ({ listing }) => (
    <div onClick={e => e.stopPropagation()} style={{ background: G.goldSoft, border: `1.5px solid ${C.gold}`, borderRadius: 14, padding: 13, display: "grid", gap: 8, boxShadow: SH2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12, color: C.goldInk, fontWeight: 900 }}>소유주 연락처</span>
        <span style={{ fontSize: 15, color: C.dark, fontWeight: 900 }}>{ownerPhoneFor(listing)}</span>
      </div>
      <button onClick={() => onOpenChat && onOpenChat(listing)} style={{ width: "100%", padding: "11px 0", background: "#fff", border: `1.5px solid ${C.gold}`, borderRadius: 12, color: C.goldInk, fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>채팅 걸기</button>
    </div>
  );
  const openPay = p => {
    if (isTermExpired(p)) {
      showToast("매물 의뢰가 만료됐어요 · 연락처 요청 불가");
      return;
    }
    if (points < 10000) {
      showToast("포인트가 부족해요 · 충전 후 이용 가능");
      setChargeOpen(true);
      return;
    }
    if (p.fast) {
      openModal({ type: "pay", mode: "instant", cost: 10000, payload: p, onConfirm: () => { updatePoints(v => v - 10000, "buyer_fast_contact"); updateStoredMap("buyerUnlocked", setUnlocked, u => ({ ...u, [p.id]: true })); showToast("10,000P 차감 · 연락처 확인 완료"); } });
      return;
    }
    openModal({ type: "pay", mode: "safe", cost: 10000, payload: p, onConfirm: () => { updatePoints(v => v - 10000, "buyer_safe_request"); updateStoredMap("buyerRequests", setRequests, r => ({ ...r, [p.id]: "pending" })); showToast("안심 열람 요청 전송 · 선차감 · 거절/무응답 환불"); } });
  };
  useEffect(() => {
    setListMode(menuMode);
    setFilterOpen(menuMode !== "viewed");
    setAppliedFilters(f => ({ ...f, listMode: menuMode }));
    setActiveId(null);
  }, [menuMode]);

  const DetailSheet = ({ listing }) => {
    const open = unlocked[listing.id];
    const requested = requests[listing.id] === "pending";
    const done = isDone(listing);
    const expired = isTermExpired(listing);
    const badge = leaseBadge(listing);
    const favorite = !!favorites[listing.id];
    return (
      <div onClick={() => setSelected(null)} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "86%", overflowY: "auto", background: G.pageBg, borderRadius: "26px 26px 0 0", padding: "20px 18px 108px", boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
                {done ? <DoneBadge label={listing.doneLabel}/> : <Tag tone={listing.fast ? "gold" : "green"}>{listing.fast ? "빠른 열람" : "안심 요청"}</Tag>}
                {listing.badge && !done && <Tag tone={listing.badge === "NEW" ? "green" : "gold"}>{listing.badge}</Tag>}
                {badge && <Tag tone="gold">{badge}</Tag>}
                {!done && open && <ContactBadge label="연락함" tone="gold"/>}
                {!done && requested && <ContactBadge label="승인 대기" tone="green"/>}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{listing.region} {listing.dong} {listing.complex}</div>
              <div style={{ fontSize: 12, color: C.goldInk, fontWeight: 900, marginTop: 3 }}>소유주 {ownerLabelFor(listing)}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{listing.propType} {listing.dealType} · {listing.area}㎡ · {listing.floor}층</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => toggleFavorite(listing.id)} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${favorite ? C.gold : C.line}`, background: favorite ? G.goldSoft : "#fff", color: favorite ? C.goldInk : C.gray, fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>{favorite ? "★" : "☆"}</button>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${C.line}`, background: "#fff", color: C.gray, fontSize: 18, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}><span style={{ transform: "translateY(-1px)" }}>×</span></button>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 12 }}>{listing.price}</div>
          <PriceTrend listing={listing} tone="gold"/>
          <PriceHistoryPanel listing={listing} tone="gold"/>
          <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: SH1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 10 }}>매물 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["소유주", ownerLabelFor(listing)],
                ["지역", `${listing.region} ${listing.dong}`],
                ["공급/전용", `${listing.supplyArea ? `${listing.supplyArea}㎡` : "미입력"} / ${(listing.exclusiveArea || listing.area) ? `${listing.exclusiveArea || listing.area}㎡` : "미입력"}`],
                ["층수", `${listing.floor || "미입력"}${listing.totalFloor ? `/${listing.totalFloor}` : ""}층`],
                ["방/욕실", `${listing.roomCount ? `${listing.roomCount}개` : "미입력"} / ${listing.bathCount ? `${listing.bathCount}개` : "미입력"}`],
                ["향", listing.direction || "미입력"],
                ["복층", listing.duplex || "미입력"],
                ["입주가능일", listing.moveInDate || "미입력"],
                ["융자금", listing.loan || "미입력"],
                ["관리비", listing.maintenance || "미입력"],
                ["열람", `${listing.views}회`],
                ["마지막 수정", updateLabel(listing)],
                ["등록", listing.ago || "미입력"],
                ["의뢰기한", done ? "거래 완료" : termLabel(listing)],
                ["거래유형", `${listing.propType} ${listing.dealType}`],
              ].map(([label, value]) => (
                <div key={label} style={{ background: G.goldSoft, borderRadius: 12, padding: "9px 10px" }}>
                  <div style={{ fontSize: 10, color: C.gray, fontWeight: 800 }}>{label}</div>
                  <div style={{ fontSize: 12, color: C.dark, fontWeight: 800, marginTop: 2, lineHeight: 1.4 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          {listing.tenant === "있어요" && (
            <div style={{ background: G.goldSoft, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: SH2 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.goldInk, marginBottom: 8 }}>{badge || "임차인 있음"}</div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7 }}>
                보증금/월세: {leasePrice(listing) || "미입력"}<br/>
                만기: {listing.tenantEnd || "미입력"}
                {listing.tenantMemo && <><br/>메모: {listing.tenantMemo}</>}
              </div>
            </div>
          )}
          {done ? (
            <div style={{ background: "#F2F4F3", borderRadius: 14, padding: "13px 14px", textAlign: "center", color: "#7B8580", fontWeight: 800, fontSize: 13 }}>거래 완료된 매물</div>
          ) : expired ? (
            <div style={{ background: "#F2F4F3", borderRadius: 14, padding: "13px 14px", textAlign: "center", color: "#7B8580", fontWeight: 800, fontSize: 13 }}>매물 의뢰가 만료됐어요 · 연락처 요청 불가</div>
          ) : open ? (
            <ContactOpenBox listing={listing}/>
          ) : requested ? (
            <button onClick={() => onOpenChat && onOpenChat(listing)} style={{ width: "100%", padding: "14px 0", background: G.greenSoft, border: "none", borderRadius: 14, color: C.greenInk, fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>채팅방 열기 · 승인 대기</button>
          ) : (
            <button onClick={() => { setSelected(null); openPay(listing); }} style={{ width: "100%", padding: "14px 0", background: listing.fast ? G.gold : G.header, border: "none", borderRadius: 14, color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{listing.fast ? "연락처 열람 (10,000P)" : "연락처 공개 요청 (10,000P)"}</button>
          )}
        </div>
      </div>
    );
  };

  const Card = p => {
    const open = unlocked[p.id];
    const requested = requests[p.id] === "pending";
    const hi = activePin === p.id;
    const done = isDone(p);
    const expired = isTermExpired(p);
    const left = daysLeft(p);
    const badge = leaseBadge(p);
    const favorite = !!favorites[p.id];
    return (
      <div key={p.id} onClick={() => setSelected(p.id)} style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: hi?"0 0 0 2px "+C.gold+", "+SH1:SH1, transition: "box-shadow .2s", opacity: done?0.78:1, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span style={{ fontSize: 11, color: C.gray }}>{updateLabel(p)}</span>{done ? <DoneBadge label={p.doneLabel}/> : <Tag tone={p.fast ? "gold" : "green"}>{p.fast ? "빠른 열람" : "안심 요청"}</Tag>}{p.badge && !done && <Tag tone={p.badge==="NEW"?"green":"gold"}>{p.badge}</Tag>}{badge && <Tag tone="gold">{badge}</Tag>}{!done && open && <ContactBadge label="연락함" tone="gold"/>}{!done && requested && <ContactBadge label="승인 대기" tone="green"/>}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }} style={{ width: 28, height: 28, borderRadius: 14, border: `1px solid ${favorite ? C.gold : C.line}`, background: favorite ? G.goldSoft : "#fff", color: favorite ? C.goldInk : C.gray, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>{favorite ? "★" : "☆"}</button>
            <span style={{ fontSize: 11, color: C.gray }}>👁 {p.views}</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>{p.region} {p.dong} · {p.propType} {p.dealType} · 소유주 {ownerLabelFor(p)}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{p.complex}</div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{p.area}㎡ · {p.floor}층</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginBottom: 12 }}>{p.price}</div>
        {!done && <div style={{ display: "inline-flex", background: expired ? "#F2F4F3" : isExpiringSoon(p) ? G.goldSoft : G.greenSoft, color: expired ? "#7B8580" : isExpiringSoon(p) ? C.goldInk : C.greenInk, borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 800, marginBottom: 10 }}>의뢰기한 {termLabel(p)}</div>}
        {done ? (
          <div style={{ background: "#F2F4F3", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#7B8580", fontWeight: 700, textAlign: "center" }}>거래 완료된 매물 · {left === 0 ? "오늘 목록에서 사라져요" : `${left}일 후 사라져요`}</div>
        ) : expired ? (
          <div style={{ background: "#F2F4F3", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#7B8580", fontWeight: 700, textAlign: "center" }}>매물 의뢰가 만료됐어요 · 연락처 요청 불가</div>
        ) : open ? (
          <ContactOpenBox listing={p}/>
        ) : requested ? (
          <button onClick={(e) => { e.stopPropagation(); onOpenChat && onOpenChat(p); }} style={{ width: "100%", background: G.greenSoft, border: "none", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: C.greenInk, fontWeight: 800, textAlign: "center", cursor: "pointer", fontFamily: "inherit" }}>채팅방 열기 · 승인 대기 중</button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); openPay(p); }} style={{ width: "100%", padding: "13px 0", background: p.fast ? G.gold : G.header, border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{p.fast ? "연락처 열람 (10,000P)" : "연락처 공개 요청 (10,000P)"}</button>
        )}
        {!done && <NoteField value={notes[p.id]} onChange={t => setNotes(n => ({ ...n, [p.id]: t }))} tone="gold"/>}
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 132, background: viewTone.page, minHeight: "100%", position: "relative" }}>
      {toast && <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#3A4A42ee", color: "#fff", padding: "10px 18px", borderRadius: 20, fontSize: 13, zIndex: 60, animation: "fadeIn .2s", boxShadow: SH1 }}>{toast}</div>}
      {selectedListing && <DetailSheet listing={selectedListing}/>}
      {chargeOpen && (
        <div onClick={() => setChargeOpen(false)} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "calc(100% - 120px)", overflowY: "auto", background: G.pageBg, borderRadius: "26px 26px 0 0", padding: "20px 18px 108px", boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginBottom: 4 }}>포인트 충전</div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}>직거래 연락처 열람은 10,000P가 필요해요</div>
            {chargeOptions.map(amount => {
              const bonus = Math.round(amount * buyerBonusRate(amount));
              return (
                <button key={amount} onClick={() => charge(amount)} style={{ width: "100%", background: G.card, border: `1.5px solid ${bonus ? C.gold : C.line}`, borderRadius: 16, padding: "13px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit", boxShadow: SH2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>{amount.toLocaleString()}P</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: bonus ? C.goldInk : C.gray }}>{bonus ? `+${bonus.toLocaleString()}P 보너스` : "보너스 없음"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ background: viewTone.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#ffffffcc", fontSize: 13 }}>{viewerRole === "owner" ? "소유주 · 시세 참고" : viewerRole === "broker" ? "공인중개사 · 시장 보기" : "직거래 매수자"}</div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>{isViewedMenu ? "열람한 매물" : "직거래 매물"}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={viewerRole} roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="cool" size={62}/>
          </div>
        </div>
        <div style={{ background: viewTone.chip, borderRadius: 16, padding: "12px 16px", marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #ffffff33" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 11 }}>보유 포인트</div><div style={{ color: "#fff", fontSize: 19, fontWeight: 900 }}>{points.toLocaleString()}P</div></div>
          <button onClick={() => setChargeOpen(true)} style={{ background: G.gold, border: "none", borderRadius: 12, padding: "8px 16px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>충전하기</button>
        </div>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        {(!isViewedMenu || filterOpen) && <MiniMap items={list} activeId={activePin} onPick={pickPin} tone="gold"/>}
        {isViewedMenu && (
          <button onClick={() => setFilterOpen(v => !v)} style={{ border: "none", background: "transparent", color: C.goldInk, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: "0 2px 8px", marginTop: -2 }}>{filterOpen ? "필터창 숨기기" : "필터창 보이기"}</button>
        )}
        {filterOpen && (
          <div style={{ background: G.card, borderRadius: 18, padding: 14, marginBottom: 10, boxShadow: SH2 }}>
            <style>{`
              .priceRangeInput {
                appearance: none;
                background: transparent;
                pointer-events: none;
              }
              .priceRangeInput::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 3px solid #fff;
                background: ${C.gold};
                box-shadow: 0 2px 8px rgba(0,0,0,.18);
                pointer-events: auto;
                cursor: pointer;
              }
              .priceRangeInput::-webkit-slider-runnable-track {
                appearance: none;
                height: 6px;
                background: transparent;
              }
              .priceRangeInput::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                border: 3px solid #fff;
                background: ${C.gold};
                box-shadow: 0 2px 8px rgba(0,0,0,.18);
                pointer-events: auto;
                cursor: pointer;
              }
              .priceRangeInput::-moz-range-track {
                height: 6px;
                background: transparent;
              }
            `}</style>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              <SelectBox label="광역시/도" value={sido} options={["서울특별시"]} onChange={setSido} tone="gold"/>
              <SelectBox label="시/군/구" value={region} options={REGIONS} onChange={changeRegion} tone="gold"/>
              <SelectBox label="읍/면/동" value={dong} options={dongOptions} onChange={setDong} tone="gold"/>
            </div>
            <div style={{ background: G.goldSoft, borderRadius: 14, padding: 12, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.goldInk, fontWeight: 900 }}>금액대</span>
                <span style={{ fontSize: 12, color: C.mid, fontWeight: 800 }}>{priceLabel(priceMin)} ~ {priceLabel(priceMax)} · 임대는 보증금</span>
              </div>
              <div style={{ position: "relative", height: 34, marginTop: 2 }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 14, height: 6, borderRadius: 3, background: C.line }}/>
                <div style={{ position: "absolute", left: `${priceMinPct}%`, right: `${100 - priceMaxPct}%`, top: 14, height: 6, borderRadius: 3, background: G.gold }}/>
                <input className="priceRangeInput" type="range" min="0" max={PRICE_SLIDER_MAX} step="1" value={priceMinSlider} onChange={e => changePriceMin(e.target.value)} style={{ position: "absolute", left: 0, right: 0, top: 4, width: "100%", zIndex: priceMinSlider > PRICE_SLIDER_MAX - 80 ? 5 : 3 }}/>
                <input className="priceRangeInput" type="range" min="0" max={PRICE_SLIDER_MAX} step="1" value={priceMaxSlider} onChange={e => changePriceMax(e.target.value)} style={{ position: "absolute", left: 0, right: 0, top: 4, width: "100%", zIndex: 4 }}/>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: 10, color: C.gray, fontWeight: 800, marginBottom: 4 }}>최소 금액(만원)</span>
                  <input type="number" inputMode="numeric" min="0" max={priceMax} value={priceMin} onChange={e => changePriceMinManual(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "9px 10px", fontSize: 12, fontWeight: 800, color: C.dark, outline: "none", fontFamily: "inherit", background: "#fff" }}/>
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: 10, color: C.gray, fontWeight: 800, marginBottom: 4 }}>최대 금액(만원)</span>
                  <input type="number" inputMode="numeric" min={priceMin} max={maxListPrice} value={priceMax} onChange={e => changePriceMaxManual(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "9px 10px", fontSize: 12, fontWeight: 800, color: C.dark, outline: "none", fontFamily: "inherit", background: "#fff" }}/>
                </label>
              </div>
            </div>
            <MultiFilter label="매물 분류" options={ptypeOptions} values={ptypes} onToggle={togglePtype} tone="gold" groups={PROPERTY_TYPE_GROUPS}/>
            <MultiFilter label="거래 유형" options={dealOptions} values={dealTypes} onToggle={toggleDealType} tone="gold"/>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <SelectBox label="정렬" value={sort} options={["최신순","낮은가격순","높은가격순","인기순","추이 상승순","추이 하락순"]} onChange={setSort} tone="gold"/>
              <SelectBox label="상태" value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter} tone="gold"/>
            </div>
            {isViewedMenu && (hasFilter || hasPendingFilters) && <button onClick={resetFilters} style={{ width: "100%", border: `1px solid ${C.line}`, background: "#fff", color: C.goldInk, borderRadius: 12, padding: "9px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 10 }}>필터 해제</button>}
          </div>
        )}
        {!isViewedMenu && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setHideViewed(v => !v)} style={{ border: `1.5px solid ${hideViewed ? C.gold : C.line}`, background: hideViewed ? G.goldSoft : "#fff", color: hideViewed ? C.goldInk : C.mid, borderRadius: 14, padding: "10px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{hideViewed ? "✓ " : ""}열람 숨기기</button>
            <button onClick={toggleFavoriteFilter} style={{ border: `1.5px solid ${listMode === "favorite" ? C.gold : C.line}`, background: listMode === "favorite" ? G.goldSoft : "#fff", color: listMode === "favorite" ? C.goldInk : C.mid, borderRadius: 14, padding: "10px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{favoriteFilterLabel}</button>
          </div>
        )}
        {filterOpen && <button onClick={applyFilters} style={{ width: "100%", border: "none", background: hasPendingFilters ? G.gold : "#F4E8D0", color: hasPendingFilters ? "#fff" : C.goldInk, borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>{hasPendingFilters ? "필터 적용" : "필터 적용됨"}</button>}
        {isViewedMenu && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button onClick={toggleFavoriteFilter} style={{ border: `1.5px solid ${listMode === "favorite" ? C.gold : C.line}`, background: listMode === "favorite" ? G.goldSoft : "rgba(255,255,255,.72)", color: listMode === "favorite" ? C.goldInk : C.mid, borderRadius: 999, padding: "7px 11px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>{favoriteFilterLabel}</button>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: C.gray }}>총 {visibleList.length}건{activePin && <span> · 핀 선택됨</span>}</div>
          {!isViewedMenu && (hasFilter || hasPendingFilters) && <button onClick={resetFilters} style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.goldInk, borderRadius: 12, padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>필터 해제</button>}
        </div>
        {visibleList.map(Card)}
        <div style={{ height: 64 }}/>
      </div>
    </div>
  );
}
