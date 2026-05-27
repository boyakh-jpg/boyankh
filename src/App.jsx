import { useEffect, useRef, useState } from "react";
import { C, G } from "./theme";
import { PROPERTIES, CHATS } from "./data/data";
import { Splash, Login, Role } from "./components/Onboarding";
import { Register } from "./components/Register";
import { Home } from "./components/Home";
import { Broker } from "./components/Broker";
import { BrokerOffices } from "./components/BrokerOffices";
import { BuyerExplore } from "./components/BuyerExplore";
import { ChatList, ChatRoom } from "./components/Chat";
import { Subscription } from "./components/Subscription";
import { MyList } from "./components/MyList";
import { Settings } from "./components/Settings";
import { Frog } from "./components/common";
import { ApplyMsgBody, PayBody, EditMsgBody } from "./components/modals";

const loadSetting = (key, fallback) => {
  try {
    if (typeof window === "undefined") return fallback;
    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;
    try { return JSON.parse(saved); } catch { return saved; }
  } catch {
    return fallback;
  }
};
const saveSetting = (key, value) => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [accountType, setAccountType] = useState("user");
  const [role, setRole] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [modal, setModal] = useState(null); // { type, payload, onConfirm }
  const [brokerTier, setBrokerTier] = useState("골드");
  const [preferredRegion, setPreferredRegion] = useState(() => loadSetting("toad.preferredRegion", "강남구"));
  const [interestRegion, setInterestRegion] = useState(() => loadSetting("toad.interestRegion", "마포구"));
  const [notifications, setNotifications] = useState(() => loadSetting("toad.notifications", { newListing: true, expiringSoon: true, priceChange: true, chat: true, points: true }));
  const [settingsBack, setSettingsBack] = useState("home");
  const [brokerPreset, setBrokerPreset] = useState({});
  const [buyerPreset, setBuyerPreset] = useState({});
  const [myListPreset, setMyListPreset] = useState({});
  const contentRef = useRef(null);
  useEffect(() => saveSetting("toad.preferredRegion", preferredRegion), [preferredRegion]);
  useEffect(() => saveSetting("toad.interestRegion", interestRegion), [interestRegion]);
  useEffect(() => saveSetting("toad.notifications", notifications), [notifications]);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);
  // ===== 공용 매물 store (owner/broker/buyer가 같은 데이터를 봄) =====
  const [properties, setProperties] = useState(PROPERTIES);
  // 등록 완료 시 새 매물을 목록 맨 앞에 추가 (mine: true → 내 매물)
  const addProperty = p => setProperties(prev => [{ ...p, mine: true }, ...prev]);
  // 거래 완료/되돌리기 토글
  const setDealDone = (id, done) => setProperties(prev => prev.map(p => p.id === id ? { ...p, status: done ? "done" : "active", completedDaysAgo: done ? 0 : null } : p));
  // 의뢰 기한 2주 연장
  const extendTerm = id => setProperties(prev => prev.map(p => p.id === id ? { ...p, expiresInDays: (p.expiresInDays ?? 14) + 14 } : p));
  const updatePrice = (id, priceNum, price, reason) => setProperties(prev => prev.map(p => p.id === id ? {
    ...p,
    priceNum,
    price,
    updatedAgo: "방금 전",
    updatedReason: reason,
    priceHistory: [...(p.priceHistory || [{ date: "2026-05-01", priceNum: p.priceNum, reason: "최초 등록" }]), { date: "2026-05-27", priceNum, reason }],
  } : p));
  const updateListingInfo = (id, patch) => setProperties(prev => prev.map(p => p.id === id ? {
    ...p,
    ...patch,
    updatedAgo: "방금 전",
    updatedReason: "매물 정보 수정",
  } : p));
  const closeModal = () => setModal(null);
  const availableRoles = accountType === "broker" ? ["owner", "broker", "buyer"] : ["owner", "buyer"];
  const switchRole = () => {
    const nr = availableRoles[(availableRoles.indexOf(role) + 1) % availableRoles.length];
    setRole(nr);
    setModal(null);
    setScreen("home");
  };
  const openChat = id => { setActiveChat(id); setScreen("chatroom"); };
  const openBrokerList = (preset = {}) => { setBrokerPreset({ region: preferredRegion, ...preset }); setScreen("broker"); };
  const openBuyerList = (preset = {}) => { setBuyerPreset({ region: preferredRegion, ...preset }); setScreen("buyer"); };
  const openMyList = (preset = {}) => { setMyListPreset(preset); setScreen("mylist"); };
  const openSettings = () => { setSettingsBack(screen); setScreen("settings"); };
  const toggleNotification = key => setNotifications(n => ({ ...n, [key]: !n[key] }));
  const openMenu = k => {
    if (["broker", "brokerViewed"].includes(k)) setBrokerPreset({ region: preferredRegion });
    if (["buyer", "buyerViewed"].includes(k)) setBuyerPreset({ region: preferredRegion });
    if (k === "mylist") setMyListPreset({});
    setScreen(k);
  };
  const roleChats = CHATS.filter(c => role === "broker" ? c.mode !== "직거래" : role === "buyer" ? c.mode === "직거래" : true);
  const totalUnread = roleChats.reduce((s, c) => s + c.unread, 0);
  const ownerMenus = [{ k: "home", label: "홈" }, { k: "register", label: "의뢰하기" }, { k: "offices", label: "부동산" }, { k: "chatlist", label: "채팅", badge: totalUnread }, { k: "mylist", label: "내 매물" }];
  const brokerMenus = [{ k: "home", label: "홈" }, { k: "broker", label: "매물" }, { k: "brokerViewed", label: "열람목록" }, { k: "chatlist", label: "채팅", badge: totalUnread }];
  const buyerMenus = [{ k: "home", label: "홈" }, { k: "buyer", label: "매물" }, { k: "buyerViewed", label: "열람목록" }, { k: "chatlist", label: "채팅", badge: totalUnread }];
  const menus = role === "broker" ? brokerMenus : role === "buyer" ? buyerMenus : ownerMenus;
  const noMenu = ["splash", "login", "role", "register", "chatroom", "settings"].includes(screen);
  const lightHeader = ["login", "role"].includes(screen);
  // 하단 메뉴 아이콘: 미니멀 도형
  const MenuIcon = ({ active }) => (<div style={{ width: 18, height: 18, borderRadius: 6, background: active ? C.green : "transparent", border: `2px solid ${active ? C.green : C.gray}`, transition: "all .15s" }}/>);
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
          {["splash", "login", "role"].includes(screen) ? (
            <span style={{ width: 30 }}/>
          ) : screen === "settings" ? (
            <span style={{ width: 30, height: 30, borderRadius: 15, border: "1px solid #ffffff55", background: "#ffffff2e", color: "#fff", fontSize: 17, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, transform: "translateY(7px)" }}><span style={{ display: "block", transform: "translateY(-1px)" }}>⚙</span></span>
          ) : (
            <button onClick={openSettings} aria-label="설정" style={{ pointerEvents: "auto", width: 30, height: 30, borderRadius: 15, border: "1px solid #ffffff55", background: "#ffffff2e", color: "#fff", fontSize: 17, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0, transform: "translateY(7px)" }}><span style={{ display: "block", transform: "translateY(-1px)" }}>⚙</span></button>
          )}
        </div>
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {screen === "splash" && <Splash onNext={() => setScreen("login")}/>}
          {screen === "login" && <Login onLogin={type => { setAccountType(type); setScreen("role"); }}/>}
          {screen === "role" && <Role accountType={accountType} onSelect={r => { setRole(r); setScreen("home"); }}/>}
          {screen === "home" && <Home properties={properties} preferredRegion={preferredRegion} interestRegion={interestRegion} brokerTier={brokerTier} onRegister={() => setScreen("register")} onMyList={openMyList} onOffices={() => setScreen("offices")} onBrokerList={openBrokerList} onBuyerList={openBuyerList} onSubscription={() => setScreen("profile")} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {screen === "offices" && <BrokerOffices role={role} availableRoles={availableRoles} preferredRegion={preferredRegion} interestRegion={interestRegion} onSwitchRole={switchRole}/>}
          {screen === "register" && <Register onDone={addProperty} onClose={() => setScreen(role === "owner" ? "mylist" : "home")} onBack={() => setScreen("home")}/>}
          {screen === "mylist" && <MyList properties={properties} preset={myListPreset} onRegister={() => setScreen("register")} onSetDone={setDealDone} onExtendTerm={extendTerm} onUpdatePrice={updatePrice} onUpdateListing={updateListingInfo} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {["broker", "brokerViewed"].includes(screen) && <Broker properties={properties} preset={brokerPreset} menuMode={screen === "brokerViewed" ? "viewed" : "all"} role={role} availableRoles={availableRoles} tier={brokerTier} onSwitchRole={switchRole} onOpenChat={listing => openChat(listing?.fast ? "c4" : "c1")} openModal={setModal}/>}
          {["buyer", "buyerViewed"].includes(screen) && <BuyerExplore properties={properties} preset={buyerPreset} menuMode={screen === "buyerViewed" ? "viewed" : "all"} onSwitchRole={switchRole} availableRoles={availableRoles} viewerRole="buyer" openModal={setModal} onOpenChat={() => openChat("c3")}/>}
          {screen === "direct" && <BuyerExplore properties={properties} viewerRole={role === "broker" ? "broker" : "owner"} availableRoles={availableRoles} onSwitchRole={switchRole} openModal={setModal} onOpenChat={() => openChat("c3")}/>}
          {screen === "settings" && <Settings role={role} availableRoles={availableRoles} onSwitchRole={switchRole} preferredRegion={preferredRegion} interestRegion={interestRegion} onRegionChange={setPreferredRegion} onInterestRegionChange={setInterestRegion} notifications={notifications} onToggleNotification={toggleNotification} brokerTier={brokerTier} onSubscription={() => setScreen("profile")} onBack={() => setScreen(settingsBack)}/>}
          {screen === "chatlist" && <ChatList onOpen={openChat} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {screen === "chatroom" && <ChatRoom chatId={activeChat} role={role} onBack={() => setScreen("chatlist")}/>}
          {screen === "profile" && role === "broker" && <Subscription picked={brokerTier} availableRoles={availableRoles} onPick={setBrokerTier} onSwitchRole={switchRole}/>}
          {screen === "profile" && role !== "broker" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, background: G.pageBg }}>
              <Frog mood="sleepy" size={110} animate/>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>준비 중이에요</div>
              <div style={{ fontSize: 13, color: C.gray }}>곧 업데이트될 예정이에요</div>
              <button onClick={switchRole} style={{ marginTop: 12, background: G.greenSoft, border: `1.5px solid ${C.green}`, borderRadius: 20, padding: "10px 20px", color: C.greenInk, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{role === "broker" ? "소유주로 전환" : "중개사로 전환"}</button>
            </div>
          )}
        </div>
        {!noMenu && (
          <div style={{ height: 80, background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex", paddingBottom: 14, flexShrink: 0, boxShadow: "0 -2px 12px rgba(110,150,130,.06)" }}>
            {menus.map(t => (
              <button key={t.k} onClick={() => openMenu(t.k)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: 10, fontFamily: "inherit", position: "relative" }}>
                <div style={{ position: "relative" }}>
                  <MenuIcon active={screen === t.k}/>
                  {t.badge > 0 && <div style={{ position: "absolute", top: -6, right: -10, minWidth: 16, height: 16, borderRadius: 8, background: "#E8847C", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{t.badge}</div>}
                </div>
                <span style={{ fontSize: menus.length >= 5 ? 9 : 10, fontWeight: screen===t.k?800:500, color: screen===t.k?C.greenInk:C.gray, whiteSpace: "nowrap" }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}
        {!["splash", "login", "role", "chatroom"].includes(screen) && (
          <button onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} style={{ position: "absolute", right: 18, bottom: noMenu ? 18 : 96, width: 42, height: 42, borderRadius: 21, border: `1px solid ${C.line}`, background: "#fff", color: C.greenInk, fontSize: 18, fontWeight: 900, cursor: "pointer", zIndex: 35, boxShadow: "0 8px 20px rgba(60,90,70,.18)", fontFamily: "inherit" }}>↑</button>
        )}
        {/* 전역 모달 - 폰 프레임 직속이라 스크롤 위치와 무관하게 항상 화면 기준으로 뜸 */}
        {modal && (
          <div onClick={closeModal} style={{ position: "absolute", inset: 0, background: "#2A3A3255", zIndex: 80, display: "flex", alignItems: "flex-end", animation: "fadeIn .2s" }}>
            <div onClick={e => e.stopPropagation()} style={{ width: "100%" }}>
              {modal.type === "apply" && <ApplyMsgBody listing={modal.payload} defaultMsg={modal.defaultMsg} cost={modal.cost} onConfirm={m => { modal.onConfirm(m); closeModal(); }} onClose={closeModal}/>}
              {modal.type === "pay" && <PayBody listing={modal.payload} mode={modal.mode} cost={modal.cost} onConfirm={() => { modal.onConfirm(); closeModal(); }} onClose={closeModal}/>}
              {modal.type === "editMsg" && <EditMsgBody value={modal.payload} onSave={m => { modal.onConfirm(m); closeModal(); }} onClose={closeModal}/>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
