import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Invalid email or password"); setLoading(false); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email);
      localStorage.setItem("is_admin", data.is_admin ? "true" : "false");
      localStorage.setItem("is_delivery", data.is_delivery ? "true" : "false");
      if (data.is_admin) navigate("/admin");
      else if (data.is_delivery) navigate("/delivery");
      else navigate("/");
    } catch { setError("Could not connect to server."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(150deg, #1c0f18 0%, #38122a 45%, #2a0e20 75%, #1c0f18 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>

      {/* Background dot pattern */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

      {/* Ambient glows */}
      <div style={{ position: "absolute", width: "600px", height: "600px", top: "-200px", right: "-150px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,35,94,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: "400px", height: "400px", bottom: "-100px", left: "-100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(90,26,58,0.25) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Floating bakery emojis */}
      {["🍰", "🎂", "🥐", "🍫", "🧁", "🍪"].map((e, i) => (
        <div key={i} style={{ position: "absolute", fontSize: "1.8rem", opacity: 0.07, pointerEvents: "none", animation: `float ${3 + i * 0.5}s ease-in-out ${i * 0.4}s infinite alternate`, top: `${15 + i * 12}%`, left: i % 2 === 0 ? `${5 + i * 3}%` : `${85 - i * 2}%` }}>{e}</div>
      ))}

      {/* Card */}
      <div style={{ background: "rgba(255,255,255,0.97)", borderRadius: "28px", padding: "2.8rem 2.6rem", width: "100%", maxWidth: "420px", boxShadow: "0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)", position: "relative", zIndex: 1 }}>

        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: "2.2rem" }}>
          <div style={{ width: "70px", height: "70px", background: "linear-gradient(135deg, #1c0f18, #3a1430)", borderRadius: "22px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem", boxShadow: "0 8px 24px rgba(28,15,24,0.35)" }}>
            <span style={{ fontSize: "2rem" }}>🍰</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.65rem", fontWeight: "700", color: "#1c0f18", marginBottom: "0.2rem" }}>Staff Portal</h1>
          <p style={{ color: "#d4235e", fontWeight: "600", fontSize: "0.82rem", letterSpacing: "0.08em" }}>საკონდიტრო · Georgian Confectionery</p>
        </div>

        {/* Hint cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "1.8rem" }}>
          {[["⚙️", "Admin", "Full dashboard access"], ["🚚", "Delivery", "Order management"]].map(([icon, role, desc]) => (
            <div key={role} style={{ background: "#fdf0f5", border: "1px solid #f5dde8", borderRadius: "12px", padding: "0.75rem 0.9rem" }}>
              <div style={{ fontSize: "1rem", marginBottom: "0.3rem" }}>{icon}</div>
              <div style={{ fontWeight: "700", fontSize: "0.78rem", color: "#1c0f18" }}>{role}</div>
              <div style={{ color: "#8b6070", fontSize: "0.68rem", marginTop: "1px" }}>{desc}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handle}>
          <label style={{ display: "block", fontSize: "0.78rem", color: "#6b4c58", fontWeight: "600", marginBottom: "0.4rem" }}>Email Address</label>
          <input
            style={{ width: "100%", padding: "0.88rem 1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", marginBottom: "1rem", fontSize: "0.9rem", outline: "none", color: "#1c0f18", boxSizing: "border-box", background: "#fdfafa", transition: "border-color 0.15s" }}
            type="email" placeholder="staff@tamaracook.ink"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onFocus={e => e.target.style.borderColor = "#d4235e"}
            onBlur={e => e.target.style.borderColor = "#f0e4ea"}
            required
          />

          <label style={{ display: "block", fontSize: "0.78rem", color: "#6b4c58", fontWeight: "600", marginBottom: "0.4rem" }}>Password</label>
          <div style={{ position: "relative", marginBottom: error ? "0.7rem" : "1.4rem" }}>
            <input
              style={{ width: "100%", padding: "0.88rem 3rem 0.88rem 1rem", borderRadius: "12px", border: "1.5px solid #f0e4ea", fontSize: "0.9rem", outline: "none", color: "#1c0f18", boxSizing: "border-box", background: "#fdfafa", transition: "border-color 0.15s" }}
              type={showPass ? "text" : "password"} placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onFocus={e => e.target.style.borderColor = "#d4235e"}
              onBlur={e => e.target.style.borderColor = "#f0e4ea"}
              required
            />
            <button type="button"
              style={{ position: "absolute", right: "0.9rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#8b6070" }}
              onClick={() => setShowPass(!showPass)}
            >{showPass ? "🙈" : "👁️"}</button>
          </div>

          {error && (
            <div style={{ background: "#fce4ec", border: "1px solid #f5c4d0", color: "#c62828", borderRadius: "10px", padding: "0.65rem 1rem", fontSize: "0.82rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              ⚠️ {error}
            </div>
          )}

          <button
            style={{ width: "100%", background: loading ? "#8b6070" : "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", boxShadow: loading ? "none" : "0 6px 20px rgba(212,35,94,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            type="submit" disabled={loading}
          >
            {loading ? (
              <>
                <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.35)", borderTop: "2px solid white", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                Signing in…
              </>
            ) : "Sign In →"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.4rem" }}>
          <button style={{ background: "none", border: "none", color: "#8b6070", cursor: "pointer", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }} onClick={() => navigate("/")}>
            ← Back to Shop
          </button>
        </div>
      </div>
    </div>
  );
}
