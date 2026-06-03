import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = tab === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(`${BACKEND_URL}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Something went wrong"); setLoading(false); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      onSuccess();
    } catch { setError("Could not connect to server."); }
    setLoading(false);
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>
        <div style={s.logo}>🍰</div>
        <h2 style={s.title}>{tab === "login" ? "Welcome back!" : "Create account"}</h2>
        <p style={s.sub}>Sign in to place your order</p>

        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === "login" ? s.activeTab : {}) }} onClick={() => setTab("login")}>Sign In</button>
          <button style={{ ...s.tab, ...(tab === "register" ? s.activeTab : {}) }} onClick={() => setTab("register")}>Sign Up</button>
        </div>

        <form onSubmit={handle}>
          <input style={s.input} type="email" placeholder="Email address"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={s.input} type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" },
  modal: { background: "white", borderRadius: "24px", padding: "2.5rem", width: "100%", maxWidth: "400px", position: "relative", textAlign: "center" },
  close: { position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#aaa" },
  logo: { fontSize: "3rem", marginBottom: "0.5rem" },
  title: { fontSize: "1.5rem", fontWeight: "700", color: "#1a1a2e", margin: "0 0 0.3rem" },
  sub: { color: "#888", fontSize: "0.9rem", marginBottom: "1.5rem" },
  tabs: { display: "flex", background: "#f5f5f5", borderRadius: "12px", padding: "4px", marginBottom: "1.2rem" },
  tab: { flex: 1, padding: "0.6rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "10px", fontWeight: "500", color: "#888", fontSize: "0.9rem" },
  activeTab: { background: "white", color: "#e91e8c", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  input: { width: "100%", padding: "0.9rem 1.2rem", borderRadius: "12px", border: "1.5px solid #eee", marginBottom: "1rem", fontSize: "0.95rem", outline: "none", display: "block", boxSizing: "border-box" },
  error: { color: "#e91e8c", fontSize: "0.85rem", marginBottom: "0.8rem", textAlign: "left" },
  btn: { width: "100%", background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white", border: "none", padding: "1rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" },
};
