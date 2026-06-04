import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS = {
  pending:          { label: "Pending",           bg: "#fff8e1", color: "#e65100", dot: "#ff9800" },
  confirmed:        { label: "Ready to Pick Up",  bg: "#e3f2fd", color: "#1565c0", dot: "#2196f3" },
  out_for_delivery: { label: "Out for Delivery",  bg: "#f3e5f5", color: "#6a1b9a", dot: "#9c27b0" },
  delivered:        { label: "Delivered",         bg: "#e8f5e9", color: "#2e7d32", dot: "#4caf50" },
};

function timeLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function Delivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [filter, setFilter] = useState("active");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const driverEmail = localStorage.getItem("email");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/delivery/orders`, { headers })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { setAccessDenied(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setOrders(Array.isArray(data) ? data : []); setLoading(false); } })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await fetch(`${BACKEND_URL}/api/delivery/orders/${id}/status`, {
      method: "PUT", headers,
      body: JSON.stringify({ status }),
    });
    load();
  };

  const logout = () => {
    ["token", "email", "is_admin", "is_delivery"].forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  const active = orders.filter((o) => ["confirmed", "out_for_delivery"].includes(o.status));
  const completed = orders.filter((o) => o.status === "delivered");
  const displayed = filter === "active" ? active : completed;

  /* ── Access Denied ── */
  if (accessDenied) {
    return (
      <div style={ad.wrap}>
        <div style={ad.box}>
          <div style={ad.icon}>🔒</div>
          <h2 style={ad.title}>Access Denied</h2>
          <p style={ad.sub}>This account doesn't have delivery staff access.</p>
          <button onClick={() => navigate("/login")} style={ad.btn}>Sign in with another account</button>
          <button onClick={() => navigate("/")} style={ad.btnSec}>← Back to Shop</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.layout}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarIcon}>🚚</div>
          <div style={s.sidebarTitle}>Delivery</div>
          <div style={s.sidebarSub}>Staff Panel</div>
        </div>

        {driverEmail && (
          <div style={s.driverInfo}>
            <div style={s.driverAvatar}>{driverEmail[0].toUpperCase()}</div>
            <div>
              <div style={s.driverName}>{driverEmail.split("@")[0]}</div>
              <div style={s.driverRole}>Delivery Staff</div>
            </div>
          </div>
        )}

        <nav style={s.nav}>
          <button
            style={{ ...s.navBtn, ...(filter === "active" ? s.navActive : {}) }}
            onClick={() => setFilter("active")}
          >
            <span>📦</span>
            <span>Active Orders</span>
            {active.length > 0 && <span style={s.navBadge}>{active.length}</span>}
          </button>
          <button
            style={{ ...s.navBtn, ...(filter === "done" ? s.navActive : {}) }}
            onClick={() => setFilter("done")}
          >
            <span>✅</span>
            <span>Completed</span>
            {completed.length > 0 && <span style={s.navCount}>{completed.length}</span>}
          </button>
        </nav>

        <div style={s.sidebarBottom}>
          <button style={s.shopBtn} onClick={() => navigate("/")}>🏪 View Shop</button>
          <button style={s.logoutBtn} onClick={logout}>🚪 Sign Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>
              {filter === "active" ? "Active Orders" : "Completed Deliveries"}
            </h1>
            <p style={s.pageDesc}>
              {displayed.length} order{displayed.length !== 1 ? "s" : ""}
              {filter === "active" && active.length > 0 && ` · ${active.filter(o => o.status === "confirmed").length} ready to pick up`}
            </p>
          </div>
          <button style={s.refreshBtn} onClick={load}>↻ Refresh</button>
        </header>

        <div style={s.content}>
          {loading ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>⏳</span>
              <p style={s.emptyText}>Loading orders...</p>
            </div>
          ) : displayed.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>{filter === "active" ? "📭" : "🏆"}</span>
              <p style={s.emptyTitle}>
                {filter === "active" ? "No active orders" : "No deliveries yet"}
              </p>
              <p style={s.emptyText}>
                {filter === "active"
                  ? "Pull to refresh when new confirmed orders come in"
                  : "Completed deliveries will appear here"}
              </p>
              <button style={s.emptyRefresh} onClick={load}>↻ Check for Orders</button>
            </div>
          ) : (
            <div style={s.grid}>
              {displayed.map((o) => {
                const st = STATUS[o.status] || STATUS.pending;
                const isPickup = o.order_type === "pickup";
                return (
                  <div key={o.id} style={s.card}>
                    <div style={s.cardTop}>
                      <div style={s.cardTopLeft}>
                        <span style={{ ...s.statusDot, background: st.dot }} />
                        <span style={s.orderId}>Order #{o.id}</span>
                      </div>
                      <div style={s.cardTopRight}>
                        <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>
                        <span style={s.timeAgo}>{timeLabel(o.created_at)}</span>
                      </div>
                    </div>

                    <div style={s.typeBadge}>
                      {isPickup ? "🏠 Pickup" : "🚚 Delivery"}
                    </div>

                    <div style={s.customerSection}>
                      <div style={s.customerRow}>
                        <span style={s.customerIcon}>👤</span>
                        <span style={s.customerName}>{o.customer_name}</span>
                      </div>
                      <a href={`tel:${o.phone}`} style={s.phoneBtn}>
                        📞 {o.phone}
                      </a>
                    </div>

                    {o.address && (
                      <div style={s.addressBox}>
                        <span style={s.addressIcon}>📍</span>
                        <div>
                          <div style={s.addressLabel}>Delivery Address</div>
                          <div style={s.addressText}>{o.address}</div>
                        </div>
                      </div>
                    )}

                    <div style={s.itemsBox}>
                      <div style={s.itemsLabel}>Order Items</div>
                      <p style={s.itemsText}>{o.items}</p>
                    </div>

                    <div style={s.cardFooter}>
                      <div>
                        <div style={s.totalLabel}>Total</div>
                        <div style={s.total}>₾{Number(o.total).toFixed(2)}</div>
                      </div>
                      <div style={s.orderTime}>
                        {new Date(o.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {o.status === "confirmed" && (
                      <button
                        style={s.actionBtn}
                        onClick={() => updateStatus(o.id, "out_for_delivery")}
                      >
                        🚚 I Picked It Up — On My Way
                      </button>
                    )}
                    {o.status === "out_for_delivery" && (
                      <button
                        style={{ ...s.actionBtn, background: "linear-gradient(135deg, #2e7d32, #1b5e20)" }}
                        onClick={() => updateStatus(o.id, "delivered")}
                      >
                        ✅ Mark as Delivered
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const ad = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4f8", fontFamily: "'Inter', sans-serif", padding: "2rem" },
  box: { textAlign: "center", background: "white", padding: "3rem", borderRadius: "24px", boxShadow: "0 8px 40px rgba(0,0,0,0.1)", maxWidth: "380px", width: "100%" },
  icon: { fontSize: "3.5rem", marginBottom: "1rem" },
  title: { fontFamily: "'Playfair Display', serif", color: "#0d1b2a", fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" },
  sub: { color: "#64748b", marginBottom: "2rem", fontSize: "0.9rem", lineHeight: 1.6 },
  btn: { display: "block", width: "100%", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white", border: "none", padding: "0.85rem", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "0.92rem", marginBottom: "0.8rem" },
  btnSec: { display: "block", width: "100%", background: "#f0f4f8", color: "#475569", border: "none", padding: "0.85rem", borderRadius: "12px", cursor: "pointer", fontWeight: "500", fontSize: "0.88rem" },
};

const s = {
  layout: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },

  sidebar: { width: "240px", background: "linear-gradient(180deg, #0d1b2a 0%, #1a2f4a 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40 },
  sidebarTop: { padding: "1.8rem 1.5rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.07)", textAlign: "center" },
  sidebarIcon: { fontSize: "2rem", marginBottom: "0.3rem" },
  sidebarTitle: { color: "white", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.05rem" },
  sidebarSub: { color: "rgba(255,255,255,0.3)", fontSize: "0.63rem", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "2px" },

  driverInfo: { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1rem", background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "0.8rem" },
  driverAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.9rem", flexShrink: 0 },
  driverName: { color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", fontWeight: "600" },
  driverRole: { color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", letterSpacing: "0.05em" },

  nav: { flex: 1, padding: "0.8rem" },
  navBtn: { display: "flex", alignItems: "center", gap: "0.65rem", width: "100%", padding: "0.8rem 1rem", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: "12px", cursor: "pointer", fontSize: "0.86rem", fontWeight: "500", marginBottom: "0.2rem", textAlign: "left", position: "relative", transition: "background 0.15s, color 0.15s" },
  navActive: { background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white" },
  navBadge: { marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: "50%", fontSize: "0.68rem", fontWeight: "800", padding: "1px 6px", minWidth: "20px", textAlign: "center" },
  navCount: { marginLeft: "auto", background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "50%", fontSize: "0.68rem", padding: "1px 6px", minWidth: "20px", textAlign: "center" },

  sidebarBottom: { padding: "1rem 0.8rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "0.5rem" },
  shopBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1rem", background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1rem", background: "rgba(239,68,68,0.12)", border: "none", color: "#f87171", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem" },

  main: { flex: 1, marginLeft: "240px", background: "#f0f4f8", minHeight: "100vh" },
  topbar: { background: "white", padding: "1.4rem 2rem", borderBottom: "1px solid #e8edf2", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 30 },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: "700", color: "#0d1b2a" },
  pageDesc: { color: "#64748b", fontSize: "0.8rem", marginTop: "0.2rem" },
  refreshBtn: { background: "#f0f4f8", border: "1px solid #e2e8f0", color: "#475569", padding: "0.5rem 1.1rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "500" },

  content: { padding: "2rem" },

  empty: { textAlign: "center", padding: "5rem 2rem" },
  emptyIcon: { fontSize: "3.5rem", display: "block", marginBottom: "1rem" },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontWeight: "700", color: "#0d1b2a", fontSize: "1.1rem", marginBottom: "0.5rem" },
  emptyText: { color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "1.5rem" },
  emptyRefresh: { background: "#1d4ed8", color: "white", border: "none", padding: "0.65rem 1.5rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "1.2rem" },

  card: { background: "white", borderRadius: "20px", padding: "1.5rem", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1px solid #e8edf2" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" },
  cardTopLeft: { display: "flex", alignItems: "center", gap: "0.5rem" },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  orderId: { fontWeight: "700", color: "#0d1b2a", fontSize: "0.92rem" },
  cardTopRight: { display: "flex", alignItems: "center", gap: "0.6rem" },
  badge: { padding: "0.22rem 0.75rem", borderRadius: "50px", fontSize: "0.72rem", fontWeight: "600" },
  timeAgo: { color: "#94a3b8", fontSize: "0.72rem" },

  typeBadge: { display: "inline-flex", background: "#f0f4f8", color: "#475569", fontSize: "0.72rem", fontWeight: "600", padding: "0.2rem 0.7rem", borderRadius: "50px", marginBottom: "1rem" },

  customerSection: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" },
  customerRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  customerIcon: { fontSize: "1rem" },
  customerName: { color: "#0d1b2a", fontWeight: "700", fontSize: "0.95rem" },
  phoneBtn: { display: "flex", alignItems: "center", gap: "0.3rem", background: "#eff6ff", color: "#1d4ed8", fontWeight: "600", fontSize: "0.82rem", padding: "0.4rem 0.9rem", borderRadius: "50px", textDecoration: "none" },

  addressBox: { display: "flex", alignItems: "flex-start", gap: "0.6rem", background: "#f8fafc", borderRadius: "12px", padding: "0.8rem 1rem", marginBottom: "0.9rem", border: "1px solid #e2e8f0" },
  addressIcon: { fontSize: "1rem", flexShrink: 0, marginTop: "1px" },
  addressLabel: { color: "#64748b", fontSize: "0.68rem", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.2rem" },
  addressText: { color: "#0d1b2a", fontSize: "0.85rem", fontWeight: "500", lineHeight: 1.4 },

  itemsBox: { background: "#fafafa", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1rem" },
  itemsLabel: { color: "#94a3b8", fontSize: "0.68rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" },
  itemsText: { color: "#334155", fontSize: "0.84rem", lineHeight: 1.5 },

  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1rem" },
  totalLabel: { color: "#94a3b8", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.08em" },
  total: { color: "#0d1b2a", fontWeight: "800", fontSize: "1.15rem", fontFamily: "'Playfair Display', serif" },
  orderTime: { color: "#94a3b8", fontSize: "0.78rem" },

  actionBtn: { width: "100%", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white", border: "none", padding: "0.85rem", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", letterSpacing: "0.01em" },
};
