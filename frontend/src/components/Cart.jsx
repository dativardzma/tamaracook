import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "./AuthModal";

export default function Cart({ cart, setCart, onClose, onOrder }) {
  const { isDark } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const totalItems = cart.reduce((a, i) => a + i.qty, 0);

  const updateQty = (id, delta) =>
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));

  const clearCart = () => { if (confirm("Remove all items?")) setCart([]); };

  const handleOrder = () => {
    if (!localStorage.getItem("token")) { setShowAuth(true); return; }
    onOrder();
  };

  const c = isDark ? dc : lc;

  return (
    <>
      <div style={s.overlay} onClick={onClose}>
        <div style={{ ...s.drawer, background: c.bg, boxShadow: c.shadow }} onClick={(e) => e.stopPropagation()}>

          <div style={{ ...s.header, borderBottom: `1px solid ${c.border}` }}>
            <div>
              <h2 style={{ ...s.title, color: c.text }}>Your Cart</h2>
              <p style={{ ...s.count, color: c.muted }}>
                {cart.length === 0 ? "Nothing added yet" : `${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              {cart.length > 0 && (
                <button style={{ ...s.clearBtn, background: c.clearBg, color: "#d4235e" }} onClick={clearCart}>Clear</button>
              )}
              <button style={{ ...s.closeBtn, background: c.closeBg, color: c.muted }} onClick={onClose}>✕</button>
            </div>
          </div>

          {cart.length === 0 ? (
            <div style={s.empty}>
              <div style={{ ...s.emptyIllust, background: isDark ? "rgba(212,35,94,0.08)" : "linear-gradient(135deg, #fff0f5, #ffdae8)" }}>
                <span style={{ fontSize: "2.4rem" }}>🛒</span>
              </div>
              <p style={{ ...s.emptyTitle, color: c.text }}>Your cart is empty</p>
              <p style={{ ...s.emptySub, color: c.muted }}>Browse our menu and add some treats!</p>
              <button style={s.browseBtn} onClick={onClose}>Browse Menu</button>
            </div>
          ) : (
            <div style={s.body}>
              <div style={s.items}>
                {cart.map((item) => (
                  <div key={item.id} style={{ ...s.item, borderBottom: `1px solid ${c.border}` }}>
                    <div style={{ ...s.itemEmojiWrap, background: isDark ? "rgba(212,35,94,0.08)" : "linear-gradient(135deg, #fff0f5, #ffdae8)" }}>
                      {item.image_data
                        ? <img src={item.image_data} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} alt={item.name} />
                        : <span style={{ fontSize: "1.6rem" }}>{item.emoji}</span>
                      }
                    </div>
                    <div style={s.itemInfo}>
                      <p style={{ ...s.itemName, color: c.text }}>{item.name}</p>
                      <p style={{ ...s.itemUnit, color: c.muted }}>₾{Number(item.price).toFixed(2)} each</p>
                    </div>
                    <div style={s.itemRight}>
                      <div style={{ ...s.qtyRow, background: isDark ? "rgba(255,255,255,0.06)" : "#f8f0f5" }}>
                        <button style={{ ...s.qtyBtn, color: "#d4235e" }} onClick={() => updateQty(item.id, -1)}>−</button>
                        <span style={{ ...s.qty, color: c.text }}>{item.qty}</span>
                        <button style={{ ...s.qtyBtn, color: "#d4235e" }} onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                      <span style={s.itemTotal}>₾{(Number(item.price) * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...s.footer, borderTop: `1px solid ${c.border}`, background: isDark ? "rgba(255,255,255,0.02)" : "#fdf8fb" }}>
                {/* Free delivery progress bar */}
                {(() => {
                  const FREE_THRESHOLD = 30;
                  const pct = Math.min(100, (total / FREE_THRESHOLD) * 100);
                  const remaining = Math.max(0, FREE_THRESHOLD - total);
                  return (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                        <span style={{ fontSize: "0.73rem", color: remaining === 0 ? (isDark ? "#4ade80" : "#2e7d32") : c.muted, fontWeight: "600" }}>
                          {remaining === 0 ? "🎉 Free delivery unlocked!" : `🚚 Add ₾${remaining.toFixed(2)} for free delivery`}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: c.muted }}>{Math.round(pct)}%</span>
                      </div>
                      <div style={{ height: "5px", background: isDark ? "rgba(255,255,255,0.07)" : "#f0e6ec", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: remaining === 0 ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #d4235e, #a01848)", borderRadius: "3px", transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })()}
                <div style={s.totalRow}>
                  <div>
                    <span style={{ ...s.totalLabel, color: c.text }}>Subtotal</span>
                    <p style={{ ...s.totalSmall, color: c.muted }}>{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                  </div>
                  <span style={{ ...s.totalAmount, color: c.text }}>₾{total.toFixed(2)}</span>
                </div>
                <button style={s.orderBtn} onClick={handleOrder}>
                  Place Order · ₾{total.toFixed(2)}
                </button>
                <p style={{ ...s.orderNote, color: c.muted }}>We'll send a verification code to your phone</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); onOrder(); }} />
      )}
    </>
  );
}

const lc = { bg: "white", shadow: "-16px 0 60px rgba(0,0,0,0.18)", text: "#1c0f18", muted: "#8b6070", border: "#f2eaee", clearBg: "#fdf0f5", closeBg: "#f5eef2" };
const dc = { bg: "#1b1320", shadow: "-16px 0 60px rgba(0,0,0,0.5)", text: "#f0ecf4", muted: "#9878a8", border: "rgba(255,255,255,0.07)", clearBg: "rgba(212,35,94,0.1)", closeBg: "rgba(255,255,255,0.07)" };

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, backdropFilter: "blur(4px)" },
  drawer: { position: "fixed", right: 0, top: 0, bottom: 0, width: "min(430px, 100vw)", display: "flex", flexDirection: "column" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.8rem 1.8rem 1.3rem" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.45rem", fontWeight: "700" },
  count: { fontSize: "0.78rem", marginTop: "0.2rem" },
  clearBtn: { border: "none", fontSize: "0.78rem", fontWeight: "600", padding: "0.3rem 0.8rem", borderRadius: "8px", cursor: "pointer" },
  closeBtn: { border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", textAlign: "center" },
  emptyIllust: { width: "90px", height: "90px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2rem" },
  emptyTitle: { fontWeight: "700", fontSize: "1rem", fontFamily: "'Playfair Display', serif", marginBottom: "0.4rem" },
  emptySub: { fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.5rem" },
  browseBtn: { background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.75rem 1.8rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600" },
  body: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  items: { flex: 1, overflowY: "auto", padding: "0.5rem 1.8rem" },
  item: { display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0" },
  itemEmojiWrap: { width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontWeight: "600", fontSize: "0.88rem", margin: "0 0 0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  itemUnit: { fontSize: "0.74rem", margin: 0 },
  itemRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 },
  qtyRow: { display: "flex", alignItems: "center", gap: "0.4rem", borderRadius: "50px", padding: "3px 8px" },
  qtyBtn: { background: "none", border: "none", width: "22px", height: "22px", borderRadius: "50%", cursor: "pointer", fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 },
  qty: { minWidth: "18px", textAlign: "center", fontWeight: "700", fontSize: "0.82rem" },
  itemTotal: { color: "#d4235e", fontWeight: "700", fontSize: "0.88rem" },
  footer: { padding: "1.2rem 1.8rem 1.8rem" },
  deliveryNote: { fontSize: "0.76rem", fontWeight: "500", padding: "0.5rem 1rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" },
  totalLabel: { fontWeight: "600", fontSize: "0.9rem" },
  totalSmall: { fontSize: "0.74rem", marginTop: "0.1rem" },
  totalAmount: { fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.7rem" },
  orderBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", marginBottom: "0.6rem" },
  orderNote: { textAlign: "center", fontSize: "0.74rem" },
};
