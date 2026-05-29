import { supabase } from "../supabaseClient";

export const CACHE_VERSION = 1;

export const CACHE_KEYS = {
  contactDecisions: "toad.contactDecisions",
  viewedListings: "toad.viewedListings",
  favoriteListings: "toad.favoriteListings",
  brokerProposals: "toad.brokerProposals",
  buyerProposals: "toad.buyerProposals",
  pointLedger: "toad.pointLedger",
  chatMessages: "toad.chatMessages",
  proposalViews: "toad.proposalViews",
};


const APP_STATE_TABLE = "demo_app_state";
const DEDICATED_STATE_TABLES = [
  { table: "contact_unlocks", patterns: ["brokerContacted", "buyerUnlocked", "contactDecisions"] },
  { table: "property_views", patterns: ["brokerViewed"] },
  { table: "broker_applications", patterns: ["brokerSafeRequests"] },
  { table: "contact_requests", patterns: ["buyerRequests"] },
  { table: "chats", patterns: ["chatContexts"] },
  { table: "profiles", patterns: ["settingsProfile"] },
  { table: "support_tickets", patterns: ["supportLastInquiry"] },
  { table: "reports", patterns: ["supportLastReport"] },
];
const STATE_STORAGE_PREFIX = "toad.state";
const memoryCache = {};
const POINT_BALANCE_PREFIX = "toad.pointBalance";
const CHAT_CONTEXTS_KEY = "toad.chatContexts";
export const POINT_DEFAULTS = { owner: 12000, buyer: 30000, broker: 50000 };

const stateStorageKey = key => `${STATE_STORAGE_PREFIX}.${key}`;

const tableForStateKey = key =>
  DEDICATED_STATE_TABLES.find(route => route.patterns.some(pattern => key.includes(pattern)))?.table || APP_STATE_TABLE;

const readLocalJson = (key, fallback) => {
  try {
    if (typeof window === "undefined") return fallback;
    const saved = window.localStorage.getItem(key);
    return saved == null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
};

const writeLocalJson = (key, value) => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

export function loadLocalState(key, fallback) {
  return readLocalJson(stateStorageKey(key), fallback);
}

export function saveLocalState(key, value) {
  writeLocalJson(stateStorageKey(key), value);
  return value;
}

export async function loadBackendState(key, fallback) {
  const local = loadLocalState(key, fallback);
  const table = tableForStateKey(key);
  try {
    const { data, error } = await supabase
      .from(table)
      .select("payload")
      .eq("state_key", key)
      .maybeSingle();

    if (error) throw error;
    if (data?.payload !== undefined && data?.payload !== null) {
      saveLocalState(key, data.payload);
      return data.payload;
    }
  } catch (error) {
    if (table === APP_STATE_TABLE) console.error("Supabase demo_app_state load error:", error);
  }

  if (table !== APP_STATE_TABLE) {
    try {
      const { data, error } = await supabase
        .from(APP_STATE_TABLE)
        .select("payload")
        .eq("state_key", key)
        .maybeSingle();

      if (error) throw error;
      if (data?.payload !== undefined && data?.payload !== null) {
        saveLocalState(key, data.payload);
        return data.payload;
      }
    } catch (error) {
      console.error(`Supabase ${table} load fallback error:`, error);
    }
  }
  return local;
}

export async function saveBackendState(key, value) {
  saveLocalState(key, value);
  const table = tableForStateKey(key);
  try {
    const { error } = await supabase
      .from(table)
      .upsert({ state_key: key, payload: value, updated_at: new Date().toISOString() }, { onConflict: "state_key" });
    if (error) throw error;
  } catch (error) {
    if (table === APP_STATE_TABLE) {
      console.error("Supabase demo_app_state save error:", error);
      return value;
    }
    try {
      const { error: fallbackError } = await supabase
        .from(APP_STATE_TABLE)
        .upsert({ state_key: key, payload: value, updated_at: new Date().toISOString() }, { onConflict: "state_key" });
      if (fallbackError) throw fallbackError;
    } catch (fallbackError) {
      console.error(`Supabase ${table} save fallback error:`, fallbackError);
    }
  }
  return value;
}

export const userStateKey = (userId, name) => `toad.${userId || "guest"}.${name}`;

export function loadUserMapStateLocal(userId, name, fallback = {}) {
  const key = userStateKey(userId, name);
  const saved = loadLocalState(key, null);
  if (saved && typeof saved === "object" && !Array.isArray(saved)) return saved;
  const legacy = readLocalJson(key, fallback);
  return legacy && typeof legacy === "object" && !Array.isArray(legacy) ? legacy : fallback;
}

export async function loadUserMapState({ userId, name, fallback = {} }) {
  const value = await loadBackendState(userStateKey(userId, name), loadUserMapStateLocal(userId, name, fallback));
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

export function saveUserMapState({ userId, name, value }) {
  const key = userStateKey(userId, name);
  writeLocalJson(key, value);
  return saveBackendState(key, value);
}

export const getDefaultPointBalance = role => POINT_DEFAULTS[role] ?? POINT_DEFAULTS.owner;

const pointBalanceKey = userId => `${POINT_BALANCE_PREFIX}.${userId || "guest"}`;

export function loadLocalPointBalance(userId, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const saved = window.localStorage.getItem(pointBalanceKey(userId));
    const parsed = saved == null ? fallback : Number(JSON.parse(saved));
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocalPointBalance(userId, balance) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(pointBalanceKey(userId), JSON.stringify(balance));
  } catch {}
}

export async function loadPointBalance({ userId, defaultBalance }) {
  const fallback = loadLocalPointBalance(userId, defaultBalance);
  try {
    const { data, error } = await supabase
      .from("user_points")
      .select("balance")
      .eq("user_key", userId)
      .maybeSingle();

    if (error) throw error;
    if (data && typeof data.balance === "number") {
      saveLocalPointBalance(userId, data.balance);
      return data.balance;
    }

    const { error: upsertError } = await supabase
      .from("user_points")
      .upsert({ user_key: userId, balance: fallback }, { onConflict: "user_key" });
    if (upsertError) throw upsertError;
  } catch (error) {
    console.error("Supabase user_points load error:", error);
  }
  return fallback;
}

export async function savePointBalance({ userId, balance, delta = 0, reason = "point_update" }) {
  saveLocalPointBalance(userId, balance);
  try {
    const { error } = await supabase
      .from("user_points")
      .upsert({ user_key: userId, balance }, { onConflict: "user_key" });
    if (error) throw error;

    if (delta !== 0) {
      const { error: ledgerError } = await supabase
        .from("point_ledger")
        .insert({ user_key: userId, delta, balance_after: balance, reason });
      if (ledgerError) throw ledgerError;
    }
  } catch (error) {
    console.error("Supabase user_points save error:", error);
  }
}

const safeListingForChat = listing => ({
  id: listing.id,
  ownerKey: listing.ownerKey || listing.owner_key || null,
  region: listing.region,
  dong: listing.dong,
  complex: listing.complex,
  propType: listing.propType,
  dealType: listing.dealType,
  price: listing.price,
  fast: !!listing.fast,
  status: listing.status,
  expiresInDays: listing.expiresInDays,
});

export function loadChatContexts() {
  const saved = loadLocalState(CHAT_CONTEXTS_KEY, null);
  if (Array.isArray(saved)) return saved;
  const legacy = readLocalJson(CHAT_CONTEXTS_KEY, []);
  return Array.isArray(legacy) ? legacy : [];
}

export function saveChatContext(context) {
  if (!context?.id || !context?.listing) return;
  try {
    const nextContext = {
      ...context,
      listing: safeListingForChat(context.listing),
      updatedAt: new Date().toISOString(),
    };
    const rest = loadChatContexts().filter(item => item.id !== context.id);
    const next = [nextContext, ...rest].slice(0, 80);
    writeLocalJson(CHAT_CONTEXTS_KEY, next);
    saveBackendState(CHAT_CONTEXTS_KEY, next);
  } catch {}
}

export async function syncChatContexts() {
  const contexts = await loadBackendState(CHAT_CONTEXTS_KEY, loadChatContexts());
  return Array.isArray(contexts) ? contexts : [];
}

export function loadChatContextsForUser(userId, role) {
  return loadChatContexts().filter(context => {
    if (role === "owner") return context.listing?.ownerKey === userId;
    if (role === "buyer") return context.buyerKey === userId;
    if (role === "broker") return context.brokerKey === userId;
    return false;
  });
}

export function loadCache(key, fallback) {
  if (Object.prototype.hasOwnProperty.call(memoryCache, key)) return memoryCache[key];
  const local = loadLocalState(key, fallback);
  memoryCache[key] = local;
  return local;
}

export function saveCache(key, value) {
  memoryCache[key] = value;
  saveBackendState(key, value);
  return value;
}

export async function syncCache(key, fallback) {
  const value = await loadBackendState(key, fallback);
  memoryCache[key] = value;
  return value;
}

export function makeContactDecision({ requestId, actorType, actorId, listingId, decision }) {
  return {
    requestId,
    actorType,
    actorId,
    listingId,
    decision,
    decidedAt: new Date().toISOString(),
  };
}
