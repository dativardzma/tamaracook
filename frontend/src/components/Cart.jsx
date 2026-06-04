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
            <div>
              <h2 style={s.title}>Your Cart</h2>
              {cart.length > 0 && <p style={s.count}>{cart.reduce((a, i) => a + i.qty, 0)} item{cart.reduce((a, i) => a + i.qty, 0) !== 1 ? "s" : ""}</p>}
            </div>
            <button style={s.closeBtn} onClick={onClose}>✕</button>
          </div>

          {cart.length === 0 ? (
            <div style={s.empty}>
              <span style={s.emptyIcon}>🛒</span>
              <p style={s.emptyTitle}>Your cart is empty</p>
              <p style={s.emptySub}>Add some treats to get started</p>
            </div>
          ) : (
            <div style={s.body}>
              <div style={s.items}>
                {cart.map((item) => (
                  <div key={item.id} style={s.item}>
                    <span style={s.itemEmoji}>{item.emoji}</span>
                    <div style={s.itemInfo}>
                      <p style={s.itemName}>{item.name}</p>
                      <p style={s.itemUnit}>₾{Number(item.price).toFixed(2)} each</p>
                    </div>
                    <div style={s.itemRight}>
                      <div style={s.qtyRow}>
                        <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                        <span style={s.qty}>{item.qty}</span>
                        <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                      <span style={s.itemTotal}>₾{(Number(item.price) * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={s.footer}>
                <div style={s.totalRow}>
                  <span style={s.totalLabel}>Total</span>
                  <span style={s.totalAmount}>₾{total.toFixed(2)}</span>
                </div>
                <button style={s.orderBtn} onClick={handleOrder}>Place Order →</button>
              </div>
            </div>
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
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.55)", zIndex: 100, backdropFilter: "blur(3px)" },
  drawer: { position: "fixed", right: 0, top: 0, bottom: 0, width: "min(420px, 100vw)", background: "white", display: "flex", flexDirection: "column", boxShadow: "-12px 0 50px rgba(0,0,0,0.18)" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.8rem 1.8rem 1.4rem", borderBottom: "1px solid #f2eaee" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.4rem", fontWeight: "700" },
  count: { color: "#8b6070", fontSize: "0.78rem", marginTop: "0.25rem" },
  closeBtn: { background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", textAlign: "center" },
  emptyIcon: { fontSize: "3.5rem", marginBottom: "1rem" },
  emptyTitle: { color: "#1c0f18", fontWeight: "600", fontSize: "1rem", marginBottom: "0.4rem" },
  emptySub: { color: "#8b6070", fontSize: "0.85rem" },

  body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  items: { flex: 1, overflowY: "auto", padding: "0.5rem 1.8rem" },
  item: { display: "flex", alignItems: "center", gap: "0.9rem", padding: "1rem 0", borderBottom: "1px solid #faf3f7" },
  itemEmoji: { fontSize: "2rem", flexShrink: 0 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontWeight: "600", color: "#1c0f18", fontSize: "0.88rem", margin: "0 0 0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemUnit: { color: "#8b6070", fontSize: "0.75rem", margin: 0 },
  itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 },
  qtyRow: { display: "flex", alignItems: "center", gap: "0.3rem", background: "#f8f0f5", borderRadius: "50px", padding: "2px 6px" },
  qtyBtn: { background: "none", border: "none", width: "22px", height: "22px", borderRadius: "50%", cursor: "pointer", fontSize: "1rem", fontWeight: "700", color: "#d4235e", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  qty: { minWidth: "18px", textAlign: "center", fontWeight: "700", fontSize: "0.82rem", color: "#1c0f18" },
  itemTotal: { color: "#d4235e", fontWeight: "700", fontSize: "0.88rem" },

  footer: { padding: "1.4rem 1.8rem 1.8rem", borderTop: "1px solid #f2eaee", background: "#fdf8fb" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" },
  totalLabel: { color: "#6b4c58", fontWeight: "500", fontSize: "0.9rem" },
  totalAmount: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "1.6rem" },
  orderBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer", letterSpacing: "0.02em" },
};
