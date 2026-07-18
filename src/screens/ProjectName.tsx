import { useState } from 'react';

const MAX_ATTEMPTS = 3;

interface Props {
  idea: string;
  customer: string;
  businessModel: string;
  stage: string;
  initialValue: string;
  onNext: (projectName: string) => void;
}

export default function ProjectName({ idea, customer, businessModel, stage, initialValue, onNext }: Props) {
  const [value, setValue] = useState(initialValue);
  const [generating, setGenerating] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [tried, setTried] = useState<string[]>([]);

  const exhausted = attempts >= MAX_ATTEMPTS;

  const genLabel = generating
    ? 'Generating…'
    : attempts === 0
      ? '✨ Generate a name with AI'
      : exhausted
        ? "That's all 3 — pick a favorite or edit"
        : `🔄 Try another (${attempts + 1} of ${MAX_ATTEMPTS})`;

  async function handleGenerate() {
    if (exhausted || generating) return;
    setGenerating(true);
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'generate-name', idea, customer, businessModel, stage, avoid: tried }),
      });
      const data = await r.json();
      if (data.name) {
        setValue(data.name);
        setTried((t) => [...t, data.name]);
      }
      setAttempts((a) => a + 1);
    } catch {
      // silent — user can type a name manually
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-pill bg-brand-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-pill bg-brand-50 opacity-60 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center px-5 py-4">
        <span className="text-brand-700 font-bold text-lg tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
        <span className="ml-auto text-xs text-ink-mute font-medium">Last step</span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3">Name your startup</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-2 leading-snug">
            What's your project called?
          </h2>
          <p className="text-ink-mute text-sm mb-7">
            It'll appear across your dashboard. Type one, or let AI suggest from your idea.
          </p>

          <input
            type="text"
            value={value}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onNext(value.trim()); }}
            placeholder="e.g. Affina, Notion, Figma…"
            maxLength={60}
            className="w-full text-base border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 rounded-card px-5 py-4 outline-none placeholder-ink-mute transition"
          />

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={generating || exhausted}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-pill border transition-all duration-150 ${
                exhausted
                  ? 'bg-inset border-hairline text-ink-mute cursor-default'
                  : 'bg-brand-50 hover:bg-brand-100 active:bg-brand-200 border-brand-200 text-brand disabled:opacity-60 disabled:cursor-not-allowed'
              }`}
            >
              {genLabel}
            </button>
          </div>

          <button
            onClick={() => { if (value.trim()) onNext(value.trim()); }}
            disabled={!value.trim()}
            className="mt-8 w-full bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-base font-semibold py-4 rounded-pill transition-all duration-150"
          >
            Continue →
          </button>
          <p className="mt-3 text-center text-xs text-ink-mute">
            Don't overthink it — you can change the name later in Settings.
          </p>
        </div>
      </main>

      {generating && (
        <div className="fixed inset-0 z-50 bg-canvas/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6 animate-fade-in">
          <div className="w-20 h-20 rounded-pill bg-brand animate-orb-pulse" />
          <p className="text-sm font-semibold text-ink-soft tracking-wide">
            Generating the perfect name…
          </p>
        </div>
      )}
    </div>
  );
}
