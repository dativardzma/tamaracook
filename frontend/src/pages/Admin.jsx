import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState("products");
  const [form, setForm] = useState({ name: "", price: "", emoji: "🍰" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadProducts = () =>
    fetch(`${BACKEND_URL}/api/admin/products`, { headers })
      .then(r => { if (r.status === 401 || r.status === 403) logout(); return r.json(); })
      .then(setProducts).catch(() => {});

  const loadOrders = () =>
    fetch(`${BACKEND_URL}/api/admin/orders`, { headers })
      .then(r => r.json()).then(setOrders).catch(() => {});

  useEffect(() => { loadProducts(); loadOrders(); }, []);

  const logout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const addProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`${BACKEND_URL}/api/admin/products`, {
      method: "POST", headers,
      body: JSON.stringify({ ...form, price: parseFloat(form.price), available: true }),
    });
    setForm({ name: "", price: "", emoji: "🍰" });
    setMsg("✅ Product added successfully!");
    setTimeout(() => setMsg(""), 3000);
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

  const navItems = [
    { id: "products", icon: "🍰", label: "Products" },
    { id: "add", icon: "➕", label: "Add Product" },
    { id: "orders", icon: "📋", label: "Orders" },
  ];

  return (
    <div style={s.layout}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarLogo}>🍰</div>
          <div style={s.sidebarTitle}>Sakonditro</div>
          <div style={s.sidebarSub}>Admin Panel</div>
        </div>
        <nav style={s.nav}>
          {navItems.map(item => (
            <button key={item.id} style={{ ...s.navItem, ...(page === item.id ? s.navActive : {}) }} onClick={() => setPage(item.id)}>
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={s.sidebarBottom}>
          <button style={s.shopLink} onClick={() => navigate("/")}>🏪 View Shop</button>
          <button style={s.logoutBtn} onClick={logout}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>{navItems.find(i => i.id === page)?.label}</h1>
            <p style={s.pageDesc}>{page === "products" ? `${products.length} products total` : page === "orders" ? `${orders.length} orders received` : "Add a new product to the shop"}</p>
          </div>
        </header>

        <div style={s.content}>
          {/* Add Product */}
          {page === "add" && (
            <div style={s.card}>
              <form onSubmit={addProduct}>
                <div style={s.formGrid}>
                  <div style={s.field}>
                    <label style={s.label}>Emoji</label>
                    <input style={s.input} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="🍰" />
                  </div>
                  <div style={{ ...s.field, gridColumn: "span 2" }}>
                    <label style={s.label}>Product Name</label>
                    <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chocolate Cake" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Price (₾)</label>
                    <input style={s.input} type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="25.00" required />
                  </div>
                </div>
                <div style={s.preview}>
                  <span style={s.previewEmoji}>{form.emoji}</span>
                  <div>
                    <p style={s.previewName}>{form.name || "Product name"}</p>
                    <p style={s.previewPrice}>₾{form.price || "0.00"}</p>
                  </div>
                </div>
                {msg && <p style={s.success}>{msg}</p>}
                <button style={s.addBtn} type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
              </form>
            </div>
          )}

          {/* Products list */}
          {page === "products" && (
            <div style={s.card}>
              {products.length === 0 ? <p style={s.empty}>No products yet. Add your first one!</p> : (
                <div style={s.productGrid}>
                  {products.map(p => (
                    <div key={p.id} style={{ ...s.productCard, opacity: p.available ? 1 : 0.5 }}>
                      <span style={s.productEmoji}>{p.emoji}</span>
                      <p style={s.productName}>{p.name}</p>
                      <p style={s.productPrice}>₾{Number(p.price).toFixed(2)}</p>
                      <span style={{ ...s.statusBadge, background: p.available ? "#e8f5e9", color: p.available ? "#2e7d32" : "#c62828", background: p.available ? "#e8f5e9" : "#fce4ec" }}>
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

          {/* Orders */}
          {page === "orders" && (
            <div style={s.card}>
              {orders.length === 0 ? <p style={s.empty}>No orders yet.</p> : (
                <div style={s.orderList}>
                  {orders.map(o => (
                    <div key={o.id} style={s.orderCard}>
                      <div style={s.orderHeader}>
                        <span style={s.orderId}>Order #{o.id}</span>
                        <span style={s.orderDate}>{new Date(o.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={s.orderCustomer}>👤 {o.customer_name} · 📞 {o.phone}</p>
                      <p style={s.orderItems}>{o.items}</p>
                      <p style={s.orderTotal}>Total: <strong>₾{Number(o.total).toFixed(2)}</strong></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  layout: { display: "flex", minHeight: "100vh", fontFamily: "'Poppins', sans-serif" },
  sidebar: { width: "240px", background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 },
  sidebarTop: { padding: "2rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "center" },
  sidebarLogo: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  sidebarTitle: { color: "white", fontWeight: "700", fontSize: "1.1rem" },
  sidebarSub: { color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginTop: "0.2rem" },
  nav: { flex: 1, padding: "1.5rem 1rem" },
  navItem: { display: "flex", alignItems: "center", gap: "0.8rem", width: "100%", padding: "0.8rem 1rem", background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: "12px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "500", marginBottom: "0.3rem", textAlign: "left" },
  navActive: { background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white" },
  navIcon: { fontSize: "1.1rem" },
  sidebarBottom: { padding: "1.5rem 1rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "0.5rem" },
  shopLink: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1rem", background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 1rem", background: "rgba(233,30,140,0.2)", border: "none", color: "#e91e8c", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500" },
  main: { flex: 1, marginLeft: "240px", background: "#f8f9fa", minHeight: "100vh" },
  topbar: { background: "white", padding: "1.5rem 2rem", borderBottom: "1px solid #f0f0f0" },
  pageTitle: { fontSize: "1.5rem", fontWeight: "700", color: "#1a1a2e" },
  pageDesc: { color: "#888", fontSize: "0.85rem", marginTop: "0.2rem" },
  content: { padding: "2rem" },
  card: { background: "white", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "1rem", marginBottom: "1.5rem" },
  field: { display: "flex", flexDirection: "column" },
  label: { fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem", fontWeight: "500" },
  input: { padding: "0.8rem 1rem", borderRadius: "10px", border: "1.5px solid #eee", fontSize: "0.95rem", outline: "none" },
  preview: { display: "flex", alignItems: "center", gap: "1rem", background: "#fff5f9", borderRadius: "12px", padding: "1rem 1.5rem", marginBottom: "1.5rem" },
  previewEmoji: { fontSize: "2.5rem" },
  previewName: { fontWeight: "600", color: "#1a1a2e" },
  previewPrice: { color: "#e91e8c", fontWeight: "700" },
  success: { color: "#4caf50", fontWeight: "500", marginBottom: "1rem" },
  addBtn: { background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white", border: "none", padding: "0.9rem 2.5rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" },
  productGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1.2rem" },
  productCard: { background: "#f8f9fa", borderRadius: "16px", padding: "1.5rem", textAlign: "center", border: "1px solid #f0f0f0" },
  productEmoji: { fontSize: "2.5rem", display: "block", marginBottom: "0.5rem" },
  productName: { fontWeight: "600", color: "#1a1a2e", fontSize: "0.95rem", marginBottom: "0.3rem" },
  productPrice: { color: "#e91e8c", fontWeight: "700", marginBottom: "0.8rem" },
  statusBadge: { display: "inline-block", padding: "0.2rem 0.8rem", borderRadius: "50px", fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.8rem" },
  productActions: { display: "flex", gap: "0.5rem", justifyContent: "center" },
  toggleBtn: { flex: 1, padding: "0.4rem", background: "#e3f2fd", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", color: "#1565c0", fontWeight: "500" },
  deleteBtn: { padding: "0.4rem 0.6rem", background: "#fce4ec", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" },
  orderList: { display: "flex", flexDirection: "column", gap: "1rem" },
  orderCard: { background: "#f8f9fa", borderRadius: "12px", padding: "1.2rem 1.5rem", border: "1px solid #f0f0f0" },
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" },
  orderId: { fontWeight: "700", color: "#e91e8c" },
  orderDate: { color: "#aaa", fontSize: "0.85rem" },
  orderCustomer: { color: "#555", fontSize: "0.9rem", marginBottom: "0.3rem" },
  orderItems: { color: "#333", fontSize: "0.9rem", marginBottom: "0.3rem" },
  orderTotal: { fontSize: "0.95rem", color: "#333" },
  empty: { color: "#aaa", textAlign: "center", padding: "3rem", fontSize: "0.95rem" },
};
