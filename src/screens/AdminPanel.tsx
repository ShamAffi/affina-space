import { useEffect, useState, useCallback, type ReactNode } from 'react';

// Internal admin panel (SPEC_ADMIN_PANEL §5) — 3 tabs over /api/admin. Route is /admin, not
// linked anywhere; on mount it pings and bounces a non-admin to the dashboard (the server also
// 403s every action, so this is only UX). Plain tables, desktop-first, an internal tool.

type Tab = 'overview' | 'users' | 'requests';
const money = (cents: number | string | null) => `€${Math.round(Number(cents ?? 0) / 100).toLocaleString()}`;
const tokens = (n: number | string | null) => Number(n ?? 0).toLocaleString();
// Rough cost — Anthropic bills in USD; Sonnet 5 ≈ $3/M input, $15/M output. Edit if pricing shifts.
const cost = (input: number | string | null, output: number | string | null) =>
  `≈ $${(Number(input ?? 0) * 3e-6 + Number(output ?? 0) * 15e-6).toFixed(2)}`;
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—');
const dayTime = (s: string | null) => (s ? new Date(s).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

async function api(action: string, params: Record<string, string | number> = {}) {
  const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
  const r = await fetch(`/api/admin?${qs}`);
  if (!r.ok) throw Object.assign(new Error('admin_fetch'), { status: r.status });
  return r.json();
}

export default function AdminPanel({ onBounce }: { onBounce: () => void }) {
  const [gate, setGate] = useState<'checking' | 'ok'>('checking');
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    api('ping').then(() => setGate('ok')).catch(() => onBounce()); // non-admin (403) / no session (401) → out
  }, [onBounce]);

  if (gate === 'checking') {
    return <div className="min-h-screen bg-canvas flex items-center justify-center"><div className="w-8 h-8 rounded-pill bg-brand animate-orb-pulse" /></div>;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-medium tracking-tight text-ink">Admin</h1>
          <button onClick={onBounce} className="text-sm text-ink-mute hover:text-ink-soft transition">← Dashboard</button>
        </div>

        <div className="flex gap-1 mb-6 bg-inset rounded-pill p-1 w-fit">
          {(['overview', 'users', 'requests'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-pill text-sm font-semibold capitalize transition ${tab === t ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink-soft'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && <Overview />}
        {tab === 'users' && <Users />}
        {tab === 'requests' && <Requests />}
      </div>
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function Overview() {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api('stats').then(setD).catch(() => setErr(true)); }, []);
  if (err) return <p className="text-sm text-red-500">Couldn't load stats.</p>;
  if (!d) return <Loading />;
  const t = d.tiles, f = d.funnel;
  const maxSignup = Math.max(1, ...d.signups.map((s: any) => s.n));
  const tiles = [
    ['Total users', t.total_users], ['Verified', t.verified], ['Paying', t.subscribed],
    ['Revenue', money(t.revenue_cents)], ['New requests', t.new_requests], ['Phones', t.phones],
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map(([label, val]) => (
          <div key={label as string} className="bg-surface border border-hairline rounded-card p-4">
            <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-ink">{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-hairline rounded-card p-5">
          <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-3">Funnel (7d · 30d)</p>
          <div className="space-y-2">
            {([['Captures', 'cap'], ['Verified', 'ver'], ['Paywall viewed', 'pw'], ['Payments', 'pay']] as const).map(([label, key]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{label}</span>
                <span className="font-semibold text-ink tabular-nums">{f[`${key}7`]} <span className="text-ink-mute">· {f[`${key}30`]}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-hairline rounded-card p-5">
          <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-3">Signups (14d)</p>
          <div className="flex items-end gap-1 h-20">
            {d.signups.length === 0 && <p className="text-sm text-ink-mute">No signups yet.</p>}
            {d.signups.map((s: any) => (
              <div key={s.day} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${day(s.day)}: ${s.n}`}>
                <div className="w-full bg-brand-200 rounded-t" style={{ height: `${(s.n / maxSignup) * 100}%`, minHeight: s.n ? '4px' : '0' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-hairline rounded-card p-5">
        <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-3">Top UTM sources</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-ink-mute">
            <th className="pb-2 font-semibold">Source</th><th className="pb-2 font-semibold">Campaign</th>
            <th className="pb-2 font-semibold text-right">Captures</th><th className="pb-2 font-semibold text-right">Paid</th><th className="pb-2 font-semibold text-right">Revenue</th>
          </tr></thead>
          <tbody>
            {d.utm.map((u: any, i: number) => (
              <tr key={i} className="border-t border-hairline">
                <td className="py-2 text-ink">{u.source}</td><td className="py-2 text-ink-soft">{u.campaign}</td>
                <td className="py-2 text-right tabular-nums">{u.captures}</td><td className="py-2 text-right tabular-nums">{u.paid}</td>
                <td className="py-2 text-right tabular-nums font-semibold">{money(u.revenue_cents)}</td>
              </tr>
            ))}
            {d.utm.length === 0 && <tr><td colSpan={5} className="py-3 text-ink-mute">No attribution data yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="bg-surface border border-hairline rounded-card p-5">
        <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-3">AI usage — all users</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <span className="text-ink-mute">Calls <span className="font-semibold text-ink tabular-nums">{d.usage.calls}</span></span>
          <span className="text-ink-mute">Input <span className="font-semibold text-ink tabular-nums">{tokens(d.usage.input)}</span></span>
          <span className="text-ink-mute">Output <span className="font-semibold text-ink tabular-nums">{tokens(d.usage.output)}</span></span>
          <span className="text-ink-mute">Total <span className="font-semibold text-ink tabular-nums">{tokens(Number(d.usage.input) + Number(d.usage.output))}</span></span>
          <span className="text-ink-mute">Est. cost <span className="font-semibold text-brand-700">{cost(d.usage.input, d.usage.output)}</span></span>
        </div>
      </div>
    </div>
  );
}

// ─── Users ──────────────────────────────────────────────────────────────────
function Users() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [d, setD] = useState<any>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const load = useCallback(() => { setD(null); api('users', { search, page }).then(setD).catch(() => setD({ rows: [], total: 0 })); }, [search, page]);
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [load]);

  if (selected !== null) return <UserDetail id={selected} onBack={() => setSelected(null)} />;

  return (
    <div>
      <input
        value={search}
        onChange={(e) => { setPage(0); setSearch(e.target.value); }}
        placeholder="Search email · name · project…"
        className="w-full sm:w-96 mb-4 rounded-control border border-hairline focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none px-4 py-2.5 text-sm text-ink transition"
      />
      {!d ? <Loading /> : (
        <>
          <div className="bg-surface border border-hairline rounded-card overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-ink-mute border-b border-hairline">
                {['Email', 'Name', 'Project', 'Verified', 'Plan', 'Lessons', 'Last active', 'Phone', 'UTM', 'Joined'].map((h) => <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>)}
              </tr></thead>
              <tbody>
                {d.rows.map((u: any) => (
                  <tr key={u.id} onClick={() => setSelected(u.id)} className="border-b border-hairline last:border-0 hover:bg-inset cursor-pointer">
                    <td className="px-3 py-2.5 text-ink font-medium">{u.email}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{u.name || '—'}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{u.project_name || '—'}</td>
                    <td className="px-3 py-2.5">{u.verified_at ? <span className="text-accent-700">✓</span> : <span className="text-ink-mute">pending</span>}</td>
                    <td className="px-3 py-2.5">{u.subscribed ? <span className="text-accent-700 font-semibold">paid</span> : <span className="text-ink-mute">{u.subscription_status || 'free'}</span>}</td>
                    <td className="px-3 py-2.5 tabular-nums text-ink-soft">{u.completed_count}</td>
                    <td className="px-3 py-2.5 text-ink-mute">{day(u.last_active_at)}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{u.phone ? `${u.phone}` : '—'}</td>
                    <td className="px-3 py-2.5 text-ink-mute">{u.utm_source || '—'}</td>
                    <td className="px-3 py-2.5 text-ink-mute">{day(u.created_at)}</td>
                  </tr>
                ))}
                {d.rows.length === 0 && <tr><td colSpan={10} className="px-3 py-4 text-ink-mute">No users.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm text-ink-soft">
            <span>{d.total} total</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-control border border-hairline disabled:opacity-40 hover:bg-inset transition">← Prev</button>
              <span className="tabular-nums">Page {page + 1}</span>
              <button disabled={(page + 1) * d.pageSize >= d.total} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-control border border-hairline disabled:opacity-40 hover:bg-inset transition">Next →</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => { api('user', { id }).then(setD).catch(() => setErr(true)); }, [id]);
  if (err) return <div><button onClick={onBack} className="text-sm text-brand mb-4">← Back</button><p className="text-sm text-red-500">Couldn't load user.</p></div>;
  if (!d) return <Loading />;
  const u = d.user;
  const snap = Array.isArray(u.snapshot_sections) && u.snapshot_sections[0] ? u.snapshot_sections[0].content : null;

  const Card = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="bg-surface border border-hairline rounded-card p-5">
      <p className="text-[11px] font-bold text-ink-mute uppercase tracking-wider mb-3">{title}</p>
      {children}
    </div>
  );
  const Row = ({ k, v }: { k: string; v: ReactNode }) => (
    <div className="flex justify-between gap-4 text-sm py-1"><span className="text-ink-mute">{k}</span><span className="text-ink text-right min-w-0 truncate">{v ?? '—'}</span></div>
  );

  return (
    <div>
      <button onClick={onBack} className="text-sm text-brand hover:text-brand-700 mb-4">← Back to users</button>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-xl font-bold text-ink">{u.name || u.email}</h2>
        <span className="text-sm text-ink-mute">{u.email}</span>
        {u.subscribed && <span className="text-xs font-semibold text-accent-700 bg-accent-50 px-2 py-0.5 rounded-pill">paying</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card title="Profile">
          <Row k="Project" v={u.project_name} /><Row k="Idea" v={u.idea} /><Row k="Customer" v={u.customer} />
          <Row k="Stage" v={u.stage} /><Row k="Goal" v={u.goal} /><Row k="Location" v={[u.city, u.country].filter(Boolean).join(', ')} />
          <Row k="Report score" v={u.report_score} /><Row k="Snapshot" v={snap ? <span className="text-xs">{String(snap).slice(0, 80)}…</span> : '—'} />
        </Card>
        <Card title="Money">
          <Row k="Plan" v={u.subscribed ? 'subscribed' : (u.subscription_status || 'free')} />
          <Row k="Status" v={u.subscription_status} /><Row k="Renews" v={day(u.current_period_end)} />
          <Row k="Stripe id" v={u.stripe_customer_id ? <span className="text-xs font-mono">{u.stripe_customer_id}</span> : '—'} />
          <div className="mt-2 pt-2 border-t border-hairline">
            {d.payments.length === 0 ? <p className="text-xs text-ink-mute">No payments.</p> :
              d.payments.map((p: any, i: number) => <Row key={i} k={day(p.created_at)} v={money(p.amount_cents)} />)}
          </div>
        </Card>
        <Card title="Program">
          <Row k="Phase" v={u.phase} /><Row k="Lessons done" v={d.completedCount} />
          <Row k="Tasks" v={`${d.tasks.done} done · ${d.tasks.open} open`} />
          <Row k="Check-ins" v={d.checkInsCount} /><Row k="Streak" v={u.pulse_streak} />
          <Row k="Achievements" v={d.achievements.length} />
          <div className="mt-2 pt-2 border-t border-hairline max-h-32 overflow-y-auto">
            {d.brain.map((b: any, i: number) => <Row key={i} k={b.lesson_id} v={b.ai_score != null ? `${b.entry_type} · ${b.ai_score}` : b.entry_type} />)}
          </div>
        </Card>
      </div>

      {d.mentorRequests.length > 0 && (
        <Card title="Mentor requests">
          {d.mentorRequests.map((m: any) => (
            <div key={m.id} className="flex justify-between gap-3 text-sm py-1.5 border-b border-hairline last:border-0">
              <span className="text-ink"><span className="font-semibold">{m.session}</span> · {m.topic}</span>
              <span className="text-ink-mute whitespace-nowrap">{m.status} · {day(m.created_at)}</span>
            </div>
          ))}
        </Card>
      )}

      <div className="mt-4">
        <Card title="AI token usage — this founder's program">
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-sm mb-2">
            <span className="text-ink-mute">Calls <span className="font-semibold text-ink tabular-nums">{d.usage.calls}</span></span>
            <span className="text-ink-mute">Input <span className="font-semibold text-ink tabular-nums">{tokens(d.usage.input)}</span></span>
            <span className="text-ink-mute">Output <span className="font-semibold text-ink tabular-nums">{tokens(d.usage.output)}</span></span>
            <span className="text-ink-mute">Total <span className="font-semibold text-ink tabular-nums">{tokens(Number(d.usage.input) + Number(d.usage.output))}</span></span>
            <span className="text-ink-mute">Est. cost <span className="font-semibold text-brand-700">{cost(d.usage.input, d.usage.output)}</span></span>
          </div>
          {d.usage.calls === 0 ? <p className="text-xs text-ink-mute">No AI calls recorded yet.</p> : (
            <div className="pt-2 border-t border-hairline">
              {d.usageByMode.map((m: any) => (
                <Row key={m.mode} k={m.mode} v={<span className="tabular-nums text-xs">{tokens(m.tokens)} tok · {m.calls} calls</span>} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card title={`Activity timeline (${d.timeline.length})`}>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {d.timeline.map((e: any, i: number) => (
              <div key={i} className="flex justify-between gap-3 text-xs py-1 border-b border-hairline last:border-0">
                <span className="text-ink font-medium">{e.name}{e.path && <span className="text-ink-mute font-normal"> · {e.path}</span>}</span>
                <span className="text-ink-mute whitespace-nowrap">{dayTime(e.created_at)}</span>
              </div>
            ))}
            {d.timeline.length === 0 && <p className="text-xs text-ink-mute">No events.</p>}
          </div>
        </Card>
        <Card title={`Emails received (${d.emails.length})`}>
          <div className="max-h-96 overflow-y-auto space-y-1">
            {d.emails.map((e: any, i: number) => (
              <div key={i} className="flex justify-between gap-3 text-xs py-1 border-b border-hairline last:border-0">
                <span className="text-ink">{e.type}</span><span className="text-ink-mute whitespace-nowrap">{dayTime(e.sent_at)}</span>
              </div>
            ))}
            {d.emails.length === 0 && <p className="text-xs text-ink-mute">No emails.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Requests ─────────────────────────────────────────────────────────────────
function Requests() {
  const [d, setD] = useState<any>(null);
  const NEXT: Record<string, string> = { new: 'scheduled', scheduled: 'done' };
  const load = useCallback(() => { api('requests').then(setD).catch(() => setD({ rows: [] })); }, []);
  useEffect(() => { load(); }, [load]);

  async function advance(id: number, status: string) {
    const next = NEXT[status];
    if (!next) return;
    try {
      await fetch('/api/admin?action=request-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: next }) });
      load();
    } catch { /* ignore */ }
  }

  if (!d) return <Loading />;
  const counts = { new: 0, scheduled: 0, done: 0 } as Record<string, number>;
  d.rows.forEach((r: any) => { counts[r.status] = (counts[r.status] || 0) + 1; });

  return (
    <div>
      <div className="flex gap-2 mb-4 text-xs">
        {(['new', 'scheduled', 'done'] as const).map((s) => (
          <span key={s} className={`px-2.5 py-1 rounded-pill font-semibold ${s === 'new' ? 'bg-brand-50 text-brand-700' : 'bg-inset text-ink-soft'}`}>{s} {counts[s] || 0}</span>
        ))}
      </div>
      <div className="space-y-2">
        {d.rows.map((r: any) => (
          <div key={r.id} className={`bg-surface border rounded-card p-4 flex items-start justify-between gap-4 ${r.status === 'new' ? 'border-brand-200' : 'border-hairline'}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-ink">{r.session}</span>
                <span className="text-xs text-ink-mute">{r.name || '—'} · {r.email}{r.phone ? ` · ${r.phone}` : ''}</span>
                {r.subscribed && <span className="text-[10px] font-semibold text-accent-700">paid</span>}
              </div>
              <p className="text-sm text-ink-soft">{r.topic}</p>
              <p className="text-[11px] text-ink-mute mt-1">{dayTime(r.created_at)} · {r.status}</p>
            </div>
            {NEXT[r.status] && (
              <button onClick={() => advance(r.id, r.status)} className="flex-shrink-0 bg-brand hover:bg-brand-700 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-pill transition">
                → {NEXT[r.status]}
              </button>
            )}
          </div>
        ))}
        {d.rows.length === 0 && <p className="text-sm text-ink-mute">No mentor requests.</p>}
      </div>
    </div>
  );
}

function Loading() {
  return <div className="py-16 flex justify-center"><div className="w-6 h-6 rounded-pill bg-brand animate-orb-pulse" /></div>;
}
