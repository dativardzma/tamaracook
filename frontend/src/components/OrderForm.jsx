import { useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function OrderForm({ cart, backendUrl, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    customer_name: localStorage.getItem("display_name") || "",
    phone: localStorage.getItem("saved_phone") || "",
    address: "",
    order_type: "delivery",
  });
  const [codeDigits, setCodeDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resending, setResending] = useState(false);
  const digitRefs = [useRef(), useRef(), useRef(), useRef()];

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const itemsSummary = cart.map((i) => `${i.name} x${i.qty}`).join(", ");
  const otpCode = codeDigits.join("");

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...codeDigits];
    next[i] = val;
    setCodeDigits(next);
    setOtpError("");
    if (val && i < 3) digitRefs[i + 1].current?.focus();
  };

  const handleDigitKey = (i, e) => {
    if (e.key === "Backspace" && !codeDigits[i] && i > 0) {
      digitRefs[i - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!text) return;
    const next = [...codeDigits];
    text.split("").forEach((ch, i) => { if (i < 4) next[i] = ch; });
    setCodeDigits(next);
    digitRefs[Math.min(text.length, 3)].current?.focus();
  };

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${backendUrl}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });
      if (res.ok) {
        setStep(2);
        setCodeDigits(["", "", "", ""]);
        setTimeout(() => digitRefs[0].current?.focus(), 100);
      } else {
        const d = await res.json();
        setError(d.detail || "Could not send code. Check your phone number.");
      }
    } catch {
      setError("Could not connect to server.");
    }
    setLoading(false);
  };

  const resendOtp = async () => {
    setResending(true);
    setOtpError("");
    await sendOtp();
    setResending(false);
  };

  const goToStep1 = (e) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.phone.trim()) { setError("Please fill in your name and phone number."); return; }
    if (form.order_type === "delivery" && !form.address.trim()) { setError("Please enter your delivery address."); return; }
    sendOtp();
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 4) { setOtpError("Enter all 4 digits."); return; }
    setLoading(true);
    setOtpError("");
    try {
      // Verify OTP
      const vRes = await fetch(`${backendUrl}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, code: otpCode }),
      });
      if (!vRes.ok) {
        const d = await vRes.json();
        setOtpError(d.detail || "Wrong code. Try again.");
        setLoading(false);
        return;
      }
      // Place order
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const oRes = await fetch(`${backendUrl}/api/orders`, {
        method: "POST", headers,
        body: JSON.stringify({ ...form, items: itemsSummary, total }),
      });
      if (oRes.ok) {
        const data = await oRes.json();
        onSuccess(data.order_code || null);
      } else {
        setOtpError("Failed to place order. Please try again.");
      }
    } catch {
      setOtpError("Could not connect to server.");
    }
    setLoading(false);
  };

  const c = isDark ? dc : lc;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, background: c.bg, boxShadow: c.shadow }} onClick={(e) => e.stopPropagation()}>
        <button style={{ ...s.close, background: c.closeBg, color: c.closeTxt }} onClick={onClose}>✕</button>

        {/* Progress indicator */}
        <div style={s.progress}>
          {[1, 2].map((n) => (
            <span key={n} style={{ display: "contents" }}>
              <div style={{ ...s.progressDot, background: step >= n ? "#d4235e" : c.progressInactive, color: step >= n ? "white" : c.progressTxt, border: `2px solid ${step >= n ? "#d4235e" : c.progressInactive}` }}>
                {step > n ? "✓" : n}
              </div>
              {n < 2 && <div style={{ ...s.progressLine, background: step > n ? "#d4235e" : c.progressInactive }} />}
            </span>
          ))}
        </div>

        {/* ── Step 1: Order Details ── */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div style={s.header}>
              <div style={s.headerIcon}>📋</div>
              <h2 style={{ ...s.title, color: c.text }}>Place Your Order</h2>
              <p style={{ ...s.sub, color: c.muted }}>We'll send a verification code to your phone</p>
            </div>

            {/* Summary */}
            <div style={{ ...s.summary, background: c.summaryBg, border: `1px solid ${c.summaryBorder}` }}>
              <div style={s.summaryHeader}>
                <span style={{ ...s.summaryLabel, color: c.summaryText }}>Order Summary</span>
                <span style={{ ...s.summaryCount, background: "rgba(212,35,94,0.12)", color: "#d4235e" }}>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={s.summaryItems}>
                {cart.map((i) => (
                  <div key={i.id} style={s.summaryItem}>
                    <span style={s.summaryEmoji}>{i.emoji}</span>
                    <span style={{ ...s.summaryName, color: c.summaryText }}>{i.name}</span>
                    <span style={{ ...s.summaryQty, color: c.muted }}>×{i.qty}</span>
                    <span style={s.summaryPrice}>₾{(Number(i.price) * i.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={s.summaryTotal}>
                <span style={{ color: c.summaryText, fontWeight: "600", fontSize: "0.85rem" }}>Total</span>
                <span style={{ ...s.summaryTotalAmount, color: c.text }}>₾{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Toggle */}
            <div style={{ ...s.toggleRow, background: c.toggleBg }}>
              {[["delivery", "🚚 Delivery"], ["pickup", "🏠 Pickup"]].map(([v, l]) => (
                <button key={v} type="button"
                  style={{ ...s.toggleBtn, ...(form.order_type === v ? { background: c.bg, color: "#d4235e", fontWeight: "700", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" } : { color: c.muted }) }}
                  onClick={() => setForm({ ...form, order_type: v, address: v === "pickup" ? "" : form.address })}
                >{l}</button>
              ))}
            </div>

            {form.order_type === "pickup" && (
              <div style={s.pickupNote}>
                <span style={s.pickupIcon}>📍</span>
                <div>
                  <strong style={{ display: "block", color: "#5d4037", fontSize: "0.85rem", marginBottom: "0.2rem" }}>Pick up at our kitchen</strong>
                  <p style={{ color: "#8d6e63", fontSize: "0.78rem", lineHeight: 1.5 }}>We'll confirm exact location by phone.</p>
                </div>
              </div>
            )}
            {form.order_type === "delivery" && (
              <div style={s.deliveryNote}>🕐 Estimated delivery: <strong>45–75 minutes</strong></div>
            )}

            <form onSubmit={goToStep1}>
              <div style={s.formGrid}>
                <div>
                  <label style={{ ...s.label, color: c.muted }}>Your Name *</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} placeholder="e.g. Tamar"
                    value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ ...s.label, color: c.muted }}>Phone Number *</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} placeholder="+995 555 000 000"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>

              {form.order_type === "delivery" && (
                <>
                  <label style={{ ...s.label, color: c.muted }}>Delivery Address *</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }} placeholder="Street, building, district..."
                    value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </>
              )}

              {error && <div style={s.errorBox}>⚠️ {error}</div>}
              <button style={s.submitBtn} type="submit" disabled={loading}>
                {loading ? "Sending code..." : "Continue — Verify Phone →"}
              </button>
              <p style={{ ...s.submitNote, color: c.muted }}>A 4-digit code will be sent to your phone</p>
            </form>
          </div>
        )}

        {/* ── Step 2: OTP Verification ── */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <div style={s.header}>
              <div style={{ ...s.headerIcon, background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>📱</div>
              <h2 style={{ ...s.title, color: c.text }}>Verify Your Phone</h2>
              <p style={{ ...s.sub, color: c.muted }}>
                We sent a 4-digit code to<br />
                <strong style={{ color: c.text }}>{form.phone}</strong>
              </p>
            </div>

            {/* Code input boxes */}
            <div style={s.codeWrap} onPaste={handlePaste}>
              {codeDigits.map((d, i) => (
                <input
                  key={i}
                  ref={digitRefs[i]}
                  style={{
                    ...s.codeBox,
                    background: c.inputBg,
                    border: `2px solid ${d ? "#d4235e" : otpError ? "#ef4444" : c.inputBorder}`,
                    color: c.text,
                    boxShadow: d ? "0 0 0 3px rgba(212,35,94,0.15)" : "none",
                  }}
                  maxLength={1}
                  inputMode="numeric"
                  value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKey(i, e)}
                />
              ))}
            </div>

            {otpError && (
              <div style={{ ...s.errorBox, textAlign: "center" }}>⚠️ {otpError}</div>
            )}

            <form onSubmit={placeOrder}>
              <button style={{ ...s.submitBtn, opacity: otpCode.length === 4 ? 1 : 0.5 }} type="submit" disabled={loading || otpCode.length !== 4}>
                {loading ? "Placing your order..." : `✓ Confirm Order · ₾${total.toFixed(2)}`}
              </button>
            </form>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem" }}>
              <button style={{ ...s.linkBtn, color: c.muted }} onClick={() => { setStep(1); setCodeDigits(["", "", "", ""]); setOtpError(""); }}>
                ← Change details
              </button>
              <button style={{ ...s.linkBtn, color: resending ? c.muted : "#d4235e" }} onClick={resendOtp} disabled={resending}>
                {resending ? "Sending..." : "Resend code"}
              </button>
            </div>

            <div style={{ ...s.smsNote, color: c.muted }}>
              💡 Didn't get a code? Check that your phone number includes the country code (e.g. +995 for Georgia)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const lc = {
  bg: "white",
  shadow: "0 40px 80px rgba(0,0,0,0.18)",
  text: "#1c0f18",
  muted: "#8b6070",
  closeBg: "#f5eef2",
  closeTxt: "#8b6070",
  inputBg: "white",
  inputBorder: "#f0e4ea",
  toggleBg: "#f5eef2",
  progressInactive: "#e8dde5",
  progressTxt: "#8b6070",
  summaryBg: "#fdf0f5",
  summaryBorder: "#f5dde8",
  summaryText: "#6b4c58",
};
const dc = {
  bg: "#1b1320",
  shadow: "0 40px 80px rgba(0,0,0,0.5)",
  text: "#f0ecf4",
  muted: "#9878a8",
  closeBg: "rgba(255,255,255,0.08)",
  closeTxt: "#9878a8",
  inputBg: "#2a1c38",
  inputBorder: "rgba(255,255,255,0.12)",
  toggleBg: "#251830",
  progressInactive: "rgba(255,255,255,0.12)",
  progressTxt: "#9878a8",
  summaryBg: "rgba(212,35,94,0.06)",
  summaryBorder: "rgba(212,35,94,0.15)",
  summaryText: "#c0a0b0",
};

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: "1rem" },
  modal: { borderRadius: "28px", padding: "2.2rem", width: "100%", maxWidth: "460px", position: "relative", maxHeight: "93vh", overflowY: "auto" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },

  progress: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "1.8rem" },
  progressDot: { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", transition: "all 0.3s" },
  progressLine: { width: "60px", height: "2px", transition: "background 0.3s" },

  header: { textAlign: "center", marginBottom: "1.4rem" },
  headerIcon: { width: "56px", height: "56px", background: "linear-gradient(135deg, #fff0f5, #ffdae8)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 0.8rem" },
  title: { fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.25rem" },
  sub: { fontSize: "0.82rem", lineHeight: 1.5 },

  summary: { borderRadius: "16px", padding: "1rem 1.2rem", marginBottom: "1.1rem" },
  summaryHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" },
  summaryLabel: { fontWeight: "600", fontSize: "0.82rem" },
  summaryCount: { fontSize: "0.7rem", fontWeight: "700", padding: "0.18rem 0.65rem", borderRadius: "50px" },
  summaryItems: { display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.8rem" },
  summaryItem: { display: "flex", alignItems: "center", gap: "0.5rem" },
  summaryEmoji: { fontSize: "1rem" },
  summaryName: { flex: 1, fontSize: "0.82rem" },
  summaryQty: { fontSize: "0.76rem" },
  summaryPrice: { color: "#d4235e", fontSize: "0.82rem", fontWeight: "600" },
  summaryTotal: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(212,35,94,0.1)", paddingTop: "0.7rem" },
  summaryTotalAmount: { fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "1.3rem" },

  toggleRow: { display: "flex", borderRadius: "14px", padding: "3px", marginBottom: "1rem", gap: "3px" },
  toggleBtn: { flex: 1, padding: "0.65rem", border: "none", background: "transparent", cursor: "pointer", borderRadius: "11px", fontWeight: "500", fontSize: "0.88rem", transition: "all 0.15s" },
  pickupNote: { display: "flex", gap: "0.8rem", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "12px", padding: "0.85rem 1rem", marginBottom: "1rem" },
  pickupIcon: { fontSize: "1.1rem", flexShrink: 0 },
  deliveryNote: { background: "#e8f5e9", color: "#2e7d32", fontSize: "0.8rem", fontWeight: "500", padding: "0.55rem 1rem", borderRadius: "10px", marginBottom: "1rem", textAlign: "center" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" },
  label: { display: "block", marginBottom: "0.38rem", fontSize: "0.78rem", fontWeight: "600" },
  input: { width: "100%", padding: "0.82rem 1rem", borderRadius: "12px", marginBottom: "1rem", fontSize: "0.92rem", boxSizing: "border-box", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s" },
  errorBox: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#dc2626", borderRadius: "10px", padding: "0.7rem 1rem", fontSize: "0.82rem", marginBottom: "1rem", lineHeight: 1.5 },
  submitBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", marginBottom: "0.6rem", transition: "opacity 0.2s" },
  submitNote: { textAlign: "center", fontSize: "0.74rem" },

  codeWrap: { display: "flex", gap: "0.75rem", justifyContent: "center", marginBottom: "1.4rem" },
  codeBox: { width: "62px", height: "72px", borderRadius: "16px", fontSize: "2rem", fontWeight: "900", textAlign: "center", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "monospace" },
  linkBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: "500" },
  smsNote: { background: "rgba(212,35,94,0.06)", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.76rem", lineHeight: 1.6, marginTop: "1rem", textAlign: "center" },
};
