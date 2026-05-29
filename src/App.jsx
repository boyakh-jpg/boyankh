import { useEffect, useRef, useState } from "react";
import { C, G } from "./theme";
import { BROKER_OFFICES, CHATS } from "./data/data";
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
import { supabase } from "./supabaseClient";
import { DEMO_USERS, getDemoUser } from "./data/demoUsers";
import { CACHE_KEYS, loadBackendState, loadCache, loadLocalState, saveBackendState, saveCache, saveChatContext, syncCache } from "./data/cache";
import { loadDemoEnvironment } from "./data/supabaseData";

const loadSetting = (key, fallback) => {
  const saved = loadLocalState(key, null);
  if (saved !== null && saved !== undefined) return saved;
  try {
    if (typeof window === "undefined") return fallback;
    const legacy = window.localStorage.getItem(key);
    return legacy == null ? fallback : JSON.parse(legacy);
  } catch {
    return fallback;
  }
};
const saveSetting = (key, value) => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  saveBackendState(key, value);
};
const listingContractKey = listing => String(listing?.id || listing?.demoListingId || listing?.demo_listing_id || "");
const contractedListingPatch = listing => ({
  status: "done",
  completedDaysAgo: 0,
  expiresInDays: 0,
  doneLabel: listing?.dealType === "전세" ? "전세완료" : listing?.dealType === "월세" || listing?.dealType === "임대" ? "임대완료" : "매도완료",
});
const applyListingContracts = (list, contracts = {}) => list.map(listing => {
  const key = listingContractKey(listing);
  return key && contracts[key] ? { ...listing, ...contractedListingPatch(listing) } : listing;
});
const roleAccessFor = (demoRole, accountType) => {
  if (demoRole === "broker" || accountType === "broker") return ["broker", "owner"];
  if (demoRole === "buyer") return ["buyer", "owner"];
  return ["owner", "buyer"];
};
const OWNER_KEY = "toad-demo-owner";
const requireAuthUser = async action => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    console.error(`Supabase auth required for ${action}:`, error || "no authenticated user");
    if (typeof window !== "undefined") window.alert("로그인 후 이용할 수 있어요.");
    return null;
  }
  return data.user;
};
const demoOwnerPhoneFor = id => {
  const n = String(id || "demo").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return `010-${String(2300 + (n % 7000)).padStart(4, "0")}-${String(1000 + ((n * 17) % 9000)).padStart(4, "0")}`;
};
const LISTING_PUBLIC_COLUMNS = "id,demo_listing_id,title,price,address,owner_key,region,dong,complex,prop_type,deal_type,price_label,price_num,premium,area,floor,fee,fast,views,status,done_label,completed_days_ago,expires_in_days,created_days_ago,price_history,supply_area,exclusive_area,total_floor,room_count,bath_count,move_in_date,loan,description,maintenance,parking,direction,special,tenant,tenant_end,tenant_deposit,tenant_monthly,tenant_memo";
const normalizeListing = (row, ownerKey = OWNER_KEY) => ({
  id: row.id,
  demoListingId: row.demoListingId || row.demo_listing_id || null,
  mine: row.mine || row.owner_key === ownerKey,
  ownerKey: row.ownerKey || row.owner_key || (row.mine ? ownerKey : null),
  ownerPhone: row.ownerPhone || row.owner_phone || demoOwnerPhoneFor(row.id),
  region: row.region || "지역 미입력",
  dong: row.dong || "",
  complex: row.complex || row.title || "매물명 미입력",
  propType: row.propType || row.prop_type || "아파트",
  dealType: row.dealType || row.deal_type || "매매",
  price: row.price_label || row.priceText || row.price_text || (typeof row.price === "number" ? `${row.price.toLocaleString()}만` : row.price) || "가격 미입력",
  priceNum: row.priceNum || row.price_num || (typeof row.price === "number" ? row.price : 0),
  premium: row.premium ?? null,
  area: row.area || row.exclusive_area || 0,
  floor: row.floor || 1,
  fee: row.fee || "0.4%",
  fast: !!row.fast,
  views: row.views || 0,
  ago: row.ago || "방금 전",
  x: row.x || 50,
  y: row.y || 50,
  badge: row.badge || null,
  status: row.status || "active",
  doneLabel: row.doneLabel || row.done_label || "거래완료",
  completedDaysAgo: row.completedDaysAgo ?? row.completed_days_ago ?? null,
  expiresInDays: row.expiresInDays ?? row.expires_in_days ?? 14,
  createdDaysAgo: row.createdDaysAgo ?? row.created_days_ago ?? 0,
  priceHistory: row.priceHistory || row.price_history || [],
  supplyArea: row.supplyArea || row.supply_area,
  exclusiveArea: row.exclusiveArea || row.exclusive_area,
  totalFloor: row.totalFloor || row.total_floor,
  roomCount: row.roomCount || row.room_count,
  bathCount: row.bathCount || row.bath_count,
  moveInDate: row.moveInDate || row.move_in_date,
  loan: row.loan,
  description: row.description,
  maintenance: row.maintenance,
  parking: row.parking,
  direction: row.direction,
  special: row.special,
  tenant: row.tenant,
  tenantEnd: row.tenantEnd || row.tenant_end,
  tenantDeposit: row.tenantDeposit || row.tenant_deposit,
  tenantMonthly: row.tenantMonthly || row.tenant_monthly,
  tenantMemo: row.tenantMemo || row.tenant_memo,
});
const listingToInsertRow = (p, ownerKey = OWNER_KEY, userId = null) => ({
  title: p.complex || "새 매물",
  owner_key: ownerKey,
  ...(userId ? { user_id: userId } : {}),
  price: p.priceNum || 0,
  address: `${p.region || ""} ${p.dong || ""}`.trim(),
  region: p.region,
  dong: p.dong,
  complex: p.complex,
  prop_type: p.propType,
  deal_type: p.dealType,
  price_label: p.price,
  price_num: p.priceNum,
  premium: p.premium,
  area: p.area,
  floor: p.floor,
  fee: p.fee,
  fast: p.fast,
  views: p.views,
  status: p.status,
  done_label: p.doneLabel,
  completed_days_ago: p.completedDaysAgo,
  expires_in_days: p.expiresInDays,
  created_days_ago: p.createdDaysAgo,
  price_history: p.priceHistory || [],
  supply_area: p.supplyArea,
  exclusive_area: p.exclusiveArea,
  total_floor: p.totalFloor,
  room_count: p.roomCount,
  bath_count: p.bathCount,
  move_in_date: p.moveInDate,
  loan: p.loan,
  description: p.description,
  maintenance: p.maintenance,
  parking: p.parking,
  direction: p.direction,
  special: p.special,
  tenant: p.tenant,
  tenant_end: p.tenantEnd,
  tenant_deposit: p.tenantDeposit,
  tenant_monthly: p.tenantMonthly,
  tenant_memo: p.tenantMemo,
});
const listingPatchToRow = patch => {
  const row = {};
  const map = {
    propType: "prop_type",
    dealType: "deal_type",
    price: "price_label",
    priceNum: "price_num",
    doneLabel: "done_label",
    completedDaysAgo: "completed_days_ago",
    expiresInDays: "expires_in_days",
    createdDaysAgo: "created_days_ago",
    priceHistory: "price_history",
    supplyArea: "supply_area",
    exclusiveArea: "exclusive_area",
    totalFloor: "total_floor",
    roomCount: "room_count",
    bathCount: "bath_count",
    moveInDate: "move_in_date",
    updatedAgo: "updated_ago",
    updatedReason: "updated_reason",
    tenantEnd: "tenant_end",
    tenantDeposit: "tenant_deposit",
    tenantMonthly: "tenant_monthly",
    tenantMemo: "tenant_memo",
  };
  Object.entries(patch).forEach(([key, value]) => {
    row[map[key] || key] = value;
  });
  if (patch.priceNum != null) row.price = patch.priceNum;
  if (patch.complex) row.title = patch.complex;
  if (patch.region || patch.dong) row.address = `${patch.region || ""} ${patch.dong || ""}`.trim();
  return row;
};
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [accountType, setAccountType] = useState("user");
  const [role, setRole] = useState(null);
  const [demoUser, setDemoUser] = useState(() => getDemoUser());
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatContext, setActiveChatContext] = useState(null);
  const [modal, setModal] = useState(null); // { type, payload, onConfirm }
  const [brokerTier, setBrokerTier] = useState("골드");
  const [preferredRegion, setPreferredRegion] = useState(() => loadSetting("toad.preferredRegion", "강남구"));
  const [interestRegion, setInterestRegion] = useState(() => loadSetting("toad.interestRegion", "마포구"));
  const [notifications, setNotifications] = useState(() => loadSetting("toad.notifications", { newListing: true, expiringSoon: true, priceChange: true, chat: true, points: true }));
  const [settingsBack, setSettingsBack] = useState("home");
  const [brokerPreset, setBrokerPreset] = useState({});
  const [buyerPreset, setBuyerPreset] = useState({});
  const [myListPreset, setMyListPreset] = useState({});
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [demoUsers, setDemoUsers] = useState(DEMO_USERS);
  const [brokerOffices, setBrokerOffices] = useState(BROKER_OFFICES);
  const [brokerProposals, setBrokerProposals] = useState([]);
  const [directBuyerProposals, setDirectBuyerProposals] = useState([]);
  const [listingContracts, setListingContracts] = useState(() => {
    const cached = loadCache(CACHE_KEYS.listingContracts, {});
    return cached && typeof cached === "object" && !Array.isArray(cached) ? cached : {};
  });
  const contentRef = useRef(null);
  useEffect(() => {
    let alive = true;
    loadDemoEnvironment().then(env => {
      if (!alive) return;
      const nextDemoUsers = env.demoUsers.length ? env.demoUsers : DEMO_USERS;
      setDemoUsers(nextDemoUsers);
      setBrokerOffices(env.brokerOffices.length ? env.brokerOffices : BROKER_OFFICES);
      setBrokerProposals(env.brokerProposals);
      setDirectBuyerProposals(env.directBuyerProposals);
      setDemoUser(getDemoUser(nextDemoUsers));
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    Promise.all([
      loadBackendState("toad.preferredRegion", preferredRegion),
      loadBackendState("toad.interestRegion", interestRegion),
      loadBackendState("toad.notifications", notifications),
    ]).then(([nextPreferredRegion, nextInterestRegion, nextNotifications]) => {
      if (!alive) return;
      setPreferredRegion(nextPreferredRegion || "강남구");
      setInterestRegion(nextInterestRegion || "마포구");
      if (nextNotifications && typeof nextNotifications === "object" && !Array.isArray(nextNotifications)) setNotifications(nextNotifications);
      setSettingsHydrated(true);
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (settingsHydrated) saveSetting("toad.preferredRegion", preferredRegion); }, [preferredRegion, settingsHydrated]);
  useEffect(() => { if (settingsHydrated) saveSetting("toad.interestRegion", interestRegion); }, [interestRegion, settingsHydrated]);
  useEffect(() => { if (settingsHydrated) saveSetting("toad.notifications", notifications); }, [notifications, settingsHydrated]);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);
  // ===== 공용 매물 store (owner/broker/buyer가 같은 데이터를 봄) =====
  const [properties, setProperties] = useState([]);
  useEffect(() => {
    let alive = true;
    syncCache(CACHE_KEYS.listingContracts, {}).then(next => {
      if (!alive || !next || typeof next !== "object" || Array.isArray(next)) return;
      setListingContracts(next);
      setProperties(prev => applyListingContracts(prev, next));
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from("listings")
        .select(LISTING_PUBLIC_COLUMNS);

      if (error) {
        console.error("Supabase listings error:", error);
        return;
      }

      if (Array.isArray(data) && data.length > 0) {
        setProperties(applyListingContracts(data.map(row => normalizeListing(row, demoUser.id)), loadCache(CACHE_KEYS.listingContracts, {})));
      }
    }

    loadListings();
  }, [demoUser.id]);
  // 등록 완료 시 새 매물을 목록 맨 앞에 추가 (mine: true → 내 매물)
  const addProperty = async p => {
    const authUser = await requireAuthUser("insert listing");
    if (!authUser) return;
    const insertRow = listingToInsertRow(p, authUser.id, authUser.id);
    let { data, error } = await supabase
      .from("listings")
      .insert(insertRow)
      .select(LISTING_PUBLIC_COLUMNS)
      .single();

    if (error && error.message?.includes("owner_key")) {
      const fallbackRow = { ...insertRow };
      delete fallbackRow.owner_key;
      ({ data, error } = await supabase
        .from("listings")
        .insert(fallbackRow)
        .select(LISTING_PUBLIC_COLUMNS)
        .single());
    }

    if (error) {
      console.error("Supabase insert listing error:", error);
      if (typeof window !== "undefined") window.alert("매물 등록에 실패했어요.");
      return;
    }

    setProperties(prev => [{ ...normalizeListing(data, authUser.id), mine: true, ownerKey: authUser.id }, ...prev]);
  };
  // 거래 완료/되돌리기 토글
  const setDealDone = async (id, done) => {
    if (!(await requireAuthUser("update listing status"))) return;
    const patch = { status: done ? "done" : "active", completedDaysAgo: done ? 0 : null };
    const { error } = await supabase
      .from("listings")
      .update(listingPatchToRow(patch))
      .eq("id", id);

    if (error) {
      console.error("Supabase update listing status error:", error);
      if (typeof window !== "undefined") window.alert("매물 수정에 실패했어요.");
      return;
    }
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };
  // 의뢰 기한 2주 연장
  const extendTerm = async id => {
    if (!(await requireAuthUser("extend listing term"))) return;
    const current = properties.find(p => p.id === id);
    const nextDays = (current?.expiresInDays ?? 14) + 14;
    const patch = { expiresInDays: nextDays };
    const { error } = await supabase
      .from("listings")
      .update(listingPatchToRow(patch))
      .eq("id", id);

    if (error) {
      console.error("Supabase extend listing term error:", error);
      if (typeof window !== "undefined") window.alert("매물 수정에 실패했어요.");
      return;
    }
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };
  const updatePrice = async (id, priceNum, price, reason) => {
    if (!(await requireAuthUser("update listing price"))) return;
    const current = properties.find(p => p.id === id);
    const priceHistory = [
      ...(current?.priceHistory?.length ? current.priceHistory : [{ date: "2026-05-01", priceNum: current?.priceNum || priceNum, reason: "최초 등록" }]),
      { date: new Date().toISOString().slice(0, 10), priceNum, reason },
    ];
    const patch = {
      priceNum,
      price,
      updatedAgo: "방금 전",
      updatedReason: reason,
      priceHistory,
    };
    const { error } = await supabase
      .from("listings")
      .update(listingPatchToRow(patch))
      .eq("id", id);

    if (error) {
      console.error("Supabase update listing price error:", error);
      if (typeof window !== "undefined") window.alert("매물 수정에 실패했어요.");
      return;
    }
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  };
  const updateListingInfo = async (id, patch) => {
    if (!(await requireAuthUser("update listing info"))) return;
    const nextPatch = {
      ...patch,
      updatedAgo: "방금 전",
      updatedReason: "매물 정보 수정",
    };
    const { error } = await supabase
      .from("listings")
      .update(listingPatchToRow(nextPatch))
      .eq("id", id);

    if (error) {
      console.error("Supabase update listing info error:", error);
      if (typeof window !== "undefined") window.alert("매물 수정에 실패했어요.");
      return;
    }
    setProperties(prev => prev.map(p => p.id === id ? { ...p, ...nextPatch } : p));
  };
  const closeModal = () => setModal(null);
  const availableRoles = roleAccessFor(demoUser.role, accountType);
  const switchRole = () => {
    if (availableRoles.length < 2) return;
    const nr = availableRoles[(availableRoles.indexOf(role) + 1) % availableRoles.length];
    setRole(nr);
    setModal(null);
    setScreen("home");
  };
  const openChat = target => {
    if (target && typeof target === "object") {
      saveChatContext(target);
      setActiveChat(target.id);
      setActiveChatContext(target);
    } else {
      setActiveChat(target);
      setActiveChatContext(null);
    }
    setScreen("chatroom");
  };
  const listingWithOwner = listing => ({ ...listing, ownerKey: listing.ownerKey || listing.owner_key || null });
  const openBrokerListingChat = listing => openChat({
    id: `listing-${listing.id}-${demoUser.id}`,
    listing: listingWithOwner(listing),
    mode: listing.fast ? "빠른의뢰" : "안심의뢰",
    brokerKey: demoUser.id,
    brokerName: demoUser.label,
  });
  const openDirectListingChat = listing => openChat({
    id: `direct-${listing.id}-${demoUser.id}`,
    listing: listingWithOwner(listing),
    mode: "직거래",
    buyerKey: demoUser.id,
    buyerName: demoUser.label,
  });
  const contractListingFromChat = async ({ listingId, chatId, partnerName, property }) => {
    const key = String(listingId || "");
    if (!key) return null;
    const current = loadCache(CACHE_KEYS.listingContracts, {});
    const base = current && typeof current === "object" && !Array.isArray(current) ? current : {};
    if (base[key] && base[key].chatId !== chatId) return base[key];
    const contract = {
      listingId: key,
      chatId,
      partnerName,
      property,
      contractedAt: new Date().toISOString(),
    };
    const next = { ...base, [key]: contract };
    setListingContracts(next);
    saveCache(CACHE_KEYS.listingContracts, next);
    setProperties(prev => applyListingContracts(prev, next));

    const listing = properties.find(item => listingContractKey(item) === key);
    if (listing) {
      const patch = contractedListingPatch(listing);
      supabase
        .from("listings")
        .update(listingPatchToRow(patch))
        .eq("id", listing.id)
        .then(({ error }) => {
          if (error) console.error("Supabase contract listing update error:", error);
        });
    }
    return contract;
  };
  const applyDemoUser = user => {
    setDemoUser(user);
    setRole(user.role);
    setAccountType(user.role === "broker" ? "broker" : "user");
    setModal(null);
  };
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
  const roleLabel = { owner: "소유주", broker: "중개사", buyer: "직거래" };
  const nextRole = availableRoles[(availableRoles.indexOf(role) + 1) % availableRoles.length] || availableRoles[0];
  const noMenu = ["splash", "login", "role", "register", "chatroom"].includes(screen);
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
          {screen === "role" && <Role accountType={accountType} availableRoles={availableRoles} onSelect={r => { setRole(r); setScreen("home"); }}/>}
          {screen === "home" && <Home properties={properties} demoUser={demoUser} brokerOffices={brokerOffices} brokerProposals={brokerProposals} directBuyerProposals={directBuyerProposals} preferredRegion={preferredRegion} interestRegion={interestRegion} brokerTier={brokerTier} onRegister={() => setScreen("register")} onMyList={openMyList} onOffices={() => setScreen("offices")} onBrokerList={openBrokerList} onBuyerList={openBuyerList} onSubscription={() => setScreen("profile")} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {screen === "offices" && <BrokerOffices offices={brokerOffices} role={role} availableRoles={availableRoles} preferredRegion={preferredRegion} interestRegion={interestRegion} onSwitchRole={switchRole}/>}
          {screen === "register" && <Register onDone={addProperty} onClose={() => setScreen(role === "owner" ? "mylist" : "home")} onBack={() => setScreen("home")}/>}
          {screen === "mylist" && <MyList properties={properties} preset={myListPreset} viewerKey={demoUser.id} onRegister={() => setScreen("register")} onSetDone={setDealDone} onExtendTerm={extendTerm} onUpdatePrice={updatePrice} onUpdateListing={updateListingInfo} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {["broker", "brokerViewed"].includes(screen) && <Broker properties={properties} preset={brokerPreset} menuMode={screen === "brokerViewed" ? "viewed" : "all"} role={role} availableRoles={availableRoles} tier={brokerTier} onSwitchRole={switchRole} onOpenChat={openBrokerListingChat} openModal={setModal}/>}
          {["buyer", "buyerViewed"].includes(screen) && <BuyerExplore properties={properties} preset={buyerPreset} menuMode={screen === "buyerViewed" ? "viewed" : "all"} onSwitchRole={switchRole} availableRoles={availableRoles} viewerRole="buyer" openModal={setModal} onOpenChat={openDirectListingChat}/>}
          {screen === "direct" && <BuyerExplore properties={properties} viewerRole={role === "broker" ? "broker" : "owner"} availableRoles={availableRoles} onSwitchRole={switchRole} openModal={setModal} onOpenChat={openDirectListingChat}/>}
          {screen === "settings" && <Settings role={role} availableRoles={availableRoles} onSwitchRole={switchRole} preferredRegion={preferredRegion} interestRegion={interestRegion} onRegionChange={setPreferredRegion} onInterestRegionChange={setInterestRegion} notifications={notifications} onToggleNotification={toggleNotification} brokerTier={brokerTier} demoUsers={demoUsers} onSubscription={() => setScreen("profile")} onDemoUserChange={applyDemoUser} onOpenDemoChat={() => openChat("demo-test-chat")} onBack={() => setScreen(settingsBack)}/>}
          {screen === "chatlist" && <ChatList onOpen={openChat} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {screen === "chatroom" && <ChatRoom chatId={activeChat} chatContext={activeChatContext} role={role} listingContracts={listingContracts} onContractListing={contractListingFromChat} onBack={() => setScreen("chatlist")}/>}
          {screen === "profile" && role === "broker" && <Subscription picked={brokerTier} availableRoles={availableRoles} onPick={setBrokerTier} onSwitchRole={switchRole}/>}
          {screen === "profile" && role !== "broker" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, background: G.pageBg }}>
              <Frog mood="sleepy" size={110} animate/>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.dark }}>준비 중이에요</div>
              <div style={{ fontSize: 13, color: C.gray }}>곧 업데이트될 예정이에요</div>
              <button onClick={switchRole} style={{ marginTop: 12, background: G.greenSoft, border: `1.5px solid ${C.green}`, borderRadius: 20, padding: "10px 20px", color: C.greenInk, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{roleLabel[nextRole]}로 전환</button>
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
