import { useEffect, useState } from "react";
import { C, G, SH1, SH2, spring } from "../theme";
import { PROPERTIES, REGIONS, PROP_TYPES, DEAL_TYPES_BY_PROP } from "../data/data";
import { applyStatusFilter, STATUS_FILTERS, isDone, isExpiringSoon, daysLeft, termLabel, termLeft, estFee, priceChangeRate, updateLabel } from "../utils/helpers";
import { RoleToggle, SelectBox, MiniMap, DoneBadge, ContactBadge, NoteField, FeeEstimate, PriceTrend, PriceHistoryPanel, ListSheet, Tag, Dot, Frog } from "./common";
import { getDemoUser } from "../data/demoUsers";

function MultiFilter({ label, options, values, onToggle, tone = "green" }) {
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const soft = tone === "gold" ? G.goldSoft : G.greenSoft;
  const col = tone === "gold" ? C.gold : C.green;
  const [open, setOpen] = useState(false);
  const summary = values.length ? `${values.slice(0, 2).join(", ")}${values.length > 2 ? ` 외 ${values.length - 2}` : ""}` : "전체";
  return (
    <div style={{ marginTop: 10, position: "relative", zIndex: open ? 80 : 1 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", border: `1.5px solid ${values.length ? col : C.line}`, background: values.length ? soft : "#fff", borderRadius: 14, padding: "11px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer", fontFamily: "inherit" }}>
        <span style={{ fontSize: 11, color: C.gray, fontWeight: 900 }}>{label}</span>
        <span style={{ minWidth: 0, flex: 1, textAlign: "right", fontSize: 13, color: values.length ? ink : C.mid, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        <span style={{ color: ink, fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>⌄</span>
      </button>
      {open && <div style={{ position: "absolute", left: 0, right: 0, top: "calc(100% + 6px)", background: "#fff", border: `1.5px solid ${col}`, borderRadius: 16, padding: 10, boxShadow: "0 14px 32px rgba(39,57,47,.18)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {options.map(o => {
          const active = values.includes(o);
          return (
            <button key={o} onClick={() => onToggle(o)} style={{ border: `1.5px solid ${active ? col : C.line}`, background: active ? soft : "#fff", color: active ? ink : C.mid, borderRadius: 18, padding: "7px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>{active ? "✓ " : ""}{o}</button>
          );
        })}
        </div>
        <button onClick={() => setOpen(false)} style={{ width: "100%", marginTop: 8, border: "none", background: values.length ? G.header : "#F2F4F3", color: values.length ? "#fff" : C.gray, borderRadius: 12, padding: "9px 0", fontSize: 12, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>닫기</button>
      </div>}
    </div>
  );
}

const sameValues = (a = [], b = []) => a.length === b.length && a.every(v => b.includes(v));
const loadStoredMap = (key, fallback = {}) => {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};
const saveStoredMap = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export function Broker({ properties = PROPERTIES, preset = {}, menuMode = "all", role, availableRoles, tier = "골드", onSwitchRole, onOpenChat, openModal }) {
  const demoUser = getDemoUser();
  const cacheKey = name => `toad.${demoUser.id}.${name}`;
  const [points, setPoints] = useState(50000);
  const [contacted, setContacted] = useState(() => loadStoredMap(cacheKey("brokerContacted")));
  const [safeRequests, setSafeRequests] = useState(() => loadStoredMap(cacheKey("brokerSafeRequests")));
  const [favorites, setFavorites] = useState(() => loadStoredMap(cacheKey("brokerFavorites")));
  const [defaultMsg, setDefaultMsg] = useState("안녕하세요! 해당 매물 빠른 거래 도와드리겠습니다.");
  const [toast, setToast] = useState("");
  const [chargeOpen, setChargeOpen] = useState(false);
  const [hideViewed, setHideViewed] = useState(true);
  const [sido, setSido] = useState("서울특별시");
  const [regionGroup, setRegionGroup] = useState([]);
  const [region, setRegion] = useState(preset.region || "전체");
  const [dong, setDong] = useState("전체");
  const [ptypes, setPtypes] = useState(Array.isArray(preset.ptypes) ? preset.ptypes : (preset.ptype && preset.ptype !== "전체" ? [preset.ptype] : []));
  const [dealTypes, setDealTypes] = useState(Array.isArray(preset.dealTypes) ? preset.dealTypes : (preset.dealType && preset.dealType !== "전체" ? [preset.dealType] : []));
  const [sort, setSort] = useState(preset.sort || "최신순");
  const [statusFilter, setStatusFilter] = useState(preset.statusFilter || "거래중만 보기"); // 기본: 거래중인 매물만
  const [viewed, setViewed] = useState(() => loadStoredMap(cacheKey("brokerViewed")));      // 내가 열람한 매물 기록 {id: timestamp}
  const [notes, setNotes] = useState({});        // 매물별 메모 {id: text}
  const [activeId, setActiveId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [listMode, setListMode] = useState(menuMode);
  const [filterOpen, setFilterOpen] = useState(menuMode !== "viewed");
  const [appliedFilters, setAppliedFilters] = useState({ regionGroup, region, dong, ptypes, dealTypes, sort, statusFilter, hideViewed, listMode });
  const chargeOptions = [10000, 30000, 50000, 100000];
  const tierBonusRate = { 무료: 0, 실버: 0.05, 골드: 0.1 }[tier] || 0;
  const tierCost = { 무료: { fast: 2000, safe: 1000 }, 실버: { fast: 1900, safe: 950 }, 골드: { fast: 1800, safe: 900 } }[tier] || { fast: 2000, safe: 1000 };
  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 2000); };
  const updateStoredMap = (name, setter, updater) => setter(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    saveStoredMap(cacheKey(name), next);
    return next;
  });
  const markViewed = id => updateStoredMap("brokerViewed", setViewed, v => v[id] ? v : ({ ...v, [id]: "방금" }));
  const markContacted = id => updateStoredMap("brokerContacted", setContacted, c => ({ ...c, [id]: true }));
  const markSafeRequest = (id, status) => updateStoredMap("brokerSafeRequests", setSafeRequests, r => ({ ...r, [id]: status }));
  const toggleFavorite = id => updateStoredMap("brokerFavorites", setFavorites, v => ({ ...v, [id]: !v[id] }));
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
  const charge = amount => {
    const bonus = Math.round(amount * tierBonusRate);
    setPoints(p => p + amount + bonus);
    setChargeOpen(false);
    showToast(`${(amount + bonus).toLocaleString()}P 충전 완료 · ${tier} 보너스 적용`);
  };

  const needPoints = cost => {
    if (points >= cost) return false;
    showToast("포인트가 부족해요 · 충전 후 이용 가능");
    return true;
  };
  const handleFast = l => {
    if (needPoints(tierCost.fast)) return;
    setPoints(p => p - tierCost.fast);
    markContacted(l.id);
    markViewed(l.id);
    showToast(`번호 공개됨 · ${tierCost.fast.toLocaleString()}P 차감`);
  };
  const openApply = l => {
    if (needPoints(tierCost.safe)) return;
    openModal({ type: "apply", payload: { ...l, addr: `${l.region} ${l.dong} ${l.complex}` }, defaultMsg, cost: tierCost.safe, onConfirm: () => { setPoints(p => p - tierCost.safe); markContacted(l.id); markSafeRequest(l.id, "pending"); markViewed(l.id); showToast(`안심의뢰 전송 · ${tierCost.safe.toLocaleString()}P 선차감 · 거절/무응답 환불`); } });
  };
  const openEdit = () => openModal({ type: "editMsg", payload: defaultMsg, onConfirm: m => { setDefaultMsg(m); showToast("기본 메시지 저장됨"); } });
  useEffect(() => {
    setListMode(menuMode);
    setFilterOpen(menuMode !== "viewed");
    setAppliedFilters(f => ({ ...f, listMode: menuMode }));
    setActiveId(null);
  }, [menuMode]);

  const isViewedMenu = menuMode === "viewed";
  const viewTone = { page: G.pageBg, header: G.header, chip: "#ffffff2e" };
  const inListScope = p => {
    if (isViewedMenu) return viewed[p.id] && (appliedFilters.listMode !== "favorite" || favorites[p.id]);
    if (appliedFilters.listMode === "favorite") return favorites[p.id];
    return !appliedFilters.hideViewed || !contacted[p.id];
  };
  const isListEligible = p => isDone(p) || termLeft(p) > 0;
  // 필터 + 정렬 (기본은 거래중, 완료 매물은 별도 필터에서 30일 보관)
  let list = properties.filter(p => isListEligible(p) && inListScope(p) && matchesAppliedRegion(p) && (appliedFilters.dong === "전체" || p.dong === appliedFilters.dong) && (!appliedFilters.ptypes.length || appliedFilters.ptypes.includes(p.propType)) && (!appliedFilters.dealTypes.length || appliedFilters.dealTypes.includes(p.dealType)));
  list = applyStatusFilter(list, appliedFilters.statusFilter);
  if (appliedFilters.sort === "낮은가격순") list = [...list].sort((a, b) => a.priceNum - b.priceNum);
  else if (appliedFilters.sort === "높은가격순") list = [...list].sort((a, b) => b.priceNum - a.priceNum);
  else if (appliedFilters.sort === "수수료높은순") list = [...list].sort((a, b) => estFee(b) - estFee(a));
  else if (appliedFilters.sort === "추이 상승순") list = [...list].sort((a, b) => priceChangeRate(b) - priceChangeRate(a));
  else if (appliedFilters.sort === "추이 하락순") list = [...list].sort((a, b) => priceChangeRate(a) - priceChangeRate(b));
  const activePin = activeId && list.some(p => p.id === activeId) ? activeId : null;
  const visibleList = list;
  const hasFilter = appliedFilters.region !== "전체" || appliedFilters.dong !== "전체" || appliedFilters.ptypes.length > 0 || appliedFilters.dealTypes.length > 0 || appliedFilters.sort !== "최신순" || appliedFilters.statusFilter !== "거래중만 보기" || !appliedFilters.hideViewed || appliedFilters.listMode !== menuMode;
  const hasPendingFilters = appliedFilters.region !== region || appliedFilters.dong !== dong || appliedFilters.sort !== sort || appliedFilters.statusFilter !== statusFilter || appliedFilters.hideViewed !== hideViewed || appliedFilters.listMode !== listMode || !sameValues(appliedFilters.ptypes, ptypes) || !sameValues(appliedFilters.dealTypes, dealTypes);
  const applyFilters = () => {
    setAppliedFilters({ regionGroup: [...regionGroup], region, dong, ptypes: [...ptypes], dealTypes: [...dealTypes], sort, statusFilter, hideViewed, listMode });
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
    const nextFilters = { regionGroup: [], region: "전체", dong: "전체", ptypes: [], dealTypes: [], sort: "최신순", statusFilter: "거래중만 보기", hideViewed: true, listMode: menuMode };
    setRegion("전체");
    setRegionGroup([]);
    setDong("전체");
    setPtypes([]);
    setDealTypes([]);
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
  const leasePrice = l => {
    if (!l.tenantDeposit && !l.tenantMonthly) return "";
    const deposit = l.tenantDeposit ? formatMan(l.tenantDeposit) : "0";
    return Number(l.tenantMonthly) > 0 ? `${deposit}/${Number(l.tenantMonthly).toLocaleString()}만` : deposit;
  };
  const leaseBadge = l => l.dealType === "매매" && l.tenant === "있어요" ? (Number(l.tenantMonthly) > 0 ? "임대 승계" : "전세 승계") : null;
  const ownerPhone = l => l.ownerPhone || "010-1234-5678";

  const DetailSheet = ({ listing }) => {
    const done = isDone(listing);
    const cost = listing.fast ? tierCost.fast : tierCost.safe;
    const insufficient = points < cost;
    const badge = leaseBadge(listing);
    const favorite = !!favorites[listing.id];
    return (
      <div onClick={() => setSelected(null)} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "86%", overflowY: "auto", background: G.pageBg, borderRadius: "26px 26px 0 0", padding: "20px 18px 108px", boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
                {done ? <DoneBadge label={listing.doneLabel}/> : <Tag tone={listing.fast ? "gold" : "green"}>{listing.fast ? "빠른의뢰" : "안심의뢰"}</Tag>}
                {badge && <Tag tone="gold">{badge}</Tag>}
                {listing.badge && !done && <Tag tone={listing.badge === "NEW" ? "green" : "gold"}>{listing.badge}</Tag>}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{listing.region} {listing.dong} {listing.complex}</div>
              <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{listing.propType} {listing.dealType} · {listing.area}㎡ · {listing.floor}층</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => toggleFavorite(listing.id)} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${favorite ? C.gold : C.line}`, background: favorite ? G.goldSoft : "#fff", color: favorite ? C.goldInk : C.gray, fontSize: 16, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>{favorite ? "★" : "☆"}</button>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${C.line}`, background: "#fff", color: C.gray, fontSize: 18, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}><span style={{ transform: "translateY(-1px)" }}>×</span></button>
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 12 }}>{listing.price}</div>
          <PriceTrend listing={listing} tone={listing.fast ? "gold" : "green"}/>
          <PriceHistoryPanel listing={listing} tone={listing.fast ? "gold" : "green"}/>
          <FeeEstimate listing={listing} tone={listing.fast ? "gold" : "green"}/>
          <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: SH1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 10 }}>매물 정보</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["지역", `${listing.region} ${listing.dong}`],
                ["공급/전용", `${listing.supplyArea ? `${listing.supplyArea}㎡` : "미입력"} / ${(listing.exclusiveArea || listing.area) ? `${listing.exclusiveArea || listing.area}㎡` : "미입력"}`],
                ["층수", `${listing.floor || "미입력"}${listing.totalFloor ? `/${listing.totalFloor}` : ""}층`],
                ["방/욕실", `${listing.roomCount ? `${listing.roomCount}개` : "미입력"} / ${listing.bathCount ? `${listing.bathCount}개` : "미입력"}`],
                ["향", listing.direction || "미입력"],
                ["복층", listing.duplex || "미입력"],
                ["입주가능일", listing.moveInDate || "미입력"],
                ["융자금", listing.loan || "미입력"],
                ["관리비", listing.maintenance || "미입력"],
                ["수수료 상한", listing.fee],
                ["열람", `${listing.views}회`],
                ["의뢰기한", done ? "거래 완료" : termLabel(listing)],
                ["마지막 수정", updateLabel(listing)],
                ["등록", listing.ago || "미입력"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: G.greenSoft, borderRadius: 12, padding: "9px 10px" }}>
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
          ) : contacted[listing.id] ? (
            <button onClick={() => onOpenChat && onOpenChat(listing)} style={{ width: "100%", padding: "14px 0", background: G.greenSoft, border: "none", borderRadius: 14, color: C.greenInk, fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{listing.fast ? `소유주 ${ownerPhone(listing)} · 채팅하기` : safeRequests[listing.id] === "pending" ? "채팅방 열기 · 승인 대기" : "채팅방 열기"}</button>
          ) : (
            <button onClick={() => { if (listing.fast) handleFast(listing); else { setSelected(null); openApply(listing); } }} style={{ width: "100%", padding: "14px 0", background: insufficient ? "#D5DDD7" : (listing.fast ? G.gold : G.header), border: "none", borderRadius: 14, color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{insufficient ? "포인트 부족 · 충전 필요" : (listing.fast ? `번호 확인하기 (-${cost.toLocaleString()}P)` : `중개할게요 (-${cost.toLocaleString()}P)`)}</button>
          )}
        </div>
      </div>
    );
  };

  const Card = l => {
    const hi = activePin === l.id;
    const done = isDone(l);
    const left = daysLeft(l);
    const cost = l.fast ? tierCost.fast : tierCost.safe;
    const insufficient = points < cost;
    const badge = leaseBadge(l);
    const favorite = !!favorites[l.id];
    return (
      <div key={l.id} onClick={() => setSelected(l.id)} style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: hi?"0 0 0 2px "+C.green+", "+SH1:SH1, transition: "box-shadow .2s", opacity: done?0.78:1, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: C.gray }}>{updateLabel(l)}</span>
            {done ? <DoneBadge label={l.doneLabel}/> : (l.badge && <Tag tone={l.badge==="NEW"?"green":"gold"}>{l.badge}</Tag>)}
            {badge && <Tag tone="gold">{badge}</Tag>}
            {!done && contacted[l.id] && <ContactBadge label={safeRequests[l.id] === "pending" ? "승인 대기" : "연락함"} tone={l.fast ? "gold" : "green"}/>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(l.id); }} style={{ width: 28, height: 28, borderRadius: 14, border: `1px solid ${favorite ? C.gold : C.line}`, background: favorite ? G.goldSoft : "#fff", color: favorite ? C.goldInk : C.gray, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}>{favorite ? "★" : "☆"}</button>
            <span style={{ fontSize: 12, fontWeight: 700, color: l.fast ? C.goldInk : C.greenInk }}>{l.fast ? "빠른의뢰" : "안심의뢰"}</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>{l.region} {l.dong} · {l.propType} {l.dealType}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{l.complex}</div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{l.area}㎡ · {l.floor}층</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginBottom: 6 }}>{l.price}</div>
        <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 12, color: C.gray }}>
          <span>👁 열람 {l.views}회</span>
          <span>수수료 상한 {l.fee}</span>
        </div>
        {!done && <div style={{ display: "inline-flex", background: isExpiringSoon(l) ? G.goldSoft : G.greenSoft, color: isExpiringSoon(l) ? C.goldInk : C.greenInk, borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 800, marginBottom: 10 }}>의뢰기한 {termLabel(l)}</div>}
        {!done && <FeeEstimate listing={l} tone={l.fast ? "gold" : "green"}/>}
        {done ? (
          <div style={{ background: "#F2F4F3", borderRadius: 12, padding: "11px 14px", textAlign: "center", color: "#7B8580", fontWeight: 700, fontSize: 13 }}>
            거래가 완료된 매물이에요 · {left === 0 ? "오늘 목록에서 사라져요" : `${left}일 후 목록에서 사라져요`}
          </div>
        ) : contacted[l.id] ? (
          <div onClick={(e) => { e.stopPropagation(); onOpenChat && onOpenChat(l); }} style={{ background: G.greenSoft, borderRadius: 12, padding: "12px 0", textAlign: "center", color: C.greenInk, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{l.fast ? `소유주 ${ownerPhone(l)} · 채팅하기` : "채팅방 열기 · 승인 대기 중"}</div>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); if (l.fast) handleFast(l); else openApply(l); }} style={{ width: "100%", padding: "13px 0", background: insufficient ? "#D5DDD7" : (l.fast ? G.gold : G.header), border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{insufficient ? "포인트 부족 · 충전 필요" : (l.fast ? `번호 확인하기 (-${cost.toLocaleString()}P)` : `중개할게요 (-${cost.toLocaleString()}P)`)}</button>
        )}
        <NoteField value={notes[l.id]} onChange={t => setNotes(n => ({ ...n, [l.id]: t }))} tone={l.fast ? "gold" : "green"}/>
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
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}>{tier} 구독 보너스 +{Math.round(tierBonusRate * 100)}% 적용</div>
            {chargeOptions.map(amount => {
              const bonus = Math.round(amount * tierBonusRate);
              return (
                <button key={amount} onClick={() => charge(amount)} style={{ width: "100%", background: G.card, border: `1.5px solid ${bonus ? C.green : C.line}`, borderRadius: 16, padding: "13px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit", boxShadow: SH2 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>{amount.toLocaleString()}P</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: bonus ? C.greenInk : C.gray }}>{bonus ? `+${bonus.toLocaleString()}P 보너스` : "보너스 없음"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ background: viewTone.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>공인중개사</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>{isViewedMenu ? "열람한 매물" : "의뢰받은 매물"}</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="smug" size={62}/>
          </div>
        </div>
        <div style={{ background: "#ffffff26", borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #ffffff33" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 11 }}>보유 포인트 · 유효기간 3년</div><div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{points.toLocaleString()}P</div></div>
          <button onClick={() => setChargeOpen(true)} style={{ background: G.gold, border: "none", borderRadius: 12, padding: "8px 16px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>충전하기</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <span style={{ background: viewTone.chip, color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>구독: {tier} 등급</span>
          <span style={{ background: viewTone.chip, color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>{isViewedMenu ? "열람 이력 기준" : "새 의뢰 즉시 확인"}</span>
        </div>
      </div>
      <div style={{ padding: "14px 16px 0" }}>
        {!isViewedMenu && (
          <div onClick={openEdit} style={{ background: G.greenSoft, borderRadius: 18, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH2 }}>
            <Frog mood="determined" size={42}/>
            <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.greenInk }}>기본 인사 메시지</div><div style={{ fontSize: 12, color: C.mid, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{defaultMsg}"</div></div>
            <span style={{ color: C.greenInk, fontSize: 18 }}>›</span>
          </div>
        )}
        {(!isViewedMenu || filterOpen) && <MiniMap items={list} activeId={activePin} onPick={pickPin} tone="green"/>}
        {isViewedMenu && (
          <button onClick={() => setFilterOpen(v => !v)} style={{ border: "none", background: "transparent", color: C.greenInk, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", padding: "0 2px 8px", marginTop: -2 }}>{filterOpen ? "필터창 숨기기" : "필터창 보이기"}</button>
        )}
        {filterOpen && (
          <div style={{ background: G.card, borderRadius: 18, padding: 14, marginBottom: 10, boxShadow: SH2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              <SelectBox label="광역시/도" value={sido} options={["서울특별시"]} onChange={setSido}/>
              <SelectBox label="시/군/구" value={region} options={REGIONS} onChange={changeRegion}/>
              <SelectBox label="읍/면/동" value={dong} options={dongOptions} onChange={setDong}/>
            </div>
            <MultiFilter label="매물 분류" options={ptypeOptions} values={ptypes} onToggle={togglePtype}/>
            <MultiFilter label="거래 유형" options={dealOptions} values={dealTypes} onToggle={toggleDealType}/>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <SelectBox label="정렬" value={sort} options={["최신순","낮은가격순","높은가격순","수수료높은순","추이 상승순","추이 하락순"]} onChange={setSort}/>
              <SelectBox label="상태" value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter}/>
            </div>
            {isViewedMenu && (hasFilter || hasPendingFilters) && <button onClick={resetFilters} style={{ width: "100%", border: `1px solid ${C.line}`, background: "#fff", color: C.greenInk, borderRadius: 12, padding: "9px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 10 }}>필터 해제</button>}
          </div>
        )}
        {!isViewedMenu && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setHideViewed(v => !v)} style={{ border: `1.5px solid ${hideViewed ? C.green : C.line}`, background: hideViewed ? G.greenSoft : "#fff", color: hideViewed ? C.greenInk : C.mid, borderRadius: 14, padding: "10px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{hideViewed ? "✓ " : ""}열람 숨기기</button>
            <button onClick={toggleFavoriteFilter} style={{ border: `1.5px solid ${listMode === "favorite" ? C.green : C.line}`, background: listMode === "favorite" ? G.greenSoft : "#fff", color: listMode === "favorite" ? C.greenInk : C.mid, borderRadius: 14, padding: "10px 12px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>{favoriteFilterLabel}</button>
          </div>
        )}
        {filterOpen && <button onClick={applyFilters} style={{ width: "100%", border: "none", background: hasPendingFilters ? G.header : "#DDE8E1", color: hasPendingFilters ? "#fff" : C.greenInk, borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>{hasPendingFilters ? "필터 적용" : "필터 적용됨"}</button>}
        {isViewedMenu && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
            <button onClick={toggleFavoriteFilter} style={{ border: `1.5px solid ${listMode === "favorite" ? C.green : C.line}`, background: listMode === "favorite" ? G.greenSoft : "rgba(255,255,255,.72)", color: listMode === "favorite" ? C.greenInk : C.mid, borderRadius: 999, padding: "7px 11px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>{favoriteFilterLabel}</button>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: C.gray }}>총 {visibleList.length}건{activePin && <span> · 핀 선택됨</span>}{appliedFilters.statusFilter === "완료 매물" && <span style={{ color: C.gray }}> · 완료 매물은 30일간 보관</span>}</div>
          {!isViewedMenu && (hasFilter || hasPendingFilters) && <button onClick={resetFilters} style={{ border: `1px solid ${C.line}`, background: "#fff", color: C.greenInk, borderRadius: 12, padding: "6px 10px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>필터 해제</button>}
        </div>
        {visibleList.map(Card)}
        <div style={{ height: 64 }}/>
      </div>
    </div>
  );
}

