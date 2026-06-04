import { useState } from "react";

export default function OrderForm({ cart, backendUrl, onClose, onSuccess }) {
  const [form, setForm] = useState({ customer_name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const itemsSummary = cart.map((i) => `${i.name} x${i.qty}`).join(", ");

  const submit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.phone) { setError("Please fill all fields"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

        <form onSubmit={submit}>
          <label style={s.label}>Your Name</label>
          <input style={s.input} placeholder="e.g. Tamara" value={form.customer_name}
            onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />

          <label style={s.label}>Phone Number</label>
          <input style={s.input} placeholder="e.g. +995 555 123 456" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />

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
  modal: { background: "white", borderRadius: "24px", padding: "2.2rem", width: "100%", maxWidth: "420px", position: "relative", boxShadow: "0 30px 60px rgba(0,0,0,0.2)" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },

  top: { textAlign: "center", marginBottom: "1.5rem" },
  topIcon: { fontSize: "2rem", display: "block", marginBottom: "0.5rem" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.35rem", fontWeight: "700", marginBottom: "0.25rem" },
  sub: { color: "#8b6070", fontSize: "0.82rem" },

  summary: { background: "#fdf0f5", border: "1px solid #f5dde8", borderRadius: "14px", padding: "1rem 1.2rem", marginBottom: "1.5rem" },
  summaryItems: { color: "#6b4c58", fontSize: "0.83rem", marginBottom: "0.7rem", lineHeight: 1.5 },
  summaryTotal: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summaryTotalLabel: { color: "#6b4c58", fontWeight: "500", fontSize: "0.85rem" },
  summaryTotalAmount: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "1.3rem" },

  label: { display: "block", marginBottom: "0.35rem", color: "#6b4c58", fontSize: "0.82rem", fontWeight: "500" },
  input: { width: "100%", padding: "0.82rem 1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", marginBottom: "1rem", fontSize: "0.92rem", boxSizing: "border-box", outline: "none", color: "#1c0f18" },
  error: { color: "#d4235e", fontSize: "0.82rem", marginBottom: "0.8rem" },
  btn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" },
};
