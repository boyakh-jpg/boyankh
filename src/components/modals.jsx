import { useState } from "react";
import { C, G, SH1, spring } from "../theme";
import { Btn, FeeEstimate, Frog } from "./common";

export function EditMsgBody({ value, onSave, onClose }) {
  const [text, setText] = useState(value);
  const presets = ["안녕하세요! 해당 매물 빠른 거래 도와드리겠습니다.","인근 전문 중개사입니다. 바이어 DB 보유 중이에요.","관심 있습니다. 편하실 때 연락 부탁드려요!"];
  return (
    <div style={{ background: C.card, borderRadius: "26px 26px 0 0", width: "100%", padding: 24, boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><Frog mood="determined" size={42}/><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>기본 인사 메시지</div></div>
      <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>"중개할게요" 누르면 이 메시지가 자동 전송돼요</div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: "100%", padding: 14, borderRadius: 16, border: `1.5px solid ${C.green}`, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none", marginBottom: 12, background: G.greenSoft }}/>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, marginBottom: 8 }}>빠른 선택</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
        {presets.map((p, i) => (<div key={i} onClick={() => setText(p)} style={{ padding: "10px 14px", borderRadius: 12, background: text===p?G.greenSoft:C.bg, border: `1.5px solid ${text===p?C.green:C.line}`, fontSize: 13, color: C.mid, cursor: "pointer" }}>{p}</div>))}
      </div>
      <Btn onClick={() => onSave(text)}>저장하기</Btn>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>닫기</button>
    </div>
  );
}

export function ApplyMsgBody({ listing, defaultMsg, cost = 1000, onConfirm, onClose }) {
  const [mode, setMode] = useState("saved");
  const [custom, setCustom] = useState("");
  const finalMsg = mode === "saved" ? defaultMsg : custom;
  const canSend = mode === "saved" || custom.trim().length > 0;
  return (
    <div style={{ background: C.card, borderRadius: "26px 26px 0 0", width: "100%", padding: 24, boxSizing: "border-box", animation: "sheetUp .3s " + spring, maxHeight: 720, overflowY: "auto" }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><Frog mood="pondering" size={44}/><div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>어떻게 인사할까요?</div><div style={{ fontSize: 12, color: C.gray }}>{listing.addr}</div></div></div>
      <div style={{ fontSize: 13, color: C.mid, margin: "12px 0 16px", background: G.greenSoft, borderRadius: 12, padding: "10px 14px", lineHeight: 1.6 }}>안심의뢰는 번호 비공개 채팅 신청이에요. 신청 시 <b style={{ color: C.greenInk }}>{cost.toLocaleString()}P</b>가 먼저 차감되고, 소유주가 승인하면 확정돼요. 거절되거나 24시간 안에 응답이 없으면 자동 환불돼요.</div>
      <div onClick={() => setMode("saved")} style={{ borderRadius: 18, border: `2px solid ${mode==="saved"?C.green:C.line}`, background: mode==="saved"?G.greenSoft:C.card, padding: 16, marginBottom: 10, cursor: "pointer", transition: "all .15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${mode==="saved"?C.green:C.gray}`, background: mode==="saved"?C.green:"transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{mode==="saved" && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: mode==="saved"?C.greenInk:C.dark }}>저장된 인사말 사용</span>
        </div>
        <div style={{ fontSize: 13, color: C.mid, lineHeight: 1.5, background: "#ffffffcc", borderRadius: 10, padding: "10px 12px" }}>"{defaultMsg}"</div>
      </div>
      <div onClick={() => setMode("custom")} style={{ borderRadius: 18, border: `2px solid ${mode==="custom"?C.green:C.line}`, background: mode==="custom"?G.greenSoft:C.card, padding: 16, marginBottom: 18, cursor: "pointer", transition: "all .15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${mode==="custom"?C.green:C.gray}`, background: mode==="custom"?C.green:"transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{mode==="custom" && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: mode==="custom"?C.greenInk:C.dark }}>새 메시지 직접 입력</span>
        </div>
        {mode === "custom" && (
          <textarea autoFocus value={custom} onClick={e => e.stopPropagation()} onChange={e => setCustom(e.target.value)} rows={3} placeholder="이 매물에 맞는 인사말을 직접 작성해 보세요" style={{ width: "100%", padding: 12, borderRadius: 12, border: `1.5px solid ${C.green}`, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", resize: "none", background: "#fff" }}/>
        )}
      </div>
      <Btn onClick={canSend ? () => onConfirm(finalMsg) : null} disabled={!canSend}>채팅 신청하기 (-{cost.toLocaleString()}P)</Btn>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>취소</button>
    </div>
  );
}

export function PayBody({ listing, mode = "instant", cost = 10000, onConfirm, onClose }) {
  const safe = mode === "safe";
  return (
    <div style={{ background: C.card, borderRadius: "26px 26px 0 0", width: "100%", padding: 24, boxSizing: "border-box", animation: "sheetUp .3s " + spring }}>
      <div style={{ width: 40, height: 4, borderRadius: 2, background: C.line, margin: "0 auto 16px" }}/>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}><Frog mood={safe ? "pondering" : "love"} size={44}/><div><div style={{ fontSize: 18, fontWeight: 800, color: C.dark }}>{safe ? "안심 직거래 요청" : "직거래 매물 열람"}</div><div style={{ fontSize: 12, color: C.gray }}>{listing.region} {listing.dong} {listing.complex}</div></div></div>
      <div style={{ background: G.goldSoft, borderRadius: 14, padding: "14px 16px", margin: "14px 0", lineHeight: 1.7 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span style={{ color: C.mid }}>{safe ? "요청 비용" : "열람 비용"}</span><span style={{ fontWeight: 800, color: C.goldInk }}>{cost.toLocaleString()}P</span></div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>{safe ? "소유주에게 채팅으로 연락처 공개를 요청해요. 신청 시 포인트가 먼저 차감되고, 승인되면 확정돼요. 거절 또는 24시간 무응답이면 자동 환불돼요." : "소유주 연락처와 상세 정보가 공개돼요. 중개수수료 없이 직접 거래할 수 있어요."}</div>
      </div>
      <Btn variant="gold" onClick={onConfirm}>{cost.toLocaleString()}P 사용하고 {safe ? "요청하기" : "열람하기"}</Btn>
      <button onClick={onClose} style={{ width: "100%", padding: "12px 0", background: "none", border: "none", color: C.gray, fontSize: 14, cursor: "pointer", fontFamily: "inherit", marginTop: 6 }}>취소</button>
    </div>
  );
}
