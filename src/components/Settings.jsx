import { C, G, SH1, SH2 } from "../theme";
import { REGIONS } from "../data/data";
import { Frog, RoleToggle, SelectBox, Tag } from "./common";

const NOTIFICATION_LABELS = [
  ["newListing", "신규 매물", "내 지역에 새 매물이 올라오면 알림"],
  ["expiringSoon", "만료 임박", "의뢰기한 3일 이하 매물 알림"],
  ["priceChange", "가격 변동", "관심 매물 가격이 바뀌면 알림"],
  ["chat", "채팅/문의", "새 채팅과 문의 알림"],
  ["points", "포인트 부족", "열람 전 포인트 부족 알림"],
];

function Section({ title, children }) {
  return (
    <div style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: SH1 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: C.dark, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function ToggleRow({ title, sub, checked, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", border: "none", background: "transparent", padding: "11px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
      <span>
        <span style={{ display: "block", fontSize: 14, color: C.dark, fontWeight: 800 }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: C.gray, marginTop: 2 }}>{sub}</span>
      </span>
      <span style={{ width: 44, height: 26, borderRadius: 13, background: checked ? G.header : C.line, padding: 3, boxSizing: "border-box", transition: "all .15s", flexShrink: 0 }}>
        <span style={{ display: "block", width: 20, height: 20, borderRadius: 10, background: "#fff", transform: checked ? "translateX(18px)" : "translateX(0)", transition: "all .15s", boxShadow: SH2 }}/>
      </span>
    </button>
  );
}

function MenuRow({ title, sub, tag, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "11px 0", border: "none", borderTop: `1px solid ${C.line}`, background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: onClick ? "pointer" : "default", fontFamily: "inherit", textAlign: "left" }}>
      <div>
        <div style={{ fontSize: 14, color: C.dark, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{sub}</div>
      </div>
      {tag ? <Tag tone="gold">{tag}</Tag> : <span style={{ color: C.gray, fontWeight: 900 }}>›</span>}
    </button>
  );
}

export function Settings({ role, availableRoles, onSwitchRole, preferredRegion, interestRegion, onRegionChange, onInterestRegionChange, notifications, onToggleNotification, brokerTier = "골드", onSubscription, onBack }) {
  const regionOptions = REGIONS.filter(r => r !== "전체");
  return (
    <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#ffffffcc", fontSize: 13 }}>내 환경</div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>설정</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="pondering" size={62}/>
          </div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <Section title="내 지역">
          <SelectBox label="기본 지역" value={preferredRegion} options={regionOptions} onChange={onRegionChange}/>
          <div style={{ height: 8 }}/>
          <SelectBox label="관심 지역" value={interestRegion} options={regionOptions} onChange={onInterestRegionChange}/>
          <div style={{ marginTop: 10, fontSize: 12, color: C.gray, lineHeight: 1.6 }}>두 지역 기준으로 홈 추천 매물, 부동산, 신규 매물, 만료 임박이 바뀌어요. 이 브라우저에 저장돼요.</div>
        </Section>
        <Section title="알림">
          {NOTIFICATION_LABELS.map(([key, title, sub]) => (
            <ToggleRow key={key} title={title} sub={sub} checked={!!notifications[key]} onClick={() => onToggleNotification(key)}/>
          ))}
        </Section>
        {role === "broker" && (
          <Section title="중개사 설정">
            <div style={{ background: G.greenSoft, borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 14, color: C.greenInk, fontWeight: 900 }}>구독 등급 · {brokerTier}</div>
              <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6, marginTop: 4 }}>알림 우선권, 충전 보너스, 조회 한도를 여기서 관리해요.</div>
              <button onClick={onSubscription} style={{ width: "100%", marginTop: 10, border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>구독 관리</button>
            </div>
            <MenuRow title="부동산 정보" sub="상호, 등록번호, 사무소 주소" tag="필수"/>
            <MenuRow title="영업시간" sub="응답률 계산에 반영될 시간"/>
            <MenuRow title="전문 지역" sub="소유주에게 노출될 활동 지역"/>
          </Section>
        )}
        <Section title="계정">
          <MenuRow title="프로필" sub="이름, 연락처, 역할 정보"/>
          <MenuRow title="포인트/결제" sub="충전 내역, 사용 내역, 결제수단"/>
          <MenuRow title="고객지원" sub="문의하기, 신고하기, 약관"/>
        </Section>
        <button onClick={onBack} style={{ width: "100%", border: "none", background: G.header, color: "#fff", borderRadius: 16, padding: "14px 0", fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", boxShadow: SH2 }}>설정 저장</button>
      </div>
    </div>
  );
}
