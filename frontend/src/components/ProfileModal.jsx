import { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS_STYLE = {
  pending:   { bg: "#fff8e1", color: "#e65100", label: "Pending" },
  confirmed: { bg: "#e8f5e9", color: "#2e7d32", label: "Confirmed" },
  delivered: { bg: "#e3f2fd", color: "#1565c0", label: "Delivered" },
};

export default function ProfileModal({ email, onClose, onSignOut }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${BACKEND_URL}/api/orders/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        <div style={s.top}>
          <div style={s.avatar}>{email[0].toUpperCase()}</div>
          <h2 style={s.email}>{email}</h2>
          <button style={s.signOut} onClick={onSignOut}>Sign Out</button>
        </div>

        <div style={s.section}>
          <h3 style={s.sectionTitle}>My Orders</h3>

          {loading ? (
            <p style={s.hint}>Loading...</p>
          ) : orders.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>🛍️</span>
              <p style={s.emptyText}>No orders yet</p>
              <p style={s.emptyHint}>Your order history will appear here</p>
            </div>
          ) : (
            <div style={s.orderList}>
              {orders.map((o) => {
                const st = STATUS_STYLE[o.status] || STATUS_STYLE.pending;
                return (
                  <div key={o.id} style={s.orderCard}>
                    <div style={s.orderHeader}>
                      <span style={s.orderId}>Order #{o.id}</span>
                      <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <p style={s.orderItems}>{o.items}</p>
                    <div style={s.orderFooter}>
                      <span style={s.orderDate}>{new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span style={s.orderTotal}>₾{Number(o.total).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "24px", width: "100%", maxWidth: "480px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 30px 60px rgba(0,0,0,0.2)", position: "relative", overflow: "hidden" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 },

  top: { background: "linear-gradient(145deg, #1c0f18, #3a1430)", padding: "2.5rem 2rem 2rem", textAlign: "center" },
  avatar: { width: "60px", height: "60px", borderRadius: "50%", background: "#d4235e", color: "white", fontSize: "1.6rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.8rem", fontFamily: "'Playfair Display', serif" },
  email: { color: "white", fontSize: "1rem", fontWeight: "500", marginBottom: "1rem" },
  signOut: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", padding: "0.4rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.8rem" },

  section: { flex: 1, overflowY: "auto", padding: "1.5rem" },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c0f18", fontWeight: "700", marginBottom: "1rem" },
  hint: { color: "#8b6070", fontSize: "0.85rem" },

  empty: { textAlign: "center", padding: "2.5rem 1rem" },
  emptyIcon: { fontSize: "2.5rem", display: "block", marginBottom: "0.8rem" },
  emptyText: { color: "#1c0f18", fontWeight: "600", marginBottom: "0.3rem" },
  emptyHint: { color: "#8b6070", fontSize: "0.82rem" },

  orderList: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  orderCard: { background: "#fdf8fb", border: "1px solid #f0e4ee", borderRadius: "14px", padding: "1rem 1.2rem" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  orderId: { fontWeight: "700", color: "#1c0f18", fontSize: "0.85rem" },
  badge: { padding: "0.2rem 0.7rem", borderRadius: "50px", fontSize: "0.72rem", fontWeight: "600" },
  orderItems: { color: "#6b4c58", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "0.6rem" },
  orderFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderDate: { color: "#8b6070", fontSize: "0.75rem" },
  orderTotal: { color: "#d4235e", fontWeight: "700", fontSize: "0.92rem" },
};
