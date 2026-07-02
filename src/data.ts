import type { Question, Module } from './types.js';

// Program v2 (SPEC_PROGRAM_V2.md §3.5) — positional lesson IDs m{module}l{block}.
export const BRAIN_ENTRY_TYPES: Record<string, string> = {
  m0l3: 'founder_intake',
  m0l4: 'imported_assets',
  m1l4: 'mission_vision',
  m1l5: 'value_proposition',
  m1l6: 'founder_fit',
  m2l4: 'competitive_landscape',
  m2l5: 'positioning',
  m2l7: 'competitor_journey',
  m3l4: 'persona_candidates',
  m3l5: 'persona',
  m3l6: 'interview_script',
  m3l7: 'interview_log',
  m4l5: 'problem_solution_check',
  m4l6: 'use_case',
  m4l7: 'product_spec',
  m4l8: 'value_advantage',
  m4l9: 'micro_commitment',
  m5l4: 'business_model',
  m5l5: 'unit_economics',
  m5l6: 'north_star',
  m5l7: 'interview_log',
  m6l5: 'key_assumptions',
  m6l6: 'mvbp_definition',
  m6l7: 'site_structure',
  m6l8: 'site_launch',
  m7l5: 'acquisition_path',
  m7l6: 'decision_map',
  m7l7: 'channel_shortlist',
  m7l8: 'acquisition_results',
  m8l4: 'sales_script',
  m8l5: 'pipeline',
  m8l6: 'first_sale',
  m9l4: 'traction_metrics',
  m9l5: 'progress_report',
  m9l6: 'non_buyer_insights',
  m10l4: 'founder_audit',
  m10l5: 'delegation_matrix',
  m10l6: 'delegation_result',
  m11l4: 'pivot_scale_decision',
  m11l5: 'roadmap',
  m11l6: 'interview_log',
  m12l4: 'pitch_narrative',
  m12l5: 'investor_targets',
  m12l6: 'outreach_log',
};

export const QUESTIONS: Question[] = [
  {
    id: 'idea',
    label: 'What startup are you building?',
    type: 'text',
    multiline: true,
    maxLength: 250,
    placeholder: 'e.g. A platform that helps moms on maternity leave earn flexible income from home…',
  },
  {
    id: 'customer',
    label: "Who's it for?",
    type: 'text',
    multiline: false,
    placeholder: 'e.g. Working moms in the US with children under 5…',
  },
  {
    id: 'businessModel',
    label: 'How will it make money?',
    type: 'text',
    multiline: false,
    placeholder: 'e.g. Monthly subscription, marketplace commission, one-time purchase…',
  },
  {
    id: 'stage',
    label: 'Where are you right now?',
    type: 'choice',
    options: ['No idea yet', 'Exploring the idea', 'Building a prototype', 'First customers', 'Scaling'],
  },
  {
    id: 'goal',
    label: "What's your big goal?",
    type: 'choice',
    options: ['Launch', 'Active customers', 'First revenue', 'Investment', 'Other'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Program v2 — 13 modules (SPEC_PROGRAM_V2.md §2).
// Tracks: M0–M1 Foundations · M2–M5 Validation · M6 Building · M7–M9 Launch · M10–M12 Growth.
// NEW theory bodies below are placeholders (2–3 sentences) — final texts land with the content pass.
// ─────────────────────────────────────────────────────────────────────────────
export const MODULES: Module[] = [
  // ─── M0: Welcome to Affina Space ──────────────────────────────────────────
  {
    id: 'm0',
    order: 0,
    title: 'Welcome to Affina Space',
    track: 'Foundations',
    lessons: [
      {
        id: 'm0l1',
        type: 'text',
        kind: 'theory',
        title: 'How Affina works: theory → practice → real world → your Brain',
        body: `Affina is not a course you watch — it's an incubator you act in. Every module follows the same rhythm: a short piece of theory, an exercise where you apply it to YOUR startup, and a field mission you complete in the real world. Everything you produce feeds your Company Brain, so the AI mentor knows your business better every week.`,
      },
      {
        id: 'm0l2',
        type: 'text',
        kind: 'theory',
        title: 'Being a founder in the AI era',
        body: `Building a company has never been easy — and it still isn't. What has changed is leverage: one determined founder with AI can now do the work of a small team. This program is honest about the hard parts of entrepreneurship, and deliberate about using AI as your unfair advantage at every step.`,
      },
      {
        id: 'm0l3',
        type: 'structured',
        kind: 'exercise',
        delegatable: false,
        prefillFrom: 'onboarding',
        title: 'Deep intake: your project today',
        body: `Before the program starts working for you, it needs to know exactly where you stand. Review the prefilled answers from your onboarding, then go deeper: what have you already done, how much time can you give this weekly, and what do you want to be true in 12 weeks?`,
        inputPrompt: 'Review and complete your intake: stage in detail, what you\'ve already done, links to anything live, hours per week you can commit, and your 12-week goal.',
        inputPlaceholder: `Stage today: …
What I've already done: …
Hours per week I can commit: …
My motivation & 12-week goal: …`,
      },
      {
        id: 'm0l4',
        type: 'input',
        kind: 'exercise',
        delegatable: false,
        title: 'Import what you have',
        body: `Already have a website, social profiles, a deck, or docs? Paste up to 5 links. They become part of your Brain and make every AI review sharper. File uploads arrive in a later release — links work today.`,
        inputPrompt: 'Paste up to 5 links that show what you have so far (website, socials, docs, deck) — one per line, with a word on what each is.',
        inputPlaceholder: `https://… — landing page
https://… — Instagram
https://… — pitch deck (Google Slides)`,
      },
      {
        id: 'm0l5',
        type: 'text',
        kind: 'system',
        title: 'Generate your Startup Snapshot v1',
        body: `This is where the program turns your intake into a living document: the Startup Snapshot — your whole startup on one page, curated by AI. It will update itself after every module checkpoint and weekly check-in. Snapshot generation activates here in the next release step; your intake is already saved to the Brain.`,
      },
    ],
  },

  // ─── M1: Find Your Focus ─────────────────────────────────────────────────
  {
    id: 'm1',
    order: 1,
    title: 'Find Your Focus',
    track: 'Foundations',
    lessons: [
      {
        id: 'm1l1',
        type: 'text',
        kind: 'theory',
        title: 'Think in hypotheses: the lean loop',
        body: `A startup is not a small big company — it's a search machine for a business model that works. Everything you believe about your customer, problem, and price is a hypothesis until the market confirms it. The loop you'll run all program long: build a small test, measure what really happens, learn, and adjust. Changing course on evidence isn't failure — it's discipline.`,
      },
      {
        id: 'm1l2',
        type: 'text',
        kind: 'theory',
        title: 'Why a clear idea beats a big idea',
        body: `The instinct at the start is to make your idea bigger — more features, more audiences, more "it could also do this." But a big idea is impossible to validate, impossible to explain, and impossible to win. A clear idea — one problem, one person, one result — is the opposite. It's small enough to test this week and sharp enough that the right person instantly gets it. Focus isn't a limit you accept at the start; it's the advantage that lets an early-stage founder move faster than companies a hundred times her size. In this module you'll do one hard, valuable thing: say what you're building so clearly that a stranger would understand it in a single breath.`,
      },
      {
        id: 'm1l3',
        type: 'text',
        kind: 'theory',
        title: 'The shape of a one-liner that lands',
        body: `A great one-sentence pitch has three parts: who you help, what painful problem you solve, and the result they get. Drop one and it goes fuzzy. Watch the difference.\n\nVague: "A marketplace platform with smart matching for flexible work."\n\nSharp: "I help moms on maternity leave earn 2–3 hours a day from home, without going back to an office."\n\nThe second one names a person, a real pain, and a concrete result — you can picture her. Notice it says nothing about technology. Customers don't buy your tech; they buy the change in their life. Your job next: write the sharp version of your idea.`,
      },
      {
        id: 'm1l4',
        type: 'input',
        kind: 'exercise',
        title: 'Mission & Vision',
        body: `Mission is why you exist today — the change you create for your customer. Vision is the world you're building toward in 5–10 years if everything works. Together they're your compass for every hard decision ahead. Write both; your Snapshot will keep them in view.`,
        inputPrompt: 'Write your mission (why you exist, in one sentence) and your vision (the world you\'re building toward in 5–10 years, in one or two sentences).',
      },
      {
        id: 'm1l5',
        delegateMode: 'B', // RULES §2.3: 2–3 one-liner variants (pain / result / audience angle)
        type: 'input',
        kind: 'exercise',
        title: 'Your value proposition',
        body: `Now it's your turn. Write your value proposition in one clear sentence. The format to follow: who you help, the problem you solve, and the result they get. Our mentor will review your answer and give you specific, actionable feedback.`,
        inputPrompt: 'Write your value proposition in one sentence: who you help, the problem you solve, and the result they get.',
        inputMaxLength: 250,
      },
      {
        id: 'm1l6',
        type: 'input',
        kind: 'exercise',
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
    track: 'Validation',
    lessons: [
      {
        // TODO: rewrite per spec — add Thiel's "own a small market" thesis
        id: 'm2l1',
        type: 'text',
        kind: 'theory',
        title: 'Is this a market worth winning?',
        body: `A brilliant idea in a tiny or shrinking market is a hard place to build a business. Before you fall in love with your solution, look hard at the market. Three questions tell you most of it. How intense is the pain — a painkiller people hunt for, or a vitamin that's nice to have? How often does it happen — daily problems build daily habits; once-a-year problems get forgotten. Will people actually pay — are they already spending time, money, or effort on a workaround today? If all three are yes, you've found something worth your years. If not, far better to know now than after a year of building.`,
      },
      {
        id: 'm2l2',
        type: 'text',
        kind: 'theory',
        title: 'Your real competitor is the status quo',
        body: `Founders love to say "we have no competitors." You always have competitors — they're just not who you think. Your real competitor is how your customer solves this today: a spreadsheet, a WhatsApp group, a freelancer, or simply doing nothing. "Doing nothing" is the most underrated competitor of all, because it's free and familiar. To win, you have to be clearly better than the workaround she already trusts — not better than some other startup. So map what she uses now, and be honest about why it's good enough for her. That honesty is exactly where your opening hides.`,
      },
      {
        // TODO: rewrite per spec — focus on TAM bottom-up (money math moves to M5)
        id: 'm2l3',
        type: 'text',
        kind: 'theory',
        title: 'Market size: TAM bottom-up',
        body: `You don't need a 40-tab model at the idea stage — you need a back-of-the-napkin answer to one question: if this works, can it become a real business? Estimate it bottom-up, not top-down. Not "the market is $10B and we'll take 1%." Instead: how many people like your customer exist, how often would they use this, and how much is it worth to them? Multiply. If the number is exciting even when you're conservative, you have room to build. If it only works with heroic assumptions, rethink the model — the same idea, sold differently, can change everything.`,
      },
      {
        id: 'm2l4',
        type: 'structured',
        kind: 'exercise',
        title: 'Map your competitive landscape',
        body: 'Before you can position yourself, you need to be brutally honest about how your customer solves this problem today. List the 3 main alternatives — including "doing nothing." For each, explain why it\'s not good enough. The gaps you identify are your opening.',
        inputPrompt: 'List 3 ways your customer solves this problem today (include "doing nothing"). For each: the alternative and why it falls short.',
        inputPlaceholder: `1. [Alternative, e.g. "WhatsApp groups"] — [why it falls short, e.g. "free and trusted, but chaotic and no payment protection"]
2. [Alternative, e.g. "Freelance marketplaces"] — [why it falls short]
3. [Alternative, e.g. "Doing nothing"] — [why it falls short]`,
      },
      {
        id: 'm2l5',
        delegateMode: 'B', // RULES §2.3: 2–3 positioning angles from landscape + persona
        type: 'input',
        kind: 'exercise',
        title: 'Your positioning & differentiation',
        body: 'Positioning is not a tagline — it\'s a strategic choice about who you\'re for, what you\'re replacing, and why you win. The format below forces you to commit to one real difference, not a list of features.',
        inputPrompt: 'Complete your positioning in one line: "For [customer], unlike [main alternative], we [the one difference that matters most to her]."',
      },
      {
        id: 'm2l6',
        type: 'text',
        kind: 'premium',
        title: 'Order your personal Market Research',
        body: `Want the full picture without weeks of desk work? Our done-for-you Market Research covers: market size and trends for your exact niche, a competitor map, gap analysis, and "where your window is." Delivered as a document straight into your Brain. Ordering opens soon.`,
      },
      {
        id: 'm2l7',
        type: 'text',
        kind: 'field',
        title: "Walk your competitors' user journey",
        body: `Theory can't tell you what it feels like to be your customer — only the real thing can. Sign up for 3–5 competitors (or workarounds) and walk their full journey: onboarding, core experience, pricing. Take structured notes; the gaps you feel are your positioning ammunition. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'text_template',
          template: [
            'Competitors you walked (3–5, with links)',
            'What their onboarding feels like',
            'Where they are genuinely strong',
            'Where they fall short for YOUR customer',
            'Openings this gives you',
          ],
        },
      },
    ],
  },

  // ─── M3: Customer Discovery ──────────────────────────────────────────────
  {
    id: 'm3',
    order: 3,
    title: 'Customer Discovery',
    track: 'Validation',
    lessons: [
      {
        id: 'm3l1',
        type: 'text',
        kind: 'theory',
        title: "You can't build for everyone",
        body: `It feels safe to keep your audience wide — more people, more customers, right? At the idea stage it's the opposite. A product built for everyone delights no one. The founders who win pick one specific group, fall in love with their problem, and become the obvious choice for them first. This is your beachhead: the narrow front where you win completely before expanding. Counterintuitively, the narrower you go, the faster you grow — a sharp message spreads, and a delighted niche tells everyone. So we're going to do something that feels backwards: make your audience smaller, on purpose.`,
      },
      {
        id: 'm3l2',
        type: 'text',
        kind: 'theory',
        title: 'What makes a great first customer',
        body: `Not all customers are equal at the start. Your ideal first customer usually shares four traits. The pain is intense — felt often and badly enough to seek a fix. She's reachable — you can find and talk to her without a big budget. She can pay — there's money or real value behind the problem. And she talks — she's connected to others like her, so a win spreads by word of mouth. In the next exercise you'll sketch three different types of customer, and we'll score each one against exactly these four traits — then help you pick who to win first.`,
      },
      {
        id: 'm3l3',
        type: 'text',
        kind: 'theory',
        title: 'Interviews that tell the truth',
        body: `Most customer interviews are worthless — because people are polite and will tell you your idea is "nice." The Mom Test fixes this: never pitch, never ask about the future, ask about past behavior instead. "Have you looked for a solution? What did you try? What did it cost you?" Facts about what people already did are truth; opinions about what they might do are noise.`,
      },
      {
        id: 'm3l4',
        delegatable: false, // RULES §2.3: compare mechanic is built into the block
        type: 'structured',
        kind: 'exercise',
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
        id: 'm3l5',
        type: 'input',
        kind: 'exercise',
        title: 'Your beachhead persona',
        body: 'Based on the mentor\'s recommendation, build out one real person — not a demographic bucket. Give her a name. A day in her life. The moment that triggers her to look for a solution. The one objection that would stop her even if she needed this. This is who you\'re building for.',
        inputPrompt: 'Write your beachhead persona as one real person: name her, a day in her life, her goal, what triggers her to look for a solution, and her biggest objection.',
      },
      {
        id: 'm3l6',
        type: 'input',
        kind: 'exercise',
        title: 'Your interview script',
        body: `Turn the Mom Test rules into your own script: an opener that isn't a pitch, 5–7 questions about past behavior, and a close that asks for referrals to others with the same problem. The AI mentor will check it for pitching, future-talk, and leading questions.`,
        inputPrompt: 'Write your interview script: opener (no pitch), 5–7 questions about past behavior and current workarounds, and a closing ask for referrals.',
      },
      {
        id: 'm3l7',
        type: 'text',
        kind: 'field',
        title: 'Run 1–2 warm interviews',
        body: `Time for the real thing. Find 1–2 people who match your persona through friends-of-friends and run your script. Log each conversation in the Interview Log: who, their pain, key quotes, and whether they confirm or contradict your hypothesis. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'interview_log',
          minEntries: 1,
        },
      },
    ],
  },

  // ─── M4: Problem, Solution & Product ─────────────────────────────────────
  {
    id: 'm4',
    order: 4,
    title: 'Problem, Solution & Product',
    track: 'Validation',
    mentorSessionAfter: 'S1',
    lessons: [
      {
        id: 'm4l1',
        type: 'text',
        kind: 'theory',
        title: 'Fall in love with the problem, not the solution',
        body: `Founders fail when they marry a solution and ignore what the customer is actually hiring a product to do. Jobs-to-be-Done flips the lens: what progress is she trying to make, and what does she "fire" to hire you? And remember the painkiller test — products that remove acute pain get bought; vitamins get postponed.`,
      },
      {
        id: 'm4l2',
        type: 'text',
        kind: 'theory',
        title: 'Full life-cycle use case',
        body: 'Coming soon — we\'ll map how your customer discovers, tries, and returns to your product. The full arc from stranger to loyal user.',
      },
      {
        id: 'm4l3',
        type: 'text',
        kind: 'theory',
        title: 'Sketch your product, not your tech',
        body: 'Coming soon — how to describe what you\'re building visually and specifically, without writing a line of code.',
      },
      {
        id: 'm4l4',
        type: 'text',
        kind: 'theory',
        title: 'Value in numbers: before and after',
        body: 'Coming soon — how to quantify the change your product creates in terms your customer actually uses and cares about.',
      },
      {
        id: 'm4l5',
        delegateMode: 'C', // RULES §2.3: compare card is AI; what-I-change is hers only
        type: 'structured',
        kind: 'exercise',
        title: 'Problem–Solution check against your interviews',
        body: `The moment of truth: does what you believed in Module 1 survive contact with what real people told you in Module 3? Restate your original hypothesis, then summarize what your interviews actually said. The AI mentor will highlight where they align — and where the evidence is telling you to adjust.`,
        inputPrompt: 'Restate your original problem hypothesis (from M1). Then summarize what your interviews actually revealed. Where do they confirm you — and where do they contradict?',
        inputPlaceholder: `My original hypothesis: …
What interviews confirmed: …
What interviews contradicted or surprised me: …
What I'm adjusting: …`,
      },
      {
        id: 'm4l6',
        delegateMode: 'B', // RULES §2.3: 3 user-journey variants to pick from
        type: 'input',
        kind: 'exercise',
        title: 'Use-case map',
        body: 'Map the moment your customer discovers your product all the way to the "aha" moment she comes back for.',
        inputPrompt: 'Describe the full use-case: how does she find you → try you → experience the "aha" moment → return?',
      },
      {
        id: 'm4l7',
        delegateMode: 'B', // RULES §2.3: 3 product-description variants
        type: 'input',
        kind: 'exercise',
        title: 'Product sketch',
        body: 'Describe your product in plain language — what it does, what it doesn\'t do, and what the core experience feels like.',
        inputPrompt: 'Sketch your product: what it does for her, what the core screen or step looks like, and what you\'re deliberately leaving out.',
      },
      {
        // TODO: rewrite per spec — merged quantified value + core advantage into one block
        id: 'm4l8',
        delegateMode: 'B', // RULES §2.3: phrasing variants; numbers only from her data
        type: 'structured',
        kind: 'exercise',
        title: 'Quantified value & your core advantage',
        body: 'Translate your value proposition into concrete before/after numbers that matter to your customer — then name the one thing you do best that\'s hard to copy.',
        inputPrompt: 'Two parts. (1) Before your product: her situation in measurable terms → After: what changes and by how much. (2) Your core advantage: the one thing you do best for her, and why it\'s hard to replicate.',
        inputPlaceholder: `Before: …
After: …
Core advantage & why it's hard to copy: …`,
      },
      {
        id: 'm4l9',
        type: 'text',
        kind: 'field',
        title: 'Ask for a micro-commitment',
        body: `Words are cheap — commitment is signal. Ask the people you interviewed (and your warm network) for something small but real: a waitlist signup, a letter of intent, or a pre-order. The artifact is a screenshot link that proves it happened. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'screenshot',
        },
      },
    ],
  },

  // ─── M5: Business Model & Revenue ────────────────────────────────────────
  {
    id: 'm5',
    order: 5,
    title: 'Business Model & Revenue',
    track: 'Validation',
    paid: true,
    lessons: [
      {
        // TODO: rewrite per spec — add "модель определяет продукт и цель года"
        id: 'm5l1',
        type: 'text',
        kind: 'theory',
        title: 'Ways your product makes money',
        body: 'Coming soon — subscription, transaction, freemium, advertising: how to choose the right model for your audience and problem. Your model choice shapes your product and your goal for the year.',
      },
      {
        // TODO: rewrite per spec — add women-specific underpricing patterns
        id: 'm5l2',
        type: 'text',
        kind: 'theory',
        title: 'Price from value, not cost',
        body: 'Coming soon — why cost-plus pricing leaves money on the table, and how to anchor to customer value instead. Includes the underpricing trap female founders fall into most often.',
      },
      {
        // TODO: rewrite per spec — merge LTV & CAC (old m8l1+m8l2) with North Star Metric intro
        id: 'm5l3',
        type: 'text',
        kind: 'theory',
        title: 'LTV, CAC & your North Star Metric',
        body: `Most founders track too many metrics. Revenue, downloads, signups, time-in-app, NPS — each individually feels important, but together they create noise. A North Star metric is the opposite: one number that captures the core value your product delivers to a real customer.\n\nThe best North Star metrics are leading (they predict future growth, not just record the past), value-reflecting (they move when a customer gets genuine value, not just when she opens the app), and measurable at your current stage (you can actually count it this week, not in six months).\n\n"Total downloads" is a vanity metric — it moves when you run ads, not when users get value. "Weekly sessions completed per active user" is a North Star — it moves when your product is genuinely working for her.\n\nAlongside your North Star sit two unit-economics numbers every model lives or dies by: LTV (what a customer is worth over her lifetime) and CAC (what she costs to acquire). In the exercises ahead you'll estimate both — and pick the one number that tells you everything.`,
      },
      {
        // TODO: rewrite per spec — add written defense "why this model"
        id: 'm5l4',
        delegateMode: 'C', // RULES §2.4: 2 scenarios w/ trade-offs; choice+defense hers
        type: 'input',
        kind: 'exercise',
        title: 'Your business model',
        body: 'Choose and justify your revenue model — how you make money and why it fits how your customer buys.',
        inputPrompt: 'Name your business model (subscription / transaction / freemium / other) and defend it in writing: why THIS model fits your customer\'s buying behavior better than the alternatives.',
      },
      {
        // TODO: rewrite per spec — AI flags the 2–3 shakiest assumptions
        id: 'm5l5',
        delegateMode: 'C', // RULES §2.4: 2 scenarios (mass vs premium), assumptions visible; she picks
        type: 'input',
        kind: 'exercise',
        title: 'Unit economics v1',
        body: 'Calculate the fundamentals: what a customer costs to acquire (CAC), what she generates over her lifetime (LTV), and what that ratio tells you. The mentor will flag your shakiest assumptions.',
        inputPrompt: 'Estimate your LTV (lifetime revenue per customer) and CAC (cost to acquire one customer). Show your assumptions. What is the LTV:CAC ratio, and what does it tell you about your model\'s health?',
      },
      {
        // TODO: rewrite per spec — add year-goal decomposition into quarterly milestones
        id: 'm5l6',
        type: 'structured',
        kind: 'exercise',
        delegatable: false,
        title: 'Choose your North Star + year goal',
        body: `Your AI mentor will suggest 1–2 leading metrics that reflect the real value you deliver, based on everything you've built in this program. Pick the one that fits your model — or define your own — then decompose your year goal into quarterly milestones.`,
        inputPrompt: 'Why did you choose this metric as your North Star? How does it reflect the real value you deliver to your customer — and how will you measure it at your current stage?',
        aiMode: 'north-star',
      },
      {
        id: 'm5l7',
        type: 'text',
        kind: 'field',
        title: 'Run 5–10 discovery interviews with WTP questions',
        body: `Now scale your discovery — and add money questions. Run 5–10 interviews using your script, plus willingness-to-pay probes: what does she pay today, what did she pay for alternatives, how does she react to your price range? This is price research, NOT selling. Log every conversation in the Interview Log. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'interview_log',
          minEntries: 5,
        },
      },
    ],
  },

  // ─── M6: MVP & Website ───────────────────────────────────────────────────
  {
    id: 'm6',
    order: 6,
    title: 'MVP & Website',
    track: 'Building',
    paid: true,
    lessons: [
      {
        id: 'm6l1',
        type: 'text',
        kind: 'theory',
        title: 'Identify your riskiest assumptions',
        body: 'Coming soon — the one assumption that, if wrong, kills everything. How to surface it and test it first.',
      },
      {
        id: 'm6l2',
        type: 'text',
        kind: 'theory',
        title: 'Pretotyping: fake door, landing page, Wizard of Oz',
        body: 'Coming soon — three ways to test real demand before you build anything.',
      },
      {
        // TODO: rewrite per spec — merge MVBP (m10l1) + scope knife/no-code (m10l2) + "how AI changed the game"
        id: 'm6l3',
        type: 'text',
        kind: 'theory',
        title: 'What an MVBP is + the scope knife',
        body: 'Coming soon — the minimum viable BUSINESS product that delivers and captures value; how to cut scope ruthlessly; and how AI and no-code collapsed the cost of building it.',
      },
      {
        id: 'm6l4',
        type: 'text',
        kind: 'theory',
        title: 'Anatomy of a landing page that converts',
        body: `A landing page is a story, not a brochure. The StoryBrand structure: your customer is the hero, her problem is the villain, you are the guide with a plan, and one clear call to action. Message-match matters most — the words on your page must mirror the words your persona uses about her own pain.`,
      },
      {
        id: 'm6l5',
        type: 'input',
        kind: 'exercise',
        title: 'Assumptions map',
        body: 'List your biggest assumptions, ranked by risk — and how you\'d test each one.',
        inputPrompt: 'List your 3–5 biggest assumptions, ranked from riskiest to safest. For each: what you\'re assuming, and how you\'d test it.',
      },
      {
        id: 'm6l6',
        delegateMode: 'B', // RULES §2.4: 2 scope variants — leaner vs richer
        type: 'input',
        kind: 'exercise',
        title: 'MVBP definition',
        body: 'Define the smallest version of your product that delivers the core value and earns a real reaction.',
        inputPrompt: 'What is your MVBP? Describe the one core flow it covers, what it deliberately leaves out, and how you\'ll know it worked.',
      },
      {
        id: 'm6l7',
        type: 'input',
        kind: 'exercise',
        title: 'Your site structure',
        body: `Draft the structure of your landing page using everything in your Brain: persona language, value proposition, and price. Hero promise, sections in order, proof elements, and the one call to action. The AI mentor can draft a version from your Brain — try yours first.`,
        inputPrompt: 'Draft your landing structure: hero headline + subline, the 3–5 sections in order (with one-line content notes), proof elements, and your single CTA.',
      },
      {
        id: 'm6l8',
        type: 'text',
        kind: 'field',
        title: 'Publish your site/MVP + first traffic',
        body: `Launch week. Publish your landing page or MVP and send the first real traffic to it (your network, communities, a small ad test). Crucial rule: fix your success threshold BEFORE launch — what numbers would mean "demand is real"? The artifact is your live URL plus the numbers. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'url_with_numbers',
          template: [
            'Success threshold you set BEFORE launch',
            'Traffic you sent (source & volume)',
            'Results: visits / signups / replies (numbers)',
            'What the numbers tell you',
          ],
        },
      },
    ],
  },

  // ─── M7: Customer Acquisition & Marketing ────────────────────────────────
  {
    id: 'm7',
    order: 7,
    title: 'Customer Acquisition & Marketing',
    track: 'Launch',
    paid: true,
    lessons: [
      {
        id: 'm7l1',
        type: 'text',
        kind: 'theory',
        title: 'The path to a paying customer',
        body: 'Coming soon — mapping the realistic journey from stranger to first payment.',
      },
      {
        id: 'm7l2',
        type: 'text',
        kind: 'theory',
        title: 'Who really decides',
        body: 'Coming soon — understanding the decision-making unit for consumer products: her, her influencers, and word of mouth.',
      },
      {
        id: 'm7l3',
        type: 'text',
        kind: 'theory',
        title: '19 channels, pick 2',
        body: `There are only ~19 acquisition channels in existence — and at your stage you can win on at most two. The Bullseye method: brainstorm all, shortlist the promising, test cheaply, double down on what works. And remember Paul Graham's law of the early stage: do things that don't scale.`,
      },
      {
        id: 'm7l4',
        type: 'text',
        kind: 'theory',
        title: 'CJM & retention: the leaky bucket',
        body: `Acquisition without retention is pouring water into a leaky bucket. Map the journey — Awareness, Acquisition, Activation, Retention, Referral, Revenue — and find where users leak out. Fixing the biggest leak is almost always cheaper than buying more traffic.`,
      },
      {
        id: 'm7l5',
        type: 'input',
        kind: 'exercise',
        title: 'Acquisition path',
        body: 'Map where your first 10 customers come from and what moves them to pay.',
        inputPrompt: 'Describe your acquisition path: where do your first 10 customers come from, what triggers them to look, and how do they decide?',
      },
      {
        id: 'm7l6',
        type: 'input',
        kind: 'exercise',
        title: 'Decision & influence map',
        body: 'Who influences your customer\'s decision to try and buy?',
        inputPrompt: 'Map who influences your customer\'s decision: who does she trust, who does she watch, who would she listen to about this problem?',
      },
      {
        id: 'm7l7',
        delegateMode: 'B', // RULES §2.4: Bullseye ranked candidates; picking 2 is hers
        type: 'structured',
        kind: 'exercise',
        title: '5 candidate channels for your first 10 customers',
        body: `Apply Bullseye to your startup: list 5 channels where your persona actually spends attention, and rank them by expected cost, speed, and fit. The top 2 become your first real acquisition experiments.`,
        inputPrompt: 'List 5 candidate channels for your first 10 customers. For each: why your persona is there, expected cost/effort, and your rank 1–5.',
        inputPlaceholder: `1. [Channel] — why she's there: … — cost/effort: …
2. [Channel] — …
3. [Channel] — …
4. [Channel] — …
5. [Channel] — …
My top 2 and why: …`,
      },
      {
        id: 'm7l8',
        type: 'text',
        kind: 'field',
        title: 'First acquisition results',
        body: `Run your top 1–2 unscalable channels for real this week: DMs, communities, personal outreach, a tiny paid test. The artifact is numbers per channel — reached, responded, converted — and what you learned. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'text_template',
          template: [
            'Channels you ran (1–2)',
            'What exactly you did in each',
            'Numbers per channel: reached / responses / conversions',
            'What you learned & your next bet',
          ],
        },
      },
    ],
  },

  // ─── M8: Sales — You Are the Founder Who Sells ───────────────────────────
  {
    id: 'm8',
    order: 8,
    title: 'Sales: You Are the Founder Who Sells',
    track: 'Launch',
    paid: true,
    lessons: [
      {
        id: 'm8l1',
        type: 'text',
        kind: 'theory',
        title: 'The founder is the first salesperson',
        body: `Nobody can sell your product before you can — not an agency, not a "growth hire." Founder-led sales is a simple pipeline: prospecting (finding the right people), conversations (understanding their pain), closing (asking for the deal). You already did the hardest part in discovery; sales is discovery with an ask at the end.`,
      },
      {
        id: 'm8l2',
        type: 'text',
        kind: 'theory',
        title: "You're not selling — you're helping",
        body: `The fear of "being salesy" stops more founders than rejection ever will — and it hits women founders hardest. Reframe: if your product genuinely solves her pain, NOT offering it is withholding help. Selling is matching a real problem with a real solution, honestly priced.`,
      },
      {
        id: 'm8l3',
        type: 'text',
        kind: 'theory',
        title: 'The funnel math: volume beats perfection',
        body: `Sales is a numbers game long before it's a craft. Ten conversations beat one perfect pitch. Two rules produce most early revenue: make the explicit ask ("would you like to start this week?"), and follow up — most deals close on the 3rd–5th touch, exactly where most founders give up.`,
      },
      {
        id: 'm8l4',
        type: 'input',
        kind: 'exercise',
        title: 'Your sales script',
        body: `Build your sales script from your Brain: the pain opener (persona language), your value story (quantified), price with confidence, the explicit ask, and answers to the 3 objections you're most afraid of. The AI mentor will play the skeptic and stress-test it.`,
        inputPrompt: 'Write your sales script: opener, value story, price + ask, and your answers to the 3 hardest objections you expect.',
      },
      {
        id: 'm8l5',
        type: 'structured',
        kind: 'exercise',
        title: 'Sales pipeline',
        body: `List every prospect you already have: interviewees from M3/M5 who felt the pain, micro-commitments from M4, warm network. Set your weekly touch quota. A pipeline you review weekly is the difference between "waiting for customers" and making them.`,
        inputPrompt: 'Build your pipeline: 10+ named prospects (who, source, stage: cold/warm/talking/close), and your weekly quota of touches.',
        inputPlaceholder: `1. [Name/role] — source: interview M5 — stage: warm
2. …
My weekly touch quota: …`,
      },
      {
        id: 'm8l6',
        type: 'text',
        kind: 'field',
        title: 'First paid deal / pilot',
        body: `This is the North Star of the whole program: one person pays you real money. A paid pilot counts. A discounted founding-member deal counts. Free does not count. The artifact is a link to proof of payment (screenshot). Go get her. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'screenshot',
        },
      },
    ],
  },

  // ─── M9: Review — Look at the Truth ──────────────────────────────────────
  {
    id: 'm9',
    order: 9,
    title: 'Review: Look at the Truth',
    track: 'Launch',
    paid: true,
    mentorSessionAfter: 'S2',
    lessons: [
      {
        id: 'm9l1',
        type: 'text',
        kind: 'theory',
        title: 'Three numbers that matter: traction · product · cash',
        body: `Strip the noise: at this stage your business is three numbers. Traction — is the count of people getting value growing? Product — do they come back? Cash — how many months of runway do your habits buy you? Everything else is commentary.`,
      },
      {
        id: 'm9l2',
        type: 'text',
        kind: 'theory',
        title: 'Funnel & conversions: vanity vs real metrics',
        body: `Followers, impressions, and app downloads feel great and predict nothing. Real metrics live in the funnel: visitor → signup → activated → paying → retained, each with a conversion rate. One honest funnel table tells you more than any dashboard of vanity charts.`,
      },
      {
        // TODO: rewrite per spec — moved from old m11l2; add Sean Ellis PMF test
        id: 'm9l3',
        type: 'text',
        kind: 'theory',
        title: 'Retention & habit formation',
        body: 'Coming soon — the Hooked model, retention curves, and the Sean Ellis test: "how disappointed would you be if this product disappeared?" — the single question that measures product-market fit.',
      },
      {
        // TODO: rewrite per spec — moved from old m11l3; funnel + main leak + AI diagnosis
        id: 'm9l4',
        type: 'input',
        kind: 'exercise',
        title: 'Traction dashboard',
        body: 'Lay out your real funnel with numbers at every step. The AI mentor will spot your biggest leak and diagnose what to fix first.',
        inputPrompt: 'Write out your funnel with real numbers: visitors → signups → activated → paying → retained. Where is the biggest leak, and what do you think causes it?',
      },
      {
        id: 'm9l5',
        type: 'structured',
        kind: 'exercise',
        title: 'Progress report + defense',
        body: `Midpoint accountability: report your three numbers, grade yourself honestly, and defend it — what worked, what didn't, and the 3 priorities for your next sprint. This report is the agenda for your Midpoint mentor session.`,
        inputPrompt: 'Your progress report: the 3 numbers (traction / product / cash), your honest self-rating, what worked, what didn\'t, and your top 3 priorities for the next sprint.',
        inputPlaceholder: `Traction: …
Product (retention signal): …
Cash/runway: …
Self-rating (1–10) and why: …
Top 3 priorities next sprint: …`,
      },
      {
        id: 'm9l6',
        type: 'text',
        kind: 'field',
        title: 'Talk to 3–5 non-buyers',
        body: `Your buyers tell you what works; your non-buyers tell you the truth. Go back to 3–5 people who saw the product but didn't buy and ask why — past behavior, not politeness. The patterns you hear are your highest-leverage fixes. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'text_template',
          template: [
            'Who you talked to (3–5 non-buyers)',
            'Their stated reasons for not buying',
            'Patterns across conversations',
            'What you\'ll change because of this',
          ],
        },
      },
    ],
  },

  // ─── M10: Be a Solopreneur ───────────────────────────────────────────────
  {
    id: 'm10',
    order: 10,
    title: 'Be a Solopreneur',
    track: 'Growth',
    paid: true,
    lessons: [
      {
        id: 'm10l1',
        type: 'text',
        kind: 'theory',
        title: 'Focus, energy, burnout',
        body: `You are the company's scarcest resource. Maker time and manager time don't mix — batch them. Energy management beats time management, especially when the startup shares your day with family. Burnout is a systems failure, not a willpower failure; design the system.`,
      },
      {
        id: 'm10l2',
        type: 'text',
        kind: 'theory',
        title: 'Manage like Horowitz: people → product → profit',
        body: `Ben Horowitz's order of operations: take care of the people, then the product, then the profit — in that order, even when it's hard. And when you eventually hire: hire for strength in the one thing you need, not for absence of weakness.`,
      },
      {
        id: 'm10l3',
        type: 'text',
        kind: 'theory',
        title: 'Operate like Rabois: the CEO is an editor',
        body: `Keith Rabois' operating model: the founder is an editor, not a writer of everything — simplify, clarify, allocate your attention where the leverage is. In the AI era the sequence changes: automate and delegate to agents BEFORE you hire. Headcount is the last resort, not the first.`,
      },
      {
        id: 'm10l4',
        type: 'input',
        kind: 'exercise',
        title: 'Strengths & weaknesses audit',
        body: `Honest inventory: what are you genuinely great at, what drains you, and where does your founder-market fit come from (pull your edge from M0/M1)? This audit feeds the delegation matrix next.`,
        inputPrompt: 'Your audit: 3 real strengths, 3 real weaknesses/drains, and your founder-market fit — why YOU for this market.',
      },
      {
        id: 'm10l5',
        type: 'structured',
        kind: 'exercise',
        title: 'Do / Delegate / Automate matrix',
        body: `List everything you do in a week and sort it: Do (only you can), Delegate (someone/AI agent can), Automate (a tool can). The AI mentor will suggest which tasks today's AI agents can take off your plate immediately.`,
        inputPrompt: 'List your weekly tasks in three buckets: DO (only you), DELEGATE (a person or AI agent), AUTOMATE (a tool). Be specific.',
        inputPlaceholder: `DO: …
DELEGATE: …
AUTOMATE: …`,
      },
      {
        id: 'm10l6',
        type: 'text',
        kind: 'field',
        title: 'Delegate or automate 1 real task this week',
        body: `Theory becomes freedom only when you actually hand something off. Pick one task from your matrix and remove it from your plate this week — an AI agent, a tool, a freelancer. The artifact: what you removed, how, and the hours it gives you back. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'text_template',
          template: [
            'Task you delegated or automated',
            'How (tool / agent / person)',
            'Hours saved per week',
            'What you\'ll hand off next',
          ],
        },
      },
    ],
  },

  // ─── M11: Pivot or Scale ─────────────────────────────────────────────────
  {
    id: 'm11',
    order: 11,
    title: 'Pivot or Scale',
    track: 'Growth',
    paid: true,
    lessons: [
      {
        id: 'm11l1',
        type: 'text',
        kind: 'theory',
        title: 'The fork: decide from data, not emotion',
        body: `Every founder reaches this fork: push harder on the current path, or change it. Premature scaling — pouring fuel on an engine that doesn't run — is the #1 startup killer. The antidote is deciding from your numbers (M9), not from hope, fear, or sunk cost.`,
      },
      {
        id: 'm11l2',
        type: 'text',
        kind: 'theory',
        title: 'Types of pivot: changing course ≠ failure',
        body: `Ries catalogued them: zoom-in pivot (one feature becomes the product), customer-segment pivot (same product, truer audience), channel, revenue-model, and more. Slack was a game studio; Shopify was a snowboard shop. A pivot keeps one foot on what you've learned and moves the other.`,
      },
      {
        id: 'm11l3',
        type: 'text',
        kind: 'theory',
        title: 'Scale only what repeats',
        body: `Scale is for engines that already repeat: customers arrive predictably, they stay, and LTV:CAC is healthy (≥3 as a rule of thumb). The PMF checklist first, then pour fuel — and expand from your beachhead to adjacent segments, not to "everyone."`,
      },
      {
        id: 'm11l4',
        delegateMode: 'C', // RULES §2.4: full analysis + recommendation; decision NEVER pre-filled
        type: 'structured',
        kind: 'exercise',
        title: 'Pivot/Scale scorecard',
        body: `Lay out the evidence for both paths: what your numbers, interviews, and sales say FOR staying the course and FOR changing it. The AI mentor will weigh your case against everything in your Brain and give its recommendation.`,
        inputPrompt: 'Your scorecard: evidence FOR scaling the current path, evidence FOR pivoting, and your own leaning with reasoning.',
        inputPlaceholder: `Evidence for scale: …
Evidence for pivot: …
My leaning and why: …`,
      },
      {
        // TODO: rewrite per spec — moved from old m11l4 Product roadmap; 12-month plan with milestones
        id: 'm11l5',
        type: 'input',
        kind: 'exercise',
        title: 'Pivot plan / Scale roadmap',
        body: 'Turn your decision into a 12-month plan with quarterly milestones — grounded in what you\'ve learned, not what sounds exciting.',
        inputPrompt: 'Write your 12-month plan: the decision (pivot or scale), quarterly milestones, and the metric each milestone moves.',
      },
      {
        id: 'm11l6',
        type: 'text',
        kind: 'field',
        title: 'Verification sprint',
        body: `Verify the decision before you commit the year. Scaling? Run one cheap repeatability experiment in your best channel. Pivoting? Run 3–5 interviews on the NEW hypothesis using the Interview Log. Either way, log what you learn as structured entries. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'interview_log',
          minEntries: 3,
        },
      },
    ],
  },

  // ─── M12: Fundraising & Your Story ───────────────────────────────────────
  {
    id: 'm12',
    order: 12,
    title: 'Fundraising & Your Story',
    track: 'Growth',
    paid: true,
    mentorSessionAfter: 'S3',
    lessons: [
      {
        id: 'm12l1',
        type: 'text',
        kind: 'theory',
        title: 'Do you even need VC?',
        body: `Venture capital is one financing tool, not a graduation ceremony. Bootstrapping keeps control; grants are free money with paperwork; angels bring belief; VC buys speed at the cost of ownership and pressure. For women founders there's a growing map of dedicated grants and angel networks — know it before you default to VC.`,
      },
      {
        id: 'm12l2',
        type: 'text',
        kind: 'theory',
        title: 'How a round works + SAFE basics',
        body: `See the round through the investor's eyes: they buy a slice of a future outcome, so they underwrite team, market, and momentum. The instruments: SAFEs (simple, deferred pricing), priced rounds (valuation now), and the term-sheet clauses that actually matter — dilution, pro-rata, liquidation preference.`,
      },
      {
        // TODO: rewrite per spec — merge old m12l1 storytelling + m12l2 deck structure; Sequoia structure
        id: 'm12l3',
        type: 'text',
        kind: 'theory',
        title: 'Founder storytelling & the deck that works',
        body: 'Coming soon — the narrative arc investors respond to in 90 seconds, mapped onto the Sequoia deck structure: problem, solution, why now, market, traction, team, ask.',
      },
      {
        // TODO: rewrite per spec — becomes "Create your pitch deck" with auto-assembly from Brain + Q&A trainer
        id: 'm12l4',
        type: 'input',
        kind: 'exercise',
        title: 'Create your pitch deck',
        body: 'Write the story of your company — the problem, your insight, why now, and the future you\'re building toward. The AI mentor can assemble a draft narrative from your Brain; try your own version first.',
        inputPrompt: 'Write your pitch narrative in 4–6 sentences: the problem you\'re solving, your insight about why existing solutions fail, why now, and what the world looks like when you win.',
      },
      {
        id: 'm12l5',
        type: 'text',
        kind: 'field',
        title: 'Research 20+ investors/grants',
        body: `Build your target list: 20+ investors, grants, or angel networks that actually match your stage, niche, and check size. Fit beats volume — a targeted list of 20 beats a spray of 200. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'text_template',
          template: [
            'Your list: 20+ targets (names + links)',
            'Fit notes: stage / niche / check size',
            'Your top 5 priority targets and why',
          ],
        },
      },
      {
        id: 'm12l6',
        type: 'text',
        kind: 'field',
        title: 'Contact 10 real investors',
        body: `The final mission: reach out to 10 targets from your list — warm intros where possible, sharp cold notes where not. Goal: at least one live conversation. Log every touch in the outreach log. Complete this mission in your Tasks hub.`,
        fieldTask: {
          artifactType: 'outreach_log',
          template: [
            'Who you contacted (10+, names/funds)',
            'Channel & the message you used',
            'Replies and conversations (≥1 live)',
            'Next steps agreed',
          ],
        },
      },
    ],
  },
];
