import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Cart from "../components/Cart";
import OrderForm from "../components/OrderForm";
import AuthModal from "../components/AuthModal";
import ProfileModal from "../components/ProfileModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const REVIEWS = [
  { name: "Nino T.", city: "Vake", stars: 5, text: "The chocolate cake was absolutely divine — moist, rich, and beautifully decorated. Delivered right on time for my daughter's birthday. This is now our family's go-to bakery!", item: "Custom Cake" },
  { name: "Giorgi M.", city: "Saburtalo", stars: 5, text: "Best pastries in Tbilisi, no contest. The croissants were still warm when they arrived. I placed my second order the very next morning.", item: "Morning Pastries" },
  { name: "Mariam B.", city: "Didube", stars: 5, text: "We've been ordering for our office every Friday for three months. Consistently incredible quality and always on time. Everyone loves it!", item: "Weekly Box" },
];

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
            <div style={s.brandIcon}><span style={{ fontSize: "1.25rem" }}>🍰</span></div>
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,35,94,0.15)", border: "1px solid rgba(212,35,94,0.32)", color: "#f4a3b8", borderRadius: "50px", padding: "0.45rem 1.3rem", fontSize: "0.74rem", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "2rem", animation: "fadeInUp 0.5s ease both" }}>
            🇬🇪 Georgia's Premier Patisserie
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "clamp(2.6rem, 6vw, 4rem)", fontWeight: "700", lineHeight: 1.15, marginBottom: "1.4rem", animation: "fadeInUp 0.55s ease 0.1s both" }}>
            Every bite tells<br />a <em style={{ color: "#f4a3b8", fontStyle: "italic" }}>sweet</em> story
          </h1>

          <p style={{ color: "rgba(255,255,255,0.48)", fontSize: "1.05rem", lineHeight: 1.85, marginBottom: "2.8rem", animation: "fadeInUp 0.55s ease 0.2s both" }}>
            Handcrafted cakes, pastries & confections baked fresh daily<br />from the finest local Georgian ingredients
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "4rem", animation: "fadeInUp 0.55s ease 0.3s both" }}>
            <button
              style={{ background: "#d4235e", border: "none", color: "white", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.98rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 32px rgba(212,35,94,0.45)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(212,35,94,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,35,94,0.45)"; }}
              onClick={scrollToMenu}
            >Explore Our Menu ↓</button>
            {!userEmail && (
              <button style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.85)", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.98rem", fontWeight: "500", cursor: "pointer", transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; e.currentTarget.style.color = "white"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
                onClick={() => setAuthOpen(true)}
              >Create Account →</button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", animation: "fadeInUp 0.55s ease 0.4s both" }}>
            {[["500+", "Happy Customers"], ["50+", "Menu Items"], ["5★", "Rating"], ["3yr", "Experience"]].map(([num, label], i, arr) => (
              <span key={num} style={{ display: "contents" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ color: "white", fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: "700", lineHeight: 1 }}>{num}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.63rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "0.35rem" }}>{label}</span>
                </div>
                {i < arr.length - 1 && <div style={{ width: "1px", height: "40px", background: "rgba(255,255,255,0.1)" }} />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <section style={{ background: "var(--feature-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[
            { icon: "🌅", title: "Baked Fresh Daily", desc: "Prepared every morning — never frozen, never pre-made", color: "#ff9800" },
            { icon: "🚚", title: "City-Wide Delivery", desc: "We deliver across Tbilisi within 45–75 minutes", color: "#d4235e" },
            { icon: "💝", title: "Handmade with Love", desc: "Traditional Georgian recipes, locally-sourced ingredients", color: "#e91e63" },
            { icon: "🎂", title: "Custom Orders", desc: "Birthdays, weddings, corporate events — we do it all", color: "#9c27b0" },
          ].map((f, i) => <FeatureCard key={f.title} f={f} hasBorder={i < 3} />)}
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
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading today's menu...</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "7rem 2rem" }}>
            <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "1rem" }}>🍽️</span>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>Menu coming soon. Check back later!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.6rem" }}>
            {products.map((p) => (
              <ProductCard key={p.id} p={p} isDark={isDark} added={addedIds.has(p.id)} onAdd={() => addToCart(p)} />
            ))}
          </div>
        )}
      </main>

      {/* ── Testimonials ── */}
      <section style={{ background: "var(--feature-bg)", borderTop: "1px solid var(--border)", padding: "5.5rem 2rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p style={{ color: "var(--accent)", fontSize: "0.65rem", letterSpacing: "0.25em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>WHAT PEOPLE SAY</p>
            <h2 style={{ ...s.sectionTitle, color: "var(--text)" }}>Loved by Tbilisi</h2>
            <div style={{ width: "48px", height: "3px", background: "var(--accent)", borderRadius: "2px", margin: "0.8rem auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {REVIEWS.map((r) => (
              <div key={r.name} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "22px", padding: "2rem", boxShadow: "0 4px 24px var(--shadow)" }}>
                <div style={{ display: "flex", gap: "2px", marginBottom: "1rem" }}>
                  {Array.from({ length: r.stars }).map((_, i) => <span key={i} style={{ color: "#f59e0b", fontSize: "1.05rem" }}>★</span>)}
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "1.4rem", fontStyle: "italic" }}>"{r.text}"</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", fontSize: "0.92rem", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>
                      {r.name[0]}
                    </div>
                    <div>
                      <div style={{ color: "var(--text)", fontWeight: "600", fontSize: "0.85rem" }}>{r.name}</div>
                      <div style={{ color: "var(--text-faint)", fontSize: "0.72rem" }}>{r.city}</div>
                    </div>
                  </div>
                  <span style={{ background: "var(--accent-light)", color: "var(--accent)", fontSize: "0.68rem", fontWeight: "600", padding: "0.22rem 0.7rem", borderRadius: "50px", border: "1px solid var(--accent-ring)", whiteSpace: "nowrap" }}>{r.item}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)", padding: "6rem 2rem" }} id="about-section">
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center" }}>
          <div>
            <p style={{ color: "var(--accent)", fontSize: "0.65rem", letterSpacing: "0.25em", fontWeight: "700", textTransform: "uppercase", marginBottom: "0.5rem" }}>OUR STORY</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.65rem, 3vw, 2.3rem)", fontWeight: "700", color: "var(--text)", lineHeight: 1.25, marginBottom: "1.2rem" }}>Sweetness rooted<br />in Georgian tradition</h2>
            <div style={{ width: "48px", height: "3px", background: "var(--accent)", borderRadius: "2px", marginBottom: "1.6rem" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.9, marginBottom: "1rem" }}>
              Founded with a deep love for Georgian confectionery, we blend time-honored family recipes with modern pastry techniques to create unforgettable sweets for every occasion.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.9, marginBottom: "1.8rem" }}>
              Each product is crafted in small batches to ensure the highest quality, freshness, and care in every single bite.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {["100% Homemade", "Local Ingredients", "No Preservatives", "Same-Day Delivery"].map(t => (
                <span key={t} style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)", fontSize: "0.77rem", fontWeight: "600", padding: "0.38rem 0.95rem", borderRadius: "50px" }}>✓ {t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { icon: "🍰", label: "Layer Cakes", desc: "Celebration cakes for every occasion" },
              { icon: "🥐", label: "Pastries", desc: "Flaky, buttery, baked fresh daily" },
              { icon: "🍫", label: "Chocolates", desc: "Hand-dipped truffles & bonbons" },
              { icon: "🎂", label: "Custom Orders", desc: "Weddings, birthdays, events" },
            ].map((sp) => (
              <div key={sp.label} style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: "20px", padding: "1.6rem 1.4rem", textAlign: "center" }}>
                <span style={{ fontSize: "2.2rem", display: "block", marginBottom: "0.7rem" }}>{sp.icon}</span>
                <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: "700", fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.35rem" }}>{sp.label}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.76rem", lineHeight: 1.55 }}>{sp.desc}</p>
              </div>
            ))}
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
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.97rem", lineHeight: 1.75, marginBottom: "2.5rem" }}>Browse our menu and place your order online — or call us for custom requests and bulk orders</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              style={{ background: "#d4235e", border: "none", color: "white", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.97rem", fontWeight: "700", cursor: "pointer", boxShadow: "0 8px 28px rgba(212,35,94,0.4)", transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(212,35,94,0.55)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(212,35,94,0.4)"; }}
              onClick={scrollToMenu}
            >Order Online</button>
            <a href="tel:+995555942959" style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.88)", padding: "1rem 2.4rem", borderRadius: "50px", fontSize: "0.97rem", fontWeight: "500", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.55)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"}
            >📞 Call Us Now</a>
          </div>
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
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.56rem", letterSpacing: "0.18em", textTransform: "uppercase" }}>Artisan Bakery · Tbilisi</div>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.28)", fontSize: "0.82rem", lineHeight: 1.75, maxWidth: "220px" }}>Making every celebration sweeter since 2021. Handcrafted with love in the heart of Tbilisi.</p>
          </div>
          <div>
            <p style={s.footerHeading}>Hours</p>
            <p style={s.footerLine}>Mon – Fri: 9:00 – 20:00</p>
            <p style={s.footerLine}>Saturday: 10:00 – 19:00</p>
            <p style={s.footerLine}>Sunday: Closed</p>
          </div>
          <div>
            <p style={s.footerHeading}>Contact</p>
            <a href="tel:+995555942959" style={s.footerLink}>📞 +995 555 942 959</a>
            <p style={s.footerLine}>📍 Tbilisi, Georgia</p>
            <p style={s.footerLine}>🚚 City-wide delivery</p>
          </div>
          <div>
            <p style={s.footerHeading}>Quick Links</p>
            <button style={s.footerNavBtn} onClick={scrollToMenu}>View Menu</button>
            <button style={s.footerNavBtn} onClick={() => userEmail ? setProfileOpen(true) : setAuthOpen(true)}>{userEmail ? "My Profile" : "Sign In"}</button>
            {isAdmin && <button style={s.footerNavBtn} onClick={() => navigate("/admin")}>Admin Panel</button>}
            <button style={s.footerNavBtn} onClick={toggle}>{isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
          </div>
        </div>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.6rem 0", display: "flex", justifyContent: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.14)", fontSize: "0.76rem" }}>© 2024 საკონდიტრო — Made with ❤️ in Tbilisi, Georgia</span>
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
            <div style={os.iconRing}><span style={{ fontSize: "2.6rem" }}>🎉</span></div>
            <h2 style={os.title}>Order Placed!</h2>
            <p style={os.sub}>Your order is confirmed. We'll be in touch shortly!</p>
            {orderCode && (
              <div style={os.codeSection}>
                <p style={os.codeLabel}>YOUR ORDER CODE</p>
                <div style={os.code}>{orderCode}</div>
                <p style={os.codeHint}>Screenshot this to track your order</p>
              </div>
            )}
            <div style={os.tips}>
              <div style={os.tip}>📞 We'll call to confirm within minutes</div>
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

// ── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ f, hasBorder }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ padding: "2.4rem 2rem", textAlign: "center", borderRight: hasBorder ? "1px solid var(--border)" : "none", transition: "background 0.2s", background: hovered ? "var(--bg-muted)" : "transparent" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: "56px", height: "56px", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", margin: "0 auto 1rem", background: `${f.color}18`, border: `1px solid ${f.color}28`, transition: "transform 0.25s", transform: hovered ? "scale(1.1)" : "scale(1)" }}>
        {f.icon}
      </div>
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.97rem", fontWeight: "700", color: "var(--text)", marginBottom: "0.5rem" }}>{f.title}</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.65 }}>{f.desc}</p>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ p, isDark, added, onAdd }) {
  const [hovered, setHovered] = useState(false);

  if (p.image_data) {
    return (
      <div
        style={{ borderRadius: "22px", overflow: "hidden", cursor: "pointer", boxShadow: hovered ? "0 28px 64px rgba(0,0,0,0.28)" : "0 4px 24px rgba(0,0,0,0.1)", transform: hovered ? "translateY(-8px) scale(1.01)" : "translateY(0) scale(1)", transition: "transform 0.3s ease, box-shadow 0.3s ease", position: "relative" }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        <div style={{ position: "relative", height: "290px" }}>
          <img src={p.image_data} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.5s ease", transform: hovered ? "scale(1.04)" : "scale(1)" }} alt={p.name} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)" }} />
          <div style={{ position: "absolute", top: "0.9rem", right: "0.9rem", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)", color: "rgba(255,255,255,0.92)", fontSize: "0.6rem", fontWeight: "800", padding: "0.24rem 0.75rem", borderRadius: "50px", letterSpacing: "0.1em" }}>
            ✓ FRESH TODAY
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.6rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: "1.15rem", fontWeight: "700", marginBottom: "0.3rem", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>{p.name}</h3>
            {p.description && <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.77rem", marginBottom: "0.9rem", lineHeight: 1.45 }}>{p.description}</p>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", color: "white", fontWeight: "800", fontSize: "1.35rem" }}>₾{Number(p.price).toFixed(2)}</span>
              <button style={{ background: added ? "#22c55e" : "rgba(212,35,94,0.95)", backdropFilter: "blur(8px)", color: "white", border: "none", padding: "0.55rem 1.3rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "background 0.25s, transform 0.15s", transform: hovered ? "scale(1.06)" : "scale(1)", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }} onClick={onAdd}>
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
      style={{ background: "var(--bg-card)", borderRadius: "22px", overflow: "hidden", boxShadow: hovered ? "0 22px 52px var(--shadow-md)" : "0 4px 24px var(--shadow)", transform: hovered ? "translateY(-8px)" : "translateY(0)", transition: "transform 0.3s ease, box-shadow 0.3s ease", border: "1px solid var(--border)" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      <div style={{ background: isDark ? "linear-gradient(135deg, rgba(212,35,94,0.09), rgba(100,20,50,0.18))" : "linear-gradient(135deg, #fff0f5, #ffdae8)", height: "178px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: "4.5rem", filter: hovered ? "drop-shadow(0 10px 20px rgba(212,35,94,0.32))" : "none", transition: "filter 0.3s, transform 0.3s", transform: hovered ? "scale(1.1)" : "scale(1)", display: "block" }}>{p.emoji}</span>
        <div style={{ position: "absolute", top: "0.85rem", right: "0.85rem", background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent-ring)", fontSize: "0.6rem", fontWeight: "800", padding: "0.22rem 0.7rem", borderRadius: "50px", letterSpacing: "0.08em" }}>✓ FRESH</div>
      </div>
      <div style={{ padding: "1.3rem 1.6rem 1.6rem" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.08rem", fontWeight: "700", color: "var(--text)", marginBottom: "0.4rem" }}>{p.name}</h3>
        {p.description && <p style={{ color: "var(--text-muted)", fontSize: "0.79rem", lineHeight: 1.6, marginBottom: "0.8rem" }}>{p.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
          <div>
            <div style={{ color: "var(--text-faint)", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>Price</div>
            <span style={{ color: "var(--accent)", fontWeight: "800", fontSize: "1.25rem", fontFamily: "'Playfair Display', serif" }}>₾{Number(p.price).toFixed(2)}</span>
          </div>
          <button style={{ background: added ? "#22c55e" : "var(--accent)", color: "white", border: "none", padding: "0.6rem 1.35rem", borderRadius: "50px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "background 0.25s, transform 0.15s", transform: hovered ? "scale(1.05)" : "scale(1)", boxShadow: added ? "0 4px 14px rgba(34,197,94,0.35)" : "0 4px 16px rgba(212,35,94,0.3)" }} onClick={onAdd}>
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
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)", padding: "1rem" },
  modal: { background: "white", borderRadius: "30px", padding: "2.8rem 2.2rem", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.45)" },
  iconRing: { width: "90px", height: "90px", borderRadius: "50%", background: "linear-gradient(135deg, #fef3c7, #fde68a)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.4rem", animation: "float 2.5s ease-in-out infinite" },
  title: { fontFamily: "'Playfair Display', serif", color: "#1c0f18", fontSize: "1.9rem", fontWeight: "700", marginBottom: "0.5rem" },
  sub: { color: "#8b6070", fontSize: "0.9rem", marginBottom: "1.8rem", lineHeight: 1.6 },
  codeSection: { background: "linear-gradient(135deg, #1c0f18, #3a1430)", borderRadius: "20px", padding: "1.5rem 1.7rem", marginBottom: "1.5rem" },
  codeLabel: { color: "rgba(255,255,255,0.4)", fontSize: "0.6rem", fontWeight: "700", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "0.65rem" },
  code: { fontFamily: "monospace", color: "white", fontSize: "2.6rem", fontWeight: "900", letterSpacing: "0.3em", marginBottom: "0.5rem", animation: "codePop 0.5s ease both" },
  codeHint: { color: "rgba(255,255,255,0.35)", fontSize: "0.73rem" },
  tips: { display: "flex", flexDirection: "column", gap: "0.55rem", background: "#fdf6f2", borderRadius: "16px", padding: "1.1rem 1.3rem", marginBottom: "1.7rem", textAlign: "left" },
  tip: { color: "#6b4c58", fontSize: "0.83rem", lineHeight: 1.5 },
  closeBtn: { width: "100%", background: "linear-gradient(135deg, #d4235e, #a01848)", color: "white", border: "none", padding: "1rem", borderRadius: "14px", fontSize: "0.96rem", fontWeight: "700", cursor: "pointer" },
};
