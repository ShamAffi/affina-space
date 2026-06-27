import type { Question, Module } from './types.js';

// Maps input-type lesson IDs to their brain entry type.
// Add new entries here as more input lessons are added across modules.
export const BRAIN_ENTRY_TYPES: Record<string, string> = {
  m1l2: 'value_proposition',
};

export const QUESTIONS: Question[] = [
  { id: 'idea', label: 'Describe your business idea', type: 'text' },
  { id: 'customer', label: 'Who is your perfect customer?', type: 'text' },
  { id: 'businessModel', label: 'What is your business model?', type: 'text' },
  {
    id: 'stage',
    label: 'How far have you gone with your project?',
    type: 'choice',
    options: [
      'No idea',
      'Idea discovery',
      'Prototype development',
      'First clients',
      'Scaling',
    ],
  },
];

export const MODULES: Module[] = [
  {
    id: 'm1',
    order: 1,
    title: 'Find Your Focus',
    lessons: [
      {
        id: 'm1l1',
        type: 'text',
        title: 'Why a clear idea beats a big idea',
        body: 'The cost of trying to serve everyone is that you become essential to no one. A clear idea — one problem, one audience — is easier to validate, to message, and to win. In this lesson you\'ll see why focus is the founder\'s biggest advantage, especially at the start.',
      },
      {
        id: 'm1l2',
        type: 'input',
        title: 'Writing your one-sentence value proposition',
        body: 'A value proposition says who you help, what problem you solve, and the result they get — in one sentence. Draft yours below. (We\'ll save this so you always have it in front of you, and so the platform can personalize your next steps.)',
        inputPrompt: 'My one-sentence value proposition:',
      },
    ],
  },
  {
    id: 'm2',
    order: 2,
    title: 'Finding Your Golden Customer',
    lessons: [
      {
        id: 'm2l1',
        type: 'text',
        title: 'The Mom Test — why you should never ask "would you buy this?"',
        body: 'People lie to be nice. The Mom Test is about asking questions even your mom couldn\'t lie to you about — questions about their real past behavior, not hypothetical future purchases. This lesson covers how to get honest signal from customer conversations.',
      },
      {
        id: 'm2l2',
        type: 'text',
        title: 'Example of a great interview script',
        body: 'A walkthrough of a real customer-interview script you can reuse: how to open, what to ask, and how to dig into how they currently solve the problem and what it costs them.',
      },
    ],
  },
  {
    id: 'm3',
    order: 3,
    title: 'Package Your First Offer',
    lessons: [
      {
        id: 'm3l1',
        type: 'text',
        title: 'Why your first offer should be small, specific, and time-bound',
        body: 'Big, vague offers scare early customers. A small, specific, time-bound offer is easy to say yes to and easy for you to deliver — and it teaches you fast. This lesson shows how to scope your first offer.',
      },
      {
        id: 'm3l2',
        type: 'text',
        title: 'Pricing for trust, not for perfection',
        body: 'Early-bird and founding-cohort pricing builds trust and momentum when you have no track record yet. Learn the logic of pricing your first offer to win believers, not to maximize revenue.',
      },
    ],
  },
  {
    id: 'm4',
    order: 4,
    title: 'Build Your MVP (No-Code)',
    lessons: [
      {
        id: 'm4l1',
        type: 'text',
        title: 'The anatomy of a landing page that converts',
        body: 'Every converting landing page has the same bones: hero, pain, offer, proof, and a clear CTA. This lesson breaks down each section and what to put in it.',
      },
      {
        id: 'm4l2',
        type: 'text',
        title: 'Vibe coding 101 — building your first page without a developer',
        body: 'You don\'t need an engineer to ship your first page. This lesson introduces no-code / vibe-coding tools and how to go from blank screen to a live landing page.',
      },
    ],
  },
];
