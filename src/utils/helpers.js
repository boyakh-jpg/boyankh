export const ROLE_LABEL = { owner: "소유주", broker: "중개사", buyer: "직거래" };
export const ROLE_NEXT = { owner: "broker", broker: "buyer", buyer: "owner" };

// ===== 완료 매물 처리 헬퍼 =====
// 완료 매물은 별도 필터에서 30일 동안만 보관
export const AUTO_HIDE_DAYS = 30;
export const NEW_DAYS = 3;
export const isDone = p => p.status === "done";
export const isExpired = p => isDone(p) && p.completedDaysAgo != null && p.completedDaysAgo >= AUTO_HIDE_DAYS;
export const isNewListing = p => p.status === "active" && (p.createdDaysAgo ?? 0) <= NEW_DAYS;
// 완료까지 남은 보관 일수
export const daysLeft = p => Math.max(0, AUTO_HIDE_DAYS - (p.completedDaysAgo ?? 0));
// 상태 필터: 거래중/신규/만료 임박/완료 보관함
export function applyStatusFilter(list, mode) {
  if (mode === "3일 이내 신규") return list.filter(isNewListing);
  if (mode === "만료 임박") return list.filter(isExpiringSoon);
  if (mode === "완료 매물") return list.filter(p => isDone(p) && !isExpired(p));
  return list.filter(p => p.status === "active");
}
export const STATUS_FILTERS = ["거래중만 보기", "3일 이내 신규", "만료 임박", "완료 매물"];

// ===== 의뢰 기한 처리 헬퍼 =====
export const DEFAULT_TERM_DAYS = 14;   // 기본 의뢰 기한 2주
export const EXTEND_DAYS = 14;         // 원터치 연장 단위
export const EXPIRE_SOON_DAYS = 3;     // 만료 임박 알림 기준
export const termLeft = p => p.expiresInDays ?? DEFAULT_TERM_DAYS;       // 남은 기한(일)
export const isTermExpired = p => p.status === "active" && termLeft(p) <= 0; // 의뢰 기한 만료
export const isExpiringSoon = p => p.status === "active" && termLeft(p) > 0 && termLeft(p) <= EXPIRE_SOON_DAYS; // 곧 만료
export const termLabel = p => { const n = termLeft(p); return n <= 0 ? "기한 만료" : n === 1 ? "내일 만료" : `${n}일 남음`; };

// ===== 예상 중개 수수료 계산 =====
// 월세 가격문자열에서 월세액(만원) 파싱: "2,000/76만" → 76
export function monthlyRent(p) {
  if (p.dealType !== "월세") return 0;
  const m = (p.price.split("/")[1] || "");
  return parseInt(m.replace(/[^0-9]/g, ""), 10) || 0;
}
// 수수료 산정 기준액(만원): 매매·전세는 거래가/보증금, 월세는 환산보증금(보증금 + 월세×100)
export function feeBase(p) {
  if (p.dealType === "월세") return p.priceNum + monthlyRent(p) * 100;
  return p.priceNum;
}
// 예상 수수료(원) = 기준액(만원)×10000 × 요율상한
export function estFee(p) {
  const rate = parseFloat(p.fee) / 100;
  return Math.round(feeBase(p) * 10000 * rate);
}
// 원 → 보기 좋은 한글 금액 ("약 OO만원" / "약 O억 O만원")
export function wonText(n) {
  if (n >= 1e8) { const eok = Math.floor(n / 1e8); const man = Math.round((n % 1e8) / 1e4); return `${eok}억${man > 0 ? ` ${man.toLocaleString()}만` : ""}원`; }
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만원`;
  return `${n.toLocaleString()}원`;
}
// 계산식 안내 문구 (툴팁/안내용)
export function feeFormula(p) {
  if (p.dealType === "월세") return `(보증금 + 월세×100) ${feeBase(p).toLocaleString()}만원 × 상한 ${p.fee}`;
  return `${feeBase(p).toLocaleString()}만원 × 상한 ${p.fee}`;
}

export function priceChangeRate(p) {
  const h = p.priceHistory || [];
  if (h.length < 2) return 0;
  const first = h[0].priceNum || p.priceNum;
  const last = h[h.length - 1].priceNum || p.priceNum;
  if (!first) return 0;
  return ((last - first) / first) * 100;
}

export const updateLabel = p => `${p.updatedAgo || p.ago || "방금 전"} 수정함`;
