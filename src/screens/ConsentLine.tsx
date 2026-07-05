// Consent line (SPEC_ONBOARDING_FUNNEL §5) — shown at email-capture AND confirm-email.
// Consent is implied by continuing (no checkbox). Privacy/Terms live on the marketing
// site as EXTERNAL pages (nothing in-app) and open in a new tab.
const PRIVACY_URL = 'https://affina.space/privacy';
const TERMS_URL = 'https://affina.space/terms';

export default function ConsentLine({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-ink-mute leading-relaxed text-center ${className}`}>
      By continuing, you agree to our{' '}
      <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Privacy Policy</a>
      {' '}and{' '}
      <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Terms of Use</a>.
    </p>
  );
}
