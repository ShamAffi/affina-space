import { useState } from 'react';
import type { Screen, UserData } from './types';
import { loadUserData, updateUserData } from './store';
import { QUESTIONS } from './data';
import Welcome from './screens/Welcome';
import Question from './screens/Question';
import EmailCapture from './screens/EmailCapture';
import Analyzing from './screens/Analyzing';
import Score from './screens/Score';
import LMS from './screens/LMS';

const SCREEN_ORDER: Screen[] = [
  'welcome', 'q1', 'q2', 'q3', 'q4', 'email', 'analyzing', 'score', 'lms',
];

const Q_SCREENS: Screen[] = ['q1', 'q2', 'q3', 'q4'];

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [userData, setUserData] = useState<UserData>(loadUserData);

  function update(updates: Partial<UserData>) {
    const updated = updateUserData(updates);
    setUserData(updated);
  }

  function advance() {
    const idx = SCREEN_ORDER.indexOf(screen);
    if (idx < SCREEN_ORDER.length - 1) {
      setScreen(SCREEN_ORDER[idx + 1]);
    }
  }

  switch (screen) {
    case 'welcome':
      return <Welcome onStart={advance} />;

    case 'q1':
    case 'q2':
    case 'q3':
    case 'q4': {
      const qIdx = Q_SCREENS.indexOf(screen);
      const question = QUESTIONS[qIdx];
      const key = question.id as keyof UserData;
      return (
        <Question
          key={screen}
          question={question}
          questionNumber={qIdx + 1}
          totalQuestions={4}
          initialValue={(userData[key] as string) ?? ''}
          onNext={(value) => {
            update({ [question.id]: value });
            advance();
          }}
        />
      );
    }

    case 'email':
      return (
        <EmailCapture
          onNext={(email) => {
            update({ email });
            advance();
          }}
        />
      );

    case 'analyzing':
      return (
        <Analyzing
          onDone={() => {
            update({ score: 80 });
            advance();
          }}
        />
      );

    case 'score':
      return <Score score={userData.score} onStart={advance} />;

    case 'lms':
      return <LMS userData={userData} onUpdateUserData={update} />;
  }
}
