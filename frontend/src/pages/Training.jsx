import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const warmup = [
  ["Wrist Circles & Stretches", "1 min", "Essential joint prep before push-ups and wall handstands."],
  ["Arm & Shoulder Circles", "1 min", "Controlled forward and backward rotations to warm the rotator cuffs."],
  ["Scapular Pulls", "2 × 8", "Hang from the bar and pull your shoulder blades down without bending elbows."],
  ["Bodyweight Squats", "15 reps", "Slow, full-range squats to elevate heart rate and warm up legs."],
];

const pushPull = (squat) => [
  ["Pull-ups (or slow 4-sec negatives)", "3 × Max clean reps", "2 min"],
  ["Standard Push-ups", "3 × 12", "90 sec"],
  ["Diamond Push-ups", "3 × 10", "90 sec"],
  squat,
  ["Hollow Body Hold", "3 × 15–20 sec", "60 sec"],
];

const days = [
  { key: "Tue", name: "Tuesday", focus: "Push, Pull & Core", rows: pushPull(["Bodyweight Squats", "3 × 15", "60 sec"]) },
  {
    key: "Thu", name: "Thursday", focus: "Handstand, Unilateral & Core",
    rows: [
      ["Wall Handstand (fresh shoulders)", "3 × 30 sec", "2 min"],
      ["Chin-ups (palms facing you)", "3 × Max clean reps", "2 min"],
      ["Archer Push-ups (4 each side)", "3 × 8", "90 sec"],
      ["Reverse Lunges (6 each leg)", "3 × 12", "60 sec"],
      ["Plank", "3 × 1 min", "60 sec"],
    ],
  },
  { key: "Sat", name: "Saturday", focus: "Push, Pull & Core", rows: pushPull(["Jump Squats (or regular squats)", "3 × 12", "60 sec"]) },
];

const rules = [
  ["Hardest Move First", "Pull-ups and Wall Handstands sit at the top of each day so you perform them while your nervous system, grip, and shoulders are 100% fresh."],
  ["Form Over Ego", "Chest touches the floor on every push-up with a tight core (no sagging hips). Pull-ups start from a dead hang and finish with your chin clearly over the bar. Never push through sharp wrist, elbow, or shoulder pain."],
  ["How to Level Up", "Once all sets feel smooth with strict form, add 1–2 reps per set the following week, or slow down the lowering phase (3 seconds down, 1 second up) to build real tendon and muscle strength."],
];

export default function Training() {
  const navigate = useNavigate();
  const todayIdx = { 2: 0, 4: 1, 6: 2 }[new Date().getDay()] ?? 0;
  const [active, setActive] = useState(todayIdx);
  const day = days[active];
  const token = localStorage.getItem("token");
  const [logs, setLogs] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [err, setErr] = useState("");

  const loadLogs = useCallback(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/api/workout-logs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setLogs)
      .catch(() => setErr("Could not load your log. Try logging in again."));
  }, [token]);
  useEffect(loadLogs, [loadLogs]);

  const lastFor = (ex) => logs.find((l) => l.exercise === ex);

  const save = async (ex) => {
    const result = (drafts[ex] || "").trim();
    if (!result) return;
    setErr("");
    const r = await fetch(`${BACKEND_URL}/api/workout-logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ day: day.key, exercise: ex, result }),
    });
    if (!r.ok) return setErr("Could not save. Try logging in again.");
    setDrafts((d) => ({ ...d, [ex]: "" }));
    loadLogs();
  };

  // keep this page out of search engines
  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex,nofollow";
    document.head.appendChild(m);
    return () => m.remove();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", padding: "1.5rem 1rem 4rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <button onClick={() => navigate("/")} style={s.back}>← Back</button>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "1rem" }}>Calisthenics Training Scheme</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 4, fontSize: "0.9rem" }}>
          Balanced 3-day bodyweight strength &amp; skill · Tue / Thu / Sat · Pull-up bar &amp; floor
        </p>

        <h2 style={s.h2}>Warm-up · 5 minutes every session</h2>
        <div style={s.card}>
          {warmup.map(([n, t, d]) => (
            <div key={n} style={s.warmRow}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{n}</strong>
                <span style={{ color: "var(--accent)", fontWeight: 700, whiteSpace: "nowrap" }}>{t}</span>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 2 }}>{d}</p>
            </div>
          ))}
        </div>

        <h2 style={s.h2}>Weekly schedule</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {days.map((d, i) => (
            <button key={d.key} onClick={() => setActive(i)}
              style={{ ...s.tab, ...(i === active ? s.tabOn : {}) }}>{d.key}</button>
          ))}
        </div>
        <div style={s.card}>
          <div style={{ padding: "1rem 1.1rem", borderBottom: "1px solid var(--border)" }}>
            <strong style={{ fontSize: "1.1rem" }}>{day.name}</strong>
            <div style={{ color: "var(--accent)", fontSize: "0.85rem" }}>{day.focus}</div>
          </div>
          {day.rows.map(([ex, sets, rest], i) => (
            <div key={ex} style={s.exRow}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{i + 1}. {ex}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>Rest {rest}</div>
                {token && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input value={drafts[ex] || ""} placeholder="e.g. 8 / 7 / 6"
                        onChange={(e) => setDrafts((d) => ({ ...d, [ex]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && save(ex)}
                        style={s.input} />
                      <button onClick={() => save(ex)} style={s.save}>Log</button>
                    </div>
                    {lastFor(ex) && (
                      <div style={{ color: "var(--text-faint)", fontSize: "0.78rem", marginTop: 4 }}>
                        Last: {lastFor(ex).result} · {new Date(lastFor(ex).created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 700, textAlign: "right" }}>{sets}</div>
            </div>
          ))}
        </div>

        {!token && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 10 }}>
            <a href="/login" style={{ color: "var(--accent)" }}>Log in</a> to track your results.
          </p>
        )}
        {err && <p style={{ color: "var(--accent)", fontSize: "0.85rem", marginTop: 10 }}>{err}</p>}

        <h2 style={s.h2}>Training rules &amp; progression</h2>
        {rules.map(([t, d], i) => (
          <div key={t} style={{ ...s.card, padding: "1rem 1.1rem", marginBottom: 10 }}>
            <strong>{i + 1}. {t}</strong>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 4, lineHeight: 1.6 }}>{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  back: { background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" },
  h2: { fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-muted)", margin: "2rem 0 0.8rem" },
  card: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" },
  warmRow: { padding: "0.85rem 1.1rem", borderBottom: "1px solid var(--border)" },
  exRow: { display: "flex", gap: 12, alignItems: "center", padding: "0.85rem 1.1rem", borderBottom: "1px solid var(--border)" },
  input: { flex: 1, minWidth: 0, padding: "0.45rem 0.6rem", borderRadius: 8, border: "1px solid var(--border-input)", background: "var(--bg-input)", color: "var(--input-text)", fontSize: "0.9rem" },
  save: { padding: "0.45rem 0.9rem", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, cursor: "pointer" },
  tab: { flex: 1, padding: "0.6rem", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", cursor: "pointer", fontWeight: 600 },
  tabOn: { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" },
};
