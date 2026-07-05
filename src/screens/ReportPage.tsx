import { useState, useEffect } from 'react';
import type { UserData, OnboardingScore } from '../types';
import RevealTeaser from './RevealTeaser';

interface Props {
  userData: UserData;
  onContinue: () => void;
}

// Interactive report page (SPEC_ONBOARDING_FUNNEL §3) — where the recovery emails (#12 +
// finish nudges) land after a magic link verifies. Renders the persisted report and a
// "continue into the program" CTA. Reuses RevealTeaser (no new report artifact).
export default function ReportPage({ userData, onContinue }: Props) {
  const [report, setReport] = useState<OnboardingScore | null>(userData.onboardingReport ?? null);
  const [loading, setLoading] = useState(!userData.onboardingReport);

  // signIn usually preloads onboardingReport; fetch it directly if we arrived without it.
  useEffect(() => {
    if (report || !userData.email) { setLoading(false); return; }
    let alive = true;
    fetch('/api/user') // identity from the session cookie
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d?.onboardingReport) setReport(d.onboardingReport as OnboardingScore); })
      .catch(() => { /* fall back to the score-only view below */ })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userData.email]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-5 text-center">
        <span className="text-brand-700 font-bold text-xl tracking-tight">Affina<span className="text-ink">Space</span></span>
        <div className="mt-8 w-10 h-10 rounded-pill bg-brand animate-orb-pulse" />
        <p className="mt-4 text-ink-soft text-sm">Loading your report…</p>
      </div>
    );
  }

  const result: OnboardingScore = report ?? {
    score: userData.score || 60,
    percentileAheadOf: 60,
    strength: '',
    threat: '',
    firstFocus: '',
    summary: '',
    steps: [],
  };

  return (
    <RevealTeaser
      projectName={userData.projectName}
      goal={userData.goal}
      result={result}
      onRegister={onContinue}
      ctaLabel="Continue into the program →"
    />
  );
}
