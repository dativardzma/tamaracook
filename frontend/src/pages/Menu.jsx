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

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    const cartProduct = product.sale_price
      ? { ...product, price: product.sale_price }
      : product;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartProduct.id);
      if (existing) return prev.map((i) => i.id === cartProduct.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...cartProduct, qty: 1 }];
    });
    setAddedIds((prev) => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; }), 1600);
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );
  const onSale = filtered.filter((p) => p.sale_price);
  const regular = filtered.filter((p) => !p.sale_price);

  if (orderSuccess) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.5rem", padding: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", animation: "float 2s ease-in-out infinite" }}>🎉</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--text)", fontSize: "1.8rem", fontWeight: "700" }}>Order Placed!</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Your order code is</p>
        <div style={{ fontFamily: "monospace", fontSize: "2.2rem", fontWeight: "900", color: "var(--accent)", letterSpacing: "0.25em", background: "var(--accent-light)", padding: "1rem 2.5rem", borderRadius: "16px", border: "1px solid var(--accent-ring)" }}>{orderCode}</div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "340px" }}>We'll send you updates by email as your order progresses.</p>
        <button style={{ background: "var(--accent)", color: "white", border: "none", padding: "0.85rem 2.2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", marginTop: "0.5rem" }}
          onClick={() => { setOrderSuccess(false); setOrderCode(null); }}>
          Order More
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: isDark ? "rgba(13,9,16,0.92)" : "rgba(28,15,24,0.96)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 2rem", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(212,35,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🍰</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1rem", fontWeight: "700", lineHeight: 1 }}>საკონდიტრო</div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "2px" }}>Georgian Confectionery</div>
            </div>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button onClick={toggle} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", width: "36px", height: "36px", borderRadius: "9px", cursor: "pointer", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            <button onClick={() => setCartOpen(true)} style={{ position: "relative", background: "#d4235e", border: "none", color: "white", width: "42px", height: "42px", borderRadius: "12px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(212,35,94,0.4)" }}>
              🛒
              {totalItems > 0 && (
                <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "white", color: "#d4235e", borderRadius: "50%", fontSize: "0.58rem", fontWeight: "900", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Page Title ── */}
      <div style={{ background: "linear-gradient(135deg, #1c0f18 0%, #3a1430 60%, #1c0f18 100%)", padding: "4rem 2rem 3.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div style={{ position: "relative" }}>
          <p style={{ color: "var(--accent)", fontSize: "0.65rem", letterSpacing: "0.3em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.75rem" }}>FRESH DAILY</p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: "700", marginBottom: "0.8rem" }}>Our Menu</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", maxWidth: "420px", margin: "0 auto 2rem", lineHeight: 1.65 }}>Handcrafted with love every morning in Tbilisi</p>

          {/* Search */}
          <div style={{ maxWidth: "400px", margin: "0 auto", position: "relative" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", pointerEvents: "none" }}>🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu..."
              style={{ width: "100%", padding: "0.85rem 1rem 0.85rem 2.8rem", borderRadius: "50px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: "0.9rem", outline: "none", backdropFilter: "blur(8px)", boxSizing: "border-box" }}
            />
          </div>
        </div>
      </div>

      {/* ── Products ── */}
      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "3.5rem 2rem 5rem" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", margin: "0 auto 1.2rem", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "var(--text-muted)" }}>Loading menu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🍽️</span>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>{search ? `Nothing found for "${search}"` : "Menu coming soon!"}</p>
          </div>
        ) : (
          <>
            {/* Sale section */}
            {onSale.length > 0 && (
              <div style={{ marginBottom: "3.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.8rem" }}>
                  <div>
                    <p style={{ color: "var(--accent)", fontSize: "0.62rem", letterSpacing: "0.22em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.3rem" }}>LIMITED TIME</p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: "700", color: "var(--text)" }}>🏷 On Sale</h2>
                  </div>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.72rem", fontWeight: "700", padding: "0.3rem 0.9rem", borderRadius: "50px" }}>{onSale.length} items</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: "1.6rem" }}>
                  {onSale.map((p) => (
                    <ProductCard key={p.id} p={p} isDark={isDark} added={addedIds.has(p.id)} onAdd={() => addToCart(p)} />
                  ))}
                </div>
              </div>
            )}

            {/* All / Regular section */}
            {regular.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.8rem" }}>
                  <div>
                    <p style={{ color: "var(--accent)", fontSize: "0.62rem", letterSpacing: "0.22em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.3rem" }}>FRESH TODAY</p>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: "700", color: "var(--text)" }}>Full Menu</h2>
                  </div>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)", fontSize: "0.72rem", fontWeight: "700", padding: "0.3rem 0.9rem", borderRadius: "50px" }}>{regular.length} items</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))", gap: "1.6rem" }}>
                  {regular.map((p) => (
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
        <div style={{ position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)", zIndex: 40 }}>
          <button onClick={() => setCartOpen(true)} style={{ background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem 2.2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 32px rgba(212,35,94,0.5)", display: "flex", alignItems: "center", gap: "0.75rem", whiteSpace: "nowrap" }}>
            <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50px", padding: "0.1rem 0.55rem", fontSize: "0.8rem", fontWeight: "900" }}>{totalItems}</span>
            View Cart · ₾{cart.reduce((s, i) => s + Number(i.price) * i.qty, 0).toFixed(2)}
          </button>
        </div>
      )}

      {cartOpen && <Cart cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} onOrder={() => { setCartOpen(false); setOrderOpen(true); }} />}
      {orderOpen && (
        <OrderForm
          cart={cart}
          backendUrl={BACKEND_URL}
          onClose={() => setOrderOpen(false)}
          onSuccess={(code) => { setCart([]); setOrderOpen(false); setOrderCode(code); setOrderSuccess(true); }}
        />
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}
    </div>
  );
}

// ── Product Card ───────────────────────────────────────────────────────────────
function ProductCard({ p, isDark, added, onAdd }) {
  const [hovered, setHovered] = useState(false);

  if (p.image_data) {
    return (
      <div
        style={{ borderRadius: "22px", overflow: "hidden", cursor: "pointer", boxShadow: hovered ? "0 28px 64px rgba(0,0,0,0.28)" : "0 4px 24px rgba(0,0,0,0.1)", transform: hovered ? "translateY(-8px) scale(1.01)" : "translateY(0) scale(1)", transition: "transform 0.3s ease, box-shadow 0.3s ease", position: "relative" }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: "relative", height: "290px" }}>
          <img src={p.image_data} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease", transform: hovered ? "scale(1.04)" : "scale(1)" }} alt={p.name} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)" }} />
          {p.sale_price ? (
            <div style={{ position: "absolute", top: "0.9rem", right: "0.9rem", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.6rem", fontWeight: "800", padding: "0.24rem 0.75rem", borderRadius: "50px", letterSpacing: "0.1em", boxShadow: "0 4px 12px rgba(212,35,94,0.5)" }}>🏷 SALE</div>
          ) : (
            <div style={{ position: "absolute", top: "0.9rem", right: "0.9rem", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", color: "rgba(255,255,255,0.92)", fontSize: "0.6rem", fontWeight: "800", padding: "0.24rem 0.75rem", borderRadius: "50px", letterSpacing: "0.1em" }}>✓ FRESH TODAY</div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.6rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.3rem", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{p.name}</h3>
            {p.description && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.77rem", marginBottom: "0.9rem", lineHeight: 1.45 }}>{p.description}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {p.sale_price && <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", textDecoration: "line-through", marginRight: "0.5rem" }}>₾{Number(p.price).toFixed(2)}</span>}
                <span style={{ fontFamily: "'Playfair Display', serif", color: p.sale_price ? "#ff8fab" : "white", fontWeight: "800", fontSize: "1.35rem" }}>₾{Number(p.sale_price || p.price).toFixed(2)}</span>
              </div>
              <button style={{ background: added ? "#22c55e" : "rgba(212,35,94,0.95)", backdropFilter: "blur(8px)", color: "white", border: "none", padding: "0.55rem 1.3rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "background 0.25s, transform 0.15s", transform: hovered ? "scale(1.06)" : "scale(1)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} onClick={onAdd}>
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
      style={{ background: "var(--bg-card)", borderRadius: "22px", overflow: "hidden", boxShadow: hovered ? "0 22px 52px var(--shadow-md)" : "0 4px 24px var(--shadow)", transform: hovered ? "translateY(-8px)" : "translateY(0)", transition: "transform 0.3s ease, box-shadow 0.3s ease", border: "1px solid var(--border)" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div style={{ background: isDark ? "linear-gradient(135deg, rgba(212,35,94,0.09), rgba(100,20,50,0.18))" : "linear-gradient(135deg, #fff0f5, #ffdae8)", height: "178px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: "4.5rem", filter: hovered ? "drop-shadow(0 10px 20px rgba(212,35,94,0.32))" : "none", transition: "filter 0.3s, transform 0.3s", transform: hovered ? "scale(1.1)" : "scale(1)", display: "block" }}>{p.emoji}</span>
        {p.sale_price ? (
          <div style={{ position: "absolute", top: "0.85rem", right: "0.85rem", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.6rem", fontWeight: "800", padding: "0.22rem 0.7rem", borderRadius: "50px", letterSpacing: "0.08em", boxShadow: "0 4px 12px rgba(212,35,94,0.45)" }}>🏷 SALE</div>
        ) : (
          <div style={{ position: "absolute", top: "0.85rem", right: "0.85rem", background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)", fontSize: "0.6rem", fontWeight: "800", padding: "0.22rem 0.7rem", borderRadius: "50px", letterSpacing: "0.08em" }}>✓ FRESH</div>
        )}
      </div>
      <div style={{ padding: "1.3rem 1.6rem 1.6rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.08rem", fontWeight: "700", color: "var(--text)", marginBottom: "0.4rem" }}>{p.name}</h3>
        {p.description && <p style={{ color: "var(--text-muted)", fontSize: "0.79rem", lineHeight: 1.6, marginBottom: "0.8rem" }}>{p.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <div>
            <div style={{ color: "var(--text-faint)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>{p.sale_price ? "Sale Price" : "Price"}</div>
            {p.sale_price && <span style={{ color: "var(--text-faint)", fontSize: "0.82rem", textDecoration: "line-through", marginRight: "0.4rem" }}>₾{Number(p.price).toFixed(2)}</span>}
            <span style={{ color: "var(--accent)", fontWeight: "800", fontSize: "1.25rem", fontFamily: "'Playfair Display', serif" }}>₾{Number(p.sale_price || p.price).toFixed(2)}</span>
          </div>
          <button style={{ background: added ? "#22c55e" : "var(--accent)", color: "white", border: "none", padding: "0.6rem 1.35rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "background 0.25s, transform 0.15s", transform: hovered ? "scale(1.05)" : "scale(1)", boxShadow: added ? "0 4px 14px rgba(34,197,94,0.35)" : "0 4px 16px rgba(212,35,94,0.3)" }} onClick={onAdd}>
            {added ? "✓ Added!" : "+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
