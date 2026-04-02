import { useState, useEffect, useCallback } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0f0d0b",
  surface: "#1a1714",
  card: "#211e1a",
  border: "#2e2a25",
  gold: "#c9a84c",
  goldLight: "#e8c97a",
  goldDim: "#7a6430",
  rose: "#c97a7a",
  cream: "#f0e8d8",
  creamDim: "#a89880",
  green: "#7ab892",
  blue: "#7aaac9",
  text: "#f0e8d8",
  textDim: "#786a58",
  textMid: "#b09878",
};

const css = (obj) => Object.entries(obj).map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}:${v}`).join(";");

// ─── AI HELPER ────────────────────────────────────────────────────────────────
async function callAI(prompt, system = "") {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: system || "You are an expert event planning assistant for Frey Events, a luxury event company. Be concise, professional, and specific.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await resp.json();
  return data.content?.[0]?.text || "";
}

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────
async function load(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
async function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = {
  clients: [
    { id: "c1", name: "Sophia Reinholt", email: "sophia@email.com", phone: "555-0101", eventType: "Wedding", budget: 18000, status: "Booked", tag: "High Value", createdAt: "2025-05-10" },
    { id: "c2", name: "Marcus Teel", email: "marcus@email.com", phone: "555-0202", eventType: "Corporate", budget: 7500, status: "Consult", tag: "High Value", createdAt: "2025-05-18" },
    { id: "c3", name: "Priya Nair", email: "priya@email.com", phone: "555-0303", eventType: "Birthday", budget: 3200, status: "Lead", tag: "", createdAt: "2025-05-22" },
  ],
  events: [
    { id: "e1", clientId: "c1", name: "Reinholt Wedding", date: "2025-08-15", venue: "The Grand Pavilion", guests: 180, style: "Luxury", status: "Booked", revenue: 18000, inventoryCost: 4200, laborCost: 3100 },
    { id: "e2", clientId: "c2", name: "Teel Corp Gala", date: "2025-07-22", venue: "Rooftop 54", guests: 90, style: "Modern", status: "Consult", revenue: 7500, inventoryCost: 1800, laborCost: 1400 },
  ],
  inventory: [
    { id: "i1", name: "Chiavari Chairs", category: "Seating", qty: 300, reserved: 180 },
    { id: "i2", name: "Round Tables (60\")", category: "Tables", qty: 40, reserved: 20 },
    { id: "i3", name: "Candelabra (Tall)", category: "Lighting", qty: 60, reserved: 30 },
    { id: "i4", name: "Floral Arch Frame", category: "Decor", qty: 8, reserved: 1 },
    { id: "i5", name: "Ivory Linens", category: "Linens", qty: 200, reserved: 120 },
    { id: "i6", name: "LED Uplights", category: "Lighting", qty: 50, reserved: 18 },
  ],
  staff: [
    { id: "s1", name: "Jordan Lee", role: "Lead Coordinator", rate: 45 },
    { id: "s2", name: "Aaliya Moss", role: "Floral Designer", rate: 38 },
    { id: "s3", name: "Dmitri Vance", role: "Setup Crew", rate: 22 },
    { id: "s4", name: "Tina Park", role: "Setup Crew", rate: 22 },
  ],
  shifts: [
    { id: "sh1", eventId: "e1", staffId: "s1", role: "Coordinator", start: "10:00", end: "22:00", hours: 12 },
    { id: "sh2", eventId: "e1", staffId: "s2", role: "Floral", start: "08:00", end: "14:00", hours: 6 },
    { id: "sh3", eventId: "e1", staffId: "s3", role: "Setup", start: "07:00", end: "16:00", hours: 9 },
  ],
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18, color = T.gold }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  clients: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  events: "M8 2v4 M16 2v4 M3 10h18 M3 6a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  inventory: "M21 8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  staff: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  finance: "M12 2v20 M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  intake: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z",
  ai: "M12 2a10 10 0 110 20A10 10 0 0112 2z M8 12h8 M12 8v8",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18 M6 6l12 12",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 M12 5l7 7-7 7",
  alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  refresh: "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0020.49 15",
  briefing: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  send: "M22 2L11 13 M22 2L15 22l-4-9-9-4z",
};

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", small, style: s = {} }) => {
  const base = { padding: small ? "6px 14px" : "10px 22px", borderRadius: "6px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: small ? "12px" : "13px", fontWeight: 600, letterSpacing: "0.04em", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "6px" };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg },
    ghost: { background: "transparent", color: T.textMid, border: `1px solid ${T.border}` },
    danger: { background: "transparent", color: T.rose, border: `1px solid ${T.rose}33` },
    success: { background: `${T.green}22`, color: T.green, border: `1px solid ${T.green}44` },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...s }}>{children}</button>;
};

const Badge = ({ label, color = T.gold }) => (
  <span style={{ padding: "2px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: "0.05em" }}>{label}</span>
);

const StatusBadge = ({ status }) => {
  const map = { Lead: T.blue, Consult: T.textMid, Booked: T.green, Completed: T.goldDim };
  return <Badge label={status} color={map[status] || T.textMid} />;
};

const Card = ({ children, style: s = {} }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px", ...s }}>{children}</div>
);

const Input = ({ label, value, onChange, type = "text", placeholder, options, style: s = {} }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "5px", ...s }}>
    {label && <label style={{ fontSize: "11px", color: T.textMid, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>}
    {options ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "8px 10px", color: T.text, fontFamily: "inherit", fontSize: "13px" }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "8px 10px", color: T.text, fontFamily: "inherit", fontSize: "13px", outline: "none" }} />
    )}
  </div>
);

const Stat = ({ label, value, sub, color = T.gold }) => (
  <Card style={{ flex: 1, minWidth: "130px" }}>
    <div style={{ fontSize: "11px", color: T.textMid, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
    <div style={{ fontSize: "26px", fontFamily: "Playfair Display, serif", color, fontWeight: 700 }}>{value}</div>
    {sub && <div style={{ fontSize: "11px", color: T.textMid, marginTop: "4px" }}>{sub}</div>}
  </Card>
);

const AIBox = ({ content, loading }) => (
  <div style={{ background: `${T.gold}0d`, border: `1px solid ${T.goldDim}`, borderRadius: "8px", padding: "14px", marginTop: "12px", minHeight: "60px" }}>
    {loading ? (
      <div style={{ color: T.goldDim, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>✦</span> Generating…
      </div>
    ) : (
      <div style={{ color: T.cream, fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{content}</div>
    )}
  </div>
);

// ─── VIEWS ────────────────────────────────────────────────────────────────────

function Dashboard({ data }) {
  const totalRevenue = data.events.reduce((s, e) => s + (e.revenue || 0), 0);
  const totalProfit = data.events.reduce((s, e) => s + (e.revenue || 0) - (e.inventoryCost || 0) - (e.laborCost || 0), 0);
  const upcoming = data.events.filter(e => new Date(e.date) >= new Date()).length;
  const booked = data.clients.filter(c => c.status === "Booked").length;

  const today = new Date().toISOString().slice(0, 10);
  const todayEvents = data.events.filter(e => e.date === today);
  const upcomingEvents = data.events.filter(e => e.date > today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", color: T.cream, marginBottom: "4px" }}>Welcome back</div>
        <div style={{ color: T.textMid, fontSize: "14px" }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px" }}>
        <Stat label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} sub="all events" />
        <Stat label="Net Profit" value={`$${totalProfit.toLocaleString()}`} sub={`${Math.round((totalProfit / totalRevenue) * 100) || 0}% margin`} color={T.green} />
        <Stat label="Upcoming Events" value={upcoming} sub="scheduled" color={T.blue} />
        <Stat label="Active Clients" value={booked} sub="booked" color={T.rose} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <Card>
          <div style={{ fontSize: "12px", color: T.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>Pipeline</div>
          {["Lead", "Consult", "Booked", "Completed"].map(s => {
            const count = data.clients.filter(c => c.status === s).length;
            const pct = data.clients.length ? (count / data.clients.length) * 100 : 0;
            return (
              <div key={s} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: T.textMid }}>{s}</span>
                  <span style={{ fontSize: "12px", color: T.text }}>{count}</span>
                </div>
                <div style={{ height: "4px", background: T.border, borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: T.gold, borderRadius: "2px", transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card>
          <div style={{ fontSize: "12px", color: T.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>Upcoming Events</div>
          {upcomingEvents.length === 0 && <div style={{ color: T.textMid, fontSize: "13px" }}>No upcoming events</div>}
          {upcomingEvents.map(e => {
            const client = data.clients.find(c => c.id === e.clientId);
            const days = Math.ceil((new Date(e.date) - new Date()) / 86400000);
            return (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "10px", borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontSize: "13px", color: T.cream }}>{e.name}</div>
                  <div style={{ fontSize: "11px", color: T.textMid }}>{client?.name} · {e.venue}</div>
                </div>
                <Badge label={`${days}d`} color={days < 14 ? T.rose : T.gold} />
              </div>
            );
          })}
        </Card>
      </div>

      {todayEvents.length > 0 && (
        <Card style={{ borderColor: T.gold, background: `${T.gold}08` }}>
          <div style={{ fontSize: "12px", color: T.gold, fontWeight: 700, letterSpacing: "0.1em", marginBottom: "10px" }}>TODAY'S EVENTS</div>
          {todayEvents.map(e => <div key={e.id} style={{ color: T.cream, fontSize: "14px" }}>🎉 {e.name} · {e.venue}</div>)}
        </Card>
      )}

      <Card style={{ marginTop: "16px" }}>
        <div style={{ fontSize: "12px", color: T.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>Inventory Alerts</div>
        {data.inventory.filter(i => i.reserved >= i.qty * 0.85).map(i => (
          <div key={i.id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Icon d={ICONS.alert} size={14} color={T.rose} />
            <span style={{ fontSize: "13px", color: T.textMid }}>{i.name}</span>
            <span style={{ fontSize: "12px", color: T.rose }}>{i.qty - i.reserved} remaining</span>
          </div>
        ))}
        {data.inventory.filter(i => i.reserved >= i.qty * 0.85).length === 0 && (
          <div style={{ color: T.green, fontSize: "13px" }}>✓ All inventory levels healthy</div>
        )}
      </Card>
    </div>
  );
}

function ClientIntake({ data, setData }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", eventType: "Wedding", budget: "", style: "Luxury", notes: "" });
  const [aiResult, setAiResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.name || !form.email) return;
    setLoading(true);
    setAiResult("");
    const prompt = `New client intake for Frey Events:
Name: ${form.name}
Email: ${form.email}
Event Type: ${form.eventType}
Budget: $${form.budget}
Style: ${form.style}
Notes: ${form.notes}

1. Qualify this lead (High Value / Standard / Low Priority) with a reason.
2. Write a warm, luxury-brand welcome email (3 sentences max).
3. List 3 tailored design suggestions for their event.
Keep total response under 300 words.`;
    const res = await callAI(prompt);
    setAiResult(res);
    setLoading(false);
  }

  async function saveClient() {
    const tag = parseInt(form.budget) >= 5000 ? "High Value" : "";
    const newClient = { id: `c${Date.now()}`, ...form, budget: parseInt(form.budget) || 0, status: "Lead", tag, createdAt: new Date().toISOString().slice(0, 10) };
    const updated = { ...data, clients: [newClient, ...data.clients] };
    setData(updated);
    await save("frey-clients", updated.clients);
    setSaved(true);
    setForm({ name: "", email: "", phone: "", eventType: "Wedding", budget: "", style: "Luxury", notes: "" });
    setAiResult("");
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: T.cream, marginBottom: "4px" }}>Client Intake</div>
      <div style={{ color: T.textMid, fontSize: "13px", marginBottom: "24px" }}>Replaces Typeform · AI-powered qualification</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <Input label="Full Name" value={form.name} onChange={f("name")} placeholder="Jane Smith" />
        <Input label="Email" value={form.email} onChange={f("email")} type="email" placeholder="jane@email.com" />
        <Input label="Phone" value={form.phone} onChange={f("phone")} placeholder="555-0000" />
        <Input label="Budget ($)" value={form.budget} onChange={f("budget")} type="number" placeholder="10000" />
        <Input label="Event Type" value={form.eventType} onChange={f("eventType")} options={["Wedding", "Corporate", "Birthday", "Baby Shower", "Anniversary", "Other"]} />
        <Input label="Design Style" value={form.style} onChange={f("style")} options={["Luxury", "Modern", "Boho", "Rustic", "Classic", "Minimalist"]} />
      </div>
      <Input label="Notes / Inspiration" value={form.notes} onChange={f("notes")} placeholder="Tell us about the vision…" style={{ marginBottom: "16px" }} />

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <Btn onClick={saveClient} variant="success"><Icon d={ICONS.check} size={14} color={T.green} /> Save Client</Btn>
        {saved && <Badge label="✓ Saved!" color={T.green} />}
      </div>
    </div>
  );
}

function Clients({ data, setData }) {
  const [filter, setFilter] = useState("All");
  const [aiMap, setAiMap] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const statuses = ["All", "Lead", "Consult", "Booked", "Completed"];
  const filtered = filter === "All" ? data.clients : data.clients.filter(c => c.status === filter);

  async function advance(client) {
    const next = { Lead: "Consult", Consult: "Booked", Booked: "Completed" }[client.status];
    if (!next) return;
    const updated = { ...data, clients: data.clients.map(c => c.id === client.id ? { ...c, status: next } : c) };
    setData(updated);
    await save("frey-clients", updated.clients);
  }

  async function generateFollowUp(client) {
    setLoadingId(client.id);
    const res = await callAI(`Write a professional 2-sentence follow-up message for ${client.name}, a ${client.status} client planning a ${client.eventType} with a $${client.budget} budget in a ${client.style || "luxury"} style. Tone: warm, high-end event planner.`);
    setAiMap(p => ({ ...p, [client.id]: res }));
    setLoadingId(null);
  }

  return (
    <div>
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: T.cream, marginBottom: "4px" }}>Clients</div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 14px", borderRadius: "20px", border: `1px solid ${filter === s ? T.gold : T.border}`, background: filter === s ? `${T.gold}22` : "transparent", color: filter === s ? T.gold : T.textMid, cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>{s}</button>
        ))}
      </div>

      {filtered.map(c => (
        <Card key={c.id} style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", color: T.cream }}>{c.name}</span>
                <StatusBadge status={c.status} />
                {c.tag && <Badge label={c.tag} color={T.gold} />}
              </div>
              <div style={{ fontSize: "12px", color: T.textMid }}>{c.email} · {c.phone}</div>
              <div style={{ fontSize: "12px", color: T.textMid }}>{c.eventType} · ${c.budget?.toLocaleString()} budget · Added {c.createdAt}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Btn small variant="ghost" onClick={() => generateFollowUp(c)}>
                {loadingId === c.id ? "…" : "✦ Follow-up"}
              </Btn>
              {c.status !== "Completed" && (
                <Btn small onClick={() => advance(c)}>Advance →</Btn>
              )}
            </div>
          </div>
          {aiMap[c.id] && (
            <div style={{ marginTop: "10px", padding: "10px", background: `${T.gold}0d`, borderRadius: "6px", fontSize: "13px", color: T.cream, borderLeft: `2px solid ${T.gold}` }}>
              {aiMap[c.id]}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function Events({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ clientId: "", name: "", date: "", venue: "", guests: "", style: "Luxury", revenue: "", inventoryCost: "", laborCost: "" });
  const [briefing, setBriefing] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  async function addEvent() {
    const e = { id: `e${Date.now()}`, ...form, guests: parseInt(form.guests) || 0, revenue: parseFloat(form.revenue) || 0, inventoryCost: parseFloat(form.inventoryCost) || 0, laborCost: parseFloat(form.laborCost) || 0, status: "Booked" };
    const updated = { ...data, events: [e, ...data.events] };
    setData(updated);
    await save("frey-events", updated.events);
    setShowAdd(false);
    setForm({ clientId: "", name: "", date: "", venue: "", guests: "", style: "Luxury", revenue: "", inventoryCost: "", laborCost: "" });
  }

  async function generateBriefing(event) {
    setLoadingId(event.id);
    const client = data.clients.find(c => c.id === event.clientId);
    const shifts = data.shifts.filter(s => s.eventId === event.id);
    const staffNames = shifts.map(s => { const st = data.staff.find(x => x.id === s.staffId); return st ? `${st.name} (${s.role}, ${s.hours}h)` : ""; }).join(", ");
    const prompt = `Generate a day-of event briefing for Frey Events staff:
Event: ${event.name}
Client: ${client?.name || "N/A"}
Date: ${event.date}
Venue: ${event.venue}
Guests: ${event.guests}
Style: ${event.style}
Staff on duty: ${staffNames || "TBD"}

Include: timeline overview, setup priorities, styling notes, staff assignments, and 2 key reminders. Keep it under 250 words, practical and actionable.`;
    const res = await callAI(prompt);
    setBriefing(p => ({ ...p, [event.id]: res }));
    setLoadingId(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: T.cream }}>Events</div>
          <div style={{ color: T.textMid, fontSize: "13px" }}>Replaces Monday.com · Full event management</div>
        </div>
        <Btn onClick={() => setShowAdd(p => !p)}><Icon d={ICONS.plus} size={14} color={T.bg} /> New Event</Btn>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: "16px", borderColor: T.goldDim }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", color: T.gold, marginBottom: "14px" }}>Add Event</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <Input label="Client" value={form.clientId} onChange={f("clientId")} options={["", ...data.clients.map(c => c.id)]}
              // override to show name
            />
            <Input label="Event Name" value={form.name} onChange={f("name")} placeholder="Reinholt Wedding" />
            <Input label="Date" value={form.date} onChange={f("date")} type="date" />
            <Input label="Venue" value={form.venue} onChange={f("venue")} placeholder="Grand Pavilion" />
            <Input label="Guests" value={form.guests} onChange={f("guests")} type="number" />
            <Input label="Style" value={form.style} onChange={f("style")} options={["Luxury", "Modern", "Boho", "Rustic", "Classic"]} />
            <Input label="Revenue ($)" value={form.revenue} onChange={f("revenue")} type="number" />
            <Input label="Inventory Cost ($)" value={form.inventoryCost} onChange={f("inventoryCost")} type="number" />
            <Input label="Labor Cost ($)" value={form.laborCost} onChange={f("laborCost")} type="number" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn onClick={addEvent}>Save Event</Btn>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {data.events.map(e => {
        const client = data.clients.find(c => c.id === e.clientId);
        const profit = (e.revenue || 0) - (e.inventoryCost || 0) - (e.laborCost || 0);
        const margin = e.revenue ? Math.round((profit / e.revenue) * 100) : 0;
        const days = Math.ceil((new Date(e.date) - new Date()) / 86400000);
        return (
          <Card key={e.id} style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", color: T.cream }}>{e.name}</span>
                  <StatusBadge status={e.status} />
                  <Badge label={e.style} color={T.blue} />
                </div>
                <div style={{ fontSize: "12px", color: T.textMid }}>
                  {client?.name} · {e.venue} · {e.guests} guests · {e.date}
                  {days > 0 && <span style={{ color: days < 14 ? T.rose : T.textMid }}> ({days} days away)</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", color: T.green, fontWeight: 700 }}>${profit.toLocaleString()}</div>
                  <div style={{ fontSize: "11px", color: T.textMid }}>{margin}% margin</div>
                </div>
                <Btn small onClick={() => generateBriefing(e)}>
                  {loadingId === e.id ? "…" : "✦ Briefing"}
                </Btn>
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${T.border}` }}>
              {[["Revenue", e.revenue, T.green], ["Inventory", e.inventoryCost, T.rose], ["Labor", e.laborCost, T.blue]].map(([l, v, c]) => (
                <div key={l}>
                  <div style={{ fontSize: "10px", color: T.textMid, letterSpacing: "0.08em" }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: "14px", color: c }}>${(v || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>

            {briefing[e.id] && (
              <div style={{ marginTop: "12px", padding: "12px", background: `${T.gold}0a`, borderRadius: "8px", borderLeft: `2px solid ${T.gold}` }}>
                <div style={{ fontSize: "11px", color: T.gold, fontWeight: 700, marginBottom: "6px", letterSpacing: "0.08em" }}>DAY-OF BRIEFING</div>
                <div style={{ fontSize: "13px", color: T.cream, whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{briefing[e.id]}</div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function Inventory({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Seating", qty: "", reserved: "0" });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  async function addItem() {
    const item = { id: `i${Date.now()}`, ...form, qty: parseInt(form.qty) || 0, reserved: parseInt(form.reserved) || 0 };
    const updated = { ...data, inventory: [...data.inventory, item] };
    setData(updated);
    await save("frey-inventory", updated.inventory);
    setShowAdd(false);
    setForm({ name: "", category: "Seating", qty: "", reserved: "0" });
  }

  const categories = [...new Set(data.inventory.map(i => i.category))];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: T.cream }}>Inventory</div>
          <div style={{ color: T.textMid, fontSize: "13px" }}>Replaces Airtable inventory base</div>
        </div>
        <Btn onClick={() => setShowAdd(p => !p)}><Icon d={ICONS.plus} size={14} color={T.bg} /> Add Item</Btn>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: "16px", borderColor: T.goldDim }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <Input label="Item Name" value={form.name} onChange={f("name")} placeholder="Chiavari Chairs" />
            <Input label="Category" value={form.category} onChange={f("category")} options={["Seating", "Tables", "Lighting", "Decor", "Linens", "Other"]} />
            <Input label="Total Qty" value={form.qty} onChange={f("qty")} type="number" />
            <Input label="Reserved" value={form.reserved} onChange={f("reserved")} type="number" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn onClick={addItem}>Save</Btn>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {categories.map(cat => (
        <div key={cat} style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: T.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>{cat}</div>
          {data.inventory.filter(i => i.category === cat).map(i => {
            const avail = i.qty - i.reserved;
            const pct = Math.min(100, (i.reserved / i.qty) * 100);
            const alert = pct >= 85;
            return (
              <Card key={i.id} style={{ marginBottom: "8px", borderColor: alert ? `${T.rose}44` : T.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ color: T.cream, fontSize: "14px" }}>{i.name}</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {alert && <Icon d={ICONS.alert} size={14} color={T.rose} />}
                    <span style={{ fontSize: "12px", color: T.textMid }}>{i.reserved}/{i.qty} reserved</span>
                    <Badge label={`${avail} avail`} color={alert ? T.rose : T.green} />
                  </div>
                </div>
                <div style={{ height: "4px", background: T.border, borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: alert ? T.rose : T.green, borderRadius: "2px", transition: "width 0.5s" }} />
                </div>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Staff({ data, setData }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", rate: "" });
  const f = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  async function addStaff() {
    const s = { id: `s${Date.now()}`, ...form, rate: parseFloat(form.rate) || 0 };
    const updated = { ...data, staff: [...data.staff, s] };
    setData(updated);
    await save("frey-staff", updated.staff);
    setShowAdd(false);
    setForm({ name: "", role: "", rate: "" });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: T.cream }}>Staff & Labor</div>
          <div style={{ color: T.textMid, fontSize: "13px" }}>Replaces Clockify + team management</div>
        </div>
        <Btn onClick={() => setShowAdd(p => !p)}><Icon d={ICONS.plus} size={14} color={T.bg} /> Add Staff</Btn>
      </div>

      {showAdd && (
        <Card style={{ marginBottom: "16px", borderColor: T.goldDim }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <Input label="Name" value={form.name} onChange={f("name")} placeholder="Jordan Lee" />
            <Input label="Role" value={form.role} onChange={f("role")} options={["Lead Coordinator", "Floral Designer", "Setup Crew", "Breakdown Crew", "Photographer", "Other"]} />
            <Input label="Hourly Rate ($)" value={form.rate} onChange={f("rate")} type="number" />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn onClick={addStaff}>Save</Btn>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {data.staff.map(s => {
          const shifts = data.shifts.filter(sh => sh.staffId === s.id);
          const totalHours = shifts.reduce((sum, sh) => sum + (sh.hours || 0), 0);
          return (
            <Card key={s.id}>
              <div style={{ fontFamily: "Playfair Display, serif", fontSize: "15px", color: T.cream, marginBottom: "4px" }}>{s.name}</div>
              <Badge label={s.role} color={T.blue} />
              <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "10px", color: T.textMid, letterSpacing: "0.08em" }}>RATE</div>
                  <div style={{ fontSize: "14px", color: T.gold }}>${s.rate}/hr</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: T.textMid, letterSpacing: "0.08em" }}>HOURS</div>
                  <div style={{ fontSize: "14px", color: T.cream }}>{totalHours}h</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: T.textMid, letterSpacing: "0.08em" }}>EARNED</div>
                  <div style={{ fontSize: "14px", color: T.green }}>${(totalHours * s.rate).toLocaleString()}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", color: T.cream, marginBottom: "14px" }}>Shift Log</div>
      {data.shifts.map(sh => {
        const staff = data.staff.find(s => s.id === sh.staffId);
        const event = data.events.find(e => e.id === sh.eventId);
        const cost = (sh.hours || 0) * (staff?.rate || 0);
        return (
          <Card key={sh.id} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: T.cream, fontSize: "14px" }}>{staff?.name}</span>
                <span style={{ color: T.textMid, fontSize: "12px", marginLeft: "10px" }}>{event?.name} · {sh.role}</span>
              </div>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: T.textMid }}>{sh.start}–{sh.end} ({sh.hours}h)</span>
                <Badge label={`$${cost}`} color={T.green} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function Finance({ data }) {
  const events = data.events;
  const totalRevenue = events.reduce((s, e) => s + (e.revenue || 0), 0);
  const totalInventory = events.reduce((s, e) => s + (e.inventoryCost || 0), 0);
  const totalLabor = events.reduce((s, e) => s + (e.laborCost || 0), 0);
  const totalProfit = totalRevenue - totalInventory - totalLabor;
  const margin = totalRevenue ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <div>
      <div style={{ fontFamily: "Playfair Display, serif", fontSize: "22px", color: T.cream, marginBottom: "4px" }}>Financials</div>
      <div style={{ color: T.textMid, fontSize: "13px", marginBottom: "24px" }}>Replaces QuickBooks · Profit per event</div>

      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "24px" }}>
        <Stat label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} color={T.green} />
        <Stat label="Inventory Costs" value={`$${totalInventory.toLocaleString()}`} color={T.rose} />
        <Stat label="Labor Costs" value={`$${totalLabor.toLocaleString()}`} color={T.blue} />
        <Stat label="Net Profit" value={`$${totalProfit.toLocaleString()}`} sub={`${margin}% margin`} color={T.gold} />
      </div>

      <Card>
        <div style={{ fontSize: "12px", color: T.gold, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "14px" }}>Event P&L Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          {["Event", "Revenue", "Inventory", "Labor", "Profit", "Margin"].map(h => (
            <div key={h} style={{ fontSize: "10px", color: T.textMid, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {events.map(e => {
          const p = (e.revenue || 0) - (e.inventoryCost || 0) - (e.laborCost || 0);
          const m = e.revenue ? Math.round((p / e.revenue) * 100) : 0;
          return (
            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: "8px", padding: "10px 0", borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: "13px", color: T.cream }}>{e.name}</div>
              <div style={{ fontSize: "13px", color: T.green }}>${(e.revenue || 0).toLocaleString()}</div>
              <div style={{ fontSize: "13px", color: T.rose }}>${(e.inventoryCost || 0).toLocaleString()}</div>
              <div style={{ fontSize: "13px", color: T.blue }}>${(e.laborCost || 0).toLocaleString()}</div>
              <div style={{ fontSize: "13px", color: p >= 0 ? T.green : T.rose }}>${p.toLocaleString()}</div>
              <div><Badge label={`${m}%`} color={m >= 40 ? T.green : m >= 20 ? T.gold : T.rose} /></div>
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: "8px", padding: "12px 0 0", borderTop: `2px solid ${T.gold}44` }}>
          <div style={{ fontSize: "12px", color: T.gold, fontWeight: 700 }}>TOTAL</div>
          <div style={{ fontSize: "13px", color: T.green, fontWeight: 700 }}>${totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: "13px", color: T.rose, fontWeight: 700 }}>${totalInventory.toLocaleString()}</div>
          <div style={{ fontSize: "13px", color: T.blue, fontWeight: 700 }}>${totalLabor.toLocaleString()}</div>
          <div style={{ fontSize: "13px", color: T.gold, fontWeight: 700 }}>${totalProfit.toLocaleString()}</div>
          <div><Badge label={`${margin}%`} color={T.gold} /></div>
        </div>
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FreyEventsSystem() {
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState(SEED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const clients = await load("frey-clients");
      const events = await load("frey-events");
      const inventory = await load("frey-inventory");
      const staff = await load("frey-staff");
      const shifts = await load("frey-shifts");
      setData({
        clients: clients || SEED.clients,
        events: events || SEED.events,
        inventory: inventory || SEED.inventory,
        staff: staff || SEED.staff,
        shifts: shifts || SEED.shifts,
      });
      setLoaded(true);
    })();
  }, []);

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: ICONS.dashboard },
    { id: "intake", label: "Intake", icon: ICONS.intake },
    { id: "clients", label: "Clients", icon: ICONS.clients },
    { id: "events", label: "Events", icon: ICONS.events },
    { id: "inventory", label: "Inventory", icon: ICONS.inventory },
    { id: "staff", label: "Staff", icon: ICONS.staff },
    { id: "finance", label: "Finance", icon: ICONS.finance },
  ];

  const views = { dashboard: Dashboard, intake: ClientIntake, clients: Clients, events: Events, inventory: Inventory, staff: Staff, finance: Finance };
  const ViewComponent = views[view];

  if (!loaded) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Playfair Display, serif", color: T.gold, fontSize: "22px" }}>
      Loading Frey Events…
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${T.bg}; } ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        select option { background: ${T.surface}; }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? "220px" : "60px", background: T.surface, borderRight: `1px solid ${T.border}`, transition: "width 0.3s", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: sidebarOpen ? "24px 20px 20px" : "24px 14px 20px", borderBottom: `1px solid ${T.border}` }}>
          {sidebarOpen ? (
            <div style={{ fontFamily: "Playfair Display, serif", fontSize: "17px", color: T.gold, letterSpacing: "0.05em" }}>
              ✦ Frey Events
            </div>
          ) : (
            <div style={{ color: T.gold, fontSize: "18px", textAlign: "center" }}>✦</div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {nav.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} style={{
              width: "100%", padding: sidebarOpen ? "10px 20px" : "10px 0", display: "flex", alignItems: "center", gap: "12px", background: view === item.id ? `${T.gold}15` : "transparent",
              border: "none", cursor: "pointer", color: view === item.id ? T.gold : T.textMid, fontFamily: "inherit", fontSize: "13px", fontWeight: view === item.id ? 600 : 400,
              borderLeft: view === item.id ? `2px solid ${T.gold}` : "2px solid transparent", transition: "all 0.2s", justifyContent: sidebarOpen ? "flex-start" : "center",
            }}>
              <Icon d={item.icon} size={16} color={view === item.id ? T.gold : T.textMid} />
              {sidebarOpen && item.label}
            </button>
          ))}
        </nav>

        <button onClick={() => setSidebarOpen(p => !p)} style={{ margin: "12px", padding: "8px", background: T.card, border: `1px solid ${T.border}`, borderRadius: "6px", cursor: "pointer", color: T.textMid, fontFamily: "inherit", fontSize: "12px" }}>
          {sidebarOpen ? "← Collapse" : "→"}
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Top bar */}
        <div style={{ padding: "16px 28px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: `${T.bg}ee`, backdropFilter: "blur(8px)", zIndex: 5 }}>
          <div style={{ fontSize: "12px", color: T.textMid, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {nav.find(n => n.id === view)?.label}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Badge label={`${data.clients.length} clients`} color={T.textMid} />
            <Badge label={`${data.events.length} events`} color={T.gold} />
          </div>
        </div>

        <div style={{ padding: "28px", maxWidth: "960px", margin: "0 auto" }}>
          <ViewComponent data={data} setData={setData} />
        </div>
      </div>
    </div>
  );
}
