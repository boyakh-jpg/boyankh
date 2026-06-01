import { useState } from "react";
import { C, G, SH1 } from "../theme";
import { useEffect } from "react";
import { Frog, RoleToggle, StatCard, ListSheet, BrokerOfficeCard, FeeEstimate, PriceTrend, PriceHistoryPanel, DoneBadge, Tag, getNewProposalItems, getOwnerProposalItems } from "./common";
import { OfficeDetail } from "./BrokerOffices";
import { estFee, isDone, isExpiringSoon, isNewListing, priceChangeRate, termLabel } from "../utils/helpers";
import { getDemoUser } from "../data/demoUsers";
import { CACHE_KEYS, loadCache, saveCache, syncCache } from "../data/cache";

function Header({ role, availableRoles, title, subtitle, mood, onSwitchRole, actionLabel, onAction }) {
  return (
    <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>{title}</div>
          <div style={{ color: "#ffffffcc", fontSize: 13, fontWeight: 800, marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <RoleToggle role={role} roles={availableRoles} onClick={onSwitchRole}/>
          <Frog mood={mood} size={62}/>
        </div>
      </div>
      <div style={{ background: "#ffffff26", borderRadius: 18, padding: "16px 18px", border: "1px solid #ffffff33", backdropFilter: "blur(4px)" }}>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{actionLabel}</div>
        <div style={{ color: "#ffffffd0", fontSize: 13, marginBottom: 14 }}>관심지역 기준으로 바로 확인해요</div>
        <button onClick={onAction} style={{ width: "100%", padding: "13px 0", background: G.gold, border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 16px rgba(242,192,120,.4)" }}>{actionLabel}</button>
      </div>
    </div>
  );
}

function BrokerPlanIntro({ tier, bonus, onClick }) {
  return (
    <div style={{ background: G.greenSoft, borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: SH1, display: "flex", alignItems: "center", gap: 12 }}>
      <Frog mood="determined" size={44}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: C.greenInk }}>중개사 구독</div>
        <div style={{ fontSize: 12, color: C.mid, marginTop: 3, lineHeight: 1.5 }}>{tier} 등급 · 충전 보너스 +{bonus}% · 알림 우선권 관리</div>
      </div>
      <button onClick={onClick} style={{ border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "9px 12px", fontSize: 12, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>관리</button>
    </div>
  );
}

function SectionTitle({ title, actionLabel, actionColor = C.greenInk, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "18px 0 10px" }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: C.dark }}>{title}</div>
      {onAction && <button onClick={onAction} style={{ background: "none", border: "none", color: actionColor, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{actionLabel}</button>}
    </div>
  );
}

function TaskList({ items, cacheKey = "toad.todayTasks" }) {
  const [checked, setChecked] = useState(() => loadCache(cacheKey, {}));
  useEffect(() => {
    let alive = true;
    syncCache(cacheKey, {}).then(next => {
      if (alive && next && typeof next === "object" && !Array.isArray(next)) setChecked(next);
    });
    return () => { alive = false; };
  }, [cacheKey]);
  const markDone = title => {
    setChecked(current => {
      const next = { ...(current && typeof current === "object" && !Array.isArray(current) ? current : {}), [title]: true };
      saveCache(cacheKey, next);
      return next;
    });
  };
  return (
    <div style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: SH1 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: C.dark, marginBottom: 12 }}>오늘 확인할 일</div>
      {items.map(([title, sub, action]) => {
        const done = !!checked[title];
        return (
        <button key={title} onClick={() => { markDone(title); action && action(); }} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: done ? G.greenSoft : "#fff", border: `1.5px solid ${done ? C.green : C.line}`, borderRadius: 14, padding: "12px 13px", marginBottom: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
          <span style={{ display: "flex", gap: 9, alignItems: "center", minWidth: 0 }}>
            {done && <span style={{ width: 20, height: 20, borderRadius: 10, background: G.header, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, flexShrink: 0 }}>✓</span>}
            <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: C.dark }}>{title}</span>
            <span style={{ display: "block", fontSize: 12, color: C.gray, marginTop: 2 }}>{sub}</span>
            </span>
          </span>
          <span style={{ color: C.greenInk, fontWeight: 900 }}>›</span>
        </button>
        );
      })}
    </div>
  );
}

const localDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function ListingCard({ listing, tone = "green", onClick, showFee = false }) {
  return (
    <div onClick={onClick} style={{ background: G.card, borderRadius: 20, padding: 16, marginBottom: 10, boxShadow: SH1, cursor: "pointer" }}>
      <div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{listing.region} {listing.dong} · {listing.propType} {listing.dealType}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 6 }}>{listing.complex}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginBottom: 10 }}>{listing.price}</div>
      {!isDone(listing) && <div style={{ display: "inline-flex", marginBottom: 8, background: isExpiringSoon(listing) ? G.goldSoft : G.greenSoft, color: isExpiringSoon(listing) ? C.goldInk : C.greenInk, borderRadius: 8, padding: "3px 7px", fontSize: 10, fontWeight: 800 }}>의뢰기한 {termLabel(listing)}</div>}
      {showFee && <FeeEstimate listing={listing} tone={tone}/>}
    </div>
  );
}

function HomeDetailSheet({ listing, tone = "green", onClose }) {
  const done = isDone(listing);
  return (
    <div onClick={onClose} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "86%", overflowY: "auto", background: G.pageBg, borderRadius: "26px 26px 0 0", padding: "20px 18px 96px", boxSizing: "border-box", animation: "sheetUp .3s" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
              {done ? <DoneBadge label={listing.doneLabel}/> : <Tag tone={listing.fast ? "gold" : "green"}>{listing.fast ? "빠른의뢰" : "안심의뢰"}</Tag>}
              {listing.badge && !done && <Tag tone={listing.badge === "NEW" ? "green" : "gold"}>{listing.badge}</Tag>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{listing.region} {listing.dong} {listing.complex}</div>
            <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{listing.propType} {listing.dealType} · {listing.area}㎡ · {listing.floor}층</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 15, border: `1px solid ${C.line}`, background: "#fff", color: C.gray, fontSize: 18, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}><span style={{ transform: "translateY(-1px)" }}>×</span></button>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginBottom: 12 }}>{listing.price}</div>
        <PriceTrend listing={listing} tone={tone}/>
        <PriceHistoryPanel listing={listing} tone={tone}/>
        <FeeEstimate listing={listing} tone={tone}/>
        <div style={{ background: G.card, borderRadius: 18, padding: 16, boxShadow: SH1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 10 }}>매물 정보</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              ["지역", `${listing.region} ${listing.dong}`],
              ["공급/전용", `${listing.supplyArea ? `${listing.supplyArea}㎡` : "미입력"} / ${(listing.exclusiveArea || listing.area) ? `${listing.exclusiveArea || listing.area}㎡` : "미입력"}`],
              ["층수", `${listing.floor || "미입력"}${listing.totalFloor ? `/${listing.totalFloor}` : ""}층`],
              ["열람", `${listing.views}회`],
              ["수수료 상한", listing.fee],
              ["의뢰기한", done ? "거래 완료" : termLabel(listing)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: tone === "gold" ? G.goldSoft : G.greenSoft, borderRadius: 12, padding: "9px 10px" }}>
                <div style={{ fontSize: 10, color: C.gray, fontWeight: 800 }}>{label}</div>
                <div style={{ fontSize: 12, color: C.dark, fontWeight: 800, marginTop: 2, lineHeight: 1.4 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Home({ onRegister, onMyList, onOffices, onBrokerList, onBuyerList, onSubscription, onApproveProposal, role, availableRoles, onSwitchRole, brokerTier = "골드", preferredRegion = "강남구", interestRegion = "마포구", properties = [], demoUser = getDemoUser(), brokerOffices = [], brokerProposals = null, directBuyerProposals = null }) {
  const [sheet, setSheet] = useState(null);
  const [detail, setDetail] = useState(null);
  const [officeDetail, setOfficeDetail] = useState(null);
  const [contractedOfficeId, setContractedOfficeId] = useState(null);
  const [proposalDecisions, setProposalDecisions] = useState(() => loadCache(CACHE_KEYS.contactDecisions, {}));
  const [proposalViews, setProposalViews] = useState(() => loadCache(CACHE_KEYS.proposalViews, {}));
  useEffect(() => {
    let alive = true;
    Promise.all([
      syncCache(CACHE_KEYS.contactDecisions, {}),
      syncCache(CACHE_KEYS.proposalViews, {}),
    ]).then(([nextDecisions, nextViews]) => {
      if (!alive) return;
      if (nextDecisions && typeof nextDecisions === "object" && !Array.isArray(nextDecisions)) setProposalDecisions(nextDecisions);
      if (nextViews && typeof nextViews === "object" && !Array.isArray(nextViews)) setProposalViews(nextViews);
    });
    return () => { alive = false; };
  }, [demoUser.id]);
  const updateProposalState = next => {
    if (next?.decisions) setProposalDecisions(next.decisions);
    if (next?.views) setProposalViews(next.views);
  };
  const todayTaskKey = `toad.${demoUser.id}.${role}.todayTasks.${localDateKey()}`;
  const targetRegions = Array.from(new Set([preferredRegion, interestRegion].filter(Boolean)));
  const officeTierScore = office => {
    const tier = office.tier || "";
    const tierPoint = tier.includes("대표") ? 4 : tier.includes("파워") ? 3 : tier.includes("우수") ? 2 : 1;
    const regionBoost = (office.specialtyRegions || []).includes(preferredRegion) ? 20 : (office.specialtyRegions || []).includes(interestRegion) ? 10 : 0;
    return tierPoint * 1000 + (100 - (office.percentileInRegion || 100)) + regionBoost;
  };
  const activeListings = properties.filter(p => !isDone(p));
  const localListings = activeListings.filter(p => targetRegions.includes(p.region));
  const recommendedListings = localListings.length ? localListings : activeListings;
  const localPreset = preferredRegion ? { region: preferredRegion } : {};
  const baseLabel = preferredRegion || "전체 지역";
  const baseListings = preferredRegion ? activeListings.filter(p => p.region === preferredRegion) : activeListings;
  const interestListings = interestRegion ? activeListings.filter(p => p.region === interestRegion) : [];
  const newCount = recommendedListings.filter(isNewListing).length;
  const expiringCount = recommendedListings.filter(isExpiringSoon).length;
  const priceDownCount = recommendedListings.filter(p => priceChangeRate(p) < -0.1).length;
  const brokerBonus = { 무료: 0, 실버: 5, 골드: 10 }[brokerTier] || 0;
  const ownerListings = properties.filter(p => p.mine);
  const ownerProposalItemsFor = (items, kind) => {
    const fallback = getOwnerProposalItems(demoUser.id, kind);
    const source = Array.isArray(items) ? items : fallback;
    return source.filter(item => !item.ownerKey || item.ownerKey === demoUser.id);
  };
  const ownerBrokerProposalItems = ownerProposalItemsFor(brokerProposals, "broker");
  const ownerDirectProposalItems = ownerProposalItemsFor(directBuyerProposals, "direct");
  const ownerProposalCounts = {
    brokers: ownerBrokerProposalItems.length,
    direct: ownerDirectProposalItems.length,
    newBrokers: getNewProposalItems(ownerBrokerProposalItems, proposalDecisions, proposalViews).length,
    newDirect: getNewProposalItems(ownerDirectProposalItems, proposalDecisions, proposalViews).length,
  };
  const ownerFallbackSummary = [];
  const ownerSummary = (ownerListings.length ? ownerListings : ownerFallbackSummary).slice(0, 2);
  const ownerActiveCount = ownerListings.filter(p => !isDone(p)).length;
  const ownerExpiringCount = ownerListings.filter(p => !isDone(p) && isExpiringSoon(p)).length;
  const officeSource = brokerOffices;
  const localOffices = officeSource.filter(b => b.specialtyRegions?.some(r => targetRegions.includes(r)));
  const topLocalOffices = localOffices.filter(b => (b.percentileInRegion || 100) <= 30);
  const officePool = topLocalOffices.length ? topLocalOffices : (localOffices.length ? localOffices : officeSource);
  const ownerOffices = [...officePool].sort((a, b) => officeTierScore(b) - officeTierScore(a));
  const brokerScore = p => estFee(p) / 10000 + (p.views || 0) * 10;
  const buyerScore = p => Math.max(0, -priceChangeRate(p)) * 100 + (p.views || 0) * 5;
  const hasInterestSection = interestRegion && interestRegion !== preferredRegion;
  const listingsByRegion = region => {
    const pool = region ? activeListings.filter(p => p.region === region) : activeListings;
    return pool.length ? pool : [];
  };
  const rankedListings = (region, scoreFn) => [...listingsByRegion(region)].sort((a, b) => scoreFn(b) - scoreFn(a)).slice(0, 2);
  const brokerBaseSummary = rankedListings(preferredRegion, brokerScore);
  const brokerInterestSummary = hasInterestSection ? rankedListings(interestRegion, brokerScore) : [];
  const buyerBaseSummary = rankedListings(preferredRegion, buyerScore);
  const buyerInterestSummary = hasInterestSection ? rankedListings(interestRegion, buyerScore) : [];
  const officesByRegion = region => officeSource.filter(b => b.specialtyRegions?.includes(region)).sort((a, b) => officeTierScore(b) - officeTierScore(a)).slice(0, 2);
  const baseOffices = officesByRegion(preferredRegion);
  const interestOffices = hasInterestSection ? officesByRegion(interestRegion) : [];

  if (role === "broker") {
    return (
      <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%", position: "relative" }}>
        {detail && <HomeDetailSheet listing={detail.listing} tone={detail.tone} onClose={() => setDetail(null)}/>}
        <Header role={role} availableRoles={availableRoles} title="공인중개사 홈" subtitle="중개 매물이 있어요" mood="smug" onSwitchRole={onSwitchRole} actionLabel="매물 보기" onAction={() => onBrokerList(localPreset)}/>
        <div style={{ padding: "18px 16px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            <StatCard value={baseListings.length + "건"} label="기본지역 매물" tone="green" onClick={() => onBrokerList({ region: preferredRegion })}/>
            <StatCard value={interestListings.length + "건"} label="관심지역 매물" tone="green" onClick={() => onBrokerList({ region: interestRegion })}/>
            <StatCard value={newCount + "건"} label="3일 신규매물" tone="gold" onClick={() => onBrokerList({ ...localPreset, statusFilter: "3일 이내 신규" })}/>
          </div>
          <BrokerPlanIntro tier={brokerTier} bonus={brokerBonus} onClick={onSubscription}/>
          <TaskList cacheKey={todayTaskKey} items={[
            ["수수료 높은 매물", `${baseLabel} 예상 중개보수 상위 ${baseListings.length}건`, () => onBrokerList({ ...localPreset, sort: "수수료높은순" })],
            ["신규 의뢰", `${baseLabel} 최근 3일 신규 ${newCount}건`, () => onBrokerList({ ...localPreset, statusFilter: "3일 이내 신규" })],
            ["만료 임박", `${baseLabel} ${expiringCount}건은 빠르게 제안해야 해요`, () => onBrokerList({ ...localPreset, statusFilter: "만료 임박" })],
          ]}/>
          <SectionTitle title="기본지역 추천 매물" actionLabel="기본지역 매물로 이동" onAction={() => onBrokerList({ region: preferredRegion })}/>
          {brokerBaseSummary.map(l => <ListingCard key={l.id} listing={l} tone={l.fast ? "gold" : "green"} onClick={() => setDetail({ listing: l, tone: l.fast ? "gold" : "green" })} showFee/>)}
          {hasInterestSection && <>
            <SectionTitle title="관심지역 추천 매물" actionLabel="관심지역 매물로 이동" onAction={() => onBrokerList({ region: interestRegion })}/>
            {brokerInterestSummary.map(l => <ListingCard key={l.id} listing={l} tone={l.fast ? "gold" : "green"} onClick={() => setDetail({ listing: l, tone: l.fast ? "gold" : "green" })} showFee/>)}
          </>}
          <div style={{ height: 64 }}/>
        </div>
      </div>
    );
  }

  if (role === "buyer") {
    return (
      <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%", position: "relative" }}>
        {detail && <HomeDetailSheet listing={detail.listing} tone={detail.tone} onClose={() => setDetail(null)}/>}
        <Header role={role} availableRoles={availableRoles} title="직거래 홈" subtitle="쉽게 집을 찾아요" mood="cool" onSwitchRole={onSwitchRole} actionLabel="직거래 매물 보기" onAction={() => onBuyerList(localPreset)}/>
        <div style={{ padding: "18px 16px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            <StatCard value={baseListings.length + "건"} label="기본지역 매물" tone="gold" onClick={() => onBuyerList({ region: preferredRegion })}/>
            <StatCard value={interestListings.length + "건"} label="관심지역 매물" tone="gold" onClick={() => onBuyerList({ region: interestRegion })}/>
            <StatCard value={newCount + "건"} label="3일 신규매물" tone="green" onClick={() => onBuyerList({ ...localPreset, statusFilter: "3일 이내 신규" })}/>
          </div>
          <TaskList cacheKey={todayTaskKey} items={[
            ["신규 매물", `${baseLabel} 최근 3일 신규 ${newCount}건`, () => onBuyerList({ ...localPreset, statusFilter: "3일 이내 신규" })],
            ["가격 인하 매물", `${baseLabel} ${priceDownCount}건은 가격이 내려갔어요`, () => onBuyerList({ ...localPreset, sort: "추이 하락순" })],
            ["인기 매물", `${baseLabel} 열람 많은 매물 ${recommendedListings.length}건`, () => onBuyerList({ ...localPreset, sort: "인기순" })],
          ]}/>
          <SectionTitle title="기본지역 추천 매물" actionLabel="기본지역 매물로 이동" actionColor={C.goldInk} onAction={() => onBuyerList({ region: preferredRegion })}/>
          {buyerBaseSummary.map(l => <ListingCard key={l.id} listing={l} tone="gold" onClick={() => setDetail({ listing: l, tone: "gold" })}/>)}
          {hasInterestSection && <>
            <SectionTitle title="관심지역 추천 매물" actionLabel="관심지역 매물로 이동" actionColor={C.goldInk} onAction={() => onBuyerList({ region: interestRegion })}/>
            {buyerInterestSummary.map(l => <ListingCard key={l.id} listing={l} tone="gold" onClick={() => setDetail({ listing: l, tone: "gold" })}/>)}
          </>}
          <div style={{ height: 64 }}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%", position: "relative" }}>
      {sheet && <ListSheet kind={typeof sheet === "string" ? sheet : sheet.kind} onlyNew={typeof sheet === "object" && sheet.mode === "new"} viewerKey={demoUser.id} itemsOverride={(typeof sheet === "string" ? sheet : sheet.kind) === "broker" ? ownerBrokerProposalItems : ownerDirectProposalItems} onClose={() => setSheet(null)} onProposalStateChange={updateProposalState} onApproveProposal={onApproveProposal}/>}
      {officeDetail && <OfficeDetail office={officeDetail} contracted={contractedOfficeId === officeDetail.id} onContract={setContractedOfficeId} onClose={() => setOfficeDetail(null)}/>}
      <Header role={role} availableRoles={availableRoles} title="소유주 홈" subtitle="빠르게 집을 내놓아요" mood="calm" onSwitchRole={onSwitchRole} actionLabel="매물 의뢰하기" onAction={onRegister}/>
      <div style={{ padding: "18px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatCard value={ownerActiveCount + "건"} label="진행 의뢰" tone="green" onClick={() => onMyList()}/>
          <StatCard value={ownerProposalCounts.brokers + "곳"} label="의뢰받은 부동산" tone="green" onClick={() => setSheet("broker")}/>
          <StatCard value={ownerProposalCounts.direct + "명"} label="직거래 매수자" tone="gold" onClick={() => setSheet("direct")}/>
        </div>
        <TaskList cacheKey={todayTaskKey} items={[
          ["새롭게 제안한 부동산", `아직 확인하지 않은 제안 ${ownerProposalCounts.newBrokers}곳`, () => setSheet({ kind: "broker", mode: "new" })],
          ["새롭게 제안한 직거래 매수자", `아직 확인하지 않은 매수자 ${ownerProposalCounts.newDirect}명`, () => setSheet({ kind: "direct", mode: "new" })],
          ["내 매물 확인", `${ownerActiveCount}건 진행 중이에요`, () => onMyList()],
          ["만료 임박", `${ownerExpiringCount}건은 의뢰 기간 확인이 필요해요`, () => onMyList({ statusFilter: "만료 임박" })],
        ]}/>
        <SectionTitle title="기본지역 추천 부동산" actionLabel="기본지역 부동산으로 이동" onAction={onOffices}/>
        {(baseOffices.length ? baseOffices : ownerOffices.slice(0, 2)).map((b, i) => <BrokerOfficeCard key={i} broker={b} actionLabel="상세 보기" onClick={() => setOfficeDetail(b)}/>)}
        {hasInterestSection && <>
          <SectionTitle title="관심지역 추천 부동산" actionLabel="관심지역 부동산으로 이동" onAction={onOffices}/>
          {interestOffices.map((b, i) => <BrokerOfficeCard key={i} broker={b} actionLabel="상세 보기" onClick={() => setOfficeDetail(b)}/>)}
        </>}
        <SectionTitle title="내 매물" actionLabel="내 매물로 이동" onAction={() => onMyList()}/>
        {ownerSummary.map(l => <ListingCard key={l.id} listing={l} tone={l.fast ? "gold" : "green"} onClick={() => onMyList()}/>)}
        <div style={{ height: 64 }}/>
      </div>
    </div>
  );
}
