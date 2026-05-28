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
};


const memoryCache = {};
const POINT_BALANCE_PREFIX = "toad.pointBalance";
const CHAT_CONTEXTS_KEY = "toad.chatContexts";
export const POINT_DEFAULTS = { owner: 12000, buyer: 30000, broker: 50000 };

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
  try {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem(CHAT_CONTEXTS_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CHAT_CONTEXTS_KEY, JSON.stringify([nextContext, ...rest].slice(0, 80)));
    }
  } catch {}
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
  return memoryCache[key] ?? fallback;
}

export function saveCache(key, value) {
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
