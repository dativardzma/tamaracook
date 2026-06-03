import AuthModal from "./AuthModal";
import { useState } from "react";

export default function Cart({ cart, setCart, onClose, onOrder }) {
  const [showAuth, setShowAuth] = useState(false);
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0)
    );
  };

  const handleOrder = () => {
    const token = localStorage.getItem("token");
    if (!token) { setShowAuth(true); return; }
    onOrder();
  };

  return (
    <>
      <div style={s.overlay} onClick={onClose}>
        <div style={s.drawer} onClick={(e) => e.stopPropagation()}>
          <div style={s.header}>
            <h2 style={s.title}>🛒 Your Cart</h2>
            <button style={s.close} onClick={onClose}>✕</button>
          </div>

          {cart.length === 0 ? (
            <p style={s.empty}>Your cart is empty</p>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} style={s.item}>
                  <span style={s.itemName}>{item.emoji} {item.name}</span>
                  <div style={s.qtyRow}>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                    <span style={s.qty}>{item.qty}</span>
                    <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                    <span style={s.itemTotal}>₾{(Number(item.price) * item.qty).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={s.total}>Total: <strong>₾{total.toFixed(2)}</strong></div>
              <button style={s.orderBtn} onClick={handleOrder}>Place Order</button>
            </>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => { setShowAuth(false); onOrder(); }}
        />
      )}
    </>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 },
  drawer: { position: "fixed", right: 0, top: 0, bottom: 0, width: "380px", background: "white", padding: "2rem", overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.15)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  title: { margin: 0, color: "#e91e8c", fontSize: "1.3rem" },
  close: { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#aaa" },
  empty: { textAlign: "center", color: "#aaa", marginTop: "3rem" },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px solid #f5f5f5" },
  itemName: { fontSize: "0.95rem", color: "#333" },
  qtyRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  qtyBtn: { background: "#f5f5f5", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "1rem", fontWeight: "600" },
  qty: { minWidth: "24px", textAlign: "center", fontWeight: "700" },
  itemTotal: { color: "#e91e8c", fontWeight: "700", minWidth: "65px", textAlign: "right" },
  total: { marginTop: "1.5rem", fontSize: "1.2rem", textAlign: "right", fontWeight: "500" },
  orderBtn: { marginTop: "1rem", width: "100%", background: "linear-gradient(135deg, #e91e8c, #c2185b)", color: "white", border: "none", padding: "1rem", borderRadius: "12px", fontSize: "1rem", fontWeight: "600", cursor: "pointer" },
};
