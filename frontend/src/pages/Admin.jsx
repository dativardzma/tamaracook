import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const STATUS_COLORS = {
  pending:          { bg: "#fff8e1", color: "#e65100", label: "Pending" },
  confirmed:        { bg: "#e3f2fd", color: "#1565c0", label: "Confirmed" },
  out_for_delivery: { bg: "#f3e5f5", color: "#6a1b9a", label: "Out for Delivery" },
  delivered:        { bg: "#e8f5e9", color: "#2e7d32", label: "Delivered" },
  ready:            { bg: "#fce4ec", color: "#c62828", label: "Ready for Pickup" },
  cancelled:        { bg: "#f5f5f5", color: "#616161", label: "Cancelled" },
};

const EMOJIS = ["🍰", "🎂", "🥐", "🍫", "🍩", "🧁", "🥧", "🍮", "🍪", "🥮", "🍭", "🧇"];

// Compress image to max 900px wide, 0.82 quality JPEG via Canvas API
async function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 900;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const r = Math.min(MAX / width, MAX / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, "image/jpeg", 0.82);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [team, setTeam] = useState([]);
  const [page, setPage] = useState("dashboard");
  const [productForm, setProductForm] = useState({ name: "", price: "", emoji: "🍰", description: "", sale_price: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [teamForm, setTeamForm] = useState({ email: "", password: "" });
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("shop_settings") || "{}"); } catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "success" });
  const uploadInputRefs = useRef({});
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const adminEmail = localStorage.getItem("email");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const authHeader = { Authorization: `Bearer ${token}` };

  const flash = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "success" }), 3500);
  };

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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`${BACKEND_URL}/api/admin/products`, {
      method: "POST", headers,
      body: JSON.stringify({ ...productForm, price: parseFloat(productForm.price), sale_price: productForm.sale_price ? parseFloat(productForm.sale_price) : null, available: true }),
    });
    const data = await res.json();

    if (imageFile && data.id) {
      const compressed = await compressImage(imageFile);
      const fd = new FormData();
      fd.append("file", compressed, "photo.jpg");
      await fetch(`${BACKEND_URL}/api/admin/products/${data.id}/image`, {
        method: "POST",
        headers: authHeader,
        body: fd,
      });
    }

    setProductForm({ name: "", price: "", emoji: "🍰", description: "", sale_price: "" });
    setImageFile(null);
    setImagePreview(null);
    flash("Product added successfully!");
    loadProducts();
    setLoading(false);
  };

  const uploadProductImage = async (productId, file) => {
    if (!file) return;
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append("file", compressed, "photo.jpg");
    await fetch(`${BACKEND_URL}/api/admin/products/${productId}/image`, {
      method: "POST",
      headers: authHeader,
      body: fd,
    });
    flash("Photo uploaded!");
    loadProducts();
  };

  const removeProductImage = async (productId) => {
    await fetch(`${BACKEND_URL}/api/admin/products/${productId}/image`, {
      method: "DELETE", headers,
    });
    flash("Photo removed.");
    loadProducts();
  };

  const toggleAvailable = async (product) => {
    await fetch(`${BACKEND_URL}/api/admin/products/${product.id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ available: !product.available }),
    });
    loadProducts();
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`${BACKEND_URL}/api/admin/products/${id}`, { method: "DELETE", headers });
    flash("Product removed.");
    loadProducts();
  };

  const updateOrderStatus = async (id, status) => {
    await fetch(`${BACKEND_URL}/api/admin/orders/${id}/status`, {
      method: "PUT", headers,
      body: JSON.stringify({ status }),
    });
    loadOrders();
  };

  const nextAction = (order) => {
    if (order.status === "pending") return { label: "✅ Confirm Order", next: "confirmed", color: "#16a34a" };
    if (order.status === "confirmed") return order.order_type === "pickup"
      ? { label: "🏠 Ready for Pickup", next: "ready", color: "#d4235e" }
      : { label: "🚚 Picked Up", next: "out_for_delivery", color: "#7c3aed" };
    if (order.status === "out_for_delivery") return { label: "📦 Mark Delivered", next: "delivered", color: "#059669" };
    if (order.status === "ready") return { label: "✓ Customer Collected", next: "delivered", color: "#059669" };
    return null;
  };

  const deleteOrder = async (id) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    await fetch(`${BACKEND_URL}/api/admin/orders/${id}`, { method: "DELETE", headers });
    flash("Order deleted.");
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
    if (!res.ok) flash(data.detail || "Error creating account", "error");
    else { flash("Delivery account created!"); setTeamForm({ email: "", password: "" }); loadTeam(); }
    setLoading(false);
  };

  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("shop_settings", JSON.stringify(settings));
    flash("Settings saved!");
  };

  const nav = [
    { id: "dashboard", icon: "📊", label: "Dashboard" },
    { id: "orders",    icon: "📋", label: "Orders" },
    { id: "products",  icon: "🍰", label: "Products" },
    { id: "add",       icon: "➕", label: "Add Product" },
    { id: "team",      icon: "👥", label: "Delivery Team" },
    { id: "settings",  icon: "⚙️", label: "Settings" },
  ];

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const confirmedOrders = orders.filter((o) => o.status === "confirmed").length;
  const inTransit = orders.filter((o) => o.status === "out_for_delivery").length;
  const activeProducts = products.filter((p) => p.available).length;

  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderFilter === "all" || o.status === orderFilter;
    const matchSearch = !orderSearch ||
      o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.phone?.includes(orderSearch) ||
      o.order_code?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={s.layout}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.sidebarLogo}>🍰</div>
          <div style={s.sidebarTitle}>საკონდიტრო</div>
          <div style={s.sidebarSub}>Admin Panel</div>
        </div>

        <nav style={s.nav}>
          {nav.map((item) => (
            <button
              key={item.id}
              style={{ ...s.navBtn, ...(page === item.id ? s.navActive : {}) }}
              onClick={() => setPage(item.id)}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "orders" && pendingOrders > 0 && (
                <span style={s.navBadge}>{pendingOrders}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.adminInfo}>
            <div style={s.adminAvatar}>{adminEmail?.[0]?.toUpperCase() || "A"}</div>
            <div>
              <div style={s.adminName}>{adminEmail?.split("@")[0]}</div>
              <div style={s.adminRole}>Administrator</div>
            </div>
          </div>
          <button style={s.shopBtn} onClick={() => navigate("/")}>🏪 View Shop</button>
          <button style={s.logoutBtn} onClick={logout}>🚪 Sign Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>{nav.find((i) => i.id === page)?.label}</h1>
            <p style={s.pageDesc}>
              {page === "dashboard" && `${orders.length} total orders · ₾${totalRevenue.toFixed(0)} revenue`}
              {page === "products" && `${products.length} products · ${activeProducts} active`}
              {page === "orders" && `${filteredOrders.length} of ${orders.length} orders shown`}
              {page === "team" && `${team.length} delivery staff`}
              {page === "add" && "Fill in the details to add a new item"}
              {page === "settings" && "Manage your shop configuration"}
            </p>
          </div>
          <div style={s.topbarRight}>
            {msg.text && (
              <div style={{ ...s.flash, background: msg.type === "error" ? "#fce4ec" : "#e8f5e9", color: msg.type === "error" ? "#c62828" : "#2e7d32" }}>
                {msg.type === "error" ? "⚠️" : "✅"} {msg.text}
              </div>
            )}
            {page === "orders" && (
              <button style={s.refreshBtn} onClick={loadOrders}>↻ Refresh</button>
            )}
          </div>
        </header>

        <div style={s.content}>

          {/* ── Dashboard ── */}
          {page === "dashboard" && (
            <div>
              <div style={s.statsGrid}>
                {[
                  { label: "Total Orders", value: orders.length, icon: "📋", sub: "all time", color: "#e3f2fd", accent: "#1565c0" },
                  { label: "Pending", value: pendingOrders, icon: "⏳", sub: "need action", color: "#fff8e1", accent: "#e65100", alert: pendingOrders > 0 },
                  { label: "Confirmed", value: confirmedOrders, icon: "✅", sub: "being prepared", color: "#e8f5e9", accent: "#2e7d32" },
                  { label: "In Transit", value: inTransit, icon: "🚚", sub: "out for delivery", color: "#f3e5f5", accent: "#6a1b9a" },
                  { label: "Revenue", value: `₾${totalRevenue.toFixed(0)}`, icon: "💰", sub: "total earned", color: "#fce4ec", accent: "#c62828" },
                  { label: "Active Items", value: activeProducts, icon: "🍰", sub: "on the menu", color: "#fff3e0", accent: "#e65100" },
                ].map((stat) => (
                  <div key={stat.label} style={{ ...s.statCard, background: stat.alert ? "linear-gradient(135deg, #fff5f9, #fce4ef)" : "white", border: stat.alert ? "1.5px solid #f5c4d8" : "1px solid #f0eaf4" }}>
                    <div style={{ ...s.statIconWrap, background: stat.color }}>
                      <span style={s.statIcon}>{stat.icon}</span>
                    </div>
                    <div>
                      <div style={{ ...s.statValue, color: stat.accent }}>{stat.value}</div>
                      <div style={s.statLabel}>{stat.label}</div>
                      <div style={s.statSub}>{stat.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={s.dashRow}>
                <div style={{ ...s.card, flex: 2 }}>
                  <div style={s.cardHeader}>
                    <h3 style={s.cardTitle}>Recent Orders</h3>
                    <button style={s.cardAction} onClick={() => setPage("orders")}>View all →</button>
                  </div>
                  {orders.length === 0 ? (
                    <p style={s.empty}>No orders yet. Share your menu!</p>
                  ) : (
                    orders.slice(0, 8).map((o) => {
                      const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                      return (
                        <div key={o.id} style={s.dashRow2}>
                          <span style={s.dashId}>#{o.id}</span>
                          <div style={{ flex: 1 }}>
                            <p style={s.dashName}>{o.customer_name}</p>
                            <p style={s.dashItems}>{o.items}</p>
                          </div>
                          <div style={s.dashRight}>
                            {o.order_code && <span style={s.orderCodeTag}>{o.order_code}</span>}
                            <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{sc.label}</span>
                            <span style={s.dashTotal}>₾{Number(o.total).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div style={{ ...s.card, flex: 1 }}>
                  <div style={s.cardHeader}>
                    <h3 style={s.cardTitle}>Menu Items</h3>
                    <button style={s.cardAction} onClick={() => setPage("products")}>Manage →</button>
                  </div>
                  {products.length === 0 ? (
                    <p style={s.empty}>No products yet.</p>
                  ) : (
                    products.slice(0, 5).map((p) => (
                      <div key={p.id} style={s.dashProductRow}>
                        {p.image_data
                          ? <img src={p.image_data} style={s.dashProductImg} alt={p.name} />
                          : <span style={s.dashProductEmoji}>{p.emoji}</span>
                        }
                        <div style={{ flex: 1 }}>
                          <p style={s.dashName}>{p.name}</p>
                          <p style={s.dashItems}>₾{Number(p.price).toFixed(2)}</p>
                        </div>
                        <span style={{ ...s.badge, background: p.available ? "#e8f5e9" : "#fce4ec", color: p.available ? "#2e7d32" : "#c62828" }}>
                          {p.available ? "Active" : "Hidden"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Orders ── */}
          {page === "orders" && (
            <div>
              <div style={s.orderToolbar}>
                <div style={s.filterTabs}>
                  {[["all", "All"], ["pending", "⏳ Pending"], ["confirmed", "✅ Confirmed"], ["out_for_delivery", "🚚 In Transit"], ["delivered", "📦 Delivered"]].map(([k, l]) => (
                    <button key={k} style={{ ...s.filterTab, ...(orderFilter === k ? s.filterTabActive : {}) }} onClick={() => setOrderFilter(k)}>
                      {l}
                      {k !== "all" && (
                        <span style={{ ...s.filterCount, ...(orderFilter === k ? s.filterCountActive : {}) }}>
                          {orders.filter(o => o.status === k).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  style={s.searchInput}
                  placeholder="🔍 Search by name, phone or order code..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                />
              </div>

              <div style={s.card}>
                {filteredOrders.length === 0 ? (
                  <p style={s.empty}>No orders match your filter.</p>
                ) : (
                  <div style={s.orderList}>
                    {filteredOrders.map((o) => {
                      const sc = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
                      return (
                        <div key={o.id} style={s.orderCard}>
                          <div style={s.orderCardTop}>
                            <div style={s.orderCardLeft}>
                              <span style={s.orderId}>Order #{o.id}</span>
                              {o.order_code && <span style={s.orderCodeBadge}>{o.order_code}</span>}
                              <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{sc.label}</span>
                              <span style={s.orderTypeBadge}>{o.order_type === "pickup" ? "🏠 Pickup" : "🚚 Delivery"}</span>
                            </div>
                            <span style={s.orderDate}>
                              {new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                              {" · "}
                              {new Date(o.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div style={s.orderDetails}>
                            <span style={s.orderDetail}>👤 {o.customer_name}</span>
                            <a href={`tel:${o.phone}`} style={s.orderPhone}>📞 {o.phone}</a>
                            {o.address && <span style={s.orderDetail}>📍 {o.address}</span>}
                          </div>
                          <p style={s.orderItems}>{o.items}</p>
                          <div style={s.orderCardBottom}>
                            <div>
                              <span style={s.orderTotal}>₾{Number(o.total).toFixed(2)}</span>
                              {o.customer_email && <p style={{ color: "#8b6070", fontSize: "0.72rem", marginTop: "0.2rem" }}>✉️ {o.customer_email}</p>}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              {nextAction(o) && (
                                <button style={{ ...s.actionBtn, background: nextAction(o).color }} onClick={() => updateOrderStatus(o.id, nextAction(o).next)}>
                                  {nextAction(o).label}
                                </button>
                              )}
                              <button style={s.deleteOrderBtn} onClick={() => deleteOrder(o.id)} title="Delete order">🗑️</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Products ── */}
          {page === "products" && (
            <div style={s.card}>
              {products.length === 0 ? (
                <div style={s.emptyState}>
                  <span style={s.emptyIcon}>🍽️</span>
                  <p style={s.emptyTitle}>No products yet</p>
                  <button style={s.emptyBtn} onClick={() => setPage("add")}>+ Add First Product</button>
                </div>
              ) : (
                <div style={s.productGrid}>
                  {products.map((p) => (
                    <div key={p.id} style={{ ...s.productCard, opacity: p.available ? 1 : 0.6 }}
                      onMouseEnter={e => { const ov = e.currentTarget.querySelector("[data-overlay]"); if (ov) ov.style.opacity = "1"; ov.style.background = "rgba(0,0,0,0.35)"; }}
                      onMouseLeave={e => { const ov = e.currentTarget.querySelector("[data-overlay]"); if (ov) ov.style.opacity = "0"; ov.style.background = "rgba(0,0,0,0)"; }}
                    >
                      <div style={s.productImgWrap}>
                        {p.image_data
                          ? <img src={p.image_data} style={s.productImg} alt={p.name} />
                          : <span style={s.productEmoji}>{p.emoji}</span>
                        }
                        <div data-overlay="" style={s.photoOverlay}>
                          <label style={s.photoOverlayBtn}>
                            📷
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={e => uploadProductImage(p.id, e.target.files[0])}
                            />
                          </label>
                          {p.image_data && (
                            <button style={s.photoRemoveBtn} onClick={() => removeProductImage(p.id)}>✕</button>
                          )}
                        </div>
                      </div>
                      <div style={s.productInfo}>
                        <p style={s.productName}>{p.name}</p>
                        {p.description && <p style={s.productDesc}>{p.description}</p>}
                        <p style={s.productPrice}>₾{Number(p.price).toFixed(2)}</p>
                        <div style={s.productStatusRow}>
                          <span style={{ ...s.badge, background: p.available ? "#e8f5e9" : "#fce4ec", color: p.available ? "#2e7d32" : "#c62828" }}>
                            {p.available ? "✓ Active" : "Hidden"}
                          </span>
                        </div>
                        <div style={s.productActions}>
                          <button style={s.toggleBtn} onClick={() => toggleAvailable(p)}>{p.available ? "Hide" : "Show"}</button>
                          <button style={s.deleteBtn} onClick={() => deleteProduct(p.id)}>🗑️</button>
                        </div>
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
              <div style={s.addFormInner}>
                <div style={s.addFormLeft}>
                  <h3 style={s.cardTitle}>Product Details</h3>
                  <p style={s.cardSub}>Fill in all the fields below to list a new item on your menu</p>
                  <form onSubmit={addProduct}>

                    {/* Photo Upload */}
                    <label style={s.label}>Product Photo</label>
                    <div style={s.photoUploadArea}>
                      {imagePreview ? (
                        <div style={s.photoPreviewWrap}>
                          <img src={imagePreview} style={s.photoPreviewImg} alt="preview" />
                          <button type="button" style={s.photoRemoveBtn2} onClick={() => { setImageFile(null); setImagePreview(null); }}>✕ Remove</button>
                        </div>
                      ) : (
                        <label style={s.photoUploadLabel}>
                          <span style={s.photoUploadIcon}>📷</span>
                          <span style={s.photoUploadText}>Click to upload a photo</span>
                          <span style={s.photoUploadSub}>JPG, PNG, WebP — max 8MB (auto-compressed)</span>
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageSelect} />
                        </label>
                      )}
                    </div>

                    {/* Emoji fallback */}
                    <label style={s.label}>Emoji (shown if no photo)</label>
                    <div style={s.emojiPicker}>
                      {EMOJIS.map(em => (
                        <button key={em} type="button"
                          style={{ ...s.emojiOpt, ...(productForm.emoji === em ? s.emojiOptActive : {}) }}
                          onClick={() => setProductForm({ ...productForm, emoji: em })}
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    <label style={s.label}>Product Name *</label>
                    <input style={s.input} value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g. Chocolate Mousse Cake" required />

                    <label style={s.label}>Description</label>
                    <textarea style={{ ...s.input, height: "80px", resize: "vertical" }}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Short description shown on the menu..." />

                    <label style={s.label}>Price (₾) *</label>
                    <input style={s.input} type="number" step="0.01" min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="25.00" required />

                    <label style={s.label}>Sale Price / აქცია (₾) — leave empty if no sale</label>
                    <input style={{ ...s.input, borderColor: productForm.sale_price ? "#d4235e" : undefined }}
                      type="number" step="0.01" min="0"
                      value={productForm.sale_price}
                      onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })}
                      placeholder="e.g. 18.00 (optional)" />

                    <button style={s.addBtn} type="submit" disabled={loading}>
                      {loading ? "Adding..." : "➕ Add to Menu"}
                    </button>
                  </form>
                </div>

                <div style={s.addFormRight}>
                  <h3 style={s.cardTitle}>Live Preview</h3>
                  <p style={s.cardSub}>How it appears to customers</p>
                  <div style={s.productPreview}>
                    <div style={s.previewImgWrap}>
                      {imagePreview
                        ? <img src={imagePreview} style={s.previewRealImg} alt="preview" />
                        : <span style={s.previewEmoji}>{productForm.emoji || "🍰"}</span>
                      }
                      <div style={s.previewFreshBadge}>✓ Fresh Today</div>
                    </div>
                    <div style={s.previewBody}>
                      <h4 style={s.previewName}>{productForm.name || "Product name"}</h4>
                      {productForm.description && <p style={s.previewDesc}>{productForm.description}</p>}
                      <div style={s.previewFooter}>
                        <span style={s.previewPrice}>₾{productForm.price || "0.00"}</span>
                        <button style={s.previewAddBtn} disabled>+ Add</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Team ── */}
          {page === "team" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Add Delivery Staff</h3>
                <p style={s.cardSub}>They'll log in via the Staff Portal at <strong>/login</strong> and be redirected to the delivery panel.</p>
                <div style={s.teamFormRow}>
                  <form onSubmit={addDelivery} style={s.teamForm}>
                    <input style={s.input} type="email" placeholder="Email address" value={teamForm.email}
                      onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} required />
                    <input style={s.input} type="password" placeholder="Temporary password" value={teamForm.password}
                      onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })} required />
                    <button style={s.addBtn} type="submit" disabled={loading}>
                      {loading ? "Creating..." : "Create Delivery Account"}
                    </button>
                  </form>
                  <div style={s.teamHint}>
                    <div style={s.teamHintIcon}>💡</div>
                    <p style={s.teamHintText}>Delivery staff get access to the delivery panel only. They see and update the status of confirmed delivery orders.</p>
                  </div>
                </div>
              </div>

              <div style={s.card}>
                <div style={s.cardHeader}>
                  <h3 style={s.cardTitle}>Delivery Team ({team.length})</h3>
                </div>
                {team.length === 0 ? (
                  <p style={s.empty}>No delivery staff yet. Add someone above.</p>
                ) : (
                  <div style={s.teamList}>
                    {team.map((u) => (
                      <div key={u.id} style={s.teamRow}>
                        <div style={s.teamAvatar}>{u.email[0].toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <p style={s.teamEmail}>{u.email}</p>
                          <p style={s.teamDate}>Added {new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                        <span style={{ ...s.badge, background: "#e3f2fd", color: "#1565c0" }}>🚚 Delivery Staff</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Settings ── */}
          {page === "settings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <form onSubmit={saveSettings}>
                <div style={s.card}>
                  <h3 style={s.cardTitle}>Shop Information</h3>
                  <p style={s.cardSub}>Update the details displayed to your customers</p>
                  <div style={s.settingsGrid}>
                    <div style={s.field}>
                      <label style={s.label}>Shop Name</label>
                      <input style={s.input} placeholder="საკონდიტრო" value={settings.shopName || ""}
                        onChange={e => setSettings({ ...settings, shopName: e.target.value })} />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Phone Number</label>
                      <input style={s.input} placeholder="+995 555 000 000" value={settings.phone || ""}
                        onChange={e => setSettings({ ...settings, phone: e.target.value })} />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Address / Location</label>
                      <input style={s.input} placeholder="Tbilisi, Georgia" value={settings.address || ""}
                        onChange={e => setSettings({ ...settings, address: e.target.value })} />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Pickup Note (shown to customers)</label>
                      <input style={s.input} placeholder="e.g. Tamar's Kitchen, Vake district" value={settings.pickupNote || ""}
                        onChange={e => setSettings({ ...settings, pickupNote: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div style={{ ...s.card, marginTop: "1.5rem" }}>
                  <h3 style={s.cardTitle}>Opening Hours</h3>
                  <p style={s.cardSub}>Set when your shop is open for orders</p>
                  <div style={s.hoursGrid}>
                    {[["Mon – Fri", "weekdays"], ["Saturday", "saturday"], ["Sunday", "sunday"]].map(([label, key]) => (
                      <div key={key} style={s.hoursRow}>
                        <span style={s.hoursDay}>{label}</span>
                        <input style={{ ...s.input, width: "110px", marginBottom: 0 }} placeholder="9:00" value={settings[`${key}Open`] || ""}
                          onChange={e => setSettings({ ...settings, [`${key}Open`]: e.target.value })} />
                        <span style={s.hoursDash}>—</span>
                        <input style={{ ...s.input, width: "130px", marginBottom: 0 }} placeholder="20:00 / Closed" value={settings[`${key}Close`] || ""}
                          onChange={e => setSettings({ ...settings, [`${key}Close`]: e.target.value })} />
                      </div>
                    ))}
                  </div>
                  <button style={{ ...s.addBtn, marginTop: "1.5rem" }} type="submit">Save Settings</button>
                </div>
              </form>

              <div style={s.card}>
                <h3 style={s.cardTitle}>Admin Account</h3>
                <p style={s.cardSub}>Signed in as <strong>{adminEmail}</strong></p>
                <div style={s.accountInfo}>
                  <div style={s.accountRow}>
                    <span style={s.accountLabel}>Role</span>
                    <span style={{ ...s.badge, background: "#fce4ec", color: "#c62828" }}>Administrator</span>
                  </div>
                  <div style={s.accountRow}>
                    <span style={s.accountLabel}>Access Level</span>
                    <span style={s.accountValue}>Full admin access</span>
                  </div>
                </div>
                <button style={s.logoutBtnFull} onClick={logout}>Sign Out</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const s = {
  layout: { display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "#f7f3f7" },

  sidebar: { width: "248px", background: "linear-gradient(180deg, #1a1020 0%, #2a1830 100%)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 40 },
  sidebarTop: { padding: "1.8rem 1.5rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", textAlign: "center" },
  sidebarLogo: { fontSize: "2rem", marginBottom: "0.3rem" },
  sidebarTitle: { color: "white", fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1rem" },
  sidebarSub: { color: "rgba(255,255,255,0.3)", fontSize: "0.64rem", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "2px" },

  nav: { flex: 1, padding: "1.2rem 0.8rem", overflowY: "auto" },
  navBtn: { display: "flex", alignItems: "center", gap: "0.65rem", width: "100%", padding: "0.72rem 1rem", background: "transparent", border: "none", color: "rgba(255,255,255,0.45)", borderRadius: "12px", cursor: "pointer", fontSize: "0.86rem", fontWeight: "500", marginBottom: "0.15rem", textAlign: "left", position: "relative" },
  navActive: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white" },
  navIcon: { fontSize: "1rem", flexShrink: 0 },
  navBadge: { marginLeft: "auto", background: "#ef4444", color: "white", borderRadius: "50%", fontSize: "0.65rem", fontWeight: "800", padding: "1px 6px", minWidth: "20px", textAlign: "center" },

  sidebarBottom: { padding: "1rem 0.8rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: "0.5rem" },
  adminInfo: { display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.8rem", background: "rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: "0.3rem" },
  adminAvatar: { width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0 },
  adminName: { color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", fontWeight: "600" },
  adminRole: { color: "rgba(255,255,255,0.3)", fontSize: "0.65rem" },
  shopBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1rem", background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem" },
  logoutBtn: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1rem", background: "rgba(212,35,94,0.15)", border: "none", color: "#e87da0", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem" },

  main: { flex: 1, marginLeft: "248px", background: "#f7f3f7", minHeight: "100vh" },
  topbar: { background: "white", padding: "1.4rem 2rem", borderBottom: "1px solid #f0eaf4", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 30 },
  pageTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: "700", color: "#1c0f18" },
  pageDesc: { color: "#8b6070", fontSize: "0.78rem", marginTop: "0.2rem" },
  topbarRight: { display: "flex", alignItems: "center", gap: "0.8rem" },
  flash: { padding: "0.5rem 1.2rem", borderRadius: "50px", fontSize: "0.82rem", fontWeight: "600" },
  refreshBtn: { background: "#f5eef2", border: "1px solid #e8dde5", color: "#8b6070", padding: "0.45rem 1rem", borderRadius: "10px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "500" },

  content: { padding: "2rem" },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  statCard: { borderRadius: "18px", padding: "1.3rem", display: "flex", alignItems: "flex-start", gap: "1rem", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" },
  statIconWrap: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statIcon: { fontSize: "1.3rem" },
  statValue: { fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: "700", lineHeight: 1 },
  statLabel: { fontSize: "0.78rem", fontWeight: "600", color: "#1c0f18", marginTop: "0.3rem" },
  statSub: { fontSize: "0.68rem", color: "#8b6070", marginTop: "0.15rem" },

  dashRow: { display: "flex", gap: "1.5rem", alignItems: "flex-start" },
  dashRow2: { display: "flex", alignItems: "flex-start", gap: "0.8rem", padding: "0.85rem 0", borderBottom: "1px solid #faf3f7" },
  dashId: { background: "#f5eef2", color: "#8b6070", borderRadius: "8px", padding: "0.2rem 0.55rem", fontSize: "0.72rem", fontWeight: "700", flexShrink: 0, marginTop: "2px" },
  dashName: { fontWeight: "600", color: "#1c0f18", fontSize: "0.86rem", marginBottom: "0.1rem" },
  dashItems: { color: "#8b6070", fontSize: "0.75rem" },
  dashRight: { display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 },
  dashTotal: { fontWeight: "700", color: "#1c0f18", fontSize: "0.88rem" },
  dashProductRow: { display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.75rem 0", borderBottom: "1px solid #faf3f7" },
  dashProductEmoji: { fontSize: "1.6rem", flexShrink: 0 },
  dashProductImg: { width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 },
  orderCodeTag: { background: "#f5eef2", color: "#8b6070", fontFamily: "monospace", fontSize: "0.7rem", fontWeight: "700", padding: "0.18rem 0.55rem", borderRadius: "6px", letterSpacing: "0.05em" },

  orderToolbar: { display: "flex", gap: "1rem", marginBottom: "1.2rem", flexWrap: "wrap", alignItems: "center" },
  filterTabs: { display: "flex", gap: "0.3rem", background: "white", padding: "4px", borderRadius: "14px", border: "1px solid #f0eaf4", flexWrap: "wrap" },
  filterTab: { padding: "0.45rem 0.9rem", border: "none", background: "transparent", borderRadius: "10px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "500", color: "#8b6070", display: "flex", alignItems: "center", gap: "0.4rem" },
  filterTabActive: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white" },
  filterCount: { background: "#f0eaf4", color: "#8b6070", borderRadius: "50px", padding: "0px 6px", fontSize: "0.7rem", fontWeight: "700" },
  filterCountActive: { background: "rgba(255,255,255,0.25)", color: "white" },
  searchInput: { flex: 1, minWidth: "200px", padding: "0.6rem 1rem", borderRadius: "12px", border: "1.5px solid #f0eaf4", fontSize: "0.88rem", outline: "none", color: "#1c0f18", background: "white" },

  card: { background: "white", borderRadius: "20px", padding: "1.8rem", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", border: "1px solid #f0eaf4" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", color: "#1c0f18", fontWeight: "700", marginBottom: "0.2rem" },
  cardSub: { color: "#8b6070", fontSize: "0.8rem", marginBottom: "1.2rem" },
  cardAction: { background: "#f5eef2", border: "none", color: "#d4235e", fontWeight: "600", fontSize: "0.8rem", padding: "0.35rem 0.9rem", borderRadius: "8px", cursor: "pointer" },

  orderList: { display: "flex", flexDirection: "column", gap: "1rem" },
  orderCard: { background: "#fdf8fb", borderRadius: "14px", padding: "1.2rem 1.4rem", border: "1px solid #f0eaf4" },
  orderCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" },
  orderCardLeft: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" },
  orderId: { fontWeight: "700", color: "#1c0f18", fontSize: "0.88rem" },
  orderCodeBadge: { background: "#f0f4f8", color: "#475569", fontFamily: "monospace", fontSize: "0.72rem", fontWeight: "700", padding: "0.18rem 0.65rem", borderRadius: "6px", letterSpacing: "0.08em" },
  orderTypeBadge: { background: "#f0f4f8", color: "#475569", padding: "0.15rem 0.65rem", borderRadius: "50px", fontSize: "0.7rem", fontWeight: "600" },
  orderDate: { color: "#8b6070", fontSize: "0.76rem" },
  orderDetails: { display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" },
  orderDetail: { color: "#6b4c58", fontSize: "0.81rem" },
  orderPhone: { color: "#1d4ed8", fontSize: "0.81rem", textDecoration: "none", fontWeight: "500" },
  orderItems: { color: "#333", fontSize: "0.85rem", marginBottom: "0.8rem" },
  orderCardBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  orderTotal: { fontWeight: "700", color: "#1c0f18", fontSize: "0.95rem" },
  statusSelect: { fontSize: "0.8rem", padding: "0.32rem 0.7rem", borderRadius: "8px", border: "1.5px solid #f0eaf4", cursor: "pointer", outline: "none", background: "white" },
  deleteOrderBtn: { padding: "0.32rem 0.6rem", background: "#fce4ec", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" },
  actionBtn: { color: "white", border: "none", padding: "0.42rem 1rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },

  badge: { padding: "0.2rem 0.75rem", borderRadius: "50px", fontSize: "0.72rem", fontWeight: "600" },

  productGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1.2rem" },
  productCard: { background: "#fdf6f2", borderRadius: "18px", overflow: "hidden", border: "1px solid #f0eaf4" },
  productImgWrap: { position: "relative", background: "linear-gradient(135deg, #fff0f5, #ffdae8)", height: "160px", display: "flex", alignItems: "center", justifyContent: "center" },
  productImg: { width: "100%", height: "100%", objectFit: "cover" },
  productEmoji: { fontSize: "3.5rem" },
  photoOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: 0, transition: "opacity 0.2s", cursor: "pointer" },
  photoOverlayBtn: { background: "rgba(0,0,0,0.65)", color: "white", width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", cursor: "pointer" },
  photoRemoveBtn: { background: "rgba(239,68,68,0.85)", color: "white", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "0.75rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  productInfo: { padding: "1rem" },
  productName: { fontFamily: "'Playfair Display', serif", fontWeight: "700", color: "#1c0f18", fontSize: "0.92rem", marginBottom: "0.25rem" },
  productDesc: { color: "#8b6070", fontSize: "0.72rem", lineHeight: 1.4, marginBottom: "0.3rem" },
  productPrice: { color: "#d4235e", fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" },
  productStatusRow: { marginBottom: "0.7rem" },
  productActions: { display: "flex", gap: "0.5rem" },
  toggleBtn: { flex: 1, padding: "0.38rem", background: "#e3f2fd", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", color: "#1565c0", fontWeight: "500" },
  deleteBtn: { padding: "0.38rem 0.6rem", background: "#fce4ec", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem" },

  emptyState: { textAlign: "center", padding: "3rem" },
  emptyIcon: { fontSize: "3rem", display: "block", marginBottom: "0.8rem" },
  emptyTitle: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.4rem" },
  emptyBtn: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.7rem 1.5rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600", marginTop: "1rem" },
  empty: { color: "#8b6070", textAlign: "center", padding: "2rem 1rem", fontSize: "0.88rem" },

  addFormInner: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" },
  addFormLeft: {},
  addFormRight: {},
  label: { display: "block", marginBottom: "0.4rem", color: "#6b4c58", fontSize: "0.8rem", fontWeight: "600" },

  photoUploadArea: { marginBottom: "1.2rem" },
  photoUploadLabel: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed #f0dde8", borderRadius: "14px", padding: "2rem 1rem", cursor: "pointer", background: "#fdf8fb", textAlign: "center" },
  photoUploadIcon: { fontSize: "2rem", marginBottom: "0.5rem" },
  photoUploadText: { color: "#6b4c58", fontWeight: "600", fontSize: "0.88rem", marginBottom: "0.25rem" },
  photoUploadSub: { color: "#8b6070", fontSize: "0.74rem" },
  photoPreviewWrap: { position: "relative", borderRadius: "14px", overflow: "hidden" },
  photoPreviewImg: { width: "100%", height: "180px", objectFit: "cover", display: "block" },
  photoRemoveBtn2: { position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(0,0,0,0.6)", color: "white", border: "none", padding: "0.3rem 0.7rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },

  emojiPicker: { display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.2rem" },
  emojiOpt: { width: "40px", height: "40px", background: "#f5eef2", border: "2px solid transparent", borderRadius: "10px", cursor: "pointer", fontSize: "1.3rem", display: "flex", alignItems: "center", justifyContent: "center" },
  emojiOptActive: { border: "2px solid #d4235e", background: "#ffd6e7" },
  input: { width: "100%", padding: "0.78rem 1rem", borderRadius: "10px", border: "1.5px solid #f0eaf4", fontSize: "0.9rem", outline: "none", color: "#1c0f18", marginBottom: "0.9rem", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" },
  field: { marginBottom: "0.2rem" },
  addBtn: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.85rem 2rem", borderRadius: "12px", fontSize: "0.92rem", fontWeight: "600", cursor: "pointer", marginTop: "0.3rem" },

  productPreview: { background: "white", border: "1px solid #f0eaf4", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" },
  previewImgWrap: { background: "linear-gradient(135deg, #fff0f5, #ffdae8)", height: "180px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  previewRealImg: { width: "100%", height: "100%", objectFit: "cover" },
  previewEmoji: { fontSize: "4rem" },
  previewFreshBadge: { position: "absolute", top: "0.7rem", right: "0.7rem", background: "rgba(212,35,94,0.12)", color: "#d4235e", fontSize: "0.65rem", fontWeight: "700", padding: "0.2rem 0.6rem", borderRadius: "50px" },
  previewBody: { padding: "1.2rem 1.4rem 1.5rem" },
  previewName: { fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#1c0f18", fontWeight: "700", marginBottom: "0.4rem" },
  previewDesc: { color: "#8b6070", fontSize: "0.78rem", marginBottom: "0.8rem", lineHeight: 1.5 },
  previewFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  previewPrice: { color: "#d4235e", fontWeight: "800", fontSize: "1.2rem", fontFamily: "'Playfair Display', serif" },
  previewAddBtn: { background: "#d4235e", color: "white", border: "none", padding: "0.45rem 1rem", borderRadius: "50px", fontSize: "0.8rem", fontWeight: "600", opacity: 0.5, cursor: "default" },

  teamFormRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" },
  teamForm: { display: "flex", flexDirection: "column" },
  teamHint: { background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "14px", padding: "1.2rem", display: "flex", gap: "0.8rem", alignItems: "flex-start" },
  teamHintIcon: { fontSize: "1.4rem", flexShrink: 0 },
  teamHintText: { color: "#5d4037", fontSize: "0.83rem", lineHeight: 1.6 },
  teamList: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  teamRow: { display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem", background: "#fdf8fb", borderRadius: "12px", border: "1px solid #f0eaf4" },
  teamAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #1d4ed8, #1e40af)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "1rem", flexShrink: 0 },
  teamEmail: { fontWeight: "600", color: "#1c0f18", fontSize: "0.88rem" },
  teamDate: { color: "#8b6070", fontSize: "0.74rem", marginTop: "0.1rem" },

  settingsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.5rem", marginBottom: "0.5rem" },
  hoursGrid: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  hoursRow: { display: "flex", alignItems: "center", gap: "1rem" },
  hoursDay: { color: "#6b4c58", fontWeight: "500", fontSize: "0.85rem", width: "100px", flexShrink: 0 },
  hoursDash: { color: "#8b6070" },
  accountInfo: { display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.2rem" },
  accountRow: { display: "flex", alignItems: "center", gap: "1rem", padding: "0.6rem 0", borderBottom: "1px solid #faf3f7" },
  accountLabel: { color: "#8b6070", fontSize: "0.82rem", width: "120px" },
  accountValue: { color: "#1c0f18", fontSize: "0.85rem", fontWeight: "500" },
  logoutBtnFull: { background: "#fce4ec", border: "none", color: "#c62828", padding: "0.7rem 1.5rem", borderRadius: "12px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600" },
};
