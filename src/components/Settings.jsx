import { Settings as OldSettings } from "./Settings_old";
import { C, G, SH2 } from "../theme";

const roleLabels = { owner: "소유주", broker: "중개사", buyer: "직거래 매수자" };

function DemoUserSelect({ role, users, selectedId, onSelect }) {
  const value = users.some(user => user.id === selectedId) ? selectedId : "";
  return (
    <label style={{ display: "block", minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 10, color: C.gray, fontWeight: 900, marginBottom: 4 }}>{roleLabels[role]} 아이디</span>
      <select value={value} onChange={e => onSelect(e.target.value)} style={{ width: "100%", height: 36, borderRadius: 11, border: `1.5px solid ${C.line}`, background: "#fff", color: C.dark, fontSize: 11, fontWeight: 800, fontFamily: "inherit", padding: "0 8px", outline: "none" }}>
        <option value="" disabled>{roleLabels[role]} 선택</option>
        {users.map(user => <option key={user.id} value={user.id}>{user.label} · {user.id}</option>)}
      </select>
    </label>
  );
}

export function Settings(props) {
  const { demoUsers = [], demoUser, onDemoUserChange } = props;
  const ownerUsers = demoUsers.filter(user => user.role === "owner");
  const brokerUsers = demoUsers.filter(user => user.role === "broker");
  const buyerUsers = demoUsers.filter(user => user.role === "buyer");
  const canSwitchDemoUser = typeof onDemoUserChange === "function" && demoUsers.length > 0;
  const selectDemoUser = id => {
    const nextUser = demoUsers.find(user => user.id === id);
    if (nextUser) onDemoUserChange(nextUser);
  };

  return (
    <>
      <OldSettings {...props}/>
      {canSwitchDemoUser && (
        <div style={{ position: "fixed", left: "50%", top: 92, transform: "translateX(-50%)", width: "min(361px, calc(100vw - 32px))", zIndex: 1200, background: "#fffffff2", border: `1px solid ${C.line}`, borderRadius: 16, padding: 12, boxShadow: SH2, boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: C.greenInk }}>테스트 아이디</div>
            <div style={{ fontSize: 10, color: C.gray, fontWeight: 800 }}>{demoUser?.label || demoUser?.id || "미선택"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 7 }}>
            <DemoUserSelect role="owner" users={ownerUsers} selectedId={demoUser?.id} onSelect={selectDemoUser}/>
            <DemoUserSelect role="broker" users={brokerUsers} selectedId={demoUser?.id} onSelect={selectDemoUser}/>
            <DemoUserSelect role="buyer" users={buyerUsers} selectedId={demoUser?.id} onSelect={selectDemoUser}/>
          </div>
        </div>
      )}
    </>
  );
}