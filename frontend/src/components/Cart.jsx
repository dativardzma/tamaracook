import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import AuthModal from "./AuthModal";

export default function Cart({ cart, setCart, onClose, onOrder }) {
  const { isDark } = useTheme();
  const [showAuth, setShowAuth] = useState(false);
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const savings = cart.reduce((s, i) => i.sale_price ? s + (Number(i.price) - Number(i.sale_price)) * i.qty : s, 0);
  const totalItems = cart.reduce((a, i) => a + i.qty, 0);
  const FREE_THRESHOLD = 30;
  const pct = Math.min(100, (total / FREE_THRESHOLD) * 100);
  const remaining = Math.max(0, FREE_THRESHOLD - total);

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
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 100, backdropFilter: "blur(6px)" }} onClick={onClose}>
        <div
          style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(440px, 100vw)", background: c.bg, boxShadow: c.shadow, display: "flex", flexDirection: "column" }}
          onClick={(e) => e.stopPropagation()}
        >

          {/* ── Header ── */}
          <div style={{ padding: "1.6rem 1.8rem 1.2rem", borderBottom: `1px solid ${c.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.2rem" }}>
                <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #d4235e, #a01848)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem" }}>🛒</div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: "700", color: c.text }}>Your Cart</h2>
                {cart.length > 0 && (
                  <span style={{ background: "#d4235e", color: "white", fontSize: "0.62rem", fontWeight: "800", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{totalItems}</span>
                )}
              </div>
              <p style={{ color: c.muted, fontSize: "0.77rem", margin: 0 }}>
                {cart.length === 0 ? "Nothing added yet" : `${cart.length} product${cart.length !== 1 ? "s" : ""} · ₾${total.toFixed(2)}`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {cart.length > 0 && (
                <button style={{ background: isDark ? "rgba(212,35,94,0.1)" : "#fdf0f5", border: "none", color: "#d4235e", fontSize: "0.75rem", fontWeight: "600", padding: "0.3rem 0.75rem", borderRadius: "8px", cursor: "pointer" }} onClick={clearCart}>Clear</button>
              )}
              <button style={{ background: c.closeBg, border: "none", color: c.muted, width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>✕</button>
            </div>
          </div>

          {cart.length === 0 ? (
            /* ── Empty State ── */
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ position: "relative", width: "100px", height: "100px", marginBottom: "1.4rem" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: isDark ? "rgba(212,35,94,0.08)" : "linear-gradient(135deg, #fff0f5, #ffdae8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>🛒</div>
                <div style={{ position: "absolute", bottom: 0, right: 0, width: "30px", height: "30px", borderRadius: "50%", background: isDark ? "#1b1320" : "white", border: "2px solid #d4235e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#d4235e", fontWeight: "700" }}>?</div>
              </div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.1rem", color: c.text, marginBottom: "0.5rem" }}>Your cart is empty</p>
              <p style={{ color: c.muted, fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "0.9rem" }}>Browse our freshly baked treats and add your favourites!</p>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "1.6rem" }}>
                {["🍰 Cakes", "🥐 Pastries", "🍫 Chocolates"].map((t) => (
                  <span key={t} style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f5eef2", color: c.muted, fontSize: "0.72rem", padding: "0.25rem 0.65rem", borderRadius: "50px" }}>{t}</span>
                ))}
              </div>
              <button style={{ background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.75rem 2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", boxShadow: "0 6px 18px rgba(212,35,94,0.3)" }} onClick={onClose}>
                Browse Menu →
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* ── Items ── */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0.8rem 1.8rem" }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.9rem 0", borderBottom: `1px solid ${c.border}` }}>
                    <div style={{ width: "62px", height: "62px", borderRadius: "14px", flexShrink: 0, overflow: "hidden", background: isDark ? "rgba(212,35,94,0.08)" : "linear-gradient(135deg, #fff0f5, #ffdae8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {item.image_data
                        ? <img src={item.image_data} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={item.name} />
                        : <span style={{ fontSize: "1.7rem" }}>{item.emoji}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: "600", fontSize: "0.88rem", color: c.text, margin: "0 0 0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                      <p style={{ color: c.muted, fontSize: "0.73rem", margin: 0 }}>₾{Number(item.price).toFixed(2)} each</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.4rem", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", background: isDark ? "rgba(255,255,255,0.06)" : "#f8f0f5", borderRadius: "50px", padding: "2px 6px", gap: "0.2rem" }}>
                        <button style={{ background: "none", border: "none", color: "#d4235e", width: "24px", height: "24px", borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => updateQty(item.id, -1)}>−</button>
                        <span style={{ color: c.text, fontWeight: "700", fontSize: "0.82rem", minWidth: "20px", textAlign: "center" }}>{item.qty}</span>
                        <button style={{ background: "none", border: "none", color: "#d4235e", width: "24px", height: "24px", borderRadius: "50%", cursor: "pointer", fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => updateQty(item.id, 1)}>+</button>
                      </div>
                      <span style={{ color: "#d4235e", fontWeight: "700", fontSize: "0.88rem" }}>₾{(Number(item.price) * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Footer ── */}
              <div style={{ padding: "1.1rem 1.8rem 1.7rem", borderTop: `1px solid ${c.border}`, background: isDark ? "rgba(255,255,255,0.02)" : "#fdf8fb" }}>

                {/* Free delivery bar */}
                <div style={{ marginBottom: "0.9rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.72rem", color: remaining === 0 ? "#22c55e" : c.muted, fontWeight: "600" }}>
                      {remaining === 0 ? "🎉 Free delivery unlocked!" : `🚚 ₾${remaining.toFixed(2)} more for free delivery`}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: c.muted }}>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ height: "6px", background: isDark ? "rgba(255,255,255,0.07)" : "#f0e6ec", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: remaining === 0 ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #d4235e, #a01848)", borderRadius: "3px", transition: "width 0.4s ease" }} />
                  </div>
                </div>

                {/* Savings badge */}
                {savings > 0 && (
                  <div style={{ background: isDark ? "rgba(34,197,94,0.08)" : "#f0fdf4", border: `1px solid ${isDark ? "rgba(34,197,94,0.15)" : "#bbf7d0"}`, borderRadius: "10px", padding: "0.48rem 0.9rem", marginBottom: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem" }}>🎉</span>
                    <span style={{ color: isDark ? "#4ade80" : "#16a34a", fontSize: "0.74rem", fontWeight: "600" }}>You're saving ₾{savings.toFixed(2)} on sale items!</span>
                  </div>
                )}

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <p style={{ fontWeight: "700", fontSize: "0.9rem", color: c.text, margin: 0 }}>Total</p>
                    <p style={{ color: c.muted, fontSize: "0.72rem", margin: "2px 0 0" }}>{totalItems} item{totalItems !== 1 ? "s" : ""} · incl. all fees</p>
                  </div>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: "800", fontSize: "1.75rem", color: c.text }}>₾{total.toFixed(2)}</span>
                </div>

                <button
                  style={{ width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 6px 20px rgba(212,35,94,0.35)", marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", transition: "transform 0.15s, box-shadow 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 28px rgba(212,35,94,0.42)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(212,35,94,0.35)"; }}
                  onClick={handleOrder}
                >
                  Place Order · ₾{total.toFixed(2)} →
                </button>
                <p style={{ textAlign: "center", color: c.muted, fontSize: "0.72rem", margin: 0 }}>
                  🔒 Secure · We'll contact you to confirm
                </p>
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

const lc = { bg: "white", shadow: "-16px 0 60px rgba(0,0,0,0.18)", text: "#1c0f18", muted: "#8b6070", border: "#f2eaee", closeBg: "#f5eef2" };
const dc = { bg: "#1b1320", shadow: "-16px 0 60px rgba(0,0,0,0.5)", text: "#f0ecf4", muted: "#9878a8", border: "rgba(255,255,255,0.07)", closeBg: "rgba(255,255,255,0.07)" };
