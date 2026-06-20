import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Cart from "../components/Cart";
import OrderForm from "../components/OrderForm";
import AuthModal from "../components/AuthModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Menu() {
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    const cartProduct = product.sale_price ? { ...product, price: product.sale_price } : product;
    setCart((prev) => {
      const ex = prev.find((i) => i.id === cartProduct.id);
      if (ex) return prev.map((i) => i.id === cartProduct.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...cartProduct, qty: 1 }];
    });
    setAddedIds((prev) => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; }), 1600);
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const hasSale = products.some((p) => p.sale_price);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "sale" && p.sale_price);
    return matchSearch && matchFilter;
  });

  if (orderSuccess) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(150deg, #1c0f18, #3a1430)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.5rem", padding: "2rem", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "1.2rem" }}>
          <div style={{ fontSize: "5rem", animation: "float 2s ease-in-out infinite" }}>🎉</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "2rem", fontWeight: "700" }}>Order Placed!</h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.95rem" }}>Your order code</p>
          <div style={{ fontFamily: "monospace", fontSize: "2.4rem", fontWeight: "900", color: "#ff8fab", letterSpacing: "0.3em", background: "rgba(212,35,94,0.15)", padding: "1.2rem 3rem", borderRadius: "20px", border: "1px solid rgba(212,35,94,0.35)" }}>{orderCode}</div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", maxWidth: "320px", lineHeight: 1.7 }}>We'll send email updates as your order progresses. Thank you!</p>
          <button style={{ background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.9rem 2.5rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", marginTop: "0.5rem", boxShadow: "0 8px 28px rgba(212,35,94,0.45)" }}
            onClick={() => { setOrderSuccess(false); setOrderCode(null); }}>
            Order More 🍰
          </button>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", cursor: "pointer", marginTop: "0.3rem" }}>← Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(28,15,24,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 2rem", height: "66px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.8rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "linear-gradient(135deg, rgba(212,35,94,0.3), rgba(160,24,72,0.2))", border: "1px solid rgba(212,35,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem" }}>🍰</div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.05rem", fontWeight: "700", lineHeight: 1 }}>საკონდიტრო</div>
              <div style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.48rem", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: "3px" }}>Georgian Confectionery</div>
            </div>
          </button>

          <div style={{ color: "rgba(255,255,255,0.18)", fontSize: "0.72rem", letterSpacing: "0.12em", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            Open Now · Accepting Orders
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button onClick={toggle} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", width: "38px", height: "38px", borderRadius: "10px", cursor: "pointer", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setCartOpen(true)} style={{ position: "relative", background: totalItems > 0 ? "linear-gradient(135deg, #d4235e, #a01848)" : "rgba(255,255,255,0.08)", border: totalItems > 0 ? "none" : "1px solid rgba(255,255,255,0.12)", color: "white", height: "38px", padding: "0 1.1rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.25s", boxShadow: totalItems > 0 ? "0 4px 16px rgba(212,35,94,0.4)" : "none" }}>
              🛒
              {totalItems > 0 ? (
                <span>{totalItems} · ₾{cartTotal.toFixed(2)}</span>
              ) : (
                <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: "400" }}>Cart</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(150deg, #1c0f18 0%, #2e1226 50%, #1c0f18 100%)", padding: "5rem 2rem 4rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", width: "600px", height: "600px", top: "-250px", right: "-100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,35,94,0.1) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "400px", height: "400px", bottom: "-180px", left: "-80px", borderRadius: "50%", background: "radial-gradient(circle, rgba(90,26,58,0.25) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,35,94,0.12)", border: "1px solid rgba(212,35,94,0.28)", color: "#f4a3b8", borderRadius: "50px", padding: "0.4rem 1.2rem", fontSize: "0.7rem", fontWeight: "600", letterSpacing: "0.1em", marginBottom: "1.6rem" }}>
            🌅 Baked Fresh Every Morning
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: "700", lineHeight: 1.12, marginBottom: "0.9rem" }}>
            Our Menu
          </h1>
          <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.97rem", maxWidth: "380px", margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Handcrafted with love in Tbilisi — choose your favourites and we'll bring them to your door.
          </p>

          {/* Search */}
          <div style={{ maxWidth: "480px", margin: "0 auto 1.5rem", position: "relative" }}>
            <span style={{ position: "absolute", left: "1.2rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.95rem", pointerEvents: "none", opacity: 0.5 }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cakes, pastries, chocolates…"
              style={{ width: "100%", padding: "0.9rem 1.2rem 0.9rem 3rem", borderRadius: "50px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.07)", color: "white", fontSize: "0.9rem", outline: "none", backdropFilter: "blur(10px)", boxSizing: "border-box", transition: "border-color 0.2s" }}
              onFocus={e => e.target.style.borderColor = "rgba(212,35,94,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
            />
          </div>

          {/* Filter tabs */}
          {hasSale && (
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              {[["all", "All Items"], ["sale", "🏷 On Sale"]].map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)}
                  style={{ background: filter === key ? "linear-gradient(135deg, #d4235e, #a01848)" : "rgba(255,255,255,0.07)", border: filter === key ? "none" : "1px solid rgba(255,255,255,0.12)", color: "white", padding: "0.5rem 1.3rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.82rem", fontWeight: filter === key ? "700" : "400", transition: "all 0.2s", boxShadow: filter === key ? "0 4px 14px rgba(212,35,94,0.35)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Products ── */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "3.5rem 2rem 8rem" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "7rem 2rem" }}>
            <div style={{ width: "44px", height: "44px", border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", margin: "0 auto 1.4rem", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading today's menu…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "7rem 2rem" }}>
            <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "1rem" }}>🍽️</span>
            <p style={{ fontFamily: "'Playfair Display', serif", color: "var(--text)", fontWeight: "700", fontSize: "1.15rem", marginBottom: "0.5rem" }}>
              {search ? `Nothing found for "${search}"` : "Menu coming soon!"}
            </p>
            {search && <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>Try a different search term</p>}
          </div>
        ) : (
          <>
            {/* Sale section */}
            {filter !== "sale" && filtered.some(p => p.sale_price) && (
              <div style={{ marginBottom: "4rem" }}>
                <SectionHeader label="LIMITED TIME OFFER" title="🏷 On Sale" count={filtered.filter(p => p.sale_price).length} accent />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.8rem" }}>
                  {filtered.filter(p => p.sale_price).map((p) => (
                    <ProductCard key={p.id} p={p} isDark={isDark} added={addedIds.has(p.id)} onAdd={() => addToCart(p)} />
                  ))}
                </div>
              </div>
            )}

            {/* Main grid */}
            {filtered.filter(p => filter === "sale" || !p.sale_price).length > 0 && (
              <div>
                {filter !== "sale" && filtered.some(p => p.sale_price) && (
                  <SectionHeader label="FRESH TODAY" title="Everything Else" count={filtered.filter(p => !p.sale_price).length} />
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.8rem" }}>
                  {filtered.filter(p => filter === "sale" || !p.sale_price).map((p) => (
                    <ProductCard key={p.id} p={p} isDark={isDark} added={addedIds.has(p.id)} onAdd={() => addToCart(p)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Sticky Cart Bar ── */}
      {totalItems > 0 && !cartOpen && (
        <div style={{ position: "fixed", bottom: "1.8rem", left: "50%", transform: "translateX(-50%)", zIndex: 40, animation: "fadeInUp 0.3s ease both" }}>
          <button onClick={() => setCartOpen(true)}
            style={{ background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem 2rem", borderRadius: "50px", fontSize: "0.93rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 10px 40px rgba(212,35,94,0.55)", display: "flex", alignItems: "center", gap: "1rem", whiteSpace: "nowrap", backdropFilter: "blur(12px)" }}>
            <span style={{ background: "rgba(255,255,255,0.22)", borderRadius: "50px", padding: "0.15rem 0.7rem", fontSize: "0.82rem", fontWeight: "900" }}>{totalItems}</span>
            View Cart
            <span style={{ opacity: 0.7 }}>·</span>
            <span>₾{cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {cartOpen && <Cart cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} onOrder={() => { setCartOpen(false); setOrderOpen(true); }} />}
      {orderOpen && (
        <OrderForm cart={cart} backendUrl={BACKEND_URL} onClose={() => setOrderOpen(false)}
          onSuccess={(code) => { setCart([]); setOrderOpen(false); setOrderCode(code); setOrderSuccess(true); }} />
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, title, count, accent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", marginBottom: "2rem" }}>
      <div>
        <p style={{ color: accent ? "var(--accent)" : "var(--text-faint)", fontSize: "0.6rem", letterSpacing: "0.25em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.35rem" }}>{label}</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.55rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      <span style={{ background: accent ? "linear-gradient(135deg, #d4235e, #a01848)" : "var(--accent-light)", color: accent ? "white" : "var(--accent)", border: accent ? "none" : "1px solid var(--accent-ring)", fontSize: "0.72rem", fontWeight: "700", padding: "0.3rem 0.9rem", borderRadius: "50px", flexShrink: 0, boxShadow: accent ? "0 4px 12px rgba(212,35,94,0.3)" : "none" }}>
        {count} {count === 1 ? "item" : "items"}
      </span>
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────────
function ProductCard({ p, isDark, added, onAdd }) {
  const [hovered, setHovered] = useState(false);
  const isSale = !!p.sale_price;

  if (p.image_data) {
    return (
      <div
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ borderRadius: "24px", overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: hovered ? "0 32px 72px rgba(0,0,0,0.38)" : isSale ? "0 8px 32px rgba(212,35,94,0.18)" : "0 4px 24px rgba(0,0,0,0.12)", transform: hovered ? "translateY(-10px) scale(1.01)" : "translateY(0) scale(1)", transition: "transform 0.35s ease, box-shadow 0.35s ease", outline: isSale ? "2px solid rgba(212,35,94,0.4)" : "none" }}
      >
        <div style={{ position: "relative", height: "310px" }}>
          <img src={p.image_data} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease", transform: hovered ? "scale(1.06)" : "scale(1)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }} />

          {isSale ? (
            <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.62rem", fontWeight: "800", padding: "0.28rem 0.85rem", borderRadius: "50px", letterSpacing: "0.08em", boxShadow: "0 4px 14px rgba(212,35,94,0.55)" }}>🏷 SALE</div>
          ) : (
            <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)", color: "rgba(255,255,255,0.88)", fontSize: "0.6rem", fontWeight: "700", padding: "0.28rem 0.85rem", borderRadius: "50px", letterSpacing: "0.08em" }}>✓ FRESH TODAY</div>
          )}

          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.6rem 1.7rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.2rem", fontWeight: "700", marginBottom: "0.35rem", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>{p.name}</h3>
            {p.description && <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", marginBottom: "1rem", lineHeight: 1.5 }}>{p.description}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {isSale && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.88rem", textDecoration: "line-through", display: "block", lineHeight: 1 }}>₾{Number(p.price).toFixed(2)}</span>}
                <span style={{ fontFamily: "'Playfair Display', serif", color: isSale ? "#ff8fab" : "white", fontWeight: "800", fontSize: "1.45rem" }}>₾{Number(p.sale_price || p.price).toFixed(2)}</span>
              </div>
              <button onClick={onAdd}
                style={{ background: added ? "#22c55e" : "rgba(212,35,94,0.95)", backdropFilter: "blur(10px)", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.87rem", fontWeight: "700", transition: "all 0.22s", transform: hovered ? "scale(1.07)" : "scale(1)", boxShadow: added ? "0 4px 16px rgba(34,197,94,0.4)" : "0 4px 18px rgba(212,35,94,0.4)" }}>
                {added ? "✓ Added!" : "+ Add"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: "var(--bg-card)", borderRadius: "24px", overflow: "hidden", border: isSale ? "1.5px solid rgba(212,35,94,0.35)" : "1px solid var(--border)", boxShadow: hovered ? "0 24px 60px var(--shadow-md)" : isSale ? "0 6px 28px rgba(212,35,94,0.12)" : "0 4px 24px var(--shadow)", transform: hovered ? "translateY(-10px)" : "translateY(0)", transition: "transform 0.35s ease, box-shadow 0.35s ease" }}
    >
      <div style={{ background: isSale ? (isDark ? "linear-gradient(135deg, rgba(212,35,94,0.15), rgba(100,20,50,0.25))" : "linear-gradient(135deg, #fff0f5, #ffc8da)") : (isDark ? "linear-gradient(135deg, rgba(212,35,94,0.07), rgba(100,20,50,0.14))" : "linear-gradient(135deg, #fff5f8, #ffe6ef)"), height: "190px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: "5rem", transition: "filter 0.3s, transform 0.3s", transform: hovered ? "scale(1.12)" : "scale(1)", filter: hovered ? "drop-shadow(0 12px 24px rgba(212,35,94,0.35))" : "none", display: "block" }}>{p.emoji}</span>

        {isSale ? (
          <div style={{ position: "absolute", top: "0.9rem", left: "0.9rem", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.62rem", fontWeight: "800", padding: "0.26rem 0.8rem", borderRadius: "50px", letterSpacing: "0.08em", boxShadow: "0 4px 12px rgba(212,35,94,0.45)" }}>🏷 SALE</div>
        ) : (
          <div style={{ position: "absolute", top: "0.9rem", left: "0.9rem", background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)", fontSize: "0.6rem", fontWeight: "800", padding: "0.24rem 0.75rem", borderRadius: "50px", letterSpacing: "0.07em" }}>✓ FRESH</div>
        )}

        {isSale && (
          <div style={{ position: "absolute", top: "0.9rem", right: "0.9rem", background: isDark ? "rgba(0,0,0,0.5)" : "rgba(28,15,24,0.85)", color: "rgba(255,200,210,0.9)", fontSize: "0.72rem", fontWeight: "700", padding: "0.2rem 0.6rem", borderRadius: "8px", textDecoration: "line-through" }}>
            ₾{Number(p.price).toFixed(2)}
          </div>
        )}
      </div>

      <div style={{ padding: "1.4rem 1.7rem 1.8rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", marginBottom: "0.45rem" }}>{p.name}</h3>
        {p.description && <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.65, marginBottom: "1rem" }}>{p.description}</p>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div>
            <div style={{ color: "var(--text-faint)", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "3px" }}>{isSale ? "Sale Price" : "Price"}</div>
            <span style={{ color: isSale ? "var(--accent)" : "var(--accent)", fontWeight: "800", fontSize: "1.35rem", fontFamily: "'Playfair Display', serif" }}>
              ₾{Number(p.sale_price || p.price).toFixed(2)}
            </span>
            {isSale && (
              <span style={{ color: "var(--text-faint)", fontSize: "0.75rem", marginLeft: "0.3rem", textDecoration: "line-through" }}>₾{Number(p.price).toFixed(2)}</span>
            )}
          </div>
          <button onClick={onAdd}
            style={{ background: added ? "#22c55e" : "var(--accent)", color: "white", border: "none", padding: "0.65rem 1.4rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.87rem", fontWeight: "700", transition: "all 0.22s", transform: hovered ? "scale(1.06)" : "scale(1)", boxShadow: added ? "0 4px 16px rgba(34,197,94,0.38)" : "0 4px 18px rgba(212,35,94,0.32)" }}>
            {added ? "✓ Added!" : "+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
