import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FROG_SPRITE } from "../frogSprite";
import { C, G, SH1, SH2, spring } from "../theme";
import { INTEREST_BROKERS, DIRECT_BUYERS } from "../data/data";
import { CACHE_KEYS, loadCache, saveCache, syncCache } from "../data/cache";
import { feeFormula, wonText, estFee, priceChangeRate, isDone, termLabel, isExpiringSoon } from "../utils/helpers";

const SW = 160, SH = 160, COLS = 4, ROWS = 4;
const FROGS = {
  excited:{col:0,row:0}, determined:{col:1,row:0}, calm:{col:2,row:0}, smug:{col:3,row:0},
  confused:{col:0,row:1}, suspicious:{col:1,row:1}, sad:{col:2,row:1}, joyful:{col:3,row:1},
  angry:{col:0,row:2}, thinkHeart:{col:1,row:2}, sleepy:{col:2,row:2}, pondering:{col:3,row:2},
  nervous:{col:0,row:3}, shy:{col:1,row:3}, love:{col:2,row:3}, cool:{col:3,row:3,y:11},
};
export function Frog({ mood = "calm", size = 80, animate = false }) {
  const f = FROGS[mood] || FROGS.calm;
  const scale = size / SW;
  return (
    <div style={{ width: size, height: size, overflow: "hidden", display: "inline-block", position: "relative", alignSelf: "center", lineHeight: 0, flexShrink: 0,
      animation: animate ? "frogPop .45s cubic-bezier(.34,1.56,.64,1)" : "none",
      filter: "drop-shadow(0 6px 10px rgba(120,140,120,.18))" }}>
      <div style={{ position: "absolute", top: f.y || 0, left: 0, width: SW, height: SH, backgroundImage: `url(${FROG_SPRITE})`,
        backgroundPosition: `-${f.col*SW}px -${f.row*SH}px`, backgroundSize: `${SW*COLS}px ${SH*ROWS}px`,
        transform: `scale(${scale})`, transformOrigin: "top left" }}/>
    </div>
  );
}

export function Dot({ color = C.green, size = 8 }) {
  return <span style={{ width: size, height: size, borderRadius: size, background: color, display: "inline-block" }}/>;
}

export function Btn({ children, onClick, disabled, variant = "primary", style: sx = {} }) {
  const v = {
    primary: { background: disabled ? "#D5DDD7" : G.header, color: "#fff" },
    gold: { background: G.gold, color: "#fff" },
    outline: { background: "transparent", border: `1.5px solid ${C.green}`, color: C.greenInk },
  }[variant];
  return (
    <button onClick={disabled ? null : onClick} style={{ width: "100%", padding: "16px 0", borderRadius: 18,
      border: "none", fontSize: 16, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "inherit", boxShadow: disabled ? "none" : "0 8px 20px rgba(111,184,148,.28)",
      transition: "transform .12s", ...v, ...sx }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>{children}</button>
  );
}
export function Dots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 4,
          background: i <= current ? C.green : C.line, transition: "all .3s " + spring }}/>
      ))}
    </div>
  );
}
export function Slide({ k, dir = 1, children }) {
  return <div key={k} style={{ animation: `slide${dir > 0 ? "Next" : "Prev"} .32s cubic-bezier(.4,0,.2,1)` }}>{children}</div>;
}
export function Tag({ children, tone = "green" }) {
  const map = { green: [C.greenInk, C.greenSoft], gold: [C.goldInk, C.goldSoft] };
  const m = map[tone] || map.green;
  return <span style={{ background: m[1], color: m[0], fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>;
}

// 역할 순환 토글: 현재 역할 → 누르면 다음 역할
const ROLE_LABEL = { owner: "소유주", broker: "중개사", buyer: "직거래" };
export function RoleToggle({ role, onClick, roles = ["owner", "broker", "buyer"] }) {
  const cur = ROLE_LABEL[role] || "소유주";
  const order = roles.includes(role) ? roles : ["owner", "buyer"];
  if (order.length <= 1) {
    return (
      <button disabled style={{ minWidth: 82, boxSizing: "border-box", background: "#ffffff2e", border: "1px solid #ffffff55", borderRadius: 20, padding: "6px 10px", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "default", fontFamily: "inherit", whiteSpace: "nowrap", transform: "translateY(3px)" }}>
        {cur}
      </button>
    );
  }
  const next = ROLE_LABEL[order[(order.indexOf(role) + 1) % order.length]] || "직거래";
  return (
    <button onClick={onClick} style={{ minWidth: 104, boxSizing: "border-box", background: "#ffffff2e", border: "1px solid #ffffff55", borderRadius: 20, padding: "6px 10px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, whiteSpace: "nowrap", transform: "translateY(3px)" }}>
      <span style={{ opacity: .75, fontSize: 10, fontWeight: 600, lineHeight: 1, height: 14, display: "inline-flex", alignItems: "center" }}>{cur}</span>
      <span style={{ opacity: .7, fontSize: 11, lineHeight: 1, height: 14, display: "inline-flex", alignItems: "center" }}>›</span>
      <span style={{ opacity: 1, fontSize: 13, fontWeight: 900, lineHeight: 1, height: 14, display: "inline-flex", alignItems: "center", transform: "translateY(-1px)" }}>{next}</span>
    </button>
  );
}

export function FeeEstimate({ listing, tone = "green", showDirectSaving = false }) {
  const [open, setOpen] = useState(false);
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const soft = tone === "gold" ? C.goldSoft : C.greenSoft;
  return (
    <div style={{ marginBottom: 12 }}>
      <div onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: soft, borderRadius: 12, padding: "10px 13px", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: C.mid }}>예상 중개보수</span>
          <span style={{ width: 15, height: 15, borderRadius: 8, background: "#fff", color: ink, fontSize: 10, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>?</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: ink }}>약 {wonText(estFee(listing))}</span>
      </div>
      {open && (
        <div style={{ marginTop: 6, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "10px 13px", fontSize: 11.5, color: C.mid, lineHeight: 1.6 }}>
          {feeFormula(listing)} = <b style={{ color: ink }}>약 {wonText(estFee(listing))}</b>
          <div style={{ color: C.gray, marginTop: 4 }}>※ 요율 상한 기준 최대 금액이며 협의로 낮아질 수 있어요{listing.dealType === "월세" ? " · 월세는 환산보증금 기준" : ""}</div>
          {showDirectSaving && <div style={{ color: C.goldInk, marginTop: 4, fontWeight: 700 }}>💡 직거래로 매수자와 직접 거래하면 중개보수 0원</div>}
        </div>
      )}
    </div>
  );
}

export function PriceTrend({ listing, tone = "green", compact = false }) {
  const history = listing.priceHistory || [];
  if (!history.length) return null;
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const soft = tone === "gold" ? C.goldSoft : C.greenSoft;
  const first = history[0];
  const last = history[history.length - 1];
  const rate = priceChangeRate(listing);
  const rateText = `${rate > 0 ? "+" : ""}${rate.toFixed(1)}%`;
  const changed = history.length > 1;
  const label = !changed || Math.abs(rate) < 0.1 ? "가격 변동 없음" : rate < 0 ? "가격 인하" : "가격 상향";
  if (compact) {
    if (!changed || Math.abs(rate) < 0.1) return null;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: soft, borderRadius: 12, padding: "8px 11px", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: C.mid, fontWeight: 800 }}>{label} · 최초 대비</span>
        <span style={{ fontSize: 12, color: rate < 0 ? C.goldInk : ink, fontWeight: 900 }}>{rateText}</span>
      </div>
    );
  }
  return (
    <div style={{ background: soft, border: `1.5px solid ${ink}`, borderRadius: 14, padding: "11px 13px", marginBottom: 12, boxShadow: SH2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: C.dark, fontWeight: 900 }}>{label}</span>
        <span style={{ fontSize: 13, color: rate < 0 ? C.goldInk : ink, fontWeight: 900 }}>{changed ? rateText : "변동 없음"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11, color: C.gray }}>
        <span>최초 {wonText((first.priceNum || listing.priceNum) * 10000)}</span>
        <span>현재 {wonText((last.priceNum || listing.priceNum) * 10000)}</span>
      </div>
      {changed && <div style={{ marginTop: 5, fontSize: 11, color: C.gray }}>최근 사유: {last.reason || "가격 조정"}</div>}
    </div>
  );
}

export function PriceHistoryPanel({ listing, tone = "green" }) {
  const history = listing.priceHistory || [];
  if (history.length < 2) return null;
  const first = history[0].priceNum || listing.priceNum;
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const formatMan = man => {
    const n = parseInt(man, 10) || 0;
    const eok = Math.floor(n / 10000);
    const rest = n % 10000;
    if (eok > 0) return `${eok}억${rest > 0 ? ` ${rest.toLocaleString()}만` : ""}`;
    return `${n.toLocaleString()}만`;
  };
  return (
    <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: SH1 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 10 }}>가격 조정 내역</div>
      {history.map((h, i) => {
        const diff = (h.priceNum || listing.priceNum) - first;
        const sign = diff > 0 ? "+" : "";
        return (
          <div key={`${h.date}-${i}`} style={{ display: "grid", gridTemplateColumns: "72px 1fr 70px", gap: 8, alignItems: "center", padding: "8px 0", borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
            <span style={{ fontSize: 11, color: C.gray }}>{h.date}</span>
            <span style={{ fontSize: 12, color: C.dark, fontWeight: 800, lineHeight: 1.35 }}>{formatMan(h.priceNum || listing.priceNum)} · {h.reason || "가격 조정"}</span>
            <span style={{ textAlign: "right", fontSize: 11, color: diff < 0 ? C.goldInk : diff > 0 ? ink : C.gray, fontWeight: 900 }}>{i === 0 ? "최초" : `${sign}${formatMan(Math.abs(diff))}`}</span>
          </div>
        );
      })}
    </div>
  );
}

// 완료 뱃지 (매도완료/전세완료/임대완료) + 색상
export function DoneBadge({ label, tone = "gray" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EDEFEE", color: "#7B8580", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 8, letterSpacing: ".2px" }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: "#9AA8A0" }}/>{label}
    </span>
  );
}

// 연락함 뱃지 (이미 연락/문의한 매물·소유주 표시)
export function ContactBadge({ label = "연락함", tone = "green" }) {
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const soft = tone === "gold" ? C.goldSoft : C.greenSoft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: soft, color: ink, fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 8 }}>
      <span style={{ fontSize: 10 }}>✓</span>{label}
    </span>
  );
}

// 인라인 메모: 평소엔 "메모" 버튼, 누르면 입력칸 펼침. 저장하면 메모 표시.
export function NoteField({ value, onChange, tone = "green" }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const soft = tone === "gold" ? C.goldSoft : C.greenSoft;
  const save = () => { onChange(draft.trim()); setOpen(false); };
  if (!open) {
    return value ? (
      <div onClick={(e) => { e.stopPropagation(); setDraft(value); setOpen(true); }} style={{ display: "flex", alignItems: "flex-start", gap: 6, background: soft, borderRadius: 10, padding: "8px 11px", marginTop: 8, cursor: "pointer" }}>
        <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>📝</span>
        <span style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, flex: 1, wordBreak: "break-word" }}>{value}</span>
        <span style={{ fontSize: 11, color: ink, fontWeight: 700, flexShrink: 0 }}>수정</span>
      </div>
    ) : (
      <button onClick={(e) => { e.stopPropagation(); setDraft(""); setOpen(true); }} style={{ marginTop: 8, background: "none", border: `1px dashed ${C.line}`, borderRadius: 10, padding: "7px 11px", color: C.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
        <span>📝</span> 메모 추가
      </button>
    );
  }
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 8 }}>
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus placeholder="예: 소유주 친절함 · 5/30 통화 예정" rows={2} style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: `1.5px solid ${ink}`, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.5 }}/>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={save} style={{ flex: 1, padding: "8px 0", background: ink, border: "none", borderRadius: 9, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
        <button onClick={() => setOpen(false)} style={{ padding: "8px 14px", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 9, color: C.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
      </div>
    </div>
  );
}

// 정렬/필터 가로 스크롤 칩
export function FilterChips({ options, value, onChange, tone = "green" }) {
  const col = tone === "gold" ? C.gold : C.green;
  const soft = tone === "gold" ? C.goldSoft : C.greenSoft;
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, overflow: "visible", paddingBottom: 0, maxWidth: "100%" }}>
      {options.map(o => {
        const sel = value === o;
        return (
          <button key={o} onClick={() => onChange(o)} style={{ flex: "0 0 auto", padding: "7px 12px", borderRadius: 20, border: `1.5px solid ${sel?col:C.line}`, background: sel?soft:C.card, color: sel?ink:C.mid, fontSize: 12, fontWeight: sel?700:500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{o}</button>
        );
      })}
    </div>
  );
}

export function SelectBox({ label, value, options, onChange, tone = "green" }) {
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 11, color: C.gray, fontWeight: 800, marginBottom: 5 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", minWidth: 0, height: 40, borderRadius: 12, border: `1.5px solid ${C.line}`, background: "#fff", color: ink, fontSize: 12, fontWeight: 800, fontFamily: "inherit", padding: "0 10px", outline: "none" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

export const proposalDecisionKey = item => item?.requestId || item?.chatId || null;
export const proposalViewKey = item => item?.requestId || item?.chatId || item?.id || item?.office || item?.name || "";

export function getOwnerProposalItems(viewerKey, kind) {
  const isBroker = kind === "broker";
  if (viewerKey === "toad-demo-owner-2") {
    if (isBroker) {
      return INTEREST_BROKERS.slice(1, 3).map((broker, index) => ({
        ...broker,
        name: index === 0 ? "서민재 공인중개사" : "오하린 공인중개사",
        office: index === 0 ? "대치 센트럴공인중개사" : "강남 로열부동산",
        region: "강남구",
        listingTitle: "강남구 대치동 은마아파트 · 76㎡",
        activityType: "안심의뢰",
        proposalNew: index === 0,
        chatId: null,
      }));
    }
    return DIRECT_BUYERS.slice(0, 1).map(buyer => ({
      ...buyer,
      name: "실거주 매수자 C",
      note: "학군 실거주 목적, 잔금 일정 빠르게 협의 가능",
      when: "35분 전",
      budget: "18억까지",
      proposalNew: true,
      requestId: "direct-safe-owner-b",
      chatId: null,
      listingTitle: "강남구 대치동 은마아파트 · 76㎡",
    }));
  }
  if (viewerKey === "toad-demo-owner") return isBroker ? INTEREST_BROKERS : DIRECT_BUYERS;
  return [];
}

export const canDecideBrokerProposal = item => item?.activityType === "안심의뢰" && !!proposalDecisionKey(item);
export const canDecideDirectProposal = item => item?.activityType === "안심의뢰" && !!proposalDecisionKey(item);
export const proposalIsNew = (item, decisions = {}, views = {}) => {
  const decisionKey = proposalDecisionKey(item);
  const viewKey = proposalViewKey(item);
  return !!item?.proposalNew && !views[viewKey] && !(decisionKey && decisions[decisionKey]);
};
export const getNewProposalItems = (items, decisions = {}, views = {}) => items.filter(item => proposalIsNew(item, decisions, views));
export function getOwnerProposalCounts(viewerKey, decisions = {}, views = {}) {
  const brokers = getOwnerProposalItems(viewerKey, "broker");
  const direct = getOwnerProposalItems(viewerKey, "direct");
  return {
    brokers: brokers.length,
    direct: direct.length,
    newBrokers: getNewProposalItems(brokers, decisions, views).length,
    newDirect: getNewProposalItems(direct, decisions, views).length,
    expiring: viewerKey === "toad-demo-owner-2" ? 0 : 1,
  };
}

// 미니 지도 (SVG, API 키 불필요) — 핀 누르면 onPick
export function MiniMap({ items, activeId, onPick, tone = "green" }) {
  const col = tone === "gold" ? C.gold : C.green;
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  return (
    <div style={{ position: "relative", width: "100%", height: 180, borderRadius: 18, overflow: "hidden", boxShadow: SH2, background: "linear-gradient(160deg,#EAF3ED 0%,#E0EEE6 100%)", marginBottom: 14 }}>
      {/* 배경: 강(한강) 느낌의 곡선 + 그리드 */}
      <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#D2E4D9" strokeWidth="0.4"/></pattern>
        </defs>
        <rect width="100" height="60" fill="url(#grid)"/>
        <path d="M0 30 Q25 22 50 32 T100 30 L100 40 Q75 34 50 42 T0 40 Z" fill="#BFE0EC" opacity="0.7"/>
        <text x="6" y="20" fontSize="3" fill="#9AA8A0">한강</text>
      </svg>
      {/* 핀 */}
      {items.map(p => {
        const sel = activeId === p.id;
        return (
          <button key={p.id} onClick={() => onPick && onPick(p.id)} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-100%)", background: "none", border: "none", cursor: "pointer", padding: 0, zIndex: sel?5:1 }}>
            <div style={{ background: sel?col:"#fff", color: sel?"#fff":ink, fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 12, boxShadow: "0 3px 8px rgba(80,110,90,.25)", border: `1.5px solid ${col}`, whiteSpace: "nowrap" }}>{p.dong}</div>
            <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${sel?col:"#fff"}`, margin: "0 auto", filter: "drop-shadow(0 2px 1px rgba(80,110,90,.2))" }}/>
          </button>
        );
      })}
      <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: C.gray, background: "#ffffffcc", padding: "2px 8px", borderRadius: 10 }}>핀을 눌러 지역 선택</div>
    </div>
  );
}

export function ListSheet({ kind, onlyNew = false, viewerKey = "toad-demo-owner", itemsOverride = null, onClose, onProposalStateChange, onApproveProposal }) {
  const isBroker = kind === "broker";
  const [showAll, setShowAll] = useState(false);
  const [localDecisions, setLocalDecisions] = useState(() => loadCache(CACHE_KEYS.contactDecisions, {}));
  const [proposalViews, setProposalViews] = useState(() => loadCache(CACHE_KEYS.proposalViews, {}));
  const decisions = localDecisions && typeof localDecisions === "object" && !Array.isArray(localDecisions) ? localDecisions : {};
  const views = proposalViews && typeof proposalViews === "object" && !Array.isArray(proposalViews) ? proposalViews : {};
  useEffect(() => {
    let alive = true;
    syncCache(CACHE_KEYS.contactDecisions, {}).then(next => {
      if (alive && next && typeof next === "object" && !Array.isArray(next)) setLocalDecisions(next);
    });
    syncCache(CACHE_KEYS.proposalViews, {}).then(next => {
      if (alive && next && typeof next === "object" && !Array.isArray(next)) setProposalViews(next);
    });
    return () => { alive = false; };
  }, []);
  const decide = (item, key, value) => {
    if (!key) return;
    setLocalDecisions(d => {
      const next = { ...(d && typeof d === "object" && !Array.isArray(d) ? d : {}), [key]: value };
      saveCache(CACHE_KEYS.contactDecisions, next);
      onProposalStateChange?.({ decisions: next });
      return next;
    });
    if (value === "approved") onApproveProposal?.({ kind, item });
  };
  const markProposalViewed = item => {
    const key = proposalViewKey(item);
    if (!key) return;
    setProposalViews(v => {
      const next = { ...(v && typeof v === "object" && !Array.isArray(v) ? v : {}), [key]: true };
      saveCache(CACHE_KEYS.proposalViews, next);
      onProposalStateChange?.({ views: next });
      return next;
    });
  };
  const allItems = Array.isArray(itemsOverride) ? itemsOverride : getOwnerProposalItems(viewerKey, kind);
  const items = onlyNew && !showAll ? getNewProposalItems(allItems, decisions, views) : allItems;
  const title = isBroker
    ? (onlyNew && !showAll ? `새롭게 제안한 부동산 ${items.length}곳` : `의뢰받은 부동산 ${items.length}곳`)
    : (onlyNew && !showAll ? `새롭게 제안한 직거래 매수자 ${items.length}명` : `직거래 매수자 ${items.length}명`);
  const showAllLabel = isBroker ? "모든 부동산 리스트보기" : "모든 직거래 매수자 리스트보기";
  const sheet = (
    <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }} onClick={onClose} onWheel={e => e.stopPropagation()}>
      <div onClick={e => e.stopPropagation()} style={{ background: G.pageBg, borderRadius: "26px 26px 0 0", width: "100%", maxHeight: "78%", overflowY: "auto", padding: "20px 18px 28px", boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Frog mood={isBroker ? "excited" : "love"} size={48}/>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{title}</div><div style={{ fontSize: 12, color: C.gray }}>{isBroker ? "내 의뢰에 중개 제안을 보낸 부동산이에요" : "내 물건을 열람하거나 안심의뢰한 매수자예요"}</div></div>
        </div>
        {onlyNew && !showAll && <button onClick={() => setShowAll(true)} style={{ width: "100%", border: `1.5px solid ${C.green}`, background: "#fff", color: C.greenInk, borderRadius: 14, padding: "10px 0", marginBottom: 12, fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>{showAllLabel}</button>}
        {isBroker ? items.map((b, i) => {
          const canDecide = canDecideBrokerProposal(b);
          const decisionKey = proposalDecisionKey(b);
          return (
            <BrokerOfficeCard
              key={i}
              broker={b}
              compact
              actionLabel="전화 / 문자 연결"
              onClick={() => markProposalViewed(b)}
              decision={canDecide ? decisions[decisionKey] : null}
              onApprove={canDecide ? () => decide(b, decisionKey, "approved") : null}
              onReject={canDecide ? () => decide(b, decisionKey, "rejected") : null}
            />
          );
        }) : items.map((b, i) => {
          const canDecide = canDecideDirectProposal(b);
          const decisionKey = proposalDecisionKey(b);
          const decision = canDecide ? decisions[decisionKey] : null;
          return (
            <div key={i} style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: SH2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{b.name}</div><div style={{ fontSize: 11, color: C.gray }}>{b.when}</div></div>
              <div style={{ display: "inline-flex", background: b.activityType === "안심의뢰" ? G.greenSoft : G.goldSoft, color: b.activityType === "안심의뢰" ? C.greenInk : C.goldInk, borderRadius: 10, padding: "3px 8px", fontSize: 11, fontWeight: 900, marginBottom: 7 }}>{b.activityType}</div>
              {b.listingTitle && <div style={{ background: G.goldSoft, borderRadius: 11, padding: "8px 10px", fontSize: 12, color: C.goldInk, fontWeight: 900, marginBottom: 8 }}>응답 매물: {b.listingTitle}</div>}
              <div style={{ fontSize: 13, color: C.mid, marginBottom: 4 }}>{b.note}</div>
              <div style={{ fontSize: 12, color: C.goldInk, fontWeight: 700, marginBottom: 10 }}>희망 예산: {b.budget}</div>
              {canDecide && (
                decision ? (
                  <div style={{ background: decision === "approved" ? G.greenSoft : "#F2F4F3", border: `1px solid ${decision === "approved" ? C.green : C.line}`, color: decision === "approved" ? C.greenInk : C.gray, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 900, textAlign: "center", marginBottom: 8 }}>{decision === "approved" ? "연락처 공개 승인됨" : "연락처 공개 거절됨"}</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                    <button onClick={e => { e.stopPropagation(); decide(b, decisionKey, "approved"); }} style={{ border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>승인</button>
                    <button onClick={e => { e.stopPropagation(); decide(b, decisionKey, "rejected"); }} style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.gray, borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>거절</button>
                  </div>
                )
              )}
              <button onClick={e => { e.stopPropagation(); markProposalViewed(b); }} style={{ width: "100%", padding: "11px 0", background: G.gold, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>직거래 채팅하기 (중개수수료 0)</button>
            </div>
          );
        })}
      </div>
    </div>
  );
  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}

export function BrokerOfficeCard({ broker, actionLabel = "제안 확인하기", onClick, decision = null, onApprove, onReject, compact = false }) {
  const modeLabel = { chat: "채팅 가능", call: "전화 위주", sms: "문자 위주", none: "응답 안 함" }[broker.responseMode] || "상담 방식 미정";
  const canDecide = !!(onApprove && onReject);
  return (
    <div style={{ background: G.card, borderRadius: 18, padding: compact ? 14 : 16, marginBottom: 10, boxShadow: SH2, border: `1px solid ${C.greenSoft}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: C.greenInk, fontWeight: 800, marginBottom: 3 }}>{broker.tier || "검증 부동산"}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>{broker.office || broker.officeName}</div>
          <div style={{ fontSize: 12, color: C.gray }}>{broker.name || broker.agentName} 공인중개사 · {modeLabel}</div>
        </div>
        {!compact && <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.goldInk }}>{broker.region} 상위 {broker.percentileInRegion}%</div>
          <div style={{ fontSize: 11, color: C.gray }}>계약 {broker.deals || broker.verifiedDeals12m}건 · 리뷰 {broker.reviewCount}개</div>
        </div>}
      </div>
      {!compact && <div style={{ background: G.greenSoft, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>"{broker.msg || broker.proposalMessage}"</div>}
      {broker.activityType && <div style={{ display: "inline-flex", background: broker.activityType === "빠른의뢰" ? G.goldSoft : G.greenSoft, color: broker.activityType === "빠른의뢰" ? C.goldInk : C.greenInk, borderRadius: 10, padding: "3px 8px", fontSize: 11, fontWeight: 900, marginBottom: 8 }}>{broker.activityType}</div>}
      {broker.listingTitle && <div style={{ background: G.goldSoft, borderRadius: 11, padding: "8px 10px", fontSize: 12, color: C.goldInk, fontWeight: 900, marginBottom: 10 }}>응답 매물: {broker.listingTitle}</div>}
      {canDecide && (
        decision ? (
          <div style={{ background: decision === "approved" ? G.greenSoft : "#F2F4F3", border: `1px solid ${decision === "approved" ? C.green : C.line}`, color: decision === "approved" ? C.greenInk : C.gray, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 900, textAlign: "center", marginBottom: 8 }}>{decision === "approved" ? "연락처 공개 승인됨" : "연락처 공개 거절됨"}</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <button onClick={e => { e.stopPropagation(); onApprove(); }} style={{ border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>승인</button>
            <button onClick={e => { e.stopPropagation(); onReject(); }} style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.gray, borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>거절</button>
          </div>
        )
      )}
      <button onClick={onClick} style={{ width: "100%", padding: "11px 0", background: G.header, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{actionLabel}</button>
    </div>
  );
}

export function StatCard({ value, label, tone = "green", onClick }) {
  const ink = { green: C.greenInk, gold: C.goldInk, dark: C.dark }[tone];
  const clickable = !!onClick;
  return (
    <div onClick={onClick} style={{ background: G.card, borderRadius: 16, padding: "14px 10px", textAlign: "center", boxShadow: SH2, cursor: clickable ? "pointer" : "default", border: clickable ? `1.5px solid ${tone==="gold"?C.goldSoft:C.greenSoft}` : "none" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: ink }}>{value}</div>
      <div style={{ fontSize: 11, color: clickable ? ink : C.gray, marginTop: 2, fontWeight: clickable ? 600 : 400 }}>{label}{clickable ? " ›" : ""}</div>
    </div>
  );
}
