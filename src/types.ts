export type Screen =
  | 'welcome'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'email'
  | 'analyzing'
  | 'score'
  | 'lms';

export type UserData = {
  name: string;
  idea: string;
  customer: string;
  businessModel: string;
  stage: string;
  email: string;
  score: number;
  lessonInputs: Record<string, string>;
  completedLessons: string[];
};

export type LessonType = 'text' | 'input';

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  body: string;
  media?: { kind: 'image' | 'video'; url: string };
  inputPrompt?: string;
};

export type Module = {
  id: string;
  order: number;
  title: string;
  lessons: Lesson[];
};

export type Question = {
  id: string;
  label: string;
  type: 'text' | 'choice';
  options?: string[];
};

export type FeedbackVerdict = 'strong' | 'ok' | 'can_be_stronger';

export type AiFeedback = {
  score: number;
  verdict: FeedbackVerdict;
  good: string[];
  missing: string[];
  nextStep: string;
};

export type BrainEntry = {
  id: number;
  lessonId: string;
  lessonTitle: string;
  prompt: string;
  content: string;
  entryType: string;
  processedByAi: boolean;
  aiScore: number | null;
  aiFeedback: string | null;
  updatedAt: string;
};
