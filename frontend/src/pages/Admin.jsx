import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS_COLORS = {
  pending:          { bg: "#fff8e1", color: "#e65100", label: "Pending" },
  confirmed:        { bg: "#e3f2fd", color: "#1565c0", label: "Confirmed" },
  out_for_delivery: { bg: "#f3e5f5", color: "#6a1b9a", label: "Out for Delivery" },
  delivered:        { bg: "#e8f5e9", color: "#2e7d32", label: "Delivered" },
  ready:            { bg: "#fce4ec", color: "#c62828", label: "Ready for Pickup" },
};

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [team, setTeam] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [productForm, setProductForm] = useState({ name: "", price: "", emoji: "🍰" });
  const [teamForm, setTeamForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "success" });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const flash = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg({ text: "", type: "success" }), 3000); };

  const loadProducts = () =>
    fetch(`${BACKEND_URL}/api/admin/products`, { headers })
      .then((r) => { if (r.status === 401 || r.status === 403) logout(); return r.json(); })
      .then(setProducts).catch(() => {});

  const loadOrders = () =>
    fetch(`${BACKEND_URL}/api/admin/orders`, { headers })
      .then((r) => r.json()).then(setOrders).catch(() => {});

  const loadTeam = () =>
    fetch(`${BACKEND_URL}/api/admin/team`, { headers })
      .then((r) => r.json()).then(setTeam).catch(() => {});

  useEffect(() => { loadProducts(); loadOrders(); }, []);
  useEffect(() => { if (page === "team") loadTeam(); }, [page]);

  const logout = () => {
    ["token", "email", "is_admin", "is_delivery"].forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`${BACKEND_URL}/api/admin/products`, {
      method: "POST", headers,
      body: JSON.stringify({ ...productForm, price: parseFloat(productForm.price), available: true }),
    });
    setProductForm({ name: "", price: "", emoji: "🍰" });
    flash("✅ Product added!");
    loadProducts();
    setLoading(false);
  };

  const toggleAvailable = async (product) => {
    await fetch(`${BACKEND_URL}/api/admin/products/${product.id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ available: !product.available }),
    });
    loadProducts();
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`${BACKEND_URL}/api/admin/products/${id}`, { method: "DELETE", headers });
    loadProducts();
  };

  const updateOrderStatus = async (id, status) => {
    await fetch(`${BACKEND_URL}/api/admin/orders/${id}/status`, {
      method: "PUT", headers,
      body: JSON.stringify({ status }),
    });
    loadOrders();
  };

  const addDelivery = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/auth/delivery/signup`, {
      method: "POST", headers,
      body: JSON.stringify(teamForm),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.detail || "Error creating account", "error"); }
    else { flash("✅ Delivery account created!"); setTeamForm({ email: "", password: "" }); loadTeam(); }
    setLoading(false);
  };

  const nav = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "orders",    icon: "📋", label: "Orders" },
    { id: "products",  icon: "🍰", label: "Products" },
    { id: "add",       icon: "➕", label: "Add Product" },
    { id: "team",      icon: "👥", label: "Delivery Team" },
  ];

  // Stats
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeProducts = products.filter((p) => p.available).length;
  const inTransit = orders.filter((o) => o.status === "out_for_delivery").length;

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarIcon}>🍰</div>
          <div style={s.sidebarTitle}>Sakonditro</div>
          <div style={s.sidebarSub}>Admin Panel</div>
        </div>

        <nav style={s.nav}>
          {nav.map((item) => (
            <button key={item.id} style={{ ...s.navBtn, ...(page === item.id ? s.navActive : {}) }} onClick={() => setPage(item.id)}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "orders" && pendingOrders > 0 && (
                <span style={s.navBadge}>{pendingOrders}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <button style={s.shopBtn} onClick={() => navigate("/")}>🏪 View Shop</button>
          <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>{nav.find((i) => i.id === page)?.label}</h1>
            <p style={s.pageDesc}>
              {page === "dashboard" && `${orders.length} orders total · ₾${totalRevenue.toFixed(0)} revenue`}
              {page === "products" && `${products.length} products · ${activeProducts} active`}
              {page === "orders" && `${orders.length} orders · ${pendingOrders} pending`}
              {page === "team" && `${team.length} delivery staff`}
              {page === "add" && "Fill in the details below"}
            </p>
          </div>
          {msg.text && <div style={{ ...s.flash, background: msg.type === "error" ? "#fce4ec" : "#e8f5e9", color: msg.type === "error" ? "#c62828" : "#2e7d32" }}>{msg.text}</div>}
        </header>

        <div style={s.content}>

          {/* ── Dashboard ── */}
          {page === "dashboard" && (
            <div>
              <div style={s.statsGrid}>
                {[
                  { label: "Total Orders", value: orders.length, icon: "📋", sub: "all time" },
                  { label: "Pending", value: pendingOrders, icon: "⏳", sub: "need action", highlight: pendingOrders > 0 },
                  { label: "In Transit", value: inTransit, icon: "🚚", sub: "out for delivery" },
                  { label: "Revenue", value: `₾${totalRevenue.toFixed(0)}`, icon: "💰", sub: "total" },
                  { label: "Products", value: activeProducts, icon: "🍰", sub: "active" },
                ].map((stat) => (
                  <div key={stat.label} style={{ ...s.statCard, ...(stat.highlight ? s.statCardHighlight : {}) }}>
                    <div style={s.statIcon}>{stat.icon}</div>
                    <div style={s.statValue}>{stat.value}</div>
                    <div style={s.statLabel}>{stat.label}</div>
                    <div style={s.statSub}>{stat.sub}</div>
                  </div>
                ))}
              </div>

              <h2 style={s.sectionHeading}>Recent Orders</h2>
              <div style={s.card}>
                {orders.slice(0, 8).map((o) => {
                  const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                  return (
                    <div key={o.id} style={s.dashOrderRow}>
                      <div style={s.dashOrderLeft}>
                        <span style={s.dashOrderId}>#{o.id}</span>
                        <div>
                          <p style={s.dashOrderName}>{o.customer_name}</p>
                          <p style={s.dashOrderItems}>{o.items}</p>
                        </div>
                      </div>
                      <div style={s.dashOrderRight}>
                        <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{sc.label}</span>
                        <span style={s.dashOrderTotal}>₾{Number(o.total).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
                {orders.length === 0 && <p style={s.empty}>No orders yet.</p>}
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {page === "orders" && (
            <div style={s.card}>
              {orders.length === 0 ? <p style={s.empty}>No orders yet.</p> : (
                <div style={s.orderList}>
                  {orders.map((o) => {
                    const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                    return (
                      <div key={o.id} style={s.orderCard}>
                        <div style={s.orderCardHeader}>
                          <div style={s.orderCardLeft}>
                            <span style={s.orderId}>Order #{o.id}</span>
                            <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{sc.label}</span>
                            <span style={s.orderTypeBadge}>{o.order_type === "pickup" ? "🏠 Pickup" : "🚚 Delivery"}</span>
                          </div>
                          <span style={s.orderDate}>{new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p style={s.orderCustomer}>👤 {o.customer_name} · 📞 {o.phone}{o.address ? ` · 📍 ${o.address}` : ""}</p>
                        <p style={s.orderItems}>{o.items}</p>
                        <div style={s.orderCardFooter}>
                          <span style={s.orderTotal}>₾{Number(o.total).toFixed(2)}</span>
                          <select value={o.status || "pending"} style={s.statusSelect}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}>
                            {Object.entries(STATUS_COLORS).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Products ── */}
          {page === "products" && (
            <div style={s.card}>
              {products.length === 0 ? <p style={s.empty}>No products yet. Add your first one!</p> : (
                <div style={s.productGrid}>
                  {products.map((p) => (
                    <div key={p.id} style={{ ...s.productCard, opacity: p.available ? 1 : 0.5 }}>
                      <div style={s.productEmojiWrap}>{p.emoji}</div>
                      <p style={s.productName}>{p.name}</p>
                      <p style={s.productPrice}>₾{Number(p.price).toFixed(2)}</p>
                      <span style={{ ...s.badge, background: p.available ? "#e8f5e9" : "#fce4ec", color: p.available ? "#2e7d32" : "#c62828", marginBottom: "0.8rem", display: "inline-block" }}>
                        {p.available ? "Available" : "Hidden"}
                      </span>
                      <div style={s.productActions}>
                        <button style={s.toggleBtn} onClick={() => toggleAvailable(p)}>{p.available ? "Hide" : "Show"}</button>
                        <button style={s.deleteBtn} onClick={() => deleteProduct(p.id)}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Add Product ── */}
          {page === "add" && (
            <div style={s.card}>
              <form onSubmit={addProduct}>
                <div style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Emoji</label>
                    <input style={s.input} value={productForm.emoji} onChange={(e) => setProductForm({ ...productForm, emoji: e.target.value })} placeholder="🍰" />
                  </div>
                  <div style={{ ...s.field, gridColumn: "span 2" }}>
                    <label style={s.label}>Product Name</label>
                    <input style={s.input} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Chocolate Cake" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Price (₾)</label>
                    <input style={s.input} type="number" step="0.01" min="0" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="25.00" required />
                  </div>
                </div>
                <div style={s.preview}>
                  <span style={s.previewEmoji}>{productForm.emoji}</span>
                  <div>
                    <p style={s.previewName}>{productForm.name || "Product name"}</p>
                    <p style={s.previewPrice}>₾{productForm.price || "0.00"}</p>
                  </div>
                </div>
                <button style={s.addBtn} type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
              </form>
            </div>
          )}

          {/* ── Team ── */}
          {page === "team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Add Delivery Person</h3>
                <p style={s.cardSub}>They'll log in at /login and be redirected to the delivery panel.</p>
                <form onSubmit={addDelivery} style={s.teamForm}>
                  <input style={s.input} type="email" placeholder="Email address" value={teamForm.email}
                    onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} required />
                  <input style={s.input} type="password" placeholder="Password" value={teamForm.password}
                    onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })} required />
                  <button style={s.addBtn} type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
                </form>
              </div>

              <div style={s.card}>
                <h3 style={s.cardTitle}>Delivery Team ({team.length})</h3>
                {team.length === 0 ? (
                  <p style={s.empty}>No delivery staff yet. Add someone above.</p>
                ) : (
                  <div style={s.teamList}>
                    {team.map((u) => (
                      <div key={u.id} style={s.teamRow}>
                        <div style={s.teamAvatar}>{u.email[0].toUpperCase()}</div>
                        <div>
                          <p style={s.teamEmail}>{u.email}</p>
                          <p style={s.teamDate}>Added {new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                        <span style={{ ...s.badge, background: "#e3f2fd", color: "#1565c0" }}>🚚 Delivery</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  layout: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },

  sidebar: { width: "240px", background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 },
  sidebarTop: { padding: "2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", textAlign: "center" },
  sidebarIcon: { fontSize: "2.2rem", marginBottom: "0.4rem" },
  sidebarTitle: { color: "white", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.1rem" },
  sidebarSub: { color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "2px" },
  nav: { flex: 1, padding: "1.5rem 1rem" },
  navBtn: { display: "flex", alignItems: "center", gap: "0.7rem", width: "100%", padding: "0.8rem 1rem", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "500", marginBottom: "0.3rem", textAlign: "left", position: "relative" },
  navActive: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white" },
  navBadge: { marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: "50%", fontSize: "0.68rem", fontWeight: "700", padding: "1px 6px", minWidth: "18px", textAlign: "center" },
  sidebarBottom: { padding: "1.5rem 1rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "0.5rem" },
  shopBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1rem", background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.65)", borderRadius: "10px", cursor: "pointer", fontSize: "0.83rem" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1rem", background: "rgba(212,35,94,0.18)", border: "none", color: "#e87da0", borderRadius: "10px", cursor: "pointer", fontSize: "0.83rem" },

  main: { flex: 1, marginLeft: "240px", background: "#f8f5f9", minHeight: "100vh" },
  topbar: { background: "white", padding: "1.4rem 2rem", borderBottom: "1px solid #f0eaf4", display: "flex", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.45rem", fontWeight: "700", color: "#1c0f18" },
  pageDesc: { color: "#8b6070", fontSize: "0.8rem", marginTop: "0.2rem" },
  flash: { padding: "0.5rem 1.2rem", borderRadius: "50px", fontSize: "0.85rem", fontWeight: "600" },
  content: { padding: "2rem" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  statCard: { background: "white", borderRadius: "16px", padding: "1.4rem 1.2rem", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #f0eaf4" },
  statCardHighlight: { background: "linear-gradient(135deg, #fff5f9, #fce4ef)", border: "1px solid #f5c4d8" },
  statIcon: { fontSize: "1.6rem", marginBottom: "0.5rem" },
  statValue: { fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: "700", color: "#1c0f18", lineHeight: 1 },
  statLabel: { fontSize: "0.8rem", fontWeight: "600", color: "#1c0f18", marginTop: "0.4rem" },
  statSub: { fontSize: "0.72rem", color: "#8b6070", marginTop: "0.2rem" },

  sectionHeading: { fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c0f18", fontWeight: "700", marginBottom: "1rem" },
  card: { background: "white", borderRadius: "20px", padding: "1.8rem", boxShadow: "0 2px 16px rgba(0,0,0,0.05)", border: "1px solid #f0eaf4" },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", color: "#1c0f18", fontWeight: "700", marginBottom: "0.3rem" },
  cardSub: { color: "#8b6070", fontSize: "0.82rem", marginBottom: "1.2rem" },

  dashOrderRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.9rem 0", borderBottom: "1px solid #faf3f7" },
  dashOrderLeft: { display: "flex", alignItems: "flex-start", gap: "0.8rem" },
  dashOrderId: { background: "#f5eef2", color: "#8b6070", borderRadius: "8px", padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: "700", flexShrink: 0, marginTop: "2px" },
  dashOrderName: { fontWeight: "600", color: "#1c0f18", fontSize: "0.88rem", marginBottom: "0.1rem" },
  dashOrderItems: { color: "#8b6070", fontSize: "0.78rem" },
  dashOrderRight: { display: "flex", alignItems: "center", gap: "0.8rem", flexShrink: 0 },
  dashOrderTotal: { fontWeight: "700", color: "#1c0f18", fontSize: "0.9rem" },

  orderList: { display: "flex", flexDirection: "column", gap: "1rem" },
  orderCard: { background: "#fdf8fb", borderRadius: "14px", padding: "1.2rem 1.4rem", border: "1px solid #f0eaf4" },
  orderCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.4rem" },
  orderCardLeft: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" },
  orderId: { fontWeight: "700", color: "#1c0f18", fontSize: "0.88rem" },
  orderTypeBadge: { background: "#f0f4f8", color: "#475569", padding: "0.15rem 0.6rem", borderRadius: "50px", fontSize: "0.72rem", fontWeight: "600" },
  orderDate: { color: "#8b6070", fontSize: "0.78rem" },
  orderCustomer: { color: "#6b4c58", fontSize: "0.82rem", marginBottom: "0.3rem" },
  orderItems: { color: "#333", fontSize: "0.85rem", marginBottom: "0.6rem" },
  orderCardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderTotal: { fontWeight: "700", color: "#1c0f18", fontSize: "0.95rem" },
  statusSelect: { fontSize: "0.8rem", padding: "0.3rem 0.6rem", borderRadius: "8px", border: "1.5px solid #eee", cursor: "pointer", outline: "none" },

  badge: { padding: "0.2rem 0.75rem", borderRadius: "50px", fontSize: "0.72rem", fontWeight: "600" },

  productGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: "1.2rem" },
  productCard: { background: "#f8f5f9", borderRadius: "16px", padding: "1.4rem", textAlign: "center", border: "1px solid #f0eaf4" },
  productEmojiWrap: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  productName: { fontWeight: "600", color: "#1c0f18", fontSize: "0.9rem", marginBottom: "0.3rem" },
  productPrice: { color: "#d4235e", fontWeight: "700", marginBottom: "0.6rem" },
  productActions: { display: "flex", gap: "0.5rem", justifyContent: "center" },
  toggleBtn: { flex: 1, padding: "0.4rem", background: "#e3f2fd", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", color: "#1565c0", fontWeight: "500" },
  deleteBtn: { padding: "0.4rem 0.6rem", background: "#fce4ec", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "1rem", marginBottom: "1.5rem" },
  field: { display: "flex", flexDirection: "column" },
  label: { fontSize: "0.82rem", color: "#8b6070", marginBottom: "0.4rem", fontWeight: "500" },
  input: { padding: "0.8rem 1rem", borderRadius: "10px", border: "1.5px solid #f0eaf4", fontSize: "0.92rem", outline: "none", color: "#1c0f18", marginBottom: "0.8rem" },
  preview: { display: "flex", alignItems: "center", gap: "1rem", background: "#fff5f9", borderRadius: "12px", padding: "1rem 1.5rem", marginBottom: "1.5rem" },
  previewEmoji: { fontSize: "2.5rem" },
  previewName: { fontWeight: "600", color: "#1c0f18" },
  previewPrice: { color: "#d4235e", fontWeight: "700" },
  addBtn: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.85rem 2.5rem", borderRadius: "12px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer" },

  teamForm: { display: "flex", flexDirection: "column" },
  teamList: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  teamRow: { display: "flex", alignItems: "center", gap: "1rem", padding: "0.8rem", background: "#fdf8fb", borderRadius: "12px", border: "1px solid #f0eaf4" },
  teamAvatar: { width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.95rem", flexShrink: 0 },
  teamEmail: { fontWeight: "600", color: "#1c0f18", fontSize: "0.88rem" },
  teamDate: { color: "#8b6070", fontSize: "0.75rem" },
  empty: { color: "#8b6070", textAlign: "center", padding: "2.5rem", fontSize: "0.9rem" },
};
