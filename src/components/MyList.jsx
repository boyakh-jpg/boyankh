import { useState } from "react";
import { C, G, SH1, SH2 } from "../theme";
import { isDone, isExpired, isExpiringSoon, daysLeft, termLabel, updateLabel } from "../utils/helpers";
import { RoleToggle, FilterChips, MiniMap, DoneBadge, ContactBadge, NoteField, FeeEstimate, PriceTrend, ListSheet, Dot, Btn, Frog, Tag, StatCard } from "./common";

export function MyList({ properties = [], preset = {}, onRegister, onSetDone, onExtendTerm, onUpdatePrice, onUpdateListing, role, availableRoles, onSwitchRole }) {
  const [view, setView] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [priceEdit, setPriceEdit] = useState(null);
  const [infoEdit, setInfoEdit] = useState(null);
  const [infoDraft, setInfoDraft] = useState({});
  const [priceDraft, setPriceDraft] = useState("");
  const [priceReason, setPriceReason] = useState("가격 조정");
  const [statusFilter, setStatusFilter] = useState(preset.statusFilter || "전체");
  const [toast, setToast] = useState("");
  const [notes, setNotes] = useState({});        // 매물별 메모 {id: text}
  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 2200); };
  // 기존 데모 매물 (상세 통계·열람내역 보유). 자체 dealState로 완료 토글.
  const [demoListings, setDemoListings] = useState([
    { id: "demo1", type: "아파트 매매", dealType: "매매", region: "마포구", dong: "공덕동", addr: "마포구 공덕동 래미안5차", detail: "84㎡ · 18층 · 남향", price: "12억 5,000만", priceNum: 125000, fee: "0.4%", status: "빠른의뢰", tone: "gold", fast: true, brokers: 4, direct: 2, days: 12, views: 24, dealState: "active", doneLabel: "매도완료", supplyArea: 112, exclusiveArea: 84, floor: 18, totalFloor: 25, roomCount: 3, bathCount: 2, moveInDate: "2026년 11월 이후 협의", loan: "없음", duplex: "단층", updatedAgo: "방금 전", updatedReason: "가격 인하", priceHistory: [{ date: "2026-05-01", priceNum: 129000, reason: "최초 등록" }, { date: "2026-05-27", priceNum: 125000, reason: "가격 인하" }],
      description: "역세권 단지, 최근 도배 완료. 실거주보다 전세 승계 매수자에게 적합해요.", maintenance: "18만원", parking: "1대 가능", direction: "남향", special: "부분 리모델링", tenant: "있어요", tenantDeposit: "60000", tenantMonthly: "", tenantEnd: "2026년 11월", tenantMemo: "만기 전 퇴거는 협의 필요",
      viewLog: [
        { name: "최은영 공인중개사", office: "공덕역 으뜸부동산", when: "방금", sec: 135 },
        { name: "김민준 공인중개사", office: "마포 스마트공인중개사", when: "12분 전", sec: 95 },
        { name: "박지훈 공인중개사", office: "마포 한강공인중개사", when: "1시간 전", sec: 42 },
        { name: "이수연 공인중개사", office: "공덕 부동산플러스", when: "3시간 전", sec: 18 },
      ] },
    { id: "demo2", type: "아파트 전세", dealType: "전세", region: "송파구", dong: "잠실동", addr: "송파구 잠실동 리센츠", detail: "59㎡ · 7층 · 동향", price: "6억", priceNum: 60000, fee: "0.3%", status: "안심의뢰", tone: "green", fast: false, brokers: 14, direct: 5, days: 2, views: 41, dealState: "active", doneLabel: "전세완료", supplyArea: 79, exclusiveArea: 59, floor: 7, totalFloor: 28, roomCount: 2, bathCount: 1, moveInDate: "즉시입주", loan: "없음", duplex: "단층", updatedAgo: "방금 전", updatedReason: "시세 반영", priceHistory: [{ date: "2026-05-01", priceNum: 62000, reason: "최초 등록" }, { date: "2026-05-27", priceNum: 60000, reason: "시세 반영" }],
      description: "단지 관리상태 좋고 바로 전세 상담 가능합니다.", maintenance: "14만원", parking: "협의", direction: "동향", special: "입주일 협의", tenant: "없어요 (공실)", tenantEnd: "", tenantDeposit: "", tenantMonthly: "", tenantMemo: "",
      viewLog: [
        { name: "정하늘 공인중개사", office: "잠실 리더스부동산", when: "5분 전", sec: 210 },
        { name: "강도윤 공인중개사", office: "송파 더공인중개사", when: "40분 전", sec: 88 },
        { name: "윤서아 공인중개사", office: "잠실역 으뜸부동산", when: "2시간 전", sec: 25 },
      ] },
  ]);
  // 공용 store에서 내가 등록한 매물 → MyList 표시 형식으로 정규화
  const mine = properties.filter(p => p.mine).map(p => ({
    id: p.id, type: `${p.propType} ${p.dealType}`, dealType: p.dealType,
    region: p.region, dong: p.dong, addr: `${p.region} ${p.dong} ${p.complex}`.trim(),
    detail: `${p.exclusiveArea || p.area}㎡ · ${p.floor}${p.totalFloor ? `/${p.totalFloor}` : ""}층`, price: p.price, priceNum: p.priceNum, fee: p.fee,
    status: p.fast ? "빠른의뢰" : "안심의뢰", tone: p.fast ? "gold" : "green", fast: p.fast,
    brokers: 0, direct: 0, days: p.expiresInDays ?? 14, views: p.views,
    dealState: p.status, doneLabel: p.doneLabel, fromStore: true,
    priceHistory: p.priceHistory, updatedAgo: p.updatedAgo, updatedReason: p.updatedReason,
    description: p.description, maintenance: p.maintenance, parking: p.parking, direction: p.direction, special: p.special,
    supplyArea: p.supplyArea, exclusiveArea: p.exclusiveArea, floor: p.floor, totalFloor: p.totalFloor, roomCount: p.roomCount, bathCount: p.bathCount, moveInDate: p.moveInDate, loan: p.loan, duplex: p.duplex,
    tenant: p.tenant, tenantEnd: p.tenantEnd, tenantDeposit: p.tenantDeposit, tenantMonthly: p.tenantMonthly, tenantMemo: p.tenantMemo,
    viewLog: [],
  }));
  // 새 등록분이 위로, 그 다음 데모
  const listings = [...mine, ...demoListings];
  const visibleListings = listings.filter(l => {
    if (statusFilter === "만료 임박") return l.dealState !== "done" && (l.days ?? 14) <= 3;
    if (statusFilter === "거래중") return l.dealState !== "done";
    if (statusFilter === "완료") return l.dealState === "done";
    return true;
  });
  // 거래 완료/되돌리기: store 매물은 전역 반영(onSetDone), 데모는 자체 state
  const setDone = (l, done) => {
    if (l.fromStore) { onSetDone && onSetDone(l.id, done); }
    else { setDemoListings(ls => ls.map(x => x.id === l.id ? { ...x, dealState: done ? "done" : "active" } : x)); }
    showToast(done ? "거래 완료로 변경됐어요 · 중개사·매수자 화면에 완료 표시" : "다시 거래중으로 변경됐어요");
  };
  // 의뢰 기한 2주 연장
  const extendTerm = l => {
    if (l.fromStore) { onExtendTerm && onExtendTerm(l.id); }
    else { setDemoListings(ls => ls.map(x => x.id === l.id ? { ...x, days: (x.days || 0) + 14 } : x)); }
    showToast("의뢰 기한이 2주 연장됐어요");
  };
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
  const DetailInfoPanel = ({ listing }) => (
    <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: SH1 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 10 }}>매물 상세</div>
      {listing.description && <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 12 }}>{listing.description}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          ["공급/전용", `${listing.supplyArea ? `${listing.supplyArea}㎡` : "미입력"} / ${(listing.exclusiveArea || listing.area) ? `${listing.exclusiveArea || listing.area}㎡` : "미입력"}`],
          ["층수", `${listing.floor || "미입력"}${listing.totalFloor ? `/${listing.totalFloor}` : ""}층`],
          ["방/욕실", `${listing.roomCount ? `${listing.roomCount}개` : "미입력"} / ${listing.bathCount ? `${listing.bathCount}개` : "미입력"}`],
          ["향", listing.direction || "미입력"],
          ["복층", listing.duplex || "미입력"],
          ["입주가능일", listing.moveInDate || "미입력"],
          ["융자금", listing.loan || "미입력"],
          ["관리비", listing.maintenance || "미입력"],
          ["주차", listing.parking || "미입력"],
          ["특이사항", listing.special || "미입력"],
          ["마지막 수정", updateLabel(listing)],
        ].map(([label, value]) => (
          <div key={label} style={{ background: G.greenSoft, borderRadius: 12, padding: "9px 10px" }}>
            <div style={{ fontSize: 10, color: C.gray, fontWeight: 800 }}>{label}</div>
            <div style={{ fontSize: 12, color: C.dark, fontWeight: 800, marginTop: 2, lineHeight: 1.4 }}>{value}</div>
          </div>
        ))}
      </div>
      {listing.tenant === "있어요" && (
        <div style={{ marginTop: 10, background: G.goldSoft, borderRadius: 14, padding: "11px 12px", color: C.mid, fontSize: 12, lineHeight: 1.7 }}>
          <b style={{ color: C.goldInk }}>임차인 있음</b><br/>
          보증금/월세: {leasePrice(listing) || "미입력"}<br/>
          만기: {listing.tenantEnd || "미입력"}
          {listing.tenantMemo && <><br/>메모: {listing.tenantMemo}</>}
        </div>
      )}
    </div>
  );
  const PriceHistoryPanel = ({ listing }) => {
    const history = listing.priceHistory || [];
    if (history.length < 2) return null;
    const first = history[0].priceNum || listing.priceNum;
    return (
      <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: SH1 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 10 }}>가격 조정 내역</div>
        {history.map((h, i) => {
          const diff = (h.priceNum || listing.priceNum) - first;
          const sign = diff > 0 ? "+" : "";
          return (
            <div key={`${h.date}-${i}`} style={{ display: "grid", gridTemplateColumns: "72px 1fr 72px", gap: 8, alignItems: "center", padding: "8px 0", borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
              <span style={{ fontSize: 11, color: C.gray }}>{h.date}</span>
              <span style={{ fontSize: 12, color: C.dark, fontWeight: 800 }}>{formatMan(h.priceNum || listing.priceNum)} · {h.reason || "가격 조정"}</span>
              <span style={{ textAlign: "right", fontSize: 11, color: diff < 0 ? C.goldInk : diff > 0 ? C.greenInk : C.gray, fontWeight: 900 }}>{i === 0 ? "최초" : `${sign}${formatMan(Math.abs(diff))}`}</span>
            </div>
          );
        })}
      </div>
    );
  };
  const openInfoEdit = l => {
    setInfoEdit(l);
    setInfoDraft({
      description: l.description || "",
      supplyArea: String(l.supplyArea || ""),
      exclusiveArea: String(l.exclusiveArea || l.area || ""),
      floor: String(l.floor || ""),
      totalFloor: String(l.totalFloor || ""),
      roomCount: String(l.roomCount || ""),
      bathCount: String(l.bathCount || ""),
      direction: l.direction || "",
      duplex: l.duplex || "",
      moveInDate: l.moveInDate || "",
      loan: l.loan || "",
      maintenance: l.maintenance || "",
      parking: l.parking || "",
      special: l.special || "",
    });
  };
  const setInfo = (k, v) => setInfoDraft(p => ({ ...p, [k]: v }));
  const infoPatch = () => {
    const n = k => parseInt(infoDraft[k], 10) || null;
    return {
      description: infoDraft.description,
      supplyArea: n("supplyArea"),
      exclusiveArea: n("exclusiveArea"),
      area: n("exclusiveArea"),
      floor: n("floor"),
      totalFloor: n("totalFloor"),
      roomCount: n("roomCount"),
      bathCount: n("bathCount"),
      direction: infoDraft.direction,
      duplex: infoDraft.duplex,
      moveInDate: infoDraft.moveInDate,
      loan: infoDraft.loan,
      maintenance: infoDraft.maintenance,
      parking: infoDraft.parking,
      special: infoDraft.special,
    };
  };
  const saveInfo = () => {
    if (!infoEdit) return;
    const patch = infoPatch();
    const detail = `${patch.exclusiveArea || infoEdit.area || "미입력"}㎡ · ${patch.floor || infoEdit.floor || "미입력"}${patch.totalFloor ? `/${patch.totalFloor}` : ""}층${patch.direction ? ` · ${patch.direction}` : ""}`;
    if (infoEdit.fromStore) {
      onUpdateListing && onUpdateListing(infoEdit.id, patch);
    } else {
      setDemoListings(ls => ls.map(x => x.id === infoEdit.id ? { ...x, ...patch, detail, updatedAgo: "방금 전", updatedReason: "매물 정보 수정" } : x));
    }
    setInfoEdit(null);
    showToast("매물 정보가 수정됐어요");
  };
  const openPriceEdit = l => {
    setPriceEdit(l);
    setPriceDraft(String(l.priceNum || ""));
    setPriceReason("가격 조정");
  };
  const savePrice = () => {
    const priceNum = parseInt(priceDraft, 10) || 0;
    if (!priceEdit || priceNum <= 0) return;
    const price = formatMan(priceNum);
    const historyItem = { date: "2026-05-27", priceNum, reason: priceReason };
    if (priceEdit.fromStore) {
      onUpdatePrice && onUpdatePrice(priceEdit.id, priceNum, price, priceReason);
    } else {
      setDemoListings(ls => ls.map(x => x.id === priceEdit.id ? { ...x, priceNum, price, updatedAgo: "방금 전", updatedReason: priceReason, priceHistory: [...(x.priceHistory || []), historyItem] } : x));
    }
    setPriceEdit(null);
    showToast("가격이 변경됐어요 · 가격 추이에 기록됨");
  };
  if (view !== null) {
    const l = listings[view];
    if (!l) { setView(null); return null; }
    const done = l.dealState === "done";
    return (
      <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%", position: "relative" }}>
        {toast && <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#3A4A42ee", color: "#fff", padding: "10px 18px", borderRadius: 20, fontSize: 13, zIndex: 60, animation: "fadeIn .2s", boxShadow: SH1, textAlign: "center", maxWidth: "88%" }}>{toast}</div>}
        {sheet && <ListSheet kind={sheet} onClose={() => setSheet(null)}/>}
        {priceEdit && (
          <div onClick={() => setPriceEdit(null)} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", background: G.pageBg, borderRadius: "26px 26px 0 0", padding: "20px 18px 28px", boxSizing: "border-box", animation: "sheetUp .3s" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginBottom: 4 }}>가격 변경</div>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}>만원 단위로 입력하면 가격 추이에 기록돼요</div>
              <input value={priceDraft} onChange={e => setPriceDraft(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="예: 125000" style={{ width: "100%", boxSizing: "border-box", padding: "14px 12px", borderRadius: 14, border: `1.5px solid ${C.green}`, fontSize: 16, fontFamily: "inherit", outline: "none", marginBottom: 8 }}/>
              <FilterChips options={["가격 조정", "급매 전환", "시세 반영", "조건 변경", "오입력 수정"]} value={priceReason} onChange={setPriceReason}/>
              <Btn onClick={savePrice} style={{ marginTop: 14 }}>가격 변경 저장</Btn>
            </div>
          </div>
        )}
        {infoEdit && (
          <div onClick={() => setInfoEdit(null)} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "82%", overflowY: "auto", background: G.pageBg, borderRadius: "26px 26px 0 0", padding: "20px 18px 28px", boxSizing: "border-box", animation: "sheetUp .3s" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginBottom: 4 }}>매물 정보 수정</div>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 14 }}>잘못 올린 기본 정보를 바로 고칠 수 있어요</div>
              <textarea placeholder="상세 설명" value={infoDraft.description || ""} onChange={e => setInfo("description", e.target.value)} rows={3} style={{ width: "100%", padding: 13, borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff", resize: "none", marginBottom: 8, lineHeight: 1.5 }}/>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                {[["공급면적㎡","supplyArea"],["전용면적㎡","exclusiveArea"],["해당층","floor"],["총층","totalFloor"],["방수","roomCount"],["욕실수","bathCount"]].map(([ph, k]) => (
                  <input key={k} inputMode="numeric" placeholder={ph} value={infoDraft[k] || ""} onChange={e => setInfo(k, e.target.value.replace(/[^0-9]/g, ""))} style={{ padding: "12px 11px", borderRadius: 13, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}/>
                ))}
              </div>
              {[["향","direction","예: 남향"],["복층 여부","duplex","예: 단층"],["입주가능일","moveInDate","예: 즉시입주"],["융자금","loan","예: 없음"],["관리비","maintenance","예: 15만원"],["주차","parking","예: 1대 가능"],["특이사항","special","예: 부분 리모델링"]].map(([label, k, ph]) => (
                <div key={k} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.mid, marginBottom: 5 }}>{label}</div>
                  <input placeholder={ph} value={infoDraft[k] || ""} onChange={e => setInfo(k, e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 13, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                </div>
              ))}
              <Btn onClick={saveInfo} style={{ marginTop: 8 }}>정보 수정 저장</Btn>
            </div>
          </div>
        )}
        <div style={{ background: G.header, padding: "46px 20px 22px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
          <button onClick={() => setView(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", padding: 0, marginBottom: 8, fontFamily: "inherit" }}>← 내 매물</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{l.addr}</div>
            {done && <span style={{ background: "#ffffff2e", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 8 }}>{l.doneLabel}</span>}
          </div>
          <div style={{ color: "#ffffffcc", fontSize: 13 }}>{l.type} · {l.detail}</div>
          <div style={{ color: "#ffffffcc", fontSize: 12, marginTop: 4 }}>{updateLabel(l)}{l.updatedReason ? ` · ${l.updatedReason}` : ""}</div>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 8 }}>{l.price}</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <StatCard value={l.views + "회"} label="총 열람" tone="dark"/>
            <StatCard value={l.brokers + "곳"} label="제안한 부동산" tone="green" onClick={() => setSheet("broker")}/>
            <StatCard value={l.direct + "건"} label="직거래 문의" tone="gold" onClick={() => setSheet("direct")}/>
            <StatCard value={l.fee} label="수수료 상한" tone="dark"/>
          </div>
          <FeeEstimate listing={l} tone={l.tone} showDirectSaving/>
          <DetailInfoPanel listing={l}/>
          <PriceTrend listing={l} tone={l.tone}/>
          <PriceHistoryPanel listing={l}/>
          {!done && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <button onClick={() => openInfoEdit(l)} style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: `1.5px solid ${C.green}`, background: "#fff", color: C.greenInk, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>정보 수정</button>
              <button onClick={() => openPriceEdit(l)} style={{ width: "100%", padding: "13px 0", borderRadius: 14, border: `1.5px solid ${C.green}`, background: "#fff", color: C.greenInk, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>가격 변경</button>
            </div>
          )}
          {/* 거래 완료 처리 */}
          {done ? (
            <div style={{ background: "#F2F4F3", borderRadius: 18, padding: "16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", boxShadow: SH2 }}>
              <Frog mood="joyful" size={42}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#5E6B64" }}>{l.doneLabel} 처리됨</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>중개사·매수자 화면에서 완료로 표시되며, 30일간 완료 매물에 보관돼요</div>
              </div>
              <button onClick={() => setDone(l, false)} style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "8px 12px", color: C.mid, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>되돌리기</button>
            </div>
          ) : (
            <button onClick={() => setDone(l, true)} style={{ width: "100%", padding: "15px 0", borderRadius: 16, border: "none", background: G.header, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", marginBottom: 14, boxShadow: SH2 }}>✓ 거래 완료 처리하기</button>
          )}
          {/* 열람 내역 추적 */}
          {l.viewLog.length > 0 ? (
          <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: SH1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Frog mood="suspicious" size={36}/>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>열람 내역</div><div style={{ fontSize: 11, color: C.gray }}>누가 얼마나 봤는지 확인하세요</div></div>
            </div>
            {l.viewLog.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i===0?"none":`1px solid ${C.line}` }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: v.sec >= 60 ? C.green : C.line, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{v.name}</div><div style={{ fontSize: 11, color: C.gray }}>{v.office}</div></div>
                <div style={{ textAlign: "right" }}><div style={{ fontSize: 12, color: C.mid }}>{v.when}</div><div style={{ fontSize: 11, color: v.sec>=60?C.greenInk:C.gray, fontWeight: v.sec>=60?700:400 }}>{v.sec >= 60 ? `${Math.floor(v.sec/60)}분 ${v.sec%60}초` : `${v.sec}초`} 봄</div></div>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: C.gray, textAlign: "center" }}>● 1분 이상 본 중개사는 진지하게 검토 중일 가능성이 높아요</div>
          </div>
          ) : (
          <div style={{ background: G.card, borderRadius: 18, padding: "20px 16px", marginBottom: 14, boxShadow: SH1, textAlign: "center" }}>
            <Frog mood="sleepy" size={70} animate/>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginTop: 6 }}>이제 막 의뢰가 공개됐어요</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 4, lineHeight: 1.6 }}>전국 중개사에게 발송됐어요 · 곧 열람 내역이<br/>여기에 쌓이기 시작해요</div>
          </div>
          )}
          <div style={{ background: G.greenSoft, borderRadius: 16, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
            <Frog mood="calm" size={44}/>
            <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>위 카드를 누르면 <b style={{ color: C.greenInk }}>제안한 부동산</b>과 <b style={{ color: C.goldInk }}>직거래 문의</b> 목록을 볼 수 있어요</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>소유주</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>내 의뢰 매물</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="calm" size={62}/>
          </div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}><FilterChips options={["전체", "거래중", "만료 임박", "완료"]} value={statusFilter} onChange={setStatusFilter}/></div>
        {visibleListings.map((l) => {
          const done = l.dealState === "done";
          const soon = !done && (l.days ?? 14) <= 3;   // 만료 임박
          return (
          <div key={l.id} onClick={() => setView(listings.findIndex(x => x.id === l.id))} style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: soon ? "0 0 0 1.5px "+C.gold+", "+SH1 : SH1, cursor: "pointer", opacity: done?0.82:1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div><div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{updateLabel(l)}</div><div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{l.type}</div><div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{l.addr}</div><div style={{ fontSize: 12, color: C.gray }}>{l.detail}</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
                {done ? <DoneBadge label={l.doneLabel}/> : <Tag tone={l.tone}>{l.status}</Tag>}
                {l.dealType === "매매" && l.tenant === "있어요" && <Tag tone="gold">{Number(l.tenantMonthly) > 0 ? "임대 승계" : "전세 승계"}</Tag>}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginBottom: 10 }}>{l.price}</div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
              <span style={{ fontSize: 12, color: C.greenInk, fontWeight: 600 }}>중개사 {l.brokers}명</span>
              <span style={{ fontSize: 12, color: C.goldInk, fontWeight: 600 }}>직거래 {l.direct}건</span>
              <span style={{ fontSize: 12, color: done ? C.gray : soon ? C.goldInk : C.gray, fontWeight: soon ? 700 : 400 }}>{done ? "거래 종료" : (l.days ?? 14) <= 0 ? "기한 만료" : (l.days ?? 14) === 1 ? "내일 만료" : `${l.days}일 남음`}</span>
            </div>
            {soon && (
              <div style={{ marginTop: 10, background: G.goldSoft, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: C.goldInk, fontWeight: 700, flex: 1, lineHeight: 1.4 }}>곧 의뢰가 만료돼요<br/><span style={{ fontWeight: 500, color: C.mid, fontSize: 11 }}>연장하지 않으면 목록에서 내려가요</span></span>
                <button onClick={(e) => { e.stopPropagation(); extendTerm(l); }} style={{ flexShrink: 0, padding: "8px 14px", background: G.gold, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>2주 연장</button>
              </div>
            )}
            <NoteField value={notes[l.id]} onChange={t => setNotes(n => ({ ...n, [l.id]: t }))} tone={l.tone}/>
          </div>
          );
        })}
        <button onClick={onRegister} style={{ width: "100%", padding: "16px 0", borderRadius: 18, border: `2px dashed ${C.green}`, background: G.greenSoft, color: C.greenInk, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>+ 새 매물 의뢰하기</button>
        <div style={{ height: 64 }}/>
      </div>
    </div>
  );
}
