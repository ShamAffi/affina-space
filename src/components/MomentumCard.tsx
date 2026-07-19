import type { MomentumCard as MomentumCardData, MomentumBlock, MomentumMood, NorthStarValue, LatestCheckIn } from '../types';

interface Props {
  card: MomentumCardData | null;
  northStar?: NorthStarValue | null;
  lessonsDone: number;
  exercisesScored: number;
  modulesCompleted: number;
  streak: number;
  lastCheckInAt?: string | null;
  latestCheckIn?: LatestCheckIn | null;
  lastBusinessUpdateAt?: string | null;
  onGoToPulse: () => void;
}

// Monday-anchored ISO week key (mirrors the backend getWeekOf).
function weekOf(d: Date): string {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day + (day === 0 ? -6 : 1));
  return x.toISOString().split('T')[0];
}

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const BUSINESS_TYPES = ['headline_metric', 'milestone', 'this_week', 'trajectory', 'cumulative'];

const MOOD_ACCENT: Record<MomentumMood, string> = {
  building:    'border-t-brand-400',
  progressing: 'border-t-brand-400',
  traction:    'border-t-accent-400',
  recovering:  'border-t-amber-400',
  quiet:       'border-t-gray-300',
};

const KIND_ICON: Record<string, string> = { win: '▲', learning: '✎', setback: '△' };
const KIND_COLOR: Record<string, string> = { win: 'text-accent-600', learning: 'text-brand-600', setback: 'text-amber-500' };

// Deterministic Business blocks straight from the latest check-in — renders even when
// the AI momentum card is null (the old bug: real numbers vanished). Priority: headline
// metric → milestone → this-week wins → other metrics (SPEC_TRACTION_WIDGET §3).
function deterministicBusiness(latest: LatestCheckIn | null, northStar?: NorthStarValue | null): MomentumBlock[] {
  if (!latest) return [];
  const metrics = (latest.metrics ?? []).filter((m) => (m.value ?? 0) > 0 || (m.delta ?? 0) !== 0);
  const krs = latest.keyResults ?? [];
  const blocks: MomentumBlock[] = [];

  let headline = northStar
    ? metrics.find((m) => m.name.toLowerCase().includes((northStar.label || '').toLowerCase())
        || (!!northStar.key && m.name.toLowerCase().includes(northStar.key.toLowerCase())))
    : undefined;
  if (!headline) headline = [...metrics].sort((a, b) => (b.value ?? 0) - (a.value ?? 0))[0];
  if (headline) blocks.push({ type: 'headline_metric', label: headline.name, value: headline.value, delta: headline.delta ?? 0 });

  const milestone = krs.find((k) => k.type === 'milestone');
  if (milestone) blocks.push({ type: 'milestone', text: milestone.text, period: '3w' });

  const wins = krs.filter((k) => k.type === 'win' || k.type === 'setback');
  if (wins.length) blocks.push({ type: 'this_week', items: wins.map((k) => ({ kind: k.type === 'setback' ? 'setback' : 'win', text: k.text })) });

  const others = metrics.filter((m) => m !== headline).slice(0, 3);
  if (others.length) blocks.push({ type: 'cumulative', stats: others.map((m) => ({ label: m.name, value: m.value })) });

  return blocks;
}

export default function MomentumCard({
  card, northStar, lessonsDone, exercisesScored, modulesCompleted, streak,
  lastCheckInAt, latestCheckIn = null, lastBusinessUpdateAt = null, onGoToPulse,
}: Props) {
  const mood: MomentumMood = card?.mood ?? 'building';

  // ── Business presence & recency (deterministic — never depends on the AI card) ──
  const bizMetrics = (latestCheckIn?.metrics ?? []).filter((m) => (m.value ?? 0) > 0 || (m.delta ?? 0) !== 0);
  const bizWins = (latestCheckIn?.keyResults ?? []).filter((k) => k.type === 'win' || k.type === 'milestone');
  const bizCount = bizMetrics.length + bizWins.length;
  const hasBusinessEver = !!lastBusinessUpdateAt || bizCount > 0;
  const isRecentBusiness = !!lastBusinessUpdateAt && (Date.now() - new Date(lastBusinessUpdateAt).getTime() <= SEVEN_DAYS);

  // Tier: A idea-stage · B early traction · C real momentum (recent + rich)
  const tier: 'A' | 'B' | 'C' = !hasBusinessEver ? 'A' : (isRecentBusiness && bizCount >= 3 ? 'C' : 'B');

  // Staleness red card: no business update in 7 days, but only once she's engaged
  // (a brand-new user gets the gentle invite, not a nag). Precedence over amber streak.
  const engaged = lessonsDone > 0 || !!lastCheckInAt;
  const showRed = !isRecentBusiness && engaged;
  const streakAtRiskRaw = streak > 0 && !!lastCheckInAt && weekOf(new Date(lastCheckInAt)) !== weekOf(new Date());
  const showStreakAtRisk = streakAtRiskRaw && !showRed;

  // Business blocks: prefer the AI card's curated business blocks, else deterministic.
  const aiBiz = (card?.blocks ?? []).filter((b) => BUSINESS_TYPES.includes(b.type));
  const bizBlocksAll = aiBiz.length > 0 ? aiBiz : deterministicBusiness(latestCheckIn, northStar);
  // Tier controls size: C shows up to 4 (this-week ≤3), B shows top 2 (this-week ≤2).
  const bizBlocks = (tier === 'C' ? bizBlocksAll.slice(0, 4) : bizBlocksAll.slice(0, 2))
    .map((b) => (b.type === 'this_week'
      ? { ...b, items: b.items.slice(0, tier === 'C' ? 3 : 2) }
      : b));

  const learningLine = [
    lessonsDone > 0 ? `${lessonsDone} lesson${lessonsDone !== 1 ? 's' : ''}` : null,
    exercisesScored > 0 ? `${exercisesScored} exercise${exercisesScored !== 1 ? 's' : ''}` : null,
    modulesCompleted > 0 ? `${modulesCompleted} module${modulesCompleted !== 1 ? 's' : ''}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className={`bg-surface border border-hairline border-t-4 ${MOOD_ACCENT[mood]} rounded-card p-5 shadow-sm flex flex-col md:h-[500px]`}>
      <div className="mb-4 flex items-start gap-2">
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">Traction</p>
          <p className="text-xs text-ink-mute mt-0.5">Your weekly rhythm</p>
        </div>
        {northStar && (
          <button
            onClick={onGoToPulse}
            title={`North Star: ${northStar.label} — track it weekly`}
            className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 hover:border-brand-300 rounded-pill px-3 py-1.5 transition-colors max-w-[55%]"
          >
            <span className="text-xs">⭐</span>
            <span className="text-[11px] font-bold text-brand-800 truncate">{northStar.label}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {/* 🔴 Business-staleness card — top, never truncated; replaces amber streak */}
        {showRed && (
          <button
            onClick={onGoToPulse}
            className="text-left bg-rose-50 border border-rose-200 rounded-control px-4 py-3 hover:border-rose-300 transition-colors flex-shrink-0"
          >
            <p className="text-sm font-bold text-rose-700 leading-snug">Your business needs an update</p>
            <p className="text-xs text-rose-500 mt-0.5 leading-relaxed">
              It's been a week — tell me what moved. Even a small win or a number keeps your momentum real.
            </p>
          </button>
        )}

        {/* 🟡 Streak-at-risk — only when the red card isn't showing (no double warning) */}
        {showStreakAtRisk && (
          <div className="bg-amber-50 border border-amber-100 rounded-control px-4 py-3 flex-shrink-0">
            <p className="text-sm text-amber-700 leading-snug">
              🔥 New week — keep your {streak}-week streak alive with a quick check-in.
            </p>
          </div>
        )}

        {/* BUSINESS PROGRESS */}
        {tier === 'A' ? (
          !showRed && (
            <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-4">
              <p className="text-sm font-semibold text-brand-800 leading-snug mb-1">Your momentum starts here</p>
              <p className="text-xs text-brand-600 leading-relaxed">
                Each week, tell me what you did — wins, numbers, what you learned. I'll track your real progress from day one.
              </p>
            </div>
          )
        ) : (
          <>
            <p className="text-[10px] font-bold text-accent-700 uppercase tracking-widest">Business progress</p>
            {bizBlocks.map((block, i) => <Block key={`b${i}`} block={block} />)}
          </>
        )}

        {/* LEARNING PROGRESS — inverse size: A full · B one line · C hidden */}
        {tier === 'A' && lessonsDone > 0 && (
          <StatsBlock
            label="Your progress"
            stats={[
              { label: 'Lessons done', value: lessonsDone },
              { label: 'Exercises scored', value: exercisesScored },
              ...(modulesCompleted > 0 ? [{ label: 'Modules', value: modulesCompleted }] : []),
            ]}
          />
        )}
        {tier === 'B' && learningLine && (
          <p className="text-xs text-ink-mute">📚 Learning: {learningLine}</p>
        )}
      </div>

      <button
        onClick={onGoToPulse}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-pill transition-all duration-150 flex-shrink-0"
      >
        📊 Weekly check-in
      </button>
    </div>
  );
}

function Block({ block }: { block: MomentumBlock }) {
  switch (block.type) {
    case 'headline_metric': {
      const up = block.delta > 0;
      return (
        <div className="bg-inset rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-widest mb-1">{block.label}</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-ink tabular-nums leading-none">{block.value}</span>
            {up && <span className="text-sm font-bold text-accent-600 mb-0.5">+{block.delta}</span>}
            {!up && block.delta === 0 && <span className="text-sm font-medium text-ink-mute mb-0.5">—</span>}
          </div>
          {block.trend && block.trend.length >= 2 && <div className="mt-2"><Sparkline values={block.trend} /></div>}
        </div>
      );
    }
    case 'milestone':
      return (
        <div className="bg-accent-50 border border-accent-100 rounded-control px-4 py-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span>🎉</span>
            <p className="text-[10px] font-bold text-accent-800 uppercase tracking-widest">
              Milestone{block.period === 'all' ? ' · all-time' : ' · 3 weeks'}
            </p>
          </div>
          <p className="text-sm font-semibold text-ink leading-snug">{block.text}</p>
        </div>
      );
    case 'trajectory':
      return (
        <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Trajectory</p>
          <p className="text-sm text-ink-soft leading-snug">{block.text}</p>
          {block.trend && block.trend.length >= 2 && <div className="mt-2"><Sparkline values={block.trend} /></div>}
        </div>
      );
    case 'this_week':
      return (
        <div className="bg-inset rounded-control px-4 py-3">
          <p className="text-[10px] font-bold text-ink-mute uppercase tracking-widest mb-2">This week</p>
          <div className="space-y-1.5">
            {block.items.slice(0, 3).map((it, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-xs font-bold mt-0.5 flex-shrink-0 ${KIND_COLOR[it.kind] ?? 'text-ink-mute'}`}>
                  {KIND_ICON[it.kind] ?? '•'}
                </span>
                <span className="text-sm text-ink-soft leading-snug">{it.text}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'cumulative':
      return <StatsBlock label="So far" stats={block.stats} />;
    case 'learning_progress':
      return <StatsBlock label="Your progress" stats={block.stats} />;
    case 'streak':
      return (
        <div className="bg-amber-50 border border-amber-100 rounded-control px-4 py-3 flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-sm font-bold text-amber-700 leading-none">
              {block.weeks} week{block.weeks !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">{block.text}</p>
          </div>
        </div>
      );
    case 'encouragement':
      return (
        <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-3">
          <p className="text-sm text-brand-800 leading-relaxed">{block.text}</p>
        </div>
      );
    case 'nudge':
      return (
        <div className="bg-inset border border-dashed border-hairline rounded-control px-4 py-3">
          <p className="text-sm text-ink-soft leading-relaxed">{block.text}</p>
        </div>
      );
    default:
      // Forward-compatible: unknown block types are skipped, not crashed.
      return null;
  }
}

function StatsBlock({ label, stats }: { label: string; stats: { label: string; value: number | string }[] }) {
  return (
    <div className="bg-inset rounded-control px-4 py-3 space-y-2.5">
      <p className="text-[10px] font-bold text-ink-mute uppercase tracking-widest">{label}</p>
      {stats.map((s, i) => (
        <div key={i}>
          {i > 0 && <div className="w-full h-px bg-inset -mt-1 mb-2.5" />}
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-soft">{s.label}</span>
            <span className="font-bold text-ink tabular-nums">{s.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 200, h = 32, pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      <polyline points={pts.join(' ')} fill="none" stroke="#6D28D9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
