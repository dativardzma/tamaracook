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
      navigate("/admin");
    } catch { setError("Could not connect to server."); }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🍰</div>
        <h1 style={s.title}>Admin Portal</h1>
        <p style={s.sub}>Sakonditro Shop</p>

        <form onSubmit={handle}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="admin@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="••••••••"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
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
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #fff5f9, #fce4ec)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" },
  card: { background: "white", borderRadius: "24px", padding: "3rem", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(233,30,140,0.15)", textAlign: "center" },
  logo: { fontSize: "4rem", marginBottom: "1rem" },
  title: { fontSize: "1.8rem", fontWeight: "700", color: "#2d2d2d" },
  sub: { color: "#e91e8c", fontWeight: "500", marginBottom: "2rem" },
  label: { display: "block", textAlign: "left", fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem", fontWeight: "500" },
  input: { width: "100%", padding: "0.9rem 1.2rem", borderRadius: "12px", border: "1.5px solid #eee", marginBottom: "1.2rem", fontSize: "0.95rem", outline: "none", display: "block" },
  error: { color: "#e91e8c", fontSize: "0.85rem", marginBottom: "1rem", textAlign: "left" },
  btn: { width: "100%", background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white", border: "none", padding: "1rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "600", cursor: "pointer", marginBottom: "1rem" },
  back: { background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "0.9rem" },
};
