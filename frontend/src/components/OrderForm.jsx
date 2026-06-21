import { useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function OrderForm({ cart, backendUrl, onClose, onSuccess }) {
  const { isDark } = useTheme();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    customer_name: localStorage.getItem("display_name") || "",
    phone: localStorage.getItem("saved_phone") || "",
    email: localStorage.getItem("email") || "",
    address: "",
    order_type: "delivery",
  });
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payStep, setPayStep] = useState(0);
  const [cvvFocused, setCvvFocused] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState(null);
  const digitRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const total = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const itemsSummary = cart.map((i) => `${i.name} x${i.qty}`).join(", ");
  const otpCode = codeDigits.join("");

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...codeDigits];
    next[i] = val;
    setCodeDigits(next);
    setOtpError("");
    if (val && i < 5) digitRefs[i + 1].current?.focus();
  };
  const handleDigitKey = (i, e) => {
    if (e.key === "Backspace" && !codeDigits[i] && i > 0) digitRefs[i - 1].current?.focus();
  };
  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...codeDigits];
    text.split("").forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setCodeDigits(next);
    digitRefs[Math.min(text.length, 5)].current?.focus();
  };

  const rawNum = card.number.replace(/\s/g, "");
  const cardType = rawNum.startsWith("4") ? "visa"
    : (rawNum.startsWith("51") || rawNum.startsWith("52") || rawNum.startsWith("53") || rawNum.startsWith("54") || rawNum.startsWith("55")) ? "mastercard"
    : (rawNum.startsWith("34") || rawNum.startsWith("37")) ? "amex"
    : "generic";
  const cardGradient = cardType === "visa" ? "linear-gradient(135deg, #1a237e, #1565c0, #0288d1)"
    : cardType === "mastercard" ? "linear-gradient(135deg, #b71c1c, #e53935, #f57c00)"
    : cardType === "amex" ? "linear-gradient(135deg, #1b5e20, #2e7d32, #00897b)"
    : "linear-gradient(135deg, #1c0f18, #3a1430, #5a1a3a)";
  const cardLabel = cardType === "visa" ? "VISA" : cardType === "mastercard" ? "Mastercard" : cardType === "amex" ? "AMEX" : "Credit / Debit";

  const formatCard = (v) => {
    const d = v.replace(/\D/g, "").slice(0, cardType === "amex" ? 15 : 16);
    if (cardType === "amex") return d.replace(/^(\d{4})(\d{6})(\d{0,5}).*/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "));
    return d.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const sendOtp = async () => {
    setLoading(true); setError(""); setDevCode(null);
    try {
      const res = await fetch(`${backendUrl}/api/otp/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.detail || "Could not send code."); setLoading(false); return; }
      if (json.dev_code) setDevCode(json.dev_code);
      setStep(2); setCodeDigits(["", "", "", "", "", ""]);
      setTimeout(() => digitRefs[0].current?.focus(), 100);
    } catch { setError("Could not connect to server."); }
    setLoading(false);
  };

  const resendOtp = async () => { setResending(true); setOtpError(""); await sendOtp(); setResending(false); };

  const goToStep2 = (e) => {
    e.preventDefault();
    if (!form.customer_name.trim()) { setError("Please enter your name."); return; }
    if (!form.phone.trim()) { setError("Please enter your phone number."); return; }
    if (!form.email.trim() || !form.email.includes("@")) { setError("Please enter a valid email."); return; }
    if (form.order_type === "delivery" && !form.address.trim()) { setError("Please enter your delivery address."); return; }
    sendOtp();
  };

  const verifyAndPay = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) { setOtpError("Enter all 6 digits."); return; }
    setLoading(true); setOtpError("");
    try {
      const vRes = await fetch(`${backendUrl}/api/otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: otpCode }),
      });
      if (!vRes.ok) {
        const d = await vRes.json();
        setOtpError(d.detail || "Wrong code. Try again.");
        setLoading(false); return;
      }
      setStep(3);
    } catch { setOtpError("Could not connect to server."); }
    setLoading(false);
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const rawNum = card.number.replace(/\s/g, "");
    if (rawNum.length < 16) { setError("Enter a valid 16-digit card number."); return; }
    if (card.expiry.length < 5) { setError("Enter a valid expiry date (MM/YY)."); return; }
    if (card.cvv.length < 3) { setError("Enter a valid CVV."); return; }
    if (!card.name.trim()) { setError("Enter the name on your card."); return; }
    setError("");
    setPaying(true);
    setPayStep(1); await new Promise((r) => setTimeout(r, 900));
    setPayStep(2); await new Promise((r) => setTimeout(r, 800));
    setPayStep(3); await new Promise((r) => setTimeout(r, 600));
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const oRes = await fetch(`${backendUrl}/api/orders`, {
        method: "POST", headers,
        body: JSON.stringify({
          customer_name: form.customer_name, phone: form.phone,
          address: form.address, order_type: form.order_type,
          items: itemsSummary, total, customer_email: form.email,
        }),
      });
      if (oRes.ok) {
        const data = await oRes.json();
        onSuccess(data.order_code || null);
      } else { setError("Failed to place order. Please try again."); }
    } catch { setError("Could not connect to server."); }
    setPaying(false);
  };

  const c = isDark ? dc : lc;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, background: c.bg, boxShadow: c.shadow }} onClick={(e) => e.stopPropagation()}>
        <button style={{ ...s.close, background: c.closeBg, color: c.closeTxt }} onClick={onClose}>✕</button>

        {/* Progress */}
        <div style={s.progress}>
          {[1, 2, 3].map((n) => (
            <span key={n} style={{ display: "contents" }}>
              <div style={{ ...s.progressDot, background: step >= n ? "#d4235e" : c.progressInactive, color: step >= n ? "white" : c.progressTxt, border: `2px solid ${step >= n ? "#d4235e" : c.progressInactive}` }}>
                {step > n ? "✓" : n}
              </div>
              {n < 3 && <div style={{ ...s.progressLine, background: step > n ? "#d4235e" : c.progressInactive }} />}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "3.5rem", marginTop: "-1rem", marginBottom: "1.6rem" }}>
          {["Details", "Verify", "Payment"].map((l, i) => (
            <span key={l} style={{ fontSize: "0.62rem", color: step === i + 1 ? "#d4235e" : c.progressTxt, fontWeight: step === i + 1 ? "700" : "400", letterSpacing: "0.04em" }}>{l}</span>
          ))}
        </div>

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div style={s.header}>
              <div style={s.headerIcon}>📋</div>
              <h2 style={{ ...s.title, color: c.text }}>Place Your Order</h2>
              <p style={{ ...s.sub, color: c.muted }}>We'll send a verification code to your email</p>
            </div>

            <div style={{ ...s.summary, background: c.summaryBg, border: `1px solid ${c.summaryBorder}` }}>
              <div style={s.summaryHeader}>
                <span style={{ ...s.summaryLabel, color: c.summaryText }}>Order Summary</span>
                <span style={{ ...s.summaryCount, background: "rgba(212,35,94,0.12)", color: "#d4235e" }}>{cart.length} item{cart.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={s.summaryItems}>
                {cart.map((i) => (
                  <div key={i.id} style={s.summaryItem}>
                    <span style={s.summaryEmoji}>{i.emoji || "🍰"}</span>
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

            <div style={{ ...s.toggleRow, background: c.toggleBg }}>
              {[["delivery", "🚚 Delivery"], ["pickup", "🏠 Pickup"]].map(([v, l]) => (
                <button key={v} type="button"
                  style={{ ...s.toggleBtn, ...(form.order_type === v ? { background: c.bg, color: "#d4235e", fontWeight: "700", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" } : { color: c.muted }) }}
                  onClick={() => setForm({ ...form, order_type: v, address: v === "pickup" ? "" : form.address })}>
                  {l}
                </button>
              ))}
            </div>

            {form.order_type === "delivery" && (
              <div style={s.deliveryNote}>🕐 Estimated delivery: <strong>45–75 minutes</strong></div>
            )}
            {form.order_type === "pickup" && (
              <div style={s.pickupNote}>
                <span style={s.pickupIcon}>📍</span>
                <div>
                  <strong style={{ display: "block", color: "#5d4037", fontSize: "0.85rem", marginBottom: "0.2rem" }}>Pick up at our kitchen</strong>
                  <p style={{ color: "#8d6e63", fontSize: "0.78rem", lineHeight: 1.5 }}>We'll confirm exact location by phone.</p>
                </div>
              </div>
            )}

            <form onSubmit={goToStep2}>
              <div style={s.formGrid}>
                <div>
                  <label style={{ ...s.label, color: c.muted }}>Your Name *</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }}
                    placeholder="e.g. Tamar" value={form.customer_name}
                    onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ ...s.label, color: c.muted }}>Phone *</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }}
                    placeholder="+995 555 000 000" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>
              <label style={{ ...s.label, color: c.muted }}>Email * <span style={{ fontWeight: 400, fontSize: "0.72rem" }}>(code sent here)</span></label>
              <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }}
                type="email" placeholder="your@email.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {form.order_type === "delivery" && (
                <>
                  <label style={{ ...s.label, color: c.muted }}>Delivery Address *</label>
                  <input style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${c.inputBorder}`, color: c.text }}
                    placeholder="Street, building, district..." value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </>
              )}
              {error && <div style={s.errorBox}>⚠️ {error}</div>}
              <button style={s.submitBtn} type="submit" disabled={loading}>
                {loading ? "Sending code…" : "Continue →"}
              </button>
              <p style={{ ...s.submitNote, color: c.muted }}>A 6-digit code will be sent to your email</p>
            </form>
          </div>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <div style={s.header}>
              <div style={{ ...s.headerIcon, background: "linear-gradient(135deg, #eff6ff, #dbeafe)" }}>📧</div>
              <h2 style={{ ...s.title, color: c.text }}>Check Your Email</h2>
              <p style={{ ...s.sub, color: c.muted }}>
                Sent a 6-digit code to<br />
                <strong style={{ color: c.text }}>{form.email}</strong>
              </p>
            </div>

            {devCode && (
              <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "12px", padding: "0.8rem 1rem", marginBottom: "1rem", textAlign: "center" }}>
                <p style={{ color: "#5d4037", fontSize: "0.74rem", fontWeight: "600", marginBottom: "0.3rem" }}>⚙️ DEV — Gmail not configured</p>
                <p style={{ fontFamily: "monospace", fontSize: "1.8rem", fontWeight: "900", color: "#1c0f18", letterSpacing: "0.3em" }}>{devCode}</p>
              </div>
            )}

            <div style={s.codeWrap} onPaste={handlePaste}>
              {codeDigits.map((d, i) => (
                <input key={i} ref={digitRefs[i]}
                  style={{ ...s.codeBox, background: c.inputBg, border: `2px solid ${d ? "#d4235e" : otpError ? "#ef4444" : c.inputBorder}`, color: c.text, boxShadow: d ? "0 0 0 3px rgba(212,35,94,0.15)" : "none" }}
                  maxLength={1} inputMode="numeric" value={d}
                  onChange={(e) => handleDigit(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKey(i, e)} />
              ))}
            </div>

            {otpError && <div style={{ ...s.errorBox, textAlign: "center" }}>⚠️ {otpError}</div>}
            <form onSubmit={verifyAndPay}>
              <button style={{ ...s.submitBtn, opacity: otpCode.length === 6 ? 1 : 0.5 }} type="submit" disabled={loading || otpCode.length !== 6}>
                {loading ? "Verifying…" : "Verify & Continue →"}
              </button>
            </form>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.8rem" }}>
              <button style={{ ...s.linkBtn, color: c.muted }} onClick={() => { setStep(1); setCodeDigits(["", "", "", "", "", ""]); setOtpError(""); setDevCode(null); }}>
                ← Change details
              </button>
              <button style={{ ...s.linkBtn, color: resending ? c.muted : "#d4235e" }} onClick={resendOtp} disabled={resending}>
                {resending ? "Sending…" : "Resend code"}
              </button>
            </div>
            <div style={{ ...s.smsNote, color: c.muted }}>💡 Didn't get it? Check spam or click Resend</div>
          </div>
        )}

        {/* ── Step 3: Payment ── */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <div style={s.header}>
              <div style={{ ...s.headerIcon, background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>💳</div>
              <h2 style={{ ...s.title, color: c.text }}>Secure Payment</h2>
              <p style={{ ...s.sub, color: c.muted }}>Your payment is encrypted and secure</p>
            </div>

            {/* Accepted cards row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.1rem" }}>
              <span style={{ color: c.muted, fontSize: "0.72rem" }}>We accept:</span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                {[["#1a237e", "VISA"], ["#b71c1c", "MC"], ["#1b5e20", "AMEX"]].map(([col, name]) => (
                  <div key={name} style={{ background: col, color: "white", fontSize: "0.58rem", fontWeight: "800", padding: "0.22rem 0.6rem", borderRadius: "6px", letterSpacing: "0.06em", opacity: cardType !== "generic" && ((name === "VISA" && cardType === "visa") || (name === "MC" && cardType === "mastercard") || (name === "AMEX" && cardType === "amex")) ? 1 : 0.35, transition: "opacity 0.2s" }}>{name}</div>
                ))}
              </div>
            </div>

            {/* Live card preview — flips on CVV focus */}
            <div style={{ perspective: "1000px", marginBottom: "1.2rem", height: "148px" }}>
              <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.5s ease", transform: cvvFocused ? "rotateY(180deg)" : "rotateY(0deg)" }}>

                {/* Front */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: cardGradient, borderRadius: "16px", padding: "1.2rem 1.4rem", overflow: "hidden" }}>
                  <div style={{ position: "absolute", width: "160px", height: "160px", top: "-50px", right: "-30px", borderRadius: "50%", background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", width: "100px", height: "100px", bottom: "-30px", left: "20px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.7rem" }}>
                    <div style={{ width: "32px", height: "24px", background: "rgba(255,255,255,0.3)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "18px", height: "14px", background: "rgba(255,200,0,0.6)", borderRadius: "2px" }} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.72rem", fontWeight: "800", letterSpacing: "0.1em" }}>{cardLabel}</span>
                  </div>
                  <p style={{ fontFamily: "monospace", color: "white", fontSize: "1rem", letterSpacing: "0.2em", fontWeight: "600", marginBottom: "0.8rem", textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
                    {card.number || (cardType === "amex" ? "•••• •••••• •••••" : "•••• •••• •••• ••••")}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.52rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>Card Holder</p>
                      <p style={{ color: "white", fontSize: "0.78rem", fontWeight: "600", letterSpacing: "0.04em" }}>{card.name || "YOUR NAME"}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.52rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>Expires</p>
                      <p style={{ color: "white", fontSize: "0.78rem", fontWeight: "600" }}>{card.expiry || "MM/YY"}</p>
                    </div>
                  </div>
                </div>

                {/* Back */}
                <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: cardGradient, borderRadius: "16px", overflow: "hidden" }}>
                  <div style={{ height: "36px", background: "rgba(0,0,0,0.45)", margin: "20px 0 16px" }} />
                  <div style={{ padding: "0 1.4rem" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.58rem", letterSpacing: "0.1em", marginBottom: "6px" }}>CVV</p>
                    <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: "6px", padding: "0.5rem 1rem", display: "flex", justifyContent: "flex-end" }}>
                      <span style={{ fontFamily: "monospace", color: "#1c0f18", fontSize: "1rem", fontWeight: "700", letterSpacing: "0.2em" }}>
                        {card.cvv ? "•".repeat(card.cvv.length) : "•••"}
                      </span>
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.58rem", marginTop: "8px", textAlign: "right" }}>3-digit code on back of card</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={placeOrder}>
              {/* Card number */}
              <div style={{ position: "relative", marginBottom: "0" }}>
                <label style={{ ...s.label, color: c.muted }}>Card Number</label>
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${rawNum.length === (cardType === "amex" ? 15 : 16) ? "#22c55e" : c.inputBorder}`, color: c.text, fontFamily: "monospace", letterSpacing: "0.1em", paddingRight: "3rem" }}
                    placeholder={cardType === "amex" ? "3782 822463 10005" : "1234 5678 9012 3456"}
                    value={card.number} inputMode="numeric"
                    onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} />
                  {rawNum.length === (cardType === "amex" ? 15 : 16) && (
                    <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-55%)", color: "#22c55e", fontSize: "1rem" }}>✓</span>
                  )}
                </div>
              </div>

              <label style={{ ...s.label, color: c.muted }}>Name on Card</label>
              <div style={{ position: "relative" }}>
                <input
                  style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${card.name.length > 2 ? "#22c55e" : c.inputBorder}`, color: c.text, paddingRight: "3rem" }}
                  placeholder="TAMAR IVANIDZE" value={card.name}
                  onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })} />
                {card.name.length > 2 && <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-55%)", color: "#22c55e", fontSize: "1rem" }}>✓</span>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                <div>
                  <label style={{ ...s.label, color: c.muted }}>Expiry</label>
                  <input
                    style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${card.expiry.length === 5 ? "#22c55e" : c.inputBorder}`, color: c.text, fontFamily: "monospace", textAlign: "center", letterSpacing: "0.1em" }}
                    placeholder="MM/YY" value={card.expiry} inputMode="numeric"
                    onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} />
                </div>
                <div>
                  <label style={{ ...s.label, color: c.muted }}>CVV <span style={{ color: c.muted, fontWeight: "400", fontSize: "0.68rem" }}>(flip card)</span></label>
                  <input
                    style={{ ...s.input, background: c.inputBg, border: `1.5px solid ${card.cvv.length >= 3 ? "#22c55e" : cvvFocused ? "#d4235e" : c.inputBorder}`, color: c.text, fontFamily: "monospace", letterSpacing: "0.3em", textAlign: "center" }}
                    placeholder="•••" maxLength={cardType === "amex" ? 4 : 3} value={card.cvv}
                    inputMode="numeric" type="password"
                    onFocus={() => setCvvFocused(true)}
                    onBlur={() => setCvvFocused(false)}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, cardType === "amex" ? 4 : 3) })} />
                </div>
              </div>

              {error && <div style={s.errorBox}>⚠️ {error}</div>}

              {/* Processing steps */}
              {paying && (
                <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "#f8f5ff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e8e0f0"}`, borderRadius: "12px", padding: "0.9rem 1.1rem", marginBottom: "1rem" }}>
                  {[["Connecting to bank…", 1], ["Authorizing payment…", 2], ["Confirming order…", 3]].map(([msg, n]) => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.28rem 0", opacity: payStep >= n ? 1 : 0.3, transition: "opacity 0.3s" }}>
                      {payStep > n ? (
                        <span style={{ color: "#22c55e", fontSize: "0.9rem", width: "16px", flexShrink: 0 }}>✓</span>
                      ) : payStep === n ? (
                        <span style={{ width: "14px", height: "14px", border: "2px solid rgba(212,35,94,0.3)", borderTop: "2px solid #d4235e", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                      ) : (
                        <span style={{ width: "16px", color: c.muted, fontSize: "0.7rem", flexShrink: 0 }}>○</span>
                      )}
                      <span style={{ color: payStep >= n ? c.text : c.muted, fontSize: "0.82rem", fontWeight: payStep === n ? "600" : "400" }}>{msg}</span>
                    </div>
                  ))}
                </div>
              )}

              <button style={{ ...s.submitBtn, background: paying ? "linear-gradient(135deg, #6b21a8, #4c1d95)" : "linear-gradient(135deg, #d4235e, #a01848)" }} type="submit" disabled={paying}>
                {paying ? "Processing…" : `🔒 Pay ₾${total.toFixed(2)}`}
              </button>

              <div style={{ display: "flex", align: "center", justifyContent: "center", gap: "1rem", marginTop: "0.75rem" }}>
                {[["🔒", "SSL Encrypted"], ["🛡️", "Secure"], ["✓", "Demo only"]].map(([icon, label]) => (
                  <span key={label} style={{ color: c.muted, fontSize: "0.68rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span>{icon}</span>{label}
                  </span>
                ))}
              </div>
            </form>

            <button style={{ ...s.linkBtn, color: c.muted, display: "block", marginTop: "0.9rem" }} onClick={() => setStep(2)}>
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const lc = {
  bg: "white", shadow: "0 40px 80px rgba(0,0,0,0.18)", text: "#1c0f18", muted: "#8b6070",
  closeBg: "#f5eef2", closeTxt: "#8b6070", inputBg: "white", inputBorder: "#f0e4ea",
  toggleBg: "#f5eef2", progressInactive: "#e8dde5", progressTxt: "#8b6070",
  summaryBg: "#fdf0f5", summaryBorder: "#f5dde8", summaryText: "#6b4c58",
};
const dc = {
  bg: "#1b1320", shadow: "0 40px 80px rgba(0,0,0,0.5)", text: "#f0ecf4", muted: "#9878a8",
  closeBg: "rgba(255,255,255,0.08)", closeTxt: "#9878a8", inputBg: "#2a1c38", inputBorder: "rgba(255,255,255,0.12)",
  toggleBg: "#251830", progressInactive: "rgba(255,255,255,0.12)", progressTxt: "#9878a8",
  summaryBg: "rgba(212,35,94,0.06)", summaryBorder: "rgba(212,35,94,0.15)", summaryText: "#c0a0b0",
};

const s = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", padding: "1rem" },
  modal: { borderRadius: "28px", padding: "2.2rem", width: "100%", maxWidth: "460px", position: "relative", maxHeight: "93vh", overflowY: "auto" },
  close: { position: "absolute", top: "1.2rem", right: "1.2rem", border: "none", width: "30px", height: "30px", borderRadius: "50%", cursor: "pointer", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center" },
  progress: { display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "0.5rem" },
  progressDot: { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", transition: "all 0.3s" },
  progressLine: { width: "50px", height: "2px", transition: "background 0.3s" },
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
  codeWrap: { display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.4rem" },
  codeBox: { width: "46px", height: "60px", borderRadius: "14px", fontSize: "1.8rem", fontWeight: "900", textAlign: "center", outline: "none", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "monospace" },
  linkBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "0.82rem", fontWeight: "500" },
  smsNote: { background: "rgba(212,35,94,0.06)", borderRadius: "10px", padding: "0.75rem 1rem", fontSize: "0.76rem", lineHeight: 1.6, marginTop: "1rem", textAlign: "center" },
};
