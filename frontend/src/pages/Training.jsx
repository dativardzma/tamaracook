import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const warmup = [
  ["Wrist Circles & Stretches", "1 min"],
  ["Arm & Shoulder Circles", "1 min"],
  ["Scapular Pulls", "2 × 8"],
  ["Bodyweight Squats", "15 reps"],
];

// [name, target per set, rest seconds, unit]
const pushPull = (squat) => [
  ["Pull-ups (or slow 4-sec negatives)", "Max clean reps", 120, "reps"],
  ["Standard Push-ups", "12", 90, "reps"],
  ["Diamond Push-ups", "10", 90, "reps"],
  squat,
  ["Hollow Body Hold", "15–20 sec", 60, "sec"],
];

const days = [
  { key: "Tue", name: "Tuesday", focus: "Push, Pull & Core", ex: pushPull(["Bodyweight Squats", "15", 60, "reps"]) },
  {
    key: "Thu", name: "Thursday", focus: "Handstand, Unilateral & Core",
    ex: [
      ["Wall Handstand", "30 sec", 120, "sec"],
      ["Chin-ups (palms facing you)", "Max clean reps", 120, "reps"],
      ["Archer Push-ups (4 each side)", "8", 90, "reps"],
      ["Reverse Lunges (6 each leg)", "12", 60, "reps"],
      ["Plank", "1 min", 60, "sec"],
    ],
  },
  { key: "Sat", name: "Saturday", focus: "Push, Pull & Core", ex: pushPull(["Jump Squats (or regular squats)", "12", 60, "reps"]) },
];

const SETS = 3;

// Page-only palette: overrides the bakery's pink theme on this page
const palette = {
  light: {
    "--bg": "#f4f5f7", "--bg-card": "#ffffff", "--bg-muted": "#e9ecef", "--bg-input": "#ffffff",
    "--text": "#111827", "--text-muted": "#6b7280", "--text-faint": "#9ca3af",
    "--border": "#e5e7eb", "--border-input": "#d1d5db", "--input-text": "#111827",
    "--accent": "#059669", "--accent-light": "#ecfdf5", "--on-accent": "#ffffff", "--shadow-lg": "rgba(0,0,0,0.18)",
  },
  dark: {
    "--bg": "#0b0f14", "--bg-card": "#141a21", "--bg-muted": "#1f2731", "--bg-input": "#1a2129",
    "--text": "#e5e7eb", "--text-muted": "#8b96a5", "--text-faint": "#5b6573",
    "--border": "#232c37", "--border-input": "#2e3946", "--input-text": "#e5e7eb",
    "--accent": "#34d399", "--accent-light": "#0f2a22", "--on-accent": "#06281d", "--shadow-lg": "rgba(0,0,0,0.5)",
  },
};

// start of the Monday-based week containing d (ms)
const weekStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getTime();
};

const rules = [
  ["Hardest Move First", "Pull-ups and Wall Handstands go first, while grip and shoulders are fresh."],
  ["Form Over Ego", "Chest to the floor on every push-up, tight core. Pull-ups from a dead hang, chin clearly over the bar. Never push through sharp wrist, elbow or shoulder pain."],
  ["How to Level Up", "When all sets feel smooth with strict form, add 1–2 reps per set next week, or slow the lowering phase (3 sec down, 1 sec up)."],
];

const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyState = () => ({ warm: {}, sets: {}, reps: {}, start: null, end: null, saved: false });

function load(key) {
  let v = null;
  try { v = JSON.parse(localStorage.getItem(key)); } catch { /* ignore */ }
  return { ...(v || emptyState()), k: key };
}

const fmtDur = (ms) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

export default function Training() {
  const todayIdx = { 2: 0, 4: 1, 6: 2 }[new Date().getDay()] ?? 0;
  const [active, setActive] = useState(todayIdx);
  const day = days[active];
  const storeKey = `wk:${todayStr()}:${day.key}`;
  const [st, setSt] = useState(() => load(storeKey));
  const [rest, setRest] = useState(null); // { until, label }
  const [now, setNow] = useState(Date.now());
  const [msg, setMsg] = useState("");
  const { isDark, toggle } = useTheme();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [logs, setLogs] = useState([]);

  const loadLogs = useCallback(() => {
    if (!token) { setLogs([]); return; }
    fetch(`${BACKEND_URL}/api/workout-logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLogs(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);
  useEffect(loadLogs, [loadLogs]);

  // group saved logs into sessions: same day key + same calendar date
  const sessions = useMemo(() => {
    const map = new Map();
    for (const l of logs) {
      const date = new Date(l.created_at);
      const k = `${date.toDateString()}|${l.day}`;
      if (!map.has(k)) map.set(k, { key: k, day: l.day, date, items: [] });
      map.get(k).items.push(l);
    }
    return [...map.values()].sort((a, b) => b.date - a.date);
  }, [logs]);
  const thisWeek = sessions.filter((x) => weekStart(x.date) === weekStart(new Date()));
  const doneThisWeek = new Set(thisWeek.map((x) => x.day));
  const lastFor = (name) => logs.find((l) => l.exercise === name);

  const [auth, setAuth] = useState({ email: "", password: "", mode: "login", err: "", busy: false });

  const submitAuth = async (e) => {
    e.preventDefault();
    setAuth((a) => ({ ...a, err: "", busy: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/${auth.mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: auth.email.trim(), password: auth.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) throw new Error(typeof data.detail === "string" ? data.detail : "Login failed");
      localStorage.setItem("token", data.token);
      localStorage.setItem("email", data.email || auth.email.trim());
      setToken(data.token);
      setAuth({ email: "", password: "", mode: "login", err: "", busy: false });
    } catch (err) {
      setAuth((a) => ({ ...a, err: err.message === "Failed to fetch" ? "Could not connect to server." : err.message, busy: false }));
    }
  };

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("email"); setToken(null); };

  useEffect(() => { setSt(load(storeKey)); setMsg(""); }, [storeKey]);
  useEffect(() => {
    if (st.k !== storeKey) return; // state still belongs to the previous tab
    try { localStorage.setItem(storeKey, JSON.stringify(st)); } catch { /* ignore */ }
  }, [st, storeKey]);

  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  useEffect(() => {
    if (!rest) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest]);
  const restLeft = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0;
  useEffect(() => { if (rest && restLeft === 0) setRest(null); }, [rest, restLeft]);

  const total = warmup.length + day.ex.length * SETS;
  const done = Object.values(st.warm).filter(Boolean).length + Object.values(st.sets).filter(Boolean).length;
  const allDone = done === total;

  const update = (fn) => setSt((s) => {
    const n = fn({ ...s, warm: { ...s.warm }, sets: { ...s.sets }, reps: { ...s.reps } });
    n.start = n.start || Date.now();
    const d = Object.values(n.warm).filter(Boolean).length + Object.values(n.sets).filter(Boolean).length;
    n.end = d === total ? (s.end || Date.now()) : null;
    return n;
  });

  const toggleSet = (ei, si) => {
    const k = `${ei}-${si}`;
    const turningOn = !st.sets[k];
    update((s) => { s.sets[k] = turningOn; return s; });
    const isLast = ei === day.ex.length - 1 && si === SETS - 1;
    if (turningOn && !isLast) setRest({ until: Date.now() + day.ex[ei][2] * 1000, label: day.ex[ei][0] });
  };

  const summary = useMemo(() => day.ex.map(([name, , , unit], ei) => {
    const vals = Array.from({ length: SETS }, (_, si) => st.reps[`${ei}-${si}`]).filter((v) => v !== undefined && v !== "");
    const sum = vals.reduce((a, v) => a + (Number(v) || 0), 0);
    return { name, unit, vals, sum };
  }), [day, st.reps]);

  const save = async () => {
    setMsg("");
    try {
      for (const r of summary) {
        const result = r.vals.length ? `${r.vals.join(" / ")} ${r.unit}` : `${SETS} sets done`;
        const res = await fetch(`${BACKEND_URL}/api/workout-logs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ day: day.key, exercise: r.name, result }),
        });
        if (res.status === 401) { logout(); throw new Error(); }
        if (!res.ok) throw new Error();
      }
      update((s) => { s.saved = true; return s; });
      setMsg("Saved ✔");
      loadLogs();
    } catch {
      setMsg("Could not save. Try logging in again.");
    }
  };

  const reset = () => { if (confirm("Reset today's checks?")) { setSt({ ...emptyState(), k: storeKey }); setRest(null); } };

  return (
    <div style={{ ...palette[isDark ? "dark" : "light"], minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "1.25rem 1rem 6rem" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>Workout</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 2 }}>Tue / Thu / Sat · Pull-up bar &amp; floor</p>
          </div>
          <button onClick={toggle} style={s.iconBtn} title="Toggle dark mode">{isDark ? "☀️" : "🌙"}</button>
        </div>

        {token && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
            <div style={s.stat}><div style={s.statNum}>{thisWeek.length}/3</div><div style={s.statLbl}>this week</div></div>
            <div style={s.stat}><div style={s.statNum}>{sessions.length}</div><div style={s.statLbl}>workouts saved</div></div>
            <div style={s.stat}>
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4 }}>
                {days.map((d) => (
                  <span key={d.key} title={d.name} style={{ ...s.dot, ...(doneThisWeek.has(d.key) ? s.dotOn : {}) }}>{d.key[0]}</span>
                ))}
              </div>
              <div style={s.statLbl}>Tue · Thu · Sat</div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, margin: "1rem 0" }}>
          {days.map((d, i) => (
            <button key={d.key} onClick={() => setActive(i)} style={{ ...s.tab, ...(i === active ? s.tabOn : {}) }}>{d.key}</button>
          ))}
        </div>

        <div style={{ ...s.card, padding: "0.9rem 1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <strong>{day.name}</strong>
              <div style={{ color: "var(--accent)", fontSize: "0.82rem" }}>{day.focus}</div>
            </div>
            <span style={{ fontWeight: 700 }}>{done}/{total}</span>
          </div>
          <div style={s.barBg}><div style={{ ...s.bar, width: `${(done / total) * 100}%` }} /></div>
        </div>

        <h2 style={s.h2}>Warm-up · 5 min</h2>
        <div style={s.card}>
          {warmup.map(([n, t], i) => (
            <label key={n} style={s.checkRow}>
              <input type="checkbox" checked={!!st.warm[i]} style={s.cb}
                onChange={() => update((x) => { x.warm[i] = !x.warm[i]; return x; })} />
              <span style={{ flex: 1, textDecoration: st.warm[i] ? "line-through" : "none", opacity: st.warm[i] ? 0.55 : 1 }}>{n}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{t}</span>
            </label>
          ))}
        </div>

        <h2 style={s.h2}>Exercises · {SETS} sets each</h2>
        {day.ex.map(([name, target, restSec, unit], ei) => {
          const exDone = Array.from({ length: SETS }).every((_, si) => st.sets[`${ei}-${si}`]);
          return (
            <div key={name} style={{ ...s.card, padding: "0.9rem 1rem", marginBottom: 10, borderColor: exDone ? "var(--accent)" : "var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong>{exDone ? "✅ " : ""}{ei + 1}. {name}</strong>
                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>rest {restSec >= 120 ? `${restSec / 60} min` : `${restSec}s`}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
                Target: {target}{/^\d+$/.test(target) ? ` ${unit}` : ""} per set
                {lastFor(name) && <span style={{ color: "var(--text-faint)" }}> · last: {lastFor(name).result}</span>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                {Array.from({ length: SETS }).map((_, si) => {
                  const k = `${ei}-${si}`;
                  const on = !!st.sets[k];
                  return (
                    <div key={si} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <button onClick={() => toggleSet(ei, si)} style={{ ...s.setBtn, ...(on ? s.setOn : {}) }}>
                        {on ? "✓" : ""} Set {si + 1}
                      </button>
                      <input inputMode="numeric" placeholder={unit} value={st.reps[k] ?? ""} style={s.input}
                        onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, ""); update((x) => { x.reps[k] = v; return x; }); }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {allDone && (
          <div style={{ ...s.card, padding: "1.2rem 1rem", marginTop: 18, borderColor: "var(--accent)", background: "var(--accent-light)" }}>
            <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>💪 Workout complete!</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
              {day.name} · {todayStr()}{st.start && st.end ? ` · ${fmtDur(st.end - st.start)}` : ""} · {day.ex.length * SETS} sets
            </div>
            <div style={{ marginTop: 12 }}>
              {summary.map((r) => (
                <div key={r.name} style={s.sumRow}>
                  <span style={{ flex: 1 }}>{r.name}</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>
                    {r.vals.length ? `${r.vals.join(" / ")}  (${r.sum} ${r.unit})` : "✓"}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              {token
                ? <button onClick={save} disabled={st.saved} style={{ ...s.primary, opacity: st.saved ? 0.6 : 1 }}>{st.saved ? "Saved ✔" : "Save workout"}</button>
                : <span style={{ color: "var(--text-muted)", fontSize: "0.88rem", alignSelf: "center" }}>Log in below to save it</span>}
              <button onClick={reset} style={s.ghost}>Reset</button>
            </div>
            {msg && !st.saved && <p style={{ color: "var(--accent)", fontSize: "0.85rem", marginTop: 8 }}>{msg}</p>}
          </div>
        )}

        {!allDone && done > 0 && (
          <button onClick={reset} style={{ ...s.ghost, marginTop: 8 }}>Reset today</button>
        )}

        <div style={{ ...s.card, padding: "0.9rem 1rem", marginTop: 18 }}>
          {token ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: "0.88rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Logged in as {localStorage.getItem("email") || "you"}</span>
              <button onClick={logout} style={s.ghost}>Log out</button>
            </div>
          ) : (
            <form onSubmit={submitAuth} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <strong>{auth.mode === "login" ? "Log in to save workouts" : "Create an account"}</strong>
              <input type="email" required placeholder="Email" autoComplete="email" value={auth.email}
                onChange={(e) => setAuth((a) => ({ ...a, email: e.target.value }))} style={{ ...s.input, textAlign: "left", padding: "0.6rem" }} />
              <input type="password" required placeholder="Password" autoComplete={auth.mode === "login" ? "current-password" : "new-password"} value={auth.password}
                onChange={(e) => setAuth((a) => ({ ...a, password: e.target.value }))} style={{ ...s.input, textAlign: "left", padding: "0.6rem" }} />
              {auth.err && <span style={{ color: "var(--accent)", fontSize: "0.85rem" }}>{auth.err}</span>}
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button type="submit" disabled={auth.busy} style={s.primary}>{auth.busy ? "..." : auth.mode === "login" ? "Log in" : "Sign up"}</button>
                <button type="button" style={{ ...s.ghost, border: "none" }}
                  onClick={() => setAuth((a) => ({ ...a, mode: a.mode === "login" ? "register" : "login", err: "" }))}>
                  {auth.mode === "login" ? "No account? Sign up" : "Have an account? Log in"}
                </button>
              </div>
            </form>
          )}
        </div>

        {sessions.length > 0 && (
          <>
            <h2 style={s.h2}>History</h2>
            {sessions.slice(0, 6).map((x) => (
              <details key={x.key} style={{ ...s.card, padding: "0.75rem 1rem", marginBottom: 8 }}>
                <summary style={{ cursor: "pointer" }}>
                  <strong>{days.find((d) => d.key === x.day)?.name || x.day}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}> · {x.date.toLocaleDateString()}</span>
                </summary>
                {x.items.map((l) => (
                  <div key={l.id} style={s.sumRow}>
                    <span style={{ flex: 1 }}>{l.exercise}</span>
                    <span style={{ fontWeight: 600 }}>{l.result}</span>
                  </div>
                ))}
              </details>
            ))}
          </>
        )}

        <details style={{ ...s.card, padding: "0.9rem 1rem", marginTop: 18 }}>
          <summary style={{ cursor: "pointer", fontWeight: 700 }}>Rules &amp; progression</summary>
          {rules.map(([t, d]) => (
            <p key={t} style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: 10, lineHeight: 1.55 }}>
              <strong style={{ color: "var(--text)" }}>{t}:</strong> {d}
            </p>
          ))}
        </details>
      </div>

      {rest && (
        <div style={s.restBar}>
          <span>Rest · <strong style={{ fontSize: "1.2rem" }}>{Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, "0")}</strong></span>
          <button onClick={() => setRest(null)} style={s.skip}>Skip</button>
        </div>
      )}
    </div>
  );
}

const s = {
  h2: { fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", margin: "1.6rem 0 0.7rem" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" },
  tab: { flex: 1, padding: "0.6rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", cursor: "pointer", fontWeight: 600 },
  tabOn: { background: "var(--accent)", color: "var(--on-accent)", borderColor: "var(--accent)" },
  barBg: { height: 8, background: "var(--bg-muted)", borderRadius: 8, marginTop: 10, overflow: "hidden" },
  bar: { height: "100%", background: "var(--accent)", borderRadius: 8, transition: "width 0.3s" },
  checkRow: { display: "flex", alignItems: "center", gap: 12, padding: "0.8rem 1rem", borderBottom: "1px solid var(--border)", cursor: "pointer" },
  cb: { width: 20, height: 20, accentColor: "var(--accent)", cursor: "pointer" },
  setBtn: { padding: "0.6rem 0", borderRadius: 10, border: "1.5px solid var(--border-input)", background: "var(--bg-input)", color: "var(--text)", fontWeight: 600, cursor: "pointer" },
  setOn: { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--on-accent)" },
  input: { width: "100%", minWidth: 0, padding: "0.4rem", textAlign: "center", borderRadius: 8, border: "1px solid var(--border-input)", background: "var(--bg-input)", color: "var(--input-text)", fontSize: "0.9rem" },
  sumRow: { display: "flex", gap: 10, padding: "0.45rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.9rem" },
  primary: { padding: "0.6rem 1.2rem", borderRadius: 10, border: "none", background: "var(--accent)", color: "var(--on-accent)", fontWeight: 700, cursor: "pointer" },
  ghost: { padding: "0.6rem 1.2rem", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" },
  restBar: { position: "fixed", left: 16, right: 16, bottom: 16, maxWidth: 608, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1.1rem", borderRadius: 14, background: "var(--text)", color: "var(--bg)", boxShadow: "0 8px 24px var(--shadow-lg)" },
  iconBtn: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "0.45rem 0.6rem", cursor: "pointer", fontSize: "1rem" },
  stat: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.7rem 0.5rem", textAlign: "center" },
  statNum: { fontSize: "1.3rem", fontWeight: 800, color: "var(--accent)" },
  statLbl: { fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 },
  dot: { width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, background: "var(--bg-muted)", color: "var(--text-muted)" },
  dotOn: { background: "var(--accent)", color: "var(--on-accent)" },
  skip: { background: "none", border: "1px solid currentColor", color: "inherit", borderRadius: 8, padding: "0.35rem 0.8rem", cursor: "pointer" },
};
