import { useState } from 'react';

interface Props {
  onNext: (email: string) => void;
}

export default function EmailCapture({ onNext }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function isValidEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onNext(email);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Decorative blob */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-purple-100 opacity-50 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center px-6 py-5 border-b border-gray-100">
        <span className="text-purple-700 font-bold text-xl tracking-tight">
          Affina<span className="text-gray-900">Space</span>
        </span>
      </header>

      {/* Progress */}
      <div className="w-full bg-gray-100 h-1">
        <div className="bg-purple-600 h-1 w-full" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Almost there!
          </h2>
          <p className="text-gray-500 text-base mb-10">
            Enter your email to receive a detailed report on your business idea
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="you@example.com"
              className={`w-full rounded-2xl border px-5 py-4 text-base text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-100 transition ${
                error
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 bg-gray-50 focus:border-purple-400 focus:bg-white'
              }`}
              autoFocus
            />
            {error && <p className="text-sm text-red-500 -mt-2 text-left">{error}</p>}

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-base font-semibold px-10 py-4 rounded-2xl transition-all duration-150"
            >
              Analyze My Idea →
            </button>
          </form>

          <p className="mt-5 text-xs text-gray-400">
            No spam. We respect your privacy.
          </p>
        </div>
      </main>
    </div>
  );
}
