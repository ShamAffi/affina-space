import { useState } from 'react';
import type { UserData, OnboardingScore } from '../types';
import { syncUserToDB, captureEmail } from '../store';
import { QUESTIONS } from '../data';
import OnboardingQuestion from './OnboardingQuestion';
import OnboardingLocation from './OnboardingLocation';
import EmailCapture from './EmailCapture';
import Analyzing from './Analyzing';
import RevealTeaser from './RevealTeaser';
import OnboardingName from './OnboardingName';
import ProjectName from './ProjectName';
import ConfirmEmail from './ConfirmEmail';

// New funnel order (SPEC_ONBOARDING_FUNNEL): intake+location → EMAIL CAPTURE (before the
// report, creates the pending user) → analyzing → REPORT → name → project name → CONFIRM
// EMAIL (magic link). Verifying the link (api/auth verify-link) is what enters the program.
type Step =
  | 'q_idea' | 'q_customer' | 'q_business_model' | 'q_stage' | 'q_goal' | 'q_location'
  | 'email_capture' | 'analyzing' | 'reveal_teaser' | 'name' | 'project_name' | 'confirm_email';

const STEPS: Step[] = [
  'q_idea', 'q_customer', 'q_business_model', 'q_stage', 'q_goal', 'q_location',
  'email_capture', 'analyzing', 'reveal_teaser', 'name', 'project_name', 'confirm_email',
];

const Q_CONFIG = [
  { step: 'q_idea' as Step,           qIdx: 0, field: 'idea' },
  { step: 'q_customer' as Step,       qIdx: 1, field: 'customer' },
  { step: 'q_business_model' as Step, qIdx: 2, field: 'businessModel' },
  { step: 'q_stage' as Step,          qIdx: 3, field: 'stage' },
  { step: 'q_goal' as Step,           qIdx: 4, field: 'goal' },
];

interface Props {
  userData: UserData;
  update: (updates: Partial<UserData>) => UserData;
  signIn: (email: string) => void;
}

export default function Onboarding({ userData, update, signIn }: Props) {
  const [step, setStep] = useState<Step>('q_idea');
  const [result, setResult] = useState<OnboardingScore | null>(null);

  function advance() {
    const idx = STEPS.indexOf(step);
    if (idx >= 0 && idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  const qConfig = Q_CONFIG.find((c) => c.step === step);
  if (qConfig) {
    const question = QUESTIONS[qConfig.qIdx];
    return (
      <OnboardingQuestion
        key={step}
        question={question}
        questionIndex={qConfig.qIdx}
        totalQuestions={5}
        initialValue={(userData[qConfig.field as keyof UserData] as string) ?? ''}
        onNext={(value) => { update({ [qConfig.field]: value }); advance(); }}
      />
    );
  }

  switch (step) {
    case 'q_location':
      return (
        <OnboardingLocation
          initialCountry={userData.country}
          initialCity={userData.city}
          onNext={(country, city, timezone) => { update({ country, city, timezone }); advance(); }}
        />
      );

    // Step 2 — email BEFORE the report: create the pending user + emailCapturedAt (starts
    // the finish-sequence clock). Blocks only on a verified account (§2a) → offer sign-in.
    case 'email_capture':
      return (
        <EmailCapture
          initialEmail={userData.email}
          onSubmit={async (email) => {
            const u = update({ email });
            const r = await captureEmail(u);
            if (!r.blocked) advance();
            return r;
          }}
          onSignIn={signIn}
        />
      );

    case 'analyzing':
      return (
        <Analyzing
          userData={userData}
          onDone={(r) => {
            // Persist the report on the pending user (§3) so the day-0 email + /report render it.
            const u = update({ score: r.score, onboardingReport: r });
            syncUserToDB(u);
            setResult(r);
            advance();
          }}
        />
      );

    case 'reveal_teaser':
      return (
        <RevealTeaser
          projectName={userData.projectName}
          goal={userData.goal}
          result={result ?? {
            score: userData.score,
            percentileAheadOf: 60,
            strength: '',
            threat: '',
            firstFocus: '',
            summary: '',
            steps: [],
          }}
          onRegister={advance}
        />
      );

    case 'name':
      return (
        <OnboardingName
          initialValue={userData.name}
          onNext={(name) => { const u = update({ name }); syncUserToDB(u); advance(); }}
        />
      );

    case 'project_name':
      return (
        <ProjectName
          idea={userData.idea}
          customer={userData.customer}
          businessModel={userData.businessModel}
          stage={userData.stage}
          initialValue={userData.projectName}
          onNext={(projectName) => { const u = update({ projectName }); syncUserToDB(u); advance(); }}
        />
      );

    // Step 6 — confirm email → magic link. Change-email relocates the pending row (§2a).
    // Clicking the link (verify-link) sets verifiedAt and lands in the program.
    case 'confirm_email':
      return (
        <ConfirmEmail
          email={userData.email}
          onChangeEmail={async (newEmail) => {
            const prev = userData.email;
            const u = update({ email: newEmail });
            const r = await captureEmail(u, prev);
            if (r.blocked) update({ email: prev }); // revert local email if the new one is taken
            return r;
          }}
          onSendLink={async (email) => {
            try {
              const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // happy path: verifying lands straight in the program (welcome zone), as before
                body: JSON.stringify({ action: 'request-link', email, next: '/learning/launch/m0l1' }),
              });
              return res.ok;
            } catch {
              return false;
            }
          }}
        />
      );

    default:
      return null;
  }
}
