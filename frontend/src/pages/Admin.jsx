import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("products");
  const [form, setForm] = useState({ name: "", price: "", emoji: "🍰" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadProducts = () =>
    fetch(`${BACKEND_URL}/api/admin/products`, { headers })
      .then(r => { if (r.status === 401 || r.status === 403) { logout(); } return r.json(); })
      .then(setProducts);

  const loadOrders = () =>
    fetch(`${BACKEND_URL}/api/admin/orders`, { headers })
      .then(r => r.json())
      .then(setOrders);

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
    setMsg("Product added!");
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

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerContent}>
          <h1 style={s.title}>🍰 Admin Dashboard</h1>
          <div style={s.headerRight}>
            <button style={s.shopBtn} onClick={() => navigate("/")}>View Shop</button>
            <button style={s.logoutBtn} onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === "products" ? s.activeTab : {}) }} onClick={() => setTab("products")}>Products ({products.length})</button>
          <button style={{ ...s.tab, ...(tab === "orders" ? s.activeTab : {}) }} onClick={() => setTab("orders")}>Orders ({orders.length})</button>
          <button style={{ ...s.tab, ...(tab === "add" ? s.activeTab : {}) }} onClick={() => setTab("add")}>+ Add Product</button>
        </div>

        {tab === "add" && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Add New Product</h2>
            <form onSubmit={addProduct} style={s.form}>
              <div style={s.formRow}>
                <div style={s.field}>
                  <label style={s.label}>Emoji</label>
                  <input style={s.input} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="🍰" />
                </div>
                <div style={{ ...s.field, flex: 2 }}>
                  <label style={s.label}>Product Name</label>
                  <input style={s.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Chocolate Cake" required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Price (₾)</label>
                  <input style={s.input} type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="25.00" required />
                </div>
              </div>
              {msg && <p style={s.success}>{msg}</p>}
              <button style={s.addBtn} type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
            </form>
          </div>
        )}

        {tab === "products" && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>All Products</h2>
            <table style={s.table}>
              <thead>
                <tr>{["Emoji", "Name", "Price", "Status", "Actions"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={s.tr}>
                    <td style={s.td}>{p.emoji}</td>
                    <td style={s.td}>{p.name}</td>
                    <td style={s.td}>₾{Number(p.price).toFixed(2)}</td>
                    <td style={s.td}>
                      <span style={{ ...s.badge, background: p.available ? "#e8f5e9" : "#fce4ec", color: p.available ? "#2e7d32" : "#c62828" }}>
                        {p.available ? "Available" : "Hidden"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <button style={s.actionBtn} onClick={() => toggleAvailable(p)}>{p.available ? "Hide" : "Show"}</button>
                      <button style={{ ...s.actionBtn, ...s.deleteBtn }} onClick={() => deleteProduct(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "orders" && (
          <div style={s.card}>
            <h2 style={s.cardTitle}>Recent Orders</h2>
            {orders.length === 0 ? <p style={s.empty}>No orders yet</p> : (
              <table style={s.table}>
                <thead>
                  <tr>{["#", "Customer", "Phone", "Items", "Total", "Date"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={s.tr}>
                      <td style={s.td}>#{o.id}</td>
                      <td style={s.td}>{o.customer_name}</td>
                      <td style={s.td}>{o.phone}</td>
                      <td style={{ ...s.td, maxWidth: "200px", fontSize: "0.85rem" }}>{o.items}</td>
                      <td style={s.td}>₾{Number(o.total).toFixed(2)}</td>
                      <td style={s.td}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f8f9fa" },
  header: { background: "linear-gradient(135deg, #e91e8c, #c2185b)", padding: "0 2rem", boxShadow: "0 4px 20px rgba(233,30,140,0.3)" },
  headerContent: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem 0" },
  title: { color: "white", fontSize: "1.5rem", fontWeight: "700" },
  headerRight: { display: "flex", gap: "0.8rem" },
  shopBtn: { background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", color: "white", padding: "0.5rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontWeight: "500" },
  logoutBtn: { background: "rgba(255,255,255,0.9)", border: "none", color: "#e91e8c", padding: "0.5rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontWeight: "600" },
  main: { maxWidth: "1200px", margin: "0 auto", padding: "2rem" },
  tabs: { display: "flex", gap: "0.5rem", marginBottom: "1.5rem" },
  tab: { padding: "0.7rem 1.5rem", border: "none", background: "white", borderRadius: "50px", cursor: "pointer", fontWeight: "500", color: "#666", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  activeTab: { background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white" },
  card: { background: "white", borderRadius: "20px", padding: "2rem", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: "1.3rem", fontWeight: "600", color: "#2d2d2d", marginBottom: "1.5rem" },
  form: {},
  formRow: { display: "flex", gap: "1rem", marginBottom: "1rem" },
  field: { flex: 1, display: "flex", flexDirection: "column" },
  label: { fontSize: "0.85rem", color: "#666", marginBottom: "0.4rem", fontWeight: "500" },
  input: { padding: "0.8rem 1rem", borderRadius: "10px", border: "1.5px solid #eee", fontSize: "0.95rem", outline: "none" },
  success: { color: "#4caf50", fontWeight: "500", marginBottom: "0.5rem" },
  addBtn: { background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white", border: "none", padding: "0.9rem 2rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "0.8rem 1rem", color: "#666", fontSize: "0.85rem", fontWeight: "600", borderBottom: "2px solid #f0f0f0" },
  tr: { borderBottom: "1px solid #f8f8f8" },
  td: { padding: "0.9rem 1rem", fontSize: "0.95rem" },
  badge: { padding: "0.3rem 0.8rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "600" },
  actionBtn: { background: "#f0f0f0", border: "none", padding: "0.4rem 0.9rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", marginRight: "0.5rem", fontWeight: "500" },
  deleteBtn: { background: "#fce4ec", color: "#c62828" },
  empty: { color: "#aaa", textAlign: "center", padding: "3rem" },
};
