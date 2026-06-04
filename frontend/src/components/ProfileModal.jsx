import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS_STYLE = {
  pending:          { bg: "#fff8e1", color: "#e65100", label: "Pending" },
  confirmed:        { bg: "#e3f2fd", color: "#1565c0", label: "Confirmed" },
  out_for_delivery: { bg: "#f3e5f5", color: "#6a1b9a", label: "Out for Delivery" },
  delivered:        { bg: "#e8f5e9", color: "#2e7d32", label: "Delivered" },
  cancelled:        { bg: "#f5f5f5", color: "#616161", label: "Cancelled" },
};

export default function ProfileModal({ email, onClose, onSignOut }) {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [savedName, setSavedName] = useState(() => localStorage.getItem("display_name") || "");
  const [savedPhone, setSavedPhone] = useState(() => localStorage.getItem("saved_phone") || "");
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${BACKEND_URL}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0);
  const displayName = savedName || email.split("@")[0];

  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("display_name", savedName);
    localStorage.setItem("saved_phone", savedPhone);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const c = isDark ? dc : lc;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, background: c.bg }} className="animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <button style={{ ...s.close, background: "rgba(255,255,255,0.15)", color: "white" }} onClick={onClose}>✕</button>

        {/* Header */}
        <div style={s.header}>
          <div style={s.avatarRing}>
            <div style={s.avatar}>{displayName[0].toUpperCase()}</div>
          </div>
          <h2 style={s.displayName}>{displayName}</h2>
          <p style={s.emailLine}>{email}</p>
          <div style={s.statsRow}>
            <div style={s.stat}>
              <span style={s.statNum}>{orders.length}</span>
              <span style={s.statLabel}>Orders</span>
            </div>
            <div style={s.statDiv} />
            <div style={s.stat}>
              <span style={s.statNum}>₾{totalSpent.toFixed(0)}</span>
              <span style={s.statLabel}>Spent</span>
            </div>
            <div style={s.statDiv} />
            <div style={s.stat}>
              <span style={s.statNum}>{orders.length > 0 ? new Date(orders[orders.length - 1]?.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</span>
              <span style={s.statLabel}>Member Since</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ ...s.tabs, borderBottom: `1px solid ${c.border}` }}>
          {[["orders", "📋 Orders"], ["settings", "⚙️ Settings"]].map(([id, l]) => (
            <button key={id} style={{ ...s.tab, color: tab === id ? "#d4235e" : c.muted, borderBottom: `2px solid ${tab === id ? "#d4235e" : "transparent"}` }} onClick={() => setTab(id)}>{l}</button>
          ))}
        </div>

        <div style={s.body}>
          {/* Orders tab */}
          {tab === "orders" && (
            loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: c.muted }}>
                <div style={{ width: "32px", height: "32px", border: `3px solid ${c.border}`, borderTop: "3px solid #d4235e", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite" }} />
                Loading your orders...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.8rem" }}>🛍️</span>
                <p style={{ ...s.emptyTitle, color: c.text }}>No orders yet</p>
                <p style={{ color: c.muted, fontSize: "0.82rem" }}>Your order history will appear here</p>
              </div>
            ) : (
              <div style={s.orderList}>
                {orders.map((o) => {
                  const st = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
                  return (
                    <div key={o.id} style={{ ...s.orderCard, background: c.cardBg, border: `1px solid ${c.border}` }}>
                      <div style={s.orderTop}>
                        <div style={s.orderTopLeft}>
                          <span style={{ ...s.orderIdBadge, background: isDark ? "rgba(255,255,255,0.06)" : "#f5eef2", color: c.muted }}>#{o.id}</span>
                          {o.order_code && <span style={{ ...s.orderIdBadge, background: isDark ? "rgba(255,255,255,0.06)" : "#f0f4f8", color: isDark ? "#9878a8" : "#475569", fontFamily: "monospace" }}>{o.order_code}</span>}
                          <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>
                        </div>
                        <span style={{ color: c.muted, fontSize: "0.72rem" }}>{new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      </div>
                      <p style={{ color: c.muted, fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "0.6rem" }}>{o.items}</p>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: c.faint, fontSize: "0.72rem" }}>{o.order_type === "pickup" ? "🏠 Pickup" : "🚚 Delivery"}</span>
                        <span style={{ color: "#d4235e", fontWeight: "700", fontSize: "0.92rem" }}>₾{Number(o.total).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Settings tab */}
          {tab === "settings" && (
            <div>
              <form onSubmit={saveSettings}>
                <div style={{ ...s.settingSection, borderBottom: `1px solid ${c.border}` }}>
                  <h4 style={{ ...s.settingHeading, color: c.text }}>Personal Details</h4>
                  <p style={{ color: c.muted, fontSize: "0.78rem", marginBottom: "1.2rem" }}>Pre-fills your name and phone on order forms</p>
                  <label style={{ color: c.muted, fontSize: "0.78rem", fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>Display Name</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} placeholder={email.split("@")[0]} value={savedName} onChange={e => setSavedName(e.target.value)} />
                  <label style={{ color: c.muted, fontSize: "0.78rem", fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>Saved Phone</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} placeholder="+995 555 000 000" value={savedPhone} onChange={e => setSavedPhone(e.target.value)} />
                  <button style={{ ...s.saveBtn, background: settingsSaved ? "#22c55e" : "linear-gradient(135deg, #d4235e, #a01848)" }} type="submit">
                    {settingsSaved ? "✓ Saved!" : "Save Changes"}
                  </button>
                </div>
              </form>
              <div style={s.settingSection}>
                <h4 style={{ ...s.settingHeading, color: c.text }}>Account</h4>
                <div style={{ ...s.accountRow, borderBottom: `1px solid ${c.border}` }}>
                  <span style={{ color: c.muted, fontSize: "0.82rem" }}>Email</span>
                  <span style={{ color: c.text, fontSize: "0.82rem", fontWeight: "500" }}>{email}</span>
                </div>
              </div>
              <button style={s.signOutBtn} onClick={onSignOut}>🚪 Sign Out</button>
            </div>
          )}
        </div>

        {tab === "orders" && (
          <div style={{ ...s.foot, borderTop: `1px solid ${c.border}`, background: isDark ? "rgba(255,255,255,0.02)" : "#fdf8fb" }}>
            <button style={{ color: c.muted, background: "none", border: "none", fontSize: "0.82rem", cursor: "pointer" }} onClick={onSignOut}>Sign Out</button>
          </div>
        )}
      </div>
    </div>
  );
}

const lc = { bg: "white", text: "#1c0f18", muted: "#8b6070", faint: "#b0a0a8", border: "#f0eaf4", cardBg: "#fdf8fb", inputBg: "white", inputBorder: "#f0eaf4" };
const dc = { bg: "#1b1320", text: "#f0ecf4", muted: "#9878a8", faint: "#5a4568", border: "rgba(255,255,255,0.07)", cardBg: "#251830", inputBg: "#2a1c38", inputBorder: "rgba(255,255,255,0.12)" };

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "1rem" },
  modal: { borderRadius: "28px", width: "100%", maxWidth: "500px", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.35)", position: "relative", overflow: "hidden" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 },
  header: { background: "linear-gradient(150deg, #1c0f18, #3a1430 60%, #5a1a3a)", padding: "2.5rem 2rem 1.8rem", textAlign: "center" },
  avatarRing: { width: "72px", height: "72px", borderRadius: "50%", background: "rgba(212,35,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.8rem" },
  avatar: { width: "62px", height: "62px", borderRadius: "50%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "1.8rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif" },
  displayName: { color: "white", fontSize: "1.15rem", fontWeight: "700", fontFamily: "'Playfair Display', serif", marginBottom: "0.2rem" },
  emailLine: { color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: "1.2rem" },
  statsRow: { display: "flex", alignItems: "center", gap: "1.2rem", background: "rgba(255,255,255,0.07)", borderRadius: "14px", padding: "0.9rem 1.4rem", justifyContent: "center" },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { color: "white", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.1rem", lineHeight: 1 },
  statLabel: { color: "rgba(255,255,255,0.38)", fontSize: "0.6rem", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: "0.3rem" },
  statDiv: { width: "1px", height: "32px", background: "rgba(255,255,255,0.1)" },
  tabs: { display: "flex" },
  tab: { flex: 1, padding: "0.9rem", border: "none", background: "transparent", cursor: "pointer", fontSize: "0.86rem", fontWeight: "500", transition: "color 0.15s" },
  body: { flex: 1, overflowY: "auto", padding: "1.2rem 1.5rem" },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.4rem" },
  orderList: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  orderCard: { borderRadius: "14px", padding: "1rem 1.1rem" },
  orderTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.55rem", flexWrap: "wrap", gap: "0.4rem" },
  orderTopLeft: { display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" },
  orderIdBadge: { fontSize: "0.7rem", fontWeight: "700", padding: "0.18rem 0.6rem", borderRadius: "8px" },
  badge: { padding: "0.2rem 0.7rem", borderRadius: "50px", fontSize: "0.7rem", fontWeight: "600" },
  settingSection: { marginBottom: "1.3rem", paddingBottom: "1.3rem" },
  settingHeading: { fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.25rem" },
  input: { width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.9rem", outline: "none", marginBottom: "0.9rem", boxSizing: "border-box" },
  saveBtn: { color: "white", border: "none", padding: "0.72rem 1.5rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600", transition: "background 0.25s" },
  accountRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0" },
  signOutBtn: { width: "100%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626", padding: "0.78rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600", marginTop: "0.5rem" },
  foot: { padding: "1rem 1.5rem", display: "flex", justifyContent: "flex-end" },
};
