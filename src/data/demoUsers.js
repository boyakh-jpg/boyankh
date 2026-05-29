export const DEMO_USER_STORAGE_KEY = "toad.demoOwnerKey";

export const DEMO_USERS = [
  { id: "toad-demo-owner", name: "소유주 A", role: "owner", label: "소유주 A", desc: "기본 테스트 소유주" },
  { id: "toad-demo-owner-2", name: "소유주 B", role: "owner", label: "소유주 B", desc: "다른 소유주 채팅 테스트" },
  { id: "toad-demo-broker-1", name: "중개사 김", role: "broker", label: "중개사 김", desc: "중개사 채팅/열람 테스트" },
  { id: "toad-demo-buyer-1", name: "직거래 박", role: "buyer", label: "직거래 박", desc: "직거래 채팅 테스트" },
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
