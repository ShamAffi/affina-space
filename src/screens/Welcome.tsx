interface Props {
  onStart: () => void;
}

export default function Welcome({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 w-[600px] h-[600px] rounded-full bg-purple-50 opacity-80 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-50 opacity-40 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center px-6 py-5">
        <span className="text-purple-700 font-bold text-xl tracking-tight">
          Affina<span className="text-gray-900">Space</span>
        </span>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          AI-Native Venture Studio
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-3xl mb-6 animate-slide-up">
          Launch Your Consumer<br />
          <span className="text-purple-600">Startup</span> with Confidence
        </h1>

        <p className="text-lg sm:text-xl text-purple-600 font-semibold mb-3 animate-slide-up">
          The first AI-native venture studio for female founders
        </p>

        <p className="text-base sm:text-lg text-gray-500 mb-12 animate-slide-up">
          From Idea to Real Launch in 12 steps
        </p>

        <button
          onClick={onStart}
          className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-lg font-semibold px-10 py-4 rounded-2xl shadow-lg shadow-purple-200 transition-all duration-150 animate-slide-up"
        >
          Try Now for Free →
        </button>

        {/* Social proof strip */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 animate-fade-in">
          {['Real Experts', 'AI-powered', 'Global Community'].map((tag) => (
            <span key={tag} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              {tag}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
