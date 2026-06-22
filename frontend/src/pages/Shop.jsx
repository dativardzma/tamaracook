import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Cart from "../components/Cart";
import OrderForm from "../components/OrderForm";
import AuthModal from "../components/AuthModal";
import ProfileModal from "../components/ProfileModal";
import ProductModal from "../components/ProductModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";


export default function Shop() {
  const { isDark, toggle } = useTheme();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("email"));
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("is_admin") === "true");
  const [isDelivery, setIsDelivery] = useState(() => localStorage.getItem("is_delivery") === "true");
  const [scrolled, setScrolled] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const addToCart = (product) => {
    const cartProduct = product.sale_price
      ? { ...product, price: product.sale_price }
      : product;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === cartProduct.id);
      if (existing) return prev.map((i) => i.id === cartProduct.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...cartProduct, qty: 1 }];
    });
    setAddedIds((prev) => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; }), 1600);
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        transition: "background 0.35s, box-shadow 0.35s, backdrop-filter 0.35s",
        background: scrolled
          ? isDark ? "rgba(8,4,10,0.94)" : "rgba(22,9,20,0.97)"
          : "#1c0f18",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        boxShadow: scrolled ? "0 2px 32px rgba(0,0,0,0.4)" : "none",
      }}>
        <div style={s.headerInner}>
          <button style={s.brandBtn} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div style={s.brandIcon}><span style={{ fontSize: "1.25rem" }}>🍰</span></div>
            <div>
              <div style={s.brandName}>საკონდიტრო</div>
              <div style={s.brandSub}>artisan bakery · tbilisi</div>
            </div>
          </button>

          <nav style={s.headerNav}>
            {[["About", () => scrollTo("about-section")], ["Contact", () => scrollTo("contact-section")]].map(([label, fn]) => (
              <button key={label} style={s.navLink} onClick={fn}
                onMouseEnter={e => e.currentTarget.style.color = "white"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.55)"}
              >{label}</button>
            ))}
          </nav>

          <div style={s.headerActions}>
            {/* Theme toggle */}
            <button style={s.themeBtn} onClick={toggle} title="Toggle dark mode">
              {isDark ? "☀️" : "🌙"}
            </button>

            {isAdmin && (
              <button style={s.staffBtn} onClick={() => navigate("/admin")}>⚙️ Admin</button>
            )}
            {isDelivery && !isAdmin && (
              <button style={s.staffBtn} onClick={() => navigate("/delivery")}>🚚 Deliveries</button>
            )}
            {userEmail ? (
              <button style={s.userPill} onClick={() => setProfileOpen(true)}>
                <span style={s.userDot} />
                <span style={s.userName}>{userEmail.split("@")[0]}</span>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>▾</span>
              </button>
            ) : (
              <button style={s.authBtn} onClick={() => setAuthOpen(true)}>Sign In</button>
            )}
            <button style={s.cartBtn} onClick={() => setCartOpen(true)}>
              🛒
              {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: "linear-gradient(150deg, #1c0f18 0%, #2e1226 40%, #5a1a3a 80%, #6b1d40 100%)", padding: "8rem 2rem 6.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Dot pattern overlay */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        {/* Ambient glows */}
        <div style={{ position: "absolute", width: "700px", height: "700px", top: "-250px", right: "-200px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,35,94,0.2) 0%, transparent 68%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "500px", height: "500px", bottom: "-150px", left: "-100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(90,26,58,0.35) 0%, transparent 68%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: "740px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Social proof bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", marginBottom: "1.8rem", animation: "fadeInUp 0.5s ease both", flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,35,94,0.15)", border: "1px solid rgba(212,35,94,0.32)", color: "#f4a3b8", borderRadius: "50px", padding: "0.45rem 1.2rem", fontSize: "0.74rem", fontWeight: "600", letterSpacing: "0.04em" }}>
              ⭐⭐⭐⭐⭐ &nbsp;Loved by 500+ customers
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: "50px", padding: "0.45rem 1.1rem", fontSize: "0.74rem" }}>
              🇬🇪 Tbilisi · Est. 2021
            </div>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2.6rem, 6vw, 4.2rem)", fontWeight: "700", lineHeight: 1.12, marginBottom: "1.4rem", animation: "fadeInUp 0.55s ease 0.1s both" }}>
            Every bite tells<br />a <em style={{ color: "#f4a3b8", fontStyle: "italic" }}>sweet</em> story
          </h1>

          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "1.05rem", lineHeight: 1.9, marginBottom: "2.8rem", animation: "fadeInUp 0.55s ease 0.2s both" }}>
            Homemade cakes, pastries & chocolates baked fresh every morning in Tbilisi<br />
            <span style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.92rem" }}>Delivery across the city · Order online, we bring it to your door</span>
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3.5rem", animation: "fadeInUp 0.55s ease 0.3s both" }}>
            <button
              style={{ background: "#d4235e", border: "none", color: "white", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.98rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 32px rgba(212,35,94,0.45)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(212,35,94,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,35,94,0.45)"; }}
              onClick={() => navigate("/menu")}
            >🛒 Order Now</button>
            <button style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.85)", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.98rem", fontWeight: "500", cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
              onClick={() => scrollTo("about-section")}
            >Our Story →</button>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", flexWrap: "wrap", animation: "fadeInUp 0.55s ease 0.4s both", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "18px", padding: "1rem 2rem", maxWidth: "560px", margin: "0 auto" }}>
            {[
              ["500+", "Happy Customers"],
              ["2,000+", "Orders Delivered"],
              ["4.9★", "Average Rating"],
              ["100%", "Homemade"],
            ].map(([num, label], i) => (
              <div key={label} style={{ flex: "1", textAlign: "center", padding: "0 0.8rem", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none", minWidth: "80px" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontWeight: "700", fontSize: "1.15rem", lineHeight: 1 }}>{num}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.65rem", marginTop: "3px", letterSpacing: "0.03em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section style={{ background: "var(--feature-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[
            { icon: "🌅", title: "Fresh Every Morning", desc: "Baked daily, never frozen. Order by 3PM for same-day delivery.", color: "#ff9800" },
            { icon: "🚚", title: "Tbilisi Delivery", desc: "We deliver to Vake, Saburtalo, Vera, Mtatsminda & more.", color: "#d4235e" },
            { icon: "💝", title: "100% Homemade", desc: "Real Georgian recipes, local ingredients — no shortcuts.", color: "#e91e63" },
            { icon: "📱", title: "WhatsApp Orders", desc: "Custom cakes & bulk orders — just message us directly.", color: "#9c27b0" },
          ].map((f, i) => <FeatureCard key={f.title} f={f} hasBorder={i < 3} />)}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: "var(--bg)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.65rem", letterSpacing: "0.25em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>SO SIMPLE</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "700", color: "var(--text)" }}>Order in minutes, enjoy in hours</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0", position: "relative" }}>
            {[
              { step: "1", icon: "🛒", title: "Browse & Add", desc: "Pick your favourites from our menu — cakes, pastries, chocolates and more." },
              { step: "2", icon: "📱", title: "Verify & Pay", desc: "Confirm your email, then complete checkout. We keep it safe and simple." },
              { step: "3", icon: "🍰", title: "We Bake for You", desc: "Your order heads straight to our kitchen — freshly prepared just for you." },
              { step: "4", icon: "🚚", title: "Door Delivery", desc: "We deliver hot and fresh across Tbilisi, usually within 45–75 minutes." },
            ].map((s2, i) => (
              <div key={s2.step} style={{ textAlign: "center", padding: "0 1.5rem", position: "relative" }}>
                {i < 3 && <div style={{ position: "absolute", top: "28px", right: "-1px", width: "50%", height: "2px", background: "linear-gradient(to right, var(--accent), transparent)", zIndex: 0, display: "none" }} />}
                <div style={{ position: "relative", display: "inline-flex", marginBottom: "1.2rem" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "18px", background: "var(--bg-card)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", position: "relative", zIndex: 1 }}>{s2.icon}</div>
                  <div style={{ position: "absolute", top: "-8px", right: "-8px", width: "22px", height: "22px", borderRadius: "50%", background: "var(--accent)", color: "white", fontSize: "0.65rem", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>{s2.step}</div>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--text)", fontWeight: "700", fontSize: "1rem", marginBottom: "0.5rem" }}>{s2.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.7 }}>{s2.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Menu ── */}
      <main style={s.main} ref={menuRef}>
        <div style={s.menuHeader}>
          <div>
            <p style={{ color: "var(--accent)", fontSize: "0.65rem", letterSpacing: "0.25em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>WHAT WE MAKE</p>
            <h2 style={{ ...s.sectionTitle, color: "var(--text)" }}>Today's Menu</h2>
            <div style={{ width: "48px", height: "3px", background: "var(--accent)", borderRadius: "2px", marginTop: "0.8rem" }} />
          </div>
          <span style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)", fontSize: "0.8rem", fontWeight: "600", padding: "0.45rem 1.2rem", borderRadius: "50px" }}>
            {products.length} items available
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "7rem 2rem" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", margin: "0 auto 1.5rem", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading...</p>
          </div>
        ) : products.filter(p => p.sale_price).length > 0 ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.6rem", marginBottom: "2.5rem" }}>
              {products.filter(p => p.sale_price).map((p) => (
                <ProductCard key={p.id} p={p} isDark={isDark} added={addedIds.has(p.id)} onAdd={() => addToCart(p)} onOpenModal={() => setSelectedProduct(p)} />
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => navigate("/menu")} style={{ background: "transparent", border: "1.5px solid var(--border)", color: "var(--text-muted)", padding: "0.75rem 2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                See Full Menu →
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1.2rem" }}>🍰</span>
            <p style={{ fontFamily: "'Playfair Display', serif", color: "var(--text)", fontWeight: "700", fontSize: "1.15rem", marginBottom: "0.6rem" }}>Fresh items coming soon</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.8rem" }}>Browse our full menu and place your order</p>
            <button onClick={() => navigate("/menu")} style={{ background: "var(--accent)", color: "white", border: "none", padding: "0.85rem 2.2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "700", boxShadow: "0 6px 20px rgba(212,35,94,0.35)" }}>
              Browse Menu →
            </button>
          </div>
        )}
      </main>

      {/* ── Testimonials ── */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.65rem", letterSpacing: "0.25em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>WHAT PEOPLE SAY</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "700", color: "var(--text)" }}>Our customers say it best</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {[
              { name: "Nino Kvaratskhelia", location: "Vake, Tbilisi", review: "The birthday cake was absolutely stunning — everyone at the party couldn't believe it was homemade. Ordered for the second time already, will not stop! 🎂", rating: 5, order: "Custom Birthday Cake" },
              { name: "Mariam Gabaidze", location: "Saburtalo, Tbilisi", review: "I've been ordering every week for three months. The pastries are better than any café in the city. Fresh, real ingredients — you taste the difference immediately.", rating: 5, order: "Weekly Pastry Box" },
              { name: "Khatia Ioseliani", location: "Vera, Tbilisi", review: "Ordered chocolate truffles for the office. They disappeared in under 10 minutes. My colleagues are already asking me for the contact number! 🍫", rating: 5, order: "Chocolate Truffles" },
            ].map((t) => (
              <div key={t.name} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "20px", padding: "1.8rem", position: "relative" }}>
                <div style={{ position: "absolute", top: "1.4rem", right: "1.6rem", fontSize: "2rem", color: "var(--accent)", opacity: 0.15, fontFamily: "serif", lineHeight: 1 }}>"</div>
                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1rem" }}>
                  {"⭐".repeat(t.rating).split("").map((s, i) => <span key={i} style={{ fontSize: "0.85rem" }}>⭐</span>)}
                </div>
                <p style={{ color: "var(--text)", fontSize: "0.92rem", lineHeight: 1.75, marginBottom: "1.4rem", fontStyle: "italic" }}>"{t.review}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #d4235e, #a01848)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "0.9rem", flexShrink: 0 }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--text)" }}>{t.name}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{t.location} · {t.order}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Instagram CTA ── */}
      <section style={{ background: "linear-gradient(135deg, #1c0f18 0%, #2a0e20 100%)", padding: "4rem 2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: "52px", height: "52px", margin: "0 auto 1.2rem", borderRadius: "16px", background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", boxShadow: "0 8px 24px rgba(220,39,67,0.35)" }}>📸</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: "700", marginBottom: "0.7rem" }}>Follow us on Instagram</h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.93rem", lineHeight: 1.7, marginBottom: "1.6rem" }}>
            See what's fresh today, get inspired, and share your order — we post every day.
          </p>
          <a
            href="https://www.instagram.com/tamaracook.ink"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", background: "linear-gradient(135deg, #f09433, #dc2743, #bc1888)", color: "white", border: "none", padding: "0.85rem 2.2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "700", textDecoration: "none", boxShadow: "0 8px 24px rgba(220,39,67,0.35)", transition: "transform 0.2s, box-shadow 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(220,39,67,0.48)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 24px rgba(220,39,67,0.35)"; }}
          >
            📸 @tamaracook.ink
          </a>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem", flexWrap: "wrap" }}>
            {["🎂", "🍰", "🥐", "🍫", "🧁", "🍪", "🎉", "💝"].map((e, i) => (
              <div key={i} style={{ width: "64px", height: "64px", borderRadius: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>{e}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", padding: "6rem 2rem" }} id="about-section">
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--accent-light)", border: "1px solid var(--accent-ring)", color: "var(--accent)", borderRadius: "50px", padding: "0.4rem 1.1rem", fontSize: "0.72rem", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "1.5rem" }}>🧁 OUR STORY</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.65rem, 3vw, 2.3rem)", fontWeight: "700", color: "var(--text)", lineHeight: 1.25, marginBottom: "1rem" }}>Made with love,<br /><em style={{ color: "var(--accent)", fontStyle: "italic" }}>one batch at a time</em></h2>
            <div style={{ width: "48px", height: "3px", background: "var(--accent)", borderRadius: "2px", marginBottom: "1.6rem" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.9, marginBottom: "1rem" }}>
              A small, passionate home bakery in the heart of Tbilisi — we believe that real sweetness comes from real ingredients, real recipes, and real care.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.9, marginBottom: "1.8rem" }}>
              Every cake, every pastry, every chocolate is made in small batches to order. No mass production, no shortcuts — just honest, homemade baking that you can taste in every bite.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginBottom: "1.8rem" }}>
              {[
                ["🌱", "Made only with local Georgian ingredients"],
                ["🚫", "Zero preservatives or artificial flavours"],
                ["📦", "Baked to order — never pre-made or frozen"],
                ["❤️", "Every item personally crafted with care"],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <span style={{ width: "28px", height: "28px", background: "var(--accent-light)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>{icon}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.87rem" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            {/* Quote card */}
            <div style={{ background: "linear-gradient(135deg, #1c0f18, #2e1226)", borderRadius: "24px", padding: "2rem 2rem 1.8rem", marginBottom: "1.2rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,35,94,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ fontSize: "2.5rem", color: "rgba(212,35,94,0.4)", lineHeight: 1, marginBottom: "0.5rem" }}>"</div>
              <p style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255,255,255,0.85)", fontSize: "1.05rem", lineHeight: 1.7, fontStyle: "italic", marginBottom: "1.2rem" }}>
                I bake because I love seeing people's faces when they take that first bite. That moment of joy — that's why I do this.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #d4235e, #a01848)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>👩‍🍳</div>
                <div>
                  <div style={{ color: "white", fontWeight: "600", fontSize: "0.85rem" }}>Tamuna</div>
                  <div style={{ color: "rgba(212,35,94,0.7)", fontSize: "0.7rem" }}>Baker & Founder</div>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
              {[
                { icon: "🍰", label: "Layer Cakes", desc: "For every celebration" },
                { icon: "🥐", label: "Pastries", desc: "Fresh every morning" },
                { icon: "🍫", label: "Chocolates", desc: "Hand-crafted truffles" },
                { icon: "🎂", label: "Custom Orders", desc: "Weddings & events" },
              ].map((sp) => (
                <div key={sp.label} style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.2rem", textAlign: "center" }}>
                  <span style={{ fontSize: "1.8rem", display: "block", marginBottom: "0.5rem" }}>{sp.icon}</span>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "0.88rem", color: "var(--text)", marginBottom: "0.2rem" }}>{sp.label}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>{sp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "linear-gradient(150deg, #1c0f18 0%, #2e1226 40%, #5a1a3a 100%)", padding: "6rem 2rem", textAlign: "center", position: "relative", overflow: "hidden" }} id="contact-section">
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "500px", height: "500px", top: "-200px", right: "-100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,35,94,0.15) 0%, transparent 68%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "620px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ width: "60px", height: "60px", background: "rgba(212,35,94,0.2)", border: "1px solid rgba(212,35,94,0.35)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 1.6rem" }}>🍰</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", fontWeight: "700", marginBottom: "1rem" }}>Ready to order something special?</h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.97rem", lineHeight: 1.75, marginBottom: "2.5rem" }}>Order online or message us on WhatsApp for custom cakes, bulk orders, and event catering</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "1.2rem" }}>
            <button
              style={{ background: "#d4235e", border: "none", color: "white", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.97rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 28px rgba(212,35,94,0.4)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(212,35,94,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(212,35,94,0.4)"; }}
              onClick={() => navigate("/menu")}
            >🛒 Order Online</button>
            <a href="https://wa.me/995555942959?text=გამარჯობა! მინდა შეკვეთა გავაკეთო" target="_blank" rel="noopener noreferrer"
              style={{ background: "#25D366", border: "none", color: "white", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.97rem", fontWeight: "700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", boxShadow: "0 8px 24px rgba(37,211,102,0.35)", transition: "transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >💬 WhatsApp Us</a>
          </div>
          <a href="tel:+995555942959" style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", textDecoration: "none" }}>or call: +995 555 942 959</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#080508", padding: "4.5rem 2rem 0" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", paddingBottom: "3.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.1rem" }}>
              <span style={{ fontSize: "1.9rem" }}>🍰</span>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.1rem", fontWeight: "700" }}>საკონდიტრო</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>Tamara's Homemade Bakery · Tbilisi</div>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: "230px", marginBottom: "1.2rem" }}>Making every celebration sweeter since 2021. Handcrafted with love in the heart of Tbilisi.</p>
            {/* Social icons */}
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <a href="https://www.instagram.com/tamaracook.ink" target="_blank" rel="noopener noreferrer"
                style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #f09433, #dc2743, #bc1888)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", textDecoration: "none" }}>📸</a>
              <a href="https://wa.me/995555942959" target="_blank" rel="noopener noreferrer"
                style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", textDecoration: "none" }}>💬</a>
            </div>
          </div>
          <div>
            <p style={s.footerHeading}>Working Hours</p>
            <p style={s.footerLine}>Mon – Fri: 9:00 – 20:00</p>
            <p style={s.footerLine}>Saturday: 10:00 – 19:00</p>
            <p style={{ ...s.footerLine, color: "rgba(255,255,255,0.18)" }}>Sunday: Closed</p>
            <div style={{ marginTop: "0.8rem", background: "rgba(212,35,94,0.1)", border: "1px solid rgba(212,35,94,0.2)", borderRadius: "8px", padding: "0.5rem 0.75rem" }}>
              <p style={{ color: "#f4a3b8", fontSize: "0.7rem", fontWeight: "600" }}>🕐 Order before 3PM</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.66rem" }}>for same-day delivery</p>
            </div>
          </div>
          <div>
            <p style={s.footerHeading}>Contact</p>
            <a href="tel:+995555942959" style={s.footerLink}>📞 +995 555 942 959</a>
            <a href="https://wa.me/995555942959" target="_blank" rel="noopener noreferrer" style={s.footerLink}>💬 WhatsApp us</a>
            <a href="https://www.instagram.com/tamaracook.ink" target="_blank" rel="noopener noreferrer" style={s.footerLink}>📸 @tamaracook.ink</a>
            <p style={s.footerLine}>📍 Tbilisi, Georgia</p>
          </div>
          <div>
            <p style={s.footerHeading}>Delivery Areas</p>
            {["Vake", "Saburtalo", "Vera", "Mtatsminda", "Nadzaladevi", "Isani", "Ortachala"].map((area) => (
              <p key={area} style={{ ...s.footerLine, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ color: "#d4235e", fontSize: "0.6rem" }}>●</span> {area}
              </p>
            ))}
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", marginTop: "0.5rem" }}>Other areas — call us</p>
          </div>
        </div>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.6rem 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ color: "rgba(255,255,255,0.14)", fontSize: "0.76rem" }}>© 2025 საკონდიტრო — Tamara's Homemade Bakery, Tbilisi</span>
          <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "0.75rem" }} onClick={toggle}>{isDark ? "☀️ Light mode" : "🌙 Dark mode"}</button>
        </div>
      </footer>

      {/* WhatsApp float button */}
      <a href="https://wa.me/995555942959?text=გამარჯობა! მინდა შეკვეთა გავაკეთო" target="_blank" rel="noopener noreferrer"
        style={{ position: "fixed", bottom: "1.6rem", right: "1.6rem", zIndex: 90, width: "54px", height: "54px", borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.55rem", boxShadow: "0 6px 24px rgba(37,211,102,0.45)", textDecoration: "none", transition: "transform 0.2s, box-shadow 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(37,211,102,0.6)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,211,102,0.45)"; }}
        title="Order via WhatsApp"
      >💬</a>

      {/* Modals */}
      {cartOpen && <Cart cart={cart} setCart={setCart} onClose={() => setCartOpen(false)} onOrder={() => { setCartOpen(false); setOrderOpen(true); }} />}
      {orderOpen && (
        <OrderForm
          cart={cart}
          backendUrl={BACKEND_URL}
          onClose={() => setOrderOpen(false)}
          onSuccess={(code) => { setCart([]); setOrderOpen(false); setOrderCode(code); setOrderSuccess(true); }}
        />
      )}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setUserEmail(localStorage.getItem("email"));
            setIsAdmin(localStorage.getItem("is_admin") === "true");
            setIsDelivery(localStorage.getItem("is_delivery") === "true");
            setAuthOpen(false);
          }}
        />
      )}
      {profileOpen && userEmail && (
        <ProfileModal
          email={userEmail}
          onClose={() => setProfileOpen(false)}
          onSignOut={() => {
            ["token", "email", "is_admin", "is_delivery"].forEach(k => localStorage.removeItem(k));
            setUserEmail(null); setIsAdmin(false); setIsDelivery(false); setProfileOpen(false);
          }}
        />
      )}

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(p) => { addToCart(p); }}
          alreadyAdded={addedIds.has(selectedProduct.id)}
        />
      )}

      {/* Order Success Modal */}
      {orderSuccess && (
        <div style={os.overlay} onClick={() => setOrderSuccess(false)}>
          <div style={os.modal} className="animate-scaleIn" onClick={e => e.stopPropagation()}>
            {/* Floating emojis decoration */}
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.2rem" }}>
              {["🎂", "🍰", "🥐", "🎉"].map((e, i) => (
                <span key={i} style={{ fontSize: "1.4rem", opacity: 0.4, display: "inline-block", animation: `float ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite alternate` }}>{e}</span>
              ))}
            </div>

            <div style={os.iconRing}>
              <span style={{ fontSize: "2.8rem" }}>🎉</span>
            </div>

            <h2 style={os.title}>Order Placed!</h2>
            <p style={os.sub}>Your order is confirmed — we'll call you to verify within a few minutes.</p>

            {orderCode && (
              <div style={os.codeSection}>
                <p style={os.codeLabel}>YOUR ORDER CODE</p>
                <div style={os.code}>{orderCode}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.8rem" }}>📸</span>
                  <p style={os.codeHint}>Screenshot this code to track your order</p>
                </div>
              </div>
            )}

            <div style={os.tips}>
              {[
                ["📞", "We'll call to confirm within minutes"],
                ["🚚", "Estimated delivery: 45–75 minutes"],
                ["🍰", "Your treats are being freshly prepared"],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <span style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(212,35,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>{icon}</span>
                  <span style={os.tip}>{text}</span>
                </div>
              ))}
            </div>

            <button style={os.closeBtn} onClick={() => setOrderSuccess(false)}>
              All Done! 🎉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ f, hasBorder }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ padding: "2.4rem 2rem", textAlign: "center", borderRight: hasBorder ? "1px solid var(--border)" : "none", transition: "background 0.25s, transform 0.25s", background: hovered ? "var(--bg-muted)" : "transparent", position: "relative", overflow: "hidden" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      {/* Colored top accent line on hover */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: `translateX(-50%) scaleX(${hovered ? 1 : 0})`, width: "48px", height: "3px", background: f.color, borderRadius: "0 0 3px 3px", transition: "transform 0.3s" }} />
      <div style={{ width: "60px", height: "60px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", margin: "0 auto 1.1rem", background: `${f.color}15`, border: `1.5px solid ${f.color}25`, transition: "transform 0.3s, box-shadow 0.3s", transform: hovered ? "scale(1.1) translateY(-2px)" : "scale(1)", boxShadow: hovered ? `0 8px 24px ${f.color}25` : "none" }}>
        {f.icon}
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: "700", color: "var(--text)", marginBottom: "0.5rem" }}>{f.title}</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.7 }}>{f.desc}</p>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ p, isDark, added, onAdd, onOpenModal }) {
  const [hovered, setHovered] = useState(false);

  if (p.image_data) {
    return (
      <div
        style={{ borderRadius: "22px", overflow: "hidden", cursor: "pointer", boxShadow: hovered ? "0 28px 64px rgba(0,0,0,0.28)" : "0 4px 24px rgba(0,0,0,0.1)", transform: hovered ? "translateY(-8px) scale(1.01)" : "translateY(0) scale(1)", transition: "transform 0.3s ease, box-shadow 0.3s ease", position: "relative" }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onClick={onOpenModal}
      >
        <div style={{ position: "relative", height: "290px" }}>
          <img src={p.image_data} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease", transform: hovered ? "scale(1.04)" : "scale(1)" }} alt={p.name} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)" }} />
          {p.sale_price ? (
            <div style={{ position: "absolute", top: "0.9rem", right: "0.9rem", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.6rem", fontWeight: "800", padding: "0.24rem 0.75rem", borderRadius: "50px", letterSpacing: "0.1em", boxShadow: "0 4px 12px rgba(212,35,94,0.5)" }}>
              🏷 SALE
            </div>
          ) : (
            <div style={{ position: "absolute", top: "0.9rem", right: "0.9rem", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", color: "rgba(255,255,255,0.92)", fontSize: "0.6rem", fontWeight: "800", padding: "0.24rem 0.75rem", borderRadius: "50px", letterSpacing: "0.1em" }}>
              ✓ FRESH TODAY
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.6rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.3rem", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{p.name}</h3>
            {p.description && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.77rem", marginBottom: "0.9rem", lineHeight: 1.45 }}>{p.description}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {p.sale_price && <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", textDecoration: "line-through", marginRight: "0.5rem" }}>₾{Number(p.price).toFixed(2)}</span>}
                <span style={{ fontFamily: "'Playfair Display', serif", color: p.sale_price ? "#ff8fab" : "white", fontWeight: "800", fontSize: "1.35rem" }}>₾{Number(p.sale_price || p.price).toFixed(2)}</span>
              </div>
              <button style={{ background: added ? "#22c55e" : "rgba(212,35,94,0.95)", backdropFilter: "blur(8px)", color: "white", border: "none", padding: "0.55rem 1.3rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "background 0.25s, transform 0.15s", transform: hovered ? "scale(1.06)" : "scale(1)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} onClick={(e) => { e.stopPropagation(); onAdd(); }}>
                {added ? "✓ Added!" : "+ Add"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--bg-card)", borderRadius: "22px", overflow: "hidden", boxShadow: hovered ? "0 22px 52px var(--shadow-md)" : "0 4px 24px var(--shadow)", transform: hovered ? "translateY(-8px)" : "translateY(0)", transition: "transform 0.3s ease, box-shadow 0.3s ease", border: "1px solid var(--border)", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onClick={onOpenModal}
    >
      <div style={{ background: isDark ? "linear-gradient(135deg, rgba(212,35,94,0.09), rgba(100,20,50,0.18))" : "linear-gradient(135deg, #fff0f5, #ffdae8)", height: "178px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: "4.5rem", filter: hovered ? "drop-shadow(0 10px 20px rgba(212,35,94,0.32))" : "none", transition: "filter 0.3s, transform 0.3s", transform: hovered ? "scale(1.1)" : "scale(1)", display: "block" }}>{p.emoji}</span>
        {p.sale_price ? (
          <div style={{ position: "absolute", top: "0.85rem", right: "0.85rem", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", fontSize: "0.6rem", fontWeight: "800", padding: "0.22rem 0.7rem", borderRadius: "50px", letterSpacing: "0.08em", boxShadow: "0 4px 12px rgba(212,35,94,0.45)" }}>🏷 SALE</div>
        ) : (
          <div style={{ position: "absolute", top: "0.85rem", right: "0.85rem", background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)", fontSize: "0.6rem", fontWeight: "800", padding: "0.22rem 0.7rem", borderRadius: "50px", letterSpacing: "0.08em" }}>✓ FRESH</div>
        )}
      </div>
      <div style={{ padding: "1.3rem 1.6rem 1.6rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.08rem", fontWeight: "700", color: "var(--text)", marginBottom: "0.4rem" }}>{p.name}</h3>
        {p.description && <p style={{ color: "var(--text-muted)", fontSize: "0.79rem", lineHeight: 1.6, marginBottom: "0.8rem" }}>{p.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <div>
            <div style={{ color: "var(--text-faint)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>{p.sale_price ? "Sale Price" : "Price"}</div>
            {p.sale_price && <span style={{ color: "var(--text-faint)", fontSize: "0.82rem", textDecoration: "line-through", marginRight: "0.4rem" }}>₾{Number(p.price).toFixed(2)}</span>}
            <span style={{ color: "var(--accent)", fontWeight: "800", fontSize: "1.25rem", fontFamily: "'Playfair Display', serif" }}>₾{Number(p.sale_price || p.price).toFixed(2)}</span>
          </div>
          <button style={{ background: added ? "#22c55e" : "var(--accent)", color: "white", border: "none", padding: "0.6rem 1.35rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "background 0.25s, transform 0.15s", transform: hovered ? "scale(1.05)" : "scale(1)", boxShadow: added ? "0 4px 14px rgba(34,197,94,0.35)" : "0 4px 16px rgba(212,35,94,0.3)" }} onClick={(e) => { e.stopPropagation(); onAdd(); }}>
            {added ? "✓ Added!" : "+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  headerInner: { maxWidth: "1280px", margin: "0 auto", padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px" },
  brandBtn: { display: "flex", alignItems: "center", gap: "0.85rem", background: "none", border: "none", cursor: "pointer", padding: 0 },
  brandIcon: { width: "40px", height: "40px", borderRadius: "12px", background: "rgba(212,35,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
  brandName: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.12rem", fontWeight: "700", lineHeight: 1 },
  brandSub: { color: "rgba(255,255,255,0.25)", fontSize: "0.54rem", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: "3px" },
  headerNav: { display: "flex", gap: "0.2rem" },
  navLink: { background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500", padding: "0.4rem 1rem", borderRadius: "8px", transition: "color 0.15s, background 0.15s" },
  headerActions: { display: "flex", alignItems: "center", gap: "0.6rem" },
  themeBtn: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", width: "38px", height: "38px", borderRadius: "10px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" },
  userPill: { display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.13)", borderRadius: "50px", padding: "0.35rem 1rem", cursor: "pointer" },
  userDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 },
  userName: { color: "rgba(255,255,255,0.82)", fontSize: "0.83rem", fontWeight: "500" },
  staffBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", color: "white", padding: "0.42rem 1.05rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" },
  authBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.85)", padding: "0.42rem 1.15rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.83rem" },
  cartBtn: { background: "#d4235e", border: "none", color: "white", width: "44px", height: "44px", borderRadius: "13px", cursor: "pointer", fontSize: "1.15rem", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 4px 12px rgba(212,35,94,0.4)" },
  badge: { position: "absolute", top: "-5px", right: "-5px", background: "white", color: "#d4235e", borderRadius: "50%", fontSize: "0.6rem", fontWeight: "900", width: "19px", height: "19px", display: "flex", alignItems: "center", justifyContent: "center" },
  main: { maxWidth: "1280px", margin: "0 auto", padding: "5.5rem 2rem 5rem" },
  menuHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.95rem", fontWeight: "700" },
  footerHeading: { color: "rgba(255,255,255,0.55)", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.2rem" },
  footerLine: { color: "rgba(255,255,255,0.28)", fontSize: "0.81rem", marginBottom: "0.55rem", lineHeight: 1.6 },
  footerLink: { color: "rgba(255,255,255,0.42)", fontSize: "0.81rem", marginBottom: "0.55rem", display: "block", textDecoration: "none" },
  footerNavBtn: { display: "block", background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: "0.81rem", padding: "0.32rem 0", textAlign: "left", marginBottom: "0.2rem", transition: "color 0.15s" },
  about: { padding: "6rem 2rem" },
  aboutInner: { maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" },
};

const os = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "30px", padding: "2.4rem 2.2rem 2.8rem", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "0 50px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)" },
  iconRing: { width: "88px", height: "88px", borderRadius: "50%", background: "linear-gradient(135deg, #fff3e0, #ffe0b2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.2rem", boxShadow: "0 10px 30px rgba(255,152,0,0.25)", animation: "float 2.5s ease-in-out infinite" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.85rem", fontWeight: "700", marginBottom: "0.45rem" },
  sub: { color: "#8b6070", fontSize: "0.88rem", marginBottom: "1.6rem", lineHeight: 1.7 },
  codeSection: { background: "linear-gradient(135deg, #1c0f18, #3a1430)", borderRadius: "20px", padding: "1.4rem 1.6rem", marginBottom: "1.4rem" },
  codeLabel: { color: "rgba(255,255,255,0.35)", fontSize: "0.58rem", fontWeight: "700", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "0.6rem" },
  code: { fontFamily: "monospace", color: "white", fontSize: "2.8rem", fontWeight: "900", letterSpacing: "0.3em", marginBottom: "0.55rem", animation: "codePop 0.5s ease both" },
  codeHint: { color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", margin: 0 },
  tips: { display: "flex", flexDirection: "column", gap: "0.7rem", background: "#fdf6f2", borderRadius: "16px", padding: "1.1rem 1.2rem", marginBottom: "1.6rem", textAlign: "left" },
  tip: { color: "#6b4c58", fontSize: "0.82rem", lineHeight: 1.5, margin: 0 },
  closeBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.96rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 6px 20px rgba(212,35,94,0.35)" },
};
