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
