import { useEffect, useState } from 'react';

const PHRASES = ['Idea analysis', 'Market research', 'Calculating'];

interface Props {
  onDone: () => void;
}

export default function Analyzing({ onDone }: Props) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [fading, setFading] = useState(true);

  useEffect(() => {
    // Cycle phrases
    const interval = setInterval(() => {
      setFading(false);
      setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
        setFading(true);
      }, 200);
    }, 900);

    // Auto-advance after ~3 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      onDone();
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onDone]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      {/* Orb */}
      <div
        className="w-28 h-28 rounded-full animate-orb-pulse"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, #c084fc, #9333ea 60%, #7e22ce)',
        }}
      />

      {/* Cycling phrase */}
      <p
        className="mt-10 text-gray-600 text-lg font-medium transition-opacity duration-200"
        style={{ opacity: fading ? 1 : 0 }}
      >
        {PHRASES[phraseIdx]}
        <span className="inline-flex gap-0.5 ml-1">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
        </span>
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {PHRASES.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === phraseIdx ? 'bg-purple-600 scale-125' : 'bg-purple-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
