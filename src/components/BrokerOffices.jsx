import { useState } from "react";
import { useEffect } from "react";
import { C, G, SH1, SH2 } from "../theme";
import { BROKER_OFFICES, REGIONS, PROPOSAL_CHAT_IDS } from "../data/data";
import { CACHE_KEYS, loadCache, saveCache, syncCache } from "../data/cache";
import { BrokerOfficeCard, SelectBox, Frog, RoleToggle, Tag } from "./common";

const responseModeLabel = {
  chat: "채팅 가능",
  call: "전화 상담 위주",
  sms: "문자 상담 위주",
  none: "응답 안 함",
};

function OfficeDetail({ office, contracted, onContract, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: "min(393px, 100vw)", height: "min(852px, 100vh)", background: "#2A3A3255", zIndex: 999, display: "flex", alignItems: "flex-end", borderRadius: 50, overflow: "hidden", animation: "fadeIn .2s" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxHeight: "84%", overflowY: "auto", background: G.pageBg, borderRadius: "26px 26px 0 0", padding: "20px 18px 72px", boxSizing: "border-box", animation: "sheetUp .3s" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Frog mood="smug" size={62}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
              <Tag>{office.tier}</Tag>
              {contracted && <Tag tone="gold">계약 체결됨</Tag>}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: C.dark }}>{office.officeName}</div>
            <div style={{ fontSize: 12, color: C.gray }}>{office.agentName} 공인중개사 · {responseModeLabel[office.responseMode]}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            ["지역 순위", `${office.region} 상위 ${office.percentileInRegion}%`],
            ["최근 계약", `${office.verifiedDeals12m}건`],
            ["리뷰", `${office.reviewCount}개`],
            ["최근 활동", office.lastActive],
          ].map(([label, value]) => (
            <div key={label} style={{ background: G.card, borderRadius: 14, padding: "12px 10px", boxShadow: SH2 }}>
              <div style={{ fontSize: 11, color: C.gray }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: SH1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 8 }}>부동산 정보</div>
          <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.8 }}>
            등록번호 {office.licenseNo}<br/>
            {office.address}<br/>
            {office.phone}<br/>
            영업시간 {office.businessHours}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {office.specialtyRegions.map(r => <Tag key={r}>{r}</Tag>)}
            {office.specialtyTypes.map(t => <Tag key={t} tone="gold">{t}</Tag>)}
          </div>
        </div>
        <div style={{ background: G.greenSoft, borderRadius: 18, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.greenInk, marginBottom: 8 }}>제안 메시지</div>
          <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>"{office.proposalMessage}"</div>
        </div>
        <div style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 12, boxShadow: SH1 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.dark, marginBottom: 10 }}>리뷰</div>
          {office.reviews.map(r => (
            <div key={r.id} style={{ borderTop: `1px solid ${C.line}`, paddingTop: 10, marginTop: 10 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                {r.tags.map(t => <Tag key={t}>{t}</Tag>)}
              </div>
              <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>{r.text}</div>
              <div style={{ fontSize: 11, color: C.gray, marginTop: 5 }}>{r.createdAt}</div>
            </div>
          ))}
        </div>
        <button onClick={() => onContract(office.id)} disabled={contracted} style={{ width: "100%", padding: "14px 0", background: contracted ? "#D5DDD7" : G.header, border: "none", borderRadius: 15, color: "#fff", fontSize: 14, fontWeight: 900, cursor: contracted ? "default" : "pointer", fontFamily: "inherit", marginBottom: 8 }}>{contracted ? "계약 체결됨" : "이 부동산과 계약 체결"}</button>
        <button style={{ width: "100%", padding: "13px 0", background: "#fff", border: `1.5px solid ${C.green}`, borderRadius: 15, color: C.greenInk, fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>채팅하기</button>
      </div>
    </div>
  );
}

export function BrokerOffices({ role = "owner", availableRoles, preferredRegion = "전체", interestRegion = "전체", onSwitchRole }) {
  const [localDecisions, setLocalDecisions] = useState(() => loadCache(CACHE_KEYS.contactDecisions, {}));
  const decisions = localDecisions && typeof localDecisions === "object" && !Array.isArray(localDecisions) ? localDecisions : {};
  useEffect(() => {
    let alive = true;
    syncCache(CACHE_KEYS.contactDecisions, {}).then(next => {
      if (alive && next && typeof next === "object" && !Array.isArray(next)) setLocalDecisions(next);
    });
    return () => { alive = false; };
  }, []);
  const decide = (key, value) => {
    if (!key) return;
    setLocalDecisions(d => {
      const next = { ...(d && typeof d === "object" && !Array.isArray(d) ? d : {}), [key]: value };
      saveCache(CACHE_KEYS.contactDecisions, next);
      return next;
    });
  };
  const [sido, setSido] = useState("서울특별시");
  const initialRegions = Array.from(new Set([preferredRegion, interestRegion].filter(r => r && r !== "전체")));
  const [regionGroup, setRegionGroup] = useState(initialRegions);
  const [region, setRegion] = useState("전체");
  const [dong, setDong] = useState("전체");
  const [selected, setSelected] = useState(null);
  const [contractedId, setContractedId] = useState(null);
  const officeDong = o => (o.address.split(" ")[2] || "").trim();
  const matchesRegion = o => region === "전체" ? (!regionGroup.length || o.specialtyRegions.some(r => regionGroup.includes(r))) : o.specialtyRegions.includes(region);
  const tierScore = o => {
    const tier = o.tier || "";
    return (tier.includes("대표") ? 4 : tier.includes("파워") ? 3 : tier.includes("우수") ? 2 : 1) * 1000 + (100 - (o.percentileInRegion || 100));
  };
  const dongOptions = ["전체", ...Array.from(new Set(BROKER_OFFICES.filter(matchesRegion).map(officeDong))).sort()];
  const changeRegion = v => { setRegion(v); setRegionGroup([]); setDong("전체"); };
  const list = BROKER_OFFICES.filter(o =>
    matchesRegion(o) &&
    (dong === "전체" || officeDong(o) === dong)
  ).sort((a, b) => tierScore(b) - tierScore(a));
  const selectedOffice = BROKER_OFFICES.find(o => o.id === selected);

  return (
    <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%", position: "relative" }}>
      {selectedOffice && (
        <OfficeDetail
          office={selectedOffice}
          contracted={contractedId === selectedOffice.id}
          onContract={setContractedId}
          onClose={() => setSelected(null)}
        />
      )}
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#ffffffcc", fontSize: 13 }}>소유주</div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>부동산 찾기</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="excited" size={62}/>
          </div>
        </div>
        <div style={{ marginTop: 14, background: "#ffffff26", border: "1px solid #ffffff33", borderRadius: 16, padding: "12px 14px", color: "#fff", fontSize: 13, lineHeight: 1.6 }}>
          기본지역과 관심지역을 먼저 보여줘요. 지역 내 계약 성과 기준으로 티어를 표시해요.
        </div>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ background: G.card, borderRadius: 18, padding: 14, marginBottom: 14, boxShadow: SH2 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <SelectBox label="광역시/도" value={sido} options={["서울특별시"]} onChange={setSido}/>
            <SelectBox label="시/군/구" value={region} options={REGIONS} onChange={changeRegion}/>
            <SelectBox label="읍/면/동" value={dong} options={dongOptions} onChange={setDong}/>
          </div>
        </div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 10 }}>총 {list.length}곳{regionGroup.length > 0 && ` · ${regionGroup.join("·")}`}</div>
        {list.map(o => {
          const chatId = PROPOSAL_CHAT_IDS[o.id];
          return (
            <BrokerOfficeCard
              key={o.id}
              broker={o}
              actionLabel="상세 보기"
              onClick={() => setSelected(o.id)}
              decision={chatId ? decisions[chatId] : null}
              onApprove={chatId ? () => decide(chatId, "approved") : null}
              onReject={chatId ? () => decide(chatId, "rejected") : null}
            />
          );
        })}
        <div style={{ height: 64 }}/>
      </div>
    </div>
  );
}
