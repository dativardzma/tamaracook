import AuthModal from "./AuthModal";
import { useState } from "react";

export default function Cart({ cart, setCart, onClose, onOrder }) {
  const [showAuth, setShowAuth] = useState(false);
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const totalItems = cart.reduce((a, i) => a + i.qty, 0);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0)
    );
  };

  const clearCart = () => {
    if (confirm("Remove all items from your cart?")) setCart([]);
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

          {/* Header */}
          <div style={s.header}>
            <div>
              <h2 style={s.title}>Your Cart</h2>
              <p style={s.count}>
                {cart.length === 0 ? "No items yet" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div style={s.headerRight}>
              {cart.length > 0 && (
                <button style={s.clearBtn} onClick={clearCart}>Clear</button>
              )}
              <button style={s.closeBtn} onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Body */}
          {cart.length === 0 ? (
            <div style={s.empty}>
              <div style={s.emptyIllustration}>
                <span style={s.emptyIcon}>🛒</span>
              </div>
              <p style={s.emptyTitle}>Your cart is empty</p>
              <p style={s.emptySub}>Browse our menu and add some delicious treats!</p>
              <button style={s.browseBtn} onClick={onClose}>Browse Menu</button>
            </div>
          ) : (
            <div style={s.body}>
              <div style={s.items}>
                {cart.map((item) => (
                  <div key={item.id} style={s.item}>
                    <div style={s.itemEmojiWrap}>
                      <span style={s.itemEmoji}>{item.emoji}</span>
                    </div>
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
                <div style={s.deliveryNote}>
                  🚚 Free delivery for orders over ₾30
                </div>
                <div style={s.totalRow}>
                  <div>
                    <span style={s.totalLabel}>Subtotal</span>
                    <p style={s.totalSmall}>{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                  </div>
                  <span style={s.totalAmount}>₾{total.toFixed(2)}</span>
                </div>
                <button style={s.orderBtn} onClick={handleOrder}>
                  Place Order · ₾{total.toFixed(2)}
                </button>
                <p style={s.orderNote}>We'll call you to confirm your order</p>
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
  overlay: { position: "fixed", inset: 0, background: "rgba(28,15,24,0.5)", zIndex: 100, backdropFilter: "blur(4px)" },
  drawer: { position: "fixed", right: 0, top: 0, bottom: 0, width: "min(430px, 100vw)", background: "white", display: "flex", flexDirection: "column", boxShadow: "-16px 0 60px rgba(0,0,0,0.2)" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.8rem 1.8rem 1.3rem", borderBottom: "1px solid #f2eaee" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.45rem", fontWeight: "700" },
  count: { color: "#8b6070", fontSize: "0.78rem", marginTop: "0.2rem" },
  headerRight: { display: "flex", alignItems: "center", gap: "0.6rem" },
  clearBtn: { background: "#fdf0f5", border: "none", color: "#d4235e", fontSize: "0.78rem", fontWeight: "600", padding: "0.3rem 0.8rem", borderRadius: "8px", cursor: "pointer" },
  closeBtn: { background: "#f5eef2", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", color: "#8b6070", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", textAlign: "center" },
  emptyIllustration: { width: "90px", height: "90px", background: "linear-gradient(135deg, #fff0f5, #ffdae8)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2rem" },
  emptyIcon: { fontSize: "2.5rem" },
  emptyTitle: { color: "#1c0f18", fontWeight: "700", fontSize: "1rem", fontFamily: "'Playfair Display', serif", marginBottom: "0.4rem" },
  emptySub: { color: "#8b6070", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.5rem" },
  browseBtn: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.75rem 1.8rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600" },

  body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  items: { flex: 1, overflowY: "auto", padding: "0.5rem 1.8rem" },
  item: { display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid #faf3f7" },
  itemEmojiWrap: { width: "50px", height: "50px", background: "linear-gradient(135deg, #fff0f5, #ffdae8)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemEmoji: { fontSize: "1.6rem" },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontWeight: "600", color: "#1c0f18", fontSize: "0.88rem", margin: "0 0 0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemUnit: { color: "#8b6070", fontSize: "0.74rem", margin: 0 },
  itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 },
  qtyRow: { display: "flex", alignItems: "center", gap: "0.4rem", background: "#f8f0f5", borderRadius: "50px", padding: "3px 8px" },
  qtyBtn: { background: "none", border: "none", width: "22px", height: "22px", borderRadius: "50%", cursor: "pointer", fontSize: "1rem", fontWeight: "700", color: "#d4235e", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  qty: { minWidth: "18px", textAlign: "center", fontWeight: "700", fontSize: "0.82rem", color: "#1c0f18" },
  itemTotal: { color: "#d4235e", fontWeight: "700", fontSize: "0.88rem" },

  footer: { padding: "1.2rem 1.8rem 1.8rem", borderTop: "1px solid #f2eaee", background: "#fdf8fb" },
  deliveryNote: { background: "#e8f5e9", color: "#2e7d32", fontSize: "0.76rem", fontWeight: "500", padding: "0.5rem 1rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" },
  totalLabel: { color: "#1c0f18", fontWeight: "600", fontSize: "0.9rem" },
  totalSmall: { color: "#8b6070", fontSize: "0.74rem", marginTop: "0.1rem" },
  totalAmount: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "1.7rem" },
  orderBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", letterSpacing: "0.01em", marginBottom: "0.6rem" },
  orderNote: { textAlign: "center", color: "#8b6070", fontSize: "0.74rem" },
};
