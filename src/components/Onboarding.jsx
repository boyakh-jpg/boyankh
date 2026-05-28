import { useEffect, useState } from "react";
import { C, G, SH1, SH2, spring } from "../theme";
import { Frog, Btn, Dots, Slide, Dot, Tag } from "./common";

export function Splash({ onNext }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 80); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: G.splash, padding: 32, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "#ffffff22", top: -90, right: -90 }}/>
      <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "#ffffff18", bottom: 30, left: -70 }}/>
      <div style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(28px)", transition: "all .65s " + spring, textAlign: "center", zIndex: 1 }}>
        <Frog mood="excited" size={158} animate={show}/>
        <div style={{ color: "#fff", fontSize: 32, fontWeight: 900, marginTop: 6, letterSpacing: 0, textShadow: "0 2px 8px rgba(80,120,100,.25)" }}>부동산의 요정</div>
        <div style={{ color: "#ffffffe0", fontSize: 15, marginTop: 10, lineHeight: 1.6 }}>내 집을 한 번에, 가장 유리하게<br/>중개사들이 먼저 찾아옵니다</div>
      </div>
      <div style={{ position: "absolute", bottom: 46, width: "calc(100% - 64px)", opacity: show ? 1 : 0, transition: "opacity .8s .4s", zIndex: 1 }}>
        <Btn onClick={onNext} style={{ background: "#fff", color: C.greenInk }}>시작하기</Btn>
        <div style={{ textAlign: "center", marginTop: 12, color: "#ffffffb0", fontSize: 12 }}>시작하면 이용약관 및 개인정보처리방침에 동의합니다</div>
      </div>
    </div>
  );
}

// ===== 로그인 =====
export function Login({ onLogin }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "46px 28px 40px", background: G.pageBg, minHeight: "100%", boxSizing: "border-box" }}>
      <Frog mood="calm" size={110} animate/>
      <div style={{ fontSize: 23, fontWeight: 800, color: C.dark, marginTop: 8 }}>반가워요!</div>
      <div style={{ fontSize: 14, color: C.gray, marginTop: 6, marginBottom: 34, textAlign: "center", lineHeight: 1.6 }}>소셜 계정으로 간편하게 시작하세요<br/><span style={{ fontSize: 12, color: C.green }}>개인정보를 직접 저장하지 않아요</span></div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        <button onClick={() => onLogin("user")} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "#FEE500", color: "#3A2D00", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 16px rgba(254,229,0,.35)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3A2D00"><path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.89 1.87 5.44 4.72 6.94l-.95 3.54 4.14-2.73c.67.09 1.36.14 2.09.14 5.52 0 10-3.69 10-8.25S17.52 3 12 3z"/></svg>카카오로 시작하기
        </button>
        <button onClick={() => onLogin("user")} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "#5FC97E", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 16px rgba(95,201,126,.32)" }}>
          <span style={{ fontWeight: 900, fontSize: 18 }}>N</span>네이버로 시작하기
        </button>
      </div>
      <div style={{ padding: 18, background: G.greenSoft, borderRadius: 18, width: "100%", boxSizing: "border-box", boxShadow: SH2 }}>
        <div style={{ fontSize: 12, color: C.greenInk, fontWeight: 700, marginBottom: 6 }}>개인정보 보호 안내</div>
        <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.9 }}>· 닉네임, 프로필 사진만 수집해요<br/>· 연락처·주민번호는 저장하지 않아요<br/>· 안심의뢰는 채팅으로만, 번호 노출 없어요</div>
      </div>
    </div>
  );
}

// ===== 역할 선택 =====
export function Role({ accountType = "user", availableRoles = null, onSelect }) {
  const roles = [
    { role: "owner", tone: "green", title: "팔거나 임대할래요", sub: "매도 / 전세 / 월세 의뢰", badge: null },
    { role: "broker", tone: "gold", title: "공인중개사예요", sub: "매물 확인 · 가입 시 50,000P", badge: "FREE 50,000P" },
    { role: "buyer", tone: "lilac", title: "구하고 있어요", sub: "직거래 매물 검색 · 열람 1건 10,000P", badge: null },
  ].filter(item => availableRoles ? availableRoles.includes(item.role) : accountType === "broker" || item.role !== "broker");
  return (
    <div style={{ padding: "34px 24px", background: G.pageBg, minHeight: "100%", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <Frog mood="pondering" size={98} animate/>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginTop: 6 }}>어떻게 이용하시나요?</div>
        <div style={{ fontSize: 14, color: C.gray, marginTop: 4 }}>나중에 언제든 바꿀 수 있어요</div>
      </div>
      {roles.map(({ role, tone, title, sub, badge }) => {
        const dotColor = { green: C.green, gold: C.gold, lilac: C.lilac }[tone];
        return (
          <div key={role} onClick={() => onSelect(role)} style={{ background: G.card, borderRadius: 22, padding: "18px 20px", marginBottom: 12, border: `1.5px solid ${C.line}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 16, boxShadow: SH1, transition: "transform .12s" }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(.98)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: dotColor + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: 6, background: dotColor }}/>
            </div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{title}</div><div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{sub}</div></div>
            {badge && <Tag tone="gold">{badge}</Tag>}
            <div style={{ fontSize: 20, color: "#CBD5CD" }}>›</div>
          </div>
        );
      })}
    </div>
  );
}

