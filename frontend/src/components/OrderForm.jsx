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
        <h2 style={s.title}>📋 Place Your Order</h2>

        <div style={s.summary}>
          <p style={s.summaryText}>{itemsSummary}</p>
          <p style={s.total}>Total: <strong>${total.toFixed(2)}</strong></p>
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
            {loading ? "Placing order..." : "Confirm Order"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "white", borderRadius: "16px", padding: "2rem", width: "380px", position: "relative" },
  close: { position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#888" },
  title: { color: "#e91e8c", margin: "0 0 1rem" },
  summary: { background: "#fff0f6", borderRadius: "8px", padding: "1rem", marginBottom: "1.5rem" },
  summaryText: { margin: "0 0 0.5rem", color: "#555", fontSize: "0.9rem" },
  total: { margin: 0, fontSize: "1.1rem" },
  label: { display: "block", marginBottom: "0.3rem", color: "#555", fontSize: "0.9rem" },
  input: { width: "100%", padding: "0.7rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem", fontSize: "1rem", boxSizing: "border-box" },
  error: { color: "red", fontSize: "0.9rem", marginBottom: "0.5rem" },
  btn: { width: "100%", background: "#e91e8c", color: "white", border: "none", padding: "1rem", borderRadius: "10px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" },
};
