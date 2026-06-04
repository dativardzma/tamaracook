import { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS_STYLE = {
  pending:          { bg: "#fff8e1", color: "#e65100", label: "Pending" },
  confirmed:        { bg: "#e3f2fd", color: "#1565c0", label: "Confirmed" },
  out_for_delivery: { bg: "#f3e5f5", color: "#6a1b9a", label: "Out for Delivery" },
  delivered:        { bg: "#e8f5e9", color: "#2e7d32", label: "Delivered" },
  cancelled:        { bg: "#f5f5f5", color: "#616161", label: "Cancelled" },
};

export default function ProfileModal({ email, onClose, onSignOut }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [savedName, setSavedName] = useState(() => localStorage.getItem("display_name") || "");
  const [savedPhone, setSavedPhone] = useState(() => localStorage.getItem("saved_phone") || "");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [memberSince, setMemberSince] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${BACKEND_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        if (list.length > 0) {
          const oldest = list.reduce((a, b) => new Date(a.created_at) < new Date(b.created_at) ? a : b);
          setMemberSince(oldest.created_at);
        }
        setLoading(false);
      })
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

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        {/* Header */}
        <div style={s.header}>
          <div style={s.avatarRing}>
            <div style={s.avatar}>{displayName[0].toUpperCase()}</div>
          </div>
          <div style={s.headerInfo}>
            <h2 style={s.displayName}>{displayName}</h2>
            <p style={s.emailLine}>{email}</p>
          </div>

          <div style={s.statsRow}>
            <div style={s.stat}>
              <span style={s.statNum}>{orders.length}</span>
              <span style={s.statLabel}>Orders</span>
            </div>
            <div style={s.statDiv} />
            <div style={s.stat}>
              <span style={s.statNum}>₾{totalSpent.toFixed(0)}</span>
              <span style={s.statLabel}>Total Spent</span>
            </div>
            <div style={s.statDiv} />
            <div style={s.stat}>
              <span style={s.statNum}>
                {memberSince
                  ? new Date(memberSince).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
                  : "—"}
              </span>
              <span style={s.statLabel}>Member Since</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === "orders" ? s.tabActive : {}) }}
            onClick={() => setTab("orders")}
          >
            📋 My Orders
          </button>
          <button
            style={{ ...s.tab, ...(tab === "settings" ? s.tabActive : {}) }}
            onClick={() => setTab("settings")}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Content */}
        <div style={s.body}>

          {/* ── Orders Tab ── */}
          {tab === "orders" && (
            loading ? (
              <div style={s.center}><span style={s.loadIcon}>⏳</span><p style={s.hint}>Loading your orders...</p></div>
            ) : orders.length === 0 ? (
              <div style={s.emptyWrap}>
                <span style={s.emptyIcon}>🛍️</span>
                <p style={s.emptyTitle}>No orders yet</p>
                <p style={s.emptyHint}>Your order history will appear here once you place your first order</p>
              </div>
            ) : (
              <div style={s.orderList}>
                {orders.map((o) => {
                  const st = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
                  return (
                    <div key={o.id} style={s.orderCard}>
                      <div style={s.orderTop}>
                        <div style={s.orderTopLeft}>
                          <span style={s.orderIdBadge}>#{o.id}</span>
                          <span style={{ ...s.badge, background: st.bg, color: st.color }}>
                            {st.label}
                          </span>
                          {o.order_type && (
                            <span style={s.typeTag}>
                              {o.order_type === "pickup" ? "🏠 Pickup" : "🚚 Delivery"}
                            </span>
                          )}
                        </div>
                        <span style={s.orderDate}>
                          {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <p style={s.orderItems}>{o.items}</p>
                      <div style={s.orderFooter}>
                        <span style={s.orderTime}>
                          {new Date(o.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span style={s.orderTotal}>₾{Number(o.total).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── Settings Tab ── */}
          {tab === "settings" && (
            <div>
              <form onSubmit={saveSettings}>
                <div style={s.settingSection}>
                  <h4 style={s.settingHeading}>Personal Details</h4>
                  <p style={s.settingDesc}>These details will be used to pre-fill your order forms</p>

                  <label style={s.label}>Display Name</label>
                  <input
                    style={s.input}
                    placeholder={email.split("@")[0]}
                    value={savedName}
                    onChange={e => setSavedName(e.target.value)}
                  />

                  <label style={s.label}>Saved Phone Number</label>
                  <input
                    style={s.input}
                    placeholder="+995 555 000 000"
                    value={savedPhone}
                    onChange={e => setSavedPhone(e.target.value)}
                  />

                  <button style={s.saveBtn} type="submit">
                    {settingsSaved ? "✅ Saved!" : "Save Changes"}
                  </button>
                </div>
              </form>

              <div style={s.settingSection}>
                <h4 style={s.settingHeading}>Account</h4>
                <div style={s.accountRow}>
                  <span style={s.accountLabel}>Email</span>
                  <span style={s.accountValue}>{email}</span>
                </div>
                <div style={s.accountRow}>
                  <span style={s.accountLabel}>Password</span>
                  <span style={s.accountValue}>••••••••</span>
                </div>
              </div>

              <button style={s.signOutBtn} onClick={onSignOut}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>

        {tab === "orders" && (
          <div style={s.footer}>
            <button style={s.signOutBtnSmall} onClick={onSignOut}>Sign Out</button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "28px", width: "100%", maxWidth: "500px", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 40px 80px rgba(0,0,0,0.25)", position: "relative", overflow: "hidden" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", background: "rgba(255,255,255,0.15)", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "white", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 },

  header: { background: "linear-gradient(150deg, #1c0f18, #3a1430 60%, #5a1a3a)", padding: "2.5rem 2rem 1.8rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  avatarRing: { width: "72px", height: "72px", borderRadius: "50%", background: "rgba(212,35,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.8rem" },
  avatar: { width: "62px", height: "62px", borderRadius: "50%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "1.8rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif" },
  headerInfo: { marginBottom: "1.2rem" },
  displayName: { color: "white", fontSize: "1.15rem", fontWeight: "700", fontFamily: "'Playfair Display', serif", marginBottom: "0.2rem" },
  emailLine: { color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" },

  statsRow: { display: "flex", alignItems: "center", gap: "1.2rem", background: "rgba(255,255,255,0.07)", borderRadius: "14px", padding: "0.9rem 1.4rem" },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { color: "white", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.1rem", lineHeight: 1 },
  statLabel: { color: "rgba(255,255,255,0.4)", fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "0.3rem" },
  statDiv: { width: "1px", height: "32px", background: "rgba(255,255,255,0.12)" },

  tabs: { display: "flex", borderBottom: "1px solid #f0eaf4" },
  tab: { flex: 1, padding: "0.9rem", border: "none", background: "transparent", cursor: "pointer", fontSize: "0.86rem", fontWeight: "500", color: "#8b6070", borderBottom: "2px solid transparent", transition: "color 0.15s" },
  tabActive: { color: "#d4235e", borderBottom: "2px solid #d4235e" },

  body: { flex: 1, overflowY: "auto", padding: "1.3rem 1.5rem" },

  center: { textAlign: "center", padding: "3rem 1rem" },
  loadIcon: { fontSize: "2rem", display: "block", marginBottom: "0.8rem" },
  hint: { color: "#8b6070", fontSize: "0.85rem" },

  emptyWrap: { textAlign: "center", padding: "3rem 1rem" },
  emptyIcon: { fontSize: "3rem", display: "block", marginBottom: "0.8rem" },
  emptyTitle: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "1.1rem", marginBottom: "0.4rem" },
  emptyHint: { color: "#8b6070", fontSize: "0.82rem", lineHeight: 1.6 },

  orderList: { display: "flex", flexDirection: "column", gap: "0.9rem" },
  orderCard: { background: "#fdf8fb", border: "1px solid #f0e4ee", borderRadius: "16px", padding: "1rem 1.2rem" },
  orderTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.4rem" },
  orderTopLeft: { display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" },
  orderIdBadge: { background: "#f5eef2", color: "#8b6070", fontSize: "0.72rem", fontWeight: "700", padding: "0.18rem 0.6rem", borderRadius: "8px" },
  badge: { padding: "0.2rem 0.7rem", borderRadius: "50px", fontSize: "0.7rem", fontWeight: "600" },
  typeTag: { background: "#f0f4f8", color: "#475569", fontSize: "0.68rem", fontWeight: "600", padding: "0.18rem 0.6rem", borderRadius: "50px" },
  orderDate: { color: "#8b6070", fontSize: "0.72rem", whiteSpace: "nowrap" },
  orderItems: { color: "#6b4c58", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "0.7rem" },
  orderFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderTime: { color: "#b0a0a8", fontSize: "0.72rem" },
  orderTotal: { color: "#d4235e", fontWeight: "700", fontSize: "0.95rem", fontFamily: "'Playfair Display', serif" },

  settingSection: { marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0eaf4" },
  settingHeading: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.25rem" },
  settingDesc: { color: "#8b6070", fontSize: "0.78rem", marginBottom: "1.2rem" },
  label: { display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#6b4c58", marginBottom: "0.4rem" },
  input: { width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", border: "1.5px solid #f0eaf4", fontSize: "0.9rem", outline: "none", color: "#1c0f18", marginBottom: "0.9rem", boxSizing: "border-box" },
  saveBtn: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600" },
  accountRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: "1px solid #faf3f7" },
  accountLabel: { color: "#8b6070", fontSize: "0.82rem" },
  accountValue: { color: "#1c0f18", fontSize: "0.82rem", fontWeight: "500" },

  signOutBtn: { width: "100%", background: "#fce4ec", border: "none", color: "#c62828", padding: "0.8rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600", marginTop: "0.5rem" },

  footer: { padding: "1rem 1.5rem", borderTop: "1px solid #f0eaf4", background: "#fdf8fb" },
  signOutBtnSmall: { background: "transparent", border: "none", color: "#8b6070", fontSize: "0.82rem", cursor: "pointer", padding: "0.3rem 0" },
};
