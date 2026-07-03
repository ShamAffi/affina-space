import type { MomentumCard as MomentumCardData, MomentumBlock, MomentumMood, NorthStarValue } from '../types';

interface Props {
  card: MomentumCardData | null;
  northStar?: NorthStarValue | null;
  lessonsDone: number;
  exercisesScored: number;
  modulesCompleted: number;
  streak: number;
  lastCheckInAt?: string | null;
  onGoToPulse: () => void;
}

// Monday-anchored ISO week key (mirrors the backend getWeekOf).
function weekOf(d: Date): string {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day + (day === 0 ? -6 : 1));
  return x.toISOString().split('T')[0];
}

const MOOD_ACCENT: Record<MomentumMood, string> = {
  building:    'border-t-brand-400',
  progressing: 'border-t-brand-400',
  traction:    'border-t-accent-400',
  recovering:  'border-t-amber-400',
  quiet:       'border-t-gray-300',
};

const KIND_ICON: Record<string, string> = { win: '▲', learning: '✎', setback: '△' };
const KIND_COLOR: Record<string, string> = { win: 'text-accent-600', learning: 'text-brand-600', setback: 'text-amber-500' };

export default function MomentumCard({ card, northStar, lessonsDone, exercisesScored, modulesCompleted, streak, lastCheckInAt, onGoToPulse }: Props) {
  // A new week began since the last check-in → streak at risk. Pure client-side, no AI.
  const streakAtRisk = !!card && streak > 0 && !!lastCheckInAt && weekOf(new Date(lastCheckInAt)) !== weekOf(new Date());
  // Resolve what to show: AI card → cold-start invite → client-built learning tier.
  let mood: MomentumMood = 'building';
  let blocks: MomentumBlock[] = [];
  let invite = false;

  if (card && Array.isArray(card.blocks) && card.blocks.length > 0) {
    mood = card.mood;
    blocks = card.blocks;
  } else if (lessonsDone === 0) {
    invite = true;
  } else {
    blocks = [
      {
        type: 'learning_progress',
        stats: [
          { label: 'Lessons done', value: lessonsDone },
          { label: 'Exercises scored', value: exercisesScored },
          ...(modulesCompleted > 0 ? [{ label: 'Modules', value: modulesCompleted }] : []),
        ],
      },
      ...(streak > 0
        ? [{ type: 'streak', weeks: streak, text: `${streak} week${streak > 1 ? 's' : ''} of showing up` } as MomentumBlock]
        : []),
    ];
  }

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
        {streakAtRisk && (
          <div className="bg-amber-50 border border-amber-100 rounded-control px-4 py-3">
            <p className="text-sm text-amber-700 leading-snug">
              🔥 New week — keep your {streak}-week streak alive with a quick check-in.
            </p>
          </div>
        )}
        {invite ? (
          <div className="bg-brand-50 border border-brand-100 rounded-control px-4 py-4">
            <p className="text-sm font-semibold text-brand-800 leading-snug mb-1">Your momentum starts here</p>
            <p className="text-xs text-brand-600 leading-relaxed">
              Each week, tell me what you did — wins, numbers, what you learned. I'll track your progress from day one.
            </p>
            <p className="mt-2 text-[10px] font-bold text-brand-400 uppercase tracking-widest">Week 1</p>
          </div>
        ) : (
          blocks.map((block, i) => <Block key={i} block={block} />)
        )}
      </div>

      <button
        onClick={onGoToPulse}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-brand hover:bg-brand-700 active:scale-95 text-white text-sm font-semibold px-5 py-3 rounded-pill transition-all duration-150"
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
      <polyline points={pts.join(' ')} fill="none" stroke="#7150EA" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
