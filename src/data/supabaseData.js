import { supabase } from "../supabaseClient";

const asArray = value => Array.isArray(value) ? value : [];
const byId = rows => Object.fromEntries(asArray(rows).map(row => [row.id, row]));

const whenFrom = createdAt => {
  if (!createdAt) return "방금 전";
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "방금 전";
  const minutes = Math.max(0, Math.round((Date.now() - created) / 60000));
  if (minutes < 60) return `${Math.max(1, minutes)}분 전`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}시간 전`;
  return `${Math.round(minutes / 1440)}일 전`;
};

const normalizeDemoUsers = rows => asArray(rows).map(row => ({
  id: row.id,
  name: row.name,
  role: row.role,
  label: row.label || row.name,
  desc: row.description || row.desc || "",
  region: row.region || "전체",
  phone: row.phone || "",
}));

const normalizeOffice = row => ({
  id: row.id,
  brokerUserId: row.broker_user_id,
  officeName: row.office_name,
  agentName: row.agent_name,
  licenseNo: row.license_no,
  address: row.address,
  phone: row.phone,
  region: row.region,
  specialtyRegions: row.specialty_regions || [],
  specialtyTypes: row.specialty_types || [],
  verifiedDeals12m: row.verified_deals_12m || 0,
  percentileInRegion: row.percentile_in_region || 99,
  tier: row.tier || "검증 부동산",
  reviewCount: row.review_count || 0,
  responseMode: row.response_mode || "chat",
  businessHours: row.business_hours || "평일 09:00-18:00",
  lastActive: row.last_active || "오늘 활동",
  proposalMessage: row.proposal_message || "",
  reviews: row.reviews || [],
});

const normalizeBrokerProposal = (row, office) => ({
  ...(office || {}),
  id: row.id,
  ownerKey: row.owner_key,
  listingId: row.listing_id,
  brokerOfficeId: row.broker_office_id,
  name: office?.agentName || "중개사",
  office: office?.officeName || "부동산",
  deals: office?.verifiedDeals12m || 0,
  msg: office?.proposalMessage || "",
  activityType: row.activity_type,
  proposalNew: !!row.proposal_new,
  requestId: row.request_id,
  chatId: row.chat_id,
  listingTitle: row.listing_title,
  when: whenFrom(row.created_at),
});

const normalizeDirectBuyer = row => ({
  id: row.id,
  ownerKey: row.owner_key,
  buyerUserId: row.buyer_user_id,
  listingId: row.listing_id,
  name: row.name,
  note: row.note,
  budget: row.budget,
  activityType: row.activity_type,
  proposalNew: !!row.proposal_new,
  requestId: row.request_id,
  chatId: row.chat_id,
  listingTitle: row.listing_title,
  when: whenFrom(row.created_at),
});

const safeSelect = async (table, columns) => {
  try {
    const { data, error } = await supabase.from(table).select(columns);
    if (error) throw error;
    return asArray(data);
  } catch (error) {
    console.error(`Supabase ${table} load error:`, error);
    return [];
  }
};

export async function loadDemoEnvironment() {
  const [users, offices, brokerProposals, directBuyerProposals] = await Promise.all([
    safeSelect("demo_users", "id,role,name,label,description,region,phone"),
    safeSelect("broker_offices", "id,broker_user_id,office_name,agent_name,license_no,address,phone,region,specialty_regions,specialty_types,verified_deals_12m,percentile_in_region,tier,review_count,response_mode,business_hours,last_active,proposal_message,reviews"),
    safeSelect("broker_proposals", "id,owner_key,listing_id,broker_office_id,activity_type,proposal_new,request_id,chat_id,listing_title,created_at"),
    safeSelect("direct_buyer_proposals", "id,owner_key,buyer_user_id,listing_id,name,note,budget,activity_type,proposal_new,request_id,chat_id,listing_title,created_at"),
  ]);
  const officesById = byId(offices);
  const normalizedUsers = normalizeDemoUsers(users);
  const normalizedOffices = offices.map(normalizeOffice);
  const normalizedOfficeById = byId(normalizedOffices);

  return {
    demoUsers: normalizedUsers,
    brokerOffices: normalizedOffices,
    brokerProposals: brokerProposals.map(row => normalizeBrokerProposal(row, normalizedOfficeById[row.broker_office_id] || officesById[row.broker_office_id])),
    directBuyerProposals: directBuyerProposals.map(normalizeDirectBuyer),
  };
}
