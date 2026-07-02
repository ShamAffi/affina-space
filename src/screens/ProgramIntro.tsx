interface Props {
  onStart: () => void;
}

const PILLARS = [
  { icon: '🎓', title: 'Proven methodology', body: 'The best of top business schools and accelerators' },
  { icon: '🤖', title: 'AI mentors', body: 'Personal, honest feedback at every step' },
  { icon: '✅', title: 'Practical assignments', body: 'Real progress — not just theory' },
];

export default function ProgramIntro({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-pill bg-brand-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[500px] h-[500px] rounded-pill bg-brand-50 opacity-70 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center px-5 py-4">
        <span className="text-brand-700 font-bold text-lg tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-10 text-center">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-pill mb-7">
            <span className="w-2 h-2 rounded-pill bg-brand-600 animate-pulse" />
            Welcome to your program
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-ink leading-tight mb-4">
            A hybrid launch program<br />for <span className="text-brand">female founders</span>
          </h1>

          <p className="text-base text-ink-soft leading-relaxed max-w-md mx-auto mb-9">
            It blends the methodology of top business schools and accelerators with AI mentors and
            hands-on assignments that guide you — step by step — from idea to a real launch.
          </p>

          <div className="flex flex-col gap-3 mb-9 text-left">
            {PILLARS.map((p) => (
              <div key={p.title} className="flex items-center gap-3 bg-inset border border-hairline rounded-card px-4 py-3">
                <span className="text-2xl flex-shrink-0">{p.icon}</span>
                <div>
                  <p className="text-sm font-bold text-ink leading-tight">{p.title}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{p.body}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onStart}
            className="w-full bg-brand hover:bg-brand-700 active:scale-95 text-white text-lg font-semibold py-4 rounded-pill transition-all duration-150"
          >
            Start →
          </button>
        </div>
      </main>
    </div>
  );
}
