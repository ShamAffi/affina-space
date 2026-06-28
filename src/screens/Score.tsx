interface Step {
  title: string;
  body: string;
}

interface Props {
  score: number;
  summary: string;
  steps: Step[];
  onStart: () => void;
}

const ICONS = ['💡', '🎯', '✨'];

export default function Score({ score, summary, steps, onStart }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-purple-100 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-50 opacity-60 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center px-6 py-5 border-b border-gray-100">
        <span className="text-purple-700 font-bold text-xl tracking-tight">
          Affina<span className="text-gray-900">Space</span>
        </span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl animate-slide-up">
          {/* Score card */}
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-purple-500 uppercase tracking-widest mb-4">
              AI Analysis Complete
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
              Your business idea score
            </h1>

            <div className="inline-flex flex-col items-center bg-purple-50 border-2 border-purple-100 rounded-3xl px-12 py-8 mb-8">
              <div className="flex items-end gap-2">
                <span className="text-7xl sm:text-8xl font-extrabold text-purple-600 leading-none tabular-nums">
                  {score}
                </span>
                <span className="text-3xl font-semibold text-purple-300 mb-2">/ 100</span>
              </div>
              <div className="w-40 h-2 bg-purple-100 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
              {summary}
            </p>
          </div>

          {/* Improvement steps */}
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            3 main steps you need to improve
          </h2>
          <div className="flex flex-col gap-4 mb-14">
            {steps.map((step, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex gap-4 hover:border-purple-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl">
                  {ICONS[i]}
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">
                    Step {i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900 mb-1.5 mt-0.5">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-8 sm:p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
              Sounds complex?
            </h2>
            <p className="text-purple-100 text-base sm:text-lg mb-6 leading-relaxed">
              Don't worry — start the Affina Space incubation program for female founders for
              free and launch your business with confidence!
            </p>
            <p className="text-purple-300 font-semibold text-sm mb-8 tracking-wide">
              Real Experts · AI-powered · Global Community
            </p>
            <button
              onClick={onStart}
              className="bg-white text-purple-700 hover:bg-purple-50 active:scale-95 font-bold text-base sm:text-lg px-10 py-4 rounded-2xl transition-all duration-150 shadow-lg"
            >
              Start Now →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
