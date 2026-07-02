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

const TOTAL_POSSIBLE_WEIGHT = Object.values(LAUNCH_LAYER_WEIGHTS).reduce((s, w) => s + w, 0);

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

export function computeLaunchReadiness(
  brainEntries: BrainRow[],
  onboardingScore = 0,
): LaunchReadiness {
  const scoreMap: Record<string, number> = {};
  for (const e of brainEntries) {
    if (e.aiScore !== null) scoreMap[e.entryType] = e.aiScore;
  }

  // TODO(activity-points): currently only scored Brain layers count toward readiness.
  // Closed tasks and Pulse check-in streaks contribute 0. Planned: fold real activity
  // (e.g. +N per completed task, +N per consecutive check-in week) into the same 0–90 scale.
  // Design deferred — see project memory "activity-points-backlog".

  // Course points: each scored Brain layer adds weight×score, normalised to 0–100.
  let weightedSum = 0;
  for (const [type, weight] of Object.entries(LAUNCH_LAYER_WEIGHTS)) {
    weightedSum += weight * (scoreMap[type] ?? 0);
  }
  const coursePoints = TOTAL_POSSIBLE_WEIGHT > 0 ? weightedSum / TOTAL_POSSIBLE_WEIGHT : 0;

  // Head-start from the onboarding idea score + course work, capped at the 90 launch ceiling.
  const readiness = Math.min(Math.round(coursePoints + onboardingSeed(onboardingScore)), 90);

  const scored = brainEntries.filter((e) => e.aiScore !== null);
  const weakest = [...scored].sort((a, b) => (a.aiScore ?? 100) - (b.aiScore ?? 100))[0];
  const unmetRequired = LAUNCH_REQUIRED_LAYERS.filter((l) => !(l in scoreMap));
  return {
    readiness,
    seed: onboardingSeed(onboardingScore),
    weakestLayer: weakest?.entryType ?? null,
    unmetRequired,
  };
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
