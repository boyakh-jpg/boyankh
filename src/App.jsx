import { useEffect, useRef, useState } from "react";
import { C, G } from "./theme";
import { BROKER_OFFICES, normalizePropType } from "./data/data";
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
import { DEMO_USERS, getDemoUser, saveDemoUser } from "./data/demoUsers";
import { CACHE_KEYS, chatReadStateKey, countUnreadChatMessages, loadBackendState, loadCache, loadChatContextsForUser, loadListingContracts, loadLocalState, markChatThreadRead, saveBackendState, saveCache, saveChatContext, saveListingContract, syncCache, syncChatContexts } from "./data/cache";
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
const listingContractKeys = listing => [listing?.id, listing?.demoListingId, listing?.demo_listing_id].filter(Boolean).map(String);
const listingContractKey = listing => listingContractKeys(listing)[0] || "";
const contractedListingPatch = listing => ({
  status: "done",
  completedDaysAgo: 0,
  expiresInDays: 0,
  doneLabel: listing?.dealType === "전세" ? "전세완료" : listing?.dealType === "월세" || listing?.dealType === "임대" ? "임대완료" : "매도완료",
});
const applyListingContracts = (list, contracts = {}) => list.map(listing => {
  const hasContract = listingContractKeys(listing).some(key => contracts[key]);
  return hasContract ? { ...listing, ...contractedListingPatch(listing) } : listing;
});
const roleAccessFor = (_demoRole, accountType) => {
  if (accountType === "broker") return ["broker", "owner"];
  return ["owner", "buyer"];
};
const demoUserLabelFor = (users, key) => {
  if (!key) return "소유주 미지정";
  const user = users.find(item => item.id === key) || DEMO_USERS.find(item => item.id === key);
  if (user) return user.label || user.name || key;
  if (String(key).startsWith("owner-")) return `소유주 ${String(key).replace("owner-", "")}`;
  return key;
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
const getAuthUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data?.user || null;
};
const LISTING_BASE_COLUMNS = "id,demo_listing_id,title,price,address,owner_key,region,dong,complex,prop_type,deal_type,price_label,price_num,premium,area,floor,fee,fast,views,status,done_label,completed_days_ago,expires_in_days,created_days_ago,price_history,supply_area,exclusive_area,total_floor,room_count,bath_count,move_in_date,loan,description,maintenance,parking,direction,special,tenant,tenant_end,tenant_deposit,tenant_monthly,tenant_memo,lat,lng";
const LISTING_LEGACY_COLUMNS = LISTING_BASE_COLUMNS.replace(",lat,lng", "");
const LISTING_PUBLIC_COLUMNS = `${LISTING_BASE_COLUMNS},owner_phone`;
const normalizeListing = (row, ownerKey = OWNER_KEY) => ({
  id: row.id,
  demoListingId: row.demoListingId || row.demo_listing_id || null,
  mine: row.mine || row.owner_key === ownerKey,
  ownerKey: row.ownerKey || row.owner_key || (row.mine ? ownerKey : null),
  ownerPhone: row.ownerPhone || row.owner_phone || null,
  lat: row.lat != null ? Number(row.lat) : null,
  lng: row.lng != null ? Number(row.lng) : null,
  address: row.address || `${row.region || ""} ${row.dong || ""}`.trim(),
  region: row.region || "지역 미입력",
  dong: row.dong || "",
  complex: row.complex || row.title || "매물명 미입력",
  propType: normalizePropType(row.propType || row.prop_type || "아파트"),
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
  address: p.address || `${p.region || ""} ${p.dong || ""}`.trim(),
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
  lat: p.lat,
  lng: p.lng,
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
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [listingContracts, setListingContracts] = useState(() => {
    const cached = loadCache(CACHE_KEYS.listingContracts, {});
    return cached && typeof cached === "object" && !Array.isArray(cached) ? cached : {};
  });
  const contentRef = useRef(null);
  const attachOwnerLabel = listing => {
    const ownerKey = listing.ownerKey || listing.owner_key || null;
    return { ...listing, ownerLabel: listing.ownerLabel || demoUserLabelFor(demoUsers, ownerKey) };
  };
  useEffect(() => {
    let alive = true;
    loadDemoEnvironment().then(env => {
      if (!alive) return;
      const nextDemoUsers = env.demoUsers.length ? env.demoUsers : DEMO_USERS;
      setDemoUsers(nextDemoUsers);
      setBrokerOffices(env.brokerOffices.length ? env.brokerOffices : BROKER_OFFICES);
      const cachedBrokerProposals = loadCache(CACHE_KEYS.brokerProposals, []);
      const cachedBuyerProposals = loadCache(CACHE_KEYS.buyerProposals, []);
      setBrokerProposals([...(Array.isArray(cachedBrokerProposals) ? cachedBrokerProposals : []), ...env.brokerProposals]);
      setDirectBuyerProposals([...(Array.isArray(cachedBuyerProposals) ? cachedBuyerProposals : []), ...env.directBuyerProposals]);
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
    loadListingContracts().then(next => {
      if (!alive || !next || typeof next !== "object" || Array.isArray(next)) return;
      setListingContracts(next);
      setProperties(prev => applyListingContracts(prev, next));
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    async function loadListings() {
      let { data, error } = await supabase
        .from("listings")
        .select(LISTING_PUBLIC_COLUMNS);

      if (error && ["owner_phone", "lat", "lng"].some(column => error.message?.includes(column))) {
        ({ data, error } = await supabase
          .from("listings")
          .select(LISTING_LEGACY_COLUMNS));
      }

      if (error) {
        console.error("Supabase listings error:", error);
        return;
      }

      if (Array.isArray(data) && data.length > 0) {
        setProperties(applyListingContracts(data.map(row => attachOwnerLabel(normalizeListing(row, demoUser.id))), loadCache(CACHE_KEYS.listingContracts, {})));
      }
    }

    loadListings();
  }, [demoUser.id, demoUsers]);
  // 등록 완료 시 새 매물을 목록 맨 앞에 추가 (mine: true → 내 매물)
  const addProperty = async p => {
    const authUser = await getAuthUser();
    const ownerKey = demoUser.role === "owner" ? demoUser.id : OWNER_KEY;
    const insertRow = listingToInsertRow(p, ownerKey, authUser?.id || null);
    insertRow.demo_listing_id = `user-${Date.now()}`;
    if (demoUser.phone) insertRow.owner_phone = demoUser.phone;
    let data = null;
    let error = null;

    if (authUser) {
      ({ data, error } = await supabase
        .from("listings")
        .insert(insertRow)
        .select(LISTING_PUBLIC_COLUMNS)
        .single());
    } else {
      const result = await supabase.rpc("create_demo_listing", {
        owner_key_arg: ownerKey,
        listing_arg: insertRow,
      });
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Supabase insert listing error:", error);
      if (typeof window !== "undefined") window.alert("매물 등록에 실패했어요.");
      return;
    }

    setProperties(prev => [{ ...normalizeListing(data, ownerKey), mine: true, ownerKey, ownerLabel: demoUser.label }, ...prev]);
  };
  const normalizeBrokerOfficeRow = row => ({
    id: row.id,
    brokerUserId: row.broker_user_id || row.brokerUserId,
    officeName: row.office_name || row.officeName,
    agentName: row.agent_name || row.agentName,
    licenseNo: row.license_no || row.licenseNo,
    address: row.address,
    phone: row.phone,
    city: row.city || "",
    region: row.region || "전체",
    dong: row.dong || "",
    lat: row.lat,
    lng: row.lng,
    specialtyRegions: row.specialty_regions || row.specialtyRegions || [],
    specialtyTypes: (row.specialty_types || row.specialtyTypes || []).map(normalizePropType),
    verifiedDeals12m: row.verified_deals_12m || row.verifiedDeals12m || 0,
    percentileInRegion: row.percentile_in_region || row.percentileInRegion || 99,
    tier: row.tier || "검증 부동산",
    reviewCount: row.review_count || row.reviewCount || 0,
    responseMode: row.response_mode || row.responseMode || "chat",
    businessHours: row.business_hours || row.businessHours || "평일 09:00-18:00",
    lastActive: row.last_active || row.lastActive || "방금 등록",
    proposalMessage: row.proposal_message || row.proposalMessage || "",
    reviews: row.reviews || [],
  });
  const registerBrokerOffice = async draft => {
    const brokerKey = demoUser.role === "broker" ? demoUser.id : draft.brokerUserId;
    if (!brokerKey) return null;
    const officeArg = {
      office_name: draft.officeName,
      agent_name: draft.agentName,
      license_no: draft.licenseNo,
      address: draft.address,
      phone: draft.phone,
      city: draft.city,
      region: draft.region,
      dong: draft.dong,
      lat: draft.lat,
      lng: draft.lng,
      specialty_regions: draft.region ? [draft.region] : [],
      specialty_types: draft.specialtyTypes || [],
      business_hours: draft.businessHours,
      proposal_message: draft.proposalMessage,
    };
    const { data, error } = await supabase.rpc("create_demo_broker_office", {
      broker_user_id_arg: brokerKey,
      office_arg: officeArg,
    });
    if (error) {
      console.error("Supabase broker office save error:", error);
      if (typeof window !== "undefined") window.alert("부동산 등록에 실패했어요. SQL migration 실행 여부를 확인해 주세요.");
      return null;
    }
    const nextOffice = normalizeBrokerOfficeRow(data);
    setBrokerOffices(prev => [nextOffice, ...prev.filter(office => office.id !== nextOffice.id && office.brokerUserId !== brokerKey)]);
    return nextOffice;
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
    const nextChatId = target && typeof target === "object" ? target.id : target;
    if (nextChatId) markChatThreadRead(demoUser.id, role, nextChatId);
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
  const listingWithOwner = listing => {
    const ownerKey = listing.ownerKey || listing.owner_key || null;
    return { ...listing, ownerKey, ownerLabel: listing.ownerLabel || demoUserLabelFor(demoUsers, ownerKey) };
  };
  const listingKeys = listing => [listing?.id, listing?.demoListingId, listing?.demo_listing_id].filter(v => v != null).map(String);
  const findListingForProposal = proposal => properties.find(listing => listingKeys(listing).includes(String(proposal?.listingId || "")));
  const saveProposalChatContext = ({ kind, item }) => {
    const listing = findListingForProposal(item);
    if (!listing) return;
    const listingContext = listingWithOwner(listing);
    if (kind === "broker") {
      const brokerKey = item.brokerUserId || item.brokerKey || item.brokerOfficeId;
      if (!brokerKey) return;
      saveChatContext({
        id: item.chatId || `listing-${listing.id}-${brokerKey}`,
        contactRequestId: item.requestId || item.chatId || null,
        listing: listingContext,
        mode: item.activityType || (listing.fast ? "빠른의뢰" : "안심의뢰"),
        brokerKey,
        brokerName: item.brokerName || item.name || "중개사",
      });
      return;
    }
    const buyerKey = item.buyerUserId || item.buyerKey;
    if (!buyerKey) return;
    saveChatContext({
      id: item.chatId || `direct-${listing.id}-${buyerKey}`,
      contactRequestId: item.requestId || item.chatId || null,
      listing: listingContext,
      mode: "직거래",
      activityType: item.activityType || "직거래",
      buyerKey,
      buyerName: item.name || "직거래 매수자",
    });
  };
  const recordBrokerProposal = ({ listing, activityType, viewSeconds = 1 }) => {
    if (!listing) return;
    const listingId = listing.demoListingId || listing.demo_listing_id || listing.id;
    const requestId = `broker-${listingId}-${demoUser.id}`;
    const nextItem = {
      id: requestId,
      ownerKey: listing.ownerKey || listing.owner_key || null,
      listingId,
      brokerOfficeId: demoUser.id,
      brokerUserId: demoUser.id,
      brokerKey: demoUser.id,
      brokerName: demoUser.label,
      name: demoUser.label,
      office: "중개사 계정",
      deals: 0,
      msg: "",
      activityType,
      proposalNew: true,
      requestId,
      chatId: `listing-${listing.id}-${demoUser.id}`,
      listingTitle: `${listing.region || ""} ${listing.dong || ""} ${listing.complex || ""}`.trim(),
      when: "방금",
      viewSeconds,
    };
    setBrokerProposals(current => {
      const rest = current.filter(item => item.requestId !== requestId && item.chatId !== nextItem.chatId);
      const previous = current.find(item => item.requestId === requestId || item.chatId === nextItem.chatId);
      const next = [{ ...previous, ...nextItem, viewSeconds: Math.max(previous?.viewSeconds || 0, viewSeconds) }, ...rest];
      saveCache(CACHE_KEYS.brokerProposals, next.filter(item => String(item.id || "").startsWith("broker-")));
      return next;
    });
  };
  const recordDirectBuyerProposal = ({ listing, activityType }) => {
    if (!listing || demoUser.role !== "buyer") return;
    const listingId = listing.demoListingId || listing.demo_listing_id || listing.id;
    const requestId = `direct-${listingId}-${demoUser.id}`;
    const chatId = `direct-${listing.id}-${demoUser.id}`;
    const nextItem = {
      id: requestId,
      ownerKey: listing.ownerKey || listing.owner_key || null,
      listingId,
      buyerUserId: demoUser.id,
      buyerKey: demoUser.id,
      name: demoUser.label,
      note: activityType === "열람" ? "직거래 연락처 열람" : "직거래 연락처 공개 요청",
      budget: listing.price || "",
      activityType,
      proposalNew: true,
      requestId,
      chatId,
      listingTitle: `${listing.region || ""} ${listing.dong || ""} ${listing.complex || ""}`.trim(),
      when: "방금",
    };
    setDirectBuyerProposals(current => {
      const rest = current.filter(item => item.requestId !== requestId && item.chatId !== chatId);
      const previous = current.find(item => item.requestId === requestId || item.chatId === chatId);
      const next = [{ ...previous, ...nextItem }, ...rest];
      saveCache(CACHE_KEYS.buyerProposals, next.filter(item => String(item.id || "").startsWith("direct-")));
      return next;
    });
  };
  const brokerProposalForListing = listing => brokerProposals.find(item =>
    [item.brokerUserId, item.brokerKey, item.brokerOfficeId].filter(Boolean).map(String).includes(String(demoUser.id)) &&
    listingKeys(listing).includes(String(item.listingId || ""))
  );
  const openBrokerListingChat = listing => {
    const proposal = brokerProposalForListing(listing);
    const listingId = listing.demoListingId || listing.demo_listing_id || listing.id;
    openChat({
      id: proposal?.chatId || `listing-${listing.id}-${demoUser.id}`,
      contactRequestId: proposal?.requestId || `broker-${listingId}-${demoUser.id}`,
      listing: listingWithOwner(listing),
      mode: listing.fast ? "빠른의뢰" : "안심의뢰",
      brokerKey: demoUser.id,
      brokerName: demoUser.label,
    });
  };
  const directProposalForListing = listing => directBuyerProposals.find(item =>
    [item.buyerUserId, item.buyerKey].filter(Boolean).map(String).includes(String(demoUser.id)) &&
    listingKeys(listing).includes(String(item.listingId || ""))
  );
  const openDirectListingChat = listing => {
    const proposal = directProposalForListing(listing);
    const listingId = listing.demoListingId || listing.demo_listing_id || listing.id;
    openChat({
      id: proposal?.chatId || `direct-${listing.id}-${demoUser.id}`,
      contactRequestId: proposal?.requestId || `direct-${listingId}-${demoUser.id}`,
      listing: listingWithOwner(listing),
      mode: "직거래",
      activityType: proposal?.activityType || "직거래",
      buyerKey: demoUser.id,
      buyerName: demoUser.label,
    });
  };
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
    const next = await saveListingContract(contract);
    setListingContracts(next);
    setProperties(prev => applyListingContracts(prev, next));
    return next[key] || contract;
  };
  const applyDemoUser = user => {
    setDemoUser(user);
    setRole(user.role);
    setAccountType(user.role === "broker" ? "broker" : "user");
    setModal(null);
  };
  const startLogin = type => {
    setAccountType(type);
    setRole(null);
    if (type !== "broker" && demoUser.role === "broker") {
      const fallback = demoUsers.find(user => user.role === "owner") || DEMO_USERS.find(user => user.role === "owner") || DEMO_USERS[0];
      setDemoUser(fallback);
      saveDemoUser(fallback.id);
    }
    setScreen("role");
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
  useEffect(() => {
    if (!role || !demoUser.id) {
      setChatUnreadCount(0);
      return;
    }
    let alive = true;
    const readsKey = chatReadStateKey(demoUser.id, role);
    const refreshUnread = async () => {
      await syncChatContexts();
      const contexts = loadChatContextsForUser(demoUser.id, role);
      const threadIds = [...new Set(contexts.map(context => context.id).filter(Boolean))];
      if (!threadIds.length) {
        if (alive) setChatUnreadCount(0);
        return;
      }
      const localReads = loadCache(readsKey, {});
      const remoteReads = await syncCache(readsKey, localReads);
      const reads = remoteReads && typeof remoteReads === "object" && !Array.isArray(remoteReads) ? remoteReads : {};
      const { data, error } = await supabase
        .from("chat_messages")
        .select("thread_id,sender_key,created_at")
        .in("thread_id", threadIds);

      if (error) {
        console.error("Supabase chat_messages unread error:", error);
        return;
      }
      if (alive) setChatUnreadCount(countUnreadChatMessages(data || [], reads, demoUser.id));
    };

    refreshUnread();
    const channel = supabase
      .channel(`chat-unread-${demoUser.id}-${role}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        refreshUnread();
      })
      .subscribe(status => {
        if (status === "CHANNEL_ERROR") console.error("Supabase chat_messages unread realtime error");
      });

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [demoUser.id, role, screen, activeChat]);
  const ownerMenus = [{ k: "home", label: "홈" }, { k: "register", label: "의뢰하기" }, { k: "offices", label: "부동산" }, { k: "chatlist", label: "채팅", badge: chatUnreadCount }, { k: "mylist", label: "내 매물" }];
  const brokerMenus = [{ k: "home", label: "홈" }, { k: "broker", label: "매물" }, { k: "brokerViewed", label: "열람목록" }, { k: "chatlist", label: "채팅", badge: chatUnreadCount }];
  const buyerMenus = [{ k: "home", label: "홈" }, { k: "buyer", label: "매물" }, { k: "buyerViewed", label: "열람목록" }, { k: "chatlist", label: "채팅", badge: chatUnreadCount }];
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
          <span style={{ width: 30 }}/>
        </div>
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", position: "relative" }}>
          {!["splash", "login", "role", "settings"].includes(screen) && (
            <button onClick={openSettings} aria-label="설정" style={{ position: "absolute", top: 7, right: 24, zIndex: 30, width: 30, height: 30, borderRadius: 15, border: "1px solid #ffffff55", background: "#ffffff2e", color: "#fff", fontSize: 17, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, padding: 0 }}><span style={{ display: "block", transform: "translateY(-1px)" }}>⚙</span></button>
          )}
          {screen === "splash" && <Splash onNext={() => setScreen("login")}/>}
          {screen === "login" && <Login onLogin={startLogin}/>}
          {screen === "role" && <Role accountType={accountType} availableRoles={availableRoles} onSelect={r => { setRole(r); setScreen("home"); }}/>}
          {screen === "home" && <Home properties={properties} demoUser={demoUser} brokerOffices={brokerOffices} brokerProposals={brokerProposals} directBuyerProposals={directBuyerProposals} preferredRegion={preferredRegion} interestRegion={interestRegion} brokerTier={brokerTier} onRegister={() => setScreen("register")} onMyList={openMyList} onOffices={() => setScreen("offices")} onBrokerList={openBrokerList} onBuyerList={openBuyerList} onSubscription={() => setScreen("profile")} onApproveProposal={saveProposalChatContext} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {screen === "offices" && <BrokerOffices offices={brokerOffices} role={role} availableRoles={availableRoles} preferredRegion={preferredRegion} interestRegion={interestRegion} onSwitchRole={switchRole}/>}
          {screen === "register" && <Register onDone={addProperty} onClose={() => setScreen(role === "owner" ? "mylist" : "home")} onBack={() => setScreen("home")}/>}
          {screen === "mylist" && <MyList properties={properties} preset={myListPreset} viewerKey={demoUser.id} brokerProposals={brokerProposals} directBuyerProposals={directBuyerProposals} onRegister={() => setScreen("register")} onSetDone={setDealDone} onExtendTerm={extendTerm} onUpdatePrice={updatePrice} onUpdateListing={updateListingInfo} onApproveProposal={saveProposalChatContext} role={role} availableRoles={availableRoles} onSwitchRole={switchRole}/>}
          {["broker", "brokerViewed"].includes(screen) && <Broker properties={properties} brokerProposals={brokerProposals} preset={brokerPreset} menuMode={screen === "brokerViewed" ? "viewed" : "all"} role={role} availableRoles={availableRoles} tier={brokerTier} onSwitchRole={switchRole} onOpenChat={openBrokerListingChat} onRecordProposal={recordBrokerProposal} openModal={setModal}/>}
          {["buyer", "buyerViewed"].includes(screen) && <BuyerExplore properties={properties} directBuyerProposals={directBuyerProposals} preset={buyerPreset} menuMode={screen === "buyerViewed" ? "viewed" : "all"} onSwitchRole={switchRole} availableRoles={availableRoles} viewerRole="buyer" openModal={setModal} onOpenChat={openDirectListingChat} onRecordProposal={recordDirectBuyerProposal}/>}
          {screen === "direct" && <BuyerExplore properties={properties} directBuyerProposals={directBuyerProposals} viewerRole={role === "broker" ? "broker" : "owner"} availableRoles={availableRoles} onSwitchRole={switchRole} openModal={setModal} onOpenChat={openDirectListingChat} onRecordProposal={recordDirectBuyerProposal}/>}
          {screen === "settings" && <Settings role={role} availableRoles={availableRoles} onSwitchRole={switchRole} preferredRegion={preferredRegion} interestRegion={interestRegion} onRegionChange={setPreferredRegion} onInterestRegionChange={setInterestRegion} notifications={notifications} onToggleNotification={toggleNotification} brokerTier={brokerTier} demoUsers={demoUsers} brokerOffices={brokerOffices} onRegisterBrokerOffice={registerBrokerOffice} onSubscription={() => setScreen("profile")} onDemoUserChange={applyDemoUser} onBack={() => setScreen(settingsBack)}/>}
          {screen === "chatlist" && <ChatList onOpen={openChat} role={role} availableRoles={availableRoles} onSwitchRole={switchRole} properties={properties} demoUsers={demoUsers}/>}
          {screen === "chatroom" && <ChatRoom chatId={activeChat} chatContext={activeChatContext} role={role} listingContracts={listingContracts} onContractListing={contractListingFromChat} onBack={() => setScreen("chatlist")} properties={properties} demoUsers={demoUsers}/>}
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
