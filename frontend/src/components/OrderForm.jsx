import { useState } from "react";

export default function OrderForm({ cart, backendUrl, onClose, onSuccess }) {
  const [form, setForm] = useState({
    customer_name: localStorage.getItem("display_name") || "",
    phone: localStorage.getItem("saved_phone") || "",
    address: "",
    order_type: "delivery",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const itemsSummary = cart.map((i) => `${i.name} x${i.qty}`).join(", ");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone) { setError("Please fill in your name and phone number"); return; }
    if (form.order_type === "delivery" && !form.address) { setError("Please enter your delivery address"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${backendUrl}/api/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...form, items: itemsSummary, total }),
      });
      if (res.ok) onSuccess();
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Could not connect to server.");
    }
    setLoading(false);
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        <div style={s.header}>
          <div style={s.headerIcon}>📋</div>
          <h2 style={s.title}>Place Your Order</h2>
          <p style={s.sub}>Fill in your details and we'll call to confirm</p>
        </div>

        {/* Order Summary */}
        <div style={s.summary}>
          <div style={s.summaryHeader}>
            <span style={s.summaryLabel}>Order Summary</span>
            <span style={s.summaryCount}>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
          </div>
          <div style={s.summaryItems}>
            {cart.map((i) => (
              <div key={i.id} style={s.summaryItem}>
                <span style={s.summaryItemEmoji}>{i.emoji}</span>
                <span style={s.summaryItemName}>{i.name}</span>
                <span style={s.summaryItemQty}>×{i.qty}</span>
                <span style={s.summaryItemPrice}>₾{(Number(i.price) * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={s.summaryTotal}>
            <span style={s.summaryTotalLabel}>Total</span>
            <span style={s.summaryTotalAmount}>₾{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery / Pickup Toggle */}
        <div style={s.toggleRow}>
          <button
            type="button"
            style={{ ...s.toggleBtn, ...(form.order_type === "delivery" ? s.toggleBtnActive : {}) }}
            onClick={() => setForm({ ...form, order_type: "delivery" })}
          >
            🚚 Delivery
          </button>
          <button
            type="button"
            style={{ ...s.toggleBtn, ...(form.order_type === "pickup" ? s.toggleBtnActive : {}) }}
            onClick={() => setForm({ ...form, order_type: "pickup", address: "" })}
          >
            🏠 Pickup
          </button>
        </div>

        {form.order_type === "pickup" && (
          <div style={s.pickupNote}>
            <span style={s.pickupNoteIcon}>📍</span>
            <div>
              <strong style={s.pickupNoteTitle}>Pick up at our kitchen</strong>
              <p style={s.pickupNoteText}>We'll confirm the exact address and time by phone after you place your order.</p>
            </div>
          </div>
        )}

        {form.order_type === "delivery" && (
          <div style={s.deliveryNote}>
            🕐 Estimated delivery: <strong>45–75 minutes</strong>
          </div>
        )}

        <form onSubmit={submit}>
          <div style={s.formGrid}>
            <div>
              <label style={s.label}>Your Name *</label>
              <input
                style={s.input}
                placeholder="e.g. Tamar"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={s.label}>Phone Number *</label>
              <input
                style={s.input}
                placeholder="+995 555 000 000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
          </div>

          {form.order_type === "delivery" && (
            <>
              <label style={s.label}>Delivery Address *</label>
              <input
                style={s.input}
                placeholder="Street, building, district, landmark..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </>
          )}

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          <button style={s.submitBtn} type="submit" disabled={loading}>
            {loading ? "Placing your order..." : `Confirm Order · ₾${total.toFixed(2)}`}
          </button>
          <p style={s.submitNote}>We'll call you within a few minutes to confirm</p>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "28px", padding: "2.2rem", width: "100%", maxWidth: "460px", position: "relative", boxShadow: "0 40px 80px rgba(0,0,0,0.22)", maxHeight: "92vh", overflowY: "auto" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },

  header: { textAlign: "center", marginBottom: "1.5rem" },
  headerIcon: { fontSize: "2rem", marginBottom: "0.6rem" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.25rem" },
  sub: { color: "#8b6070", fontSize: "0.82rem" },

  summary: { background: "#fdf0f5", border: "1px solid #f5dde8", borderRadius: "16px", padding: "1rem 1.2rem", marginBottom: "1.2rem" },
  summaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" },
  summaryLabel: { color: "#6b4c58", fontWeight: "600", fontSize: "0.82rem" },
  summaryCount: { background: "#f5dde8", color: "#d4235e", fontSize: "0.72rem", fontWeight: "700", padding: "0.18rem 0.65rem", borderRadius: "50px" },
  summaryItems: { display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" },
  summaryItem: { display: "flex", alignItems: "center", gap: "0.5rem" },
  summaryItemEmoji: { fontSize: "1rem" },
  summaryItemName: { flex: 1, color: "#6b4c58", fontSize: "0.82rem" },
  summaryItemQty: { color: "#8b6070", fontSize: "0.78rem" },
  summaryItemPrice: { color: "#d4235e", fontSize: "0.82rem", fontWeight: "600" },
  summaryTotal: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f5dde8", paddingTop: "0.7rem" },
  summaryTotalLabel: { color: "#6b4c58", fontWeight: "600", fontSize: "0.85rem" },
  summaryTotalAmount: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "1.3rem" },

  toggleRow: { display: "flex", background: "#f5eef2", borderRadius: "14px", padding: "3px", marginBottom: "1rem", gap: "3px" },
  toggleBtn: { flex: 1, padding: "0.65rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "11px", fontWeight: "500", color: "#8b6070", fontSize: "0.88rem", transition: "background 0.15s, color 0.15s" },
  toggleBtnActive: { background: "white", color: "#d4235e", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", fontWeight: "600" },

  pickupNote: { display: "flex", gap: "0.8rem", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "12px", padding: "0.9rem 1rem", marginBottom: "1.1rem" },
  pickupNoteIcon: { fontSize: "1.2rem", flexShrink: 0 },
  pickupNoteTitle: { display: "block", color: "#5d4037", fontSize: "0.85rem", marginBottom: "0.2rem" },
  pickupNoteText: { color: "#8d6e63", fontSize: "0.78rem", lineHeight: 1.5 },

  deliveryNote: { background: "#e8f5e9", color: "#2e7d32", fontSize: "0.8rem", fontWeight: "500", padding: "0.55rem 1rem", borderRadius: "10px", marginBottom: "1.1rem", textAlign: "center" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" },
  label: { display: "block", marginBottom: "0.38rem", color: "#6b4c58", fontSize: "0.78rem", fontWeight: "600" },
  input: { width: "100%", padding: "0.82rem 1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", marginBottom: "1rem", fontSize: "0.92rem", boxSizing: "border-box", outline: "none", color: "#1c0f18" },
  errorBox: { background: "#fce4ec", color: "#c62828", borderRadius: "10px", padding: "0.7rem 1rem", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 },
  submitBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", marginBottom: "0.6rem" },
  submitNote: { textAlign: "center", color: "#8b6070", fontSize: "0.74rem" },
};
