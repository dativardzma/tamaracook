import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ProductModal({ product, onClose, onAdd, alreadyAdded }) {
  const { isDark } = useTheme();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const p = product;
  const displayPrice = p.sale_price ? Number(p.sale_price) : Number(p.price);
  const totalPrice = (displayPrice * qty).toFixed(2);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) onAdd(p);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 900);
  };

  const c = isDark ? dc : lc;

  const CATEGORY_COLORS = {
    Cakes: ["#fce4ec", "#d4235e"],
    Pastries: ["#fff3e0", "#e65100"],
    Chocolates: ["#efebe9", "#4e342e"],
    Cookies: ["#fff8e1", "#f57f17"],
    Sweets: ["#f3e5f5", "#6a1b9a"],
    Special: ["#e8f5e9", "#2e7d32"],
  };
  const [catBg, catTxt] = (p.category && CATEGORY_COLORS[p.category]) || ["#f5f0ff", "#5b21b6"];

  return (
    <div style={s.overlay} onClick={onClose}>
      <div
        style={{ ...s.modal, background: c.bg, boxShadow: c.shadow }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button style={{ ...s.closeBtn, background: c.closeBg, color: c.closeTxt }} onClick={onClose}>✕</button>

        {/* Hero image / emoji */}
        <div style={{ ...s.hero, background: isDark ? "rgba(255,255,255,0.04)" : "#fdf0f5" }}>
          {p.image_data ? (
            <img src={p.image_data} alt={p.name} style={s.heroImg} />
          ) : (
            <div style={s.heroEmoji}>{p.emoji || "🍰"}</div>
          )}
          {p.sale_price && (
            <div style={s.saleBadge}>🏷 SALE</div>
          )}
        </div>

        {/* Content */}
        <div style={s.body}>
          {/* Category + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            {p.category && (
              <span style={{ background: catBg, color: catTxt, fontSize: "0.68rem", fontWeight: "700", padding: "0.18rem 0.7rem", borderRadius: "50px", letterSpacing: "0.04em" }}>
                {p.category}
              </span>
            )}
            {p.sale_price && (
              <span style={{ background: "rgba(212,35,94,0.1)", color: "#d4235e", fontSize: "0.68rem", fontWeight: "700", padding: "0.18rem 0.7rem", borderRadius: "50px" }}>
                On Sale
              </span>
            )}
          </div>

          <h2 style={{ fontFamily: "'Playfair Display', serif", color: c.text, fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.4rem", lineHeight: 1.2 }}>
            {p.name}
          </h2>

          {p.description && (
            <p style={{ color: c.muted, fontSize: "0.88rem", lineHeight: 1.65, marginBottom: "1rem" }}>
              {p.description}
            </p>
          )}

          {/* Tags */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.2rem" }}>
            {["🌅 Fresh Daily", "🏠 Homemade", "❤️ Made with Love"].map((t) => (
              <span key={t} style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#f5eef2", color: c.muted, fontSize: "0.7rem", padding: "0.25rem 0.7rem", borderRadius: "50px", fontWeight: "500" }}>
                {t}
              </span>
            ))}
          </div>

          {/* Price */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.7rem", marginBottom: "1.3rem" }}>
            {p.sale_price ? (
              <>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: "800", color: "#d4235e" }}>
                  ₾{displayPrice.toFixed(2)}
                </span>
                <span style={{ fontSize: "1rem", color: c.muted, textDecoration: "line-through" }}>
                  ₾{Number(p.price).toFixed(2)}
                </span>
                <span style={{ background: "#d4235e", color: "white", fontSize: "0.68rem", fontWeight: "800", padding: "0.2rem 0.55rem", borderRadius: "50px" }}>
                  -{Math.round((1 - displayPrice / Number(p.price)) * 100)}%
                </span>
              </>
            ) : (
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: "800", color: c.text }}>
                ₾{displayPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Quantity + Add */}
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0", background: isDark ? "rgba(255,255,255,0.06)" : "#f5eef2", borderRadius: "14px", overflow: "hidden" }}>
              <button
                style={{ background: "none", border: "none", cursor: qty <= 1 ? "not-allowed" : "pointer", width: "44px", height: "44px", fontSize: "1.3rem", color: qty <= 1 ? c.muted : c.text, transition: "color 0.15s" }}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >−</button>
              <span style={{ color: c.text, fontWeight: "700", fontSize: "1rem", minWidth: "28px", textAlign: "center" }}>{qty}</span>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", width: "44px", height: "44px", fontSize: "1.3rem", color: c.text }}
                onClick={() => setQty((q) => q + 1)}
              >+</button>
            </div>

            <button
              style={{ flex: 1, padding: "0 1.2rem", height: "44px", background: added ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", borderRadius: "14px", fontWeight: "700", fontSize: "0.92rem", cursor: "pointer", transition: "background 0.25s", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              onClick={handleAdd}
              disabled={added}
            >
              {added ? (
                <><span>✓</span> Added!</>
              ) : (
                <>{alreadyAdded ? "Add More" : "Add to Cart"} — ₾{totalPrice}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const lc = {
  bg: "white", shadow: "0 40px 80px rgba(0,0,0,0.2)", text: "#1c0f18", muted: "#8b6070",
  closeBg: "#f5eef2", closeTxt: "#8b6070",
};
const dc = {
  bg: "#1b1320", shadow: "0 40px 80px rgba(0,0,0,0.55)", text: "#f0ecf4", muted: "#9878a8",
  closeBg: "rgba(255,255,255,0.08)", closeTxt: "#9878a8",
};

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "1rem" },
  modal: { borderRadius: "28px", width: "100%", maxWidth: "420px", position: "relative", overflow: "hidden", maxHeight: "92vh", overflowY: "auto" },
  closeBtn: { position: "absolute", top: "1rem", right: "1rem", border: "none", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 },
  hero: { width: "100%", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroEmoji: { fontSize: "6rem", lineHeight: 1, userSelect: "none" },
  saleBadge: { position: "absolute", top: "1rem", left: "1rem", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.7rem", fontWeight: "800", padding: "0.3rem 0.8rem", borderRadius: "50px", letterSpacing: "0.08em" },
  body: { padding: "1.4rem 1.6rem 1.8rem" },
};
