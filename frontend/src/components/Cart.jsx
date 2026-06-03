export default function Cart({ cart, setCart, onClose, onOrder }) {
  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
        .filter((i) => i.qty > 0)
    );
  };

  return (
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
                <span>{item.emoji} {item.name}</span>
                <div style={s.qtyRow}>
                  <button style={s.qtyBtn} onClick={() => updateQty(item.id, -1)}>−</button>
                  <span style={s.qty}>{item.qty}</span>
                  <button style={s.qtyBtn} onClick={() => updateQty(item.id, 1)}>+</button>
                  <span style={s.itemTotal}>${(Number(item.price) * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
            <div style={s.total}>Total: <strong>${total.toFixed(2)}</strong></div>
            <button style={s.orderBtn} onClick={onOrder}>Place Order</button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100 },
  drawer: { position: "fixed", right: 0, top: 0, bottom: 0, width: "360px", background: "white", padding: "1.5rem", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.2)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" },
  title: { margin: 0, color: "#e91e8c" },
  close: { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#888" },
  empty: { textAlign: "center", color: "#aaa", marginTop: "3rem" },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 0", borderBottom: "1px solid #f0f0f0" },
  qtyRow: { display: "flex", alignItems: "center", gap: "0.5rem" },
  qtyBtn: { background: "#f0f0f0", border: "none", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "1rem" },
  qty: { minWidth: "20px", textAlign: "center", fontWeight: "bold" },
  itemTotal: { color: "#e91e8c", fontWeight: "bold", minWidth: "60px", textAlign: "right" },
  total: { marginTop: "1.5rem", fontSize: "1.2rem", textAlign: "right" },
  orderBtn: { marginTop: "1rem", width: "100%", background: "#e91e8c", color: "white", border: "none", padding: "1rem", borderRadius: "10px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" },
};
