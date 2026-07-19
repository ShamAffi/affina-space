interface Props {
  onStart: () => void;   // → the program (first module)
}

// Shown once, right after a founder verifies her account for the first time (App.onVerified,
// firstLogin). A confident "here's everything that's now yours" slide → into the program.
// Returning users skip this and land on the dashboard.

const POINTS = [
  {
    title: 'A step-by-step launch program',
    desc: 'From your first idea to your first paying customer — and into growth. A guided path, not a pile of videos.',
    icon: (
      <>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </>
    ),
  },
  {
    title: 'Live & online events, worldwide',
    desc: 'Workshops and talks with world-class founders and operators — join from anywhere.',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  },
  {
    title: 'A global community of founders',
    desc: 'Women building alongside you — honest feedback, real introductions, zero gatekeeping.',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    title: 'Mentorship that never sleeps',
    desc: 'Real human mentors at the moments that matter, plus an AI mentor on call 24/7.',
    icon: (
      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
    ),
  },
  {
    title: 'Your founder dashboard',
    desc: 'One home to run your startup — track progress and get what-to-do-next recommendations built around your project.',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </>
    ),
  },
];

export default function WelcomeZone({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Decorative brand blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-pill bg-brand-100 opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[560px] h-[560px] rounded-pill bg-brand-50 opacity-70 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-pill bg-accent-50 opacity-30 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center px-5 sm:px-6 py-5">
        <span className="text-brand-700 font-bold text-lg tracking-tight">
          Affina<span className="text-ink">Space</span>
        </span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-5 py-6 sm:py-10 w-full">
        <div className="w-full max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand text-white text-sm font-semibold px-4 py-1.5 rounded-pill mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-pill bg-white/70" />
            You're starting the Founding Cohort
          </div>

          {/* Headline — main-page hero type (Archivo 900, -0.045em) at this screen's size */}
          <h1 className="font-display font-black text-4xl sm:text-5xl text-ink leading-[1.05] mb-4 animate-slide-up">
            Welcome to <span className="text-brand">Affina Space</span>
          </h1>
          <p className="text-lg sm:text-xl text-ink-soft leading-snug mb-2 animate-slide-up">
            The AI-native incubator for women turning ideas into real companies.
          </p>
          <p className="text-base text-ink-mute mb-8 animate-fade-in">
            No more figuring it out alone. Here's everything that's now yours:
          </p>

          {/* Value points */}
          <div className="flex flex-col gap-3 mb-9">
            {POINTS.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-4 bg-surface border border-hairline rounded-card p-4 shadow-sm animate-slide-up"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-control bg-brand-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    {p.icon}
                  </svg>
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[15px] font-bold text-ink leading-tight">{p.title}</p>
                  <p className="text-sm text-ink-soft leading-relaxed mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onStart}
            className="w-full bg-brand hover:bg-brand-700 active:scale-[0.98] text-white text-base font-semibold py-4 rounded-pill transition-all duration-150 shadow-sm"
          >
            Let's get started →
          </button>
          <p className="text-center text-xs text-ink-mute mt-3">Stop putting it off — take your first real steps today.</p>
        </div>
      </main>
    </div>
  );
}
