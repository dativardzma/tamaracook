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
      localStorage.setItem("is_admin", data.is_admin ? "true" : "false");
      localStorage.setItem("is_delivery", data.is_delivery ? "true" : "false");
      onSuccess(data);
    } catch {
      setError("Could not connect to server.");
    }
    setLoading(false);
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        <div style={s.logoWrap}>
          <span style={s.logo}>🍰</span>
        </div>
        <h2 style={s.title}>{tab === "login" ? "Welcome back" : "Create account"}</h2>
        <p style={s.sub}>{tab === "login" ? "Sign in to place your order" : "Join us to start ordering"}</p>

        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === "login" ? s.tabActive : {}) }} onClick={() => { setTab("login"); setError(""); }}>Sign In</button>
          <button style={{ ...s.tab, ...(tab === "register" ? s.tabActive : {}) }} onClick={() => { setTab("register"); setError(""); }}>Sign Up</button>
        </div>

        <form onSubmit={handle}>
          <input style={s.input} type="email" placeholder="Email address"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input style={s.input} type="password" placeholder="Password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
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
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "24px", padding: "2.5rem", width: "100%", maxWidth: "400px", position: "relative", textAlign: "center", boxShadow: "0 30px 60px rgba(0,0,0,0.2)" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },
  logoWrap: { background: "linear-gradient(135deg, #fff0f5, #ffd6e7)", width: "64px", height: "64px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem" },
  logo: { fontSize: "2rem" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: "700", color: "#1c0f18", marginBottom: "0.3rem" },
  sub: { color: "#8b6070", fontSize: "0.85rem", marginBottom: "1.8rem" },
  tabs: { display: "flex", background: "#f5eef2", borderRadius: "12px", padding: "3px", marginBottom: "1.4rem" },
  tab: { flex: 1, padding: "0.55rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "10px", fontWeight: "500", color: "#8b6070", fontSize: "0.88rem" },
  tabActive: { background: "white", color: "#d4235e", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  input: { width: "100%", padding: "0.85rem 1.1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", marginBottom: "0.9rem", fontSize: "0.92rem", outline: "none", display: "block", boxSizing: "border-box", color: "#1c0f18" },
  error: { color: "#d4235e", fontSize: "0.82rem", marginBottom: "0.8rem", textAlign: "left" },
  btn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.95rem", borderRadius: "12px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" },
};
