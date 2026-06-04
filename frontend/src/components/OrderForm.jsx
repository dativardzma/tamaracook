import { useState } from "react";

export default function OrderForm({ cart, backendUrl, onClose, onSuccess }) {
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "", order_type: "delivery" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const itemsSummary = cart.map((i) => `${i.name} x${i.qty}`).join(", ");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone) { setError("Please fill all fields"); return; }
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
      else setError("Something went wrong. Try again.");
    } catch {
      setError("Could not connect to server.");
    }
    setLoading(false);
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        <div style={s.top}>
          <span style={s.topIcon}>📋</span>
          <h2 style={s.title}>Place Your Order</h2>
          <p style={s.sub}>We'll call you to confirm</p>
        </div>

        <div style={s.summary}>
          <p style={s.summaryItems}>{itemsSummary}</p>
          <div style={s.summaryTotal}>
            <span style={s.summaryTotalLabel}>Total</span>
            <span style={s.summaryTotalAmount}>₾{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Delivery / Pickup toggle */}
        <div style={s.typeToggle}>
          <button
            type="button"
            style={{ ...s.typeBtn, ...(form.order_type === "delivery" ? s.typeBtnActive : {}) }}
            onClick={() => setForm({ ...form, order_type: "delivery" })}
          >
            🚚 Delivery
          </button>
          <button
            type="button"
            style={{ ...s.typeBtn, ...(form.order_type === "pickup" ? s.typeBtnActive : {}) }}
            onClick={() => setForm({ ...form, order_type: "pickup", address: "" })}
          >
            🏠 Pickup
          </button>
        </div>

        {form.order_type === "pickup" && (
          <div style={s.pickupNote}>
            📍 Pick up at: <strong>Tamar's Kitchen, Tbilisi</strong><br />
            <span style={s.pickupSub}>We'll confirm the exact address by phone</span>
          </div>
        )}

        <form onSubmit={submit}>
          <label style={s.label}>Your Name</label>
          <input style={s.input} placeholder="e.g. Tamara" value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />

          <label style={s.label}>Phone Number</label>
          <input style={s.input} placeholder="e.g. +995 555 123 456" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          {form.order_type === "delivery" && (
            <>
              <label style={s.label}>Delivery Address</label>
              <input style={s.input} placeholder="Street, district, landmark..." value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </>
          )}

          {error && <p style={s.error}>{error}</p>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Placing order..." : "Confirm Order →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "24px", padding: "2.2rem", width: "100%", maxWidth: "430px", position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },
  top: { textAlign: "center", marginBottom: "1.3rem" },
  topIcon: { fontSize: "2rem", display: "block", marginBottom: "0.5rem" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.35rem", fontWeight: "700", marginBottom: "0.25rem" },
  sub: { color: "#8b6070", fontSize: "0.82rem" },
  summary: { background: "#fdf0f5", border: "1px solid #f5dde8", borderRadius: "14px", padding: "1rem 1.2rem", marginBottom: "1.2rem" },
  summaryItems: { color: "#6b4c58", fontSize: "0.83rem", marginBottom: "0.7rem", lineHeight: 1.5 },
  summaryTotal: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summaryTotalLabel: { color: "#6b4c58", fontWeight: "500", fontSize: "0.85rem" },
  summaryTotalAmount: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "1.3rem" },
  typeToggle: { display: "flex", background: "#f5eef2", borderRadius: "12px", padding: "3px", marginBottom: "1.2rem", gap: "3px" },
  typeBtn: { flex: 1, padding: "0.6rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "10px", fontWeight: "500", color: "#8b6070", fontSize: "0.88rem" },
  typeBtnActive: { background: "white", color: "#d4235e", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", fontWeight: "600" },
  pickupNote: { background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "12px", padding: "0.9rem 1rem", marginBottom: "1.2rem", fontSize: "0.85rem", color: "#5d4037", lineHeight: 1.6 },
  pickupSub: { color: "#8d6e63", fontSize: "0.78rem" },
  label: { display: "block", marginBottom: "0.35rem", color: "#6b4c58", fontSize: "0.82rem", fontWeight: "500" },
  input: { width: "100%", padding: "0.82rem 1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", marginBottom: "1rem", fontSize: "0.92rem", boxSizing: "border-box", outline: "none", color: "#1c0f18" },
  error: { color: "#d4235e", fontSize: "0.82rem", marginBottom: "0.8rem" },
  btn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" },
};
