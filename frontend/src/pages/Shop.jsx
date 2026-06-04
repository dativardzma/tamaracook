import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cart from "../components/Cart";
import OrderForm from "../components/OrderForm";
import AuthModal from "../components/AuthModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("email"));
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.brand}>
            <span style={s.brandIcon}>🍰</span>
            <div>
              <div style={s.brandName}>საკონდიტრო</div>
              <div style={s.brandSub}>artisan bakery</div>
            </div>
          </div>
          <div style={s.headerActions}>
            {userEmail ? (
              <div style={s.userPill}>
                <span style={s.userDot} />
                <span style={s.userName}>{userEmail.split("@")[0]}</span>
                <button style={s.signOutLink} onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("email");
                  setUserEmail(null);
                }}>sign out</button>
              </div>
            ) : (
              <button style={s.authBtn} onClick={() => setAuthOpen(true)}>Sign In</button>
            )}
            <button style={s.cartBtn} onClick={() => setCartOpen(true)}>
              🛒 Cart
              {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      <section style={s.hero}>
        <div style={s.heroInner}>
          <p style={s.heroKicker}>Fresh from the oven, every day</p>
          <h1 style={s.heroTitle}>Handcrafted with love,<br />delivered to you</h1>
          <p style={s.heroSub}>Premium pastries, cakes & sweets made with the finest ingredients</p>
        </div>
      </section>

      <main style={s.main}>
        <h2 style={s.sectionTitle}>Our Menu</h2>
        {loading ? (
          <div style={s.loading}>
            <span style={s.spinner}>🍰</span>
            <p style={s.loadingText}>Loading treats...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={s.loading}>
            <span style={s.spinner}>🍽️</span>
            <p style={s.loadingText}>No products available yet.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {products.map((p) => (
              <div
                key={p.id}
                style={s.card}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = "0 24px 48px rgba(212,35,94,0.14)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; }}
              >
                <div style={s.cardEmojiWrap}>
                  <span style={s.cardEmoji}>{p.emoji}</span>
                </div>
                <div style={s.cardBody}>
                  <h3 style={s.cardName}>{p.name}</h3>
                  <div style={s.cardFooter}>
                    <span style={s.cardPrice}>₾{Number(p.price).toFixed(2)}</span>
                    <button style={s.addBtn} onClick={() => addToCart(p)}>+ Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {cartOpen && <Cart cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} onOrder={() => { setCartOpen(false); setOrderOpen(true); }} />}
      {orderOpen && <OrderForm cart={cart} backendUrl={BACKEND_URL} onClose={() => setOrderOpen(false)} onSuccess={() => { setCart([]); setOrderOpen(false); setOrderSuccess(true); setTimeout(() => setOrderSuccess(false), 4000); }} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={() => { setUserEmail(localStorage.getItem("email")); setAuthOpen(false); }} />}
      {orderSuccess && <div style={s.toast}>✅ Order placed! We'll call you soon.</div>}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#fdf6f2", fontFamily: "'Inter', sans-serif" },

  header: { background: "#1c0f18", position: "sticky", top: 0, zIndex: 50 },
  headerInner: { maxWidth: "1200px", margin: "0 auto", padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px" },
  brand: { display: "flex", alignItems: "center", gap: "0.75rem" },
  brandIcon: { fontSize: "1.8rem" },
  brandName: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.15rem", fontWeight: "700", lineHeight: 1 },
  brandSub: { color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: "3px" },
  headerActions: { display: "flex", alignItems: "center", gap: "0.8rem" },

  userPill: { display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "50px", padding: "0.35rem 0.9rem" },
  userDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#4caf50", flexShrink: 0 },
  userName: { color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", fontWeight: "500" },
  signOutLink: { background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "0.73rem", cursor: "pointer", padding: 0 },
  authBtn: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "white", padding: "0.45rem 1.1rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.83rem", fontWeight: "500" },
  cartBtn: { background: "#d4235e", border: "none", color: "white", padding: "0.5rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600", position: "relative", display: "flex", alignItems: "center", gap: "0.4rem" },
  badge: { background: "white", color: "#d4235e", borderRadius: "50%", padding: "1px 6px", fontSize: "0.68rem", fontWeight: "800", minWidth: "18px", textAlign: "center" },

  hero: { background: "linear-gradient(145deg, #1c0f18 0%, #3a1430 55%, #6b1d40 100%)", padding: "5rem 2rem 4.5rem", textAlign: "center" },
  heroInner: { maxWidth: "680px", margin: "0 auto" },
  heroKicker: { color: "#d4a96a", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "1.2rem" },
  heroTitle: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2rem, 4.5vw, 3rem)", fontWeight: "700", lineHeight: 1.25, marginBottom: "1.1rem" },
  heroSub: { color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: "460px", margin: "0 auto" },

  main: { maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem 5rem" },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", color: "#1c0f18", fontWeight: "700", marginBottom: "2rem" },
  loading: { textAlign: "center", padding: "6rem 2rem" },
  spinner: { fontSize: "3rem", display: "block", marginBottom: "1rem" },
  loadingText: { color: "#8b6070", fontSize: "1rem" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "1.5rem" },
  card: { background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", transition: "transform 0.25s ease, box-shadow 0.25s ease" },
  cardEmojiWrap: { background: "linear-gradient(135deg, #fff0f5, #ffe0ec)", padding: "2.2rem 1rem 1.8rem", textAlign: "center" },
  cardEmoji: { fontSize: "3.8rem" },
  cardBody: { padding: "1.2rem 1.4rem 1.5rem" },
  cardName: { fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: "600", color: "#1c0f18", marginBottom: "1rem" },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardPrice: { color: "#d4235e", fontWeight: "700", fontSize: "1.15rem" },
  addBtn: { background: "#d4235e", color: "white", border: "none", padding: "0.48rem 1.1rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600" },

  toast: { position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #2e7d32, #1b5e20)", color: "white", padding: "0.9rem 2rem", borderRadius: "50px", fontSize: "0.92rem", fontWeight: "600", zIndex: 1000, boxShadow: "0 8px 30px rgba(46,125,50,0.35)", whiteSpace: "nowrap" },
};
