import { useState } from "react";
import { C, G, SH1, SH2 } from "../theme";
import { RoleToggle, Frog, Btn, Tag } from "./common";


export function Subscription({ picked: initialPicked = "골드", availableRoles, onPick, onSwitchRole }) {
  const [picked, setPicked] = useState(initialPicked);
  const chooseTier = name => {
    setPicked(name);
    onPick && onPick(name);
  };
  const tiers = [
    { name: "무료", price: "0원", color: C.gray, soft: "#F0F2F0", feats: ["기본 매물 조회 (일 10건)", "빠른의뢰 2,000P · 안심의뢰 1,000P", "포인트 충전 보너스 없음"], note: null },
    { name: "실버", price: "9,900원", color: C.green, soft: C.greenSoft, feats: ["매물 찾기 30분 먼저 받기", "빠른의뢰 1,900P · 안심의뢰 950P", "포인트 충전 보너스 +5%", "매달 5,000P 지급", "조회 무제한"], note: "포인트 비용은 소폭 할인, 핵심은 알림 우선권" },
    { name: "골드", price: "29,000원", color: C.gold, soft: C.goldSoft, feats: ["매물 찾기 즉시 알림", "매물 목록 상단 노출", "빠른의뢰 1,800P · 안심의뢰 900P", "포인트 충전 보너스 +10%", "매달 15,000P 지급", "인사말 A/B 테스트 · 거래 통계"], note: "포인트 할인보다 빠른 알림과 노출 강화 중심" },
  ];
  return (
    <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>공인중개사 멤버십</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>구독 등급</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role="broker" roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="smug" size={62}/>
          </div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: SH1 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.dark, marginBottom: 8 }}>부동산 프로필</div>
          <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, marginBottom: 12 }}>소유주에게 보이는 부동산 카드 정보예요. 가입 때 상세 입력이 필요해요.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["상호", "등록번호", "사무소 주소", "전문 지역", "전문 매물", "영업시간", "응답 방식", "최근 계약 사례"].map(x => <Tag key={x}>{x}</Tag>)}
          </div>
        </div>
        {tiers.map(t => {
          const sel = picked === t.name;
          return (
            <div key={t.name} onClick={() => chooseTier(t.name)} style={{ background: sel ? t.soft : G.card, borderRadius: 20, padding: 18, marginBottom: 12, border: `2px solid ${sel?t.color:C.line}`, cursor: "pointer", boxShadow: sel?"none":SH2, transition: "all .15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 7, background: t.color }}/>
                  <span style={{ fontSize: 17, fontWeight: 800, color: C.dark }}>{t.name}</span>
                  {t.name === "골드" && <Tag tone="gold">추천</Tag>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>{t.price}<span style={{ fontSize: 12, color: C.gray, fontWeight: 500 }}>{t.price!=="0원"?"/월":""}</span></div>
              </div>
              {t.feats.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ color: t.color, fontWeight: 900, fontSize: 13, lineHeight: 1.5 }}>✓</span>
                  <span style={{ fontSize: 13, color: C.mid, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
              {t.note && <div style={{ marginTop: 10, background: "#ffffffcc", borderRadius: 12, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: t.color }}>💡 {t.note}</div>}
            </div>
          );
        })}
        <Btn variant={picked==="골드"?"gold":"primary"} onClick={() => {}}>{picked} 등급 {picked==="무료"?"이용 중":"구독하기"}</Btn>
        <div style={{ textAlign: "center", fontSize: 11, color: C.gray, marginTop: 12, lineHeight: 1.6 }}>포인트 유효기간은 3년이에요 · 언제든 해지 가능</div>
      </div>
    </div>
  );
}
