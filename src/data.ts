import type { Question, Module, CourseId } from './types.js';

// Program v2 (SPEC_PROGRAM_V2.md §3.5) — positional lesson IDs m{module}l{block}.
export const BRAIN_ENTRY_TYPES: Record<string, string> = {
  m0l3: 'imported_assets',   // Step 3 Section B "+ Add links" (SPEC_M0_INTAKE_REDESIGN §1)
  m0l4: 'founder_intake',    // Step 4 quiz JSON (SPEC_M0_INTAKE_REDESIGN §2, §4)
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

// Courses (SPEC pill = course level). One course today; add entries for parallel courses.
export const COURSES: Record<CourseId, { name: string; color: string }> = {
  launching: { name: 'Launching', color: 'bg-brand-100 text-brand-700' },
};

// lessonId → its course (via the owning module). null = not part of any course.
export function courseForLessonId(lessonId: string | null | undefined): CourseId | null {
  if (!lessonId) return null;
  for (const m of MODULES) if (m.lessons.some((l) => l.id === lessonId)) return m.courseId;
  return null;
}

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
    courseId: 'launching',
    lessons: [
      {
        id: 'm0l1',
        type: 'text',
        kind: 'theory',
        title: 'How Affina works: theory → practice → real world → your Brain',
        body: `Welcome to Affina Space. Before anything else, let's be honest about what this is — and what it isn't.

**This is not a course.**

Courses give you information and a certificate. We're here for something harder and far more valuable: a real business, with a real customer who pays you real money. Every module works the same way — a short piece of theory, an exercise where you apply it to *your* startup, and a field mission you complete out in the real world. What you bring back gets reviewed, scored, and turned into your next move.

==Everything you do feeds your Brain== — a living memory of your startup. Your answers, your interviews, your numbers all land there, and your AI mentor uses them to give advice about your business specifically, not generic startup wisdom pulled from a textbook. The further you go, the smarter it gets about you.

**Three honest rules.**

One: we will never do the parts that matter for you — talking to customers and making decisions is founder work, always. Two: you will leave this platform and speak to real humans, more than once, starting sooner than feels comfortable. Three: changing your plan when the evidence says so isn't failure here — it's the exact skill we're teaching, and you'll practice it on purpose, more than once, before this is over.

Your finish line is not "completed the program." It's your first paying customer. Every module, every exercise, every awkward conversation you're about to have — it all points at that one moment. Let's get to it.`,
      },
      {
        id: 'm0l2',
        type: 'text',
        kind: 'theory',
        title: 'Being a founder in the AI era',
        body: `Let's clear out the myths first, because they'll cost you if you carry them in.

**Founding a company will not give you more free time.**

Not at the start, maybe not for years. You won't have fewer bosses — you'll have more; every customer is one, and so is every investor, and so, some days, is your own bank balance. Nobody is coming to tell you what to do next. You are the engine now. If that thought excites you more than it scares you, you're exactly where you should be.

Here's what's also true, and it's genuinely new: there has never been a better moment in history to be a solo founder. AI has collapsed the cost of building. A landing page in an evening instead of a month. A working prototype in days instead of a quarter. Research that used to take a paid consultant weeks — done in minutes, by you, tonight. ==One determined founder with the right AI tools can now do the work of a small team.== That's not a slogan; it's the actual, measurable shift this program is built around.

But notice what AI did *not* make cheap. Knowing your customer well enough that she trusts you. Judgment — the ability to decide what's actually worth building, out of a hundred things you could build. That's exactly what this program trains, module by module. We'll hand the repetitive work — drafts, research, first passes — to AI at every step. The thinking, the conversations, the decisions: those stay with you, because that's precisely where the value of your company lives.

One more thing, before you start doubting yourself, which every founder does around week two.

*"I was told no by over a hundred investors before Canva became a company worth billions." — Melanie Perkins*

Sara Blakely started Spanx with $5,000 and zero industry contacts. Nobody gave either of them permission. Nobody needs to give you permission either.`,
      },
      {
        id: 'm0l3',
        type: 'structured',
        kind: 'exercise',
        delegatable: false,
        title: 'Your Project Today',
        body: `Onboarding already captured the basics — here's your chance to review and correct them. Each field below is editable and becomes the source of truth for your whole program. Got anything live already? Add links too.`,
      },
      {
        id: 'm0l4',
        type: 'input',
        kind: 'exercise',
        delegatable: false,
        title: 'A few quick questions',
        body: `Five quick questions onboarding didn't ask — what you've actually done, where you're stuck, and what you really want from the next 12 weeks. One at a time, takes about two minutes, and it makes your mentor genuinely useful.`,
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
    courseId: 'launching',
    lessons: [
      {
        id: 'm1l1',
        type: 'text',
        kind: 'theory',
        title: 'Think in hypotheses: the lean loop',
        body: `Here's the single most useful mental shift a founder can make in her first week, and most never make it at all.

**Your idea is not a plan. It's a stack of guesses.**

Right now you're guessing who your customer really is, what she struggles with most, what she'd actually pay, and why she'd pick you over doing nothing. That's not a weakness in your thinking — every company that ever mattered started as a stack of guesses. Eric Ries has a name for what a startup actually is:

*"A startup is a human institution designed to create something new under conditions of extreme uncertainty." — Eric Ries, The Lean Startup*

In practice, that means treating your business less like a plan you're executing and more like a search — for a business model that actually works, run through a repeating loop: state a belief, design the cheapest possible test for it, run the test, look honestly at what happened, and adjust. Steve Blank, who taught this before Ries wrote it down, called the discipline "customer development" — get out of the building and let reality answer, instead of your own optimism.

**Here's the part that changes how the next 12 weeks will feel.**

==Changing your idea based on evidence is not failure — it's the skill.== Slack started as a gaming company that never shipped a game. Instagram was a location check-in app nobody used. Their founders weren't lucky; they were paying close attention to what the loop was telling them, and they moved. If, somewhere in the coming weeks, you discover your real customer isn't who you first thought, or your first solution misses the mark — that's not this program breaking your idea. That's the program doing exactly what it exists to do, while the correction is still cheap and the stakes are still small.

You'll run this loop constantly from here on: hypothesis, test, evidence, decision. Get comfortable saying "I was wrong about that" out loud. It will be, without exaggeration, the most valuable sentence you learn to say in this entire program.`,
      },
      {
        id: 'm1l2',
        type: 'text',
        kind: 'theory',
        title: 'Why a clear idea beats a big idea',
        body: `The instinct at the start is almost universal: make the idea bigger. More features, more audiences, more "it could also do this for..." It feels like the responsible move — why limit yourself before you've even started? But this instinct is exactly backwards, and understanding why will save you months.

**A big idea is impossible to validate, impossible to explain, and impossible to win.**

If your product is "for everyone who wants to save money, eat healthy, and manage their time better," which of those three do you test first, with whom, using what? Watch anyone try to pitch "an all-in-one platform for X" in one sentence — it always takes three, and by the third one the listener has stopped picturing a real person and started picturing a slide deck. And you've just volunteered to compete with everyone, on every front, with no home turf of your own.

A clear idea does the opposite of all three. Compare "a meal-planning app for busy people" — big, vague, forgettable — against "a 10-minute dinner plan for parents working night shifts." The second is small enough to test this week, sharp enough to explain in a single breath, and specific enough that the right person — an actual night-shift parent — reads it and thinks, *that's written for me.* The wrong person self-selects out immediately too, which quietly saves you both time.

**Here's what surprises most first-time founders, and the reason this module exists.**

Narrowing your idea isn't a compromise you accept until you're bigger and can afford to widen out. ==It's the actual advantage.== Peter Thiel's advice to early founders is blunt on exactly this point:

*"Focus on a small market where your product or service already fulfills a need that goes unaddressed... it's much better to be a big fish in a small pond." — Peter Thiel*

A two-person team obsessed with one painful problem, for one clearly-defined person, will consistently out-move a company a hundred times their size — because that company is busy serving everyone adequately, while you're busy serving one person exceptionally well.

So here is the one hard, valuable thing this module asks of you: say what you're building so clearly that a complete stranger would understand it in a single breath — no jargon, no "it's kind of like X but for Y." Not because clarity is a nice writing exercise, but because it's the fastest, cheapest test of whether the idea itself is sharp enough to survive contact with a real customer.`,
      },
      {
        id: 'm1l3',
        type: 'text',
        kind: 'theory',
        title: 'The shape of a one-liner that lands',
        body: `A great one-sentence pitch has exactly three parts: who you help, the painful problem you solve for them, and the concrete result they get. Drop any one of the three and the whole thing goes fuzzy — watch the difference for yourself.

**Vague:** "A marketplace platform with smart matching for flexible work."

**Sharp:** "I help moms on maternity leave earn 2–3 hours a day from home, without going back to an office."

The second one names an actual person, a real and specific pain, and a result you can picture happening in someone's actual week. Say the vague version to ten people and most will nod politely and forget it by lunch. Say the sharp version to the right person and she leans forward.

**Notice what the sharp version says nothing about: technology.**

No "AI-powered," no "platform," no "smart matching." ==Customers don't buy your tech — they buy the change in their life.== A founder who leads with the tech is usually still hiding, even from herself, from the harder question: what specifically changes for her, and how do I know that's true?

This isn't a copywriting exercise you do once and file away. This exact sentence is the test you'll run every single one-liner you write against for the rest of the program — your pricing page, your outreach messages, your investor deck, all of it traces back to whether this one sentence actually lands with a stranger. If it doesn't land here, in one breath, with no context given in advance, it won't land anywhere downstream either.

Your job next, in the exercise that follows: write the sharp version of your own idea, and then say it out loud to someone who has never heard it before. Watch their face, not just their words — that's where the real feedback lives.`,
      },
      {
        id: 'm1l4',
        type: 'input',
        kind: 'exercise',
        title: 'Mission & Vision',
        body: `Mission is why you exist today — the change you create for your customer. Vision is the world you're building toward in 5–10 years if everything works. Together they're your compass for every hard decision ahead. Write both; your Snapshot will keep them in view.`,
        inputPrompt: 'Two fields, one compass: your mission (why you exist, one sentence) and your vision (the world you\'re building toward in 5–10 years). Answer format: "Mission: …" then "Vision: …".',
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
    courseId: 'launching',
    lessons: [
      {
        // TODO: rewrite per spec — add Thiel's "own a small market" thesis
        id: 'm2l1',
        type: 'text',
        kind: 'theory',
        title: 'Is this a market worth winning?',
        body: `A brilliant idea in a tiny or shrinking market is a genuinely hard place to spend the next several years of your life. Before you fall in love with your solution, it pays to look hard at the market underneath it — and three questions tell you most of what you need to know.

**How intense is the pain?**

Is this a painkiller people are actively hunting for, or a vitamin that's nice to have but easy to postpone? Painkillers get bought. Vitamins get "maybe next month," forever.

**How often does it strike?**

Daily problems build daily habits, and habits build businesses. Once-a-year problems get forgotten the moment they're solved, and so does your product, right along with them.

**Is she already paying — in some form?**

Money, time, or plain effort spent on a clumsy workaround today is the strongest signal there is. ==Existing spend, even on something inferior, beats a hundred people saying "I'd probably use that."==

If all three answers point the same direction, you've found something worth years of your attention. If they don't — if the pain is mild, rare, or nobody's currently doing anything about it — far better to learn that now, in an afternoon of honest thinking, than after a year spent building the wrong thing beautifully.

This isn't about picking the objectively "biggest" market either. It's about picking one where the pain is real enough, frequent enough, and expensive enough that a customer will actually change her behavior for you. A smaller market with all three signals strong will outperform a huge market with all three signals weak, every time, because the huge market simply won't move.

Hold these three questions loosely in mind as you go into the next few exercises — you'll come back to them again once real customer conversations start giving you real answers instead of guesses.`,
      },
      {
        id: 'm2l2',
        type: 'text',
        kind: 'theory',
        title: 'Your real competitor is the status quo',
        body: `Founders love to say "we have no competitors." It's almost never true, and believing it usually means you haven't looked hard enough yet.

**You always have competitors — they're just probably not who you think.**

Your real competitor is however your customer solves this problem *today*: a spreadsheet she built herself, a WhatsApp group, a freelancer she found through a friend, or — more often than founders want to admit — simply doing nothing at all and living with the problem.

==Doing nothing is the most underrated competitor of all==, precisely because it's free, familiar, and requires zero behavior change. To win, you don't have to be better than some other flashy startup. You have to be clearly, obviously better than the clumsy workaround she already trusts and has already built habits around — a much higher bar than it sounds, because habits are sticky even when they're bad.

So the exercise ahead asks something that feels almost too simple: map exactly what she uses right now, today, to deal with this problem, and be genuinely honest about *why* it's good enough for her most of the time. Not why it's bad — every founder can list reasons the old way is bad. Why does it survive anyway?

That honesty is uncomfortable, and it's exactly where your real opening hides. The gap between "good enough most of the time" and "actually solves it" is the only space you have to build a business in. Founders who skip this step build products that are better on paper and still lose — because paper isn't what she's comparing you against. Her Tuesday afternoon is.`,
      },
      {
        // TODO: rewrite per spec — focus on TAM bottom-up (money math moves to M5)
        id: 'm2l3',
        type: 'text',
        kind: 'theory',
        title: 'Market size: TAM bottom-up',
        body: `At some point — an investor, a co-founder, or your own doubting voice at 2am — someone will ask: *how big is this, really?* Most founders answer with theater: "the wellness market is worth $500 billion, and if we just capture 1%..." Nobody actually believes that math, including the person saying it, and you shouldn't either.

**Top-down numbers describe an industry. They say nothing about your business.**

Bill Aulet's Disciplined Entrepreneurship framework, taught at MIT, insists on the opposite approach: build your market size from the bottom up, one real number at a time.

**Three numbers, multiplied.**

How many people genuinely match your actual target customer — not a demographic bracket, but people who have this specific problem? What would one of them realistically pay you per year? And what slice of them could you plausibly reach in the next few years, given how you'll actually find them? Multiply the three together and you have an honest market size — one you built yourself and can defend.

Say you serve independent nutrition coaches in Portugal. Roughly 8,000 exist. Your product costs €30 a month, or €360 a year. That's a €2.9 million total addressable market — and reaching even 10% of it means €288K a year. Small? Perhaps, by venture-capital fantasy standards. ==Real? Completely, and defensible in a way "1% of $500 billion" never will be.== And it tells you something immediately actionable: with numbers like these, you either need to raise your price, widen the niche later once you've won this one, or both — decisions that top-down math can never hand you, because it never touched reality in the first place.

Here's the rule of thumb worth keeping: a bottom-up number you can walk someone through, line by line, beats a top-down number that merely impresses on a slide. Investors have heard "just 1% of a huge market" a thousand times and stopped believing it around the tenth. A founder who knows exactly how many real customers exist, and exactly what each one is worth — that's genuinely rare, and it shows the moment she opens her mouth.

You don't need a forty-tab spreadsheet for this. You need a napkin, three honest numbers, and the willingness to be conservative on purpose.`,
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
    courseId: 'launching',
    lessons: [
      {
        id: 'm3l1',
        type: 'text',
        kind: 'theory',
        title: "You can't build for everyone",
        body: `It feels safer to keep your audience wide — more people should mean more customers, shouldn't it? At the idea stage, it's almost exactly backwards.

**A product built for everyone delights no one in particular.**

The founders who actually win pick one specific group, fall in love with that group's problem specifically, and become the obvious, unmistakable choice for them first — before they ever think about anyone else. Bill Aulet's MIT framework has a name for this: your **beachhead market** — the single narrow front where you can win completely before expanding anywhere else.

It's the same instinct behind Peter Thiel's advice to dominate a small market entirely before going wide — own the beachhead first, then use it as a base. Counterintuitively, ==the narrower you go at the start, the faster you actually grow==, because a sharp message travels between people, while a vague one dies in every single conversation it's mentioned in. A delighted niche audience talks to itself; a mildly-satisfied general audience mostly stays quiet.

So in the exercises ahead, we're going to do something that will feel backwards, maybe even uncomfortable: make your intended audience deliberately smaller, on purpose, even though every instinct says to widen it. Not because a small audience is the destination — it's the fastest, cheapest way to become undeniably good at solving one real problem for one real kind of person, which is the only foundation anything bigger can later be built on.

Picking a beachhead isn't picking who you'll serve forever. It's picking who you'll serve *first*, completely, so well that they tell someone else without being asked. Every company you admire that now serves "everyone" started by serving a very specific someone extremely well, for quite a while, before they ever earned the right to widen out.`,
      },
      {
        id: 'm3l2',
        type: 'text',
        kind: 'theory',
        title: 'What makes a great first customer',
        body: `Not all customers are created equal at the start, and treating them as if they are is one of the quieter ways founders waste their first few months.

**Your ideal first customer usually shares four specific traits, and Bill Aulet's beachhead framework scores exactly this.**

Her pain is intense — felt often, and badly enough that she's actively looking for a fix rather than tolerating it. She's reachable — you can find her and get her on a call without a marketing budget, through a community, a group, a mutual connection. She can pay — there's real money or genuine value already changing hands around this problem, even informally. And she talks — she's connected to other people just like her, so a single delighted customer doesn't stay a secret for long.

==Miss any one of these four and the whole beachhead strategy quietly stalls.== A customer in severe pain who you can't reach is a headline, not a business. A reachable customer with mild pain will politely ignore you forever. A customer who talks constantly but can't pay teaches you things without ever paying you for them.

In the exercise just ahead, you'll sketch three genuinely different candidate customers — not three versions of the same person with different job titles — and we'll score each one honestly against exactly these four traits. Then, together, we'll help you decide who to try to win first. This isn't the audience you'll serve forever, and it doesn't need to be. It's simply the sharpest, most winnable front to start from — the one where all four traits line up well enough that you can move fast and learn even faster.`,
      },
      {
        id: 'm3l3',
        type: 'text',
        kind: 'theory',
        title: 'Interviews that tell the truth',
        body: `Here's an uncomfortable fact worth sitting with before you talk to a single real customer: most founder interviews are almost worthless, and it's not because the founder asked bad questions on purpose. It's because people are polite, and opinions about the future are free to give away.

**Describe your idea, and she'll say "oh, I'd definitely use that." Then she goes home and never thinks about it again.**

She wasn't lying to hurt you. Rob Fitzpatrick's *The Mom Test* names the trap precisely — the test being, could your own mother lie to you about your idea without even realizing she's doing it?

*"The Mom Test: talk about their life instead of your idea." — Rob Fitzpatrick, The Mom Test*

So we follow one discipline, without exception: talk about her actual life, never about your idea. Past behavior, not future promises. Not "would you use an app that plans dinners?" but "walk me through what actually happened at dinner last Tuesday." Not "would you pay for this?" but "what have you already tried, and what did it cost you — in money, in time, in patience?" ==What she actually did is real evidence. What she says she'd probably do is just noise dressed up as data.==

Three rules for the room, worth writing on a sticky note before your first call. Don't pitch — the second you start selling, honest information stops flowing entirely. Ask a genuinely open question, then go quiet and let the silence sit there; the best material almost always comes out after the pause, not during your question. And chase the emotion whenever you hear it — a sigh, a laugh, a sudden change in her tone of voice. "Tell me more about that" is, without exaggeration, the single most valuable sentence you'll use in this entire program.

You'll practice this craft first on friendly, low-stakes people before you ever run it on strangers. Getting comfortable with the discipline matters more, at this stage, than racking up a high number of conversations.`,
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
    courseId: 'launching',
    mentorSessionAfter: 'S1',
    lessons: [
      {
        id: 'm4l1',
        type: 'text',
        kind: 'theory',
        title: 'Fall in love with the problem, not the solution',
        body: `The single most common reason startups fail isn't bad luck, weak funding, or a clever competitor. Post-mortem studies of failed startups keep landing on the same answer, over and over: they built something nobody actually needed.

**It happens the same way almost every time — a founder falls in love with her solution and quietly stops checking whether the underlying problem is even real.**

So in this module, we flip the order deliberately. The problem is your constant. The solution is only ever your current best guess at fixing it — nothing more, nothing sacred about it. Clayton Christensen's framework makes the distinction sharp:

*"Customers don't buy products, they hire them to do a job." — Clayton Christensen, Jobs-to-be-Done*

Nobody genuinely wants a meal-planning app. She wants to stop feeling guilty and frantic at 6pm when dinner has once again become chaos. That underlying job is the truth of the situation. Your app is merely one possible way to get hired for it, and she'll fire you the instant something else does that job better, faster, or cheaper.

**Test your problem honestly against three bars before building anything on top of it.**

Intensity — is this a painkiller or a vitamin? Frequency — does it hurt weekly, or once a year and then get forgotten? And spend — is she already putting real money, time, or effort into dealing with it today? ==A problem that clears all three bars is worth years of your life. A problem that clears none of them will quietly kill even the most beautifully designed product built on top of it.==

You now hold something most founders skip straight past on their way to building: real interview data from actual conversations, not assumptions. In this module, we put the idea you originally arrived with on the table, right next to what real people actually told you — and we keep whatever survives contact with that evidence, and let the rest go without ceremony. That's not a step backward. It's the entire point of doing the work in this order.`,
      },
      {
        id: 'm4l2',
        type: 'text',
        kind: 'theory',
        title: 'Full life-cycle use case',
        body: `Most founders picture their product at exactly one moment — she opens the app, gets value, done. But that's a single frame lifted out of an entire film.

**Bill Aulet's MIT framework calls this the Full Life Cycle Use Case, and it insists you map every single stage.**

How does she first hear about you? How does she decide to actually try it, out of everything else competing for her attention that week? How does she get set up? How does she use it day to day, in the middle of an ordinary Tuesday? How does she pay? And — the stage almost everyone conveniently skips — how, or whether, she comes back, or tells someone else about it.

Here's why this matters more than it sounds like it should: ==most businesses don't die at "the product doesn't work."== They die quietly in the gaps *between* stages. She heard about you but couldn't figure out how to actually start. She loved using it but the payment step confused her at the exact wrong moment. She paid once, and then nothing ever brought her back a second time. Each transition between stages is a place a real, willing customer can fall off without you ever noticing why — and you genuinely cannot fix a gap you never bothered to map.

Walk through your own product this way, stage by stage, and ask honestly at each one: what does she actually, literally do here — and where might she quietly get stuck? You already have raw material for this sitting in your notes: your interviews already told you how she discovers and evaluates things roughly like yours today. Use exactly that, rather than guessing from scratch.`,
      },
      {
        id: 'm4l3',
        type: 'text',
        kind: 'theory',
        title: 'Sketch your product, not your tech',
        body: `Here's a trap founders fall into constantly, almost without noticing: describing the product by its technology instead of by the experience it creates. "An AI-powered platform with a recommendation engine" tells a real customer nothing whatsoever about her actual life. "You open it, tell it your problem, and get three matched options back in ten seconds" — that, she can picture clearly, without any translation required.

**Aulet's High-Level Product Spec asks for exactly that: what the product does and feels like, never what powers it underneath.**

Tech stack, architecture, which model you happen to be using — none of that belongs in this conversation. It belongs in a different room entirely, later, with different people — engineers, or investors doing technical diligence. Right now, in this exercise, you are describing an experience, full stop, and nothing else.

==A useful, quick test: could you sketch this on a napkin as a sequence of screens or moments, using zero jargon, and have a total stranger nod along without needing anything explained?== If the description genuinely needs an engineering background to follow, it isn't a product spec yet at all — it's a technical memo wearing a product's clothes, hoping nobody checks underneath.

Sketch the moments first: what she sees, what she taps, what changes for her immediately afterward. Save the technical stack, the architecture diagrams, and the "how it's actually built" conversation for later, with the people who genuinely need that information to do their jobs. Right now, your only job is making a stranger picture her own life changing — nothing about your code belongs in that picture yet.`,
      },
      {
        id: 'm4l4',
        type: 'text',
        kind: 'theory',
        title: 'Value in numbers: before and after',
        body: `"Makes life easier" doesn't sell anything to anyone. "Saves six hours a week" sells, every time, because one is a vague feeling and the other is a number she can immediately picture sitting inside her own actual calendar.

**Aulet's Quantified Value Proposition step exists purely to force that exact translation — from soft adjectives into hard arithmetic.**

The method itself is genuinely simple. Describe her life *before* your product: how she currently deals with this problem, and what it costs her today, in hours, in money, or in plain stress. Then describe her life *after*: what changes, measured in those exact same units, nothing fancier. Subtract one from the other. If she currently spends eight hours a week wrestling with something, and your product gets that down to two, that's "six hours a week back" — a sentence that survives being repeated out loud to an investor, to a skeptical partner, or to her own doubting brain at two in the morning.

==Don't invent these numbers sitting at your desk.== Pull them directly from what real people already told you in your interviews. A number that traces back to an actual conversation — "she told me, unprompted, that she spends about five hours a week on this" — will always beat a number you privately guessed at, because it's a number you can defend the instant someone pushes back on it, which someone eventually will.

This exercise is short on the page and heavy in what it does downstream: this exact quantified number becomes your pricing anchor in Module 5, the headline of your landing page in Module 6, and the first real line of your pitch deck much later on. Get it grounded in truth now, and every one of those later moments gets easier.`,
      },
      {
        id: 'm4l5',
        // Three-block evidence balance (SPEC_M4L5_THREE_BLOCK). Not Delegate/Mode C
        // anymore: the custom ProblemSolutionBlock owns For/Against/Conclusion + its
        // own per-block AI assists, so the generic exercise input & Delegate are off.
        delegatable: false,
        type: 'structured',
        kind: 'exercise',
        title: 'Problem–Solution check against your interviews',
        body: `The moment of truth: does what you believed in Module 1 survive contact with what real people told you in Module 3? Lay out what your interviews confirm, what they contradict or surprised you with, then decide — in your own words — what you're keeping and changing. The AI can help draft each part from your Brain, but the call is yours.`,
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
    courseId: 'launching',
    paid: true,
    lessons: [
      {
        // TODO: rewrite per spec — add "модель определяет продукт и цель года"
        id: 'm5l1',
        type: 'text',
        kind: 'theory',
        title: 'Ways your product makes money',
        body: `Let me tell you the thing about business models that took most of us embarrassingly long to see: your model isn't a detail you sort out later. It quietly decides everything — what product you build, how you talk to customers, even what your year looks like.

Here's the menu, roughly. Subscription: she pays monthly; you get predictable revenue but must earn her loyalty every single month. One-off purchase: simpler, but you're hunting new buyers forever. Marketplace or commission: you win when others transact — powerful, but you're building two audiences at once. Freemium: free brings the crowd, a few percent pay — works with big volumes, brutal with small ones. Services or productized services: money now, and it doesn't scale — which is completely fine as a starting bridge.

Now the part that matters. Bill Aulet's team at MIT treats choosing a model as its own deliberate step — because "a thousand women on a $15 subscription" and "six companies on a $10K contract" are different companies. Different product depth, different marketing, different pace, different you. Neither is better. But you can't be both at once, and pretending you can is how founders stay stuck.

By the end of this module you'll pick one — and turn it into a goal for the year.`,
      },
      {
        // TODO: rewrite per spec — add women-specific underpricing patterns
        id: 'm5l2',
        type: 'text',
        kind: 'theory',
        title: 'Price from value, not cost',
        body: `Pricing feels scary because most founders price from the wrong end. They add up their costs, add a modest margin, and hope nobody objects. Flip it. The right question is never "what does this cost me to make?" — it's "what is the change worth to her?"

You already did the hard part in Module 4: you quantified the before-and-after. If your product saves her six hours a week, or brings her three new clients a month, price against that. A rule of thumb the value-pricing world lives by: charge a fraction of the value you create — if she gains €1,000 a month, €100 is not expensive, it's obvious.

Now the sisterly truth, because the data backs it: women founders systematically underprice. We soften the number, add a discount before anyone asked, apologize with our pricing page. Here's the reframe — your price is a signal of what you believe your product does. A too-low price doesn't say "kind"; it says "unsure it works."

You don't have to guess. In this module's interviews you'll ask real people real money questions — what they pay today, what feels cheap, what feels steep. And remember: the easiest test in business is raising a price. If nobody flinches, you were too low.`,
      },
      {
        // TODO: rewrite per spec — merge LTV & CAC (old m8l1+m8l2) with North Star Metric intro
        id: 'm5l3',
        type: 'text',
        kind: 'theory',
        title: 'LTV, CAC & your North Star Metric',
        body: `Most founders track too many metrics. Revenue, downloads, signups, time-in-app, NPS — each individually feels important, but together they create noise. A North Star metric — the term Sean Ellis and the growth community coined — is the opposite: one number that captures the core value your product delivers to a real customer.\n\nThe best North Star metrics are leading (they predict future growth, not just record the past), value-reflecting (they move when a customer gets genuine value, not just when she opens the app), and measurable at your current stage (you can actually count it this week, not in six months).\n\n"Total downloads" is a vanity metric — it moves when you run ads, not when users get value. "Weekly sessions completed per active user" is a North Star — it moves when your product is genuinely working for her.\n\nAlongside your North Star sit two unit-economics numbers every model lives or dies by: LTV (what a customer is worth over her lifetime) and CAC (what she costs to acquire). In the exercises ahead you'll estimate both — and pick the one number that tells you everything.`,
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
    courseId: 'launching',
    paid: true,
    lessons: [
      {
        id: 'm6l1',
        type: 'text',
        kind: 'theory',
        title: 'Identify your riskiest assumptions',
        body: `Every business plan is really a stack of guesses wearing a suit. "Customers will pay $30/month." "She'll find us through Instagram." "She'll use this daily." Some of these guesses, if wrong, quietly cost you a few weeks. Others, if wrong, mean the whole business doesn't work — and you won't know which is which until you name them.

Aulet's framework asks you to list your key assumptions and rank them by how much damage a wrong answer would do, combined with how uncertain you actually are about it. The one assumption that's both high-risk and high-uncertainty — that's the one to test first, before you spend another hour building anything on top of it.

This is the same instinct behind Eric Ries's Lean Startup loop: don't build first and hope: identify the riskiest guess, design the cheapest possible test for it, and let reality answer before your calendar or your bank account has to. The exercise ahead asks you to do exactly that — rank your assumptions, and be honest about which one keeps you up at night.`,
      },
      {
        id: 'm6l2',
        type: 'text',
        kind: 'theory',
        title: 'Pretotyping: fake door, landing page, Wizard of Oz',
        body: `Alberto Savoia, who ran experimental innovation efforts at Google, coined a word that deserves to be more famous: pretotyping — testing whether people want a thing before you build the real thing, as opposed to prototyping, which tests whether the thing you already built works. The distinction is small in spelling and enormous in savings.

Three pretotyping moves worth knowing. Fake door: publish a page or button for a feature that doesn't exist yet, and see who clicks it — clicks are your demand signal, and nobody's been lied to, since you build it the moment enough people want it. Landing page test: a page describing the finished product with a signup or "notify me" button, run before a line of product code exists. Wizard of Oz: the customer experiences what looks like a working product, while behind the curtain, a human — usually you — does the work by hand.

This is exactly the spirit of Paul Graham's advice to "do things that don't scale": Airbnb's founders photographed apartments by hand; DoorDash's founders started with a landing page and a PDF menu, delivering orders themselves. None of it looks impressive. All of it is cheaper than building the wrong thing for six months.`,
      },
      {
        // TODO: rewrite per spec — merge MVBP (m10l1) + scope knife/no-code (m10l2) + "how AI changed the game"
        id: 'm6l3',
        type: 'text',
        kind: 'theory',
        title: 'What an MVBP is + the scope knife',
        body: `Forget "MVP" as an excuse to ship something embarrassing. The MIT framing is sharper — a Minimum Viable Business Product: the smallest thing that (a) genuinely delivers the value you promised, (b) someone pays for, and (c) teaches you something real. Payment is part of the definition, not a later milestone. Reid Hoffman's line still stings because it's true — if you're not a little embarrassed by version one, you shipped too late — but embarrassed about polish, never about value.

Getting there takes a knife, not a roadmap. List everything your product "should" do, then cut until what remains barely — barely — delivers the core change for your one persona. Every feature you keep delays the day a real customer teaches you something. When it hurts a little, you're close.

And here's your unfair advantage in 2026: building stopped being the bottleneck. With AI builders and no-code tools, a working landing page is an evening and a first product version is days — Harvard Business School students now ship working demos inside a one-week bootcamp. The scarce skill isn't code anymore; it's clarity — knowing exactly what the smallest valuable thing is. Which, after five modules of evidence, you have. Let's use it.`,
      },
      {
        id: 'm6l4',
        type: 'text',
        kind: 'theory',
        title: 'Anatomy of a landing page that converts',
        body: `A landing page is a story, not a brochure. Donald Miller's StoryBrand structure: your customer is the hero, her problem is the villain, you are the guide with a plan, and one clear call to action. Message-match matters most — the words on your page must mirror the words your persona uses about her own pain.`,
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
    courseId: 'launching',
    paid: true,
    lessons: [
      {
        id: 'm7l1',
        type: 'text',
        kind: 'theory',
        title: 'The path to a paying customer',
        body: `Between "she has the problem" and "she paid you" sits an entire process — and it's rarely a straight line. Aulet's framework asks you to map it explicitly: how does the budget for something like this normally get approved? How long does the decision usually take — an impulse buy, or a multi-week deliberation? What has to happen, and in what order, before money actually moves?

This matters because the path shapes everything downstream. A product that gets bought on impulse needs a completely different site, pitch, and sales motion than one that requires her to convince a partner or clear a budget line first. Founders who skip this step often build a beautiful checkout page for a decision that, in reality, takes three weeks and two conversations to reach.

You have real material for this already — your interviews likely surfaced how she buys things like this today, what gives her pause, and who else gets consulted. Map the real path, friction and all, rather than the path you'd prefer she took.`,
      },
      {
        id: 'm7l2',
        type: 'text',
        kind: 'theory',
        title: 'Who really decides',
        body: `A quiet way founders waste months: pitching the right message to the wrong person. Aulet's Decision-Making Unit (DMU) framework breaks a "customer" into the distinct roles actually involved in a purchase — because in most real situations, more than one person matters, even when it's not obvious at first.

The roles worth naming: the champion (who wants this and will push for it), the end user (who'll actually use it day to day — sometimes the same person as the champion, sometimes not), the economic buyer (whoever's money it actually is — herself, a partner, a manager), and anyone who can veto the whole thing even if everyone else says yes.

For a solo consumer buying with her own card, all four roles might collapse into one person — worth saying explicitly rather than assuming. But the moment a partner, a household budget, or a boss enters the picture, treating them as one person leads you to build a pitch that convinces the wrong half of the room. Name every role in your DMU before you write a single word of sales copy.`,
      },
      {
        id: 'm7l3',
        type: 'text',
        kind: 'theory',
        title: '19 channels, pick 2',
        body: `There are only ~19 acquisition channels in existence — and at your stage you can win on at most two. Gabriel Weinberg's Bullseye method (from his book Traction): brainstorm all, shortlist the promising, test cheaply, double down on what works. And remember Paul Graham's law of the early stage: do things that don't scale.`,
      },
      {
        id: 'm7l4',
        type: 'text',
        kind: 'theory',
        title: 'CJM & retention: the leaky bucket',
        body: `Acquisition without retention is pouring water into a leaky bucket. Map the journey with Dave McClure's AARRR framework — Acquisition, Activation, Retention, Referral, Revenue — and find where users leak out. Fixing the biggest leak is almost always cheaper than buying more traffic.`,
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
    courseId: 'launching',
    paid: true,
    lessons: [
      {
        id: 'm8l1',
        type: 'text',
        kind: 'theory',
        title: 'The founder is the first salesperson',
        body: `Nobody can sell your product before you can — not an agency, not a "growth hire." Founder-led sales, as Clever founder Tyler Bosmeny puts it, is a simple pipeline: prospecting (finding the right people), conversations (understanding their pain), closing (asking for the deal). You already did the hardest part in discovery; sales is discovery with an ask at the end.`,
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
        body: `As Bosmeny teaches it, sales is a numbers game long before it's a craft. Ten conversations beat one perfect pitch. Two rules produce most early revenue: make the explicit ask ("would you like to start this week?"), and follow up — most deals close on the 3rd–5th touch, exactly where most founders give up.`,
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
    courseId: 'launching',
    paid: true,
    mentorSessionAfter: 'S2',
    lessons: [
      {
        id: 'm9l1',
        type: 'text',
        kind: 'theory',
        title: 'Three numbers that matter: traction · product · cash',
        body: `MIT's delta v accelerator strips it down to this: at this stage your business is three numbers. Traction — is the count of people getting value growing? Product — do they come back? Cash — how many months of runway do your habits buy you? Everything else is commentary.`,
      },
      {
        id: 'm9l2',
        type: 'text',
        kind: 'theory',
        title: 'Funnel & conversions: vanity vs real metrics',
        body: `Eric Ries's "vanity metrics" — followers, impressions, app downloads — feel great and predict nothing. Real metrics live in the funnel: visitor → signup → activated → paying → retained, each with a conversion rate. One honest funnel table tells you more than any dashboard of vanity charts.`,
      },
      {
        // TODO: rewrite per spec — moved from old m11l2; add Sean Ellis PMF test
        id: 'm9l3',
        type: 'text',
        kind: 'theory',
        title: 'Retention & habit formation',
        body: `Of every metric you own, this one is the most honest: do people come back? Anyone can be persuaded to try something once — curiosity, politeness, a good landing page. Returning is different. Returning means it worked.

The tool here is the cohort curve. Take everyone who started in a given week and watch what fraction is still active one week later, two, four. The curve always drops at first — normal, universal, fine. The question is what it does next. If it keeps sliding toward zero, the bucket leaks and growth would just be expensive water. If it flattens — some stable group stays and uses — congratulations: those people found real value. A flattening retention curve is the closest thing early-stage life has to proof of product-market fit.

Want a second opinion on fit? Sean Ellis — the man who coined "growth hacking" — uses one survey question: "How would you feel if you could no longer use this product?" When 40%+ answer "very disappointed," you're onto something; below that, keep tuning who it's for or what it does. Ask your actives this week — it takes an hour and removes a lot of self-deception.

And if the numbers are small — five users, eight? Then retention is conversations, not curves: you can simply ask each one whether it's working. Smallness is an advantage here. Use it.`,
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
    courseId: 'launching',
    paid: true,
    lessons: [
      {
        id: 'm10l1',
        type: 'text',
        kind: 'theory',
        title: 'Focus, energy, burnout',
        body: `You are the company's scarcest resource. Paul Graham's maker-time and manager-time don't mix — batch them. Energy management beats time management, especially when the startup shares your day with family. Burnout is a systems failure, not a willpower failure; design the system.`,
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
    courseId: 'launching',
    paid: true,
    lessons: [
      {
        id: 'm11l1',
        type: 'text',
        kind: 'theory',
        title: 'The fork: decide from data, not emotion',
        body: `Every founder reaches this fork: push harder on the current path, or change it. Premature scaling — pouring fuel on an engine that doesn't run — is, per Startup Genome's research across thousands of startups, the #1 startup killer. The antidote is deciding from your numbers (M9), not from hope, fear, or sunk cost.`,
      },
      {
        id: 'm11l2',
        type: 'text',
        kind: 'theory',
        title: 'Types of pivot: changing course ≠ failure',
        body: `Eric Ries catalogued them: zoom-in pivot (one feature becomes the product), customer-segment pivot (same product, truer audience), channel, revenue-model, and more. Slack was a game studio; Shopify was a snowboard shop. A pivot keeps one foot on what you've learned and moves the other.`,
      },
      {
        id: 'm11l3',
        type: 'text',
        kind: 'theory',
        title: 'Scale only what repeats',
        body: `Scale is for engines that already repeat: customers arrive predictably, they stay, and LTV:CAC is healthy (≥3 as a rule of thumb). The PMF checklist first, then pour fuel — and expand from your beachhead to adjacent segments — Aulet's "follow-on markets" — not to "everyone."`,
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
    courseId: 'launching',
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
        body: `See the round through the investor's eyes: they buy a slice of a future outcome, so they underwrite team, market, and momentum. The instruments: Y Combinator's SAFE (simple, deferred pricing), priced rounds (valuation now), and the term-sheet clauses that actually matter — dilution, pro-rata, liquidation preference.`,
      },
      {
        // TODO: rewrite per spec — merge old m12l1 storytelling + m12l2 deck structure; Sequoia structure
        id: 'm12l3',
        type: 'text',
        kind: 'theory',
        title: 'Founder storytelling & the deck that works',
        body: `Here's what investors actually buy at your stage — because the spreadsheet can't prove much yet: a founder who sees something clearly, and evidence she turns insight into motion. Your story delivers the first; your traction slide delivers the second.

The story isn't biography — it's logic with you inside it: I lived this problem → I went and verified it was real (your interviews!) → here's what I found that others miss → here's the proof people want it → here's why it gets big. Ron Conway, who backed Google early, insists you should manage the two-sentence version: what you do, why it wins. If a stranger can't repeat your idea after hearing it once, the deck won't save it.

The deck itself — the Sequoia-shaped skeleton the whole industry speaks: problem → solution → why now → market size → product → traction → business model → competition → team → the ask. Ten-ish slides, one idea each, readable without you narrating (decks travel; you won't be in the room when partners re-read it).

At your stage, traction is the star slide: your interviews, your conversions, your first payment screenshot, your retention signal. It's the slide that says "this founder doesn't wait for permission" — which, between us, is the whole pitch.`,
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
