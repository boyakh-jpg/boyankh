import { useState, useEffect, useRef } from "react";
// 두꺼비 스프라이트는 별도 파일에서 가져옵니다. 본인 파일의 export 이름/경로에 맞게 이 줄만 수정하세요.
import { FROG_SPRITE } from "./frogSprite";

const SW = 160, SH = 160, COLS = 4, ROWS = 4;
const FROGS = {
  excited:{col:0,row:0}, determined:{col:1,row:0}, calm:{col:2,row:0}, smug:{col:3,row:0},
  confused:{col:0,row:1}, suspicious:{col:1,row:1}, sad:{col:2,row:1}, joyful:{col:3,row:1},
  angry:{col:0,row:2}, thinkHeart:{col:1,row:2}, sleepy:{col:2,row:2}, pondering:{col:3,row:2},
  nervous:{col:0,row:3}, shy:{col:1,row:3}, love:{col:2,row:3}, cool:{col:3,row:3},
};
function Frog({ mood = "calm", size = 80, animate = false }) {
  const f = FROGS[mood] || FROGS.calm;
  const scale = size / SW;
  return (
    <div style={{ width: size, height: size, overflow: "hidden", display: "inline-block", flexShrink: 0,
      animation: animate ? "frogPop .45s cubic-bezier(.34,1.56,.64,1)" : "none",
      filter: "drop-shadow(0 6px 10px rgba(120,140,120,.18))" }}>
      <div style={{ width: SW, height: SH, backgroundImage: `url(${FROG_SPRITE})`,
        backgroundPosition: `-${f.col*SW}px -${f.row*SH}px`, backgroundSize: `${SW*COLS}px ${SH*ROWS}px`,
        transform: `scale(${scale})`, transformOrigin: "top left" }}/>
    </div>
  );
}

// ===== 파스텔 팔레트 =====
const C = {
  bg: "#F6F9F4",
  card: "#FFFFFF",
  green: "#6FB894",        // 파스텔 그린 (메인)
  greenInk: "#3E8268",     // 텍스트용 진한 파스텔
  greenSoft: "#E9F4EE",
  mint: "#A9DCC4",
  gold: "#F2C078",         // 파스텔 골드
  goldInk: "#C9923F",
  goldSoft: "#FCF3E2",
  peach: "#F4B8A8",
  lilac: "#C9C2E8",
  dark: "#3A4A42",         // 부드러운 차콜그린
  mid: "#6B7A72",
  gray: "#9AA8A0",
  line: "#EAF0EB",
};
const G = {
  header: "linear-gradient(155deg, #8FCCAE 0%, #7FC2A6 50%, #6FB894 100%)",
  headerSoft: "linear-gradient(160deg, #A9DCC4 0%, #8FCCAE 100%)",
  card: "linear-gradient(165deg, #FFFFFF 0%, #FBFDFB 100%)",
  greenSoft: "linear-gradient(155deg, #EEF7F1 0%, #E4F1EA 100%)",
  gold: "linear-gradient(140deg, #F6CC8C 0%, #F2C078 100%)",
  goldSoft: "linear-gradient(155deg, #FDF6E9 0%, #FBEFD9 100%)",
  splash: "linear-gradient(165deg, #A9DCC4 0%, #8FCCAE 45%, #79C0A4 100%)",
  pageBg: "linear-gradient(180deg, #F6F9F4 0%, #EFF6F0 100%)",
  peachSoft: "linear-gradient(155deg, #FCEEE9 0%, #F9E3DB 100%)",
};
const SH1 = "0 4px 16px rgba(110,150,130,.10)";
const SH2 = "0 2px 10px rgba(110,150,130,.08)";
const spring = "cubic-bezier(.34,1.56,.64,1)";

// 미니멀 아이콘 (이모지 대체) - 작은 도형
function Dot({ color = C.green, size = 8 }) {
  return <span style={{ width: size, height: size, borderRadius: size, background: color, display: "inline-block" }}/>;
}

function Btn({ children, onClick, disabled, variant = "primary", style: sx = {} }) {
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
function Dots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? 22 : 7, height: 7, borderRadius: 4,
          background: i <= current ? C.green : C.line, transition: "all .3s " + spring }}/>
      ))}
    </div>
  );
}
function Slide({ k, dir = 1, children }) {
  return <div key={k} style={{ animation: `slide${dir > 0 ? "Next" : "Prev"} .32s cubic-bezier(.4,0,.2,1)` }}>{children}</div>;
}
function Tag({ children, tone = "green" }) {
  const map = { green: [C.greenInk, C.greenSoft], gold: [C.goldInk, C.goldSoft] };
  const m = map[tone] || map.green;
  return <span style={{ background: m[1], color: m[0], fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>;
}

// 역할 순환 토글: 현재 역할 → 누르면 다음 역할
const ROLE_LABEL = { owner: "집주인", broker: "중개사", buyer: "직거래" };
const ROLE_NEXT = { owner: "broker", broker: "buyer", buyer: "owner" };
function RoleToggle({ role, onClick }) {
  const cur = ROLE_LABEL[role] || "집주인";
  const next = ROLE_LABEL[ROLE_NEXT[role]] || "중개사";
  return (
    <button onClick={onClick} style={{ background: "#ffffff2e", border: "1px solid #ffffff55", borderRadius: 20, padding: "6px 13px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      <span>{cur}</span>
      <span style={{ opacity: .7, fontSize: 11 }}>›</span>
      <span style={{ opacity: .8, fontWeight: 500 }}>{next}</span>
    </button>
  );
}

// ===== 스플래시 =====
function Splash({ onNext }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 80); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", background: G.splash, padding: 32, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", background: "#ffffff22", top: -90, right: -90 }}/>
      <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "#ffffff18", bottom: 30, left: -70 }}/>
      <div style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(28px)", transition: "all .65s " + spring, textAlign: "center", zIndex: 1 }}>
        <Frog mood="excited" size={158} animate={show}/>
        <div style={{ color: "#fff", fontSize: 32, fontWeight: 900, marginTop: 6, letterSpacing: -1, textShadow: "0 2px 8px rgba(80,120,100,.25)" }}>부동산의 요정</div>
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
function Login({ onLogin }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "46px 28px 40px", background: G.pageBg, minHeight: "100%", boxSizing: "border-box" }}>
      <Frog mood="calm" size={110} animate/>
      <div style={{ fontSize: 23, fontWeight: 800, color: C.dark, marginTop: 8 }}>반가워요!</div>
      <div style={{ fontSize: 14, color: C.gray, marginTop: 6, marginBottom: 34, textAlign: "center", lineHeight: 1.6 }}>소셜 계정으로 간편하게 시작하세요<br/><span style={{ fontSize: 12, color: C.green }}>개인정보를 직접 저장하지 않아요</span></div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        <button onClick={() => onLogin("kakao")} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "#FEE500", color: "#3A2D00", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 16px rgba(254,229,0,.35)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3A2D00"><path d="M12 3C6.48 3 2 6.69 2 11.25c0 2.89 1.87 5.44 4.72 6.94l-.95 3.54 4.14-2.73c.67.09 1.36.14 2.09.14 5.52 0 10-3.69 10-8.25S17.52 3 12 3z"/></svg>카카오로 시작하기
        </button>
        <button onClick={() => onLogin("naver")} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "#5FC97E", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 16px rgba(95,201,126,.32)" }}>
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
function Role({ onSelect }) {
  return (
    <div style={{ padding: "34px 24px", background: G.pageBg, minHeight: "100%", boxSizing: "border-box" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <Frog mood="pondering" size={98} animate/>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.dark, marginTop: 6 }}>어떻게 이용하시나요?</div>
        <div style={{ fontSize: 14, color: C.gray, marginTop: 4 }}>나중에 언제든 바꿀 수 있어요</div>
      </div>
      {[
        { role: "owner", tone: "green", title: "집을 팔거나 임대할래요", sub: "매도 / 전세 / 월세 의뢰", badge: null },
        { role: "broker", tone: "gold", title: "공인중개사예요", sub: "매물 알림 받기 · 가입 시 50,000P", badge: "FREE 50,000P" },
        { role: "buyer", tone: "lilac", title: "집을 구하고 있어요", sub: "직거래 매물 검색 · 열람 1건 10,000원", badge: null },
      ].map(({ role, tone, title, sub, badge }) => {
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

// ===== 등록 =====
function Register({ onDone, onClose, onBack }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [d, setD] = useState({ propType:"", dealType:"", deposit:"", monthly:"", premium:"", address:"", area:"", floor:"", direction:"", maintenance:"", parking:"", special:"", tenant:"", tenantEnd:"", feeRate:0.4, fastMode:null, directMode:false, certified:false });
  const [cs, setCs] = useState(0);
  const [code, setCode] = useState("");
  const submitted = useRef(false);
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const TOTAL = 10;
  const next = () => { setDir(1); setStep(s => s + 1); };
  const back = () => { if (step === 0) return onBack(); setDir(-1); setStep(s => s - 1); };
  const DEAL_OPTIONS_BY_PROP = {
    "아파트": [["매매", "소유권 이전"], ["전세", "보증금 일시 납부"], ["월세", "보증금+매월 납부"]],
    "빌라/다세대": [["매매", "소유권 이전"], ["전세", "보증금 일시 납부"], ["월세", "보증금+매월 납부"]],
    "단독주택": [["매매", "소유권 이전"], ["전세", "보증금 일시 납부"], ["월세", "보증금+매월 납부"]],
    "오피스텔": [["매매", "소유권 이전"], ["전세", "보증금 일시 납부"], ["월세", "보증금+매월 납부"]],
    "상가": [["매매", "상가 소유권 이전"], ["임대", "보증금+월 임대료+권리금"]],
    "토지": [["매매", "토지 소유권 이전"]],
    "입주권": [["권리양도", "조합원 권리 이전"]],
    "분양권": [["전매", "분양계약 권리 이전"]],
    "재개발·재건축": [["권리양도", "정비사업 권리 이전"]],
  };
  const dealOptions = DEAL_OPTIONS_BY_PROP[d.propType] || [];
  const rightsTypes = ["입주권", "분양권", "재개발·재건축"];
  const selectPropType = propType => {
    const nextDeal = (DEAL_OPTIONS_BY_PROP[propType] || [])[0]?.[0] || "";
    setD(p => ({ ...p, propType, dealType: nextDeal, deposit: "", monthly: "", premium: "" }));
    setTimeout(next, 160);
  };
  const selectDealType = dealType => {
    setD(p => ({ ...p, dealType, deposit: "", monthly: "", premium: "" }));
    setTimeout(next, 160);
  };
  // 만원 단위 숫자 → "12억 5,000만원" 형태
  const formatMan = man => {
    const n = parseInt(man, 10);
    if (!n) return "";
    const eok = Math.floor(n / 10000);
    const rest = n % 10000;
    if (eok > 0) return `${eok}억${rest > 0 ? ` ${rest.toLocaleString()}만` : ""}원`;
    return `${n.toLocaleString()}만원`;
  };
  const depositNum = parseInt(d.deposit, 10) || 0;
  const monthlyNum = parseInt(d.monthly, 10) || 0;
  const premiumNum = parseInt(d.premium, 10) || 0;
  // 권리성 상품은 거래금액 = 권리가/분양가 + 프리미엄
  const isRights = rightsTypes.includes(d.propType);
  const isLand = d.propType === "토지";
  const isCommercialLease = d.propType === "상가" && d.dealType === "임대";
  const isMonthlyLike = d.dealType === "월세" || isCommercialLease;
  const rightsBaseLabel = d.propType === "분양권" ? "분양가" : "권리가";
  const rightsTotal = depositNum + premiumNum;
  // 가격 입력 미리보기
  const pricePreview = !d.deposit ? "" :
    isRights ? (premiumNum ? `${rightsBaseLabel} ${formatMan(d.deposit)} + P ${formatMan(d.premium)} = 총 ${formatMan(String(rightsTotal))}` : `${rightsBaseLabel} ${formatMan(d.deposit)}`) :
    isCommercialLease ? `보증금 ${formatMan(d.deposit)}${monthlyNum ? ` / 월 ${monthlyNum}만원` : ""}${premiumNum ? ` / 권리금 ${formatMan(d.premium)}` : ""}` :
    d.dealType === "월세" ? (monthlyNum ? `보증금 ${formatMan(d.deposit)} / 월 ${monthlyNum}만원` : `보증금 ${formatMan(d.deposit)}`) :
    isLand ? `토지 매매가 ${formatMan(d.deposit)}` :
    formatMan(d.deposit);
  // 수수료 산정 기준액(만원): 월세/상가임대는 환산보증금, 권리성 상품은 권리가+프리미엄
  const feeBaseMan = isRights ? rightsTotal : (isMonthlyLike ? depositNum + monthlyNum * 100 : depositNum);
  const estFeeWon = Math.round(feeBaseMan * 10000 * (d.feeRate / 100));
  // 원 → "약 OO만원 / O억 O만원"
  const wonShort = n => n >= 1e8 ? `${Math.floor(n/1e8)}억${Math.round((n%1e8)/1e4) > 0 ? ` ${Math.round((n%1e8)/1e4).toLocaleString()}만` : ""}원` : n >= 1e4 ? `${Math.round(n/1e4).toLocaleString()}만원` : `${n.toLocaleString()}원`;
  // 입력값 → PROPERTIES 형식의 매물 객체로 변환
  const buildListing = () => {
    // 주소에서 "OO구" 추출 (없으면 마포구 기본)
    const regionMatch = (d.address.match(/(\S+구)/) || [])[1] || "기타";
    const dongMatch = (d.address.match(/(\S+동)/) || [])[1] || "";
    // price 문자열: 매매/전세/토지는 만원→억/만 표기, 월세/상가임대는 "보증금/월세만", 권리성 상품은 총액
    const manToPrice = man => { const n=parseInt(man,10)||0; const eok=Math.floor(n/10000); const rest=n%10000; return eok>0?`${eok}억${rest>0?` ${rest.toLocaleString()}만`:""}`:`${n.toLocaleString()}만`; };
    const priceStr = isRights ? manToPrice(String(rightsTotal)) : (isMonthlyLike ? `${depositNum.toLocaleString()}/${monthlyNum}만${isCommercialLease && premiumNum ? ` 권리금 ${manToPrice(d.premium)}` : ""}` : manToPrice(d.deposit));
    // 종류 매핑 (등록은 "빌라/다세대" 등 세분 → 목록 필터용 단순화)
    const typeMap = { "아파트":"아파트", "빌라/다세대":"빌라", "단독주택":"빌라", "오피스텔":"오피스텔", "상가":"상가", "토지":"토지", "입주권":"입주권", "분양권":"분양권", "재개발·재건축":"재개발" };
    const doneLabelMap = { "매매":"매도완료", "전세":"전세완료", "월세":"임대완료", "임대":"임대완료", "권리양도":"양도완료", "전매":"전매완료" };
    return {
      id: "u" + Date.now(),
      region: regionMatch, dong: dongMatch,
      complex: d.address.split(" ").slice(-1)[0] || "신규 매물",
      propType: typeMap[d.propType] || "아파트",
      dealType: d.dealType,
      price: priceStr, priceNum: isRights ? rightsTotal : depositNum,
      premium: (isRights || isCommercialLease) ? premiumNum : null,
      area: parseInt(d.area, 10) || 84, floor: parseInt(d.floor, 10) || 1,
      fee: d.feeRate + "%", fast: !!d.fastMode,
      views: 0, ago: "방금 전",
      x: 50, y: 50, badge: "NEW",
      status: "active", doneLabel: doneLabelMap[d.dealType] || "거래완료", completedDaysAgo: null,
      expiresInDays: 14, // 의뢰 기한: 기본 2주
    };
  };
  // 완료 스텝 진입 시 매물 1회 등록
  useEffect(() => {
    if (step === 10 && !submitted.current) { submitted.current = true; onDone && onDone(buildListing()); }
  }, [step]);
  const moods = ["calm","pondering","determined","pondering","pondering","pondering","calm","pondering","determined","calm","excited"];
  const titles = ["어떤 매물인가요?","어떤 거래를 원하세요?","희망 금액을 입력하세요","매물 주소를 알려주세요","세부 정보를 입력해 주세요","임차인이 있나요?","사진을 등록해 주세요","수수료 상한을 설정하세요","의뢰 방식을 골라주세요","소유자 인증","등록 완료!"];
  const subs = ["탭하면 바로 넘어가요","탭하면 바로 넘어가요","수수료 계산의 기준이 돼요","도로명 또는 지번","중개사들이 궁금해해요","정확할수록 빠른 거래","많을수록 문의가 늘어요","높을수록 적극적으로","집주인이 직접 선택","허위매물 방지 필수","전국 중개사에게 발송!"];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: G.pageBg }}>
      <div style={{ padding: "46px 20px 8px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={back} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.mid, padding: 0 }}>←</button>
          <div style={{ flex: 1 }}><Dots total={TOTAL} current={step}/></div>
          <div style={{ fontSize: 12, color: C.gray }}>{step+1}/{TOTAL}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 24px 24px", scrollbarWidth: "none" }}>
        <Slide k={step} dir={dir}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <Frog mood={moods[step]} size={70} animate/>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: C.dark, lineHeight: 1.25 }}>{titles[step]}</div><div style={{ fontSize: 13, color: C.gray, marginTop: 3 }}>{subs[step]}</div></div>
          </div>
          {step === 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["아파트","주거"],["빌라/다세대","주거"],["단독주택","주거"],["오피스텔","주거·수익"],["상가","수익형"],["토지","대지·전답"],["입주권","조합원 권리"],["분양권","청약 당첨"],["재개발·재건축","정비사업"]].map(([t, ds]) => (
                <div key={t} onClick={() => selectPropType(t)} style={{ padding: "18px 12px", borderRadius: 18, border: `2px solid ${d.propType===t?C.green:C.line}`, background: d.propType===t?G.greenSoft:G.card, textAlign: "center", cursor: "pointer", transition: "all .15s", boxShadow: d.propType===t?"none":SH2 }}>
                  <div style={{ fontSize: 15, fontWeight: d.propType===t?700:500, color: d.propType===t?C.greenInk:C.dark }}>{t}</div>
                  <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{ds}</div>
                </div>
              ))}
            </div>
          )}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dealOptions.map(([k, ds]) => (
                <div key={k} onClick={() => selectDealType(k)} style={{ padding: "18px 20px", borderRadius: 18, border: `2px solid ${d.dealType===k?C.green:C.line}`, background: d.dealType===k?G.greenSoft:G.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all .15s", boxShadow: d.dealType===k?"none":SH2 }}>
                  <Dot color={d.dealType===k?C.green:C.line} size={12}/>
                  <div><div style={{ fontSize: 16, fontWeight: 700, color: d.dealType===k?C.greenInk:C.dark }}>{k}</div><div style={{ fontSize: 12, color: C.gray }}>{ds}</div></div>
                </div>
              ))}
              {!dealOptions.length && <div style={{ fontSize: 14, color: C.gray, textAlign: "center", padding: "20px 0" }}>먼저 매물 종류를 선택해 주세요</div>}
            </div>
          )}
          {step === 2 && (
            <>
              {isRights && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>{rightsBaseLabel}</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 80000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>프리미엄 (웃돈)</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 15000 (마이너스P는 0)" value={d.premium} onChange={e => set("premium", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, marginTop: 5 }}>프리미엄이 없으면 0, 마이너스 프리미엄도 0으로 입력하고 메모에 적어주세요</div>
                  </div>
                </>
              )}
              {!isRights && (d.dealType === "매매" || d.dealType === "전세") && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>{isLand ? "토지 매매가" : d.propType === "상가" && d.dealType === "매매" ? "상가 매매가" : d.dealType === "매매" ? "매매가" : "전세 보증금"}</div>
                  <div style={{ position: "relative" }}>
                    <input inputMode="numeric" placeholder="예: 125000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                    <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                  </div>
                </div>
              )}
              {!isRights && isCommercialLease && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>상가 보증금</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 5000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>월 임대료</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 250" value={d.monthly} onChange={e => set("monthly", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>권리금 (선택)</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 3000" value={d.premium} onChange={e => set("premium", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                </>
              )}
              {!isRights && d.dealType === "월세" && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>보증금</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 2000" value={d.deposit} onChange={e => set("deposit", e.target.value.replace(/[^0-9]/g, ""))} autoFocus style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>월세</div>
                    <div style={{ position: "relative" }}>
                      <input inputMode="numeric" placeholder="예: 76" value={d.monthly} onChange={e => set("monthly", e.target.value.replace(/[^0-9]/g, ""))} style={{ width: "100%", padding: 16, paddingRight: 48, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 17, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/>
                      <span style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray }}>만원</span>
                    </div>
                  </div>
                </>
              )}
              {!d.dealType && !isRights && <div style={{ fontSize: 14, color: C.gray, textAlign: "center", padding: "20px 0" }}>먼저 거래 유형을 선택해 주세요</div>}
              {pricePreview && <div style={{ background: G.greenSoft, borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 14, color: C.greenInk, fontWeight: 700, textAlign: "center" }}>{pricePreview}</div>}
              <Btn onClick={next} disabled={!d.deposit || (!isRights && isMonthlyLike && !d.monthly)}>다음</Btn>
            </>
          )}
          {step === 3 && (
            <>
              <input placeholder="주소 입력 (예: 서울 마포구 공덕동 123)" value={d.address} onChange={e => set("address", e.target.value)} autoFocus style={{ width: "100%", padding: 16, borderRadius: 16, border: `1.5px solid ${C.line}`, fontSize: 15, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10, background: "#fff" }}/>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[["면적㎡","area"],["층수","floor"],["방향","direction"]].map(([ph, k]) => (<input key={k} placeholder={ph} value={d[k]} onChange={e => set(k, e.target.value)} style={{ padding: "13px 12px", borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}/>))}
              </div>
              <Btn onClick={next} disabled={!d.address}>다음</Btn>
            </>
          )}
          {step === 4 && (
            <>
              {[["관리비(월)","maintenance","예: 15만원"],["주차","parking","예: 1대 가능"],["특이사항","special","예: 풀옵션, 리모델링"]].map(([l, k, ph]) => (
                <div key={k} style={{ marginBottom: 14 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.mid, marginBottom: 6 }}>{l}</div><input placeholder={ph} value={d[k]} onChange={e => set(k, e.target.value)} style={{ width: "100%", padding: 14, borderRadius: 14, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" }}/></div>
              ))}
              <Btn onClick={next}>다음</Btn>
            </>
          )}
          {step === 5 && (
            <>
              {["없어요 (공실)","있어요","내가 살고 있어요"].map(o => (
                <div key={o} onClick={() => { set("tenant", o); if (o !== "있어요") setTimeout(next, 160); }} style={{ padding: "18px 20px", borderRadius: 18, border: `2px solid ${d.tenant===o?C.green:C.line}`, background: d.tenant===o?G.greenSoft:G.card, cursor: "pointer", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all .15s", boxShadow: d.tenant===o?"none":SH2 }}>
                  <span style={{ fontSize: 15, fontWeight: d.tenant===o?700:500, color: d.tenant===o?C.greenInk:C.dark }}>{o}</span>
                  {d.tenant===o && <span style={{ color: C.green, fontSize: 18 }}>✓</span>}
                </div>
              ))}
              {d.tenant === "있어요" && (
                <div style={{ background: G.greenSoft, borderRadius: 16, padding: 16 }}>
                  <input placeholder="계약 만료 (예: 2026년 8월)" value={d.tenantEnd} onChange={e => set("tenantEnd", e.target.value)} style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 8, background: "#fff" }}/>
                  <div style={{ fontSize: 11, color: C.mid, lineHeight: 1.6 }}>계약 만료 전 매도 시 임차인 권리가 승계됩니다.</div>
                  <Btn onClick={next} style={{ marginTop: 12 }}>다음</Btn>
                </div>
              )}
            </>
          )}
          {step === 6 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                {["거실","주방","안방","욕실","외관","뷰"].map(l => (
                  <div key={l} style={{ aspectRatio: "1", borderRadius: 16, border: `2px dashed ${C.mint}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: G.greenSoft, gap: 6 }}>
                    <div style={{ width: 24, height: 18, borderRadius: 4, border: `2px solid ${C.green}`, position: "relative" }}><div style={{ width: 6, height: 6, borderRadius: 3, background: C.green, position: "absolute", top: 3, right: 3 }}/></div>
                    <span style={{ fontSize: 11, color: C.mid }}>{l}</span>
                  </div>
                ))}
              </div>
              <Btn onClick={next}>다음</Btn>
              <button onClick={next} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>나중에 추가할게요</button>
            </>
          )}
          {step === 7 && (
            <>
              <div style={{ background: G.card, borderRadius: 20, padding: 20, marginBottom: 14, boxShadow: SH1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C.mid }}>최대 수수료</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 26, fontWeight: 900, color: C.greenInk }}>{d.feeRate}%</span>
                    {feeBaseMan > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: C.mid, marginTop: 2 }}>예상 약 {wonShort(estFeeWon)}</div>}
                  </div>
                </div>
                <input type="range" min="0.1" max="0.9" step="0.1" value={d.feeRate} onChange={e => set("feeRate", parseFloat(e.target.value))} style={{ width: "100%", accentColor: C.green, marginBottom: 8 }}/>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.gray, marginBottom: 14 }}><span>0.1%</span><span>법정상한 0.9%</span></div>
                <div style={{ background: G.greenSoft, borderRadius: 14, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: C.greenInk }}>{d.feeRate <= 0.2 ? "직거래 위주로 연결돼요" : d.feeRate <= 0.4 ? "중개사들이 관심을 가져요" : d.feeRate <= 0.6 ? "중개사들이 적극적으로 움직여요" : "빠른 거래에 유리해요"}</div>
              </div>
              {feeBaseMan > 0 && (
                <div style={{ background: G.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, fontSize: 12, color: C.mid, lineHeight: 1.7 }}>
                  {isMonthlyLike ? `환산보증금 ${feeBaseMan.toLocaleString()}만원` : `${feeBaseMan.toLocaleString()}만원`} × {d.feeRate}% = <b style={{ color: C.greenInk }}>약 {wonShort(estFeeWon)}</b>
                  <div style={{ color: C.gray, marginTop: 3 }}>중개사가 받을 수 있는 최대 보수예요{isMonthlyLike ? " · 월 임대료는 환산보증금 기준" : ""}</div>
                </div>
              )}
              <Btn onClick={next}>다음</Btn>
            </>
          )}
          {step === 8 && (
            <>
              {[
                { key: true, t: "빠른 의뢰", s: "번호 공개 · 집주인 무료", desc: "중개사가 2,000P 내고 번호를 확인해 바로 전화해요. 급할 때 좋아요.", tone: "gold" },
                { key: false, t: "안심 의뢰", s: "번호 비공개 · 집주인 무료", desc: "중개사가 1,000P 내고 채팅 신청해요. 마음에 드는 곳에만 연락하세요.", tone: "green" },
              ].map(o => {
                const col = o.tone === "gold" ? C.gold : C.green;
                const inkCol = o.tone === "gold" ? C.goldInk : C.greenInk;
                const sel = d.fastMode === o.key;
                return (
                  <div key={String(o.key)} onClick={() => { set("fastMode", o.key); setTimeout(next, 200); }} style={{ padding: 20, borderRadius: 20, border: `2px solid ${sel?col:C.line}`, background: sel ? (o.tone==="gold"?G.goldSoft:G.greenSoft) : C.card, cursor: "pointer", marginBottom: 12, transition: "all .15s", boxShadow: sel?"none":SH2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: col + "22", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 12, height: 12, borderRadius: 6, background: col }}/></div>
                      <div><div style={{ fontSize: 16, fontWeight: 800, color: sel?inkCol:C.dark }}>{o.t}</div><div style={{ fontSize: 12, color: C.gray }}>{o.s}</div></div>
                      {sel && <span style={{ marginLeft: "auto", color: inkCol, fontSize: 20 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6, background: "#ffffffcc", borderRadius: 12, padding: "10px 12px" }}>{o.desc}</div>
                  </div>
                );
              })}
              <div style={{ background: G.peachSoft, borderRadius: 18, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", marginTop: 4 }}>
                <Frog mood="suspicious" size={42}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#B5654A", marginBottom: 3 }}>직거래도 함께 받을까요? <span style={{ fontSize: 11, fontWeight: 600, color: C.gray }}>(무료)</span></div>
                  <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>매수자에게도 매물을 노출해요. <b style={{ color: "#B5654A" }}>등록은 무료</b>이고, 관심 있는 매수자가 연락처를 열람할 때 직접 1만원을 결제해요. 중개수수료 없이 거래할 수 있어요.</div>
                  <div onClick={() => set("directMode", !d.directMode)} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${d.directMode?C.peach:C.gray}`, background: d.directMode?C.peach:"transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{d.directMode && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: d.directMode?"#B5654A":C.mid }}>직거래 매수자에게도 노출하기</span>
                  </div>
                </div>
              </div>
            </>
          )}
          {step === 9 && (
            <>
              {cs === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[["등기부등본 자동 조회","공공데이터 API로 소유자 명의 자동 확인"],["휴대폰 본인인증","PASS 또는 통신사 인증"]].map(([t, ds]) => (
                    <div key={t} style={{ background: G.card, borderRadius: 18, padding: "16px 18px", border: `1.5px solid ${C.line}`, display: "flex", gap: 14, alignItems: "center", boxShadow: SH2 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: C.greenSoft, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Dot color={C.green} size={14}/></div>
                      <div><div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{t}</div><div style={{ fontSize: 12, color: C.gray, marginTop: 3, lineHeight: 1.5 }}>{ds}</div></div>
                    </div>
                  ))}
                  <Btn onClick={() => setCs(1)} style={{ marginTop: 4 }}>인증 시작하기</Btn>
                </div>
              )}
              {cs === 1 && (
                <>
                  <div style={{ fontSize: 14, color: C.gray, marginBottom: 16, textAlign: "center" }}>발송된 6자리 번호를 입력하세요</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    {Array.from({ length: 6 }).map((_, i) => (<div key={i} style={{ flex: 1, height: 52, borderRadius: 14, border: `2px solid ${i<code.length?C.green:C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, background: "#fff", color: C.greenInk }}>{code[i]?"●":""}</div>))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[..."123456789"].map(n => (<button key={n} onClick={() => { if (code.length<6){ const nc=code+n; setCode(nc); if(nc.length===6) setTimeout(()=>{set("certified",true);setCs(2);},300);} }} style={{ padding: "16px 0", borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: C.dark }}>{n}</button>))}
                    <div/>
                    <button onClick={() => { if (code.length<6){ const nc=code+"0"; setCode(nc); if(nc.length===6) setTimeout(()=>{set("certified",true);setCs(2);},300);} }} style={{ padding: "16px 0", borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 20, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: C.dark }}>0</button>
                    <button onClick={() => setCode(c => c.slice(0,-1))} style={{ padding: "16px 0", borderRadius: 14, border: `1.5px solid ${C.line}`, background: "#fff", fontSize: 18, cursor: "pointer", fontFamily: "inherit", color: C.mid }}>⌫</button>
                  </div>
                </>
              )}
              {cs === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["등기부등본 소유자 일치","휴대폰 본인인증 완료","인증마크 부여 완료"].map(t => (<div key={t} style={{ background: G.greenSoft, borderRadius: 16, padding: "14px 18px", display: "flex", gap: 12, alignItems: "center" }}><span style={{ color: C.green, fontWeight: 900, fontSize: 16 }}>✓</span><span style={{ fontSize: 14, fontWeight: 600, color: C.greenInk }}>{t}</span></div>))}
                  <Btn onClick={next} style={{ marginTop: 4 }}>다음</Btn>
                </div>
              )}
            </>
          )}
          {step === 10 && (
            <div style={{ textAlign: "center", paddingTop: 6 }}>
              <Frog mood="excited" size={142} animate/>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.dark, marginTop: 6 }}>의뢰 공개 완료!</div>
              <div style={{ fontSize: 14, color: C.gray, marginTop: 6, marginBottom: 22, lineHeight: 1.7 }}>{d.fastMode ? "빠른의뢰로" : "안심의뢰로"} 등록됐어요{d.directMode ? " · 직거래 매수자에게도 노출돼요" : ""}<br/>집주인은 등록·노출 모두 무료예요!</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
                {[["중개사","0명"],["직거래","0건"],["경과","방금"]].map(([lb, v]) => (<div key={lb} style={{ flex: 1, background: G.card, borderRadius: 18, padding: "16px 8px", boxShadow: SH2 }}><div style={{ fontSize: 18, fontWeight: 800, color: C.greenInk }}>{v}</div><div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{lb}</div></div>))}
              </div>
              <Btn onClick={onClose}>내 매물 보기</Btn>
            </div>
          )}
        </Slide>
      </div>
    </div>
  );
}

// ===== 공용 매물 데이터 (지역/종류/좌표 포함) =====
// lat/lng는 미니 지도용 정규화 좌표(0~100). 실제 개발 시 위경도로 대체.
const PROPERTIES = [
  { id: "p1", region: "서초구", dong: "반포동", complex: "아이파크", propType: "빌라", dealType: "월세", price: "1억/74만", priceNum: 10000, area: 84, floor: 19, fee: "0.3%", fast: false, views: 30, ago: "12분 전", x: 51, y: 56, badge: null, status: "done", doneLabel: "임대완료", completedDaysAgo: 1 },
  { id: "p2", region: "영등포구", dong: "여의도동", complex: "더샵 2단지", propType: "토지", dealType: "매매", price: "22억 4,477만", priceNum: 224477, area: 133, floor: 2, fee: "0.5%", fast: false, views: 9, ago: "어제", x: 30, y: 50, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 4 },
  { id: "p3", region: "마포구", dong: "합정동", complex: "트리마제 1단지", propType: "아파트", dealType: "월세", price: "2,000/76만", priceNum: 2000, area: 133, floor: 19, fee: "0.6%", fast: true, views: 15, ago: "5일 전", x: 29, y: 28, badge: "HOT", status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p4", region: "용산구", dong: "청파동", complex: "아크로5차", propType: "상가", dealType: "월세", price: "1억/166만", priceNum: 10000, area: 84, floor: 10, fee: "0.4%", fast: false, views: 92, ago: "5시간 전", x: 48, y: 47, badge: null, status: "done", doneLabel: "임대완료", completedDaysAgo: 1 },
  { id: "p5", region: "강동구", dong: "둔촌동", complex: "푸르지오 1단지", propType: "오피스텔", dealType: "매매", price: "16억 9,608만", priceNum: 169608, area: 49, floor: 25, fee: "0.4%", fast: true, views: 65, ago: "3일 전", x: 81, y: 56, badge: "NEW", status: "done", doneLabel: "매도완료", completedDaysAgo: 3 },
  { id: "p6", region: "서초구", dong: "방배동", complex: "우성5차", propType: "상가", dealType: "월세", price: "1,000/73만", priceNum: 1000, area: 72, floor: 16, fee: "0.6%", fast: false, views: 10, ago: "2시간 전", x: 60, y: 56, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p7", region: "영등포구", dong: "문래동", complex: "센트럴파크2차", propType: "아파트", dealType: "전세", price: "10억 5,074만", priceNum: 105074, area: 45, floor: 16, fee: "0.3%", fast: true, views: 39, ago: "2일 전", x: 34, y: 52, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p8", region: "송파구", dong: "문정동", complex: "현대3차", propType: "빌라", dealType: "전세", price: "4억 2,947만", priceNum: 42947, area: 99, floor: 28, fee: "0.5%", fast: true, views: 56, ago: "32분 전", x: 76, y: 56, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p9", region: "송파구", dong: "문정동", complex: "더샵", propType: "아파트", dealType: "매매", price: "18억 7,130만", priceNum: 187130, area: 133, floor: 6, fee: "0.4%", fast: true, views: 21, ago: "5시간 전", x: 79, y: 56, badge: "NEW", status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p10", region: "마포구", dong: "합정동", complex: "아이파크5차", propType: "오피스텔", dealType: "월세", price: "1억/150만", priceNum: 10000, area: 99, floor: 13, fee: "0.5%", fast: true, views: 84, ago: "32분 전", x: 23, y: 35, badge: "NEW", status: "done", doneLabel: "임대완료", completedDaysAgo: 0 },
  { id: "p11", region: "송파구", dong: "가락동", complex: "푸르지오", propType: "오피스텔", dealType: "매매", price: "20억 8,578만", priceNum: 208578, area: 49, floor: 18, fee: "0.3%", fast: false, views: 81, ago: "32분 전", x: 79, y: 56, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0 },
  { id: "p12", region: "성동구", dong: "옥수동", complex: "갤러리아포레", propType: "오피스텔", dealType: "전세", price: "4억 119만", priceNum: 40119, area: 102, floor: 15, fee: "0.5%", fast: false, views: 13, ago: "2일 전", x: 63, y: 38, badge: null, status: "done", doneLabel: "전세완료", completedDaysAgo: 1 },
  { id: "p13", region: "마포구", dong: "합정동", complex: "한가람3차", propType: "아파트", dealType: "매매", price: "9억 8,430만", priceNum: 98430, area: 115, floor: 1, fee: "0.5%", fast: true, views: 85, ago: "5시간 전", x: 24, y: 36, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p14", region: "마포구", dong: "상암동", complex: "더샵 1단지", propType: "토지", dealType: "월세", price: "2,000/111만", priceNum: 2000, area: 99, floor: 24, fee: "0.4%", fast: true, views: 66, ago: "2시간 전", x: 20, y: 40, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p15", region: "강동구", dong: "둔촌동", complex: "개나리3차", propType: "아파트", dealType: "월세", price: "5,000/235만", priceNum: 5000, area: 84, floor: 12, fee: "0.3%", fast: true, views: 32, ago: "5일 전", x: 87, y: 53, badge: "NEW", status: "done", doneLabel: "임대완료", completedDaysAgo: 0 },
  { id: "p16", region: "강남구", dong: "개포동", complex: "푸르지오5차", propType: "상가", dealType: "매매", price: "26억 5,076만", priceNum: 265076, area: 59, floor: 16, fee: "0.4%", fast: true, views: 84, ago: "어제", x: 64, y: 56, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 3 },
  { id: "p17", region: "송파구", dong: "문정동", complex: "래미안2차", propType: "아파트", dealType: "매매", price: "21억 4,877만", priceNum: 214877, area: 102, floor: 26, fee: "0.6%", fast: true, views: 108, ago: "32분 전", x: 80, y: 56, badge: "HOT", status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p18", region: "마포구", dong: "공덕동", complex: "푸르지오 1단지", propType: "아파트", dealType: "월세", price: "2,000/161만", priceNum: 2000, area: 59, floor: 27, fee: "0.4%", fast: true, views: 30, ago: "5시간 전", x: 32, y: 37, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p19", region: "성동구", dong: "금호동", complex: "센트럴파크5차", propType: "토지", dealType: "매매", price: "23억 3,663만", priceNum: 233663, area: 133, floor: 27, fee: "0.5%", fast: true, views: 120, ago: "방금 전", x: 60, y: 42, badge: "HOT", status: "done", doneLabel: "매도완료", completedDaysAgo: 0 },
  { id: "p20", region: "강동구", dong: "천호동", complex: "e편한세상2차", propType: "오피스텔", dealType: "매매", price: "9억 7,108만", priceNum: 97108, area: 102, floor: 20, fee: "0.6%", fast: true, views: 10, ago: "2일 전", x: 88, y: 52, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p21", region: "송파구", dong: "송파동", complex: "힐스테이트3차", propType: "아파트", dealType: "매매", price: "7억 1,062만", priceNum: 71062, area: 45, floor: 17, fee: "0.5%", fast: false, views: 100, ago: "5일 전", x: 79, y: 56, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p22", region: "용산구", dong: "효창동", complex: "현대5차", propType: "빌라", dealType: "월세", price: "1억/113만", priceNum: 10000, area: 115, floor: 9, fee: "0.5%", fast: false, views: 28, ago: "5시간 전", x: 46, y: 47, badge: "NEW", status: "done", doneLabel: "임대완료", completedDaysAgo: 0 },
  { id: "p23", region: "송파구", dong: "문정동", complex: "힐스테이트 2단지", propType: "빌라", dealType: "매매", price: "13억 9,371만", priceNum: 139371, area: 45, floor: 25, fee: "0.4%", fast: false, views: 85, ago: "12분 전", x: 77, y: 56, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0 },
  { id: "p24", region: "영등포구", dong: "양평동", complex: "더샵2차", propType: "아파트", dealType: "월세", price: "5,000/181만", priceNum: 5000, area: 99, floor: 11, fee: "0.5%", fast: true, views: 43, ago: "3일 전", x: 28, y: 51, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p25", region: "강동구", dong: "명일동", complex: "아크로 1단지", propType: "상가", dealType: "월세", price: "1억/125만", priceNum: 10000, area: 115, floor: 3, fee: "0.3%", fast: false, views: 103, ago: "2시간 전", x: 81, y: 45, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p26", region: "성동구", dong: "성수동", complex: "e편한세상5차", propType: "토지", dealType: "월세", price: "3,000/153만", priceNum: 3000, area: 49, floor: 18, fee: "0.5%", fast: false, views: 92, ago: "32분 전", x: 64, y: 45, badge: null, status: "done", doneLabel: "임대완료", completedDaysAgo: 0 },
  { id: "p27", region: "영등포구", dong: "여의도동", complex: "자이3차", propType: "아파트", dealType: "매매", price: "8억 1,952만", priceNum: 81952, area: 133, floor: 28, fee: "0.4%", fast: true, views: 113, ago: "어제", x: 33, y: 54, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p28", region: "성동구", dong: "행당동", complex: "더샵", propType: "아파트", dealType: "월세", price: "2,000/117만", priceNum: 2000, area: 33, floor: 6, fee: "0.4%", fast: false, views: 83, ago: "2일 전", x: 55, y: 38, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p29", region: "마포구", dong: "상암동", complex: "리센츠", propType: "아파트", dealType: "매매", price: "6억 4,022만", priceNum: 64022, area: 33, floor: 24, fee: "0.5%", fast: false, views: 27, ago: "1주 전", x: 27, y: 29, badge: "HOT", status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p30", region: "영등포구", dong: "양평동", complex: "한가람3차", propType: "오피스텔", dealType: "전세", price: "11억 5,143만", priceNum: 115143, area: 59, floor: 8, fee: "0.4%", fast: true, views: 115, ago: "32분 전", x: 33, y: 46, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p31", region: "강남구", dong: "대치동", complex: "파크리오2차", propType: "상가", dealType: "월세", price: "1,000/71만", priceNum: 1000, area: 145, floor: 27, fee: "0.5%", fast: false, views: 88, ago: "방금 전", x: 69, y: 56, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p32", region: "강동구", dong: "천호동", complex: "엘스", propType: "아파트", dealType: "전세", price: "5억 9,503만", priceNum: 59503, area: 84, floor: 11, fee: "0.5%", fast: true, views: 7, ago: "5시간 전", x: 82, y: 44, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p33", region: "영등포구", dong: "여의도동", complex: "한가람 2단지", propType: "빌라", dealType: "전세", price: "5억 1,342만", priceNum: 51342, area: 59, floor: 17, fee: "0.3%", fast: true, views: 107, ago: "방금 전", x: 28, y: 52, badge: null, status: "done", doneLabel: "전세완료", completedDaysAgo: 2 },
  { id: "p34", region: "성동구", dong: "옥수동", complex: "우성 1단지", propType: "상가", dealType: "매매", price: "28억 3,673만", priceNum: 283673, area: 49, floor: 22, fee: "0.6%", fast: false, views: 79, ago: "32분 전", x: 63, y: 41, badge: "NEW", status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p35", region: "성동구", dong: "행당동", complex: "한가람 2단지", propType: "아파트", dealType: "월세", price: "5,000/237만", priceNum: 5000, area: 115, floor: 5, fee: "0.5%", fast: false, views: 75, ago: "1주 전", x: 61, y: 46, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p36", region: "용산구", dong: "이촌동", complex: "e편한세상 2단지", propType: "아파트", dealType: "매매", price: "15억 4,557만", priceNum: 154557, area: 45, floor: 13, fee: "0.5%", fast: false, views: 83, ago: "2일 전", x: 50, y: 43, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p37", region: "성동구", dong: "성수동", complex: "한가람 1단지", propType: "빌라", dealType: "매매", price: "8억 4,102만", priceNum: 84102, area: 145, floor: 17, fee: "0.3%", fast: false, views: 63, ago: "1시간 전", x: 56, y: 37, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p38", region: "용산구", dong: "청파동", complex: "자이5차", propType: "빌라", dealType: "전세", price: "11억 4,613만", priceNum: 114613, area: 72, floor: 25, fee: "0.3%", fast: false, views: 85, ago: "1주 전", x: 45, y: 44, badge: null, status: "done", doneLabel: "전세완료", completedDaysAgo: 0 },
  { id: "p39", region: "성동구", dong: "행당동", complex: "아이파크5차", propType: "아파트", dealType: "전세", price: "6억 228만", priceNum: 60228, area: 145, floor: 4, fee: "0.6%", fast: true, views: 65, ago: "2일 전", x: 56, y: 41, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p40", region: "강동구", dong: "고덕동", complex: "트리마제", propType: "오피스텔", dealType: "매매", price: "30억 5,433만", priceNum: 305433, area: 102, floor: 1, fee: "0.4%", fast: false, views: 107, ago: "어제", x: 87, y: 48, badge: "HOT", status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p41", region: "용산구", dong: "한남동", complex: "자이2차", propType: "아파트", dealType: "월세", price: "1억/117만", priceNum: 10000, area: 84, floor: 5, fee: "0.5%", fast: false, views: 68, ago: "1시간 전", x: 51, y: 45, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p42", region: "강동구", dong: "명일동", complex: "롯데캐슬", propType: "빌라", dealType: "매매", price: "30억 9,026만", priceNum: 309026, area: 102, floor: 22, fee: "0.5%", fast: true, views: 96, ago: "12분 전", x: 86, y: 49, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p43", region: "서초구", dong: "서초동", complex: "리버뷰", propType: "아파트", dealType: "전세", price: "5억 656만", priceNum: 50656, area: 33, floor: 24, fee: "0.4%", fast: true, views: 11, ago: "5시간 전", x: 59, y: 56, badge: "NEW", status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p44", region: "영등포구", dong: "문래동", complex: "푸르지오", propType: "토지", dealType: "월세", price: "3,000/212만", priceNum: 3000, area: 49, floor: 8, fee: "0.4%", fast: true, views: 43, ago: "방금 전", x: 40, y: 52, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p45", region: "영등포구", dong: "당산동", complex: "파크리오5차", propType: "상가", dealType: "매매", price: "22억 1,196만", priceNum: 221196, area: 49, floor: 21, fee: "0.4%", fast: false, views: 119, ago: "2시간 전", x: 34, y: 51, badge: "HOT", status: "done", doneLabel: "매도완료", completedDaysAgo: 1 },
  { id: "p46", region: "성동구", dong: "옥수동", complex: "리버뷰 2단지", propType: "상가", dealType: "월세", price: "2,000/127만", priceNum: 2000, area: 102, floor: 18, fee: "0.6%", fast: true, views: 24, ago: "3일 전", x: 64, y: 41, badge: null, status: "done", doneLabel: "임대완료", completedDaysAgo: 2 },
  { id: "p47", region: "용산구", dong: "청파동", complex: "파크리오2차", propType: "아파트", dealType: "전세", price: "9억 6,799만", priceNum: 96799, area: 59, floor: 8, fee: "0.3%", fast: true, views: 74, ago: "5일 전", x: 45, y: 44, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p48", region: "용산구", dong: "이촌동", complex: "파크리오 2단지", propType: "상가", dealType: "월세", price: "1억/103만", priceNum: 10000, area: 99, floor: 9, fee: "0.4%", fast: false, views: 66, ago: "1주 전", x: 45, y: 42, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p49", region: "용산구", dong: "이촌동", complex: "리버뷰5차", propType: "아파트", dealType: "매매", price: "22억 9,290만", priceNum: 229290, area: 102, floor: 14, fee: "0.4%", fast: false, views: 114, ago: "2일 전", x: 51, y: 52, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 1 },
  { id: "p50", region: "강동구", dong: "고덕동", complex: "한가람5차", propType: "아파트", dealType: "전세", price: "8억 3,844만", priceNum: 83844, area: 59, floor: 26, fee: "0.3%", fast: true, views: 22, ago: "1주 전", x: 81, y: 55, badge: "HOT", status: "active", doneLabel: "전세완료", completedDaysAgo: null },
];
const REGIONS = ["전체", "강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "성동구", "영등포구"];
const PROP_TYPES = ["전체", "아파트", "빌라", "오피스텔", "상가", "토지", "입주권", "분양권", "재개발"];

// ===== 완료 매물 처리 헬퍼 =====
// 완료 후 3일이 지나면 목록에서 자동으로 사라짐
const AUTO_HIDE_DAYS = 3;
const isDone = p => p.status === "done";
const isExpired = p => isDone(p) && p.completedDaysAgo != null && p.completedDaysAgo >= AUTO_HIDE_DAYS;
// 완료까지 남은 노출 일수 (3일째엔 "오늘 사라짐")
const daysLeft = p => Math.max(0, AUTO_HIDE_DAYS - (p.completedDaysAgo ?? 0));
// 상태 필터 ("거래중만" → active만, "완료 포함" → 만료 안 된 것 모두)
function applyStatusFilter(list, mode) {
  if (mode === "완료 포함") return list.filter(p => !isExpired(p));
  return list.filter(p => p.status === "active");
}
const STATUS_FILTERS = ["거래중만 보기", "완료 포함"];

// ===== 의뢰 기한 처리 헬퍼 =====
const DEFAULT_TERM_DAYS = 14;   // 기본 의뢰 기한 2주
const EXTEND_DAYS = 14;         // 원터치 연장 단위
const EXPIRE_SOON_DAYS = 3;     // 만료 임박 알림 기준
const termLeft = p => p.expiresInDays ?? DEFAULT_TERM_DAYS;       // 남은 기한(일)
const isExpiringSoon = p => p.status === "active" && termLeft(p) <= EXPIRE_SOON_DAYS; // 곧 만료
const termLabel = p => { const n = termLeft(p); return n <= 0 ? "기한 만료" : n === 1 ? "내일 만료" : `${n}일 남음`; };

// ===== 예상 중개 수수료 계산 =====
// 월세 가격문자열에서 월세액(만원) 파싱: "2,000/76만" → 76
function monthlyRent(p) {
  if (p.dealType !== "월세") return 0;
  const m = (p.price.split("/")[1] || "");
  return parseInt(m.replace(/[^0-9]/g, ""), 10) || 0;
}
// 수수료 산정 기준액(만원): 매매·전세는 거래가/보증금, 월세는 환산보증금(보증금 + 월세×100)
function feeBase(p) {
  if (p.dealType === "월세") return p.priceNum + monthlyRent(p) * 100;
  return p.priceNum;
}
// 예상 수수료(원) = 기준액(만원)×10000 × 요율상한
function estFee(p) {
  const rate = parseFloat(p.fee) / 100;
  return Math.round(feeBase(p) * 10000 * rate);
}
// 원 → 보기 좋은 한글 금액 ("약 OO만원" / "약 O억 O만원")
function wonText(n) {
  if (n >= 1e8) { const eok = Math.floor(n / 1e8); const man = Math.round((n % 1e8) / 1e4); return `${eok}억${man > 0 ? ` ${man.toLocaleString()}만` : ""}원`; }
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}
// 계산식 안내 문구 (툴팁/안내용)
function feeFormula(p) {
  if (p.dealType === "월세") return `(보증금 + 월세×100) ${feeBase(p).toLocaleString()}만원 × 상한 ${p.fee}`;
  return `${feeBase(p).toLocaleString()}만원 × 상한 ${p.fee}`;
}

// 예상 수수료 표시 줄 (금액 + 탭하면 계산식 안내)
function FeeEstimate({ listing, tone = "green", showDirectSaving = false }) {
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

// 완료 뱃지 (매도완료/전세완료/임대완료) + 색상
function DoneBadge({ label, tone = "gray" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EDEFEE", color: "#7B8580", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 8, letterSpacing: ".2px" }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: "#9AA8A0" }}/>{label}
    </span>
  );
}

// 연락함 뱃지 (이미 연락/문의한 매물·집주인 표시)
function ContactBadge({ label = "연락함", tone = "green" }) {
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  const soft = tone === "gold" ? C.goldSoft : C.greenSoft;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: soft, color: ink, fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 8 }}>
      <span style={{ fontSize: 10 }}>✓</span>{label}
    </span>
  );
}

// 인라인 메모: 평소엔 "메모" 버튼, 누르면 입력칸 펼침. 저장하면 메모 표시.
function NoteField({ value, onChange, tone = "green" }) {
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
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus placeholder="예: 집주인 친절함 · 5/30 통화 예정" rows={2} style={{ width: "100%", padding: "9px 11px", borderRadius: 10, border: `1.5px solid ${ink}`, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none", lineHeight: 1.5 }}/>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button onClick={save} style={{ flex: 1, padding: "8px 0", background: ink, border: "none", borderRadius: 9, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
        <button onClick={() => setOpen(false)} style={{ padding: "8px 14px", background: "#fff", border: `1px solid ${C.line}`, borderRadius: 9, color: C.gray, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
      </div>
    </div>
  );
}

// 정렬/필터 가로 스크롤 칩
function FilterChips({ options, value, onChange, tone = "green" }) {
  const col = tone === "gold" ? C.gold : C.green;
  const soft = tone === "gold" ? C.goldSoft : C.greenSoft;
  const ink = tone === "gold" ? C.goldInk : C.greenInk;
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
      {options.map(o => {
        const sel = value === o;
        return (
          <button key={o} onClick={() => onChange(o)} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${sel?col:C.line}`, background: sel?soft:C.card, color: sel?ink:C.mid, fontSize: 13, fontWeight: sel?700:500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{o}</button>
        );
      })}
    </div>
  );
}

// 미니 지도 (SVG, API 키 불필요) — 핀 탭하면 onPick
function MiniMap({ items, activeId, onPick, tone = "green" }) {
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
      <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: C.gray, background: "#ffffffcc", padding: "2px 8px", borderRadius: 10 }}>핀을 눌러 매물 보기</div>
    </div>
  );
}

const INTEREST_BROKERS = [
  { name: "김민준", office: "마포 스마트공인중개사", rate: 4.8, deals: 42, msg: "안녕하세요! 공덕동 전문입니다. 이번 달 동일 단지 2건 성사했어요!" },
  { name: "이수연", office: "공덕 부동산플러스", rate: 4.6, deals: 31, msg: "안녕하세요! 바이어 DB 보유 중이에요. 빠른 매도 자신 있습니다." },
  { name: "박지훈", office: "마포 한강공인중개사", rate: 4.5, deals: 28, msg: "직거래 연결도 도와드릴 수 있어요. 편하게 연락 주세요!" },
  { name: "최은영", office: "공덕역 으뜸부동산", rate: 4.9, deals: 56, msg: "현재 매수 대기 고객 3팀 있습니다. 바로 보여드릴 수 있어요." },
];
const DIRECT_BUYERS = [
  { name: "익명 매수자 A", note: "실거주 목적, 대출 사전심사 완료", when: "2시간 전", budget: "12억대 가능" },
  { name: "익명 매수자 B", note: "투자 목적, 현금 보유", when: "어제", budget: "13억까지" },
];

function ListSheet({ kind, onClose }) {
  const isBroker = kind === "broker";
  const items = isBroker ? INTEREST_BROKERS : DIRECT_BUYERS;
  return (
    <div style={{ position: "absolute", inset: 0, background: "#2A3A3255", zIndex: 50, display: "flex", alignItems: "flex-end", animation: "fadeIn .2s" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: G.pageBg, borderRadius: "26px 26px 0 0", width: "100%", maxHeight: "78%", overflowY: "auto", padding: "20px 18px 28px", boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Frog mood={isBroker ? "excited" : "love"} size={48}/>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{isBroker ? `중개 신청한 중개사 ${items.length}명` : `직거래 문의 ${items.length}건`}</div><div style={{ fontSize: 12, color: C.gray }}>{isBroker ? "마음에 드는 중개사를 골라보세요" : "직거래는 중개수수료가 없어요"}</div></div>
        </div>
        {isBroker ? items.map((b, i) => (
          <div key={i} style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: SH2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{b.name} 공인중개사</div><div style={{ fontSize: 12, color: C.gray }}>{b.office}</div></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 13, fontWeight: 700, color: C.goldInk }}>★ {b.rate}</div><div style={{ fontSize: 11, color: C.gray }}>거래 {b.deals}건</div></div>
            </div>
            <div style={{ background: G.greenSoft, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: C.mid, marginBottom: 10, lineHeight: 1.5 }}>"{b.msg}"</div>
            <button style={{ width: "100%", padding: "11px 0", background: G.header, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>전화 / 문자 연결</button>
          </div>
        )) : items.map((b, i) => (
          <div key={i} style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: SH2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{b.name}</div><div style={{ fontSize: 11, color: C.gray }}>{b.when}</div></div>
            <div style={{ fontSize: 13, color: C.mid, marginBottom: 4 }}>{b.note}</div>
            <div style={{ fontSize: 12, color: C.goldInk, fontWeight: 700, marginBottom: 10 }}>희망 예산: {b.budget}</div>
            <button style={{ width: "100%", padding: "11px 0", background: G.gold, border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>직거래 채팅하기 (중개수수료 0)</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ value, label, tone = "green", onClick }) {
  const ink = { green: C.greenInk, gold: C.goldInk, dark: C.dark }[tone];
  const clickable = !!onClick;
  return (
    <div onClick={onClick} style={{ background: G.card, borderRadius: 16, padding: "14px 10px", textAlign: "center", boxShadow: SH2, cursor: clickable ? "pointer" : "default", border: clickable ? `1.5px solid ${tone==="gold"?C.goldSoft:C.greenSoft}` : "none" }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: ink }}>{value}</div>
      <div style={{ fontSize: 11, color: clickable ? ink : C.gray, marginTop: 2, fontWeight: clickable ? 600 : 400 }}>{label}{clickable ? " ›" : ""}</div>
    </div>
  );
}

function Home({ onRegister, onMyList, role, onSwitchRole }) {
  const [sheet, setSheet] = useState(null);
  return (
    <div style={{ paddingBottom: 90, background: G.pageBg, minHeight: "100%", position: "relative" }}>
      {sheet && <ListSheet kind={sheet} onClose={() => setSheet(null)}/>}
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>집주인</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>집 내놓기</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} onClick={onSwitchRole}/>
            <Frog mood="calm" size={52}/>
          </div>
        </div>
        <div style={{ background: "#ffffff26", borderRadius: 18, padding: "16px 18px", border: "1px solid #ffffff33", backdropFilter: "blur(4px)" }}>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>내 집, 한 번에 알리기</div>
          <div style={{ color: "#ffffffd0", fontSize: 13, marginBottom: 14 }}>집주인은 100% 무료 · 중개사들이 먼저 연락해요</div>
          <button onClick={onRegister} style={{ width: "100%", padding: "13px 0", background: G.gold, border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 16px rgba(242,192,120,.4)" }}>매물 의뢰하기</button>
        </div>
      </div>
      <div style={{ padding: "18px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          <StatCard value="2건" label="내 의뢰" tone="green"/>
          <StatCard value={INTEREST_BROKERS.length + "명"} label="관심 중개사" tone="green" onClick={() => setSheet("broker")}/>
          <StatCard value={DIRECT_BUYERS.length + "건"} label="직거래 문의" tone="gold" onClick={() => setSheet("direct")}/>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>내 의뢰 매물</div>
          <button onClick={onMyList} style={{ background: "none", border: "none", color: C.greenInk, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>전체보기</button>
        </div>
        {[
          { type: "아파트 매매", addr: "마포구 공덕동 래미안5차", detail: "84㎡ · 18층", price: "12억 5,000만", status: "빠른의뢰", tone: "gold", brokers: 4, direct: 2, days: 12 },
          { type: "아파트 전세", addr: "송파구 잠실동 리센츠", detail: "59㎡ · 7층", price: "6억", status: "안심의뢰", tone: "green", brokers: 14, direct: 5, days: 5 },
        ].map((l, i) => (
          <div key={i} onClick={onMyList} style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 10, boxShadow: SH1, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div><div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{l.type}</div><div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{l.addr}</div><div style={{ fontSize: 12, color: C.gray }}>{l.detail}</div></div>
              <Tag tone={l.tone}>{l.status}</Tag>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginBottom: 10 }}>{l.price}</div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
              <span style={{ fontSize: 12, color: C.greenInk, fontWeight: 600 }}>중개사 {l.brokers}명</span>
              <span style={{ fontSize: 12, color: C.goldInk, fontWeight: 600 }}>직거래 {l.direct}건</span>
              <span style={{ fontSize: 12, color: C.gray }}>D-{l.days}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== 모달 본문들 (오버레이는 App이 그림 → 항상 화면 기준으로 뜸) =====
function EditMsgBody({ value, onSave, onClose }) {
  const [text, setText] = useState(value);
  const presets = ["안녕하세요! 해당 매물 빠른 거래 도와드리겠습니다.","인근 전문 중개사입니다. 바이어 DB 보유 중이에요.","관심 있습니다. 편하실 때 연락 부탁드려요!"];
  return (
    <div style={{ background: C.card, borderRadius: "26px 26px 0 0", width: "100%", padding: 24, boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><Frog mood="determined" size={42}/><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>기본 인사 메시지</div></div>
      <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>"중개할게요" 누르면 이 메시지가 자동 전송돼요</div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: "100%", padding: 14, borderRadius: 16, border: `1.5px solid ${C.green}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none", marginBottom: 12, background: G.greenSoft }}/>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 8 }}>빠른 선택</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {presets.map((p, i) => (<div key={i} onClick={() => setText(p)} style={{ padding: "10px 14px", borderRadius: 12, background: text===p?G.greenSoft:C.bg, border: `1.5px solid ${text===p?C.green:C.line}`, fontSize: 13, color: C.mid, cursor: "pointer" }}>{p}</div>))}
      </div>
      <Btn onClick={() => onSave(text)}>저장하기</Btn>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>닫기</button>
    </div>
  );
}

function ApplyMsgBody({ listing, defaultMsg, onConfirm, onClose }) {
  const [mode, setMode] = useState("saved");
  const [custom, setCustom] = useState("");
  const finalMsg = mode === "saved" ? defaultMsg : custom;
  const canSend = mode === "saved" || custom.trim().length > 0;
  return (
    <div style={{ background: C.card, borderRadius: "26px 26px 0 0", width: "100%", padding: 24, boxSizing: "border-box", animation: "sheetUp .3s " + spring, maxHeight: 720, overflowY: "auto" }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><Frog mood="pondering" size={44}/><div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>어떻게 인사할까요?</div><div style={{ fontSize: 12, color: C.gray }}>{listing.addr}</div></div></div>
      <div style={{ fontSize: 13, color: C.mid, margin: "12px 0 16px", background: G.greenSoft, borderRadius: 12, padding: "10px 14px", lineHeight: 1.6 }}>채팅 신청 시 <b style={{ color: C.greenInk }}>1,000P</b>가 차감돼요. 집주인이 메시지를 보고 마음에 들면 먼저 연락해요.</div>
      <div onClick={() => setMode("saved")} style={{ borderRadius: 18, border: `2px solid ${mode==="saved"?C.green:C.line}`, background: mode==="saved"?G.greenSoft:C.card, padding: 16, marginBottom: 10, cursor: "pointer", transition: "all .15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${mode==="saved"?C.green:C.gray}`, background: mode==="saved"?C.green:"transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{mode==="saved" && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: mode==="saved"?C.greenInk:C.dark }}>저장된 인사말 사용</span>
        </div>
        <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.5, background: "#ffffffcc", borderRadius: 10, padding: "10px 12px" }}>"{defaultMsg}"</div>
      </div>
      <div onClick={() => setMode("custom")} style={{ borderRadius: 18, border: `2px solid ${mode==="custom"?C.green:C.line}`, background: mode==="custom"?G.greenSoft:C.card, padding: 16, marginBottom: 18, cursor: "pointer", transition: "all .15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${mode==="custom"?C.green:C.gray}`, background: mode==="custom"?C.green:"transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{mode==="custom" && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: mode==="custom"?C.greenInk:C.dark }}>새 메시지 직접 입력</span>
        </div>
        {mode === "custom" && (
          <textarea autoFocus value={custom} onClick={e => e.stopPropagation()} onChange={e => setCustom(e.target.value)} rows={3} placeholder="이 매물에 맞는 인사말을 직접 작성해 보세요" style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.green}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none", background: "#fff" }}/>
        )}
      </div>
      <Btn onClick={canSend ? () => onConfirm(finalMsg) : null} disabled={!canSend}>채팅 신청하기 (-1,000P)</Btn>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>취소</button>
    </div>
  );
}

function PayBody({ listing, onConfirm, onClose }) {
  return (
    <div style={{ background: C.card, borderRadius: "26px 26px 0 0", width: "100%", padding: 24, boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><Frog mood="love" size={44}/><div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>직거래 매물 열람</div><div style={{ fontSize: 12, color: C.gray }}>{listing.region} {listing.dong} {listing.complex}</div></div></div>
      <div style={{ background: G.goldSoft, borderRadius: 14, padding: "14px 16px", margin: "14px 0", lineHeight: 1.7 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: C.mid }}>열람 비용</span><span style={{ fontWeight: 800, color: C.goldInk }}>10,000원</span></div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>집주인 연락처와 상세 정보가 공개돼요. 중개수수료 없이 직접 거래할 수 있어요.</div>
      </div>
      <Btn variant="gold" onClick={onConfirm}>10,000원 결제하고 열람하기</Btn>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>취소</button>
    </div>
  );
}

function Broker({ properties = PROPERTIES, role, onSwitchRole, onOpenChat, openModal }) {
  const [points, setPoints] = useState(50000);
  const [contacted, setContacted] = useState({});
  const [defaultMsg, setDefaultMsg] = useState("안녕하세요! 해당 매물 빠른 거래 도와드리겠습니다.");
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState("new");        // new | viewed
  const [region, setRegion] = useState("전체");
  const [ptype, setPtype] = useState("전체");
  const [sort, setSort] = useState("최신순");
  const [statusFilter, setStatusFilter] = useState("거래중만 보기"); // 기본: 거래중인 매물만
  const [viewed, setViewed] = useState({});      // 내가 열람한 매물 기록 {id: timestamp}
  const [notes, setNotes] = useState({});        // 매물별 메모 {id: text}
  const [activeId, setActiveId] = useState(null);
  const tier = "골드";
  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 2000); };
  const markViewed = id => setViewed(v => v[id] ? v : ({ ...v, [id]: "방금" }));

  const handleFast = l => { setPoints(p => p - 2000); setContacted(c => ({ ...c, [l.id]: true })); markViewed(l.id); showToast("번호 공개됨 · 2,000P 차감"); };
  const openApply = l => openModal({ type: "apply", payload: { ...l, addr: `${l.region} ${l.dong} ${l.complex}` }, defaultMsg, onConfirm: () => { setPoints(p => p - 1000); setContacted(c => ({ ...c, [l.id]: true })); markViewed(l.id); showToast("채팅 전송됨 · 1,000P 차감"); } });
  const openEdit = () => openModal({ type: "editMsg", payload: defaultMsg, onConfirm: m => { setDefaultMsg(m); showToast("기본 메시지 저장됨"); } });

  // 필터 + 정렬 (상태 필터 적용: 기본은 거래중만, "완료 포함" 시 만료 안 된 완료건도 노출)
  let list = properties.filter(p => (region === "전체" || p.region === region) && (ptype === "전체" || p.propType === ptype));
  list = applyStatusFilter(list, statusFilter);
  if (sort === "낮은가격순") list = [...list].sort((a, b) => a.priceNum - b.priceNum);
  else if (sort === "높은가격순") list = [...list].sort((a, b) => b.priceNum - a.priceNum);
  else if (sort === "수수료높은순") list = [...list].sort((a, b) => estFee(b) - estFee(a));
  // 열람한 매물: 만료(3일경과)된 완료건은 정리되어 사라짐
  const viewedList = properties.filter(p => viewed[p.id] && !isExpired(p));

  const Card = l => {
    const hi = activeId === l.id;
    const done = isDone(l);
    const left = daysLeft(l);
    return (
      <div key={l.id} style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: hi?"0 0 0 2px "+C.green+", "+SH1:SH1, transition: "box-shadow .2s", opacity: done?0.78:1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {done ? <DoneBadge label={l.doneLabel}/> : (l.badge && <Tag tone={l.badge==="NEW"?"green":"gold"}>{l.badge}</Tag>)}
            {!done && contacted[l.id] && <ContactBadge label="연락함" tone={l.fast ? "gold" : "green"}/>}
            <span style={{ fontSize: 11, color: C.gray }}>{l.ago}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: l.fast ? C.goldInk : C.greenInk }}>{l.fast ? "빠른의뢰" : "안심의뢰"}</span>
        </div>
        <div style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>{l.region} {l.dong} · {l.propType} {l.dealType}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{l.complex}</div>
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{l.area}㎡ · {l.floor}층</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginBottom: 6 }}>{l.price}</div>
        <div style={{ display: "flex", gap: 14, marginBottom: 12, fontSize: 12, color: C.gray }}>
          <span>👁 열람 {l.views}회</span>
          <span>수수료 상한 {l.fee}</span>
          {!done && <span style={{ color: l.fast ? C.goldInk : C.greenInk, fontWeight: 600 }}>{l.fast ? "2,000P" : "1,000P"}</span>}
        </div>
        {!done && <FeeEstimate listing={l} tone={l.fast ? "gold" : "green"}/>}
        {done ? (
          <div style={{ background: "#F2F4F3", borderRadius: 12, padding: "11px 14px", textAlign: "center", color: "#7B8580", fontWeight: 700, fontSize: 13 }}>
            거래가 완료된 매물이에요 · {left === 0 ? "오늘 목록에서 사라져요" : `${left}일 후 목록에서 사라져요`}
          </div>
        ) : contacted[l.id] ? (
          <div onClick={() => onOpenChat && onOpenChat(l)} style={{ background: G.greenSoft, borderRadius: 12, padding: "12px 0", textAlign: "center", color: C.greenInk, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{l.fast ? "010-●●●●-●●●● · 연락하기" : "채팅방 열기 · 응답 대기 중"}</div>
        ) : (
          <button onClick={() => { if (l.fast) handleFast(l); else openApply(l); }} style={{ width: "100%", padding: "13px 0", background: l.fast ? G.gold : G.header, border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>{l.fast ? "번호 확인하기 (-2,000P)" : "중개할게요 · 채팅 신청"}</button>
        )}
        <NoteField value={notes[l.id]} onChange={t => setNotes(n => ({ ...n, [l.id]: t }))} tone={l.fast ? "gold" : "green"}/>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: 90, background: G.pageBg, minHeight: "100%", position: "relative" }}>
      {toast && <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#3A4A42ee", color: "#fff", padding: "10px 18px", borderRadius: 20, fontSize: 13, zIndex: 60, animation: "fadeIn .2s", boxShadow: SH1 }}>{toast}</div>}
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>공인중개사</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>의뢰받은 매물</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} onClick={onSwitchRole}/>
            <Frog mood="smug" size={52}/>
          </div>
        </div>
        <div style={{ background: "#ffffff26", borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #ffffff33" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 11 }}>보유 포인트 · 유효기간 3년</div><div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>{points.toLocaleString()}P</div></div>
          <button style={{ background: G.gold, border: "none", borderRadius: 12, padding: "8px 16px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>충전하기</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <span style={{ background: "#ffffff2e", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20 }}>구독: {tier} 등급</span>
          <span style={{ background: "#ffffff2e", color: "#fff", fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>신규매물 즉시알림</span>
        </div>
      </div>
      {/* 신규 / 열람한 매물 탭 */}
      <div style={{ display: "flex", gap: 8, padding: "14px 16px 0" }}>
        {[["new","신규 매물"],["viewed",`열람한 매물 ${viewedList.length>0?`(${viewedList.length})`:""}`]].map(([k, lb]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: "10px 0", borderRadius: 14, border: "none", background: tab===k?G.header:C.card, color: tab===k?"#fff":C.mid, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: tab===k?"none":SH2 }}>{lb}</button>
        ))}
      </div>
      <div style={{ padding: "14px 16px 0" }}>
        <div onClick={openEdit} style={{ background: G.greenSoft, borderRadius: 18, padding: "14px 16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer", boxShadow: SH2 }}>
          <Frog mood="determined" size={42}/>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: C.greenInk }}>기본 인사 메시지</div><div style={{ fontSize: 12, color: C.mid, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{defaultMsg}"</div></div>
          <span style={{ color: C.greenInk, fontSize: 18 }}>›</span>
        </div>
        {tab === "new" ? (
          <>
            <MiniMap items={list} activeId={activeId} onPick={setActiveId} tone="green"/>
            <div style={{ marginBottom: 8 }}><FilterChips options={REGIONS} value={region} onChange={setRegion}/></div>
            <div style={{ marginBottom: 8 }}><FilterChips options={PROP_TYPES} value={ptype} onChange={setPtype}/></div>
            <div style={{ marginBottom: 8 }}><FilterChips options={["최신순","낮은가격순","높은가격순","수수료높은순"]} value={sort} onChange={setSort}/></div>
            <div style={{ marginBottom: 14 }}><FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter}/></div>
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 10 }}>총 {list.length}건{statusFilter === "완료 포함" && <span style={{ color: C.gray }}> · 완료 매물은 3일 후 자동 정리</span>}</div>
            {list.map(Card)}
          </>
        ) : (
          <>
            {viewedList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <Frog mood="sleepy" size={90} animate/>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginTop: 8 }}>아직 열람한 매물이 없어요</div>
                <div style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>신규 매물에서 번호 공개나 채팅 신청을 하면<br/>여기에 기록돼요</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: C.gray, marginBottom: 10 }}>내가 연락한 매물 {viewedList.length}건 · 완료된 거래는 3일 뒤 정리돼요</div>
                {viewedList.map(Card)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ===== 채팅 데이터 =====
const CHATS = [
  { id: "c1", name: "김민준 공인중개사", office: "마포 스마트공인중개사", rate: 4.8, property: "마포구 공덕동 래미안5차 · 84㎡", unread: 2, mode: "안심의뢰",
    messages: [
      { from: "broker", text: "안녕하세요! 해당 매물 빠른 거래 도와드리겠습니다.", time: "오후 2:14", isDefault: true },
      { from: "broker", text: "현재 매수 대기 고객 2팀 있어서 이번 주 내 보여드릴 수 있어요.", time: "오후 2:15" },
      { from: "me", text: "네 안녕하세요, 주말에도 집 보여드릴 수 있어요.", time: "오후 2:20" },
      { from: "broker", text: "감사합니다! 토요일 오후 2시쯤 방문 가능할까요?", time: "오후 2:21" },
    ] },
  { id: "c2", name: "최은영 공인중개사", office: "공덕역 으뜸부동산", rate: 4.9, property: "송파구 잠실동 리센츠 · 59㎡", unread: 0, mode: "안심의뢰",
    messages: [
      { from: "broker", text: "관심 있습니다. 편하실 때 연락 부탁드려요!", time: "오전 11:02", isDefault: true },
      { from: "me", text: "전세 만기가 9월이라 그 전에 계약 원해요.", time: "오전 11:30" },
    ] },
  { id: "c3", name: "익명 매수자 A", office: "직거래 문의", rate: null, property: "마포구 공덕동 래미안5차 · 84㎡", unread: 1, mode: "직거래",
    messages: [
      { from: "broker", text: "실거주 목적입니다. 대출 사전심사 완료했어요.", time: "오후 5:40" },
    ] },
];

function ChatList({ onOpen, role, onSwitchRole }) {
  return (
    <div style={{ paddingBottom: 90, background: G.pageBg, minHeight: "100%" }}>
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>진행 중인 대화 {CHATS.length}건</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>채팅</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} onClick={onSwitchRole}/>
            <Frog mood="joyful" size={52}/>
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        {CHATS.map(c => (
          <div key={c.id} onClick={() => onOpen(c.id)} style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: SH2, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: c.mode==="직거래"?G.goldSoft:G.greenSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Frog mood={c.mode==="직거래"?"love":"calm"} size={38}/></div>
              {c.unread > 0 && <div style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: "#E8847C", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{c.unread}</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{c.name}</span><Tag tone={c.mode==="직거래"?"gold":"green"}>{c.mode}</Tag></div>
              <div style={{ fontSize: 12, color: C.gray, margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.property}</div>
              <div style={{ fontSize: 13, color: c.unread>0?C.dark:C.gray, fontWeight: c.unread>0?600:400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.messages[c.messages.length-1].text}</div>
            </div>
            <span style={{ fontSize: 18, color: "#CBD5CD" }}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatRoom({ chatId, onBack }) {
  const chat = CHATS.find(c => c.id === chatId) || CHATS[0];
  const [msgs, setMsgs] = useState(chat.messages);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = () => {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    setMsgs(m => [...m, { from: "me", text: input, time: now }]);
    setInput("");
    // 데모: 상대 자동 응답
    setTimeout(() => {
      setMsgs(m => [...m, { from: "broker", text: "네, 확인했습니다! 곧 다시 연락드릴게요.", time: now }]);
    }, 1100);
  };
  const isDirect = chat.mode === "직거래";
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: G.pageBg }}>
      {/* 헤더 */}
      <div style={{ background: G.header, padding: "44px 16px 14px", flexShrink: 0, boxShadow: "0 4px 16px rgba(111,184,148,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", padding: 0 }}>←</button>
          <Frog mood={isDirect?"love":"calm"} size={40}/>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{chat.name}</div>
            <div style={{ color: "#ffffffcc", fontSize: 11 }}>{chat.office}{chat.rate ? ` · ★ ${chat.rate}` : ""}</div>
          </div>
        </div>
        <div style={{ background: "#ffffff26", borderRadius: 12, padding: "8px 12px", marginTop: 12, fontSize: 12, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: .85 }}>매물</span><span style={{ fontWeight: 600 }}>{chat.property}</span>
        </div>
      </div>
      {/* 메시지 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center", fontSize: 11, color: C.gray, background: "#ffffffcc", borderRadius: 12, padding: "6px 12px", alignSelf: "center", marginBottom: 4 }}>{isDirect ? "직거래 채팅 · 중개수수료 없음" : "안심의뢰 채팅 · 번호는 서로 비공개예요"}</div>
        {msgs.map((m, i) => m.from === "me" ? (
          <div key={i} style={{ alignSelf: "flex-end", maxWidth: "76%" }}>
            <div style={{ background: G.header, color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.5, boxShadow: SH2 }}>{m.text}</div>
            <div style={{ fontSize: 10, color: C.gray, textAlign: "right", marginTop: 3 }}>{m.time}</div>
          </div>
        ) : (
          <div key={i} style={{ alignSelf: "flex-start", maxWidth: "78%", display: "flex", gap: 8 }}>
            <Frog mood={isDirect?"love":"calm"} size={30}/>
            <div>
              <div style={{ background: "#fff", color: C.dark, padding: "10px 14px", borderRadius: "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.5, boxShadow: SH2 }}>{m.text}</div>
              <div style={{ fontSize: 10, color: C.gray, marginTop: 3, display: "flex", gap: 6 }}>{m.time}{m.isDefault && <span style={{ color: C.greenInk }}>· 기본 인사말</span>}</div>
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      {/* 입력 */}
      <div style={{ flexShrink: 0, padding: "10px 14px", background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="메시지 입력..." style={{ flex: 1, padding: "12px 16px", borderRadius: 22, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "inherit", outline: "none", background: G.bg }}/>
        <button onClick={send} style={{ width: 44, height: 44, borderRadius: 22, border: "none", background: G.header, color: "#fff", fontSize: 18, cursor: "pointer", flexShrink: 0 }}>↑</button>
      </div>
    </div>
  );
}

// ===== 중개사 구독 등급 안내 =====
// ===== 매수자: 직거래 매물 탐색 (지역 정렬 + 지도 + 열람 1만원) =====
function BuyerExplore({ properties = PROPERTIES, onSwitchRole, viewerRole = "buyer", openModal }) {
  const [region, setRegion] = useState("전체");
  const [ptype, setPtype] = useState("전체");
  const [sort, setSort] = useState("최신순");
  const [statusFilter, setStatusFilter] = useState("거래중만 보기"); // 기본: 거래중인 매물만
  const [activeId, setActiveId] = useState(null);
  const [unlocked, setUnlocked] = useState({});
  const [notes, setNotes] = useState({});        // 매물별 메모
  const [toast, setToast] = useState("");
  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 2000); };

  let list = properties.filter(p => (region === "전체" || p.region === region) && (ptype === "전체" || p.propType === ptype));
  list = applyStatusFilter(list, statusFilter);
  if (sort === "낮은가격순") list = [...list].sort((a, b) => a.priceNum - b.priceNum);
  else if (sort === "높은가격순") list = [...list].sort((a, b) => b.priceNum - a.priceNum);
  else if (sort === "인기순") list = [...list].sort((a, b) => b.views - a.views);

  const openPay = p => openModal({ type: "pay", payload: p, onConfirm: () => { setUnlocked(u => ({ ...u, [p.id]: true })); showToast("결제 완료 · 연락처가 공개됐어요"); } });

  return (
    <div style={{ paddingBottom: 90, background: G.pageBg, minHeight: "100%", position: "relative" }}>
      {toast && <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#3A4A42ee", color: "#fff", padding: "10px 18px", borderRadius: 20, fontSize: 13, zIndex: 60, animation: "fadeIn .2s", boxShadow: SH1 }}>{toast}</div>}
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#ffffffcc", fontSize: 13 }}>{viewerRole === "owner" ? "집주인 · 시세 참고" : viewerRole === "broker" ? "공인중개사 · 시장 보기" : "직거래 매수자"}</div>
            <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>직거래 매물</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={viewerRole} onClick={onSwitchRole}/>
            <Frog mood="cool" size={52}/>
          </div>
        </div>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        <MiniMap items={list} activeId={activeId} onPick={setActiveId} tone="gold"/>
        <div style={{ marginBottom: 8 }}><FilterChips options={REGIONS} value={region} onChange={setRegion} tone="gold"/></div>
        <div style={{ marginBottom: 8 }}><FilterChips options={PROP_TYPES} value={ptype} onChange={setPtype} tone="gold"/></div>
        <div style={{ marginBottom: 8 }}><FilterChips options={["최신순","낮은가격순","높은가격순","인기순"]} value={sort} onChange={setSort} tone="gold"/></div>
        <div style={{ marginBottom: 14 }}><FilterChips options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} tone="gold"/></div>
        <div style={{ fontSize: 13, color: C.gray, marginBottom: 10 }}>총 {list.length}건</div>
        {list.map(p => {
          const open = unlocked[p.id];
          const hi = activeId === p.id;
          const done = isDone(p);
          const left = daysLeft(p);
          return (
            <div key={p.id} style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: hi?"0 0 0 2px "+C.gold+", "+SH1:SH1, transition: "box-shadow .2s", opacity: done?0.78:1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{done ? <DoneBadge label={p.doneLabel}/> : (p.badge && <Tag tone={p.badge==="NEW"?"green":"gold"}>{p.badge}</Tag>)}{!done && open && <ContactBadge label="연락함" tone="gold"/>}<span style={{ fontSize: 11, color: C.gray }}>{p.ago}</span></div>
                <span style={{ fontSize: 11, color: C.gray }}>👁 {p.views}</span>
              </div>
              <div style={{ fontSize: 11, color: C.gray, marginBottom: 2 }}>{p.region} {p.dong} · {p.propType} {p.dealType}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{p.complex}</div>
              <div style={{ fontSize: 12, color: C.gray, marginBottom: 8 }}>{p.area}㎡ · {p.floor}층</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.dark, marginBottom: 12 }}>{p.price}</div>
              {done ? (
                <div style={{ background: "#F2F4F3", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#7B8580", fontWeight: 700, textAlign: "center" }}>거래 완료된 매물 · {left === 0 ? "오늘 목록에서 사라져요" : `${left}일 후 사라져요`}</div>
              ) : open ? (
                <div style={{ background: G.greenSoft, borderRadius: 12, padding: "12px 14px", fontSize: 13, color: C.greenInk, fontWeight: 700, textAlign: "center" }}>집주인 010-1234-5678 · 직접 연락 가능</div>
              ) : (
                <button onClick={() => openPay(p)} style={{ width: "100%", padding: "13px 0", background: G.gold, border: "none", borderRadius: 14, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>연락처 열람 (10,000원)</button>
              )}
              {!done && <NoteField value={notes[p.id]} onChange={t => setNotes(n => ({ ...n, [p.id]: t }))} tone="gold"/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Subscription({ onSwitchRole }) {
  const [picked, setPicked] = useState("골드");
  const tiers = [
    { name: "무료", price: "0원", color: C.gray, soft: "#F0F2F0", feats: ["기본 매물 조회 (일 10건)", "빠른의뢰 2,000P · 안심의뢰 1,000P", "포인트 충전"], note: null },
    { name: "실버", price: "9,900원", color: C.green, soft: C.greenSoft, feats: ["신규 매물 30분 먼저 받기", "빠른의뢰 1,500P · 안심의뢰 700P", "매달 5,000P 지급", "조회 무제한"], note: "월 30건 거래 시 약 9,000원 절약" },
    { name: "골드", price: "29,000원", color: C.gold, soft: C.goldSoft, feats: ["신규 매물 즉시 알림", "매물 목록 상단 노출", "빠른의뢰 1,000P · 안심의뢰 500P", "매달 15,000P 지급", "인사말 A/B 테스트 · 거래 통계"], note: "월 30건 거래 시 약 22,000원 절약" },
  ];
  return (
    <div style={{ paddingBottom: 90, background: G.pageBg, minHeight: "100%" }}>
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>공인중개사 멤버십</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>구독 등급</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role="broker" onClick={onSwitchRole}/>
            <Frog mood="smug" size={52}/>
          </div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {tiers.map(t => {
          const sel = picked === t.name;
          return (
            <div key={t.name} onClick={() => setPicked(t.name)} style={{ background: sel ? t.soft : G.card, borderRadius: 20, padding: 18, marginBottom: 12, border: `2px solid ${sel?t.color:C.line}`, cursor: "pointer", boxShadow: sel?"none":SH2, transition: "all .15s" }}>
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

function MyList({ properties = [], onRegister, onSetDone, onExtendTerm, role, onSwitchRole }) {
  const [view, setView] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState("");
  const [notes, setNotes] = useState({});        // 매물별 메모 {id: text}
  const showToast = m => { setToast(m); setTimeout(() => setToast(""), 2200); };
  // 기존 데모 매물 (상세 통계·열람내역 보유). 자체 dealState로 완료 토글.
  const [demoListings, setDemoListings] = useState([
    { id: "demo1", type: "아파트 매매", dealType: "매매", region: "마포구", dong: "공덕동", addr: "마포구 공덕동 래미안5차", detail: "84㎡ · 18층 · 남향", price: "12억 5,000만", priceNum: 125000, fee: "0.4%", status: "빠른의뢰", tone: "gold", fast: true, brokers: 4, direct: 2, days: 12, views: 24, dealState: "active", doneLabel: "매도완료",
      viewLog: [
        { name: "최은영 공인중개사", office: "공덕역 으뜸부동산", when: "방금", sec: 135 },
        { name: "김민준 공인중개사", office: "마포 스마트공인중개사", when: "12분 전", sec: 95 },
        { name: "박지훈 공인중개사", office: "마포 한강공인중개사", when: "1시간 전", sec: 42 },
        { name: "이수연 공인중개사", office: "공덕 부동산플러스", when: "3시간 전", sec: 18 },
      ] },
    { id: "demo2", type: "아파트 전세", dealType: "전세", region: "송파구", dong: "잠실동", addr: "송파구 잠실동 리센츠", detail: "59㎡ · 7층 · 동향", price: "6억", priceNum: 60000, fee: "0.3%", status: "안심의뢰", tone: "green", fast: false, brokers: 14, direct: 5, days: 2, views: 41, dealState: "active", doneLabel: "전세완료",
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
    detail: `${p.area}㎡ · ${p.floor}층`, price: p.price, priceNum: p.priceNum, fee: p.fee,
    status: p.fast ? "빠른의뢰" : "안심의뢰", tone: p.fast ? "gold" : "green", fast: p.fast,
    brokers: 0, direct: 0, days: p.expiresInDays ?? 14, views: p.views,
    dealState: p.status, doneLabel: p.doneLabel, fromStore: true,
    viewLog: [],
  }));
  // 새 등록분이 위로, 그 다음 데모
  const listings = [...mine, ...demoListings];
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
  if (view !== null) {
    const l = listings[view];
    if (!l) { setView(null); return null; }
    const done = l.dealState === "done";
    return (
      <div style={{ paddingBottom: 90, background: G.pageBg, minHeight: "100%", position: "relative" }}>
        {toast && <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", background: "#3A4A42ee", color: "#fff", padding: "10px 18px", borderRadius: 20, fontSize: 13, zIndex: 60, animation: "fadeIn .2s", boxShadow: SH1, textAlign: "center", maxWidth: "88%" }}>{toast}</div>}
        {sheet && <ListSheet kind={sheet} onClose={() => setSheet(null)}/>}
        <div style={{ background: G.header, padding: "46px 20px 22px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
          <button onClick={() => setView(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", padding: 0, marginBottom: 8 }}>←</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{l.addr}</div>
            {done && <span style={{ background: "#ffffff2e", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 8 }}>{l.doneLabel}</span>}
          </div>
          <div style={{ color: "#ffffffcc", fontSize: 13 }}>{l.type} · {l.detail}</div>
          <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginTop: 8 }}>{l.price}</div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <StatCard value={l.views + "회"} label="총 열람" tone="dark"/>
            <StatCard value={l.brokers + "명"} label="관심 중개사" tone="green" onClick={() => setSheet("broker")}/>
            <StatCard value={l.direct + "건"} label="직거래 문의" tone="gold" onClick={() => setSheet("direct")}/>
            <StatCard value={l.fee} label="수수료 상한" tone="dark"/>
          </div>
          <FeeEstimate listing={l} tone={l.tone} showDirectSaving/>
          {/* 거래 완료 처리 */}
          {done ? (
            <div style={{ background: "#F2F4F3", borderRadius: 18, padding: "16px", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", boxShadow: SH2 }}>
              <Frog mood="joyful" size={42}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#5E6B64" }}>{l.doneLabel} 처리됨</div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>중개사·매수자 화면에서 완료로 표시되며, 3일 후 목록에서 자동 정리돼요</div>
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
            <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.6 }}>위 카드를 누르면 <b style={{ color: C.greenInk }}>관심 중개사</b>와 <b style={{ color: C.goldInk }}>직거래 문의</b> 목록을 볼 수 있어요</div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ paddingBottom: 90, background: G.pageBg, minHeight: "100%" }}>
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>집주인</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>내 의뢰 매물</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} onClick={onSwitchRole}/>
            <Frog mood="calm" size={52}/>
          </div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {listings.map((l, i) => {
          const done = l.dealState === "done";
          const soon = !done && (l.days ?? 14) <= 3;   // 만료 임박
          return (
          <div key={i} onClick={() => setView(i)} style={{ background: G.card, borderRadius: 20, padding: 18, marginBottom: 12, boxShadow: soon ? "0 0 0 1.5px "+C.gold+", "+SH1 : SH1, cursor: "pointer", opacity: done?0.82:1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <div><div style={{ fontSize: 11, color: C.gray, marginBottom: 3 }}>{l.type}</div><div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{l.addr}</div><div style={{ fontSize: 12, color: C.gray }}>{l.detail}</div></div>
              {done ? <DoneBadge label={l.doneLabel}/> : <Tag tone={l.tone}>{l.status}</Tag>}
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
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [role, setRole] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [modal, setModal] = useState(null); // { type, payload, onConfirm }
  // ===== 공용 매물 store (owner/broker/buyer가 같은 데이터를 봄) =====
  const [properties, setProperties] = useState(PROPERTIES);
  // 등록 완료 시 새 매물을 목록 맨 앞에 추가 (mine: true → 내 매물)
  const addProperty = p => setProperties(prev => [{ ...p, mine: true }, ...prev]);
  // 거래 완료/되돌리기 토글
  const setDealDone = (id, done) => setProperties(prev => prev.map(p => p.id === id ? { ...p, status: done ? "done" : "active", completedDaysAgo: done ? 0 : null } : p));
  // 의뢰 기한 2주 연장
  const extendTerm = id => setProperties(prev => prev.map(p => p.id === id ? { ...p, expiresInDays: (p.expiresInDays ?? 14) + 14 } : p));
  const closeModal = () => setModal(null);
  const switchRole = () => {
    const order = ["owner", "broker", "buyer"];
    const nr = order[(order.indexOf(role) + 1) % 3];
    setRole(nr);
    setModal(null);
    setScreen(nr === "broker" ? "broker" : nr === "buyer" ? "buyer" : "home");
  };
  const openChat = id => { setActiveChat(id); setScreen("chatroom"); };
  const totalUnread = CHATS.reduce((s, c) => s + c.unread, 0);
  const ownerTabs = [{ k: "home", label: "홈" }, { k: "register", label: "의뢰하기" }, { k: "direct", label: "직거래" }, { k: "chatlist", label: "채팅", badge: totalUnread }, { k: "mylist", label: "내 매물" }];
  const brokerTabs = [{ k: "broker", label: "매물 알림" }, { k: "direct", label: "직거래" }, { k: "chatlist", label: "채팅", badge: totalUnread }, { k: "profile", label: "구독" }];
  const buyerTabs = [{ k: "buyer", label: "직거래 매물" }, { k: "chatlist", label: "채팅", badge: totalUnread }];
  const tabs = role === "broker" ? brokerTabs : role === "buyer" ? buyerTabs : ownerTabs;
  const noTab = ["splash", "login", "role", "register", "chatroom"].includes(screen);
  const lightHeader = ["login", "role"].includes(screen);
  // 탭 아이콘: 미니멀 도형
  const TabIcon = ({ active }) => (<div style={{ width: 18, height: 18, borderRadius: 6, background: active ? C.green : "transparent", border: `2px solid ${active ? C.green : C.gray}`, transition: "all .15s" }}/>);
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "16px 0", boxSizing: "border-box", overflowY: "auto", background: "linear-gradient(135deg,#D6EEDD,#C5E6D2)", fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif" }}>
      <style>{`
        @keyframes frogPop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes slideNext{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slidePrev{from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        *{-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
      `}</style>
      <div style={{ width: 393, height: 852, flexShrink: 0, background: C.bg, borderRadius: 50, overflow: "hidden", boxShadow: "0 36px 90px rgba(60,90,70,.4)", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ height: 44, background: "transparent", position: "absolute", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", zIndex: 30, pointerEvents: "none" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: lightHeader ? C.dark : "#fff" }}>9:41</span>
          <span style={{ fontSize: 12, color: lightHeader ? C.dark : "#fff" }}>●●●</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {screen === "splash" && <Splash onNext={() => setScreen("login")}/>}
          {screen === "login" && <Login onLogin={() => setScreen("role")}/>}
          {screen === "role" && <Role onSelect={r => { setRole(r); setScreen(r === "broker" ? "broker" : r === "buyer" ? "buyer" : "home"); }}/>}
          {screen === "home" && <Home onRegister={() => setScreen("register")} onMyList={() => setScreen("mylist")} role={role} onSwitchRole={switchRole}/>}
          {screen === "register" && <Register onDone={addProperty} onClose={() => setScreen(role === "owner" ? "mylist" : "home")} onBack={() => setScreen("home")}/>}
          {screen === "mylist" && <MyList properties={properties} onRegister={() => setScreen("register")} onSetDone={setDealDone} onExtendTerm={extendTerm} role={role} onSwitchRole={switchRole}/>}
          {screen === "broker" && <Broker properties={properties} role={role} onSwitchRole={switchRole} onOpenChat={() => openChat("c1")} openModal={setModal}/>}
          {screen === "buyer" && <BuyerExplore properties={properties} onSwitchRole={switchRole} viewerRole="buyer" openModal={setModal}/>}
          {screen === "direct" && <BuyerExplore properties={properties} viewerRole={role === "broker" ? "broker" : "owner"} onSwitchRole={switchRole} openModal={setModal}/>}
          {screen === "chatlist" && <ChatList onOpen={openChat} role={role} onSwitchRole={switchRole}/>}
          {screen === "chatroom" && <ChatRoom chatId={activeChat} onBack={() => setScreen("chatlist")}/>}
          {screen === "profile" && role === "broker" && <Subscription onSwitchRole={switchRole}/>}
          {screen === "profile" && role !== "broker" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, background: G.pageBg }}>
              <Frog mood="sleepy" size={110} animate/>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>준비 중이에요</div>
              <div style={{ fontSize: 13, color: C.gray }}>곧 업데이트될 예정이에요</div>
              <button onClick={switchRole} style={{ marginTop: 12, background: G.greenSoft, border: `1.5px solid ${C.green}`, borderRadius: 20, padding: "10px 20px", color: C.greenInk, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{role === "broker" ? "집주인으로 전환" : "중개사로 전환"}</button>
            </div>
          )}
        </div>
        {!noTab && (
          <div style={{ height: 80, background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex", paddingBottom: 14, flexShrink: 0, boxShadow: "0 -2px 12px rgba(110,150,130,.06)" }}>
            {tabs.map(t => (
              <button key={t.k} onClick={() => setScreen(t.k)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 10, fontFamily: "inherit", position: "relative" }}>
                <div style={{ position: "relative" }}>
                  <TabIcon active={screen === t.k}/>
                  {t.badge > 0 && <div style={{ position: "absolute", top: -6, right: -10, minWidth: 16, height: 16, borderRadius: 8, background: "#E8847C", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{t.badge}</div>}
                </div>
                <span style={{ fontSize: tabs.length >= 5 ? 9 : 10, fontWeight: screen===t.k?800:500, color: screen===t.k?C.greenInk:C.gray, whiteSpace: "nowrap" }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}
        {/* 전역 모달 - 폰 프레임 직속이라 스크롤 위치와 무관하게 항상 화면 기준으로 뜸 */}
        {modal && (
          <div onClick={closeModal} style={{ position: "absolute", inset: 0, background: "#2A3A3255", zIndex: 80, display: "flex", alignItems: "flex-end", animation: "fadeIn .2s" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%" }}>
              {modal.type === "apply" && <ApplyMsgBody listing={modal.payload} defaultMsg={modal.defaultMsg} onConfirm={m => { modal.onConfirm(m); closeModal(); }} onClose={closeModal}/>}
              {modal.type === "pay" && <PayBody listing={modal.payload} onConfirm={() => { modal.onConfirm(); closeModal(); }} onClose={closeModal}/>}
              {modal.type === "editMsg" && <EditMsgBody value={modal.payload} onSave={m => { modal.onConfirm(m); closeModal(); }} onClose={closeModal}/>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
