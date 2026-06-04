import { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function AuthModal({ onClose, onSuccess }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
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
      setError("Could not connect to server. Please try again.");
    }
    setLoading(false);
  };

  const switchTab = (t) => { setTab(t); setError(""); setForm({ email: "", password: "", name: "" }); };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <button style={s.close} onClick={onClose}>✕</button>

        {/* Brand header */}
        <div style={s.top}>
          <div style={s.logoWrap}>
            <span style={s.logo}>🍰</span>
          </div>
          <h2 style={s.title}>
            {tab === "login" ? "Welcome back!" : "Join us today"}
          </h2>
          <p style={s.sub}>
            {tab === "login"
              ? "Sign in to track your orders and order faster"
              : "Create an account to start ordering"}
          </p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === "login" ? s.tabActive : {}) }}
            onClick={() => switchTab("login")}
          >
            Sign In
          </button>
          <button
            style={{ ...s.tab, ...(tab === "register" ? s.tabActive : {}) }}
            onClick={() => switchTab("register")}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handle} style={s.form}>
          {tab === "register" && (
            <>
              <label style={s.label}>Your Name</label>
              <input
                style={s.input}
                type="text"
                placeholder="e.g. Tamar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </>
          )}

          <label style={s.label}>Email Address</label>
          <input
            style={s.input}
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            placeholder={tab === "register" ? "Choose a password" : "Your password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete={tab === "login" ? "current-password" : "new-password"}
          />

          {error && (
            <div style={s.errorBox}>
              ⚠️ {error}
            </div>
          )}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : tab === "login"
              ? "Sign In →"
              : "Create Account →"}
          </button>
        </form>

        <p style={s.switchNote}>
          {tab === "login" ? "New here? " : "Already have an account? "}
          <button style={s.switchLink} onClick={() => switchTab(tab === "login" ? "register" : "login")}>
            {tab === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "28px", padding: "2.5rem", width: "100%", maxWidth: "400px", position: "relative", boxShadow: "0 40px 80px rgba(0,0,0,0.25)" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },

  top: { textAlign: "center", marginBottom: "1.5rem" },
  logoWrap: { width: "70px", height: "70px", background: "linear-gradient(135deg, #fff0f5, #ffdae8)", borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" },
  logo: { fontSize: "2.2rem" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: "700", color: "#1c0f18", marginBottom: "0.3rem" },
  sub: { color: "#8b6070", fontSize: "0.83rem", lineHeight: 1.5 },

  tabs: { display: "flex", background: "#f5eef2", borderRadius: "14px", padding: "3px", marginBottom: "1.4rem" },
  tab: { flex: 1, padding: "0.6rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "11px", fontWeight: "500", color: "#8b6070", fontSize: "0.88rem", transition: "background 0.15s, color 0.15s" },
  tabActive: { background: "white", color: "#d4235e", boxShadow: "0 2px 10px rgba(0,0,0,0.09)", fontWeight: "600" },

  form: {},
  label: { display: "block", fontSize: "0.78rem", fontWeight: "600", color: "#6b4c58", marginBottom: "0.4rem" },
  input: { width: "100%", padding: "0.85rem 1.1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", marginBottom: "1rem", fontSize: "0.92rem", outline: "none", display: "block", boxSizing: "border-box", color: "#1c0f18", transition: "border-color 0.15s" },
  errorBox: { background: "#fce4ec", color: "#c62828", borderRadius: "10px", padding: "0.7rem 1rem", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 },
  btn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", marginBottom: "1rem" },

  switchNote: { textAlign: "center", fontSize: "0.82rem", color: "#8b6070" },
  switchLink: { background: "none", border: "none", color: "#d4235e", fontWeight: "600", cursor: "pointer", fontSize: "0.82rem", textDecoration: "underline" },
};
