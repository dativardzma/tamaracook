import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function AuthModal({ onClose, onSuccess }) {
  const { isDark } = useTheme();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
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
    } catch { setError("Could not connect to server."); }
    setLoading(false);
  };

  const switchTab = (t) => { setTab(t); setError(""); setForm({ email: "", password: "", name: "" }); };
  const c = isDark ? dc : lc;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, background: c.bg, boxShadow: c.shadow }} className="animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <button style={{ ...s.close, background: c.closeBg, color: c.closeTxt }} onClick={onClose}>✕</button>

        <div style={s.top}>
          <div style={s.logoWrap}><span style={s.logo}>🍰</span></div>
          <h2 style={{ ...s.title, color: c.text }}>
            {tab === "login" ? "Welcome back!" : "Join us today"}
          </h2>
          <p style={{ ...s.sub, color: c.muted }}>
            {tab === "login" ? "Sign in to track and place orders" : "Create an account to start ordering"}
          </p>
        </div>

        <div style={{ ...s.tabs, background: c.tabsBg }}>
          <button style={{ ...s.tab, ...(tab === "login" ? { background: c.bg, color: "#d4235e", fontWeight: "700", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" } : { color: c.muted }) }} onClick={() => switchTab("login")}>Sign In</button>
          <button style={{ ...s.tab, ...(tab === "register" ? { background: c.bg, color: "#d4235e", fontWeight: "700", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" } : { color: c.muted }) }} onClick={() => switchTab("register")}>Create Account</button>
        </div>

        <form onSubmit={handle}>
          {tab === "register" && (
            <>
              <label style={{ ...s.label, color: c.muted }}>Your Name</label>
              <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} type="text" placeholder="e.g. Tamar"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </>
          )}
          <label style={{ ...s.label, color: c.muted }}>Email Address</label>
          <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} type="email" placeholder="your@email.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
          <label style={{ ...s.label, color: c.muted }}>Password</label>
          <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} type="password"
            placeholder={tab === "register" ? "Choose a password" : "Your password"}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required
            autoComplete={tab === "login" ? "current-password" : "new-password"} />
          {error && <div style={s.errorBox}>⚠️ {error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Please wait..." : tab === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <p style={{ ...s.switchNote, color: c.muted }}>
          {tab === "login" ? "New here? " : "Already have an account? "}
          <button style={s.switchLink} onClick={() => switchTab(tab === "login" ? "register" : "login")}>
            {tab === "login" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

const lc = { bg: "white", shadow: "0 40px 80px rgba(0,0,0,0.22)", text: "#1c0f18", muted: "#8b6070", closeBg: "#f5eef2", closeTxt: "#8b6070", tabsBg: "#f5eef2", inputBg: "white", inputBorder: "#f0e4ea" };
const dc = { bg: "#1b1320", shadow: "0 40px 80px rgba(0,0,0,0.55)", text: "#f0ecf4", muted: "#9878a8", closeBg: "rgba(255,255,255,0.07)", closeTxt: "#9878a8", tabsBg: "#251830", inputBg: "#2a1c38", inputBorder: "rgba(255,255,255,0.12)" };

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "1rem" },
  modal: { borderRadius: "28px", padding: "2.5rem", width: "100%", maxWidth: "400px", position: "relative" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },
  top: { textAlign: "center", marginBottom: "1.6rem" },
  logoWrap: { width: "70px", height: "70px", background: "linear-gradient(135deg, #fff0f5, #ffdae8)", borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" },
  logo: { fontSize: "2.2rem" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.3rem" },
  sub: { fontSize: "0.83rem", lineHeight: 1.55 },
  tabs: { display: "flex", borderRadius: "14px", padding: "3px", marginBottom: "1.4rem", gap: "2px" },
  tab: { flex: 1, padding: "0.6rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "11px", fontWeight: "500", fontSize: "0.88rem", transition: "all 0.15s" },
  label: { display: "block", fontSize: "0.78rem", fontWeight: "600", marginBottom: "0.4rem" },
  input: { width: "100%", padding: "0.85rem 1.1rem", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.92rem", outline: "none", display: "block", boxSizing: "border-box", transition: "border-color 0.15s" },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626", borderRadius: "10px", padding: "0.7rem 1rem", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 },
  btn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", marginBottom: "1rem" },
  switchNote: { textAlign: "center", fontSize: "0.82rem" },
  switchLink: { background: "none", border: "none", color: "#d4235e", fontWeight: "600", cursor: "pointer", fontSize: "0.82rem", textDecoration: "underline" },
};
