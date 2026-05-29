import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import * as Old from "./common_old";
export * from "./common_old";
import { C, G, SH2 } from "../theme";
import { INTEREST_BROKERS, DIRECT_BUYERS } from "../data/data";
import { CACHE_KEYS, loadCache, saveCache, syncCache } from "../data/cache";

export const proposalDecisionKey = item => item?.requestId || item?.chatId || null;
export const proposalViewKey = item => item?.requestId || item?.chatId || item?.id || item?.office || item?.name || "";

const normalizeProposalItem = item => ({
  ...item,
  ownerKey: item.ownerKey || item.owner_key || null,
  activityType: item.activityType || item.activity_type || (item.fast ? "빠른의뢰" : "안심의뢰"),
  proposalNew: item.proposalNew ?? item.proposal_new ?? true,
  requestId: item.requestId || item.request_id || null,
  chatId: item.chatId || item.chat_id || null,
  listingTitle: item.listingTitle || item.listing_title || item.title || "",
});

export function getOwnerProposalItems(viewerKey, kind) {
  const isBroker = kind === "broker";
  if (viewerKey === "toad-demo-owner-2") {
    if (isBroker) {
      return INTEREST_BROKERS.slice(1, 3).map((broker, index) => normalizeProposalItem({
        ...broker,
        name: index === 0 ? "서민재 공인중개사" : "오하린 공인중개사",
        office: index === 0 ? "대치 센트럴공인중개사" : "강남 로열부동산",
        region: "강남구",
        ownerKey: viewerKey,
        listingTitle: "강남구 대치동 은마아파트 · 76㎡",
        proposalNew: index === 0,
        chatId: index === 0 ? "demo-test-chat" : null,
      }));
    }
    return DIRECT_BUYERS.slice(0, 1).map(buyer => normalizeProposalItem({
      ...buyer,
      name: "실거주 매수자 C",
      note: "학군 실거주 목적, 잔금 일정 빠르게 협의 가능",
      when: "35분 전",
      budget: "18억까지",
      ownerKey: viewerKey,
      proposalNew: true,
      requestId: "direct-safe-owner-b",
      chatId: "demo-test-chat",
      listingTitle: "강남구 대치동 은마아파트 · 76㎡",
    }));
  }
  if (viewerKey === "toad-demo-owner") {
    return (isBroker ? INTEREST_BROKERS : DIRECT_BUYERS).map(item => normalizeProposalItem({ ...item, ownerKey: viewerKey }));
  }
  return [];
}

export const canDecideBrokerProposal = item => (item?.activityType || item?.activity_type) === "안심의뢰" && !!proposalDecisionKey(item);
export const canDecideDirectProposal = item => (item?.activityType || item?.activity_type) === "안심의뢰" && !!proposalDecisionKey(item);

export function proposalIsNew(item, decisions = {}, views = {}) {
  const normalized = normalizeProposalItem(item);
  const decisionKey = proposalDecisionKey(normalized);
  const viewKey = proposalViewKey(normalized);
  if (decisionKey && decisions?.[decisionKey]) return false;
  if (viewKey && views?.[viewKey]) return false;
  return normalized.proposalNew !== false;
}

export function getNewProposalItems(items, decisions = {}, views = {}) {
  return (Array.isArray(items) ? items : []).map(normalizeProposalItem).filter(item => proposalIsNew(item, decisions, views));
}

export function getOwnerProposalCounts({ brokerItems = [], directItems = [], decisions = {}, views = {} } = {}) {
  return {
    brokers: brokerItems.length,
    direct: directItems.length,
    newBrokers: getNewProposalItems(brokerItems, decisions, views).length,
    newDirect: getNewProposalItems(directItems, decisions, views).length,
  };
}

export function ListSheet({ kind, onlyNew = false, viewerKey = "toad-demo-owner", itemsOverride = null, onClose, onProposalStateChange }) {
  const isBroker = kind === "broker";
  const [showAll, setShowAll] = useState(false);
  const [localDecisions, setLocalDecisions] = useState(() => loadCache(CACHE_KEYS.contactDecisions, {}));
  const [proposalViews, setProposalViews] = useState(() => loadCache(CACHE_KEYS.proposalViews, {}));
  const decisions = localDecisions && typeof localDecisions === "object" && !Array.isArray(localDecisions) ? localDecisions : {};
  const views = proposalViews && typeof proposalViews === "object" && !Array.isArray(proposalViews) ? proposalViews : {};

  useEffect(() => {
    let alive = true;
    Promise.all([
      syncCache(CACHE_KEYS.contactDecisions, {}),
      syncCache(CACHE_KEYS.proposalViews, {}),
    ]).then(([nextDecisions, nextViews]) => {
      if (!alive) return;
      if (nextDecisions && typeof nextDecisions === "object" && !Array.isArray(nextDecisions)) setLocalDecisions(nextDecisions);
      if (nextViews && typeof nextViews === "object" && !Array.isArray(nextViews)) setProposalViews(nextViews);
    });
    return () => { alive = false; };
  }, []);

  const emitState = (nextDecisions = decisions, nextViews = views) => onProposalStateChange?.({ decisions: nextDecisions, views: nextViews });
  const markViewed = item => {
    const key = proposalViewKey(item);
    if (!key) return;
    setProposalViews(current => {
      const base = current && typeof current === "object" && !Array.isArray(current) ? current : {};
      const next = { ...base, [key]: true };
      saveCache(CACHE_KEYS.proposalViews, next);
      emitState(decisions, next);
      return next;
    });
  };
  const decide = (item, value) => {
    const key = proposalDecisionKey(item);
    if (!key) return;
    setLocalDecisions(current => {
      const base = current && typeof current === "object" && !Array.isArray(current) ? current : {};
      const next = { ...base, [key]: value };
      saveCache(CACHE_KEYS.contactDecisions, next);
      emitState(next, views);
      return next;
    });
    markViewed(item);
  };

  const allItems = (Array.isArray(itemsOverride) ? itemsOverride : getOwnerProposalItems(viewerKey, kind)).map(normalizeProposalItem);
  const visibleItems = onlyNew && !showAll ? getNewProposalItems(allItems, decisions, views) : allItems;
  const title = isBroker
    ? (onlyNew && !showAll ? `새롭게 제안한 부동산 ${visibleItems.length}곳` : `의뢰받은 부동산 ${visibleItems.length}곳`)
    : (onlyNew && !showAll ? `새롭게 제안한 직거래 매수자 ${visibleItems.length}명` : `직거래 매수자 ${visibleItems.length}명`);
  const showAllLabel = isBroker ? "모든 부동산 리스트보기" : "모든 직거래 매수자 리스트보기";
  const emptyText = onlyNew && !showAll ? "새 제안이 없어요" : "표시할 항목이 없어요";

  const sheet = (
    <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }} onClick={onClose} onWheel={e => e.stopPropagation()}>
      <div onClick={e => e.stopPropagation()} style={{ background: G.pageBg, borderRadius: "26px 26px 0 0", width: "100%", maxHeight: "78%", overflowY: "auto", padding: "20px 18px 28px", boxSizing: "border-box", animation: "sheetUp .3s" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Old.Frog mood={isBroker ? "excited" : "love"} size={48}/>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{title}</div><div style={{ fontSize: 12, color: C.gray }}>{isBroker ? "아직 확인하지 않은 부동산 제안 기준" : "아직 확인하지 않은 직거래 제안 기준"}</div></div>
        </div>
        {onlyNew && !showAll && <button onClick={() => setShowAll(true)} style={{ width: "100%", border: `1.5px solid ${C.green}`, background: "#fff", color: C.greenInk, borderRadius: 14, padding: "10px 0", marginBottom: 12, fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>{showAllLabel}</button>}
        {visibleItems.length === 0 && <div style={{ background: G.card, borderRadius: 16, padding: 18, color: C.gray, fontSize: 13, textAlign: "center", boxShadow: SH2 }}>{emptyText}</div>}
        {isBroker ? visibleItems.map((item, i) => {
          const canDecide = canDecideBrokerProposal(item);
          const decision = canDecide ? decisions[proposalDecisionKey(item)] : null;
          return <Old.BrokerOfficeCard key={item.id || item.chatId || i} broker={item} compact actionLabel="상세보기" decision={decision} onClick={() => markViewed(item)} onApprove={canDecide ? () => decide(item, "approved") : null} onReject={canDecide ? () => decide(item, "rejected") : null}/>;
        }) : visibleItems.map((item, i) => {
          const canDecide = canDecideDirectProposal(item);
          const decision = canDecide ? decisions[proposalDecisionKey(item)] : null;
          return (
            <div key={item.id || item.requestId || i} style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: SH2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{item.name}</div><div style={{ fontSize: 11, color: C.gray }}>{item.when}</div></div>
              <div style={{ display: "inline-flex", background: item.activityType === "안심의뢰" ? G.greenSoft : G.goldSoft, color: item.activityType === "안심의뢰" ? C.greenInk : C.goldInk, borderRadius: 10, padding: "3px 8px", fontSize: 11, fontWeight: 900, marginBottom: 7 }}>{item.activityType}</div>
              {item.listingTitle && <div style={{ background: G.goldSoft, borderRadius: 11, padding: "8px 10px", fontSize: 12, color: C.goldInk, fontWeight: 900, marginBottom: 8 }}>응답 매물: {item.listingTitle}</div>}
              <div style={{ fontSize: 13, color: C.mid, marginBottom: 4 }}>{item.note}</div>
              <div style={{ fontSize: 12, color: C.goldInk, fontWeight: 700, marginBottom: 10 }}>희망 예산: {item.budget}</div>
              {canDecide && (decision ? <div style={{ background: decision === "approved" ? G.greenSoft : "#F2F4F3", border: `1px solid ${decision === "approved" ? C.green : C.line}`, color: decision === "approved" ? C.greenInk : C.gray, borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 900, textAlign: "center", marginBottom: 8 }}>{decision === "approved" ? "연락처 공개 승인됨" : "연락처 공개 거절됨"}</div> : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}><button onClick={e => { e.stopPropagation(); decide(item, "approved"); }} style={{ border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>승인</button><button onClick={e => { e.stopPropagation(); decide(item, "rejected"); }} style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.gray, borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>거절</button></div>)}
              <button onClick={() => markViewed(item)} style={{ width: "100%", padding: "11px 0", background: G.gold, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>직거래 채팅하기</button>
            </div>
          );
        })}
      </div>
    </div>
  );
  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}