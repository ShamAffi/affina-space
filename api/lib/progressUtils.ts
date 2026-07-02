// ─── Launch phase — Brain layer weights ──────────────────────────────────────
export const LAUNCH_LAYER_WEIGHTS: Record<string, number> = {
  value_proposition:    2,
  founder_fit:          1,
  competitive_landscape:1,
  positioning:          1,
  persona_candidates:   1,
  persona:              2,
  use_case:             1,
  product_spec:         1,
  quantified_value:     2,
  core_advantage:       1,
  acquisition_path:     1,
  decision_map:         1,
  business_model:       1,
  pricing:              1,
  unit_economics:       1,
  key_assumptions:      1,
  demand_test:          3,
  mvbp_definition:      1,
  traction_metrics:     3,
  north_star:           2,
  roadmap:              1,
  pitch_narrative:      1,
};

// Human-readable, lowercase layer labels for the "+Δ from your <step>" readiness line.
export const LAYER_LABELS: Record<string, string> = {
  // Program v2 entry types (SPEC §3.5)
  founder_intake: 'project intake',
  imported_assets: 'imported assets',
  mission_vision: 'mission & vision',
  value_proposition: 'value proposition',
  founder_fit: 'founder fit',
  competitive_landscape: 'market research',
  positioning: 'positioning',
  competitor_journey: 'competitor walkthrough',
  persona_candidates: 'persona candidates',
  persona: 'target persona',
  interview_script: 'interview script',
  interview_log: 'interviews',
  problem_solution_check: 'problem–solution check',
  use_case: 'use case',
  product_spec: 'product spec',
  value_advantage: 'quantified value & advantage',
  micro_commitment: 'micro-commitment',
  business_model: 'business model',
  unit_economics: 'unit economics',
  north_star: 'North Star',
  key_assumptions: 'key assumptions',
  mvbp_definition: 'MVP definition',
  site_structure: 'site structure',
  site_launch: 'site launch',
  acquisition_path: 'acquisition path',
  decision_map: 'decision map',
  channel_shortlist: 'channel shortlist',
  acquisition_results: 'acquisition results',
  sales_script: 'sales script',
  pipeline: 'sales pipeline',
  first_sale: 'first sale',
  traction_metrics: 'traction metrics',
  progress_report: 'progress report',
  non_buyer_insights: 'non-buyer insights',
  founder_audit: 'founder audit',
  delegation_matrix: 'delegation matrix',
  delegation_result: 'delegation win',
  pivot_scale_decision: 'pivot/scale decision',
  roadmap: 'roadmap',
  investor_targets: 'investor targets',
  outreach_log: 'investor outreach',
  pitch_narrative: 'pitch narrative',
  // Legacy v1 types (kept for existing brain entries)
  quantified_value: 'quantified value',
  core_advantage: 'core advantage',
  pricing: 'pricing',
  demand_test: 'demand test',
};

export const LAUNCH_REQUIRED_LAYERS = [
  'value_proposition',
  'persona',
  'demand_test',
  'traction_metrics',
  'north_star',
];

export const GROWTH_TIERS = [
  { name: 'Launched',           xpThreshold: 0     },
  { name: 'Traction',           xpThreshold: 500   },
  { name: 'Product-Market Fit', xpThreshold: 1500  },
  { name: 'Scaling',            xpThreshold: 5000  },
  { name: 'Category Leader',    xpThreshold: 15000 },
] as const;

export const GROWTH_XP = {
  LESSON_COMPLETE:  5,
  MODULE_BONUS:     20,
  SOFT_MILESTONE:   100,
  PAYING_CUSTOMER:  600,
  MRR_MILESTONE:    800,
  FUNDING_ROUND:    2000,
  METRIC_GROWTH:    50,
} as const;

export const GROWTH_SEED_XP = Math.round(GROWTH_TIERS[1].xpThreshold * 0.2); // 100

type BrainRow = { entryType: string; aiScore: number | null };

export type LaunchReadiness = {
  readiness: number;
  seed: number;
  weakestLayer: string | null;
  unmetRequired: string[];
};

export type GrowthState = {
  tier: number;
  tierName: string;
  xp: number;
  progressToNext: number;
  nextTierName: string | null;
};

// Onboarding idea score gives an early head-start: score / 10 → 0–10 points
// (e.g. 62/100 → +6). Folded into the same 0–90 readiness scale as course work.
export const ONBOARDING_SEED_MAX = 10;

export function onboardingSeed(onboardingScore: number): number {
  return Math.min(ONBOARDING_SEED_MAX, Math.max(0, Math.round(onboardingScore / 10)));
}

// ─── Launch Readiness v2 (SPEC §7) ───────────────────────────────────────────
// readiness = min(100, seed + lessons + exercises + field + checkpoints + traction)
// Real-world actions weigh several times more than lessons; 100 ≈ launch-ready.

// Field-mission points by lessonId (§7 table). Unlisted done missions get the default.
export const FIELD_POINTS: Record<string, number> = {
  m2l7: 2,   // competitor journey
  m3l7: 3,   // 1–2 warm interviews
  m4l9: 4,   // micro-commitment
  m5l7: 5,   // 5–10 WTP interviews
  m6l8: 6,   // site/MVP launch
  m7l8: 4,   // channel results
  m8l6: 8,   // first paid deal — the program's North Star
  m9l6: 3,   // non-buyer interviews
  m11l6: 4,  // verification sprint
  m12l6: 3,  // investor outreach
};
const FIELD_DEFAULT = 2;
const CAP = { lessons: 10, exercises: 20, field: 42, checkpoints: 6, traction: 12 };

export type ReadinessBreakdown = {
  seed: number;
  lessons: number;
  exercises: number;
  field: number;
  checkpoints: number;
  traction: number;
};

// Exercise points: +1 per exercise scored ≥50, +1.5 if ≥80 (cap 20).
// Shared with /api/ai and /api/northstar so lastReadinessGain deltas match the formula.
export function computeExercisePoints(rows: BrainRow[]): number {
  let pts = 0;
  for (const e of rows) {
    if (e.entryType === 'startup_snapshot' || e.aiScore == null) continue;
    if (e.aiScore >= 80) pts += 1.5;
    else if (e.aiScore >= 50) pts += 1;
  }
  return Math.min(pts, CAP.exercises);
}

export type ReadinessInputs = {
  onboardingScore: number;
  theoryDoneCount: number;                       // completed lessons with kind 'theory'
  brainRows: BrainRow[];                         // for exercise points
  fieldDone: string[];                           // lessonIds of program field tasks with status done
  checkpointsPassed: number;                     // of M4/M9 (0–2)
  checkInMetrics: { name: string; value: number }[][]; // metrics per check-in, oldest→newest
};

export function computeLaunchReadiness(inp: ReadinessInputs): { readiness: number; breakdown: ReadinessBreakdown } {
  const seed = onboardingSeed(inp.onboardingScore);
  const lessons = Math.min(Math.round(inp.theoryDoneCount * 0.4 * 10) / 10, CAP.lessons);
  const exercises = computeExercisePoints(inp.brainRows);

  let field = 0;
  for (const id of inp.fieldDone) field += FIELD_POINTS[id] ?? FIELD_DEFAULT;
  field = Math.min(field, CAP.field);

  const checkpoints = Math.min(inp.checkpointsPassed * 3, CAP.checkpoints);

  // Traction milestones from Pulse — milestone-based, never "per check-in" (anti-gaming §7)
  let traction = 0;
  const all = inp.checkInMetrics.flat();
  if (all.some((m) => m.value > 0 && /signup|regist|waitlist|subscriber|user/i.test(m.name))) traction += 3;
  if (all.some((m) => m.value > 0 && /revenue|mrr|sale|paid|income|\$/i.test(m.name))) traction += 6;
  // sustained growth: any metric tracked 3+ times whose latest value beats the first
  const series: Record<string, number[]> = {};
  for (const ci of inp.checkInMetrics) for (const m of ci) (series[m.name.toLowerCase()] ??= []).push(m.value);
  if (Object.values(series).some((v) => v.length >= 3 && v[v.length - 1] > v[0])) traction += 3;
  traction = Math.min(traction, CAP.traction);

  const readiness = Math.min(100, Math.round(seed + lessons + exercises + field + checkpoints + traction));
  return { readiness, breakdown: { seed, lessons: Math.round(lessons), exercises: Math.round(exercises), field, checkpoints, traction } };
}

export function computeGrowth(growthXp: number): GrowthState {
  let tierIdx = 0;
  for (let i = 0; i < GROWTH_TIERS.length; i++) {
    if (growthXp >= GROWTH_TIERS[i].xpThreshold) tierIdx = i;
  }
  const tier = GROWTH_TIERS[tierIdx];
  const nextTier = tierIdx + 1 < GROWTH_TIERS.length ? GROWTH_TIERS[tierIdx + 1] : null;
  const progressToNext = nextTier
    ? Math.min(Math.round(((growthXp - tier.xpThreshold) / (nextTier.xpThreshold - tier.xpThreshold)) * 100), 100)
    : 100;
  return { tier: tierIdx + 1, tierName: tier.name, xp: growthXp, progressToNext, nextTierName: nextTier?.name ?? null };
}
