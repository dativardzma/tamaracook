import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Cart from "../components/Cart";
import OrderForm from "../components/OrderForm";
import AuthModal from "../components/AuthModal";
import ProfileModal from "../components/ProfileModal";

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
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setAddedIds((prev) => new Set([...prev, product.id]));
    setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(product.id); return n; }), 1600);
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const V = isDark ? dark : light;

  return (
    <div style={{ ...s.page, background: "var(--bg)" }}>

      {/* ── Header ── */}
      <header style={{
        ...s.header,
        background: scrolled
          ? isDark ? "rgba(10,6,12,0.92)" : "rgba(28,15,24,0.95)"
          : "rgba(28,15,24,1)",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        boxShadow: scrolled ? "0 4px 40px rgba(0,0,0,0.35)" : "none",
      }}>
        <div style={s.headerInner}>
          <button style={s.brandBtn} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div style={s.brandLogoRing}><span style={s.brandIcon}>🍰</span></div>
            <div>
              <div style={s.brandName}>საკონდიტრო</div>
              <div style={s.brandSub}>artisan bakery · tbilisi</div>
            </div>
          </button>

          <nav style={s.headerNav}>
            {[["Menu", scrollToMenu], ["About", () => scrollTo("about-section")], ["Contact", () => scrollTo("contact-section")]].map(([label, fn]) => (
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
                <span style={s.userChevron}>▾</span>
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
      <section style={s.hero}>
        {/* Decorative circles */}
        <div style={{ ...s.heroDeco, width: "600px", height: "600px", top: "-200px", right: "-150px", background: "radial-gradient(circle, rgba(212,35,94,0.18) 0%, transparent 70%)" }} />
        <div style={{ ...s.heroDeco, width: "400px", height: "400px", bottom: "-100px", left: "-80px", background: "radial-gradient(circle, rgba(107,29,64,0.3) 0%, transparent 70%)" }} />

        <div style={s.heroInner}>
          <div style={s.heroTag}>🇬🇪 Tbilisi's Finest Patisserie</div>
          <h1 style={s.heroTitle}>
            Every bite<br />
            tells a <span style={s.heroEm}>sweet</span> story
          </h1>
          <p style={s.heroSub}>
            Handcrafted cakes, pastries & confections made fresh daily<br />
            with the finest local Georgian ingredients
          </p>
          <div style={s.heroBtns}>
            <button style={s.heroBtn}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(212,35,94,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(212,35,94,0.4)"; }}
              onClick={scrollToMenu}
            >
              Explore Our Menu ↓
            </button>
            {!userEmail && (
              <button style={s.heroBtnOutline} onClick={() => setAuthOpen(true)}>
                Create Account →
              </button>
            )}
          </div>
          <div style={s.heroStats}>
            {[["500+", "Happy Customers"], ["50+", "Menu Items"], ["5★", "Rating"], ["3yr", "Experience"]].map(([num, label], i, arr) => (
              <span key={num} style={{ display: "contents" }}>
                <div style={s.heroStat}>
                  <span style={s.heroStatNum}>{num}</span>
                  <span style={s.heroStatLabel}>{label}</span>
                </div>
                {i < arr.length - 1 && <div style={s.heroStatDiv} />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section style={{ ...s.features, background: "var(--feature-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        {[
          { icon: "🌅", title: "Baked Fresh Daily", desc: "Prepared every morning — never frozen, never pre-made" },
          { icon: "🚚", title: "City-Wide Delivery", desc: "We deliver across Tbilisi within 45–75 minutes" },
          { icon: "💝", title: "Handmade with Love", desc: "Traditional Georgian recipes, locally-sourced ingredients" },
          { icon: "🎂", title: "Custom Orders", desc: "Birthdays, weddings, corporate events — we do it all" },
        ].map((f, i) => (
          <div key={f.title} style={{ ...s.featureCard, borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
            <div style={s.featureIconWrap}>{f.icon}</div>
            <h3 style={{ ...s.featureTitle, color: "var(--text)" }}>{f.title}</h3>
            <p style={{ ...s.featureDesc, color: "var(--text-muted)" }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Menu ── */}
      <main style={s.main} ref={menuRef}>
        <div style={s.menuHeader}>
          <div>
            <p style={s.menuKicker}>WHAT WE MAKE</p>
            <h2 style={{ ...s.sectionTitle, color: "var(--text)" }}>Today's Menu</h2>
          </div>
          <div style={{ ...s.menuMeta, color: "var(--text-muted)" }}>
            <span style={{ ...s.menuCount, background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)" }}>
              {products.length} items available
            </span>
          </div>
        </div>

        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.loadingSpinner} />
            <p style={{ ...s.loadingText, color: "var(--text-muted)" }}>Loading today's menu...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={s.loadingWrap}>
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>🍽️</span>
            <p style={{ ...s.loadingText, color: "var(--text-muted)" }}>Menu coming soon. Check back later!</p>
          </div>
        ) : (
          <div style={s.grid}>
            {products.map((p) => (
              <ProductCard key={p.id} p={p} isDark={isDark} added={addedIds.has(p.id)} onAdd={() => addToCart(p)} />
            ))}
          </div>
        )}
      </main>

      {/* ── About ── */}
      <section style={{ ...s.about, background: "var(--bg-card)", borderTop: "1px solid var(--border)" }} id="about-section">
        <div style={s.aboutInner}>
          <div>
            <p style={s.aboutKicker}>OUR STORY</p>
            <h2 style={{ ...s.aboutTitle, color: "var(--text)" }}>Sweetness rooted<br />in Georgian tradition</h2>
            <p style={{ ...s.aboutText, color: "var(--text-muted)" }}>
              Founded with a deep love for Georgian confectionery, we blend time-honored family recipes with modern pastry techniques to create unforgettable sweets for every occasion.
            </p>
            <p style={{ ...s.aboutText, color: "var(--text-muted)" }}>
              Each product is crafted in small batches to ensure the highest quality, freshness, and care in every single bite.
            </p>
            <div style={s.aboutTags}>
              {["100% Homemade", "Local Ingredients", "No Preservatives", "Same-Day Delivery"].map(t => (
                <span key={t} style={{ ...s.aboutTag, background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)" }}>✓ {t}</span>
              ))}
            </div>
          </div>
          <div style={s.specialtyGrid}>
            {[
              { icon: "🍰", label: "Layer Cakes", desc: "Celebration cakes for every occasion" },
              { icon: "🥐", label: "Pastries", desc: "Flaky, buttery, baked fresh daily" },
              { icon: "🍫", label: "Chocolates", desc: "Hand-dipped truffles & bonbons" },
              { icon: "🎂", label: "Custom Orders", desc: "Weddings, birthdays, events" },
            ].map((sp) => (
              <div key={sp.label} style={{ ...s.specialtyCard, background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                <span style={s.specialtyIcon}>{sp.icon}</span>
                <p style={{ ...s.specialtyLabel, color: "var(--text)" }}>{sp.label}</p>
                <p style={{ ...s.specialtyDesc, color: "var(--text-muted)" }}>{sp.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={s.cta} id="contact-section">
        <div style={s.ctaInner}>
          <h2 style={s.ctaTitle}>Ready to order something special?</h2>
          <p style={s.ctaSub}>Browse our menu and place your order online, or call us for custom requests</p>
          <div style={s.ctaBtns}>
            <button style={s.ctaBtn} onClick={scrollToMenu}>Order Online</button>
            <a href="tel:+995555000000" style={s.ctaBtnOutline}>📞 Call Us Now</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div>
            <div style={s.footerBrand}>
              <span style={s.footerBrandIcon}>🍰</span>
              <div>
                <div style={s.footerBrandName}>საკონდიტრო</div>
                <div style={s.footerBrandSub}>Artisan Bakery · Tbilisi</div>
              </div>
            </div>
            <p style={s.footerTagline}>Making every celebration sweeter<br />since 2021.</p>
          </div>
          <div>
            <p style={s.footerHeading}>Hours</p>
            <p style={s.footerLine}>Mon – Fri: 9:00 – 20:00</p>
            <p style={s.footerLine}>Saturday: 10:00 – 19:00</p>
            <p style={s.footerLine}>Sunday: Closed</p>
          </div>
          <div>
            <p style={s.footerHeading}>Contact</p>
            <a href="tel:+995555000000" style={s.footerLink}>📞 +995 555 000 000</a>
            <p style={s.footerLine}>📍 Tbilisi, Georgia</p>
          </div>
          <div>
            <p style={s.footerHeading}>Quick Links</p>
            <button style={s.footerNavBtn} onClick={scrollToMenu}>View Menu</button>
            <button style={s.footerNavBtn} onClick={() => userEmail ? setProfileOpen(true) : setAuthOpen(true)}>
              {userEmail ? "My Profile" : "Sign In"}
            </button>
            {isAdmin && <button style={s.footerNavBtn} onClick={() => navigate("/admin")}>Admin Panel</button>}
            <button style={s.footerNavBtn} onClick={toggle}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
          </div>
        </div>
        <div style={s.footerBottom}>
          <span style={s.footerCopy}>© 2024 საკონდიტრო — Made with ❤️ in Tbilisi, Georgia</span>
        </div>
      </footer>

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

      {/* Order Success Modal */}
      {orderSuccess && (
        <div style={os.overlay} onClick={() => setOrderSuccess(false)}>
          <div style={os.modal} className="animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div style={os.iconCircle}>✅</div>
            <h2 style={os.title}>Order Placed!</h2>
            <p style={os.sub}>We'll call you shortly to confirm your order</p>
            {orderCode && (
              <div style={os.codeSection}>
                <p style={os.codeLabel}>YOUR ORDER CODE</p>
                <div style={os.code}>{orderCode}</div>
                <p style={os.codeHint}>Screenshot this — use it to track your order</p>
              </div>
            )}
            <div style={os.tips}>
              <div style={os.tip}>📞 We'll call you to confirm within minutes</div>
              <div style={os.tip}>🚚 Estimated delivery: 45–75 minutes</div>
              <div style={os.tip}>🍰 Your treats are being freshly prepared</div>
            </div>
            <button style={os.closeBtn} onClick={() => setOrderSuccess(false)}>All Good! 🎉</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Product Card (separated so it can use its own hover state) ──────────────
function ProductCard({ p, isDark, added, onAdd }) {
  const [hovered, setHovered] = useState(false);

  if (p.image_data) {
    return (
      <div
        style={{
          borderRadius: "22px",
          overflow: "hidden",
          cursor: "pointer",
          boxShadow: hovered ? "0 24px 60px rgba(0,0,0,0.25)" : "0 4px 24px rgba(0,0,0,0.1)",
          transform: hovered ? "translateY(-8px)" : "translateY(0)",
          transition: "transform 0.28s ease, box-shadow 0.28s ease",
          position: "relative",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: "relative", height: "280px" }}>
          <img src={p.image_data} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt={p.name} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)" }} />
          <div style={{ position: "absolute", top: "0.85rem", right: "0.85rem", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(10px)", color: "rgba(255,255,255,0.9)", fontSize: "0.62rem", fontWeight: "700", padding: "0.22rem 0.7rem", borderRadius: "50px", letterSpacing: "0.06em" }}>
            ✓ FRESH TODAY
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.4rem 1.5rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.1rem", fontWeight: "700", marginBottom: "0.3rem", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>{p.name}</h3>
            {p.description && <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.76rem", marginBottom: "0.8rem", lineHeight: 1.4 }}>{p.description}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", color: "white", fontWeight: "800", fontSize: "1.3rem" }}>₾{Number(p.price).toFixed(2)}</span>
              <button
                style={{
                  background: added ? "#22c55e" : "rgba(212,35,94,0.92)",
                  backdropFilter: "blur(8px)",
                  color: "white", border: "none", padding: "0.5rem 1.2rem",
                  borderRadius: "50px", cursor: "pointer", fontSize: "0.84rem", fontWeight: "700",
                  transition: "background 0.25s, transform 0.15s",
                  transform: hovered ? "scale(1.05)" : "scale(1)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                }}
                onClick={onAdd}
              >
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
      style={{
        background: "var(--bg-card)",
        borderRadius: "22px",
        overflow: "hidden",
        boxShadow: hovered ? "0 20px 48px var(--shadow-md)" : "0 4px 24px var(--shadow)",
        transform: hovered ? "translateY(-8px)" : "translateY(0)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
        border: "1px solid var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: isDark ? "linear-gradient(135deg, rgba(212,35,94,0.08), rgba(100,20,50,0.15))" : "linear-gradient(135deg, #fff0f5, #ffdae8)",
        height: "170px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
      }}>
        <span style={{ fontSize: "4.2rem", filter: hovered ? "drop-shadow(0 8px 16px rgba(212,35,94,0.3))" : "none", transition: "filter 0.28s" }}>{p.emoji}</span>
        <div style={{ position: "absolute", top: "0.8rem", right: "0.8rem", background: "var(--accent-light)", color: "var(--accent)", fontSize: "0.62rem", fontWeight: "700", padding: "0.2rem 0.65rem", borderRadius: "50px" }}>
          ✓ Fresh
        </div>
      </div>
      <div style={{ padding: "1.2rem 1.5rem 1.5rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: "700", color: "var(--text)", marginBottom: "0.4rem" }}>{p.name}</h3>
        {p.description && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.55, marginBottom: "0.7rem" }}>{p.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.6rem" }}>
          <div>
            <div style={{ color: "var(--text-faint)", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2px" }}>Price</div>
            <span style={{ color: "var(--accent)", fontWeight: "800", fontSize: "1.2rem", fontFamily: "'Playfair Display', serif" }}>₾{Number(p.price).toFixed(2)}</span>
          </div>
          <button
            style={{
              background: added ? "#22c55e" : "var(--accent)",
              color: "white", border: "none", padding: "0.55rem 1.25rem",
              borderRadius: "50px", cursor: "pointer", fontSize: "0.84rem", fontWeight: "700",
              transition: "background 0.25s, transform 0.15s",
              transform: hovered ? "scale(1.04)" : "scale(1)",
              boxShadow: added ? "0 4px 14px rgba(34,197,94,0.35)" : "0 4px 14px rgba(212,35,94,0.3)",
            }}
            onClick={onAdd}
          >
            {added ? "✓ Added!" : "+ Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

const light = {};
const dark = {};

const s = {
  page: { minHeight: "100vh", fontFamily: "'Inter', sans-serif" },

  header: { position: "sticky", top: 0, zIndex: 50, transition: "background 0.3s, box-shadow 0.3s, backdrop-filter 0.3s" },
  headerInner: { maxWidth: "1280px", margin: "0 auto", padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "66px" },
  brandBtn: { display: "flex", alignItems: "center", gap: "0.8rem", background: "none", border: "none", cursor: "pointer", padding: 0 },
  brandLogoRing: { width: "38px", height: "38px", borderRadius: "12px", background: "rgba(212,35,94,0.18)", display: "flex", alignItems: "center", justifyContent: "center" },
  brandIcon: { fontSize: "1.4rem" },
  brandName: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.1rem", fontWeight: "700", lineHeight: 1 },
  brandSub: { color: "rgba(255,255,255,0.28)", fontSize: "0.56rem", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "2px" },
  headerNav: { display: "flex", gap: "0.3rem" },
  navLink: { background: "none", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: "0.84rem", fontWeight: "500", padding: "0.4rem 0.9rem", borderRadius: "8px", transition: "color 0.15s" },
  headerActions: { display: "flex", alignItems: "center", gap: "0.6rem" },
  themeBtn: { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", width: "36px", height: "36px", borderRadius: "10px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" },
  userPill: { display: "flex", alignItems: "center", gap: "0.45rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "50px", padding: "0.32rem 0.9rem", cursor: "pointer" },
  userDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", flexShrink: 0 },
  userName: { color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", fontWeight: "500" },
  userChevron: { color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" },
  staffBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "0.4rem 1rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" },
  authBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.85)", padding: "0.4rem 1.1rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.82rem" },
  cartBtn: { background: "#d4235e", border: "none", color: "white", width: "42px", height: "42px", borderRadius: "12px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  badge: { position: "absolute", top: "-4px", right: "-4px", background: "white", color: "#d4235e", borderRadius: "50%", fontSize: "0.62rem", fontWeight: "900", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" },

  hero: { background: "linear-gradient(150deg, #1c0f18 0%, #3a1430 50%, #6b1d40 100%)", padding: "7rem 2rem 5.5rem", textAlign: "center", position: "relative", overflow: "hidden" },
  heroDeco: { position: "absolute", borderRadius: "50%", pointerEvents: "none" },
  heroInner: { maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 1 },
  heroTag: { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,35,94,0.18)", border: "1px solid rgba(212,35,94,0.35)", color: "#f4a3b8", borderRadius: "50px", padding: "0.42rem 1.2rem", fontSize: "0.74rem", fontWeight: "600", letterSpacing: "0.05em", marginBottom: "1.8rem", animation: "fadeInUp 0.5s ease both" },
  heroTitle: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2.4rem, 5.5vw, 3.6rem)", fontWeight: "700", lineHeight: 1.18, marginBottom: "1.3rem", animation: "fadeInUp 0.55s ease 0.1s both" },
  heroEm: { color: "#f4a3b8", fontStyle: "italic" },
  heroSub: { color: "rgba(255,255,255,0.5)", fontSize: "1rem", lineHeight: 1.8, marginBottom: "2.5rem", animation: "fadeInUp 0.55s ease 0.2s both" },
  heroBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3.5rem", animation: "fadeInUp 0.55s ease 0.3s both" },
  heroBtn: { background: "#d4235e", border: "none", color: "white", padding: "0.9rem 2.2rem", borderRadius: "50px", fontSize: "0.96rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 30px rgba(212,35,94,0.4)", transition: "transform 0.2s, box-shadow 0.2s" },
  heroBtnOutline: { background: "transparent", border: "1.5px solid rgba(255,255,255,0.28)", color: "rgba(255,255,255,0.88)", padding: "0.9rem 2.2rem", borderRadius: "50px", fontSize: "0.96rem", fontWeight: "500", cursor: "pointer" },
  heroStats: { display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", animation: "fadeInUp 0.55s ease 0.4s both" },
  heroStat: { display: "flex", flexDirection: "column", alignItems: "center" },
  heroStatNum: { color: "white", fontFamily: "'Playfair Display', serif", fontSize: "1.65rem", fontWeight: "700", lineHeight: 1 },
  heroStatLabel: { color: "rgba(255,255,255,0.38)", fontSize: "0.66rem", letterSpacing: "0.09em", textTransform: "uppercase", marginTop: "0.3rem" },
  heroStatDiv: { width: "1px", height: "38px", background: "rgba(255,255,255,0.1)" },

  features: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" },
  featureCard: { padding: "2.2rem 1.8rem", textAlign: "center" },
  featureIconWrap: { fontSize: "2rem", display: "block", marginBottom: "0.8rem" },
  featureTitle: { fontFamily: "'Playfair Display', serif", fontSize: "0.97rem", fontWeight: "700", marginBottom: "0.5rem" },
  featureDesc: { fontSize: "0.8rem", lineHeight: 1.65 },

  main: { maxWidth: "1280px", margin: "0 auto", padding: "5rem 2rem 4.5rem" },
  menuHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.8rem", flexWrap: "wrap", gap: "1rem" },
  menuKicker: { color: "var(--accent)", fontSize: "0.66rem", letterSpacing: "0.22em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.4rem" },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: "700" },
  menuMeta: {},
  menuCount: { fontSize: "0.8rem", fontWeight: "600", padding: "0.42rem 1.1rem", borderRadius: "50px" },
  loadingWrap: { textAlign: "center", padding: "6rem 2rem" },
  loadingSpinner: { width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", margin: "0 auto 1.5rem", animation: "spin 0.8s linear infinite" },
  loadingText: { fontSize: "1rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.6rem" },

  about: { padding: "6rem 2rem" },
  aboutInner: { maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" },
  aboutKicker: { color: "var(--accent)", fontSize: "0.66rem", letterSpacing: "0.22em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.8rem" },
  aboutTitle: { fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: "700", lineHeight: 1.25, marginBottom: "1.4rem" },
  aboutText: { fontSize: "0.94rem", lineHeight: 1.85, marginBottom: "1rem" },
  aboutTags: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" },
  aboutTag: { fontSize: "0.76rem", fontWeight: "600", padding: "0.35rem 0.9rem", borderRadius: "50px" },
  specialtyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  specialtyCard: { borderRadius: "18px", padding: "1.5rem", textAlign: "center" },
  specialtyIcon: { fontSize: "2rem", display: "block", marginBottom: "0.6rem" },
  specialtyLabel: { fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.3rem" },
  specialtyDesc: { fontSize: "0.75rem", lineHeight: 1.5 },

  cta: { background: "linear-gradient(150deg, #1c0f18 0%, #3a1430 100%)", padding: "5.5rem 2rem", textAlign: "center" },
  ctaInner: { maxWidth: "600px", margin: "0 auto" },
  ctaTitle: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "700", marginBottom: "1rem" },
  ctaSub: { color: "rgba(255,255,255,0.5)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2.2rem" },
  ctaBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },
  ctaBtn: { background: "#d4235e", border: "none", color: "white", padding: "0.9rem 2.2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 24px rgba(212,35,94,0.35)" },
  ctaBtnOutline: { background: "transparent", border: "1.5px solid rgba(255,255,255,0.28)", color: "rgba(255,255,255,0.88)", padding: "0.9rem 2.2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" },

  footer: { background: "#0b0609", padding: "4.5rem 2rem 0" },
  footerInner: { maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", paddingBottom: "3rem", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  footerBrand: { display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1rem" },
  footerBrandIcon: { fontSize: "1.8rem" },
  footerBrandName: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.1rem", fontWeight: "700" },
  footerBrandSub: { color: "rgba(255,255,255,0.28)", fontSize: "0.58rem", letterSpacing: "0.15em", textTransform: "uppercase" },
  footerTagline: { color: "rgba(255,255,255,0.3)", fontSize: "0.8rem", lineHeight: 1.7 },
  footerHeading: { color: "rgba(255,255,255,0.6)", fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "1.1rem" },
  footerLine: { color: "rgba(255,255,255,0.32)", fontSize: "0.81rem", marginBottom: "0.5rem", lineHeight: 1.6 },
  footerLink: { color: "rgba(255,255,255,0.45)", fontSize: "0.81rem", marginBottom: "0.5rem", display: "block", textDecoration: "none" },
  footerNavBtn: { display: "block", background: "none", border: "none", color: "rgba(255,255,255,0.38)", cursor: "pointer", fontSize: "0.81rem", padding: "0.3rem 0", textAlign: "left", marginBottom: "0.3rem" },
  footerBottom: { maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 0", display: "flex", justifyContent: "center" },
  footerCopy: { color: "rgba(255,255,255,0.18)", fontSize: "0.76rem" },
};

const os = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "28px", padding: "2.5rem 2rem", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.4)" },
  iconCircle: { width: "80px", height: "80px", background: "linear-gradient(135deg, #dcfce7, #bbf7d0)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", margin: "0 auto 1.3rem" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.8rem", fontWeight: "700", marginBottom: "0.4rem" },
  sub: { color: "#8b6070", fontSize: "0.88rem", marginBottom: "1.6rem" },
  codeSection: { background: "linear-gradient(135deg, #1c0f18, #3a1430)", borderRadius: "20px", padding: "1.4rem 1.6rem", marginBottom: "1.4rem" },
  codeLabel: { color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.6rem" },
  code: { fontFamily: "monospace", color: "white", fontSize: "2.4rem", fontWeight: "900", letterSpacing: "0.25em", marginBottom: "0.5rem", animation: "codePop 0.4s ease both" },
  codeHint: { color: "rgba(255,255,255,0.38)", fontSize: "0.72rem" },
  tips: { display: "flex", flexDirection: "column", gap: "0.5rem", background: "#fdf6f2", borderRadius: "14px", padding: "1rem 1.2rem", marginBottom: "1.6rem", textAlign: "left" },
  tip: { color: "#6b4c58", fontSize: "0.82rem", lineHeight: 1.5 },
  closeBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "0.95rem", borderRadius: "14px", fontSize: "0.95rem", fontWeight: "700", cursor: "pointer" },
};
