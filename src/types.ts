export type Screen =
  | 'welcome'
  | 'q_idea'
  | 'q_customer'
  | 'q_business_model'
  | 'q_stage'
  | 'q_goal'
  | 'analyzing'
  | 'reveal_teaser'
  | 'register'
  | 'project_name'
  | 'program_intro'
  | 'unlock'
  | 'dashboard'
  | 'lms'
  | 'tasks'
  | 'task-detail'
  | 'pulse';

export type TrackName = 'Foundations' | 'Validation' | 'Building' | 'Launch' | 'Growth';

export type UserData = {
  name: string;
  projectName: string;
  idea: string;
  customer: string;
  businessModel: string;
  stage: string;
  goal: string;
  country: string;
  city: string;
  timezone: string;   // IANA tz (browser-captured) — drives 11:00-local lifecycle sends
  email: string;
  score: number;
  subscribed: boolean;   // paywall entitlement (SPEC_PAYWALL) — M5–M12 gated on this
  subscriptionStatus?: string | null;   // active | past_due | canceled | … (from /api/user)
  currentPeriodEnd?: string | null;      // ISO — "paid through / renews on" date
  cancelAtPeriodEnd?: boolean;           // renewal off; access runs to currentPeriodEnd
  verified?: boolean;    // audit F39 — real session vs just a typed email. undefined = legacy (treated as authed)
  phone?: string | null;         // SPEC_PHONE_CAPTURE — set = suppress the lead popups
  guideUrl?: string | null;      // runtime gate for the guide popup (from /api/user)
  // Founding-cohort paywall config (SPEC_COHORT_PAYWALL) — from /api/user, env-driven.
  calendlyUrl?: string | null;
  cohortSeatsTotal?: number;
  cohortSeatsLeft?: number;
  cohortAcceptedAt?: string | null;   // §3a post-call acceptance (from /api/user)
  seatHeldUntil?: string | null;
  onboardingReport?: OnboardingScore | null;   // funnel: persisted report (RevealTeaser / /report)
  lessonInputs: Record<string, string>;
  completedLessons: string[];
};

export type LessonType = 'text' | 'input' | 'structured';

// Program v2 — block taxonomy (§3.1). Default by legacy type: text→theory, input/structured→exercise.
export type BlockKind = 'theory' | 'exercise' | 'field' | 'premium' | 'mentor_session' | 'system';

export type FieldArtifactType =
  | 'text_template'
  | 'interview_log'
  | 'url_with_numbers'
  | 'screenshot'
  | 'outreach_log';

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  kind?: BlockKind;            // Program v2 (§3.1). Optional for now; falls back to blockKind(lesson).
  body: string;
  media?: { kind: 'image' | 'video'; url: string };
  inputPrompt?: string;
  inputPlaceholder?: string;
  inputMaxLength?: number;
  aiMode?: 'feedback' | 'compare' | 'north-star';
  fieldTask?: {               // only for kind: 'field'
    artifactType: FieldArtifactType;
    template?: string[];      // template field labels for text_template / url_with_numbers / outreach_log
    minEntries?: number;      // for interview_log
  };
  delegatable?: boolean;      // exercise: is the "Do it for me" button available (default true)
  delegateMode?: 'A' | 'B' | 'C'; // RULES_DONE_FOR_YOU §2.2: A=one draft (default) · B=2–3 variants to pick · C=analysis only, decision field NEVER pre-filled
  prefillFrom?: 'onboarding'; // exercise: compose initial draft from onboarding answers (M0 intake)
};

// Course = a whole track of modules under one name/color. Today the entire
// M0–M12 program is one course ('launching'); parallel courses slot in later.
export type CourseId = 'launching';

export type Module = {
  id: string;
  order: number;
  title: string;
  track: TrackName;                          // legacy per-module label (kept; no longer drives pills)
  courseId: CourseId;                        // pill color/name is course-level now
  lessons: Lesson[];
  paid?: boolean;                            // paywall flag (M5+ = true; NOT enforced in v2)
  mentorSessionAfter?: 'S1' | 'S2' | 'S3';   // M4→S1, M9→S2, M12→S3
};

// Legacy type → block kind fallback (used until every block declares `kind`).
export function blockKind(l: Lesson): BlockKind {
  if (l.kind) return l.kind;
  return l.type === 'text' ? 'theory' : 'exercise';
}

export type Question = {
  id: string;
  label: string;
  type: 'text' | 'choice';
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  options?: string[];
};

export type NorthStarValue = {
  key: string;
  label: string;
  unit: 'people' | '$' | '%' | 'count';
};

export type NorthStarCandidate = {
  key: string;
  label: string;
  unit: 'people' | '$' | '%' | 'count';
  why: string;
  howToMeasure: string;
  currentValue?: number;
};

export type NorthStarSuggestion = {
  candidates: NorthStarCandidate[];
  recommended: string;
};

// ─── Startup Snapshot (§3.4) — the curated "your startup on one page" doc ─────
export type SnapshotSection = { title: string; content: string };

export type StartupSnapshot = {
  version: number;
  generatedAt: string;          // ISO date
  source: string;               // 'Module 0' | 'Module N checkpoint' | 'check-in YYYY-MM-DD'
  sections: SnapshotSection[];  // fixed 10 sections per spec
};

export type SnapshotFact = { section: string; fact: string };

// ─── Market Research (m2l6, RULES_DONE_FOR_YOU §1) — test mode: model estimates only ──
export type ResearchSection = {
  title: string;
  confidence: 'high' | 'medium' | 'low';
  body: string;
  whatThisMeans: string;
  warning?: string | null;   // §1.5: contradicts-her-hypothesis callout
};

export type MarketResearchReport = {
  mode: 'test';
  generatedAt: string;
  headlineVerdict: string;
  keyNumbers: { label: string; value: string; logic: string }[];
  sections: ResearchSection[];   // 9 sections per §1.3
};

export type FeedbackVerdict = 'strong' | 'ok' | 'can_be_stronger';

export type AiFeedback = {
  score: number | null;   // null = NO-SCORE block (M0 intake: extraction + follow-ups only)
  verdict: FeedbackVerdict;
  good: string[];
  missing: string[];
  nextStep: string;
  realWorldTask: { title: string; instruction: string } | null;
};

export type TaskSource = 'mentor' | 'lesson' | 'advisor' | 'self' | 'system' | 'pulse' | 'program';
export type TaskStatus = 'todo' | 'submitted' | 'reviewed' | 'done';

// Interview Log (§3.3) — reusable across M3/M5/M11 field tasks. Up to 10 entries.
// Field keys stay who/pain/quotes/priceSignal/verdict (no migration); the transcript
// spec's mainPain/keyQuotes names map onto pain/quotes.
export type InterviewLogEntry = {
  who: string;          // name / role / segment
  pain: string;         // main pain + how they solve it today
  quotes: string;       // key quotes / insights
  priceSignal: string;  // what they pay now / reaction to price (active from M5)
  verdict: string;      // confirms / contradicts hypothesis (+ what changes)
  // "Add Transcript" (SPEC_INTERVIEW_LOG_TRANSCRIPT §3) — present only when the
  // entry was filled from a pasted transcript. Raw source kept for provenance +
  // the fabrication-protocol cross-check; NOT a Delegate answer (§6).
  rawTranscript?: string;
  aiExtracted?: {
    fields: string[];         // field keys the AI populated
    lowConfidence: string[];  // of those, the ones flagged amber ("AI wasn't sure")
  };
};

// Structured field-task submissions (§3.2 submissionData jsonb).
export type TaskSubmissionData = {
  interviewLog?: InterviewLogEntry[];
  templateFields?: Record<string, string>;
  url?: string;
};

export type TaskReview = {
  score: number;
  verdict: 'strong' | 'good' | 'needs_work';
  highlights: string[];
  improvements: string[];
  nextStep: string;
  // §4b Debrief — field-mission analysis rendered on top of the review
  debrief?: {
    meaning: string;   // what what-you-heard actually means
    adjust: string;    // what to correct in the approach/hypothesis
  } | null;
};

export type Task = {
  id: number;
  userId: number;
  source: TaskSource;
  sourceRef: string | null;
  title: string;
  instruction: string;
  status: TaskStatus;
  priority: number;
  submissionText: string | null;
  submissionFiles: string[] | null;
  submissionData: TaskSubmissionData | null;  // structured field-task data (§3.2)
  briefing: string | null;       // §4b AI Mission Briefing (generated once, cached on the task)
  aiReview: string | null;       // JSON-serialised TaskReview
  linkedEntryType: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompareCandidate = {
  label: string;
  painIntensity: number;
  reachability: number;
  abilityToPay: number;
  wordOfMouth: number;
  total: number;
};

export type CompareResult = {
  candidates: CompareCandidate[];
  recommendation: string;
  runnerUp: string;
  nextStep: string;
};

export type OnboardingScore = {
  score: number;
  summary: string;
  percentileAheadOf: number;
  firstFocus: string;
  // ── v2 "Founder Readiness Snapshot" (SPEC_REPORT_V2). Optional so v1 stored reports still
  // type-check and RevealTeaser can render-guard back to the v1 layout. ──
  level?: { n: number; name: string; why: string; unlocksNext: string };
  dimensions?: { key: string; score: number; read: string }[];
  strengths?: { dimension: string; text: string }[];
  risks?: { text: string; whyNow: string }[];
  roadmap?: { horizon: string; title: string; body: string }[];
  // ── v1 fields (kept for back-compat with reports stored before the v2 upgrade) ──
  steps?: { title: string; body: string }[];
  strength?: string;
  threat?: string;
};

export type Phase = 'launch' | 'growth';

export type LastReadinessGain = { delta: number; sourceLabel: string };

// §7 Launch Readiness v2 breakdown
export type ReadinessBreakdown = {
  seed: number;
  lessons: number;
  exercises: number;
  field: number;
  checkpoints: number;
  traction: number;
};

// §6.5 mentor sessions state — completion is set manually in v2
export type MentorSessionId = 'S1' | 'S2' | 'S3';
export type MentorSessionsState = Partial<Record<MentorSessionId, { completed?: boolean; booked?: boolean; seen?: boolean }>>;

export type LaunchProgress = {
  phase: 'launch';
  launch: {
    readiness: number;
    seed: number;
    breakdown: ReadinessBreakdown | null;
  };
  completedLessons: string[];
  lessonInputs: Record<string, string>;
  momentumCard?: MomentumCard | null;
  streak?: number;
  lastCheckInAt?: string | null;
  lastReadinessGain?: LastReadinessGain | null;
  northStar?: NorthStarValue | null;
  mentorSessions?: MentorSessionsState | null;
  latestCheckIn?: LatestCheckIn | null;         // Traction widget business source
  lastBusinessUpdateAt?: string | null;         // most recent real business update (ISO); null = never
  subscribed?: boolean;                         // paywall entitlement
};

export type GrowthProgress = {
  phase: 'growth';
  growth: {
    tier: number;
    tierName: string;
    xp: number;
    progressToNext: number;
    nextTierName: string | null;
  };
  completedLessons: string[];
  lessonInputs: Record<string, string>;
  momentumCard?: MomentumCard | null;
  streak?: number;
  lastCheckInAt?: string | null;
  lastReadinessGain?: LastReadinessGain | null;
  northStar?: NorthStarValue | null;
  mentorSessions?: MentorSessionsState | null;
  latestCheckIn?: LatestCheckIn | null;         // Traction widget business source
  lastBusinessUpdateAt?: string | null;         // most recent real business update (ISO); null = never
  subscribed?: boolean;                         // paywall entitlement
};

export type ProgressResponse = LaunchProgress | GrowthProgress;

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

export type CheckInKeyResult = {
  type: 'win' | 'setback' | 'milestone';
  text: string;
  metric?: string;
};

export type CheckInMetric = {
  name: string;
  value: number;
  delta: number;
};

export type CheckInActivity = {
  key: string;
  label: string;
  count: number;
};

// ─── Momentum card (AI-composed) ──────────────────────────────────────────────
export type MomentumMood = 'building' | 'progressing' | 'traction' | 'recovering' | 'quiet';

export type MomentumStat = { label: string; value: number | string };

export type MomentumBlock =
  | { type: 'headline_metric'; label: string; value: number; delta: number; trend?: number[]; sentiment?: string }
  | { type: 'milestone'; text: string; period: '3w' | 'all'; value?: number }
  | { type: 'trajectory'; text: string; trend?: number[] }
  | { type: 'this_week'; items: { kind: 'win' | 'learning' | 'setback'; text: string }[] }
  | { type: 'cumulative'; stats: MomentumStat[] }
  | { type: 'learning_progress'; stats: MomentumStat[] }
  | { type: 'streak'; weeks: number; text: string }
  | { type: 'encouragement'; text: string }
  | { type: 'nudge'; text: string };

export type MomentumCard = {
  mood: MomentumMood;
  blocks: MomentumBlock[];
};

// Deterministic Business-block source for the Traction widget (SPEC_TRACTION_WIDGET).
export type LatestCheckIn = {
  weekOf: string;
  metrics: CheckInMetric[];
  keyResults: CheckInKeyResult[];
};

export type CheckIn = {
  id: number;
  userId: number;
  weekOf: string;
  headline: string | null;
  keyResults: CheckInKeyResult[] | null;
  metrics: CheckInMetric[] | null;
  activity: CheckInActivity[] | null;
  sentiment: 'energized' | 'steady' | 'struggling' | null;
  mentorNote: string | null;
  createdAt: string;
};

export type CheckInDraft = {
  headline: string;
  keyResults: CheckInKeyResult[];
  metrics: CheckInMetric[];
  sentiment: 'energized' | 'steady' | 'struggling';
  mentorNote: string;
  tasks: { title: string; instruction: string; priority: number }[];
  activity?: CheckInActivity[];
  momentumCard?: MomentumCard | null;
  snapshotFacts?: SnapshotFact[];  // §3.4(b) — facts from the check-in merged into the Snapshot
};
