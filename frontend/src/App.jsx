import { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load products.");
        setLoading(false);
      });
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>🍰 Sakonditro Shop</h1>
        <p style={styles.subtitle}>Fresh baked goods, made with love</p>
      </header>

      <main style={styles.main}>
        {loading && <p style={styles.message}>Loading...</p>}
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.grid}>
          {products.map((p) => (
            <div key={p.id} style={styles.card}>
              <span style={styles.emoji}>{p.emoji}</span>
              <h2 style={styles.name}>{p.name}</h2>
              <p style={styles.price}>${p.price}</p>
              <button style={styles.button}>Add to cart</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#fff0f6", fontFamily: "sans-serif" },
  header: { background: "#e91e8c", padding: "2rem", textAlign: "center" },
  title: { color: "white", margin: 0, fontSize: "2.5rem" },
  subtitle: { color: "#fce4ec", margin: "0.5rem 0 0" },
  main: { padding: "2rem" },
  message: { textAlign: "center", color: "#888" },
  error: { textAlign: "center", color: "red" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" },
  card: { background: "white", borderRadius: "12px", padding: "1.5rem", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  emoji: { fontSize: "3rem" },
  name: { fontSize: "1.1rem", margin: "0.5rem 0", color: "#333" },
  price: { color: "#e91e8c", fontWeight: "bold", fontSize: "1.2rem" },
  button: { marginTop: "1rem", background: "#e91e8c", color: "white", border: "none", padding: "0.5rem 1.2rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" },
};
