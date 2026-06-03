import { useEffect, useState } from "react";
import Cart from "./components/Cart";
import OrderForm from "./components/OrderForm";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

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
        <h1 style={s.title}>🍰 Sakonditro Shop</h1>
        <p style={s.sub}>Fresh baked goods, made with love</p>
        <button style={s.cartBtn} onClick={() => setCartOpen(true)}>
          🛒 Cart {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
        </button>
      </header>

      <main style={s.main}>
        {loading && <p style={s.msg}>Loading...</p>}
        <div style={s.grid}>
          {products.map((p) => (
            <div key={p.id} style={s.card}>
              <span style={s.emoji}>{p.emoji}</span>
              <h2 style={s.name}>{p.name}</h2>
              <p style={s.price}>${Number(p.price).toFixed(2)}</p>
              <button style={s.btn} onClick={() => addToCart(p)}>Add to cart</button>
            </div>
          ))}
        </div>
      </main>

      {cartOpen && (
        <Cart
          cart={cart}
          setCart={setCart}
          onClose={() => setCartOpen(false)}
          onOrder={() => { setCartOpen(false); setOrderOpen(true); }}
        />
      )}

      {orderOpen && (
        <OrderForm
          cart={cart}
          backendUrl={BACKEND_URL}
          onClose={() => setOrderOpen(false)}
          onSuccess={() => {
            setCart([]);
            setOrderOpen(false);
            setOrderSuccess(true);
            setTimeout(() => setOrderSuccess(false), 4000);
          }}
        />
      )}

      {orderSuccess && (
        <div style={s.toast}>✅ Order placed! We'll call you soon.</div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#fff0f6", fontFamily: "sans-serif" },
  header: { background: "#e91e8c", padding: "2rem", textAlign: "center", position: "relative" },
  title: { color: "white", margin: 0, fontSize: "2.5rem" },
  sub: { color: "#fce4ec", margin: "0.5rem 0 0" },
  cartBtn: { position: "absolute", top: "1.5rem", right: "1.5rem", background: "white", color: "#e91e8c", border: "none", padding: "0.6rem 1.2rem", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" },
  badge: { background: "#e91e8c", color: "white", borderRadius: "50%", padding: "0 6px", marginLeft: "6px", fontSize: "0.8rem" },
  main: { padding: "2rem" },
  msg: { textAlign: "center", color: "#888" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" },
  card: { background: "white", borderRadius: "12px", padding: "1.5rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  emoji: { fontSize: "3rem" },
  name: { fontSize: "1.1rem", margin: "0.5rem 0", color: "#333" },
  price: { color: "#e91e8c", fontWeight: "bold", fontSize: "1.2rem" },
  btn: { marginTop: "1rem", background: "#e91e8c", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" },
  toast: { position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "#4caf50", color: "white", padding: "1rem 2rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "bold", zIndex: 1000 },
};
