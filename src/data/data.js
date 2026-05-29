const agoToDays = ago => {
  if (!ago || /방금|분|시간/.test(ago)) return 0;
  if (ago === "어제") return 1;
  const day = ago.match(/(\d+)일/);
  if (day) return Number(day[1]);
  const week = ago.match(/(\d+)주/);
  if (week) return Number(week[1]) * 7;
  return 0;
};

const makePriceHistory = (priceNum, idx) => {
  const direction = idx % 4 === 0 ? 1 : -1;
  const gap = Math.max(500, Math.round(priceNum * (0.015 + (idx % 5) * 0.006)));
  const first = Math.max(500, priceNum - direction * gap);
  return [
    { date: "2026-05-01", priceNum: first, reason: "최초 등록" },
    { date: "2026-05-27", priceNum, reason: direction < 0 ? "가격 인하" : "시세 반영 상향" },
  ];
};

const makeTenantInfo = (p, idx) => {
  if (p.tenant) return {};
  const canHaveTenant = p.dealType === "매매" && ["아파트", "빌라", "오피스텔", "상가"].includes(p.propType);
  if (!canHaveTenant) return { tenant: "없어요 (공실)" };
  if (idx % 3 !== 0) return { tenant: "없어요 (공실)" };
  const hasMonthly = idx % 2 === 0;
  const deposit = Math.max(1000, Math.round((p.priceNum || 10000) * (hasMonthly ? 0.08 : 0.42)));
  return {
    tenant: "있어요",
    tenantDeposit: String(deposit),
    tenantMonthly: hasMonthly ? String(80 + (idx % 7) * 20) : "",
    tenantEnd: `202${6 + (idx % 3)}년 ${((idx % 12) + 1)}월`,
    tenantMemo: hasMonthly ? "임대차 승계 조건 확인 필요" : "전세 승계 매수자에게 적합",
  };
};

const DEMO_OWNER_PHONES = ["010-2384-1027", "010-5192-7741", "010-7640-3318", "010-4268-5903", "010-9021-6475"];
const makeOwnerPhone = (p, idx) => p.ownerPhone || DEMO_OWNER_PHONES[idx % DEMO_OWNER_PHONES.length];

const RAW_PROPERTIES = [
  { id: "p1", region: "서초구", dong: "반포동", complex: "아이파크", propType: "빌라", dealType: "월세", price: "1억/74만", priceNum: 10000, area: 84, floor: 19, fee: "0.3%", fast: false, views: 30, ago: "12분 전", x: 51, y: 56, badge: null, status: "done", doneLabel: "임대완료", completedDaysAgo: 1 },
  { id: "p2", region: "영등포구", dong: "여의도동", complex: "더샵 2단지", propType: "토지", dealType: "매매", price: "22억 4,477만", priceNum: 224477, area: 133, floor: 2, fee: "0.5%", fast: false, views: 9, ago: "어제", x: 30, y: 50, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 4 },
  { id: "p3", region: "마포구", dong: "합정동", complex: "트리마제 1단지", propType: "아파트", dealType: "월세", price: "2,000/76만", priceNum: 2000, area: 133, floor: 19, fee: "0.6%", fast: true, views: 15, ago: "5일 전", x: 29, y: 28, badge: "HOT", status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p4", region: "용산구", dong: "청파동", complex: "아크로5차", propType: "상가", dealType: "임대", price: "1억/166만", priceNum: 10000, area: 84, floor: 10, fee: "0.4%", fast: false, views: 92, ago: "5시간 전", x: 48, y: 47, badge: null, status: "done", doneLabel: "임대완료", completedDaysAgo: 1 },
  { id: "p5", region: "강동구", dong: "둔촌동", complex: "푸르지오 1단지", propType: "오피스텔", dealType: "매매", price: "16억 9,608만", priceNum: 169608, area: 49, floor: 25, fee: "0.4%", fast: true, views: 65, ago: "3일 전", x: 81, y: 56, badge: "NEW", status: "done", doneLabel: "매도완료", completedDaysAgo: 3 },
  { id: "p6", region: "서초구", dong: "방배동", complex: "우성5차", propType: "상가", dealType: "임대", price: "1,000/73만", priceNum: 1000, area: 72, floor: 16, fee: "0.6%", fast: false, views: 10, ago: "2시간 전", x: 60, y: 56, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p7", region: "영등포구", dong: "문래동", complex: "센트럴파크2차", propType: "아파트", dealType: "전세", price: "10억 5,074만", priceNum: 105074, area: 45, floor: 16, fee: "0.3%", fast: true, views: 39, ago: "2일 전", x: 34, y: 52, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p8", region: "송파구", dong: "문정동", complex: "현대3차", propType: "빌라", dealType: "전세", price: "4억 2,947만", priceNum: 42947, area: 99, floor: 28, fee: "0.5%", fast: true, views: 56, ago: "32분 전", x: 76, y: 56, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p9", region: "송파구", dong: "문정동", complex: "더샵", propType: "아파트", dealType: "매매", price: "18억 7,130만", priceNum: 187130, area: 133, floor: 6, fee: "0.4%", fast: true, views: 21, ago: "5시간 전", x: 79, y: 56, badge: "NEW", status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p10", region: "마포구", dong: "합정동", complex: "아이파크5차", propType: "오피스텔", dealType: "월세", price: "1억/150만", priceNum: 10000, area: 99, floor: 13, fee: "0.5%", fast: true, views: 84, ago: "32분 전", x: 23, y: 35, badge: "NEW", status: "done", doneLabel: "임대완료", completedDaysAgo: 0 },
  { id: "p11", region: "송파구", dong: "가락동", complex: "푸르지오", propType: "오피스텔", dealType: "매매", price: "20억 8,578만", priceNum: 208578, area: 49, floor: 18, fee: "0.3%", fast: false, views: 81, ago: "32분 전", x: 79, y: 56, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0 },
  { id: "p12", region: "성동구", dong: "옥수동", complex: "갤러리아포레", propType: "오피스텔", dealType: "전세", price: "4억 119만", priceNum: 40119, area: 102, floor: 15, fee: "0.5%", fast: false, views: 13, ago: "2일 전", x: 63, y: 38, badge: null, status: "done", doneLabel: "전세완료", completedDaysAgo: 1 },
  { id: "p13", region: "마포구", dong: "합정동", complex: "한가람3차", propType: "아파트", dealType: "매매", price: "9억 8,430만", priceNum: 98430, area: 115, floor: 1, fee: "0.5%", fast: true, views: 85, ago: "5시간 전", x: 24, y: 36, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p14", region: "마포구", dong: "상암동", complex: "더샵 1단지", propType: "토지", dealType: "매매", price: "2,000만", priceNum: 2000, area: 99, floor: 24, fee: "0.4%", fast: true, views: 66, ago: "2시간 전", x: 20, y: 40, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
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
  { id: "p25", region: "강동구", dong: "명일동", complex: "아크로 1단지", propType: "상가", dealType: "임대", price: "1억/125만", priceNum: 10000, area: 115, floor: 3, fee: "0.3%", fast: false, views: 103, ago: "2시간 전", x: 81, y: 45, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p26", region: "성동구", dong: "성수동", complex: "e편한세상5차", propType: "토지", dealType: "매매", price: "3,000만", priceNum: 3000, area: 49, floor: 18, fee: "0.5%", fast: false, views: 92, ago: "32분 전", x: 64, y: 45, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0 },
  { id: "p27", region: "영등포구", dong: "여의도동", complex: "자이3차", propType: "아파트", dealType: "매매", price: "8억 1,952만", priceNum: 81952, area: 133, floor: 28, fee: "0.4%", fast: true, views: 113, ago: "어제", x: 33, y: 54, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p28", region: "성동구", dong: "행당동", complex: "더샵", propType: "아파트", dealType: "월세", price: "2,000/117만", priceNum: 2000, area: 33, floor: 6, fee: "0.4%", fast: false, views: 83, ago: "2일 전", x: 55, y: 38, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p29", region: "마포구", dong: "상암동", complex: "리센츠", propType: "아파트", dealType: "매매", price: "6억 4,022만", priceNum: 64022, area: 33, floor: 24, fee: "0.5%", fast: false, views: 27, ago: "1주 전", x: 27, y: 29, badge: "HOT", status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p30", region: "영등포구", dong: "양평동", complex: "한가람3차", propType: "오피스텔", dealType: "전세", price: "11억 5,143만", priceNum: 115143, area: 59, floor: 8, fee: "0.4%", fast: true, views: 115, ago: "32분 전", x: 33, y: 46, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p31", region: "강남구", dong: "대치동", complex: "파크리오2차", propType: "상가", dealType: "임대", price: "1,000/71만", priceNum: 1000, area: 145, floor: 27, fee: "0.5%", fast: false, views: 88, ago: "방금 전", x: 69, y: 56, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
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
  { id: "p44", region: "영등포구", dong: "문래동", complex: "푸르지오", propType: "토지", dealType: "매매", price: "3,000만", priceNum: 3000, area: 49, floor: 8, fee: "0.4%", fast: true, views: 43, ago: "방금 전", x: 40, y: 52, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null },
  { id: "p45", region: "영등포구", dong: "당산동", complex: "파크리오5차", propType: "상가", dealType: "매매", price: "22억 1,196만", priceNum: 221196, area: 49, floor: 21, fee: "0.4%", fast: false, views: 119, ago: "2시간 전", x: 34, y: 51, badge: "HOT", status: "done", doneLabel: "매도완료", completedDaysAgo: 1 },
  { id: "p46", region: "성동구", dong: "옥수동", complex: "리버뷰 2단지", propType: "상가", dealType: "임대", price: "2,000/127만", priceNum: 2000, area: 102, floor: 18, fee: "0.6%", fast: true, views: 24, ago: "3일 전", x: 64, y: 41, badge: null, status: "done", doneLabel: "임대완료", completedDaysAgo: 2 },
  { id: "p47", region: "용산구", dong: "청파동", complex: "파크리오2차", propType: "아파트", dealType: "전세", price: "9억 6,799만", priceNum: 96799, area: 59, floor: 8, fee: "0.3%", fast: true, views: 74, ago: "5일 전", x: 45, y: 44, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p48", region: "용산구", dong: "이촌동", complex: "파크리오 2단지", propType: "상가", dealType: "임대", price: "1억/103만", priceNum: 10000, area: 99, floor: 9, fee: "0.4%", fast: false, views: 66, ago: "1주 전", x: 45, y: 42, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null },
  { id: "p49", region: "용산구", dong: "이촌동", complex: "리버뷰5차", propType: "아파트", dealType: "매매", price: "22억 9,290만", priceNum: 229290, area: 102, floor: 14, fee: "0.4%", fast: false, views: 114, ago: "2일 전", x: 51, y: 52, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 1 },
  { id: "p50", region: "강동구", dong: "고덕동", complex: "한가람5차", propType: "아파트", dealType: "전세", price: "8억 3,844만", priceNum: 83844, area: 59, floor: 26, fee: "0.3%", fast: true, views: 22, ago: "1주 전", x: 81, y: 55, badge: "HOT", status: "active", doneLabel: "전세완료", completedDaysAgo: null },
  { id: "p51", region: "강남구", dong: "대치동", complex: "래미안 1차", propType: "아파트", dealType: "매매", price: "3억 5,000만", priceNum: 35000, premium: null, area: 33, floor: 1, fee: "0.3%", fast: true, views: 8, ago: "방금 전", x: 64, y: 53, badge: "HOT", status: "done", doneLabel: "매도완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p52", region: "서초구", dong: "서초동", complex: "자이 2차", propType: "빌라", dealType: "전세", price: "4억 2,391만", priceNum: 42391, premium: null, area: 45, floor: 8, fee: "0.4%", fast: false, views: 21, ago: "12분 전", x: 57, y: 54, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p53", region: "송파구", dong: "가락동", complex: "푸르지오 3차", propType: "오피스텔", dealType: "월세", price: "3,000/104만", priceNum: 3000, premium: null, area: 49, floor: 15, fee: "0.5%", fast: true, views: 34, ago: "32분 전", x: 78, y: 55, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p54", region: "강동구", dong: "명일동", complex: "힐스테이트 4차", propType: "상가", dealType: "임대", price: "5,000/121만", priceNum: 5000, premium: 1633, area: 59, floor: 22, fee: "0.6%", fast: false, views: 47, ago: "1시간 전", x: 87, y: 50, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p55", region: "마포구", dong: "공덕동", complex: "아이파크 5차", propType: "토지", dealType: "매매", price: "6억 4,564만", priceNum: 64564, premium: null, area: 72, floor: 29, fee: "0.3%", fast: true, views: 60, ago: "2시간 전", x: 29, y: 36, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p56", region: "용산구", dong: "이촌동", complex: "더샵 1차", propType: "입주권", dealType: "권리양도", price: "7억 1,955만", priceNum: 71955, premium: 2055, area: 84, floor: 7, fee: "0.4%", fast: false, views: 73, ago: "5시간 전", x: 46, y: 47, badge: "NEW", status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p57", region: "성동구", dong: "금호동", complex: "롯데캐슬 2차", propType: "분양권", dealType: "전매", price: "7억 9,346만", priceNum: 79346, premium: 2266, area: 99, floor: 14, fee: "0.5%", fast: true, views: 86, ago: "어제", x: 59, y: 44, badge: null, status: "done", doneLabel: "전매완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p58", region: "영등포구", dong: "양평동", complex: "e편한세상 3차", propType: "재개발", dealType: "권리양도", price: "8억 6,737만", priceNum: 86737, premium: 2477, area: 102, floor: 21, fee: "0.6%", fast: false, views: 99, ago: "2일 전", x: 33, y: 48, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p59", region: "강남구", dong: "대치동", complex: "센트럴파크 4차", propType: "아파트", dealType: "월세", price: "5,000/206만", priceNum: 5000, premium: null, area: 115, floor: 28, fee: "0.3%", fast: true, views: 112, ago: "3일 전", x: 67, y: 54, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p60", region: "서초구", dong: "서초동", complex: "리버뷰 5차", propType: "빌라", dealType: "매매", price: "10억 1,519만", priceNum: 101519, premium: null, area: 133, floor: 6, fee: "0.4%", fast: false, views: 125, ago: "5일 전", x: 60, y: 55, badge: "HOT", status: "active", doneLabel: "매도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p61", region: "송파구", dong: "가락동", complex: "한가람 1차", propType: "오피스텔", dealType: "전세", price: "10억 8,910만", priceNum: 108910, premium: null, area: 145, floor: 13, fee: "0.5%", fast: true, views: 20, ago: "방금 전", x: 76, y: 56, badge: "NEW", status: "active", doneLabel: "전세완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p62", region: "강동구", dong: "명일동", complex: "우성 2차", propType: "상가", dealType: "임대", price: "2,000/77만", priceNum: 2000, premium: 3321, area: 33, floor: 20, fee: "0.6%", fast: false, views: 33, ago: "12분 전", x: 85, y: 51, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p63", region: "마포구", dong: "공덕동", complex: "래미안 3차", propType: "토지", dealType: "매매", price: "12억 3,692만", priceNum: 123692, premium: null, area: 45, floor: 27, fee: "0.3%", fast: true, views: 46, ago: "32분 전", x: 27, y: 37, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p64", region: "용산구", dong: "이촌동", complex: "자이 4차", propType: "입주권", dealType: "권리양도", price: "13억 1,083만", priceNum: 131083, premium: 3743, area: 49, floor: 5, fee: "0.4%", fast: false, views: 59, ago: "1시간 전", x: 49, y: 48, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p65", region: "성동구", dong: "금호동", complex: "푸르지오 5차", propType: "분양권", dealType: "전매", price: "13억 8,474만", priceNum: 138474, premium: 3954, area: 59, floor: 12, fee: "0.5%", fast: true, views: 72, ago: "2시간 전", x: 62, y: 38, badge: null, status: "active", doneLabel: "전매완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p66", region: "영등포구", dong: "양평동", complex: "힐스테이트 1차", propType: "재개발", dealType: "권리양도", price: "14억 5,865만", priceNum: 145865, premium: 4165, area: 72, floor: 19, fee: "0.6%", fast: false, views: 85, ago: "5시간 전", x: 31, y: 49, badge: "NEW", status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p67", region: "강남구", dong: "대치동", complex: "아이파크 2차", propType: "아파트", dealType: "전세", price: "15억 3,256만", priceNum: 153256, premium: null, area: 84, floor: 26, fee: "0.3%", fast: true, views: 98, ago: "어제", x: 65, y: 55, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p68", region: "서초구", dong: "서초동", complex: "더샵 3차", propType: "빌라", dealType: "월세", price: "3,000/179만", priceNum: 3000, premium: null, area: 99, floor: 4, fee: "0.4%", fast: false, views: 111, ago: "2일 전", x: 58, y: 56, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p69", region: "송파구", dong: "가락동", complex: "롯데캐슬 4차", propType: "오피스텔", dealType: "매매", price: "16억 8,038만", priceNum: 168038, premium: null, area: 102, floor: 11, fee: "0.5%", fast: true, views: 124, ago: "3일 전", x: 79, y: 57, badge: "HOT", status: "done", doneLabel: "매도완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p70", region: "강동구", dong: "명일동", complex: "e편한세상 5차", propType: "상가", dealType: "임대", price: "1억/213만", priceNum: 10000, premium: 5009, area: 115, floor: 18, fee: "0.6%", fast: false, views: 19, ago: "5일 전", x: 88, y: 52, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p71", region: "마포구", dong: "공덕동", complex: "센트럴파크 1차", propType: "토지", dealType: "매매", price: "18억 2,820만", priceNum: 182820, premium: null, area: 133, floor: 25, fee: "0.3%", fast: true, views: 32, ago: "방금 전", x: 25, y: 38, badge: "NEW", status: "active", doneLabel: "매도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p72", region: "용산구", dong: "이촌동", complex: "리버뷰 2차", propType: "입주권", dealType: "권리양도", price: "19억 211만", priceNum: 190211, premium: 5431, area: 145, floor: 3, fee: "0.4%", fast: false, views: 45, ago: "12분 전", x: 47, y: 42, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p73", region: "성동구", dong: "금호동", complex: "한가람 3차", propType: "분양권", dealType: "전매", price: "19억 7,602만", priceNum: 197602, premium: 5642, area: 33, floor: 10, fee: "0.5%", fast: true, views: 58, ago: "32분 전", x: 60, y: 39, badge: null, status: "active", doneLabel: "전매완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p74", region: "영등포구", dong: "양평동", complex: "우성 4차", propType: "재개발", dealType: "권리양도", price: "20억 4,993만", priceNum: 204993, premium: 5853, area: 45, floor: 17, fee: "0.6%", fast: false, views: 71, ago: "1시간 전", x: 34, y: 50, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p75", region: "강남구", dong: "대치동", complex: "래미안 5차", propType: "아파트", dealType: "매매", price: "21억 2,384만", priceNum: 212384, premium: null, area: 49, floor: 24, fee: "0.3%", fast: true, views: 84, ago: "2시간 전", x: 68, y: 56, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p76", region: "서초구", dong: "서초동", complex: "자이 1차", propType: "빌라", dealType: "전세", price: "21억 9,775만", priceNum: 219775, premium: null, area: 59, floor: 2, fee: "0.4%", fast: false, views: 97, ago: "5시간 전", x: 56, y: 57, badge: "NEW", status: "active", doneLabel: "전세완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p77", region: "송파구", dong: "가락동", complex: "푸르지오 2차", propType: "오피스텔", dealType: "월세", price: "2,000/152만", priceNum: 2000, premium: null, area: 72, floor: 9, fee: "0.5%", fast: true, views: 110, ago: "어제", x: 77, y: 58, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p78", region: "강동구", dong: "명일동", complex: "힐스테이트 3차", propType: "상가", dealType: "임대", price: "3,000/169만", priceNum: 3000, premium: 6697, area: 84, floor: 16, fee: "0.6%", fast: false, views: 123, ago: "2일 전", x: 86, y: 53, badge: "HOT", status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p79", region: "마포구", dong: "공덕동", complex: "아이파크 4차", propType: "토지", dealType: "매매", price: "24억 1,948만", priceNum: 241948, premium: null, area: 99, floor: 23, fee: "0.3%", fast: true, views: 18, ago: "3일 전", x: 28, y: 32, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p80", region: "용산구", dong: "이촌동", complex: "더샵 5차", propType: "입주권", dealType: "권리양도", price: "24억 9,339만", priceNum: 249339, premium: 7119, area: 102, floor: 1, fee: "0.4%", fast: false, views: 31, ago: "5일 전", x: 50, y: 43, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p81", region: "성동구", dong: "금호동", complex: "롯데캐슬 1차", propType: "분양권", dealType: "전매", price: "25억 6,730만", priceNum: 256730, premium: 7330, area: 115, floor: 8, fee: "0.5%", fast: true, views: 44, ago: "방금 전", x: 58, y: 40, badge: "NEW", status: "done", doneLabel: "전매완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p82", region: "영등포구", dong: "양평동", complex: "e편한세상 2차", propType: "재개발", dealType: "권리양도", price: "26억 4,121만", priceNum: 264121, premium: 7541, area: 133, floor: 15, fee: "0.6%", fast: false, views: 57, ago: "12분 전", x: 32, y: 51, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p83", region: "강남구", dong: "대치동", complex: "센트럴파크 3차", propType: "아파트", dealType: "월세", price: "3,000/74만", priceNum: 3000, premium: null, area: 145, floor: 22, fee: "0.3%", fast: true, views: 70, ago: "32분 전", x: 66, y: 57, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p84", region: "서초구", dong: "서초동", complex: "리버뷰 4차", propType: "빌라", dealType: "매매", price: "27억 8,903만", priceNum: 278903, premium: null, area: 33, floor: 29, fee: "0.4%", fast: false, views: 83, ago: "1시간 전", x: 59, y: 58, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p85", region: "송파구", dong: "가락동", complex: "한가람 5차", propType: "오피스텔", dealType: "전세", price: "28억 6,294만", priceNum: 286294, premium: null, area: 45, floor: 7, fee: "0.5%", fast: true, views: 96, ago: "2시간 전", x: 80, y: 59, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p86", region: "강동구", dong: "명일동", complex: "우성 1차", propType: "상가", dealType: "임대", price: "1,000/125만", priceNum: 1000, premium: 8385, area: 49, floor: 14, fee: "0.6%", fast: false, views: 109, ago: "5시간 전", x: 84, y: 47, badge: "NEW", status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p87", region: "마포구", dong: "공덕동", complex: "래미안 2차", propType: "토지", dealType: "매매", price: "30억 1,076만", priceNum: 301076, premium: null, area: 59, floor: 21, fee: "0.3%", fast: true, views: 122, ago: "어제", x: 26, y: 33, badge: "HOT", status: "done", doneLabel: "매도완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p88", region: "용산구", dong: "이촌동", complex: "자이 3차", propType: "입주권", dealType: "권리양도", price: "30억 8,467만", priceNum: 308467, premium: 8807, area: 72, floor: 28, fee: "0.4%", fast: false, views: 17, ago: "2일 전", x: 48, y: 44, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p89", region: "성동구", dong: "금호동", complex: "푸르지오 4차", propType: "분양권", dealType: "전매", price: "3억 5,858만", priceNum: 35858, premium: 9018, area: 84, floor: 6, fee: "0.5%", fast: true, views: 30, ago: "3일 전", x: 61, y: 41, badge: null, status: "active", doneLabel: "전매완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p90", region: "영등포구", dong: "양평동", complex: "힐스테이트 5차", propType: "재개발", dealType: "권리양도", price: "4억 3,249만", priceNum: 43249, premium: 9229, area: 99, floor: 13, fee: "0.6%", fast: false, views: 43, ago: "5일 전", x: 35, y: 52, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p91", region: "강남구", dong: "대치동", complex: "아이파크 1차", propType: "아파트", dealType: "전세", price: "5억 640만", priceNum: 50640, premium: null, area: 102, floor: 20, fee: "0.3%", fast: true, views: 56, ago: "방금 전", x: 64, y: 58, badge: "NEW", status: "active", doneLabel: "전세완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p92", region: "서초구", dong: "서초동", complex: "더샵 2차", propType: "빌라", dealType: "월세", price: "2,000/227만", priceNum: 2000, premium: null, area: 115, floor: 27, fee: "0.4%", fast: false, views: 69, ago: "12분 전", x: 57, y: 59, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p93", region: "송파구", dong: "가락동", complex: "롯데캐슬 3차", propType: "오피스텔", dealType: "매매", price: "6억 5,422만", priceNum: 65422, premium: null, area: 133, floor: 5, fee: "0.5%", fast: true, views: 82, ago: "32분 전", x: 78, y: 53, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p94", region: "강동구", dong: "명일동", complex: "e편한세상 4차", propType: "상가", dealType: "임대", price: "5,000/81만", priceNum: 5000, premium: 1073, area: 145, floor: 12, fee: "0.6%", fast: false, views: 95, ago: "1시간 전", x: 87, y: 48, badge: null, status: "active", doneLabel: "임대완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p95", region: "마포구", dong: "공덕동", complex: "센트럴파크 5차", propType: "토지", dealType: "매매", price: "8억 204만", priceNum: 80204, premium: null, area: 33, floor: 19, fee: "0.3%", fast: true, views: 108, ago: "2시간 전", x: 29, y: 34, badge: null, status: "active", doneLabel: "매도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p96", region: "용산구", dong: "이촌동", complex: "리버뷰 1차", propType: "입주권", dealType: "권리양도", price: "8억 7,595만", priceNum: 87595, premium: 1495, area: 45, floor: 26, fee: "0.4%", fast: false, views: 121, ago: "5시간 전", x: 46, y: 45, badge: "HOT", status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p97", region: "성동구", dong: "금호동", complex: "한가람 2차", propType: "분양권", dealType: "전매", price: "9억 4,986만", priceNum: 94986, premium: 1706, area: 49, floor: 4, fee: "0.5%", fast: true, views: 16, ago: "어제", x: 59, y: 42, badge: null, status: "active", doneLabel: "전매완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p98", region: "영등포구", dong: "양평동", complex: "우성 3차", propType: "재개발", dealType: "권리양도", price: "10억 2,377만", priceNum: 102377, premium: 1917, area: 59, floor: 11, fee: "0.6%", fast: false, views: 29, ago: "2일 전", x: 33, y: 53, badge: null, status: "active", doneLabel: "양도완료", completedDaysAgo: null, expiresInDays: 14 },
  { id: "p99", region: "강남구", dong: "대치동", complex: "래미안 4차", propType: "아파트", dealType: "매매", price: "10억 9,768만", priceNum: 109768, premium: null, area: 72, floor: 18, fee: "0.3%", fast: true, views: 42, ago: "3일 전", x: 67, y: 59, badge: null, status: "done", doneLabel: "매도완료", completedDaysAgo: 0, expiresInDays: 14 },
  { id: "p100", region: "서초구", dong: "서초동", complex: "자이 5차", propType: "빌라", dealType: "전세", price: "11억 7,159만", priceNum: 117159, premium: null, area: 84, floor: 25, fee: "0.4%", fast: false, views: 55, ago: "5일 전", x: 60, y: 53, badge: null, status: "active", doneLabel: "전세완료", completedDaysAgo: null, expiresInDays: 14 },
];
export const PROPERTIES = RAW_PROPERTIES.map((p, i) => ({
  ...p,
  ...makeTenantInfo(p, i),
  ownerPhone: makeOwnerPhone(p, i),
  createdDaysAgo: p.createdDaysAgo ?? agoToDays(p.ago),
  completedDaysAgo: p.status === "done" ? (p.completedDaysAgo ?? (i % 29)) : null,
  expiresInDays: p.expiresInDays ?? Math.max(1, 14 - (i % 13)),
  updatedAgo: p.updatedAgo || p.ago,
  priceHistory: p.priceHistory || makePriceHistory(p.priceNum, i),
}));
export const REGIONS = ["전체", "강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "성동구", "영등포구"];
export const PROP_TYPES = ["전체", "아파트", "빌라", "오피스텔", "상가", "토지", "입주권", "분양권", "재개발"];
export const DEAL_TYPES_BY_PROP = {
  "전체": ["전체", "매매", "전세", "월세", "임대", "권리양도", "전매"],
  "아파트": ["전체", "매매", "전세", "월세"],
  "빌라": ["전체", "매매", "전세", "월세"],
  "빌라/다세대": ["전체", "매매", "전세", "월세"],
  "단독주택": ["전체", "매매", "전세", "월세"],
  "오피스텔": ["전체", "매매", "전세", "월세"],
  "상가": ["전체", "매매", "임대"],
  "토지": ["전체", "매매"],
  "입주권": ["전체", "권리양도"],
  "분양권": ["전체", "전매"],
  "재개발": ["전체", "권리양도"],
  "재개발·재건축": ["전체", "권리양도"],
};

const officeTier = percentile => percentile <= 3 ? "지역 대표 부동산" : percentile <= 10 ? "지역 파워 부동산" : percentile <= 30 ? "지역 우수 부동산" : "검증 부동산";

const STATIC_BROKER_OFFICES = [
  {
    id: "bo1",
    officeName: "마포 스마트공인중개사",
    agentName: "김민준",
    licenseNo: "11440-2021-00321",
    address: "서울 마포구 공덕동 467",
    phone: "02-701-2301",
    region: "마포구",
    specialtyRegions: ["마포구", "용산구"],
    specialtyTypes: ["아파트", "오피스텔"],
    verifiedDeals12m: 42,
    percentileInRegion: 8,
    tier: officeTier(8),
    reviewCount: 18,
    responseMode: "chat",
    businessHours: "평일 09:00-18:00",
    lastActive: "오늘 활동",
    proposalMessage: "공덕동 동일 단지 계약 경험이 있어요. 가격 조정 없이 먼저 대기 수요부터 확인해보겠습니다.",
    reviews: [
      { id: "r1", tags: ["동네 시세를 잘 알아요", "설명이 정확했어요"], text: "최근 실거래와 호가 차이를 쉽게 설명해줘서 판단하기 편했어요.", createdAt: "2026-05-20" },
      { id: "r2", tags: ["일정 조율이 빨라요"], text: "방문 일정이 빠르게 잡혀서 좋았습니다.", createdAt: "2026-05-12" },
    ],
  },
  {
    id: "bo2",
    officeName: "공덕 부동산플러스",
    agentName: "이수연",
    licenseNo: "11440-2020-00198",
    address: "서울 마포구 도화동 36",
    phone: "02-712-8841",
    region: "마포구",
    specialtyRegions: ["마포구"],
    specialtyTypes: ["아파트", "빌라"],
    verifiedDeals12m: 31,
    percentileInRegion: 18,
    tier: officeTier(18),
    reviewCount: 11,
    responseMode: "call",
    businessHours: "평일 10:00-19:00 · 토 10:00-15:00",
    lastActive: "3시간 전 제안",
    proposalMessage: "실거주 매수 대기 고객을 보유 중이에요. 무리한 호가 조정보다 먼저 반응을 보겠습니다.",
    reviews: [
      { id: "r3", tags: ["무리한 가격을 권하지 않았어요"], text: "가격을 낮추자고만 하지 않고 상황별 선택지를 줬어요.", createdAt: "2026-05-18" },
    ],
  },
  {
    id: "bo3",
    officeName: "마포 한강공인중개사",
    agentName: "박지훈",
    licenseNo: "11440-2018-00412",
    address: "서울 마포구 합정동 381",
    phone: "02-335-9012",
    region: "마포구",
    specialtyRegions: ["마포구", "영등포구"],
    specialtyTypes: ["상가", "아파트"],
    verifiedDeals12m: 28,
    percentileInRegion: 24,
    tier: officeTier(24),
    reviewCount: 9,
    responseMode: "sms",
    businessHours: "평일 09:30-18:30",
    lastActive: "어제 활동",
    proposalMessage: "상가와 아파트 모두 비교해서 수요층을 나눠 제안드릴 수 있어요.",
    reviews: [
      { id: "r4", tags: ["설명이 정확했어요"], text: "상권 설명이 구체적이라 도움이 됐어요.", createdAt: "2026-05-08" },
    ],
  },
  {
    id: "bo4",
    officeName: "공덕역 으뜸부동산",
    agentName: "최은영",
    licenseNo: "11440-2016-00277",
    address: "서울 마포구 공덕동 256",
    phone: "02-704-6680",
    region: "마포구",
    specialtyRegions: ["마포구", "성동구"],
    specialtyTypes: ["아파트", "전세"],
    verifiedDeals12m: 56,
    percentileInRegion: 3,
    tier: officeTier(3),
    reviewCount: 24,
    responseMode: "chat",
    businessHours: "평일 09:00-20:00 · 토 10:00-16:00",
    lastActive: "오늘 계약 1건",
    proposalMessage: "현재 매수 대기 고객 3팀 있습니다. 이번 주 안에 1차 반응 확인 가능합니다.",
    reviews: [
      { id: "r5", tags: ["일정 조율이 빨라요", "동네 시세를 잘 알아요"], text: "진행 상황을 짧게 자주 알려줘서 안심됐어요.", createdAt: "2026-05-22" },
      { id: "r6", tags: ["설명이 정확했어요"], text: "계약 전 확인할 서류를 잘 챙겨줬어요.", createdAt: "2026-05-15" },
    ],
  },
];

const BROKER_REGIONS = ["강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "성동구", "영등포구"];
const BROKER_DONGS = ["역삼동", "반포동", "잠실동", "천호동", "공덕동", "이촌동", "성수동", "여의도동"];
const BROKER_TYPES = ["아파트", "오피스텔", "빌라", "상가"];
const BROKER_NAMES = ["김민준", "이수연", "박지훈", "최은영", "정하늘", "오하린", "서민재", "강도윤", "한유진", "문지성"];
const padBroker = value => String(value).padStart(3, "0");

export const BROKER_OFFICES = Array.from({ length: 30 }, (_, index) => {
  const base = STATIC_BROKER_OFFICES[index % STATIC_BROKER_OFFICES.length];
  const n = index + 1;
  const id = `office-${padBroker(n)}`;
  const region = BROKER_REGIONS[index % BROKER_REGIONS.length];
  const dong = BROKER_DONGS[index % BROKER_DONGS.length];
  const mainType = BROKER_TYPES[index % BROKER_TYPES.length];
  const percentile = 3 + ((n * 7) % 35);
  const verifiedDeals12m = 12 + ((n * 3) % 60);
  return {
    ...base,
    id,
    brokerUserId: `broker-${padBroker(n)}`,
    officeName: `${region} 토드공인중개사 ${String(n).padStart(2, "0")}`,
    agentName: BROKER_NAMES[index % BROKER_NAMES.length],
    licenseNo: `11${padBroker(n)}-2026-${String(10000 + n).padStart(5, "0")}`,
    address: `서울 ${region} ${dong} ${100 + n}`,
    phone: `02-${String(7000 + n).padStart(4, "0")}-${String(2000 + n).padStart(4, "0")}`,
    region,
    specialtyRegions: Array.from(new Set([region, BROKER_REGIONS[(index + 3) % BROKER_REGIONS.length]])),
    specialtyTypes: Array.from(new Set([mainType, "아파트"])),
    verifiedDeals12m,
    percentileInRegion: percentile,
    tier: officeTier(percentile),
    reviewCount: 3 + ((n * 5) % 35),
    responseMode: ["chat", "call", "sms"][index % 3],
    businessHours: index % 4 === 0 ? "평일 09:00-20:00 · 토 10:00-16:00" : "평일 09:00-18:00",
    lastActive: index % 3 === 0 ? "방금 전 제안" : index % 3 === 1 ? "오늘 활동" : "어제 활동",
    proposalMessage: `${region} ${dong} 실거래와 매수 수요를 기준으로 오늘 제안 가능해요.`,
    reviews: [
      {
        id: `review-${id}`,
        tags: ["일정 조율이 빨라요", "동네 시세를 잘 알아요"],
        text: `${region} ${dong} 매물 진행 상황을 구체적으로 공유해줬어요.`,
        createdAt: "2026-05-29",
      },
    ],
  };
});

export const OWNER_DEMO_ACTIVE_COUNT = 2;
export const PROPOSAL_CHAT_IDS = { bo1: "c1", bo2: "c5", bo3: "c6", bo4: "c2" };
const PROPOSAL_LISTING_TITLES = {
  bo1: "마포구 공덕동 래미안5차 · 84㎡",
  bo2: "마포구 공덕동 래미안5차 · 84㎡",
  bo3: "마포구 공덕동 래미안5차 · 84㎡",
  bo4: "송파구 잠실동 리센츠 · 59㎡",
};
const proposalActivityType = title => title?.includes("래미안5차") ? "빠른의뢰" : "안심의뢰";
export const INTEREST_BROKERS = BROKER_OFFICES.slice(0, 4).map(o => ({
  ...o,
  name: o.agentName,
  office: o.officeName,
  deals: o.verifiedDeals12m,
  msg: o.proposalMessage,
  listingTitle: PROPOSAL_LISTING_TITLES[o.id],
  activityType: proposalActivityType(PROPOSAL_LISTING_TITLES[o.id]),
  proposalNew: ["bo1", "bo4"].includes(o.id),
  chatId: PROPOSAL_CHAT_IDS[o.id] || null,
}));
export const DIRECT_BUYERS = [
  { name: "익명 매수자 A", note: "실거주 목적, 대출 사전심사 완료", when: "2시간 전", budget: "12억대 가능", activityType: "안심의뢰", proposalNew: true, requestId: "direct-safe-1", chatId: "c3", listingTitle: "마포구 공덕동 래미안5차 · 84㎡" },
  { name: "익명 매수자 B", note: "투자 목적, 현금 보유", when: "어제", budget: "13억까지", activityType: "열람", proposalNew: false, listingTitle: "송파구 잠실동 리센츠 · 59㎡" },
];

export const CHATS = [
  { id: "c1", name: "김민준 공인중개사", office: "마포 스마트공인중개사", property: "마포구 공덕동 래미안5차 · 84㎡", unread: 2, mode: "안심의뢰",
    messages: [
      { from: "broker", text: "안녕하세요! 해당 매물 빠른 거래 도와드리겠습니다.", time: "오후 2:14", isDefault: true },
      { from: "broker", text: "현재 매수 대기 고객 2팀 있어서 이번 주 내 보여드릴 수 있어요.", time: "오후 2:15" },
      { from: "me", text: "네 안녕하세요, 주말에도 집 보여드릴 수 있어요.", time: "오후 2:20" },
      { from: "broker", text: "감사합니다! 토요일 오후 2시쯤 방문 가능할까요?", time: "오후 2:21" },
    ] },
  { id: "c2", name: "최은영 공인중개사", office: "공덕역 으뜸부동산", property: "송파구 잠실동 리센츠 · 59㎡", unread: 0, mode: "안심의뢰",
    messages: [
      { from: "broker", text: "관심 있습니다. 편하실 때 연락 부탁드려요!", time: "오전 11:02", isDefault: true },
      { from: "me", text: "전세 만기가 9월이라 그 전에 계약 원해요.", time: "오전 11:30" },
    ] },
  { id: "c5", name: "이수연 공인중개사", office: "공덕 부동산플러스", property: "마포구 공덕동 래미안5차 · 84㎡", unread: 0, mode: "안심의뢰",
    messages: [
      { from: "broker", text: "실거주 매수 대기 고객을 보유 중이에요. 연락처 공개를 요청드립니다.", time: "오전 10:12", isDefault: true },
      { from: "me", text: "제안 내용 확인해볼게요.", time: "오전 10:18" },
    ] },
  { id: "c6", name: "박지훈 공인중개사", office: "마포 한강공인중개사", property: "마포구 공덕동 래미안5차 · 84㎡", unread: 0, mode: "안심의뢰",
    messages: [
      { from: "broker", text: "상가와 아파트 수요층을 나눠 제안드릴 수 있어요. 연락처 공개를 요청드립니다.", time: "어제 오후 4:05", isDefault: true },
      { from: "me", text: "제안 감사합니다. 검토 후 답드릴게요.", time: "어제 오후 4:20" },
    ] },
  { id: "c4", name: "박지훈 공인중개사", office: "마포 한강공인중개사", property: "마포구 공덕동 래미안5차 · 84㎡", unread: 0, mode: "빠른의뢰",
    messages: [
      { from: "broker", text: "연락처 확인했습니다. 바로 통화드리고 방문 일정 잡겠습니다.", time: "오후 3:10" },
      { from: "me", text: "네, 문자로 가능한 시간 먼저 보내주세요.", time: "오후 3:12" },
    ] },
  { id: "c3", contactRequestId: "direct-safe-1", name: "익명 매수자 A", office: "직거래 문의", property: "마포구 공덕동 래미안5차 · 84㎡", unread: 1, mode: "직거래",
    messages: [
      { from: "broker", text: "실거주 목적입니다. 대출 사전심사 완료했어요.", time: "오후 5:40" },
    ] },
];
