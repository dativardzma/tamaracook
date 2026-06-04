import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Invalid email or password"); setLoading(false); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      navigate("/admin");
    } catch {
      setError("Could not connect to server.");
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <span style={s.logo}>🍰</span>
        </div>
        <h1 style={s.title}>Admin Portal</h1>
        <p style={s.sub}>საკონდიტრო</p>

        <form onSubmit={handle}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="admin@example.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          {error && <p style={s.error}>{error}</p>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button style={s.back} onClick={() => navigate("/")}>← Back to Shop</button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(145deg, #1c0f18 0%, #3a1430 55%, #6b1d40 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" },
  card: { background: "white", borderRadius: "28px", padding: "3rem", width: "100%", maxWidth: "420px", boxShadow: "0 40px 80px rgba(0,0,0,0.3)", textAlign: "center" },
  logoWrap: { background: "linear-gradient(135deg, #fff0f5, #ffd6e7)", width: "72px", height: "72px", borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" },
  logo: { fontSize: "2.2rem" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: "700", color: "#1c0f18", marginBottom: "0.25rem" },
  sub: { color: "#d4235e", fontWeight: "600", fontSize: "0.85rem", marginBottom: "2rem", letterSpacing: "0.05em" },
  label: { display: "block", textAlign: "left", fontSize: "0.8rem", color: "#8b6070", marginBottom: "0.4rem", fontWeight: "500" },
  input: { width: "100%", padding: "0.9rem 1.1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", marginBottom: "1.1rem", fontSize: "0.92rem", outline: "none", display: "block", boxSizing: "border-box", color: "#1c0f18" },
  error: { color: "#d4235e", fontSize: "0.82rem", marginBottom: "1rem", textAlign: "left" },
  btn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer", marginBottom: "1.2rem" },
  back: { background: "none", border: "none", color: "#8b6070", cursor: "pointer", fontSize: "0.85rem" },
};
