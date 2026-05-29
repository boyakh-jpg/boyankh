export const DEMO_USER_STORAGE_KEY = "toad.demoOwnerKey";

const DEMO_REGIONS = ["강남구", "서초구", "송파구", "강동구", "마포구", "용산구", "성동구", "영등포구"];
const pad = value => String(value).padStart(3, "0");
const phone = (front, back) => `010-${String(front).padStart(4, "0")}-${String(back).padStart(4, "0")}`;

const makeDemoUsers = ({ count, role, prefix, label, desc, phoneFront }) =>
  Array.from({ length: count }, (_, index) => {
    const n = index + 1;
    const id = `${prefix}-${pad(n)}`;
    const display = `${label} ${pad(n)}`;
    return {
      id,
      name: display,
      role,
      label: display,
      desc,
      region: DEMO_REGIONS[index % DEMO_REGIONS.length],
      phone: phone(phoneFront + n, 7000 + n),
    };
  });

export const DEMO_USERS = [
  ...makeDemoUsers({ count: 20, role: "owner", prefix: "owner", label: "소유주", desc: "매물 등록 테스트 소유주", phoneFront: 3100 }),
  ...makeDemoUsers({ count: 30, role: "broker", prefix: "broker", label: "중개사", desc: "부동산 상세카드 테스트 중개사", phoneFront: 4100 }),
  ...makeDemoUsers({ count: 10, role: "buyer", prefix: "buyer", label: "직거래 매수자", desc: "직거래 매수 테스트 계정", phoneFront: 5100 }),
];

export function getDemoUser(users = DEMO_USERS) {
  try {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(DEMO_USER_STORAGE_KEY) : null;
    return users.find(user => user.id === saved) || users.find(user => user.role === "owner") || users[0] || DEMO_USERS[0];
  } catch {
    return users.find(user => user.role === "owner") || users[0] || DEMO_USERS[0];
  }
}

export function saveDemoUser(id) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(DEMO_USER_STORAGE_KEY, id);
  } catch {}
}
