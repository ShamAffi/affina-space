import type { Question, Module } from './types.js';

export const BRAIN_ENTRY_TYPES: Record<string, string> = {
  m1l3: 'value_proposition',
  m1l4: 'founder_fit',
  m2l4: 'competitive_landscape',
  m2l5: 'positioning',
  m3l3: 'persona_candidates',
  m3l4: 'persona',
  m4l3: 'use_case',
  m4l4: 'product_spec',
  m5l3: 'quantified_value',
  m5l4: 'core_advantage',
  m6l3: 'acquisition_path',
  m6l4: 'decision_map',
  m7l3: 'business_model',
  m7l4: 'pricing',
  m8l3: 'unit_economics',
  m9l3: 'key_assumptions',
  m9l4: 'demand_test',
  m10l3: 'mvbp_definition',
  m11l3: 'traction_metrics',
  m11l4: 'roadmap',
  m12l3: 'pitch_narrative',
};

export const QUESTIONS: Question[] = [
  { id: 'idea', label: 'Describe your business idea', type: 'text' },
  { id: 'customer', label: 'Who is your perfect customer?', type: 'text' },
  { id: 'businessModel', label: 'What is your business model?', type: 'text' },
  {
    id: 'stage',
    label: 'How far have you gone with your project?',
    type: 'choice',
    options: ['No idea', 'Idea discovery', 'Prototype development', 'First clients', 'Scaling'],
  },
];

export const MODULES: Module[] = [
  // ─── M1: Find Your Focus ─────────────────────────────────────────────────
  {
    id: 'm1',
    order: 1,
    title: 'Find Your Focus',
    lessons: [
      {
        id: 'm1l1',
        type: 'text',
        title: 'Why a clear idea beats a big idea',
        body: `The instinct at the start is to make your idea bigger — more features, more audiences, more "it could also do this." But a big idea is impossible to validate, impossible to explain, and impossible to win. A clear idea — one problem, one person, one result — is the opposite. It's small enough to test this week and sharp enough that the right person instantly gets it. Focus isn't a limit you accept at the start; it's the advantage that lets an early-stage founder move faster than companies a hundred times her size. In this module you'll do one hard, valuable thing: say what you're building so clearly that a stranger would understand it in a single breath.`,
      },
      {
        id: 'm1l2',
        type: 'text',
        title: 'The shape of a one-liner that lands',
        body: `A great one-sentence pitch has three parts: who you help, what painful problem you solve, and the result they get. Drop one and it goes fuzzy. Watch the difference.\n\nVague: "A marketplace platform with smart matching for flexible work."\n\nSharp: "I help moms on maternity leave earn 2–3 hours a day from home, without going back to an office."\n\nThe second one names a person, a real pain, and a concrete result — you can picture her. Notice it says nothing about technology. Customers don't buy your tech; they buy the change in their life. Your job next: write the sharp version of your idea.`,
      },
      {
        id: 'm1l3',
        type: 'input',
        title: 'Your value proposition',
        body: `Now it's your turn. Write your value proposition in one clear sentence. The format to follow: who you help, the problem you solve, and the result they get. Our mentor will review your answer and give you specific, actionable feedback.`,
        inputPrompt: 'Write your value proposition in one sentence: who you help, the problem you solve, and the result they get.',
      },
      {
        id: 'm1l4',
        type: 'input',
        title: 'Why you?',
        body: 'Every strong pitch has a "why you" — the reason this particular founder is unusually well-positioned to solve this problem. It could be lived experience, professional access, a skill that gives you an edge, or a network others don\'t have. This is your unfair advantage. Write it honestly.',
        inputPrompt: 'In 2–3 sentences: why you? What in your story, skills, or access makes you the right person to solve this — your unfair advantage.',
      },
    ],
  },

  // ─── M2: Research the Market ─────────────────────────────────────────────
  {
    id: 'm2',
    order: 2,
    title: 'Research the Market',
    lessons: [
      {
        id: 'm2l1',
        type: 'text',
        title: 'Is this a market worth winning?',
        body: `A brilliant idea in a tiny or shrinking market is a hard place to build a business. Before you fall in love with your solution, look hard at the market. Three questions tell you most of it. How intense is the pain — a painkiller people hunt for, or a vitamin that's nice to have? How often does it happen — daily problems build daily habits; once-a-year problems get forgotten. Will people actually pay — are they already spending time, money, or effort on a workaround today? If all three are yes, you've found something worth your years. If not, far better to know now than after a year of building.`,
      },
      {
        id: 'm2l2',
        type: 'text',
        title: 'Your real competitor is the status quo',
        body: `Founders love to say "we have no competitors." You always have competitors — they're just not who you think. Your real competitor is how your customer solves this today: a spreadsheet, a WhatsApp group, a freelancer, or simply doing nothing. "Doing nothing" is the most underrated competitor of all, because it's free and familiar. To win, you have to be clearly better than the workaround she already trusts — not better than some other startup. So map what she uses now, and be honest about why it's good enough for her. That honesty is exactly where your opening hides.`,
      },
      {
        id: 'm2l3',
        type: 'text',
        title: 'Does the money work?',
        body: `You don't need a 40-tab model at the idea stage — you need a back-of-the-napkin answer to one question: if this works, can it become a real business? Estimate it bottom-up, not top-down. Not "the market is $10B and we'll take 1%." Instead: how many people like your customer exist, how often would they use this, and how much is it worth to them? Multiply. If the number is exciting even when you're conservative, you have room to build. If it only works with heroic assumptions, rethink the model — the same idea, sold differently, can change everything.`,
      },
      {
        id: 'm2l4',
        type: 'structured',
        title: 'Map your competitive landscape',
        body: 'Before you can position yourself, you need to be brutally honest about how your customer solves this problem today. List the 3 main alternatives — including "doing nothing." For each, explain why it\'s not good enough. The gaps you identify are your opening.',
        inputPrompt: 'List 3 ways your customer solves this problem today (include "doing nothing"). For each: the alternative and why it falls short.',
        inputPlaceholder: `1. [Alternative, e.g. "WhatsApp groups"] — [why it falls short, e.g. "free and trusted, but chaotic and no payment protection"]
2. [Alternative, e.g. "Freelance marketplaces"] — [why it falls short]
3. [Alternative, e.g. "Doing nothing"] — [why it falls short]`,
      },
      {
        id: 'm2l5',
        type: 'input',
        title: 'Your positioning & differentiation',
        body: 'Positioning is not a tagline — it\'s a strategic choice about who you\'re for, what you\'re replacing, and why you win. The format below forces you to commit to one real difference, not a list of features.',
        inputPrompt: 'Complete your positioning in one line: "For [customer], unlike [main alternative], we [the one difference that matters most to her]."',
      },
    ],
  },

  // ─── M3: Persona Builder ─────────────────────────────────────────────────
  {
    id: 'm3',
    order: 3,
    title: 'Persona Builder',
    lessons: [
      {
        id: 'm3l1',
        type: 'text',
        title: 'You can\'t build for everyone',
        body: `It feels safe to keep your audience wide — more people, more customers, right? At the idea stage it's the opposite. A product built for everyone delights no one. The founders who win pick one specific group, fall in love with their problem, and become the obvious choice for them first. This is your beachhead: the narrow front where you win completely before expanding. Counterintuitively, the narrower you go, the faster you grow — a sharp message spreads, and a delighted niche tells everyone. So we're going to do something that feels backwards: make your audience smaller, on purpose.`,
      },
      {
        id: 'm3l2',
        type: 'text',
        title: 'What makes a great first customer',
        body: `Not all customers are equal at the start. Your ideal first customer usually shares four traits. The pain is intense — felt often and badly enough to seek a fix. She's reachable — you can find and talk to her without a big budget. She can pay — there's money or real value behind the problem. And she talks — she's connected to others like her, so a win spreads by word of mouth. In the next exercise you'll sketch three different types of customer, and we'll score each one against exactly these four traits — then help you pick who to win first.`,
      },
      {
        id: 'm3l3',
        type: 'structured',
        title: 'Three candidate customers',
        body: 'Sketch three meaningfully different types of people who could be your customer. Don\'t make them three shades of the same person — real differences in who they are, what hurts, and how they pay. Our mentor will score each one on four criteria and recommend your best starting point.',
        inputPrompt: 'Describe 3 different types of people who could be your customer. For each: who they are, their biggest pain, how they solve it today, and whether they can pay.',
        inputPlaceholder: `Candidate A: [who they are, e.g. "Moms on maternity leave, 28–35"]
- Pain: [their biggest pain]
- Solves today: [how they handle it now]
- Can pay: [yes/no — explain why]

Candidate B: [who they are]
- Pain: [their biggest pain]
- Solves today: [how they handle it now]
- Can pay: [yes/no — explain why]

Candidate C: [who they are]
- Pain: [their biggest pain]
- Solves today: [how they handle it now]
- Can pay: [yes/no — explain why]`,
        aiMode: 'compare',
      },
      {
        id: 'm3l4',
        type: 'input',
        title: 'Your beachhead persona',
        body: 'Based on the mentor\'s recommendation, build out one real person — not a demographic bucket. Give her a name. A day in her life. The moment that triggers her to look for a solution. The one objection that would stop her even if she needed this. This is who you\'re building for.',
        inputPrompt: 'Write your beachhead persona as one real person: name her, a day in her life, her goal, what triggers her to look for a solution, and her biggest objection.',
      },
    ],
  },

  // ─── M4: What You Actually Do for Her ────────────────────────────────────
  {
    id: 'm4',
    order: 4,
    title: 'What You Actually Do for Her',
    lessons: [
      {
        id: 'm4l1',
        type: 'text',
        title: 'Full life-cycle use case',
        body: 'Coming soon — we\'ll map how your customer discovers, tries, and returns to your product. The full arc from stranger to loyal user.',
      },
      {
        id: 'm4l2',
        type: 'text',
        title: 'Sketch your product, not your tech',
        body: 'Coming soon — how to describe what you\'re building visually and specifically, without writing a line of code.',
      },
      {
        id: 'm4l3',
        type: 'input',
        title: 'Use-case map',
        body: 'Map the moment your customer discovers your product all the way to the "aha" moment she comes back for.',
        inputPrompt: 'Describe the full use-case: how does she find you → try you → experience the "aha" moment → return?',
      },
      {
        id: 'm4l4',
        type: 'input',
        title: 'Product sketch',
        body: 'Describe your product in plain language — what it does, what it doesn\'t do, and what the core experience feels like.',
        inputPrompt: 'Sketch your product: what it does for her, what the core screen or step looks like, and what you\'re deliberately leaving out.',
      },
    ],
  },

  // ─── M5: Prove the Value ─────────────────────────────────────────────────
  {
    id: 'm5',
    order: 5,
    title: 'Prove the Value',
    lessons: [
      {
        id: 'm5l1',
        type: 'text',
        title: 'Value in numbers: before and after',
        body: 'Coming soon — how to quantify the change your product creates in terms your customer actually uses and cares about.',
      },
      {
        id: 'm5l2',
        type: 'text',
        title: 'Define your core',
        body: 'Coming soon — the capability that makes your advantage hard to copy, and how to articulate it.',
      },
      {
        id: 'm5l3',
        type: 'input',
        title: 'Quantified value',
        body: 'Translate your value proposition into concrete before/after numbers that matter to your customer.',
        inputPrompt: 'Before your product: [what her situation looks like in measurable terms]. After: [what changes, and by how much].',
      },
      {
        id: 'm5l4',
        type: 'input',
        title: 'Your core advantage',
        body: 'What do you do better than any alternative — and why is that hard to copy?',
        inputPrompt: 'Name the one thing you do best for this customer, and explain why it\'s hard for others to replicate.',
      },
    ],
  },

  // ─── M6: How She Finds You ────────────────────────────────────────────────
  {
    id: 'm6',
    order: 6,
    title: 'How She Finds You',
    lessons: [
      {
        id: 'm6l1',
        type: 'text',
        title: 'The path to a paying customer',
        body: 'Coming soon — mapping the realistic journey from stranger to first payment.',
      },
      {
        id: 'm6l2',
        type: 'text',
        title: 'Who really decides',
        body: 'Coming soon — understanding the decision-making unit for consumer products: her, her influencers, and word of mouth.',
      },
      {
        id: 'm6l3',
        type: 'input',
        title: 'Acquisition path',
        body: 'Map where your first 10 customers come from and what moves them to pay.',
        inputPrompt: 'Describe your acquisition path: where do your first 10 customers come from, what triggers them to look, and how do they decide?',
      },
      {
        id: 'm6l4',
        type: 'input',
        title: 'Decision & influence map',
        body: 'Who influences your customer\'s decision to try and buy?',
        inputPrompt: 'Map who influences your customer\'s decision: who does she trust, who does she watch, who would she listen to about this problem?',
      },
    ],
  },

  // ─── M7: The Business Model ───────────────────────────────────────────────
  {
    id: 'm7',
    order: 7,
    title: 'The Business Model',
    lessons: [
      {
        id: 'm7l1',
        type: 'text',
        title: 'Ways consumer products make money',
        body: 'Coming soon — subscription, transaction, freemium, advertising: how to choose the right model for your audience and problem.',
      },
      {
        id: 'm7l2',
        type: 'text',
        title: 'Price from value, not cost',
        body: 'Coming soon — why cost-plus pricing leaves money on the table, and how to anchor to customer value instead.',
      },
      {
        id: 'm7l3',
        type: 'input',
        title: 'Your business model',
        body: 'Choose and justify your revenue model — how you make money and why it fits how your customer buys.',
        inputPrompt: 'Name your business model (subscription / transaction / freemium / other) and explain why it fits your customer\'s buying behavior.',
      },
      {
        id: 'm7l4',
        type: 'input',
        title: 'Pricing',
        body: 'Set and justify your price point — grounded in the value you deliver, not the cost it takes you.',
        inputPrompt: 'What is your price, how did you arrive at it, and why would your customer find it fair given the value she receives?',
      },
    ],
  },

  // ─── M8: Make the Math Work ───────────────────────────────────────────────
  {
    id: 'm8',
    order: 8,
    title: 'Make the Math Work',
    lessons: [
      {
        id: 'm8l1',
        type: 'text',
        title: 'LTV: what a customer is worth over time',
        body: 'Coming soon — how to estimate lifetime value and why it\'s the number that determines how much you can spend to acquire a customer.',
      },
      {
        id: 'm8l2',
        type: 'text',
        title: 'CAC: why B2C burns cash fast',
        body: 'Coming soon — the hidden cost of acquiring a consumer customer and how to keep your unit economics sustainable.',
      },
      {
        id: 'm8l3',
        type: 'input',
        title: 'Unit economics',
        body: 'Calculate the fundamentals: what a customer costs to acquire (CAC), what she generates over her lifetime (LTV), and what that ratio tells you.',
        inputPrompt: 'Estimate your LTV (lifetime revenue per customer) and CAC (cost to acquire one customer). What is the LTV:CAC ratio, and what does it tell you about your model\'s health?',
      },
    ],
  },

  // ─── M9: Test Before You Build ───────────────────────────────────────────
  {
    id: 'm9',
    order: 9,
    title: 'Test Before You Build',
    lessons: [
      {
        id: 'm9l1',
        type: 'text',
        title: 'Identify your riskiest assumptions',
        body: 'Coming soon — the one assumption that, if wrong, kills everything. How to surface it and test it first.',
      },
      {
        id: 'm9l2',
        type: 'text',
        title: 'Pretotyping: fake door, landing page, Wizard of Oz',
        body: 'Coming soon — three ways to test real demand before you build anything.',
      },
      {
        id: 'm9l3',
        type: 'input',
        title: 'Assumptions map',
        body: 'List your biggest assumptions, ranked by risk — and how you\'d test each one.',
        inputPrompt: 'List your 3–5 biggest assumptions, ranked from riskiest to safest. For each: what you\'re assuming, and how you\'d test it.',
      },
      {
        id: 'm9l4',
        type: 'input',
        title: 'Demand test',
        body: 'Design the smallest possible experiment that proves real demand exists — before building anything.',
        inputPrompt: 'Describe your demand test: what you\'ll build (landing page / fake door / other), what signal you\'re looking for, and what result would mean "go."',
      },
    ],
  },

  // ─── M10: Build Your MVP ─────────────────────────────────────────────────
  {
    id: 'm10',
    order: 10,
    title: 'Build Your MVP',
    lessons: [
      {
        id: 'm10l1',
        type: 'text',
        title: 'What an MVBP is',
        body: 'Coming soon — the minimum viable product that actually delivers and captures value, not just a prototype.',
      },
      {
        id: 'm10l2',
        type: 'text',
        title: 'The scope knife + no-code',
        body: 'Coming soon — how to cut ruthlessly to what matters, and build it without engineering resources.',
      },
      {
        id: 'm10l3',
        type: 'input',
        title: 'MVBP definition',
        body: 'Define the smallest version of your product that delivers the core value and earns a real reaction.',
        inputPrompt: 'What is your MVBP? Describe the one core flow it covers, what it deliberately leaves out, and how you\'ll know it worked.',
      },
    ],
  },

  // ─── M11: Launch & Prove They Love It ────────────────────────────────────
  {
    id: 'm11',
    order: 11,
    title: 'Launch & Prove They Love It',
    lessons: [
      {
        id: 'm11l1',
        type: 'text',
        title: '"Dogs eat the dog food"',
        body: 'Coming soon — the difference between people who say they love your product and people who actually use it every week.',
      },
      {
        id: 'm11l2',
        type: 'text',
        title: 'Retention & habit formation',
        body: 'Coming soon — the Hooked model, North Star metric, and the Sean Ellis test for product-market fit.',
      },
      {
        id: 'm11l3',
        type: 'input',
        title: 'Traction dashboard',
        body: 'Define the metrics that prove people love your product — not vanity numbers, but real retention signals.',
        inputPrompt: 'What is your North Star metric? List 3 numbers you\'ll track weekly to know the product is working.',
      },
      {
        id: 'm11l4',
        type: 'input',
        title: 'Product roadmap',
        body: 'Map what you\'re building next — based on what you\'ve learned, not what sounds exciting.',
        inputPrompt: 'List your next 3 product priorities in order. For each: what it is, why now, and what learning or metric it addresses.',
      },
    ],
  },

  // ─── M12: Tell Your Story ────────────────────────────────────────────────
  {
    id: 'm12',
    order: 12,
    title: 'Tell Your Story',
    lessons: [
      {
        id: 'm12l1',
        type: 'text',
        title: 'Founder storytelling',
        body: 'Coming soon — the arc investors and partners respond to, and how to tell it in 90 seconds.',
      },
      {
        id: 'm12l2',
        type: 'text',
        title: 'Pitch deck structure + fundraising 101',
        body: 'Coming soon — the 10-slide structure that works, and what early-stage investors actually look for.',
      },
      {
        id: 'm12l3',
        type: 'input',
        title: 'Pitch narrative',
        body: 'Write the story of your company — the problem, your insight, why now, and the future you\'re building toward.',
        inputPrompt: 'Write your pitch narrative in 4–6 sentences: the problem you\'re solving, your insight about why existing solutions fail, why now, and what the world looks like when you win.',
      },
    ],
  },
];
