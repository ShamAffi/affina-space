import { useState } from 'react';
import { COUNTRIES, flag } from '../lib/countries';

interface Props {
  initialCountry: string;
  initialCity: string;
  onNext: (country: string, city: string, timezone: string) => void;
}

// Onboarding location step. Country/city are stored for personalization (country
// business specifics + networking/investment). The browser's IANA timezone is
// captured silently on submit — it drives 11:00-local lifecycle sends (more accurate
// than guessing a timezone from a free-text country).
export default function OnboardingLocation({ initialCountry, initialCity, onNext }: Props) {
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const valid = country.trim().length >= 2;

  function submit() {
    if (!valid) return;
    let timezone = '';
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* leave empty */ }
    onNext(country.trim(), city.trim(), timezone);
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-ink text-center mb-2">Where are you based?</h1>
        <p className="text-sm text-ink-soft text-center mb-6">Your country and city.</p>
        <div className="flex flex-col gap-3">
          <select
            autoFocus
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Country"
            className={`w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base bg-surface transition ${country ? 'text-ink' : 'text-ink-mute'}`}
          >
            <option value="">Select your country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.name} className="text-ink">{flag(c.iso)}  {c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="City (you can type it in)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) submit(); }}
            className="w-full rounded-card border-2 border-hairline focus:border-brand-400 focus:ring-4 focus:ring-brand-100 outline-none px-5 py-4 text-base text-ink placeholder-ink-mute transition"
          />
        </div>
        <button
          onClick={submit}
          disabled={!valid}
          className="w-full mt-4 bg-brand hover:bg-brand-700 active:scale-95 disabled:opacity-40 text-white text-base font-semibold py-4 rounded-pill transition"
        >
          Continue →
        </button>
        <p className="text-xs text-ink-mute mt-4 leading-relaxed text-center">
          This helps us tailor recommendations to your country's business landscape, and surface networking and investment opportunities near you.
        </p>
      </div>
    </div>
  );
}
