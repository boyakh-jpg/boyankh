import { useEffect, useRef, useState } from "react";
import { C, G, SH1, SH2 } from "../theme";
import { RoleToggle, Frog, Btn, Tag } from "./common";

export function Subscription({ picked: initialPicked = "골드", availableRoles, onPick, onSwitchRole }) {
  const [picked, setPicked] = useState(initialPicked);
  const [step, setStep] = useState("plans");
  const [paidTier, setPaidTier] = useState(null);
  const topRef = useRef(null);
  const chooseTier = name => setPicked(name);
  const tiers = [
    { name: "무료", price: "0원", color: C.gray, soft: "#F0F2F0", feats: ["기본 매물 조회 (일 10건)", "빠른의뢰 2,000P · 안심의뢰 1,000P", "포인트 충전 보너스 없음"], note: null },
    { name: "실버", price: "9,900원", color: C.green, soft: C.greenSoft, feats: ["매물 찾기 30분 먼저 받기", "빠른의뢰 1,900P · 안심의뢰 950P", "포인트 충전 보너스 +5%", "매달 5,000P 지급", "조회 무제한"], note: "포인트 비용은 소폭 할인, 핵심은 알림 우선권" },
    { name: "골드", price: "29,000원", color: C.gold, soft: C.goldSoft, feats: ["매물 찾기 즉시 알림", "매물 목록 상단 노출", "빠른의뢰 1,800P · 안심의뢰 900P", "포인트 충전 보너스 +10%", "매달 15,000P 지급", "인사말 A/B 테스트 · 거래 통계"], note: "포인트 할인보다 빠른 알림과 노출 강화 중심" },
  ];
  const selectedTier = tiers.find(t => t.name === picked) || tiers[0];
  const payMethods = ["신용/체크카드", "간편결제", "계좌이체"];
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [step]);
  if (step === "checkout") {
    return (
      <div ref={topRef} style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
        <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
          <div style={{ color: "#ffffffcc", fontSize: 13 }}>외부 결제 전 확인</div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>구독 결제</div>
        </div>
        <div style={{ padding: 16 }}>
          <button onClick={() => setStep("plans")} style={{ border: "none", background: "transparent", color: C.greenInk, fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>← 구독 등급</button>
          <div style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: SH1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>{selectedTier.name} 구독</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>매월 자동 결제</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{selectedTier.price}</div>
            </div>
            {selectedTier.feats.slice(0, 4).map((f, i) => <div key={i} style={{ fontSize: 13, color: C.mid, lineHeight: 1.7 }}>✓ {f}</div>)}
          </div>
          <div style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: SH1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.dark, marginBottom: 12 }}>결제수단</div>
            {payMethods.map((m, i) => (
              <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                <span style={{ fontSize: 14, color: C.dark, fontWeight: 800 }}>{m}</span>
                <span style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${i === 0 ? C.green : C.line}`, background: i === 0 ? G.header : "#fff" }}/>
              </div>
            ))}
          </div>
          <div style={{ background: G.goldSoft, borderRadius: 16, padding: "13px 14px", color: C.mid, fontSize: 12, lineHeight: 1.6, marginBottom: 12 }}>다음 단계에서 외부 정기결제창으로 이동해요. 카드 승인 성공 후 구독이 적용돼요.</div>
          <Btn variant={selectedTier.name === "골드" ? "gold" : "primary"} onClick={() => { setPaidTier(selectedTier); onPick && onPick(selectedTier.name); setStep("done"); }}>외부 정기결제창으로 이동</Btn>
        </div>
      </div>
    );
  }
  if (step === "done") {
    const tier = paidTier || selectedTier;
    return (
      <div ref={topRef} style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
        <div style={{ padding: "80px 18px 18px", textAlign: "center" }}>
          <Frog mood="joyful" size={110} animate/>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.dark, marginTop: 12 }}>결제 완료</div>
          <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginTop: 6 }}>{tier.name} 월 구독이 적용됐어요.</div>
          <div style={{ background: G.card, borderRadius: 20, padding: 18, margin: "18px 0 12px", boxShadow: SH1, textAlign: "left" }}>
            {[["상품", `${tier.name} 월 구독`], ["결제금액", tier.price], ["결제일", "2026-05-27"], ["다음 결제", "2026-06-27"]].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: label === "상품" ? "none" : `1px solid ${C.line}` }}>
                <span style={{ fontSize: 13, color: C.gray, fontWeight: 800 }}>{label}</span>
                <span style={{ fontSize: 13, color: C.dark, fontWeight: 900 }}>{value}</span>
              </div>
            ))}
          </div>
          <Btn onClick={() => setStep("plans")}>구독 화면으로 돌아가기</Btn>
        </div>
      </div>
    );
  }
  return (
    <div ref={topRef} style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
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
              {t.note && <div style={{ marginTop: 10, background: "#ffffffcc", borderRadius: 12, padding: "8px 12px", fontSize: 12, fontWeight: 700, color: t.color }}>{t.note}</div>}
            </div>
          );
        })}
        <Btn variant={picked==="골드"?"gold":"primary"} disabled={picked === "무료"} onClick={() => setStep("checkout")}>{picked} 등급 {picked==="무료"?"이용 중":"구독하기"}</Btn>
        <div style={{ textAlign: "center", fontSize: 11, color: C.gray, marginTop: 12, lineHeight: 1.6 }}>구독은 월 자동 결제예요 · 언제든 해지 가능</div>
      </div>
    </div>
  );
}
