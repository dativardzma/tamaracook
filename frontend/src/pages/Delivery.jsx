import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS = {
  pending:          { label: "Pending",          bg: "rgba(255,152,0,0.12)",  color: "#ff9800", dot: "#ff9800",  border: "rgba(255,152,0,0.3)"  },
  confirmed:        { label: "Ready to Pick Up", bg: "rgba(33,150,243,0.12)", color: "#2196f3", dot: "#2196f3",  border: "rgba(33,150,243,0.3)" },
  out_for_delivery: { label: "On My Way",        bg: "rgba(156,39,176,0.12)", color: "#9c27b0", dot: "#9c27b0",  border: "rgba(156,39,176,0.3)" },
  delivered:        { label: "Delivered",        bg: "rgba(76,175,80,0.12)",  color: "#4caf50", dot: "#4caf50",  border: "rgba(76,175,80,0.3)"  },
};

function timeLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function Delivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [filter, setFilter] = useState("active");
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const driverEmail = localStorage.getItem("email");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = () => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/delivery/orders`, { headers })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { setAccessDenied(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setOrders(Array.isArray(data) ? data : []); setLoading(false); } })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    await fetch(`${BACKEND_URL}/api/delivery/orders/${id}/status`, {
      method: "PUT", headers, body: JSON.stringify({ status }),
    });
    await load();
    setUpdating(null);
  };

  const logout = () => {
    ["token", "email", "is_admin", "is_delivery"].forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  const active = orders.filter((o) => ["confirmed", "out_for_delivery"].includes(o.status));
  const completed = orders.filter((o) => o.status === "delivered");
  const displayed = filter === "active" ? active : completed;
  const readyCount = active.filter(o => o.status === "confirmed").length;

  if (accessDenied) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1c0f18, #2e1226)", fontFamily: "'Inter', sans-serif", padding: "2rem" }}>
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", padding: "3rem", borderRadius: "28px", maxWidth: "380px", width: "100%" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔒</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.6rem" }}>Access Denied</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem", fontSize: "0.9rem", lineHeight: 1.6 }}>This account doesn't have delivery staff access.</p>
          <button onClick={() => navigate("/login")} style={{ display: "block", width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.9rem", borderRadius: "14px", cursor: "pointer", fontWeight: "700", fontSize: "0.92rem", marginBottom: "0.7rem" }}>Sign in with another account</button>
          <button onClick={() => navigate("/")} style={{ display: "block", width: "100%", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)", border: "none", padding: "0.9rem", borderRadius: "14px", cursor: "pointer", fontWeight: "500", fontSize: "0.88rem" }}>← Back to Shop</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: "260px", background: "linear-gradient(180deg, #1c0f18 0%, #2a1020 50%, #1c0f18 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40, borderRight: "1px solid rgba(212,35,94,0.15)" }}>

        {/* Brand */}
        <div style={{ padding: "1.8rem 1.5rem 1.4rem", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", background: "rgba(212,35,94,0.2)", border: "1px solid rgba(212,35,94,0.35)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", margin: "0 auto 0.8rem" }}>🚚</div>
          <div style={{ color: "white", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "0.95rem", marginBottom: "2px" }}>Delivery Panel</div>
          <div style={{ color: "rgba(212,35,94,0.6)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>საკონდიტრო Staff</div>
        </div>

        {/* Driver info */}
        {driverEmail && (
          <div style={{ margin: "1rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "0.9rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.9rem", flexShrink: 0 }}>
                {driverEmail[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", fontWeight: "600" }}>{driverEmail.split("@")[0]}</div>
                <div style={{ color: "rgba(212,35,94,0.7)", fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>Delivery Staff</div>
              </div>
            </div>
          </div>
        )}

        {/* Live counter */}
        {readyCount > 0 && (
          <div style={{ margin: "0 1rem", background: "rgba(212,35,94,0.12)", border: "1px solid rgba(212,35,94,0.3)", borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#d4235e", animation: "spin 1s linear infinite", flexShrink: 0 }} />
            <span style={{ color: "#f4a3b8", fontSize: "0.78rem", fontWeight: "600" }}>{readyCount} order{readyCount !== 1 ? "s" : ""} ready to pick up</span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.8rem" }}>
          {[
            ["active", "📦", "Active Orders", active.length],
            ["done", "✅", "Completed", completed.length],
          ].map(([key, icon, label, count]) => (
            <button key={key}
              style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%", padding: "0.8rem 1rem", background: filter === key ? "linear-gradient(135deg, #d4235e, #a01848)" : "transparent", border: "none", color: filter === key ? "white" : "rgba(255,255,255,0.45)", borderRadius: "12px", cursor: "pointer", fontSize: "0.86rem", fontWeight: filter === key ? "600" : "500", marginBottom: "0.2rem", textAlign: "left", transition: "all 0.15s" }}
              onClick={() => setFilter(key)}
            >
              <span style={{ fontSize: "1rem" }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {count > 0 && (
                <span style={{ background: filter === key ? "rgba(255,255,255,0.25)" : "rgba(212,35,94,0.2)", color: filter === key ? "white" : "#d4235e", borderRadius: "50px", fontSize: "0.65rem", fontWeight: "800", padding: "1px 7px", minWidth: "20px", textAlign: "center" }}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "1rem 0.8rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1rem", background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.55)", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem" }} onClick={() => navigate("/")}>🏪 View Shop</button>
          <button style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1rem", background: "rgba(212,35,94,0.1)", border: "none", color: "#e87da0", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem" }} onClick={logout}>🚪 Sign Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, marginLeft: "260px", background: "#0f0810", minHeight: "100vh" }}>

        {/* Topbar */}
        <header style={{ background: "rgba(28,15,24,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(212,35,94,0.12)", padding: "1.2rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 30 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: "700", color: "white" }}>
              {filter === "active" ? "Active Orders" : "Completed Deliveries"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", marginTop: "2px" }}>
              {displayed.length} order{displayed.length !== 1 ? "s" : ""}
              {filter === "active" && active.length > 0 && ` · ${readyCount} ready to pick up`}
            </p>
          </div>
          <button
            style={{ background: "rgba(212,35,94,0.12)", border: "1px solid rgba(212,35,94,0.25)", color: "#e87da0", padding: "0.5rem 1.1rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "500", display: "flex", alignItems: "center", gap: "0.4rem" }}
            onClick={load}
          >↻ Refresh</button>
        </header>

        <div style={{ padding: "2rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid rgba(212,35,94,0.2)", borderTop: "3px solid #d4235e", borderRadius: "50%", margin: "0 auto 1.5rem", animation: "spin 0.8s linear infinite" }} />
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>Loading orders…</p>
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1.2rem" }}>{filter === "active" ? "📭" : "🏆"}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.5rem" }}>
                {filter === "active" ? "No active orders" : "No deliveries yet"}
              </h3>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "1.8rem" }}>
                {filter === "active" ? "Refresh when new confirmed orders come in" : "Completed deliveries will appear here"}
              </p>
              <button onClick={load} style={{ background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.75rem 1.8rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600" }}>↻ Check for Orders</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.2rem" }}>
              {displayed.map((o) => {
                const st = STATUS[o.status] || STATUS.pending;
                const isPickup = o.order_type === "pickup";
                const isUpdating = updating === o.id;

                return (
                  <div key={o.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${st.border}`, borderLeft: `4px solid ${st.dot}`, borderRadius: "20px", padding: "1.5rem", backdropFilter: "blur(8px)", transition: "transform 0.2s", position: "relative", overflow: "hidden" }}>
                    {/* Subtle glow */}
                    <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "140px", height: "140px", borderRadius: "50%", background: `radial-gradient(circle, ${st.dot}18 0%, transparent 70%)`, pointerEvents: "none" }} />

                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: st.dot, boxShadow: `0 0 8px ${st.dot}` }} />
                        <span style={{ color: "white", fontWeight: "700", fontSize: "0.92rem" }}>Order #{o.id}</span>
                        {o.order_code && (
                          <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontFamily: "monospace", fontSize: "0.68rem", fontWeight: "700", padding: "0.18rem 0.6rem", borderRadius: "6px", letterSpacing: "0.08em" }}>{o.order_code}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem" }}>
                        <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, padding: "0.22rem 0.75rem", borderRadius: "50px", fontSize: "0.7rem", fontWeight: "700" }}>{st.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.68rem" }}>{timeLabel(o.created_at)}</span>
                      </div>
                    </div>

                    {/* Type badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: isPickup ? "rgba(255,152,0,0.1)" : "rgba(33,150,243,0.1)", color: isPickup ? "#ff9800" : "#2196f3", border: `1px solid ${isPickup ? "rgba(255,152,0,0.25)" : "rgba(33,150,243,0.25)"}`, fontSize: "0.7rem", fontWeight: "600", padding: "0.2rem 0.7rem", borderRadius: "50px", marginBottom: "1rem" }}>
                      {isPickup ? "🏠 Pickup" : "🚚 Delivery"}
                    </div>

                    {/* Customer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "0.7rem 0.9rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(212,35,94,0.2)", color: "#f4a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.8rem" }}>
                          {o.customer_name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ color: "white", fontWeight: "600", fontSize: "0.9rem" }}>{o.customer_name}</span>
                      </div>
                      <a href={`tel:${o.phone}`} style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(33,150,243,0.15)", color: "#64b5f6", fontWeight: "600", fontSize: "0.8rem", padding: "0.35rem 0.8rem", borderRadius: "50px", textDecoration: "none", border: "1px solid rgba(33,150,243,0.25)" }}>
                        📞 {o.phone}
                      </a>
                    </div>

                    {/* Address */}
                    {o.address && (
                      <div style={{ display: "flex", gap: "0.6rem", background: "rgba(212,35,94,0.06)", border: "1px solid rgba(212,35,94,0.15)", borderRadius: "12px", padding: "0.75rem 0.9rem", marginBottom: "0.9rem" }}>
                        <span style={{ flexShrink: 0 }}>📍</span>
                        <div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.58rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>Delivery Address</div>
                          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: "500" }}>{o.address}</div>
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "0.7rem 0.9rem", marginBottom: "1rem" }}>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.58rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>Order Items</div>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.83rem", lineHeight: 1.5 }}>{o.items}</p>
                    </div>

                    {/* Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>Total</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", color: "#d4235e", fontWeight: "800", fontSize: "1.3rem" }}>₾{Number(o.total).toFixed(2)}</div>
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.78rem" }}>
                        {new Date(o.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>

                    {/* Action buttons */}
                    {o.status === "confirmed" && (
                      <button
                        style={{ width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.9rem", borderRadius: "14px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", opacity: isUpdating ? 0.7 : 1, letterSpacing: "0.01em" }}
                        disabled={isUpdating}
                        onClick={() => updateStatus(o.id, "out_for_delivery")}
                      >
                        {isUpdating ? "Updating…" : "🚚 I Picked It Up — On My Way"}
                      </button>
                    )}
                    {o.status === "out_for_delivery" && (
                      <button
                        style={{ width: "100%", background: "linear-gradient(135deg, #2e7d32, #1b5e20)", color: "white", border: "none", padding: "0.9rem", borderRadius: "14px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer", opacity: isUpdating ? 0.7 : 1, boxShadow: "0 4px 20px rgba(46,125,50,0.4)" }}
                        disabled={isUpdating}
                        onClick={() => updateStatus(o.id, "delivered")}
                      >
                        {isUpdating ? "Updating…" : "✅ Mark as Delivered"}
                      </button>
                    )}
                    {o.status === "delivered" && (
                      <div style={{ textAlign: "center", color: "#4caf50", fontSize: "0.85rem", fontWeight: "600", padding: "0.6rem" }}>✓ Delivered successfully</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
