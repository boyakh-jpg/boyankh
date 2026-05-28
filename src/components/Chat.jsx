import { useEffect, useRef, useState } from "react";
import { C, G, SH2 } from "../theme";
import { CHATS } from "../data/data";
import { CACHE_KEYS, loadCache, saveCache } from "../data/cache";
import { getDemoUser } from "../data/demoUsers";
import { supabase } from "../supabaseClient";
import { RoleToggle, Frog, Tag } from "./common";

const DEMO_TEST_CHAT = {
  id: "demo-test-chat",
  name: "테스트 채팅방",
  office: "테스트 아이디 전체",
  property: "테스트 아이디 메시지 확인",
  unread: 0,
  mode: "테스트",
  demo: true,
  messages: [
    { from: "broker", senderKey: "toad-demo-system", senderName: "테스트 안내", text: "테스트 아이디를 바꿔가며 같은 채팅방에서 메시지가 어떻게 보이는지 확인하세요.", time: "방금 전" },
  ],
};

const chatFromContext = context => {
  if (!context?.listing) return null;
  const listing = context.listing;
  const property = `${listing.region || ""} ${listing.dong || ""} ${listing.complex || ""}`.trim();
  return {
    id: context.id,
    name: "매물 소유주",
    office: listing.ownerPhone ? `연락처 ${listing.ownerPhone}` : "연락처 확인됨",
    property: property || "등록 매물",
    unread: 0,
    mode: context.mode || (listing.fast ? "빠른의뢰" : "안심의뢰"),
    messages: [
      { from: "broker", senderKey: "toad-demo-system", senderName: "채팅 안내", text: "연락처 확인 후 생성된 매물별 채팅방이에요.", time: "방금 전" },
    ],
  };
};

const chatPartnerProfile = (chat, role, demoUser) => {
  if (chat.demo) {
    return {
      name: "테스트 아이디 전체",
      subtitle: "소유주 A/B, 중개사, 직거래 매수자와 대화 중",
      subtitleLines: ["소유주 A/B · 중개사 · 직거래 매수자", "테스트 단체방"],
      type: "테스트 참여자",
      office: "공용 테스트 채팅방",
      property: chat.property,
      note: `${demoUser.label}로 메시지를 보내고 있어요.`,
    };
  }

  if (role === "owner") {
    const type = chat.mode === "직거래" ? "직거래 매수자" : "공인중개사";
    return {
      name: chat.name,
      subtitle: `${type}와 대화 중`,
      subtitleLines: [`${type}와 대화 중`, chat.office],
      type,
      office: chat.office,
      property: chat.property,
      note: chat.mode === "빠른의뢰" ? "연락처 확인 후 바로 대화 중이에요." : "안심의뢰로 번호는 서로 비공개예요.",
    };
  }

  return {
    name: role === "broker" ? "매물 소유주" : "매물 등록자",
    subtitle: `${chat.property} 관련 대화 중`,
    subtitleLines: [`${chat.property} 관련`, chat.office],
    type: role === "broker" ? "소유주" : "상대방",
    office: chat.office,
    property: chat.property,
    note: `${demoUser.label} 계정으로 대화 중이에요.`,
  };
};

const chatTime = value => {
  try {
    return new Date(value).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const baseMessages = chat => chat.messages.map((message, index) => ({
  ...message,
  senderKey: message.senderKey || (message.from === "me" ? "toad-demo-owner" : `toad-demo-seed-${chat.id}-${index}`),
  senderName: message.senderName || (message.from === "me" ? "소유주 A" : chat.name),
}));

const messageFromRow = row => ({
  id: row.id,
  senderKey: row.sender_key,
  senderName: row.sender_name,
  text: row.body,
  time: chatTime(row.created_at),
  createdAt: row.created_at,
});

const isNoticeMessage = message =>
  message.senderKey === "toad-demo-system" ||
  ["채팅 안내", "테스트 안내", "연락처 요청"].includes(message.senderName);

const upsertMessageRow = (messages, row) => {
  const next = messageFromRow(row);
  if (messages.some(message => message.id === next.id)) return messages;

  const tempIndex = messages.findIndex(message =>
    message.tempId &&
    message.senderKey === next.senderKey &&
    message.text === next.text
  );

  if (tempIndex >= 0) {
    return messages.map((message, index) => index === tempIndex ? next : message);
  }

  return [...messages, next];
};

const chatsForRole = role => [
  DEMO_TEST_CHAT,
  ...CHATS.filter(c => role === "broker" ? c.mode !== "직거래" : role === "buyer" ? c.mode === "직거래" : true),
];

export function ChatList({ onOpen, role, availableRoles, onSwitchRole }) {
  const demoUser = getDemoUser();
  const visibleChats = chatsForRole(role);
  const [latestByThread, setLatestByThread] = useState({});

  useEffect(() => {
    let alive = true;
    const threadIds = visibleChats.map(c => c.id);
    const threadSet = new Set(threadIds);
    async function loadLatestMessages() {
      if (!threadIds.length) return;
      const { data, error } = await supabase
        .from("chat_messages")
        .select("thread_id,sender_name,body,created_at")
        .in("thread_id", threadIds)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase chat_messages latest error:", error);
        return;
      }

      const next = {};
      (data || []).forEach(row => {
        next[row.thread_id] = {
          senderName: row.sender_name,
          text: row.body,
          time: chatTime(row.created_at),
        };
      });
      if (alive) setLatestByThread(next);
    }

    loadLatestMessages();
    const channel = supabase
      .channel(`chat-list-${role}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, payload => {
        const row = payload.new;
        if (!threadSet.has(row.thread_id)) return;
        setLatestByThread(prev => ({
          ...prev,
          [row.thread_id]: {
            senderName: row.sender_name,
            text: row.body,
            time: chatTime(row.created_at),
          },
        }));
      })
      .subscribe(status => {
        if (status === "CHANNEL_ERROR") console.error("Supabase chat_messages realtime list error");
      });

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [role]);

  return (
    <div style={{ paddingBottom: 132, background: G.pageBg, minHeight: "100%" }}>
      <div style={{ background: G.header, padding: "46px 20px 26px", borderRadius: "0 0 30px 30px", boxShadow: "0 8px 24px rgba(111,184,148,.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><div style={{ color: "#ffffffcc", fontSize: 13 }}>진행 중인 대화 {visibleChats.length}건</div><div style={{ color: "#fff", fontSize: 22, fontWeight: 900, letterSpacing: 0 }}>채팅</div></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <RoleToggle role={role} roles={availableRoles} onClick={onSwitchRole}/>
            <Frog mood="joyful" size={62}/>
          </div>
        </div>
        <div style={{ marginTop: 12, background: "#ffffff24", borderRadius: 12, padding: "8px 10px", color: "#fff", fontSize: 12, fontWeight: 800 }}>{demoUser.label} · {demoUser.id}</div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        {visibleChats.map(c => {
          const base = baseMessages(c);
          const last = latestByThread[c.id] || base[base.length - 1] || c.messages[c.messages.length - 1];
          return (
            <div key={c.id} onClick={() => onOpen(c.id)} style={{ background: G.card, borderRadius: 18, padding: 16, marginBottom: 10, boxShadow: SH2, cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: c.mode==="안심의뢰"?G.greenSoft:G.goldSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Frog mood={c.mode==="직거래"?"love":"calm"} size={38}/></div>
                {c.unread > 0 && <div style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: "#E8847C", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{c.unread}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.dark }}>{c.name}</span><Tag tone={c.mode==="안심의뢰"?"green":"gold"}>{c.mode}</Tag></div>
                <div style={{ fontSize: 12, color: C.gray, margin: "2px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.property}</div>
                <div style={{ fontSize: 13, color: c.unread>0?C.dark:C.gray, fontWeight: c.unread>0?600:400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{last.text}</div>
              </div>
              <span style={{ fontSize: 18, color: "#CBD5CD" }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChatRoom({ chatId, chatContext = null, role, onBack }) {
  const contextChat = chatContext?.id === chatId ? chatFromContext(chatContext) : null;
  const chat = chatsForRole(role).find(c => c.id === chatId) || contextChat || DEMO_TEST_CHAT;
  const demoUser = getDemoUser();
  const decisionKey = chat.contactRequestId || chat.id;
  const [msgs, setMsgs] = useState(() => baseMessages(chat));
  const [input, setInput] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [localContactDecision, setLocalContactDecision] = useState(() => {
    const cached = loadCache(CACHE_KEYS.contactDecisions, {});
    return cached && typeof cached === "object" && !Array.isArray(cached) ? cached[decisionKey] || null : null;
  });
  const listRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setMsgs(baseMessages(chat));
    async function loadMessages() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("thread_id", chat.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Supabase chat_messages select error:", error);
        return;
      }

      if (alive && Array.isArray(data) && data.length > 0) {
        setMsgs(data.map(messageFromRow));
      }
    }

    loadMessages();
    const channel = supabase
      .channel(`chat-room-${chat.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${chat.id}` }, payload => {
        setMsgs(current => upsertMessageRow(current, payload.new));
      })
      .subscribe(status => {
        if (status === "CHANNEL_ERROR") console.error("Supabase chat_messages realtime room error");
      });

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [chat.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const appendMessage = async ({ senderKey, senderName, text }) => {
    const now = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic = { tempId, senderKey, senderName, text, time: now };
    setMsgs(m => [...m, optimistic]);

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ thread_id: chat.id, sender_key: senderKey, sender_name: senderName, body: text })
      .select("*")
      .single();

    if (error) {
      console.error("Supabase chat_messages insert error:", error);
      return;
    }

    setMsgs(m => {
      if (m.some(message => message.id === data.id)) {
        return m.filter(message => message.tempId !== tempId);
      }
      return m.map(message => message.tempId === tempId ? messageFromRow(data) : message);
    });
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    appendMessage({ senderKey: demoUser.id, senderName: demoUser.label, text });
  };
  const isDirect = chat.mode === "직거래";
  const isFast = chat.mode === "빠른의뢰";
  const partner = chatPartnerProfile(chat, role, demoUser);
  const headerSubtitleLines = partner.subtitleLines || [partner.subtitle];
  const needsContactApproval = !chat.demo && !isFast;
  const canApproveContact = role === "owner";
  const contactDecision = localContactDecision;
  const decideContact = approved => {
    const nextDecision = approved ? "approved" : "rejected";
    setLocalContactDecision(nextDecision);
    const cached = loadCache(CACHE_KEYS.contactDecisions, {});
    saveCache(CACHE_KEYS.contactDecisions, {
      ...(cached && typeof cached === "object" && !Array.isArray(cached) ? cached : {}),
      [decisionKey]: nextDecision,
    });
    appendMessage({
      senderKey: "toad-demo-system",
      senderName: "연락처 요청",
      text: approved ? "연락처 공개가 승인됐어요. 차감된 포인트가 사용 확정됐고 010-1234-5678로 연락할 수 있어요." : "연락처 공개 요청이 거절됐어요. 차감된 포인트는 자동 환불돼요.",
    });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: G.pageBg }}>
      <div style={{ background: G.header, padding: "44px 16px 14px", flexShrink: 0, boxShadow: "0 4px 16px rgba(111,184,148,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>← 채팅</button>
          <button onClick={() => setProfileOpen(true)} style={{ marginLeft: "auto", maxWidth: "72%", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, minWidth: 0 }}>
            <Frog mood={isDirect?"love":"calm"} size={40}/>
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <div style={{ color: "#fff", fontSize: 15, fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chat.name}</div>
              <div style={{ color: "#ffffffcc", fontSize: 11, fontWeight: 700, lineHeight: 1.35 }}>
                {headerSubtitleLines.map(line => (
                  <div key={line} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line}</div>
                ))}
              </div>
            </div>
          </button>
        </div>
        <div style={{ background: "#ffffff26", borderRadius: 12, padding: "8px 12px", marginTop: 12, fontSize: 12, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ opacity: .85 }}>매물</span><span style={{ fontWeight: 600 }}>{chat.property}</span>
        </div>
        <div style={{ marginTop: 8, color: "#ffffffd9", fontSize: 11, fontWeight: 800 }}>{demoUser.label}로 대화 중</div>
      </div>
      {profileOpen && (
        <div onClick={() => setProfileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(29,48,38,.26)", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 320, background: "#fff", borderRadius: 24, padding: "16px 16px 18px", boxShadow: "0 18px 42px rgba(41,64,49,.22)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>상대 프로필</div>
              <button onClick={() => setProfileOpen(false)} style={{ width: 32, height: 32, borderRadius: 16, border: "none", background: G.bg, color: C.gray, fontSize: 18, cursor: "pointer", fontFamily: "inherit" }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: chat.mode === "안심의뢰" ? G.greenSoft : G.goldSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Frog mood={isDirect?"love":"calm"} size={42}/></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: C.dark }}>{partner.name}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.greenInk, marginTop: 2 }}>{partner.type}</div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ background: G.bg, borderRadius: 13, padding: 10 }}><div style={{ fontSize: 11, color: C.gray, fontWeight: 800, marginBottom: 3 }}>소속/상태</div><div style={{ fontSize: 13, color: C.dark, fontWeight: 800 }}>{partner.office}</div></div>
              <div style={{ background: G.bg, borderRadius: 13, padding: 10 }}><div style={{ fontSize: 11, color: C.gray, fontWeight: 800, marginBottom: 3 }}>대화 매물</div><div style={{ fontSize: 13, color: C.dark, fontWeight: 800 }}>{partner.property}</div></div>
              <div style={{ background: G.greenSoft, borderRadius: 13, padding: 10, fontSize: 12, color: C.greenInk, fontWeight: 800, lineHeight: 1.5 }}>{partner.note}</div>
            </div>
          </div>
        </div>
      )}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
      <div ref={listRef} style={{ height: "100%", overflowY: "auto", padding: "16px 14px 72px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ textAlign: "center", fontSize: 11, color: C.gray, background: "#ffffffcc", borderRadius: 12, padding: "6px 12px", alignSelf: "center", marginBottom: 4 }}>{isDirect ? "직거래 채팅 · 중개수수료 없음" : isFast ? "빠른의뢰 채팅 · 연락처 확인됨" : "안심의뢰 채팅 · 번호는 서로 비공개예요"}</div>
        {needsContactApproval && <div style={{ background: contactDecision === "approved" ? G.greenSoft : contactDecision === "rejected" ? "#F2F4F3" : G.goldSoft, border: `1px solid ${contactDecision === "approved" ? C.green : contactDecision === "rejected" ? C.line : C.gold}`, borderRadius: 16, padding: 14, alignSelf: "stretch", boxShadow: SH2 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: contactDecision === "approved" ? C.greenInk : contactDecision === "rejected" ? C.gray : C.goldInk, marginBottom: 5 }}>연락처 공개 요청</div>
          <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>
            {contactDecision === "approved" ? "연락처가 공개됐어요. 차감 포인트는 사용 확정이에요." : contactDecision === "rejected" ? "요청을 거절했어요. 신청자 포인트는 자동 환불돼요." : canApproveContact ? "상대가 연락처 공개를 요청했어요. 공개하면 포인트 사용 확정, 거절하면 자동 환불돼요." : "소유주 승인 대기 중이에요. 거절되거나 24시간 안에 응답이 없으면 자동 환불돼요."}
          </div>
          {!contactDecision && canApproveContact && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <button onClick={() => decideContact(true)} style={{ border: "none", background: G.header, color: "#fff", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>공개하기</button>
              <button onClick={() => decideContact(false)} style={{ border: `1.5px solid ${C.line}`, background: "#fff", color: C.gray, borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit" }}>거절·자동 환불</button>
            </div>
          )}
        </div>}
        {msgs.map((m, i) => {
          const mine = m.senderKey ? m.senderKey === demoUser.id : m.from === "me";
          const senderName = m.senderName || (mine ? demoUser.label : chat.name);
          const notice = isNoticeMessage(m);
          if (notice) {
            const requestNotice = senderName === "연락처 요청";
            return (
              <div key={m.id || m.tempId || i} style={{ alignSelf: "center", width: "92%", background: requestNotice ? G.goldSoft : G.greenSoft, border: `1px solid ${requestNotice ? C.gold : C.green}`, borderRadius: 16, padding: "12px 13px", boxShadow: SH2, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Frog mood={requestNotice ? "nervous" : "pondering"} size={30}/></div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: requestNotice ? C.goldInk : C.greenInk, fontWeight: 900, marginBottom: 4 }}>{senderName || "공지"}</div>
                  <div style={{ fontSize: 13, color: C.dark, fontWeight: 700, lineHeight: 1.5 }}>{m.text}</div>
                  <div style={{ fontSize: 10, color: C.gray, marginTop: 5 }}>{m.time}</div>
                </div>
              </div>
            );
          }
          return mine ? (
            <div key={m.id || m.tempId || i} style={{ alignSelf: "flex-end", maxWidth: "76%" }}>
              <div style={{ fontSize: 10, color: C.greenInk, textAlign: "right", fontWeight: 900, margin: "0 4px 3px" }}>나 · {senderName}</div>
              <div style={{ background: G.header, color: "#fff", padding: "10px 14px", borderRadius: "16px 16px 4px 16px", fontSize: 14, lineHeight: 1.5, boxShadow: SH2 }}>{m.text}</div>
              <div style={{ fontSize: 10, color: C.gray, textAlign: "right", marginTop: 3 }}>{m.time}</div>
            </div>
          ) : (
            <div key={m.id || m.tempId || i} style={{ alignSelf: "flex-start", maxWidth: "78%", display: "flex", gap: 8 }}>
              <button onClick={() => setProfileOpen(true)} aria-label="상대 프로필" style={{ border: "none", background: "none", padding: 0, cursor: "pointer", alignSelf: "flex-start", fontFamily: "inherit", lineHeight: 0 }}><Frog mood={isDirect?"love":"calm"} size={30}/></button>
              <div>
                <div style={{ fontSize: 10, color: C.greenInk, fontWeight: 900, margin: "0 0 3px 2px" }}>{senderName}</div>
                <div style={{ background: "#fff", color: C.dark, padding: "10px 14px", borderRadius: "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.5, boxShadow: SH2 }}>{m.text}</div>
                <div style={{ fontSize: 10, color: C.gray, marginTop: 3, display: "flex", gap: 6 }}>{m.time}{m.isDefault && <span style={{ color: C.greenInk }}>· 기본 인사말</span>}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>
      <button onClick={() => listRef.current?.scrollTo({ top: 0, behavior: "smooth" })} aria-label="채팅 맨 위로" style={{ position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", width: 42, height: 42, borderRadius: 21, border: `1px solid rgba(205,216,208,.42)`, background: "rgba(255,255,255,.38)", color: "rgba(69,126,92,.58)", fontSize: 18, fontWeight: 900, cursor: "pointer", zIndex: 8, boxShadow: "0 8px 20px rgba(60,90,70,.10)", fontFamily: "inherit", backdropFilter: "blur(6px)" }}>↑</button>
      </div>
      <div style={{ flexShrink: 0, padding: "10px 14px", background: "#fff", borderTop: `1px solid ${C.line}`, display: "flex", gap: 8, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="메시지 입력..." style={{ flex: 1, padding: "12px 16px", borderRadius: 22, border: `1.5px solid ${C.line}`, fontSize: 14, fontFamily: "inherit", outline: "none", background: G.bg }}/>
        <button onClick={send} style={{ width: 44, height: 44, borderRadius: 22, border: "none", background: G.header, color: "#fff", fontSize: 20, cursor: "pointer", flexShrink: 0, fontFamily: "inherit", lineHeight: 1 }}>↵</button>
      </div>
    </div>
  );
}
