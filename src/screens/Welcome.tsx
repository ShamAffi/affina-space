interface Props {
  onStart: () => void;
  onSignIn: () => void;   // → /login (magic-link) — the only way to authenticate
}

export default function Welcome({ onStart, onSignIn }: Props) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-pill bg-brand-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-pill bg-brand-50 opacity-80 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-pill bg-brand-50 opacity-40 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center px-6 py-5">
        <span className="text-brand-700 font-bold text-xl tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium px-4 py-1.5 rounded-pill mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-pill bg-brand-600 animate-pulse" />
          AI-Native Venture Studio
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-ink leading-tight max-w-3xl mb-5 animate-slide-up">
          Let's build your<br />
          <span className="text-brand">startup plan.</span>
        </h1>

        <p className="text-base sm:text-lg text-ink-soft mb-10 animate-slide-up">
          5 questions &nbsp;·&nbsp; ~2 min &nbsp;·&nbsp; free personalized roadmap
        </p>

        <button
          onClick={onStart}
          className="bg-brand hover:bg-brand-700 active:scale-95 text-white text-lg font-semibold px-10 py-4 rounded-pill transition-all duration-150 animate-slide-up"
        >
          Start →
        </button>

        <button
          onClick={onSignIn}
          className="mt-4 text-sm text-ink-mute hover:text-brand transition-colors animate-fade-in"
        >
          I already have an account
        </button>

        {/* Social proof strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-ink-mute animate-fade-in">
          {['Real Experts', 'AI-powered', 'Global Community'].map((tag) => (
            <span key={tag} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-pill bg-brand-400" />
              {tag}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
