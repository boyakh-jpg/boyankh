import { useEffect, useRef, useState } from "react";
import { C, G, SH1, SH2 } from "../theme";
import { PROPERTY_TYPE_OPTIONS, REGIONS } from "../data/data";
import { DEMO_USERS, getDemoUser, saveDemoUser } from "../data/demoUsers";
import { getDefaultPointBalance, loadLocalPointBalance, loadPointBalance, loadUserMapState, loadUserMapStateLocal, savePointBalance, saveUserMapState } from "../data/cache";
import { Frog, RoleToggle, SelectBox, Tag } from "./common";

const NOTIFICATION_LABELS = [
  ["newListing", "신규 매물", "내 지역에 새 매물이 올라오면 알림"],
  ["expiringSoon", "만료 임박", "의뢰기한 3일 이하 매물 알림"],
  ["priceChange", "가격 변동", "관심 매물 가격이 바뀌면 알림"],
  ["chat", "채팅/문의", "새 채팅과 문의 알림"],
  ["points", "포인트 부족", "열람 전 포인트 부족 알림"],
];

const POSTCODE_SCRIPT_URL = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
const getPostcode = () => window.daum?.Postcode || window.kakao?.Postcode;
const SIDO_LABELS = {
  서울: "서울특별시",
  부산: "부산광역시",
  대구: "대구광역시",
  인천: "인천광역시",
  광주: "광주광역시",
  대전: "대전광역시",
  울산: "울산광역시",
  세종: "세종특별자치시",
  경기: "경기도",
  강원: "강원특별자치도",
  충북: "충청북도",
  충남: "충청남도",
  전북: "전북특별자치도",
  전남: "전라남도",
  경북: "경상북도",
  경남: "경상남도",
  제주: "제주특별자치도",
};
const loadPostcodeScript = () => new Promise((resolve, reject) => {
  if (typeof window === "undefined") return reject(new Error("window unavailable"));
  if (getPostcode()) return resolve(getPostcode());
  const current = document.querySelector(`script[src="${POSTCODE_SCRIPT_URL}"]`);
  if (current) {
    current.addEventListener("load", () => resolve(getPostcode()), { once: true });
    current.addEventListener("error", reject, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = POSTCODE_SCRIPT_URL;
  script.async = true;
  script.onload = () => resolve(getPostcode());
  script.onerror = reject;
  document.head.appendChild(script);
});
const normalizeSido = value => SIDO_LABELS[value] || value || "";
const pickCity = data => normalizeSido(data.sido || (data.address || data.roadAddress || data.jibunAddress || "").split(" ")[0] || "");
const pickRegion = data => data.sigungu || (data.address || data.roadAddress || data.jibunAddress || "").match(/(\S+(구|시|군))/)?.[1] || "";
const pickDong = data => data.bname || (data.jibunAddress || data.address || "").match(/(\S+(동|읍|면|가))/)?.[1] || "";
const fullAddress = (base, detail) => [base, detail].filter(Boolean).join(" ");
const expandSidoInAddress = (address, city) => {
  if (!address || !city) return address || "";
  const shortCity = Object.keys(SIDO_LABELS).find(key => SIDO_LABELS[key] === city);
  return shortCity && address.startsWith(`${shortCity} `) ? address.replace(shortCity, city) : address;
};
const geocodeAddressOnce = async address => {
  const endpoint = import.meta.env.VITE_NAVER_GEOCODE_ENDPOINT;
  if (!endpoint || !address) return null;
  const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}query=${encodeURIComponent(address)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const first = data.addresses?.[0] || data.results?.[0];
  const lat = Number(first?.y ?? first?.point?.y ?? first?.lat);
  const lng = Number(first?.x ?? first?.point?.x ?? first?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

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

function BackButton({ label, onClick }) {
  return <button onClick={onClick} style={{ border: "none", background: "transparent", color: C.greenInk, fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>{`← ${label}`}</button>;
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ display: "block", fontSize: 11, color: C.gray, fontWeight: 800, marginBottom: 5 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", boxSizing: "border-box", padding: "12px 11px", borderRadius: 13, border: `1.5px solid ${C.line}`, fontSize: 13, color: C.dark, fontWeight: 800, fontFamily: "inherit", outline: "none", background: "#fff" }}/>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ display: "block", fontSize: 11, color: C.gray, fontWeight: 800, marginBottom: 5 }}>{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ width: "100%", boxSizing: "border-box", padding: "12px 11px", borderRadius: 13, border: `1.5px solid ${C.line}`, fontSize: 13, color: C.dark, fontWeight: 800, fontFamily: "inherit", outline: "none", background: "#fff", resize: "none", lineHeight: 1.5 }}/>
    </label>
  );
}

function DemoUserSelect({ label, users, value, onChange }) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span style={{ display: "block", fontSize: 11, color: C.gray, fontWeight: 800, marginBottom: 5 }}>{label}</span>
      <select value={users.some(user => user.id === value) ? value : ""} onChange={e => onChange(e.target.value)} style={{ width: "100%", minWidth: 0, height: 42, borderRadius: 13, border: `1.5px solid ${C.line}`, background: "#fff", color: C.dark, fontSize: 12, fontWeight: 800, fontFamily: "inherit", padding: "0 10px", outline: "none" }}>
        <option value="" disabled>{label} 선택</option>
        {users.map(user => <option key={user.id} value={user.id}>{user.label} · {user.id}</option>)}
      </select>
    </label>
  );
}

function AccountSubPage({ page, role, brokerTier, demoUser, onBack }) {
  const pointDefault = getDefaultPointBalance(demoUser.role);
  const pageTopRef = useRef(null);
  const [chargeStep, setChargeStep] = useState("summary");
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [points, setPoints] = useState(() => loadLocalPointBalance(demoUser.id, pointDefault));
  const defaultProfile = { name: "홍길동", phone: "010-1234-5678", email: "toad@example.com", roleNote: role === "broker" ? "소유주 · 중개사 · 직거래" : "소유주 · 직거래" };
  const defaultSupportDraft = { title: "", body: "", contact: "010-1234-5678", reportTarget: "", reportBody: "" };
  const [profile, setProfile] = useState(() => loadUserMapStateLocal(demoUser.id, "settingsProfile", defaultProfile));
  const [supportDraft, setSupportDraft] = useState(() => loadUserMapStateLocal(demoUser.id, "supportDraft", defaultSupportDraft));
  const [notice, setNotice] = useState("");
  const setProfileField = (key, value) => setProfile(p => ({ ...p, [key]: value }));
  const setSupportField = (key, value) => setSupportDraft(p => ({ ...p, [key]: value }));
  const showNotice = text => { setNotice(text); setTimeout(() => setNotice(""), 1800); };

  useEffect(() => {
    pageTopRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [page, chargeStep]);

  useEffect(() => {
    let alive = true;
    setPoints(loadLocalPointBalance(demoUser.id, pointDefault));
    loadPointBalance({ userId: demoUser.id, defaultBalance: pointDefault }).then(balance => {
      if (alive) setPoints(balance);
    });
    return () => { alive = false; };
  }, [demoUser.id, pointDefault]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      loadUserMapState({ userId: demoUser.id, name: "settingsProfile", fallback: defaultProfile }),
      loadUserMapState({ userId: demoUser.id, name: "supportDraft", fallback: defaultSupportDraft }),
    ]).then(([nextProfile, nextSupportDraft]) => {
      if (!alive) return;
      setProfile(nextProfile);
      setSupportDraft(nextSupportDraft);
    });
    return () => { alive = false; };
  }, [demoUser.id, role]);

  const updatePoints = (updater, reason) => setPoints(prev => {
    const next = typeof updater === "function" ? updater(prev) : updater;
    savePointBalance({ userId: demoUser.id, balance: next, delta: next - prev, reason });
    return next;
  });

  const pointProducts = [
    { amount: 10000, bonus: 0 },
    { amount: 30000, bonus: role === "broker" ? 1500 : 900 },
    { amount: 50000, bonus: role === "broker" ? 5000 : 2500 },
    { amount: 100000, bonus: role === "broker" ? 10000 : 10000 },
  ];
  const completePointPayment = product => {
    const total = product.amount + product.bonus;
    updatePoints(p => p + total, "settings_point_charge");
    setChargeStep("done");
  };
  const saveProfile = () => {
    saveUserMapState({ userId: demoUser.id, name: "settingsProfile", value: profile });
    showNotice("프로필 저장 완료");
  };
  const saveSupportDraft = next => saveUserMapState({ userId: demoUser.id, name: "supportDraft", value: next });
  const submitInquiry = () => {
    const next = { ...supportDraft, submittedAt: new Date().toISOString() };
    saveSupportDraft(next);
    saveUserMapState({ userId: demoUser.id, name: "supportLastInquiry", value: next });
    showNotice("문의 접수 완료");
  };
  const submitReport = () => {
    const next = { ...supportDraft, submittedAt: new Date().toISOString() };
    saveSupportDraft(next);
    saveUserMapState({ userId: demoUser.id, name: "supportLastReport", value: next });
    showNotice("신고 접수 완료");
  };

  if (page === "payments" && chargeStep === "checkout") {
    const product = selectedPoint || pointProducts[0];
    const total = product.amount + product.bonus;
    return (
      <div ref={pageTopRef} style={{ padding: 16 }}>
        <BackButton label="포인트/결제" onClick={() => setChargeStep("summary")}/>
        <Section title="포인트 결제">
          <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, marginBottom: 12 }}>외부 결제창으로 이동하기 전 결제 내용을 확인해요.</div>
          {[["충전 포인트", `${product.amount.toLocaleString()}P`], ["보너스", `${product.bonus.toLocaleString()}P`], ["지급 합계", `${total.toLocaleString()}P`], ["결제금액", `${product.amount.toLocaleString()}원`]].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13, color: C.gray, fontWeight: 800 }}>{label}</span>
              <span style={{ fontSize: 13, color: C.dark, fontWeight: 900 }}>{value}</span>
            </div>
          ))}
        </Section>
        <Section title="결제수단">
          {["신용/체크카드", "간편결제", "계좌이체"].map((method, index) => (
            <div key={method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: index === 0 ? "none" : `1px solid ${C.line}` }}>
              <span style={{ fontSize: 14, color: C.dark, fontWeight: 800 }}>{method}</span>
              <span style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${index === 0 ? C.green : C.line}`, background: index === 0 ? G.header : "#fff" }}/>
            </div>
          ))}
        </Section>
        <button onClick={() => completePointPayment(product)} style={{ width: "100%", border: "none", background: G.header, color: "#fff", borderRadius: 16, padding: "14px 0", fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", boxShadow: SH2 }}>외부 결제창으로 이동</button>
      </div>
    );
  }

  if (page === "payments" && chargeStep === "done") {
    const product = selectedPoint || pointProducts[0];
    const total = product.amount + product.bonus;
    return (
      <div ref={pageTopRef} style={{ padding: "48px 16px 16px", textAlign: "center" }}>
        <Frog mood="joyful" size={104} animate/>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.dark, marginTop: 12 }}>결제 완료</div>
        <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6, marginTop: 6 }}>{total.toLocaleString()}P가 충전됐어요.</div>
        <Section title="결제 내역">
          {[["충전 포인트", `${product.amount.toLocaleString()}P`], ["보너스", `${product.bonus.toLocaleString()}P`], ["지급 합계", `${total.toLocaleString()}P`], ["결제금액", `${product.amount.toLocaleString()}원`], ["결제일", "2026-05-27"]].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: label === "충전 포인트" ? "none" : `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13, color: C.gray, fontWeight: 800 }}>{label}</span>
              <span style={{ fontSize: 13, color: C.dark, fontWeight: 900 }}>{value}</span>
            </div>
          ))}
        </Section>
        <button onClick={() => setChargeStep("summary")} style={{ width: "100%", border: "none", background: G.header, color: "#fff", borderRadius: 16, padding: "14px 0", fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", boxShadow: SH2 }}>포인트/결제로 돌아가기</button>
      </div>
    );
  }

  if (page === "payments") {
    return (
      <div ref={pageTopRef} style={{ padding: 16 }}>
        <BackButton label="계정" onClick={onBack}/>
        <Section title="포인트/결제">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={{ background: G.greenSoft, borderRadius: 14, padding: "12px 10px" }}>
              <div style={{ fontSize: 11, color: C.gray, fontWeight: 800 }}>보유 포인트</div>
              <div style={{ fontSize: 18, color: C.greenInk, fontWeight: 900, marginTop: 2 }}>{points.toLocaleString()}P</div>
            </div>
            <div style={{ background: G.goldSoft, borderRadius: 14, padding: "12px 10px" }}>
              <div style={{ fontSize: 11, color: C.gray, fontWeight: 800 }}>구독 등급</div>
              <div style={{ fontSize: 18, color: C.goldInk, fontWeight: 900, marginTop: 2 }}>{role === "broker" ? brokerTier : "없음"}</div>
            </div>
          </div>
          {pointProducts.map(product => (
            <button key={product.amount} onClick={() => { setSelectedPoint(product); setChargeStep("checkout"); }} style={{ width: "100%", border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: 14, padding: "12px 13px", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ textAlign: "left" }}>
                <span style={{ display: "block", fontSize: 14, color: C.dark, fontWeight: 900 }}>{product.amount.toLocaleString()}P</span>
                <span style={{ display: "block", fontSize: 12, color: C.gray, marginTop: 2 }}>보너스 {product.bonus.toLocaleString()}P</span>
              </span>
              <span style={{ fontSize: 14, color: C.greenInk, fontWeight: 900 }}>{product.amount.toLocaleString()}원</span>
            </button>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "profile") {
    return (
      <div ref={pageTopRef} style={{ padding: 16 }}>
        <BackButton label="계정" onClick={onBack}/>
        {notice && <div style={{ background: G.greenSoft, color: C.greenInk, borderRadius: 14, padding: "10px 12px", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>{notice}</div>}
        <Section title="프로필 수정">
          <TextInput label="이름" value={profile.name} onChange={value => setProfileField("name", value)} placeholder="이름"/>
          <TextInput label="연락처" value={profile.phone} onChange={value => setProfileField("phone", value)} placeholder="010-0000-0000"/>
          <TextInput label="이메일" value={profile.email} onChange={value => setProfileField("email", value)} placeholder="email@example.com"/>
          <TextInput label="사용 가능 역할" value={profile.roleNote} onChange={value => setProfileField("roleNote", value)} placeholder="소유주 · 직거래"/>
          <button onClick={saveProfile} style={{ width: "100%", border: "none", background: G.header, color: "#fff", borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>프로필 저장</button>
        </Section>
        <Section title="백엔드 연결 기준">
          {[["저장 API", "PATCH /me/profile"], ["필드", "name, phone, email, availableRoles"], ["검증", "전화번호 인증, 이메일 중복 확인"]].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: label === "저장 API" ? "none" : `1px solid ${C.line}` }}>
              <span style={{ fontSize: 13, color: C.gray, fontWeight: 800 }}>{label}</span>
              <span style={{ fontSize: 13, color: C.dark, fontWeight: 900, textAlign: "right" }}>{value}</span>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "support") {
    return (
      <div ref={pageTopRef} style={{ padding: 16 }}>
        <BackButton label="계정" onClick={onBack}/>
        {notice && <div style={{ background: G.greenSoft, color: C.greenInk, borderRadius: 14, padding: "10px 12px", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>{notice}</div>}
        <Section title="문의하기">
          <TextInput label="제목" value={supportDraft.title} onChange={value => setSupportField("title", value)} placeholder="문의 제목"/>
          <TextArea label="내용" value={supportDraft.body} onChange={value => setSupportField("body", value)} placeholder="앱 사용, 결제, 매물 노출 문의를 남겨주세요"/>
          <TextInput label="회신 연락처" value={supportDraft.contact} onChange={value => setSupportField("contact", value)} placeholder="연락처"/>
          <button onClick={submitInquiry} style={{ width: "100%", border: "none", background: G.header, color: "#fff", borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>문의 접수</button>
        </Section>
        <Section title="신고하기">
          <TextInput label="신고 대상" value={supportDraft.reportTarget} onChange={value => setSupportField("reportTarget", value)} placeholder="매물번호, 채팅방, 사용자"/>
          <TextArea label="신고 사유" value={supportDraft.reportBody} onChange={value => setSupportField("reportBody", value)} placeholder="허위 매물, 부적절한 채팅, 결제 문제 등을 적어주세요"/>
          <button onClick={submitReport} style={{ width: "100%", border: "none", background: G.gold, color: "#fff", borderRadius: 14, padding: "12px 0", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>신고 접수</button>
        </Section>
        <Section title="이용약관">
          <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.7 }}>토드는 매물 의뢰, 중개 제안, 직거래 문의를 연결하는 플랫폼이에요. 실제 계약 전 권리관계, 등기, 임대차, 대출, 세금은 사용자가 최종 확인해야 해요.</div>
        </Section>
        <Section title="개인정보 처리방침">
          <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.7 }}>연락처는 빠른의뢰 결제 완료 또는 안심의뢰 승인 완료 뒤에만 공개돼야 해요. 결제, 포인트, 채팅, 신고 기록은 감사 로그로 보관해야 해요.</div>
        </Section>
      </div>
    );
  }

  return null;
}

function BrokerOfficeForm({ brokerOffice, demoUser, onRegisterBrokerOffice, onBack }) {
  const pageTopRef = useRef(null);
  const [draft, setDraft] = useState(() => ({
    brokerUserId: demoUser.id,
    officeName: brokerOffice?.officeName || "",
    agentName: brokerOffice?.agentName || demoUser.name || "",
    licenseNo: brokerOffice?.licenseNo || "",
    phone: brokerOffice?.phone || demoUser.phone || "",
    address: brokerOffice?.address || "",
    detailAddress: "",
    city: brokerOffice?.city || "",
    region: brokerOffice?.region || "",
    dong: brokerOffice?.dong || "",
    lat: brokerOffice?.lat || null,
    lng: brokerOffice?.lng || null,
    businessHours: brokerOffice?.businessHours || "평일 09:00-18:00",
    proposalMessage: brokerOffice?.proposalMessage || "",
    specialtyTypes: brokerOffice?.specialtyTypes?.length ? brokerOffice.specialtyTypes : ["아파트"],
  }));
  const [notice, setNotice] = useState("");
  const [addressError, setAddressError] = useState("");
  const [saving, setSaving] = useState(false);
  const setField = (key, value) => setDraft(prev => ({ ...prev, [key]: value }));
  const toggleType = type => setDraft(prev => {
    const hasType = prev.specialtyTypes.includes(type);
    const nextTypes = hasType ? prev.specialtyTypes.filter(item => item !== type) : [...prev.specialtyTypes, type];
    return { ...prev, specialtyTypes: nextTypes.length ? nextTypes : [type] };
  });

  useEffect(() => {
    pageTopRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    loadPostcodeScript().catch(() => {});
  }, []);

  useEffect(() => {
    setDraft({
      brokerUserId: demoUser.id,
      officeName: brokerOffice?.officeName || "",
      agentName: brokerOffice?.agentName || demoUser.name || "",
      licenseNo: brokerOffice?.licenseNo || "",
      phone: brokerOffice?.phone || demoUser.phone || "",
      address: brokerOffice?.address || "",
      detailAddress: "",
      city: brokerOffice?.city || "",
      region: brokerOffice?.region || "",
      dong: brokerOffice?.dong || "",
      lat: brokerOffice?.lat || null,
      lng: brokerOffice?.lng || null,
      businessHours: brokerOffice?.businessHours || "평일 09:00-18:00",
      proposalMessage: brokerOffice?.proposalMessage || "",
      specialtyTypes: brokerOffice?.specialtyTypes?.length ? brokerOffice.specialtyTypes : ["아파트"],
    });
  }, [brokerOffice?.id, demoUser.id, demoUser.name, demoUser.phone]);

  const openAddressSearch = async () => {
    setAddressError("");
    try {
      const Postcode = await loadPostcodeScript();
      new Postcode({
        oncomplete: data => {
          const city = pickCity(data);
          const baseAddress = expandSidoInAddress(data.roadAddress || data.jibunAddress || data.address || "", city);
          setDraft(prev => ({
            ...prev,
            address: baseAddress,
            detailAddress: "",
            city,
            region: pickRegion(data),
            dong: pickDong(data),
            lat: null,
            lng: null,
          }));
          geocodeAddressOnce(baseAddress).then(coords => {
            if (coords) setDraft(prev => prev.address === baseAddress ? { ...prev, ...coords } : prev);
          });
        },
      }).open({ q: draft.address || undefined, popupTitle: "부동산 주소 찾기" });
    } catch {
      setAddressError("주소검색을 불러오지 못했어요. Vercel 도메인/키 설정을 확인해 주세요.");
    }
  };

  const submit = async () => {
    setNotice("");
    if (!draft.officeName || !draft.agentName || !draft.licenseNo || !draft.phone || !draft.address) {
      setNotice("상호, 중개사명, 등록번호, 연락처, 주소를 입력해 주세요.");
      return;
    }
    setSaving(true);
    const saved = await onRegisterBrokerOffice?.({ ...draft, address: fullAddress(draft.address, draft.detailAddress) });
    setSaving(false);
    setNotice(saved ? "부동산 정보 저장 완료" : "부동산 정보 저장 실패");
  };

  return (
    <div ref={pageTopRef} style={{ padding: 16 }}>
      <BackButton label="중개사 설정" onClick={onBack}/>
      {notice && <div style={{ background: G.greenSoft, color: C.greenInk, borderRadius: 14, padding: "10px 12px", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>{notice}</div>}
      <Section title="부동산 등록">
        <TextInput label="상호" value={draft.officeName} onChange={value => setField("officeName", value)} placeholder="예: 역삼토드공인중개사사무소"/>
        <TextInput label="대표/중개사" value={draft.agentName} onChange={value => setField("agentName", value)} placeholder="예: 김토드 공인중개사"/>
        <TextInput label="등록번호" value={draft.licenseNo} onChange={value => setField("licenseNo", value)} placeholder="예: 11680-2026-00001"/>
        <TextInput label="연락처" value={draft.phone} onChange={value => setField("phone", value)} placeholder="02-0000-0000"/>
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "block", fontSize: 11, color: C.gray, fontWeight: 800, marginBottom: 5 }}>사무소 주소</div>
          <button onClick={openAddressSearch} style={{ width: "100%", minHeight: 44, boxSizing: "border-box", padding: "12px 11px", borderRadius: 13, border: `1.5px solid ${C.line}`, background: "#fff", color: draft.address ? C.dark : C.gray, fontSize: 13, fontWeight: 800, fontFamily: "inherit", textAlign: "left", cursor: "pointer" }}>
            {draft.address || "주소 찾기로 선택"}
          </button>
          {addressError && <div style={{ fontSize: 11, color: C.goldInk, fontWeight: 800, marginTop: 6 }}>{addressError}</div>}
        </div>
        <TextInput label="상세주소" value={draft.detailAddress} onChange={value => setField("detailAddress", value)} placeholder="층, 호수"/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: G.greenSoft, borderRadius: 13, padding: "10px 11px" }}>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 800 }}>자동 분류</div>
            <div style={{ fontSize: 13, color: C.greenInk, fontWeight: 900, marginTop: 2 }}>{[draft.city, draft.region, draft.dong].filter(Boolean).join(" ") || "주소 선택 필요"}</div>
          </div>
          <div style={{ background: G.goldSoft, borderRadius: 13, padding: "10px 11px" }}>
            <div style={{ fontSize: 11, color: C.gray, fontWeight: 800 }}>좌표</div>
            <div style={{ fontSize: 13, color: C.goldInk, fontWeight: 900, marginTop: 2 }}>{draft.lat && draft.lng ? "저장 가능" : "주소 저장 후 보강"}</div>
          </div>
        </div>
        <TextInput label="영업시간" value={draft.businessHours} onChange={value => setField("businessHours", value)} placeholder="평일 09:00-18:00"/>
        <TextArea label="소유주에게 보일 소개문" value={draft.proposalMessage} onChange={value => setField("proposalMessage", value)} placeholder="전문 지역, 강점, 응답 방식을 적어 주세요."/>
      </Section>
      <Section title="전문 매물 유형">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PROPERTY_TYPE_OPTIONS.map(option => {
            const active = draft.specialtyTypes.includes(option.value);
            return (
              <button key={option.value} onClick={() => toggleType(option.value)} style={{ border: `1.5px solid ${active ? C.green : C.line}`, background: active ? G.greenSoft : "#fff", color: active ? C.greenInk : C.mid, borderRadius: 14, padding: "8px 10px", fontSize: 12, fontWeight: 900, fontFamily: "inherit", cursor: "pointer" }}>
                {option.value}
              </button>
            );
          })}
        </div>
      </Section>
      <button onClick={submit} disabled={saving} style={{ width: "100%", border: "none", background: saving ? "#D5DDD7" : G.header, color: "#fff", borderRadius: 16, padding: "14px 0", fontSize: 15, fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: saving ? "none" : SH2 }}>{saving ? "저장 중" : "부동산 정보 저장"}</button>
    </div>
  );
}

function BrokerSubPage({ page, brokerTier, demoUser, brokerOffice, onRegisterBrokerOffice, onSubscription, onBack }) {
  const pageTopRef = useRef(null);
  useEffect(() => {
    pageTopRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [page]);

  if (page === "office") {
    return <BrokerOfficeForm brokerOffice={brokerOffice} demoUser={demoUser} onRegisterBrokerOffice={onRegisterBrokerOffice} onBack={onBack}/>;
  }

  const data = {
    office: { title: "부동산 정보", sub: "상호, 등록번호, 사무소 주소", rows: [["상호", "토드공인중개사사무소"], ["대표/중개사", "김토드 공인중개사"], ["등록번호", "11680-2026-00001"], ["사무소 주소", "서울특별시 강남구 대치동"], ["연락처", "02-1234-5678"]] },
    hours: { title: "영업시간", sub: "응답률 계산에 반영될 시간", rows: [["평일", "09:00 - 19:00"], ["토요일", "10:00 - 15:00"], ["일요일", "휴무"], ["채팅 선호", "영업시간 내 즉시 응답"]] },
    regions: { title: "전문 지역", sub: "소유주에게 노출될 활동 지역", rows: [["주력 지역", "강남구 · 서초구"], ["관심 확장 지역", "마포구"], ["전문 매물", "아파트 · 빌라 · 오피스텔"], ["구독 등급", brokerTier]] },
  }[page];

  if (!data) return null;
  return (
    <div ref={pageTopRef} style={{ padding: 16 }}>
      <BackButton label="중개사 설정" onClick={onBack}/>
      <Section title={data.title}>
        <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, marginBottom: 10 }}>{data.sub}</div>
        {data.rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.gray, fontWeight: 800 }}>{label}</span>
            <span style={{ fontSize: 13, color: C.dark, fontWeight: 900, textAlign: "right" }}>{value}</span>
          </div>
        ))}
        {page === "regions" && <button onClick={onSubscription} style={{ width: "100%", marginTop: 12, border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>구독 관리</button>}
      </Section>
      <div style={{ background: G.greenSoft, borderRadius: 16, padding: "13px 14px", color: C.mid, fontSize: 12, lineHeight: 1.6 }}>현재 화면은 데모 데이터예요. 실제 서비스에서는 중개사 프로필 API와 연결해야 해요.</div>
    </div>
  );
}

export function Settings({ role, availableRoles, onSwitchRole, preferredRegion, interestRegion, onRegionChange, onInterestRegionChange, notifications, onToggleNotification, brokerTier = "골드", demoUsers = DEMO_USERS, brokerOffices = [], onRegisterBrokerOffice, onSubscription, onDemoUserChange, onBack }) {
  const [accountPage, setAccountPage] = useState(null);
  const [brokerPage, setBrokerPage] = useState(null);
  const [demoUserId, setDemoUserId] = useState(() => getDemoUser().id);
  const topRef = useRef(null);
  const regionOptions = REGIONS.filter(r => r !== "전체");
  const selectedDemoUser = demoUsers.find(user => user.id === demoUserId) || getDemoUser(demoUsers);
  const selectedBrokerOffice = brokerOffices.find(office => office.brokerUserId === selectedDemoUser.id);
  const ownerDemoUsers = demoUsers.filter(user => user.role === "owner");
  const brokerDemoUsers = demoUsers.filter(user => user.role === "broker");
  const buyerDemoUsers = demoUsers.filter(user => user.role === "buyer");
  const selectDemoUser = user => {
    if (!user) return;
    saveDemoUser(user.id);
    setDemoUserId(user.id);
    onDemoUserChange && onDemoUserChange(user);
  };
  const selectDemoUserId = id => selectDemoUser(demoUsers.find(user => user.id === id));

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [accountPage, brokerPage]);
  useEffect(() => {
    if (selectedDemoUser?.id && selectedDemoUser.id !== demoUserId) setDemoUserId(selectedDemoUser.id);
  }, [selectedDemoUser?.id, demoUserId]);

  return (
    <div ref={topRef} style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
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
      {accountPage ? <AccountSubPage page={accountPage} role={role} brokerTier={brokerTier} demoUser={selectedDemoUser} onBack={() => setAccountPage(null)}/> : brokerPage ? <BrokerSubPage page={brokerPage} brokerTier={brokerTier} demoUser={selectedDemoUser} brokerOffice={selectedBrokerOffice} onRegisterBrokerOffice={onRegisterBrokerOffice} onSubscription={onSubscription} onBack={() => setBrokerPage(null)}/> : <div style={{ padding: 16 }}>
        <BackButton label="뒤로가기" onClick={onBack}/>
        <Section title="테스트 아이디">
          <div style={{ background: G.greenSoft, borderRadius: 14, padding: "12px 13px", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: C.greenInk, fontWeight: 900 }}>{selectedDemoUser.label}</div>
            <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.55, marginTop: 3 }}>{selectedDemoUser.id}</div>
          </div>
          <DemoUserSelect label="소유주 아이디" users={ownerDemoUsers} value={demoUserId} onChange={selectDemoUserId}/>
          <DemoUserSelect label="중개사 아이디" users={brokerDemoUsers} value={demoUserId} onChange={selectDemoUserId}/>
          <DemoUserSelect label="직거래 매수자 아이디" users={buyerDemoUsers} value={demoUserId} onChange={selectDemoUserId}/>
        </Section>
        <Section title="내 지역">
          <SelectBox label="기본 지역" value={preferredRegion} options={regionOptions} onChange={onRegionChange}/>
          <div style={{ height: 8 }}/>
          <SelectBox label="관심 지역" value={interestRegion} options={regionOptions} onChange={onInterestRegionChange}/>
          <div style={{ marginTop: 10, fontSize: 12, color: C.gray, lineHeight: 1.6 }}>기본 지역은 매물목록 지도와 지역 필터의 첫 선택값이에요. 관심 지역은 기본 지역과 함께 홈 추천 매물, 부동산, 신규 매물, 만료 임박에 반영돼요. 이 브라우저에 저장돼요.</div>
        </Section>
        <Section title="알림">
          {NOTIFICATION_LABELS.map(([key, title, sub]) => <ToggleRow key={key} title={title} sub={sub} checked={!!notifications[key]} onClick={() => onToggleNotification(key)}/>) }
        </Section>
        {role === "broker" && (
          <Section title="중개사 설정">
            <div style={{ background: G.greenSoft, borderRadius: 14, padding: "13px 14px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 14, lineHeight: 1.35, color: C.greenInk, fontWeight: 800 }}>구독 등급 · {brokerTier}</div>
              <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.5, marginTop: 3 }}>알림 우선권, 충전 보너스, 조회 한도를 여기서 관리해요.</div>
              <button onClick={onSubscription} style={{ width: "100%", marginTop: 10, border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 13, lineHeight: 1.25, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>구독 관리</button>
            </div>
            <MenuRow title="부동산 정보" sub="상호, 등록번호, 사무소 주소" tag="필수" onClick={() => setBrokerPage("office")}/>
            <MenuRow title="영업시간" sub="응답률 계산에 반영될 시간" onClick={() => setBrokerPage("hours")}/>
            <MenuRow title="전문 지역" sub="소유주에게 노출될 활동 지역" onClick={() => setBrokerPage("regions")}/>
          </Section>
        )}
        <Section title="계정">
          <MenuRow title="프로필" sub="이름, 연락처, 역할 정보" onClick={() => setAccountPage("profile")}/>
          <MenuRow title="포인트/결제" sub="충전 내역, 사용 내역, 결제수단" onClick={() => setAccountPage("payments")}/>
          <MenuRow title="고객지원" sub="문의하기, 신고하기, 약관" onClick={() => setAccountPage("support")}/>
        </Section>
        <button onClick={onBack} style={{ width: "100%", border: "none", background: G.header, color: "#fff", borderRadius: 16, padding: "14px 0", fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", boxShadow: SH2 }}>설정 저장</button>
      </div>}
    </div>
  );
}
