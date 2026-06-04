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
        <div style={s.headerContent}>
          <div>
            <h1 style={s.title}>🍰 საკონდიტრო</h1>
            <p style={s.sub}>Fresh baked goods, made with love</p>
          </div>
          <div style={s.headerRight}>
            {userEmail ? (
              <div style={s.userInfo}>
                <span style={s.userEmail}>{userEmail}</span>
                <button style={s.signOutBtn} onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("email"); setUserEmail(null); }}>Sign Out</button>
              </div>
            ) : (
              <button style={s.authBtn} onClick={() => setAuthOpen(true)}>Sign In / Sign Up</button>
            )}
            <button style={s.cartBtn} onClick={() => setCartOpen(true)}>
              🛒{totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      <main style={s.main}>
        {loading ? (
          <div style={s.loading}>
            <span style={s.spinner}>🍰</span>
            <p>Loading treats...</p>
          </div>
        ) : (
          <div style={s.grid}>
            {products.map((p) => (
              <div key={p.id} style={s.card} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-6px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={s.emojiBox}>{p.emoji}</div>
                <h2 style={s.name}>{p.name}</h2>
                <p style={s.price}>₾{Number(p.price).toFixed(2)}</p>
                <button style={s.btn} onClick={() => addToCart(p)}>+ Add to Cart</button>
              </div>
            ))}
          </div>
        )}
      </main>

      {cartOpen && <Cart cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} onOrder={() => { setCartOpen(false); setOrderOpen(true); }} />}
      {orderOpen && <OrderForm cart={cart} backendUrl={BACKEND_URL} onClose={() => setOrderOpen(false)} onSuccess={() => { setCart([]); setOrderOpen(false); setOrderSuccess(true); setTimeout(() => setOrderSuccess(false), 4000); }} />}
      {orderSuccess && <div style={s.toast}>✅ Order placed! We'll call you soon.</div>}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={() => { setUserEmail(localStorage.getItem("email")); setAuthOpen(false); }} />}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #fff5f9 0%, #fce4ec 100%)" },
  header: { background: "linear-gradient(135deg, #e91e8c, #c2185b)", padding: "0 2rem", boxShadow: "0 4px 20px rgba(233,30,140,0.3)" },
  headerContent: { maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 0" },
  title: { color: "white", fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.5px" },
  sub: { color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", marginTop: "0.2rem" },
  headerRight: { display: "flex", gap: "0.8rem", alignItems: "center" },
  authBtn: { background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", color: "white", padding: "0.6rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", backdropFilter: "blur(10px)" },
  userInfo: { display: "flex", alignItems: "center", gap: "0.6rem" },
  userEmail: { color: "rgba(255,255,255,0.9)", fontSize: "0.85rem", fontWeight: "500" },
  signOutBtn: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "0.4rem 0.8rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.8rem" },
  cartBtn: { background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", color: "white", padding: "0.6rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontSize: "1.1rem", fontWeight: "600", backdropFilter: "blur(10px)", position: "relative" },
  badge: { background: "white", color: "#e91e8c", borderRadius: "50%", padding: "1px 6px", marginLeft: "4px", fontSize: "0.75rem", fontWeight: "700" },
  adminBtn: { background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", color: "white", padding: "0.6rem 0.8rem", borderRadius: "50%", cursor: "pointer", fontSize: "1rem" },
  main: { maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" },
  loading: { textAlign: "center", padding: "5rem", color: "#e91e8c" },
  spinner: { fontSize: "3rem", display: "block", marginBottom: "1rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.8rem" },
  card: { background: "white", borderRadius: "20px", padding: "2rem 1.5rem", textAlign: "center", boxShadow: "0 4px 20px rgba(233,30,140,0.08)", transition: "transform 0.2s ease, box-shadow 0.2s ease", border: "1px solid rgba(233,30,140,0.08)", cursor: "default" },
  emojiBox: { fontSize: "3.5rem", marginBottom: "1rem", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" },
  name: { fontSize: "1.1rem", fontWeight: "600", color: "#2d2d2d", marginBottom: "0.5rem" },
  price: { color: "#e91e8c", fontWeight: "700", fontSize: "1.3rem", marginBottom: "1.2rem" },
  btn: { background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white", border: "none", padding: "0.7rem 1.5rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", width: "100%" },
  toast: { position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #4caf50, #388e3c)", color: "white", padding: "1rem 2rem", borderRadius: "50px", fontSize: "1rem", fontWeight: "600", zIndex: 1000, boxShadow: "0 8px 30px rgba(76,175,80,0.4)" },
};
