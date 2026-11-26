import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

/* ───────────────────────── Program ───────────────────────── */

const warmup = [
  ["Wrist Circles & Stretches", "1 min"],
  ["Arm & Shoulder Circles", "1 min"],
  ["Scapular Pulls", "2 × 8"],
  ["Bodyweight Squats", "15 reps"],
];

// [name, target per set, rest seconds, unit, icon]
const pushPull = (squat) => [
  ["Pull-ups (or slow 4-sec negatives)", "Max clean reps", 120, "reps", "🧗"],
  ["Standard Push-ups", "12", 90, "reps", "💪"],
  ["Diamond Push-ups", "10", 90, "reps", "💎"],
  squat,
  ["Hollow Body Hold", "15–20 sec", 60, "sec", "🛶"],
];

const days = [
  { key: "Tue", name: "Tuesday", focus: "Push, Pull & Core", boss: "Pull-up Day", ex: pushPull(["Bodyweight Squats", "15", 60, "reps", "🦵"]) },
  {
    key: "Thu", name: "Thursday", focus: "Handstand, Unilateral & Core", boss: "Handstand Day",
    ex: [
      ["Wall Handstand", "30 sec", 120, "sec", "🤸"],
      ["Chin-ups (palms facing you)", "Max clean reps", 120, "reps", "🧗"],
      ["Archer Push-ups (4 each side)", "8", 90, "reps", "🏹"],
      ["Reverse Lunges (6 each leg)", "12", 60, "reps", "🦵"],
      ["Plank", "1 min", 60, "sec", "🧱"],
    ],
  },
  { key: "Sat", name: "Saturday", focus: "Push, Pull & Core", boss: "Power Day", ex: pushPull(["Jump Squats (or regular squats)", "12", 60, "reps", "🚀"]) },
];

const SETS = 3;

const rules = [
  ["Hardest Move First", "Pull-ups and Wall Handstands go first, while grip and shoulders are fresh."],
  ["Form Over Ego", "Chest to the floor on every push-up, tight core. Pull-ups from a dead hang, chin clearly over the bar. Never push through sharp wrist, elbow or shoulder pain."],
  ["How to Level Up", "When all sets feel smooth with strict form, add 1–2 reps per set next week, or slow the lowering phase (3 sec down, 1 sec up)."],
];

/* ───────────────────────── Game rules ───────────────────────── */

const XP_WARM = 5;
const XP_SET = 10;
const XP_FINISH = 50;
const XP_PR = 25;
const SESSION_XP = warmup.length * XP_WARM + 5 * SETS * XP_SET + XP_FINISH; // 220
const LEVEL_XP = 500;

const TITLES = ["Rookie", "Bar Hanger", "Rep Grinder", "Push-up Soldier", "Pull-up Hunter", "Core Crusher",
  "Handstand Apprentice", "Bar Beast", "Street Warrior", "Calisthenics Monk", "Gravity Breaker", "Legend"];

const BADGES = [
  { id: "first", icon: "🎯", name: "First Blood", desc: "Save your first workout", test: (g) => g.total >= 1 },
  { id: "five", icon: "🔥", name: "On Fire", desc: "5 workouts saved", test: (g) => g.total >= 5 },
  { id: "ten", icon: "⚡", name: "Double Digits", desc: "10 workouts saved", test: (g) => g.total >= 10 },
  { id: "perfect", icon: "👑", name: "Perfect Week", desc: "Tue + Thu + Sat in one week", test: (g) => g.perfectWeeks >= 1 },
  { id: "streak4", icon: "📅", name: "Month Strong", desc: "4-week streak", test: (g) => g.bestStreak >= 4 },
  { id: "pr", icon: "🏆", name: "Record Breaker", desc: "Beat a previous result", test: (g) => g.prs >= 1 },
  { id: "twentyfive", icon: "💎", name: "Diamond Body", desc: "25 workouts saved", test: (g) => g.total >= 25 },
  { id: "fifty", icon: "🦍", name: "Unstoppable", desc: "50 workouts saved", test: (g) => g.total >= 50 },
];

/* ───────────────────────── Helpers ───────────────────────── */

const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyState = () => ({ warm: {}, sets: {}, reps: {}, start: null, end: null, saved: false });

function load(key) {
  let v = null;
  try { v = JSON.parse(localStorage.getItem(key)); } catch { /* ignore */ }
  return { ...(v || emptyState()), k: key };
}

const fmtDur = (ms) => {
  const m = Math.max(1, Math.round(ms / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

const weekStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getTime();
};
const WEEK = 7 * 24 * 3600 * 1000;

const sumNums = (str) => (String(str).match(/\d+/g) || []).reduce((a, n) => a + Number(n), 0);

const C = {
  dark: {
    "--bg": "#0a0b14", "--bg-card": "#13152a", "--bg-muted": "#1d2040", "--bg-input": "#181b33",
    "--text": "#eef0ff", "--text-muted": "#8b90b8", "--text-faint": "#565b85",
    "--border": "#252a50", "--border-input": "#2f3563", "--input-text": "#eef0ff",
    "--accent": "#7c5cff", "--accent-2": "#22d3ee", "--gold": "#fbbf24", "--good": "#4ade80",
    "--accent-light": "#1d1846", "--on-accent": "#ffffff", "--shadow-lg": "rgba(0,0,0,0.6)",
    "--glow": "0 0 24px rgba(124,92,255,0.45)",
  },
  light: {
    "--bg": "#f3f4fb", "--bg-card": "#ffffff", "--bg-muted": "#e7e9f7", "--bg-input": "#ffffff",
    "--text": "#151733", "--text-muted": "#646a92", "--text-faint": "#a1a6c6",
    "--border": "#e0e3f3", "--border-input": "#cfd3ec", "--input-text": "#151733",
    "--accent": "#6d4aff", "--accent-2": "#0891b2", "--gold": "#d97706", "--good": "#16a34a",
    "--accent-light": "#efeaff", "--on-accent": "#ffffff", "--shadow-lg": "rgba(20,20,60,0.18)",
    "--glow": "0 6px 20px rgba(109,74,255,0.3)",
  },
};

const CSS = `
@keyframes wk-float { 0% { opacity: 0; transform: translate(-50%, 0) scale(.8); } 15% { opacity: 1; transform: translate(-50%, -8px) scale(1.1); } 100% { opacity: 0; transform: translate(-50%, -60px) scale(1); } }
@keyframes wk-fall { 0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; } 100% { transform: translateY(110vh) rotate(720deg); opacity: .9; } }
@keyframes wk-pop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
@keyframes wk-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(124,92,255,.5); } 50% { box-shadow: 0 0 0 8px rgba(124,92,255,0); } }
@keyframes wk-flame { 0%,100% { transform: scale(1) rotate(-3deg); } 50% { transform: scale(1.12) rotate(3deg); } }
.wk-set { transition: transform .12s, background .2s, border-color .2s; }
.wk-set:active { transform: scale(.94); }
.wk-pop { animation: wk-pop .45s ease-out both; }
.wk-flame { display: inline-block; animation: wk-flame 1.2s ease-in-out infinite; }
.wk-next { animation: wk-pulse 1.8s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .wk-pop, .wk-flame, .wk-next { animation: none !important; } }
`;

/* ───────────────────────── Component ───────────────────────── */

export default function Training() {
  const { isDark, toggle } = useTheme();
  const todayIdx = { 2: 0, 4: 1, 6: 2 }[new Date().getDay()] ?? 0;
  const [active, setActive] = useState(todayIdx);
  const day = days[active];
  const storeKey = `wk:${todayStr()}:${day.key}`;
  const [st, setSt] = useState(() => load(storeKey));
  const [rest, setRest] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [msg, setMsg] = useState("");
  const [pops, setPops] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const popId = useRef(0);

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [auth, setAuth] = useState({ email: "", password: "", mode: "login", err: "", busy: false });
  const [logs, setLogs] = useState([]);

  /* ── data ── */
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("email"); setToken(null); };

  const loadLogs = useCallback(() => {
    if (!token) { setLogs([]); return; }
    fetch(`${BACKEND_URL}/api/workout-logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setLogs(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [token]);
  useEffect(loadLogs, [loadLogs]);

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

  /* ── per-day local state ── */
  useEffect(() => { setSt(load(storeKey)); setMsg(""); }, [storeKey]);
  useEffect(() => {
    if (st.k !== storeKey) return;
    try { localStorage.setItem(storeKey, JSON.stringify(st)); } catch { /* ignore */ }
  }, [st, storeKey]);

  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  /* ── rest timer ── */
  useEffect(() => {
    if (!rest) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest]);
  const restLeft = rest ? Math.max(0, Math.ceil((rest.until - now) / 1000)) : 0;
  useEffect(() => {
    if (rest && restLeft === 0) {
      setRest(null);
      try { navigator.vibrate?.([120, 60, 120]); } catch { /* ignore */ }
    }
  }, [rest, restLeft]);

  /* ── history / game stats ── */
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

  const lastFor = useCallback((name) => logs.find((l) => l.exercise === name), [logs]);

  const game = useMemo(() => {
    const weeks = new Map();
    for (const x of sessions) {
      const w = weekStart(x.date);
      if (!weeks.has(w)) weeks.set(w, new Set());
      weeks.get(w).add(x.day);
    }
    const perfectWeeks = [...weeks.values()].filter((s) => s.size >= 3).length;

    // streak of consecutive weeks with ≥1 workout (current week may still be empty)
    let streak = 0;
    let w = weekStart(new Date());
    if (!weeks.has(w)) w -= WEEK;
    while (weeks.has(w)) { streak++; w -= WEEK; }
    let bestStreak = 0, run = 0, prev = null;
    for (const wk of [...weeks.keys()].sort((a, b) => a - b)) {
      run = prev !== null && wk - prev === WEEK ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
      prev = wk;
    }

    // PRs: a saved result that beat the previous result of the same exercise
    let prs = 0;
    const byEx = {};
    for (const l of [...logs].reverse()) {
      const v = sumNums(l.result);
      if (byEx[l.exercise] !== undefined && v > byEx[l.exercise]) prs++;
      byEx[l.exercise] = Math.max(byEx[l.exercise] ?? 0, v);
    }

    const thisWeek = weeks.get(weekStart(new Date())) || new Set();
    return { total: sessions.length, perfectWeeks, streak, bestStreak, prs, thisWeek, best: byEx };
  }, [sessions, logs]);

  /* ── today ── */
  const total = warmup.length + day.ex.length * SETS;
  const done = Object.values(st.warm).filter(Boolean).length + Object.values(st.sets).filter(Boolean).length;
  const allDone = done === total;

  const summary = useMemo(() => day.ex.map(([name, , , unit, icon], ei) => {
    const vals = Array.from({ length: SETS }, (_, si) => st.reps[`${ei}-${si}`]).filter((v) => v !== undefined && v !== "");
    const sum = vals.reduce((a, v) => a + (Number(v) || 0), 0);
    const prev = game.best[name];
    const pr = vals.length > 0 && prev !== undefined && sum > prev;
    return { name, unit, icon, vals, sum, prev, pr };
  }), [day, st.reps, game.best]);

  const prCount = summary.filter((r) => r.pr).length;
  const todayXp =
    Object.values(st.warm).filter(Boolean).length * XP_WARM +
    Object.values(st.sets).filter(Boolean).length * XP_SET +
    (allDone ? XP_FINISH + prCount * XP_PR : 0);
  const totalXp = game.total * SESSION_XP + game.prs * XP_PR + (st.saved ? 0 : todayXp);
  const level = Math.floor(totalXp / LEVEL_XP) + 1;
  const levelXp = totalXp % LEVEL_XP;
  const title = TITLES[Math.min(level - 1, TITLES.length - 1)];

  // first unchecked set → highlighted as "next"
  let nextKey = null;
  outer: for (let ei = 0; ei < day.ex.length; ei++) for (let si = 0; si < SETS; si++) {
    if (!st.sets[`${ei}-${si}`]) { nextKey = `${ei}-${si}`; break outer; }
  }

  /* ── actions ── */
  const update = (fn) => setSt((s) => {
    const n = fn({ ...s, warm: { ...s.warm }, sets: { ...s.sets }, reps: { ...s.reps } });
    n.start = n.start || Date.now();
    const d = Object.values(n.warm).filter(Boolean).length + Object.values(n.sets).filter(Boolean).length;
    n.end = d === total ? (s.end || Date.now()) : null;
    return n;
  });

  const popXp = (e, text) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = ++popId.current;
    setPops((p) => [...p, { id, x: r.left + r.width / 2, y: r.top, text }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 950);
  };

  const finishIfLast = (willBeDone) => {
    if (willBeDone === total) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3500);
      try { navigator.vibrate?.(200); } catch { /* ignore */ }
    }
  };

  const toggleWarm = (e, i) => {
    const on = !st.warm[i];
    if (on) popXp(e, `+${XP_WARM} XP`);
    update((x) => { x.warm[i] = on; return x; });
    if (on) finishIfLast(done + 1);
  };

  const toggleSet = (e, ei, si) => {
    const k = `${ei}-${si}`;
    const on = !st.sets[k];
    if (on) popXp(e, `+${XP_SET} XP`);
    update((x) => { x.sets[k] = on; return x; });
    const isLast = ei === day.ex.length - 1 && si === SETS - 1;
    if (on && !isLast) setRest({ until: Date.now() + day.ex[ei][2] * 1000, total: day.ex[ei][2], next: si < SETS - 1 ? `${day.ex[ei][0]} · set ${si + 2}` : day.ex[ei + 1]?.[0] });
    if (on) finishIfLast(done + 1);
  };

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
      loadLogs();
    } catch {
      setMsg("Could not save. Log in again below.");
    }
  };

  const reset = () => { if (confirm("Reset today's progress?")) { setSt({ ...emptyState(), k: storeKey }); setRest(null); } };

  const confettiBits = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 2 + Math.random() * 1.5,
    color: ["#7c5cff", "#22d3ee", "#fbbf24", "#4ade80", "#f97316"][i % 5],
    size: 6 + Math.random() * 6,
  })), [confetti]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round((done / total) * 100);

  /* ───────────────────────── UI ───────────────────────── */
  return (
    <div style={{ ...C[isDark ? "dark" : "light"], minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "1rem 1rem 7rem", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* ── Player card ── */}
        <div style={{ ...s.card, padding: "1rem", background: "linear-gradient(135deg, var(--bg-card), var(--accent-light))", boxShadow: "var(--glow)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={s.levelBadge}>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, opacity: 0.85, letterSpacing: "0.1em" }}>LVL</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, lineHeight: 1 }}>{level}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{title}</div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>{levelXp} / {LEVEL_XP} XP to level {level + 1}</div>
              <div style={{ ...s.barBg, height: 8, marginTop: 6 }}>
                <div style={{ ...s.bar, width: `${(levelXp / LEVEL_XP) * 100}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
              </div>
            </div>
            <button onClick={toggle} style={s.iconBtn} title="Toggle dark mode">{isDark ? "☀️" : "🌙"}</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
            <div style={s.stat}>
              <div style={s.statNum}><span className={game.streak > 0 ? "wk-flame" : ""}>🔥</span> {game.streak}</div>
              <div style={s.statLbl}>week streak</div>
            </div>
            <div style={s.stat}>
              <div style={s.statNum}>{game.total}</div>
              <div style={s.statLbl}>workouts</div>
            </div>
            <div style={s.stat}>
              <div style={{ display: "flex", gap: 5, justifyContent: "center", paddingTop: 3 }}>
                {days.map((d) => (
                  <span key={d.key} title={d.name} style={{ ...s.dot, ...(game.thisWeek.has(d.key) ? s.dotOn : {}) }}>{d.key[0]}</span>
                ))}
              </div>
              <div style={s.statLbl}>this week</div>
            </div>
          </div>
          {!token && (
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 10, textAlign: "center" }}>
              Log in at the bottom to keep your XP, streak and badges.
            </div>
          )}
        </div>

        {/* ── Day picker ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "1rem 0" }}>
          {days.map((d, i) => (
            <button key={d.key} onClick={() => setActive(i)} style={{ ...s.tab, ...(i === active ? s.tabOn : {}) }}>
              <div style={{ fontWeight: 800 }}>{d.key}</div>
              <div style={{ fontSize: "0.68rem", opacity: 0.8 }}>{d.boss}</div>
              {i === todayIdx && [2, 4, 6].includes(new Date().getDay()) && <div style={s.todayTag}>TODAY</div>}
            </button>
          ))}
        </div>

        {/* ── Quest progress ── */}
        <div style={{ ...s.card, padding: "0.9rem 1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", color: "var(--accent-2)" }}>TODAY'S QUEST</div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{day.focus}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "var(--gold)" }}>+{st.saved ? 0 : todayXp} XP</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{done}/{total} · {pct}%</div>
            </div>
          </div>
          <div style={{ ...s.barBg, height: 12, marginTop: 10 }}>
            <div style={{ ...s.bar, width: `${pct}%`, background: allDone ? "var(--good)" : "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
          </div>
        </div>

        {/* ── Warm-up ── */}
        <div style={s.sectionHead}><span>⚙️ Warm-up</span><span style={s.sectionXp}>{XP_WARM} XP each</span></div>
        <div style={s.card}>
          {warmup.map(([n, t], i) => {
            const on = !!st.warm[i];
            return (
              <button key={n} onClick={(e) => toggleWarm(e, i)} className="wk-set" style={{ ...s.warmRow, opacity: on ? 0.6 : 1 }}>
                <span style={{ ...s.check, ...(on ? s.checkOn : {}) }}>{on ? "✓" : ""}</span>
                <span style={{ flex: 1, textAlign: "left", textDecoration: on ? "line-through" : "none" }}>{n}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{t}</span>
              </button>
            );
          })}
        </div>

        {/* ── Exercises ── */}
        <div style={s.sectionHead}><span>⚔️ Main quest</span><span style={s.sectionXp}>{XP_SET} XP per set</span></div>
        {day.ex.map(([name, target, restSec, unit, icon], ei) => {
          const exSets = Array.from({ length: SETS }, (_, si) => !!st.sets[`${ei}-${si}`]);
          const exDone = exSets.every(Boolean);
          const last = lastFor(name);
          const r = summary[ei];
          return (
            <div key={name} style={{ ...s.card, padding: "0.9rem 1rem", marginBottom: 10, borderColor: exDone ? "var(--good)" : "var(--border)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ ...s.exIcon, ...(exDone ? { background: "var(--good)" } : {}) }}>{exDone ? "✓" : icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{name}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>
                    🎯 {target}{/^\d+$/.test(target) ? ` ${unit}` : ""} · ⏱ {restSec >= 120 ? `${restSec / 60} min` : `${restSec}s`}
                  </div>
                </div>
                {r.pr && <span className="wk-pop" style={s.prTag}>NEW PR</span>}
              </div>
              {last && (
                <div style={{ fontSize: "0.76rem", color: "var(--text-faint)", marginTop: 6 }}>
                  Last time: <strong style={{ color: "var(--text-muted)" }}>{last.result}</strong> · beat it for +{XP_PR} XP
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${SETS}, 1fr)`, gap: 8, marginTop: 10 }}>
                {exSets.map((on, si) => {
                  const k = `${ei}-${si}`;
                  return (
                    <div key={si} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button onClick={(e) => toggleSet(e, ei, si)} className={`wk-set ${nextKey === k ? "wk-next" : ""}`}
                        style={{ ...s.setBtn, ...(on ? s.setOn : {}), ...(nextKey === k ? { borderColor: "var(--accent)" } : {}) }}>
                        {on ? "✓ " : ""}Set {si + 1}
                      </button>
                      <input inputMode="numeric" placeholder={unit} value={st.reps[k] ?? ""} style={s.input}
                        onChange={(e) => { const v = e.target.value.replace(/[^\d]/g, "").slice(0, 4); update((x) => { x.reps[k] = v; return x; }); }} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* ── Victory screen ── */}
        {allDone && (
          <div className="wk-pop" style={{ ...s.card, padding: "1.3rem 1rem", marginTop: 16, borderColor: "var(--gold)", textAlign: "center", boxShadow: "0 0 30px rgba(251,191,36,0.25)" }}>
            <div style={{ fontSize: "2.4rem" }}>🏆</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, marginTop: 2 }}>QUEST COMPLETE</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>
              {day.name} · {todayStr()}{st.start && st.end ? ` · ${fmtDur(st.end - st.start)}` : ""}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "14px 0" }}>
              <div style={s.stat}><div style={{ ...s.statNum, color: "var(--gold)" }}>+{todayXp}</div><div style={s.statLbl}>XP earned</div></div>
              <div style={s.stat}><div style={s.statNum}>{day.ex.length * SETS}</div><div style={s.statLbl}>sets</div></div>
              <div style={s.stat}><div style={s.statNum}>{prCount}</div><div style={s.statLbl}>new PRs</div></div>
            </div>

            <div style={{ textAlign: "left" }}>
              {summary.map((x) => (
                <div key={x.name} style={s.sumRow}>
                  <span>{x.icon}</span>
                  <span style={{ flex: 1 }}>{x.name}</span>
                  <span style={{ fontWeight: 700, textAlign: "right" }}>
                    {x.vals.length ? `${x.vals.join(" / ")} (${x.sum} ${x.unit})` : "✓"}
                    {x.pr && <span style={{ color: "var(--gold)" }}> 🏆</span>}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center", flexWrap: "wrap" }}>
              {token
                ? <button onClick={save} disabled={st.saved} style={{ ...s.primary, opacity: st.saved ? 0.6 : 1 }}>{st.saved ? "✓ Saved — XP banked" : "💾 Save & bank XP"}</button>
                : <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", alignSelf: "center" }}>Log in below to bank your XP</span>}
              <button onClick={reset} style={s.ghost}>Reset</button>
            </div>
            {msg && <p style={{ color: "var(--gold)", fontSize: "0.85rem", marginTop: 8 }}>{msg}</p>}
          </div>
        )}

        {!allDone && done > 0 && (
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <button onClick={reset} style={{ ...s.ghost, border: "none" }}>Reset today</button>
          </div>
        )}

        {/* ── Badges ── */}
        <div style={s.sectionHead}><span>🎖 Badges</span><span style={s.sectionXp}>{BADGES.filter((b) => b.test(game)).length}/{BADGES.length}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {BADGES.map((b) => {
            const got = b.test(game);
            return (
              <div key={b.id} title={`${b.name}: ${b.desc}`} style={{ ...s.badge, ...(got ? s.badgeOn : {}) }}>
                <div style={{ fontSize: "1.5rem", filter: got ? "none" : "grayscale(1)", opacity: got ? 1 : 0.35 }}>{b.icon}</div>
                <div style={{ fontSize: "0.64rem", fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>{b.name}</div>
                <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", marginTop: 2, lineHeight: 1.2 }}>{b.desc}</div>
              </div>
            );
          })}
        </div>

        {/* ── History ── */}
        {sessions.length > 0 && (
          <>
            <div style={s.sectionHead}><span>📜 Battle log</span><span style={s.sectionXp}>last {Math.min(6, sessions.length)}</span></div>
            {sessions.slice(0, 6).map((x) => (
              <details key={x.key} style={{ ...s.card, padding: "0.7rem 1rem", marginBottom: 8 }}>
                <summary style={{ cursor: "pointer" }}>
                  <strong>{days.find((d) => d.key === x.day)?.name || x.day}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}> · {x.date.toLocaleDateString()} · +{SESSION_XP} XP</span>
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

        {/* ── Rules ── */}
        <button onClick={() => setShowRules((v) => !v)} style={{ ...s.card, ...s.rulesBtn }}>
          <span>📖 Rules of the game</span><span>{showRules ? "−" : "+"}</span>
        </button>
        {showRules && (
          <div style={{ ...s.card, padding: "0.4rem 1rem 0.9rem", marginTop: -4, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            {rules.map(([t, d]) => (
              <p key={t} style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: 10, lineHeight: 1.55 }}>
                <strong style={{ color: "var(--text)" }}>{t}:</strong> {d}
              </p>
            ))}
            <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: 10, lineHeight: 1.55 }}>
              <strong style={{ color: "var(--text)" }}>XP:</strong> {XP_WARM} per warm-up item, {XP_SET} per set, +{XP_FINISH} for finishing, +{XP_PR} per new PR. {LEVEL_XP} XP per level.
            </p>
          </div>
        )}

        {/* ── Account ── */}
        <div style={{ ...s.card, padding: "0.9rem 1rem", marginTop: 14 }}>
          {token ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>👤 {localStorage.getItem("email") || "Logged in"}</span>
              <button onClick={logout} style={s.ghost}>Log out</button>
            </div>
          ) : (
            <form onSubmit={submitAuth} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <strong>{auth.mode === "login" ? "🔑 Log in to save progress" : "✨ Create your player"}</strong>
              <input type="email" required placeholder="Email" autoComplete="email" value={auth.email}
                onChange={(e) => setAuth((a) => ({ ...a, email: e.target.value }))} style={{ ...s.input, textAlign: "left", padding: "0.65rem" }} />
              <input type="password" required placeholder="Password" autoComplete={auth.mode === "login" ? "current-password" : "new-password"} value={auth.password}
                onChange={(e) => setAuth((a) => ({ ...a, password: e.target.value }))} style={{ ...s.input, textAlign: "left", padding: "0.65rem" }} />
              {auth.err && <span style={{ color: "var(--gold)", fontSize: "0.85rem" }}>{auth.err}</span>}
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
      </div>

      {/* ── Rest timer ── */}
      {rest && (
        <div style={s.restBar}>
          <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
            <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="var(--border)" strokeWidth="5" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="var(--accent-2)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - restLeft / rest.total)} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>
              {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, "0")}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800 }}>Rest up 😮‍💨</div>
            {rest.next && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Next: {rest.next}</div>}
          </div>
          <button onClick={() => setRest(null)} style={s.ghost}>Skip</button>
        </div>
      )}

      {/* ── XP pops ── */}
      {pops.map((p) => (
        <div key={p.id} style={{ position: "fixed", left: p.x, top: p.y, pointerEvents: "none", fontWeight: 900, color: "var(--gold)", textShadow: "0 2px 8px rgba(0,0,0,0.4)", animation: "wk-float .95s ease-out forwards", zIndex: 50 }}>
          {p.text}
        </div>
      ))}

      {/* ── Confetti ── */}
      {confetti && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 60 }}>
          {confettiBits.map((b, i) => (
            <span key={i} style={{ position: "absolute", top: 0, left: `${b.left}%`, width: b.size, height: b.size * 0.5, background: b.color, borderRadius: 2, animation: `wk-fall ${b.dur}s ${b.delay}s ease-in forwards` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Styles ───────────────────────── */

const s = {
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" },
  levelBadge: { width: 58, height: 58, borderRadius: 16, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#fff", background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "var(--glow)" },
  iconBtn: { background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: 12, padding: "0.5rem 0.6rem", cursor: "pointer", fontSize: "1rem", alignSelf: "flex-start" },
  stat: { background: "var(--bg-muted)", borderRadius: 12, padding: "0.6rem 0.4rem", textAlign: "center" },
  statNum: { fontSize: "1.2rem", fontWeight: 900 },
  statLbl: { fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" },
  dot: { width: 22, height: 22, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 800, background: "var(--bg-card)", color: "var(--text-faint)", border: "1px solid var(--border)" },
  dotOn: { background: "var(--good)", color: "#06281d", borderColor: "var(--good)" },
  tab: { position: "relative", padding: "0.65rem 0.3rem", borderRadius: 14, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", cursor: "pointer" },
  tabOn: { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", borderColor: "transparent", boxShadow: "var(--glow)" },
  todayTag: { position: "absolute", top: -7, right: 6, fontSize: "0.55rem", fontWeight: 900, letterSpacing: "0.08em", background: "var(--gold)", color: "#1a1300", borderRadius: 6, padding: "1px 5px" },
  barBg: { background: "var(--bg-muted)", borderRadius: 99, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 99, transition: "width .4s cubic-bezier(.2,.8,.2,1)" },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", fontWeight: 800, fontSize: "0.95rem", margin: "1.4rem 0 0.6rem" },
  sectionXp: { fontSize: "0.72rem", fontWeight: 700, color: "var(--gold)" },
  warmRow: { display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "0.8rem 1rem", border: "none", borderBottom: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "0.92rem" },
  check: { width: 24, height: 24, borderRadius: 8, border: "2px solid var(--border-input)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.8rem", flexShrink: 0 },
  checkOn: { background: "var(--good)", borderColor: "var(--good)", color: "#06281d" },
  exIcon: { width: 42, height: 42, borderRadius: 12, background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0, color: "#06281d", fontWeight: 900 },
  prTag: { fontSize: "0.62rem", fontWeight: 900, letterSpacing: "0.06em", background: "var(--gold)", color: "#1a1300", borderRadius: 8, padding: "3px 7px" },
  setBtn: { padding: "0.7rem 0", borderRadius: 12, border: "2px solid var(--border-input)", background: "var(--bg-input)", color: "var(--text)", fontWeight: 800, cursor: "pointer", fontSize: "0.88rem" },
  setOn: { background: "var(--good)", borderColor: "var(--good)", color: "#06281d" },
  input: { width: "100%", minWidth: 0, padding: "0.45rem", textAlign: "center", borderRadius: 10, border: "1px solid var(--border-input)", background: "var(--bg-input)", color: "var(--input-text)", fontSize: "0.9rem", fontWeight: 600 },
  sumRow: { display: "flex", gap: 10, padding: "0.5rem 0", borderBottom: "1px solid var(--border)", fontSize: "0.88rem" },
  primary: { padding: "0.7rem 1.3rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: "var(--glow)" },
  ghost: { padding: "0.6rem 1.1rem", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontWeight: 600 },
  badge: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "0.65rem 0.3rem", textAlign: "center" },
  badgeOn: { borderColor: "var(--gold)", boxShadow: "0 0 14px rgba(251,191,36,0.2)" },
  rulesBtn: { width: "100%", display: "flex", justifyContent: "space-between", padding: "0.85rem 1rem", marginTop: 14, color: "var(--text)", fontWeight: 700, cursor: "pointer", fontSize: "0.92rem" },
  restBar: { position: "fixed", left: 12, right: 12, bottom: 12, maxWidth: 616, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, padding: "0.7rem 0.9rem", borderRadius: 18, background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", boxShadow: "0 10px 30px var(--shadow-lg)", zIndex: 40 },
};
