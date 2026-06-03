import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Login() {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", secret: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const url = tab === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(`${BACKEND_URL}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Something went wrong"); setLoading(false); return; }
      if (tab === "login") {
        localStorage.setItem("token", data.token);
        navigate("/admin");
      } else {
        setTab("login");
        setError("");
        alert("Admin account created! Please log in.");
      }
    } catch { setError("Could not connect to server."); }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🍰</div>
        <h1 style={s.title}>Admin Portal</h1>
        <p style={s.sub}>Sakonditro Shop</p>

        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === "login" ? s.activeTab : {}) }} onClick={() => setTab("login")}>Sign In</button>
          <button style={{ ...s.tab, ...(tab === "signup" ? s.activeTab : {}) }} onClick={() => setTab("signup")}>Sign Up</button>
        </div>

        <form onSubmit={handle}>
          <input style={s.input} type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={s.input} type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          {tab === "signup" && <input style={s.input} type="password" placeholder="Admin Secret Code" value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} required />}
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>{loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}</button>
        </form>

        <button style={s.back} onClick={() => navigate("/")}>← Back to Shop</button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #fff5f9, #fce4ec)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" },
  card: { background: "white", borderRadius: "24px", padding: "3rem", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(233,30,140,0.15)", textAlign: "center" },
  logo: { fontSize: "4rem", marginBottom: "1rem" },
  title: { fontSize: "1.8rem", fontWeight: "700", color: "#2d2d2d" },
  sub: { color: "#e91e8c", fontWeight: "500", marginBottom: "2rem" },
  tabs: { display: "flex", background: "#f5f5f5", borderRadius: "12px", padding: "4px", marginBottom: "1.5rem" },
  tab: { flex: 1, padding: "0.6rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "10px", fontWeight: "500", color: "#888", fontSize: "0.95rem" },
  activeTab: { background: "white", color: "#e91e8c", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  input: { width: "100%", padding: "0.9rem 1.2rem", borderRadius: "12px", border: "1.5px solid #eee", marginBottom: "1rem", fontSize: "0.95rem", outline: "none", display: "block" },
  error: { color: "#e91e8c", fontSize: "0.85rem", marginBottom: "1rem" },
  btn: { width: "100%", background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white", border: "none", padding: "1rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "600", cursor: "pointer", marginBottom: "1rem" },
  back: { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "0.9rem" },
};
