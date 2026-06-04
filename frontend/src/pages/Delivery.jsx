import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS = {
  pending:          { label: "Pending",          bg: "#fff8e1", color: "#e65100" },
  confirmed:        { label: "Confirmed",         bg: "#e3f2fd", color: "#1565c0" },
  out_for_delivery: { label: "Out for Delivery",  bg: "#f3e5f5", color: "#6a1b9a" },
  delivered:        { label: "Delivered",         bg: "#e8f5e9", color: "#2e7d32" },
};

export default function Delivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    fetch(`${BACKEND_URL}/api/delivery/orders`, { headers })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { navigate("/login"); return r.json(); }
        return r.json();
      })
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
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

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarIcon}>🚚</div>
          <div style={s.sidebarTitle}>Delivery</div>
          <div style={s.sidebarSub}>Panel</div>
        </div>

        <nav style={s.nav}>
          <button style={{ ...s.navBtn, ...(filter === "active" ? s.navActive : {}) }} onClick={() => setFilter("active")}>
            <span>📦</span> Active Orders
            {active.length > 0 && <span style={s.navBadge}>{active.length}</span>}
          </button>
          <button style={{ ...s.navBtn, ...(filter === "done" ? s.navActive : {}) }} onClick={() => setFilter("done")}>
            <span>✅</span> Completed
          </button>
        </nav>

        <div style={s.sidebarBottom}>
          <button style={s.shopBtn} onClick={() => navigate("/")}>🏪 Shop</button>
          <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>{filter === "active" ? "Active Orders" : "Completed Deliveries"}</h1>
            <p style={s.pageDesc}>{displayed.length} order{displayed.length !== 1 ? "s" : ""}</p>
          </div>
          <button style={s.refreshBtn} onClick={load}>↻ Refresh</button>
        </header>

        <div style={s.content}>
          {loading ? (
            <div style={s.empty}><span style={s.emptyIcon}>⏳</span><p>Loading orders...</p></div>
          ) : displayed.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>{filter === "active" ? "📭" : "📬"}</span>
              <p style={s.emptyText}>{filter === "active" ? "No active orders right now" : "No completed deliveries yet"}</p>
              <p style={s.emptySub}>{filter === "active" ? "Pull to refresh when new orders come in" : ""}</p>
            </div>
          ) : (
            <div style={s.grid}>
              {displayed.map((o) => {
                const st = STATUS[o.status] || STATUS.pending;
                return (
                  <div key={o.id} style={s.card}>
                    <div style={s.cardHeader}>
                      <span style={s.orderId}>Order #{o.id}</span>
                      <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>

                    <div style={s.customerRow}>
                      <span style={s.customerName}>👤 {o.customer_name}</span>
                      <a href={`tel:${o.phone}`} style={s.phone}>📞 {o.phone}</a>
                    </div>

                    {o.address && (
                      <div style={s.addressRow}>
                        <span style={s.addressIcon}>📍</span>
                        <span style={s.address}>{o.address}</span>
                      </div>
                    )}

                    <p style={s.items}>{o.items}</p>

                    <div style={s.cardFooter}>
                      <span style={s.total}>₾{Number(o.total).toFixed(2)}</span>
                      <span style={s.date}>{new Date(o.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    {o.status === "confirmed" && (
                      <button style={s.actionBtn} onClick={() => updateStatus(o.id, "out_for_delivery")}>
                        🚚 I Picked It Up
                      </button>
                    )}
                    {o.status === "out_for_delivery" && (
                      <button style={{ ...s.actionBtn, background: "linear-gradient(135deg, #2e7d32, #1b5e20)" }} onClick={() => updateStatus(o.id, "delivered")}>
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

const s = {
  layout: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },

  sidebar: { width: "230px", background: "linear-gradient(180deg, #0d1b2a 0%, #1a2f4a 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 },
  sidebarTop: { padding: "2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" },
  sidebarIcon: { fontSize: "2.2rem", marginBottom: "0.4rem" },
  sidebarTitle: { color: "white", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.1rem" },
  sidebarSub: { color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "2px" },

  nav: { flex: 1, padding: "1.5rem 1rem" },
  navBtn: { display: "flex", alignItems: "center", gap: "0.7rem", width: "100%", padding: "0.8rem 1rem", background: "transparent", border: "none", color: "rgba(255,255,255,0.55)", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "500", marginBottom: "0.3rem", textAlign: "left", position: "relative" },
  navActive: { background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white" },
  navBadge: { marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: "50%", fontSize: "0.7rem", fontWeight: "700", padding: "1px 6px", minWidth: "18px", textAlign: "center" },

  sidebarBottom: { padding: "1.5rem 1rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "0.5rem" },
  shopBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1rem", background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.65)", borderRadius: "10px", cursor: "pointer", fontSize: "0.83rem" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1rem", background: "rgba(239,68,68,0.15)", border: "none", color: "#f87171", borderRadius: "10px", cursor: "pointer", fontSize: "0.83rem" },

  main: { flex: 1, marginLeft: "230px", background: "#f0f4f8", minHeight: "100vh" },
  topbar: { background: "white", padding: "1.5rem 2rem", borderBottom: "1px solid #e8edf2", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: "700", color: "#0d1b2a" },
  pageDesc: { color: "#64748b", fontSize: "0.82rem", marginTop: "0.2rem" },
  refreshBtn: { background: "#f0f4f8", border: "1px solid #e2e8f0", color: "#475569", padding: "0.5rem 1rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.83rem", fontWeight: "500" },

  content: { padding: "2rem" },
  empty: { textAlign: "center", padding: "5rem 2rem", color: "#64748b" },
  emptyIcon: { fontSize: "3rem", display: "block", marginBottom: "1rem" },
  emptyText: { fontWeight: "600", color: "#334155", marginBottom: "0.4rem" },
  emptySub: { fontSize: "0.85rem" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.2rem" },
  card: { background: "white", borderRadius: "18px", padding: "1.5rem", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e8edf2" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  orderId: { fontWeight: "700", color: "#0d1b2a", fontSize: "0.95rem" },
  badge: { padding: "0.2rem 0.75rem", borderRadius: "50px", fontSize: "0.72rem", fontWeight: "600" },

  customerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" },
  customerName: { color: "#334155", fontWeight: "600", fontSize: "0.9rem" },
  phone: { color: "#1d4ed8", fontWeight: "500", fontSize: "0.85rem", textDecoration: "none" },

  addressRow: { display: "flex", alignItems: "flex-start", gap: "0.4rem", background: "#f0f4f8", borderRadius: "10px", padding: "0.6rem 0.8rem", marginBottom: "0.7rem" },
  addressIcon: { fontSize: "0.9rem", flexShrink: 0 },
  address: { color: "#334155", fontSize: "0.85rem", lineHeight: 1.4 },

  items: { color: "#64748b", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "0.8rem" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  total: { color: "#0d1b2a", fontWeight: "700", fontSize: "1rem" },
  date: { color: "#94a3b8", fontSize: "0.78rem" },

  actionBtn: { width: "100%", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white", border: "none", padding: "0.8rem", borderRadius: "12px", fontSize: "0.9rem", fontWeight: "600", cursor: "pointer" },
};
