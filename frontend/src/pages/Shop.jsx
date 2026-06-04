import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cart from "../components/Cart";
import OrderForm from "../components/OrderForm";
import AuthModal from "../components/AuthModal";
import ProfileModal from "../components/ProfileModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("email"));
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("is_admin") === "true");
  const [isDelivery, setIsDelivery] = useState(() => localStorage.getItem("is_delivery") === "true");
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const scrollToMenu = () => menuRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <header style={{ ...s.header, ...(scrolled ? s.headerShadow : {}) }}>
        <div style={s.headerInner}>
          <button style={s.brandBtn} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span style={s.brandIcon}>🍰</span>
            <div>
              <div style={s.brandName}>საკონდიტრო</div>
              <div style={s.brandSub}>artisan bakery · tbilisi</div>
            </div>
          </button>

          <nav style={s.headerNav}>
            <button style={s.navLink} onClick={scrollToMenu}>Menu</button>
            <button style={s.navLink} onClick={() => scrollTo("about-section")}>About</button>
            <button style={s.navLink} onClick={() => scrollTo("contact-section")}>Contact</button>
          </nav>

          <div style={s.headerActions}>
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
              🛒 Cart
              {totalItems > 0 && <span style={s.badge}>{totalItems}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroTag}>🇬🇪 Tbilisi's Finest Patisserie</div>
          <h1 style={s.heroTitle}>Every bite tells<br />a <span style={s.heroEm}>sweet</span> story</h1>
          <p style={s.heroSub}>
            Handcrafted cakes, pastries & confections made fresh daily<br />
            with the finest local Georgian ingredients
          </p>
          <div style={s.heroBtns}>
            <button style={s.heroBtn} onClick={scrollToMenu}>Explore Our Menu</button>
            {!userEmail && (
              <button style={s.heroBtnOutline} onClick={() => setAuthOpen(true)}>
                Create Account →
              </button>
            )}
          </div>
          <div style={s.heroStats}>
            <div style={s.heroStat}>
              <span style={s.heroStatNum}>500+</span>
              <span style={s.heroStatLabel}>Happy Customers</span>
            </div>
            <div style={s.heroStatDiv} />
            <div style={s.heroStat}>
              <span style={s.heroStatNum}>50+</span>
              <span style={s.heroStatLabel}>Menu Items</span>
            </div>
            <div style={s.heroStatDiv} />
            <div style={s.heroStat}>
              <span style={s.heroStatNum}>5★</span>
              <span style={s.heroStatLabel}>Rating</span>
            </div>
            <div style={s.heroStatDiv} />
            <div style={s.heroStat}>
              <span style={s.heroStatNum}>3yr</span>
              <span style={s.heroStatLabel}>Experience</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section style={s.features}>
        {[
          { icon: "🌅", title: "Baked Fresh Daily", desc: "Prepared every morning — never frozen, never pre-made" },
          { icon: "🚚", title: "City-Wide Delivery", desc: "We deliver across Tbilisi, or pick up at our kitchen" },
          { icon: "💝", title: "Handmade with Love", desc: "Traditional Georgian recipes with locally-sourced ingredients" },
          { icon: "🎂", title: "Custom Orders", desc: "Birthday cakes, weddings, corporate events — we do it all" },
        ].map((f) => (
          <div key={f.title} style={s.featureCard}>
            <span style={s.featureIcon}>{f.icon}</span>
            <h3 style={s.featureTitle}>{f.title}</h3>
            <p style={s.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Menu ── */}
      <main style={s.main} ref={menuRef}>
        <div style={s.menuHeader}>
          <div>
            <p style={s.menuKicker}>WHAT WE MAKE</p>
            <h2 style={s.sectionTitle}>Today's Menu</h2>
          </div>
          <p style={s.menuCount}>
            {products.length} item{products.length !== 1 ? "s" : ""} available today
          </p>
        </div>

        {loading ? (
          <div style={s.loadingWrap}>
            <span style={s.spinner}>🍰</span>
            <p style={s.loadingText}>Loading today's menu...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={s.loadingWrap}>
            <span style={s.spinner}>🍽️</span>
            <p style={s.loadingText}>Menu coming soon. Check back later!</p>
          </div>
        ) : (
          <div style={s.grid}>
            {products.map((p) => (
              <div
                key={p.id}
                style={s.card}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 24px 48px rgba(212,35,94,0.13)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.07)";
                }}
              >
                <div style={s.cardImgWrap}>
                  <span style={s.cardEmoji}>{p.emoji}</span>
                  <div style={s.freshBadge}>✓ Fresh Today</div>
                </div>
                <div style={s.cardBody}>
                  <h3 style={s.cardName}>{p.name}</h3>
                  {p.description && <p style={s.cardDesc}>{p.description}</p>}
                  <div style={s.cardFooter}>
                    <div>
                      <div style={s.cardPriceLabel}>Price</div>
                      <span style={s.cardPrice}>₾{Number(p.price).toFixed(2)}</span>
                    </div>
                    <button style={s.addBtn} onClick={() => addToCart(p)}>
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── About ── */}
      <section style={s.about} id="about-section">
        <div style={s.aboutInner}>
          <div style={s.aboutLeft}>
            <p style={s.aboutKicker}>OUR STORY</p>
            <h2 style={s.aboutTitle}>Sweetness rooted<br />in Georgian tradition</h2>
            <p style={s.aboutText}>
              Founded with a deep love for Georgian confectionery, we blend
              time-honored family recipes with modern pastry techniques to create
              unforgettable sweets for every occasion.
            </p>
            <p style={s.aboutText}>
              Each product is crafted in small batches to ensure the highest quality,
              freshness, and care in every single bite we serve.
            </p>
            <div style={s.aboutTags}>
              {["100% Homemade", "Local Ingredients", "No Preservatives", "Same-Day Delivery"].map(t => (
                <span key={t} style={s.aboutTag}>✓ {t}</span>
              ))}
            </div>
          </div>
          <div style={s.aboutRight}>
            <div style={s.specialtyGrid}>
              {[
                { icon: "🍰", label: "Layer Cakes", desc: "Celebration cakes for every occasion" },
                { icon: "🥐", label: "Pastries", desc: "Flaky, buttery, baked fresh daily" },
                { icon: "🍫", label: "Chocolates", desc: "Hand-dipped truffles & bonbons" },
                { icon: "🎂", label: "Custom Orders", desc: "Weddings, birthdays, events" },
              ].map((sp) => (
                <div key={sp.label} style={s.specialtyCard}>
                  <span style={s.specialtyIcon}>{sp.icon}</span>
                  <p style={s.specialtyLabel}>{sp.label}</p>
                  <p style={s.specialtyDesc}>{sp.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={s.cta} id="contact-section">
        <div style={s.ctaInner}>
          <h2 style={s.ctaTitle}>Ready to order something special?</h2>
          <p style={s.ctaSub}>
            Place your order online or call us for custom requests and special occasions
          </p>
          <div style={s.ctaBtns}>
            <button style={s.ctaBtn} onClick={scrollToMenu}>Order Online</button>
            <a href="tel:+995555000000" style={s.ctaBtnOutline}>📞 Call Us</a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={s.footer}>
        <div style={s.footerInner}>
          <div style={s.footerCol}>
            <div style={s.footerBrand}>
              <span style={s.footerBrandIcon}>🍰</span>
              <div>
                <div style={s.footerBrandName}>საკონდიტრო</div>
                <div style={s.footerBrandSub}>Artisan Bakery · Tbilisi</div>
              </div>
            </div>
            <p style={s.footerTagline}>
              Making every celebration sweeter<br />since 2021.
            </p>
          </div>
          <div style={s.footerCol}>
            <p style={s.footerHeading}>Hours</p>
            <p style={s.footerLine}>Mon – Fri: 9:00 – 20:00</p>
            <p style={s.footerLine}>Saturday: 10:00 – 19:00</p>
            <p style={s.footerLine}>Sunday: Closed</p>
          </div>
          <div style={s.footerCol}>
            <p style={s.footerHeading}>Contact</p>
            <a href="tel:+995555000000" style={s.footerLink}>📞 +995 555 000 000</a>
            <p style={s.footerLine}>📍 Tbilisi, Georgia</p>
          </div>
          <div style={s.footerCol}>
            <p style={s.footerHeading}>Quick Links</p>
            <button style={s.footerNavBtn} onClick={scrollToMenu}>View Menu</button>
            <button style={s.footerNavBtn} onClick={() => setAuthOpen(true)}>
              {userEmail ? "My Profile" : "Sign In"}
            </button>
            {isAdmin && (
              <button style={s.footerNavBtn} onClick={() => navigate("/admin")}>Admin Panel</button>
            )}
          </div>
        </div>
        <div style={s.footerBottom}>
          <span style={s.footerCopy}>© 2024 საკონდიტრო — Made with ❤️ in Tbilisi, Georgia</span>
        </div>
      </footer>

      {cartOpen && (
        <Cart
          cart={cart}
          setCart={setCart}
          onClose={() => setCartOpen(false)}
          onOrder={() => { setCartOpen(false); setOrderOpen(true); }}
        />
      )}
      {orderOpen && (
        <OrderForm
          cart={cart}
          backendUrl={BACKEND_URL}
          onClose={() => setOrderOpen(false)}
          onSuccess={() => {
            setCart([]);
            setOrderOpen(false);
            setOrderSuccess(true);
            setTimeout(() => setOrderSuccess(false), 5000);
          }}
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
            setUserEmail(null);
            setIsAdmin(false);
            setIsDelivery(false);
            setProfileOpen(false);
          }}
        />
      )}
      {orderSuccess && (
        <div style={s.toast}>✅ Order placed! We'll call you shortly to confirm.</div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#fdf6f2", fontFamily: "'Inter', sans-serif" },

  /* Header */
  header: { background: "#1c0f18", position: "sticky", top: 0, zIndex: 50, transition: "box-shadow 0.2s" },
  headerShadow: { boxShadow: "0 4px 30px rgba(0,0,0,0.35)" },
  headerInner: { maxWidth: "1280px", margin: "0 auto", padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: "68px" },
  brandBtn: { display: "flex", alignItems: "center", gap: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: 0 },
  brandIcon: { fontSize: "1.8rem" },
  brandName: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.15rem", fontWeight: "700", lineHeight: 1 },
  brandSub: { color: "rgba(255,255,255,0.28)", fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "3px" },

  headerNav: { display: "flex", gap: "0.5rem" },
  navLink: { background: "none", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: "0.85rem", fontWeight: "500", padding: "0.4rem 0.9rem", borderRadius: "8px" },

  headerActions: { display: "flex", alignItems: "center", gap: "0.7rem" },
  userPill: { display: "flex", alignItems: "center", gap: "0.45rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "50px", padding: "0.32rem 0.9rem", cursor: "pointer" },
  userDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#4caf50", flexShrink: 0 },
  userName: { color: "rgba(255,255,255,0.8)", fontSize: "0.82rem", fontWeight: "500" },
  userChevron: { color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" },
  staffBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.22)", color: "white", padding: "0.42rem 1rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" },
  authBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.8)", padding: "0.42rem 1.1rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.82rem" },
  cartBtn: { background: "#d4235e", border: "none", color: "white", padding: "0.48rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.84rem", fontWeight: "600", position: "relative", display: "flex", alignItems: "center", gap: "0.4rem" },
  badge: { background: "white", color: "#d4235e", borderRadius: "50%", padding: "1px 6px", fontSize: "0.66rem", fontWeight: "800", minWidth: "18px", textAlign: "center" },

  /* Hero */
  hero: { background: "linear-gradient(150deg, #1c0f18 0%, #3a1430 50%, #6b1d40 100%)", padding: "6rem 2rem 5rem", textAlign: "center", position: "relative", overflow: "hidden" },
  heroInner: { maxWidth: "720px", margin: "0 auto", position: "relative" },
  heroTag: { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,35,94,0.2)", border: "1px solid rgba(212,35,94,0.4)", color: "#f4a3b8", borderRadius: "50px", padding: "0.4rem 1.1rem", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.05em", marginBottom: "1.6rem" },
  heroTitle: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: "700", lineHeight: 1.2, marginBottom: "1.2rem" },
  heroEm: { color: "#f4a3b8", fontStyle: "italic" },
  heroSub: { color: "rgba(255,255,255,0.55)", fontSize: "1rem", lineHeight: 1.75, marginBottom: "2.2rem" },
  heroBtns: { display: "flex", gap: "0.9rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" },
  heroBtn: { background: "#d4235e", border: "none", color: "white", padding: "0.85rem 2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 8px 30px rgba(212,35,94,0.4)" },
  heroBtnOutline: { background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)", padding: "0.85rem 2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "500", cursor: "pointer" },
  heroStats: { display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" },
  heroStat: { display: "flex", flexDirection: "column", alignItems: "center" },
  heroStatNum: { color: "white", fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: "700", lineHeight: 1 },
  heroStatLabel: { color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "0.3rem" },
  heroStatDiv: { width: "1px", height: "36px", background: "rgba(255,255,255,0.12)" },

  /* Features */
  features: { background: "white", borderBottom: "1px solid #f0eaf4", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" },
  featureCard: { padding: "2.2rem 2rem", textAlign: "center", borderRight: "1px solid #f0eaf4" },
  featureIcon: { fontSize: "2rem", display: "block", marginBottom: "0.8rem" },
  featureTitle: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "0.98rem", fontWeight: "700", marginBottom: "0.5rem" },
  featureDesc: { color: "#8b6070", fontSize: "0.8rem", lineHeight: 1.6 },

  /* Menu */
  main: { maxWidth: "1280px", margin: "0 auto", padding: "5rem 2rem 4rem" },
  menuHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" },
  menuKicker: { color: "#d4235e", fontSize: "0.68rem", letterSpacing: "0.2em", fontWeight: "700", marginBottom: "0.4rem" },
  sectionTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", color: "#1c0f18", fontWeight: "700" },
  menuCount: { color: "#8b6070", fontSize: "0.85rem", background: "#fdf0f5", padding: "0.4rem 1rem", borderRadius: "50px", border: "1px solid #f5dde8" },

  loadingWrap: { textAlign: "center", padding: "6rem 2rem" },
  spinner: { fontSize: "3rem", display: "block", marginBottom: "1rem" },
  loadingText: { color: "#8b6070", fontSize: "1rem" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.6rem" },
  card: { background: "white", borderRadius: "22px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", transition: "transform 0.25s ease, box-shadow 0.25s ease" },
  cardImgWrap: { background: "linear-gradient(135deg, #fff0f5, #ffdae8)", padding: "2.5rem 1rem 2rem", textAlign: "center", position: "relative" },
  cardEmoji: { fontSize: "4rem", display: "block" },
  freshBadge: { position: "absolute", top: "0.8rem", right: "0.8rem", background: "rgba(212,35,94,0.12)", color: "#d4235e", fontSize: "0.65rem", fontWeight: "700", padding: "0.2rem 0.6rem", borderRadius: "50px", letterSpacing: "0.03em" },
  cardBody: { padding: "1.3rem 1.5rem 1.6rem" },
  cardName: { fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: "700", color: "#1c0f18", marginBottom: "0.4rem" },
  cardDesc: { color: "#8b6070", fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "0.8rem" },
  cardFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.8rem" },
  cardPriceLabel: { color: "#8b6070", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1px" },
  cardPrice: { color: "#d4235e", fontWeight: "800", fontSize: "1.2rem", fontFamily: "'Playfair Display', serif" },
  addBtn: { background: "#d4235e", color: "white", border: "none", padding: "0.52rem 1.2rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600", transition: "background 0.15s" },

  /* About */
  about: { background: "white", padding: "6rem 2rem" },
  aboutInner: { maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" },
  aboutLeft: {},
  aboutKicker: { color: "#d4235e", fontSize: "0.68rem", letterSpacing: "0.2em", fontWeight: "700", marginBottom: "0.8rem" },
  aboutTitle: { fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", color: "#1c0f18", fontWeight: "700", lineHeight: 1.25, marginBottom: "1.4rem" },
  aboutText: { color: "#6b4c58", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "1rem" },
  aboutTags: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" },
  aboutTag: { background: "#fdf0f5", color: "#d4235e", fontSize: "0.78rem", fontWeight: "600", padding: "0.35rem 0.9rem", borderRadius: "50px", border: "1px solid #f5dde8" },
  aboutRight: {},
  specialtyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  specialtyCard: { background: "#fdf6f2", border: "1px solid #f0eaf4", borderRadius: "18px", padding: "1.5rem", textAlign: "center" },
  specialtyIcon: { fontSize: "2rem", display: "block", marginBottom: "0.6rem" },
  specialtyLabel: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontWeight: "700", fontSize: "0.95rem", marginBottom: "0.3rem" },
  specialtyDesc: { color: "#8b6070", fontSize: "0.75rem", lineHeight: 1.5 },

  /* CTA */
  cta: { background: "linear-gradient(135deg, #1c0f18 0%, #3a1430 100%)", padding: "5rem 2rem", textAlign: "center" },
  ctaInner: { maxWidth: "600px", margin: "0 auto" },
  ctaTitle: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "700", marginBottom: "1rem" },
  ctaSub: { color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" },
  ctaBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },
  ctaBtn: { background: "#d4235e", border: "none", color: "white", padding: "0.85rem 2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "600", cursor: "pointer", boxShadow: "0 8px 24px rgba(212,35,94,0.35)" },
  ctaBtnOutline: { background: "transparent", border: "1.5px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.85)", padding: "0.85rem 2rem", borderRadius: "50px", fontSize: "0.95rem", fontWeight: "500", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" },

  /* Footer */
  footer: { background: "#100809", padding: "4rem 2rem 0" },
  footerInner: { maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "3rem", paddingBottom: "3rem", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  footerCol: {},
  footerBrand: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" },
  footerBrandIcon: { fontSize: "1.8rem" },
  footerBrandName: { fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.1rem", fontWeight: "700" },
  footerBrandSub: { color: "rgba(255,255,255,0.3)", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase" },
  footerTagline: { color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", lineHeight: 1.7 },
  footerHeading: { color: "rgba(255,255,255,0.7)", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" },
  footerLine: { color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", marginBottom: "0.5rem", lineHeight: 1.6 },
  footerLink: { color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", marginBottom: "0.5rem", display: "block", textDecoration: "none" },
  footerNavBtn: { display: "block", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "0.82rem", padding: "0.3rem 0", textAlign: "left", marginBottom: "0.3rem" },
  footerBottom: { maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 0", display: "flex", justifyContent: "center" },
  footerCopy: { color: "rgba(255,255,255,0.2)", fontSize: "0.78rem" },

  /* Toast */
  toast: { position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #2e7d32, #1b5e20)", color: "white", padding: "1rem 2rem", borderRadius: "50px", fontSize: "0.92rem", fontWeight: "600", zIndex: 1000, boxShadow: "0 8px 30px rgba(46,125,50,0.4)", whiteSpace: "nowrap" },
};
