import { useState } from 'react';
import type { UserData, OnboardingScore } from '../types';
import { syncUserToDB } from '../store';
import { QUESTIONS } from '../data';
import OnboardingQuestion from './OnboardingQuestion';
import Analyzing from './Analyzing';
import RevealTeaser from './RevealTeaser';
import Register from './Register';
import ProjectName from './ProjectName';
import ProgramIntro from './ProgramIntro';
import Unlock from './Unlock';

type Step =
  | 'q_idea' | 'q_customer' | 'q_business_model' | 'q_stage' | 'q_goal'
  | 'analyzing' | 'reveal_teaser' | 'register' | 'project_name' | 'program_intro' | 'unlock';

const STEPS: Step[] = [
  'q_idea', 'q_customer', 'q_business_model', 'q_stage', 'q_goal',
  'analyzing', 'reveal_teaser', 'register', 'project_name', 'program_intro', 'unlock',
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
  onComplete: () => void;
}

export default function Onboarding({ userData, update, signIn, onComplete }: Props) {
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
    case 'analyzing':
      return (
        <Analyzing
          userData={userData}
          onDone={(r) => { setResult(r); update({ score: r.score }); advance(); }}
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

    case 'register':
      return (
        <Register
          score={userData.score}
          onRegistered={(name, email) => {
            const u = update({ name, email });
            syncUserToDB(u);
            setStep('project_name');
          }}
          onSignIn={signIn}
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
          onNext={(projectName) => {
            const u = update({ projectName });
            syncUserToDB(u);
            setStep('program_intro');
          }}
        />
      );

    case 'program_intro':
      return <ProgramIntro onStart={() => setStep('unlock')} />;

    case 'unlock':
      return <Unlock onDone={onComplete} />;

    default:
      return null;
  }
}
