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
// Theory bodies below are the finalized lecture texts (CONTENT_M0-M4/M5-M12_LECTURES_V2 pass).
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
        body: `Want the full picture without weeks of desk work? Our done-for-you Market Research covers: market size and trends for your exact niche, a competitor map, gap analysis, and "where your window is." Delivered as a document straight into your Brain — part of your program subscription.`,
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
        body: `*Framework: MIT Disciplined Entrepreneurship, Step 6 (Bill Aulet).*

Most founders picture their product at exactly one moment — she opens the app, gets value, done. But that's a single frame lifted out of an entire film.

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
        body: `*Framework: MIT Disciplined Entrepreneurship, Step 7 — High-Level Product Specification (Bill Aulet).*

Here's a trap founders fall into constantly, almost without noticing: describing the product by its technology instead of by the experience it creates. "An AI-powered platform with a recommendation engine" tells a real customer nothing whatsoever about her actual life. "You open it, tell it your problem, and get three matched options back in ten seconds" — that, she can picture clearly, without any translation required.

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
        body: `*Framework: MIT Disciplined Entrepreneurship, Step 8 — Quantify the Value Proposition (Bill Aulet).*

"Makes life easier" doesn't sell anything to anyone. "Saves six hours a week" sells, every time, because one is a vague feeling and the other is a number she can immediately picture sitting inside her own actual calendar.

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
      {
        // The Founder's Case (SPEC_PAYWALL §0) — last block of M4, free, not scored.
        // A milestone reveal (like m0l5) generated from her Brain; its CTA opens the paywall.
        id: 'm4l10',
        type: 'text',
        kind: 'system',
        title: "The Founder's Case",
        body: `You've done what most people only talk about: sharpened an idea, sized a market, talked to real people, and tested your hypothesis against what they actually said. Before you go on, take a moment to see the whole picture — your vision, your proof, and what it could become.`,
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
        id: 'm5l1',
        type: 'text',
        kind: 'theory',
        title: 'Ways your product makes money',
        body: `Two founders can build the exact same product and end up with completely different companies — because the way you charge shapes almost everything downstream. So before you fall in love with a price, let's look at the shapes money can take.

**The handful of models you're actually choosing between.**

Subscription (she pays every month for ongoing value). One-off purchase (she pays once). Marketplace or commission (you take a cut of a transaction between two other people). Freemium (free to start, pay to unlock). Services or retainer (you're paid for your time or ongoing work). Most businesses are really one of these with a twist — not a clever hybrid of all five.

Bill Aulet, who teaches this at MIT, treats picking your model as its own deliberate step, not an afterthought — because the choice quietly decides what you build next.

**Here's the part most first-timers miss: your model decides your product and your goal for the year.**

==A business built on "many customers paying a little, forever" is a fundamentally different company from one built on "a few customers paying a lot."== The first needs retention, low-touch onboarding, and volume — so you'll build a self-serve product and chase a big audience. The second needs deep relationships and high service — so you'll build something more hands-on and chase fewer, better-fit clients. Same idea, two different products, two different daily lives for you.

That's why we do this now, before the MVP: the model you pick in the next exercise sets the target you'll aim at all program long. Pick "subscription" and your year is about active, retained subscribers. Pick "high-ticket service" and it's about a handful of signed clients. Neither is better — but building for one while secretly wanting the other is how founders spin in circles for a year.

So don't pick the model that sounds most impressive. Pick the one that fits how your customer actually wants to pay, and the life you actually want to run. We'll pressure-test that fit in the exercise.`,
      },
      {
        id: 'm5l2',
        type: 'text',
        kind: 'theory',
        title: 'Price from value, not cost',
        body: `Let's talk about the number that scares founders more than any other: price. Most people set it by adding up what it costs them to make, then tacking on a margin. That feels safe and logical. It also leaves most of your money on the table.

**Price from the value you create, not the cost you incur.**

Bill Aulet's framework is blunt about this: your price should reflect a fair slice of the value the customer gets, not a markup on your expenses. If your product saves her six hours a week, or spares her a £400 mistake, the cost of your ingredients is irrelevant to what that's worth to her. Cost-plus pricing anchors you to the wrong number entirely — your costs — when the only number that matters is what the outcome is worth to her.

Think of it as a range with two walls. The floor is your cost (below it, you lose money). The ceiling is the value she gets (above it, she won't pay). ==Cost-plus pricing hugs the floor. Value-based pricing lives up near the ceiling — and the gap between them is often 3× or 5×.==

Now the harder, more personal part — and it hits women founders hardest, so let's name it directly.

*"You have to be willing to charge what you're worth — and most women systematically don't." — a pattern seen across founder coaching, again and again*

The most common pricing mistake first-time founders make isn't charging too much. It's charging too little, "to be safe," "to be nice," "until I'm sure it's good enough." Underpricing feels humble and generous. In practice it does three quiet kinds of damage: it starves the business of the money it needs to survive, it signals to customers that the product is cheap and probably not very good, and it attracts the most demanding, least loyal buyers — the ones who only ever cared about price.

A price is a message about value before it's a transaction. Set it too low and you've told her, before she's even tried it, that it isn't worth much.

You don't have to get this perfect today — you have zero real pricing data yet, and that's fine. The exercise ahead is about picking a starting price anchored to value, not cost, and holding it a little higher than feels comfortable. The market, in the modules ahead, will tell you if you were wrong — and it's far easier to lower a price than to raise one.`,
      },
      {
        id: 'm5l3',
        type: 'text',
        kind: 'theory',
        title: 'LTV, CAC & your North Star Metric',
        body: `Most founders drown in metrics. Revenue, downloads, signups, time-in-app, followers, NPS — each one feels important, and together they turn into noise you can't act on. Let's cut through it with three numbers that actually run a business.

**Your North Star: the one number that captures real value delivered.**

A North Star metric — a concept Sean Ellis and the growth community named — is the single number that goes up when your customer genuinely gets what she came for. Not when she opens the app. Not when you run an ad. When she gets *value*.

The test for a good one: it's *leading* (it predicts future growth, not just records the past), it's *value-reflecting* (it moves on genuine use, not vanity), and it's *countable now* (this week, not in six months). "Total downloads" fails — it moves when you spend on ads, whether or not anyone gets value. ==A North Star like "weekly sessions completed per active user" passes — it can only go up when the product is actually working for her.==

**Two more numbers every model lives or dies by: LTV and CAC.**

LTV — lifetime value — is what one customer is worth to you over the whole time she stays. CAC — customer acquisition cost — is what it costs you to win her in the first place. The relationship between them is the closest thing early-stage business has to a law of physics:

*If it costs more to win a customer than she's ever worth to you, no amount of growth saves you — you just lose money faster.*

The rough rule of thumb people quote is LTV should be at least 3× CAC. Don't treat that as gospel, especially now — at the idea stage your numbers will be shaky and probably below it, and that's completely normal. The point isn't to hit a magic ratio today. It's to start seeing your business as an engine: money in to win her, more money back over her lifetime, and the gap between those two is whether you have a company or an expensive hobby.

You'll estimate LTV and CAC roughly in the exercises — "roughly" is the operative word, honest guesses beat fake precision. And you'll pick your North Star: the one number you'll report every single week from here on. Choose it well, because a founder who watches the right number, and only that number, moves faster than one drowning in a dashboard of twenty.`,
      },
      {
        id: 'm5l4',
        delegateMode: 'C', // RULES §2.4: 2 scenarios w/ trade-offs; choice+defense hers
        type: 'input',
        kind: 'exercise',
        title: 'Your business model',
        body: 'Choose and justify your revenue model — how you make money and why it fits how your customer buys.',
        inputPrompt: 'Name your business model (subscription / transaction / freemium / other) and defend it in writing: why THIS model fits your customer\'s buying behavior better than the alternatives.',
        inputPlaceholder: 'My model is [subscription / transaction / freemium / other] because…',
      },
      {
        id: 'm5l5',
        delegateMode: 'C', // RULES §2.4: 2 scenarios (mass vs premium), assumptions visible; she picks
        type: 'input',
        kind: 'exercise',
        title: 'Unit economics v1',
        body: 'Calculate the fundamentals: what a customer costs to acquire (CAC), what she generates over her lifetime (LTV), and what that ratio tells you. The mentor will flag your shakiest assumptions.',
        inputPrompt: 'Estimate your LTV (lifetime revenue per customer) and CAC (cost to acquire one customer). Show your assumptions. What is the LTV:CAC ratio, and what does it tell you about your model\'s health?',
        inputPlaceholder: 'My LTV is about … and CAC about … , so the ratio is … , which tells me…',
      },
      {
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
        body: `Every plan you have is really a stack of guesses wearing a suit. "Customers will pay £30 a month." "She'll find us on Instagram." "She'll use this every week." Some of these guesses, if wrong, cost you a few days. Others, if wrong, mean the whole business doesn't work — and the trap is that they all look equally confident sitting in your head.

**Find the guess that, if wrong, kills everything — and test that one first.**

Bill Aulet's framework asks you to list your key assumptions and rank them on two axes at once: how much damage a wrong answer does, and how uncertain you actually are about it. The assumption that's both *high-damage* and *high-uncertainty* is your riskiest — and it's the one to test before you build a single thing on top of it.

==Founders love to test the easy, comfortable assumptions first — the ones they're pretty sure will pass. That's procrastination dressed up as progress.== The whole point is to go straight at the scary one, the one you've been quietly avoiding because you're afraid of the answer.

This is the core instinct behind Eric Ries's Lean Startup loop:

*"The only way to win is to learn faster than anyone else." — Eric Ries, The Lean Startup*

Don't build first and hope the market agrees. Name the guess that everything depends on, design the cheapest possible test for it, and let reality answer before your calendar and your bank account have to. A month spent testing your riskiest assumption is a month; a year spent building on top of a wrong one is a year.

For most first-time founders, the riskiest assumption is hiding in the same place: *will she actually pay for this?* It's the one people most want to assume and least want to test — which is exactly why it usually belongs at the top of the list.

The exercise ahead asks you to write your assumptions down and rank them honestly. Be brave about which one goes at number one — the point of this whole module is to test it before it's expensive.`,
      },
      {
        id: 'm6l2',
        type: 'text',
        kind: 'theory',
        title: 'Pretotyping: fake door, landing page, Wizard of Oz',
        body: `There's a word that deserves to be far more famous than it is: **pretotyping**. Alberto Savoia, who ran experimental innovation work at Google, coined it to name the thing you should do *before* you prototype — test whether people actually want the thing, before you spend weeks building the thing.

**Prototyping asks "can we build it?" Pretotyping asks the cheaper, scarier question: "will anyone want it?"**

Three moves worth knowing by name. **The fake door**: put up a button or a page for a feature that doesn't exist yet, and count who clicks. Nobody's been deceived — you build it the moment enough people show they want it. **The landing page test**: a page describing the finished product with a "notify me" or pre-order button, live before a single line of product code exists. **The Wizard of Oz**: the customer experiences what looks like a working product, while behind the curtain a human — usually you — does the work by hand.

==The genius of all three is that they buy you real demand signal for a fraction of the cost of building the real thing.==

This is exactly the spirit of Paul Graham's most-quoted advice to early founders:

*"Do things that don't scale." — Paul Graham, Y Combinator*

DoorDash's founders started with a landing page and some PDF menus, delivering the food themselves. Airbnb's founders photographed apartments by hand, one at a time. None of it looked impressive or scalable, and none of it was meant to — it was the cheapest possible way to find out whether the idea had a pulse before betting a year on it.

The mindset shift is the whole lesson: your job right now is not to build a product. It's to buy the maximum amount of learning for the minimum amount of effort. A fake door you set up this afternoon can save you three months of building the wrong thing.

In the exercises you'll pick which pretotype fits your riskiest assumption — and design the cheapest version of it you can run this week.`,
      },
      {
        id: 'm6l3',
        type: 'text',
        kind: 'theory',
        title: 'What an MVBP is + the scope knife',
        body: `Let's clear up the most misused phrase in startups: MVP. Most people hear "minimum viable product" and build a sad, half-broken version of their full idea. That's not it. Let's use a sharper version instead.

**MVBP: the Minimum Viable *Business* Product.**

Bill Aulet's framing adds one crucial word — *business*. An MVBP is the smallest thing that does three jobs at once: it delivers real value to the customer, she pays for it (or clearly could), and you learn something from shipping it. ==That middle part is what separates it from a demo — if there's no way money could change hands, it's a prototype, not an MVBP.==

The instinct will be to build more "just to be safe." Fight it with what I'll call the scope knife: for every feature, ask "if I cut this, does the core value still work?" If yes, cut it. Cut until it hurts, then cut once more. Reid Hoffman put the standard perfectly:

*"If you're not embarrassed by the first version of your product, you've launched too late." — Reid Hoffman, LinkedIn founder*

The reason to be ruthless isn't laziness — it's speed of learning. Every feature you add before launch is a guess you're spending days to build without knowing if anyone wants it. The leanest thing that can still deliver value and take money is the fastest possible way to find out if you're right.

**And here's what genuinely changed the game: building is no longer the hard part.**

AI and no-code tools have collapsed the cost of shipping a first version. A landing page in an evening. A working prototype in days. Things that used to need a developer and a month now need you, an afternoon, and the right tools. This flips where your effort should go: ==the bottleneck is no longer "can I build it" — it's "do I know exactly what to build, and for whom."== The clarity you've earned over the last five modules — your persona, your validated problem, your quantified value — is precisely what tells the AI what to build. Founders without that clarity just generate beautiful, useless things faster.

So the scope knife matters more than ever, not less. When building is cheap, the temptation to build everything is huge — and the discipline to build only the core loop is what separates founders who ship and learn from founders who tinker forever.

The exercise: define your MVBP — the smallest thing that delivers value and can take money — and name everything you're deliberately leaving out.`,
      },
      {
        id: 'm6l4',
        type: 'text',
        kind: 'theory',
        title: 'Anatomy of a landing page that converts',
        body: `Your landing page is not a brochure about your product. It's a story — and in that story, there's one rule that decides whether it works: your customer is the hero, not you.

**She's the hero. Her problem is the villain. You're the guide with a plan.**

This is Donald Miller's StoryBrand structure, and it fixes the most common landing-page mistake: making the page about how great you and your product are. Nobody's the hero of your story except her. Your job on the page is to show that you understand her problem better than anyone, and to hand her a clear plan to defeat it.

The skeleton that works, top to bottom: a headline naming the result she wants, the problem she's living with, your solution as the plan, proof that it's real, and one — exactly one — clear call to action. ==Two competing buttons is the same as no button; a confused visitor does nothing.==

But the single highest-leverage thing on the whole page isn't the layout. It's the words — specifically, whether they match hers.

*Message-match: the language on your page should mirror the exact words your customer uses about her own pain.*

If your interviews surfaced "I never know if it's safe to paddle out," then your headline is close to "know if it's safe before you paddle out" — not "advanced marine condition analytics." You did the hard work of collecting her real words back in Module 3; this is where they pay off. When a visitor reads her own thought on your page, something clicks — *these people get me* — long before she's evaluated a single feature.

Keep it honest, too. Proof means something true and specific — a real quote, a real number, your own story — not a placeholder "trusted by thousands" you can't back up.

In the exercise you'll draft your own page against this skeleton, pulling your headline straight from your customer's mouth. We'll assemble it from your Brain, and you'll edit until it sounds like something a real person would say to another real person.`,
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
        body: `Between "she has the problem" and "she paid you" sits a whole journey — and it's almost never the straight line founders imagine. Mapping it honestly is what separates a marketing plan that works from one that just spends money.

**Trace the real path from stranger to payment — friction and all.**

Bill Aulet's framework asks you to lay out, step by step, how someone actually becomes a paying customer. How does she first hear about you? What makes her curious enough to look closer? What has to happen before she trusts you with money? How long does the whole thing realistically take — minutes, or weeks?

==The length and shape of this path decides almost everything downstream about how you sell.== A £6 impulse buy and a £6,000 considered purchase are completely different journeys, and a product built for one will fail selling the other. If her real path involves checking with a partner, comparing three options, and sleeping on it, then a beautiful one-click checkout solves a problem she doesn't have — the friction is upstream, in trust and consideration, not at the payment button.

Founders love to design for the path they *wish* she took — see it, love it, buy it. The useful exercise is mapping the path she *actually* takes, including the boring, annoying, human parts: the hesitation, the "let me think about it," the checking of reviews.

You already have real material for this. Your interviews back in Module 3 probably surfaced how she buys things like yours today — what makes her hesitate, who else she consults, what finally tips her over. Use that, not a fantasy.

In the exercise you'll map your customer's real path to payment, and mark the one or two steps where you're most likely to lose her. Those friction points are where your acquisition effort should actually go — not into shouting louder at the top, but into unsticking the place people quietly fall off.`,
      },
      {
        id: 'm7l2',
        type: 'text',
        kind: 'theory',
        title: 'Who really decides',
        body: `Here's a quiet way founders waste months: sending exactly the right message to exactly the wrong person. The fix is to stop thinking of "the customer" as one person, and start seeing the roles actually involved in a yes.

**Most purchases involve more than one role — even when it looks like one person.**

Bill Aulet calls this the Decision-Making Unit, the DMU. The roles worth naming: the *champion* (who wants this and pushes for it), the *end user* (who'll actually use it day to day), the *economic buyer* (whose money it actually is), and anyone with a *veto* (who can kill it even if everyone else says yes).

Sometimes all four collapse into one woman buying with her own card — and even then, it's worth saying so out loud rather than assuming. ==Because the moment a partner, a household budget, or a boss enters the picture, "the customer" quietly splits into several people with different worries — and a pitch aimed at one of them can lose the others.==

A concrete example: you're selling a premium subscription, and the end user loves it — but the economic buyer is her partner, who only sees the line on the bank statement. If your entire message speaks to the user's delight and never addresses the buyer's "is this worth it," you'll get enthusiastic users who somehow never convert. The champion needs ammunition to win the internal argument you never see.

*Sell to the whole room, not just the person who raised their hand first.*

This isn't about making simple consumer sales complicated. If it genuinely is one person deciding with her own money, name that and move on — don't invent enterprise complexity that isn't there. The skill is matching the effort to the reality: know exactly who has to say yes, and what each of them needs to hear.

In the exercise you'll map your own DMU — every role in a real purchase decision — so your marketing and sales aim at the people who actually decide, not just the ones who use.`,
      },
      {
        id: 'm7l3',
        type: 'text',
        kind: 'theory',
        title: '19 channels, pick 2',
        body: `Ask a first-time founder how she'll get customers and you'll usually hear "social media, word of mouth, maybe some ads" — a vague fog. The founders who actually get traction do the opposite: they get specific, and they get narrow.

**There are only a handful of ways to reach customers — and at your stage, you can win at two.**

Gabriel Weinberg, in his book *Traction*, catalogued nineteen distinct acquisition channels — from SEO and content to paid ads, partnerships, events, cold outreach, PR, and more. His key insight isn't the list; it's that ==most startups die not because they picked a bad channel, but because they spread themselves thinly across six and got traction in none.==

His method for choosing is called the Bullseye: brainstorm every channel that *could* work, pick the two or three most promising to actually test, run cheap experiments, and then pour your energy into the one that's clearly working. Two focused channels beat six half-hearted ones, every time.

And at your stage specifically, there's a second rule that overrides the first:

*"Do things that don't scale." — Paul Graham, Y Combinator*

Your first ten, twenty, fifty customers almost never come from a clever scalable channel. They come from you, personally: messaging people one at a time, showing up in the communities where your persona already gathers, doing the unglamorous manual outreach that no growth playbook would call efficient. It doesn't scale — and it's not supposed to. It's how you learn what actually makes someone say yes, before you spend a penny trying to automate it.

So resist the pull toward "let's run some ads and see." Ads are a scalable channel for a business that already knows what converts — not a discovery tool for one that doesn't.

In the exercise you'll shortlist channels against your actual persona and budget, pick two to test, and — importantly — write a real hypothesis for each: what result you expect, for what effort. A test with no expected number isn't a test; it's just hoping in public.`,
      },
      {
        id: 'm7l4',
        type: 'text',
        kind: 'theory',
        title: 'CJM & retention: the leaky bucket',
        body: `Here's an image worth burning into your brain before you spend a single pound on getting customers: a bucket with holes in it. You can pour water in the top as fast as you like — if it's leaking out the bottom, you never fill it.

**Acquisition without retention is pouring water into a leaky bucket.**

Before you optimise how people arrive, you have to know where they leak out — and for that you map the whole journey. Dave McClure's framework, memorably nicknamed "pirate metrics" (AARRR), lays it out as stages: Acquisition (she finds you), Activation (she gets her first real value), Retention (she comes back), Referral (she tells others), Revenue (she pays). Each stage has a drop-off, and ==the biggest leak is almost always cheaper to fix than buying more traffic to pour over it.==

The reason retention sits at the center of everything traces to a hard truth from one of the best growth minds around:

*"The single most important thing for growth is retention." — Alex Schultz, VP of Growth at Meta*

His point is brutal and freeing at once: if people don't come back, growth is a treadmill — you run faster and faster just to stay level, because every new customer is quietly replacing one who left. But if they *do* come back, growth compounds, because you're building on a base that stays instead of refilling one that drains.

This is why, at the idea stage, chasing more traffic is usually the wrong instinct. If ten people try your thing and nine never return, the problem isn't the top of the funnel — it's the product or the fit, and pouring in a hundred more people just wastes them faster.

In the exercise you'll map your customer's journey across these stages and find your biggest leak — the one place people fall out. Fixing that is almost always the highest-leverage move you can make, and it's nearly free compared to buying your way around it.`,
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
        body: `Let's start with a fact that trips up almost every first-time founder: nobody can sell your product before you can. Not an agency, not a "growth hire," not a clever funnel. At the start, sales is your job — and that's not a burden, it's an advantage.

**Founder-led sales is a simple pipeline: prospecting, conversations, closing.**

Tyler Bosmeny, who built Clever and taught this in Y Combinator's startup course, breaks it into three plain stages. *Prospecting* — finding the right people to talk to. *Conversations* — understanding their situation deeply enough to know if you can help. *Closing* — actually asking for the sale. That's it. No dark arts, no manipulation.

And here's the reframe that should take the pressure off:

*"In the early days, sales is just talking to your customers." — Tyler Bosmeny, Clever*

==You already did the hardest part of selling back in Module 3 — you learned to have honest conversations with real people about their problems.== Sales is that exact same skill, with one thing added at the end: an ask. You're not becoming a different, pushier person. You're doing customer discovery with a door held open for a yes.

Why must it be *you*, personally, and not someone you hire? Because early sales isn't really about revenue — it's about learning. Every conversation teaches you which words land, which objections keep coming up, what she actually cares about versus what you assumed. That learning is the raw material for your entire go-to-market, and it can't be delegated before you've extracted it yourself. Hire a salesperson too early and you outsource the most important learning in the company to someone who'll quit the moment it's hard.

There's also a quiet truth here: nobody will ever sell your product with the conviction you have, because nobody else has lived the problem the way you have. That conviction is your edge in a sales conversation, and it's precisely what a hired gun lacks in month one.

In the exercises you'll build your simple pipeline and your first script — and then, out in the real world, you'll actually use them. The goal of this module isn't theory. It's your first paying customer.`,
      },
      {
        id: 'm8l2',
        type: 'text',
        kind: 'theory',
        title: "You're not selling — you're helping",
        body: `Let's name the thing that stops more founders than rejection ever will: the fear of being "salesy." That cringe, that reluctance to ask for money, that voice saying *I don't want to be pushy* — it kills more early businesses than bad products do. And it hits women founders hardest, so let's deal with it head-on.

**If your product genuinely solves her problem, NOT offering it is the failure.**

Here's the reframe, and it's not a motivational trick — it's literally true. Selling, done right, is matching a real problem with a real solution, at an honest price. ==If you've done the work of the last seven modules — validated a real pain, built something that genuinely helps — then staying quiet about it isn't humility. It's withholding help from someone who needs it.==

Picture it concretely. Someone in front of you is struggling with exactly the problem you've spent months learning to solve. You have the answer. "Being polite" and not mentioning it doesn't protect her — it just leaves her stuck. The pushy thing would be selling something that *doesn't* help. Offering something that does is a gift you're afraid to hand over.

*People don't resent being sold something they need. They resent being sold something they don't.*

The whole discomfort dissolves the moment you're honest about value. If you secretly suspect your product isn't worth the price, no sales technique will fix that — and the answer is to make the product better, not to sell harder. But if you know it helps, then confidence isn't arrogance; it's just accuracy.

And there's a specific pattern worth naming for women founders: the instinct to over-apologise, to undercharge, to soften the ask until it disappears. "Only if you want to, no pressure, totally fine if not" — said so many times that she talks the customer out of a yes. You're allowed to believe your work is worth paying for. Said plainly, without apology, that belief is often what tips someone into buying.

In the next lessons and out in the real world, you'll practice the ask itself. This lesson is the mindset underneath it: you're not extracting money. You're offering help, honestly priced, to someone who needs it.`,
      },
      {
        id: 'm8l3',
        type: 'text',
        kind: 'theory',
        title: 'The funnel math: volume beats perfection',
        body: `Founders love to obsess over the perfect pitch — the ideal wording, the flawless deck — while making almost no actual sales calls. It's backwards. Early sales is a numbers game long before it's a craft, and understanding that takes enormous pressure off every single conversation.

**Ten real conversations beat one perfect pitch.**

As Tyler Bosmeny teaches it, sales at the start is fundamentally about volume and iteration. You don't discover the right pitch by thinking harder in a room; you discover it by having twenty conversations and noticing what keeps working. ==Any single "no" barely matters when you've got nineteen more conversations lined up — and it's the reps, not the polish, that teach you the pitch.==

That reframe matters because it removes the fear. A rejection isn't a verdict on you or your business; it's one data point in a funnel, and the funnel only works if you feed it enough volume.

Two habits produce most of the early revenue founders leave on the table.

*First: make the explicit ask.* An astonishing number of founders have a great conversation, the customer is interested, and then... they never actually ask her to buy. "Would you like to start this week?" — the plain, slightly scary question — is the difference between a nice chat and a sale. If you don't ask, the answer is always no.

*Second: follow up.* Most sales don't close on the first touch. They close on the third, fourth, or fifth — which is precisely where most founders give up, reading a non-reply as a no. A polite follow-up isn't pestering; it's doing the basic work most people are too timid to do, and it's where a huge share of deals actually close.

Neither of these is a talent. They're just discipline — asking plainly, and following up more than feels comfortable.

In the exercise you'll build your simple pipeline and set yourself a real weekly target for conversations — because the founder who has ten awkward, imperfect conversations this week will out-learn and out-sell the one still polishing her perfect pitch in a document.`,
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
        body: `By now you've got data coming from everywhere — signups, conversations, feedback, metrics half-tracked in three places. Review week is about cutting through all of it and asking the only questions that decide whether you have a business. There are three.

**Strip it down: at this stage, your business is three numbers.**

MIT's delta v accelerator, which has run hundreds of founders through exactly this stage, boils it to this. *Traction* — is the number of people getting real value growing? *Product* — do they come back, or try it once and vanish? *Cash* — how many months of runway do your current habits buy you? ==Everything else — followers, press, compliments, your feature roadmap — is commentary on these three, not a substitute for them.==

The discipline delta v drills into founders is worth stealing:

*Every meaningful thing you do should move traction, product, or cash. If it moves none of them, ask why you're doing it.*

That sounds harsh, but it's liberating. Most founders feel busy and anxious because they're doing a dozen things of unclear importance. Line your week up against these three numbers and the noise falls away — you can see which activities are actually building a company and which just feel productive.

There's a second, subtler point here about *leading* versus *lagging* signals. Revenue is a lagging number — it tells you what already happened. Whether people come back next week is a leading number — it predicts what's coming. At your stage, the leading signals (are they returning? are conversations converting?) matter more than the lagging ones, because they tell you where the business is heading, not just where it's been.

This module isn't about learning new tactics. It's about looking honestly at what you've already got, through these three lenses, and letting the truth redirect you. In the exercises you'll pull your real numbers into one place and find the single most important thing they're telling you — which is usually not the thing you've been busiest with.`,
      },
      {
        id: 'm9l2',
        type: 'text',
        kind: 'theory',
        title: 'Funnel & conversions: vanity vs real metrics',
        body: `Some numbers feel wonderful and mean nothing. Some numbers feel modest and tell you everything. Learning to tell them apart is one of the most valuable skills you'll build all program — because founders chase the wrong ones constantly.

**Followers, impressions, and downloads feel great and predict almost nothing.**

Eric Ries gave these a name that stuck: *vanity metrics* — numbers that go up and to the right, make you feel good in an update email, and don't actually help you make a single decision. ==The test is simple: if a number can't change what you do next, it's vanity, no matter how big it is.== A thousand new followers who never buy is a number that flatters you and starves the business.

*"Vanity metrics: good for feeling awesome. Actionable metrics: good for making decisions." — Eric Ries, The Lean Startup*

The real numbers live in your funnel — the honest sequence a stranger travels to become a paying, retained customer: visitor → signup → activated → paying → still here next month. Each step has a conversion rate, and each rate is a decision waiting to happen. If 200 people visit and 100 sign up but only 2 pay, no amount of celebrating the 200 helps — the truth is sitting in that collapse between signup and payment, and it's telling you exactly where to work.

That's the gift of a funnel: it doesn't just measure, it *points*. A single honest funnel table — five stages, five conversion rates — tells you more about what to fix than a dashboard of twenty pretty charts ever will.

The uncomfortable part is that funnel numbers are often small and unflattering early on. Two paying customers out of two hundred visitors doesn't feel like a triumph. But it's real, it's yours, and it tells you precisely where the business leaks. In the exercise you'll build your own funnel from real numbers and find the one conversion step that's costing you the most — the leak worth fixing first.`,
      },
      {
        id: 'm9l3',
        type: 'text',
        kind: 'theory',
        title: 'Retention & habit formation',
        body: `Of all the numbers you'll track, one quietly predicts whether you have a real business better than any other: whether people come back. Not whether they try it. Whether they *return*. Let's give this the attention it deserves.

**Retention is the truest signal of product-market fit there is.**

Anyone can get someone to try a thing once — a clever ad, a favour from a friend, curiosity. What can't be faked is whether she comes back next week without being nudged. ==A product people return to on their own is solving a real problem; a product with great signups and no return is solving an imaginary one, expensively.==

The best single question for measuring this comes from Sean Ellis, who used it to define product-market fit before the phrase was fashionable:

*"How would you feel if you could no longer use this product?" — Sean Ellis's PMF test*

Ask your users that. If more than about 40% say "very disappointed," you're onto real fit — that's a group who'd genuinely miss it. If almost nobody would care, that's the truth talking, and it's worth hearing now rather than after you've scaled.

There's also a shape to watch: the retention curve. Plot what percentage of a week's new users are still active one week later, two weeks, four. If the curve keeps sliding toward zero, you have a leaky product no amount of marketing fixes. If it drops and then *flattens* — a stable group who keep coming back — that flattening is one of the most beautiful things an early founder can see. It means you've found people for whom this genuinely stuck.

Why does retention deserve a whole lesson? Because it changes what you should do next. If people come back, your job is to go get more of them — pour fuel on a working engine. If they don't, getting more of them just burns them faster, and the real work is fixing the product or the fit. ==Retention is the fork in the road: it tells you whether to grow or to go back and fix.==

This connects straight to the decision you'll face in Module 11 — scale or pivot — which rests almost entirely on whether people come back. In the exercises you'll measure your own retention honestly, run the Sean Ellis question on real users, and read what the answer is telling you to do.`,
      },
      {
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
        body: `Here's a resource more scarce than money in your business, and you rarely put it on a spreadsheet: you. Your time, your attention, your energy. Run those into the ground and it doesn't matter how good the idea is. So this module is about managing the founder, not just the company.

**You are the company's scarcest resource — protect your attention like capital.**

Two kinds of time don't mix, and Paul Graham named why:

*"When you're operating on the maker's schedule, meetings are a disaster." — Paul Graham, Maker's Schedule, Manager's Schedule*

Deep, creative work — building, writing, thinking — needs long unbroken blocks. Reactive work — messages, admin, quick calls — fragments the day. Try to do both in the same hours and you get neither: your deep work is interrupted into uselessness, and you feel busy all day with nothing real to show. ==Batch them. Guard a few maker-blocks a week fiercely, and herd the reactive stuff into the edges.==

And notice the word that matters more than "time": *energy*. You can have hours available and be too depleted to use them. Managing energy — knowing when you're sharp, protecting that window for your hardest work, not scheduling your one creative block for the exhausted end of a long day — beats managing time alone. This matters double if the startup shares your day with a job, a family, or both.

One more thing, said plainly because founders don't say it to each other enough: burnout is a systems failure, not a willpower failure. If you're running yourself into the ground, the answer isn't to try harder — it's to redesign the system so it doesn't require you to. A pace you can hold for a year beats a sprint that breaks you in a month, especially when there's no one else to pick it up.

This is a coaching module more than a tactical one. In the exercises you'll look honestly at your own strengths, your energy, and where your time actually goes — and design a way of working you can actually sustain.`,
      },
      {
        id: 'm10l2',
        type: 'text',
        kind: 'theory',
        title: 'Manage like Horowitz: people → product → profit',
        body: `At some point — maybe soon, maybe later — you stop being only a builder and start being someone others depend on: a contractor, a first hire, a co-founder. The instincts that make a great maker don't automatically make a great manager, so let's borrow from someone who learned it the hard way.

**People first, then product, then profit — in that order, even when it's hard.**

Ben Horowitz, who ran companies through genuinely brutal stretches, put the priority order bluntly:

*"Take care of the people, the products, and the profits — in that order." — Ben Horowitz, The Hard Thing About Hard Things*

The order is the whole lesson. It's tempting, under pressure, to sacrifice the people for the product or the profit — to overwork them, to skip the hard honest conversations, to treat them as resources. ==Horowitz's point is that if you take care of the people, they take care of the product, and the product takes care of the profit — but you can't skip the first link and expect the chain to hold.==

And when you do start hiring, one principle saves you from a classic first-timer mistake:

*Hire for strength, not for the absence of weakness.*

The instinct is to pick the "safe" candidate with no obvious flaws. But a person who's merely inoffensive at everything is rarely great at the one thing you actually need. The founder who hires for a towering strength — and tolerates the smaller weaknesses that come with it — builds a far stronger team than the one who keeps choosing the least-risky, least-remarkable option.

You may be a team of one for a while, and that's fine — this is preparation, not a push to hire. But the mindset starts now: the moment anyone else touches your business, you're managing, and managing badly is one of the quiet ways promising startups fall apart. In the exercises you'll audit your own strengths and weaknesses honestly — the first step to knowing who, eventually, you'll need beside you.`,
      },
      {
        id: 'm10l3',
        type: 'text',
        kind: 'theory',
        title: 'Operate like Rabois: the CEO is an editor',
        body: `As the founder, you'll feel a constant pull to do everything yourself — you care most, you know it best. It's also the fastest way to become the bottleneck in your own company. Here's a better model for how to operate.

**The founder is an editor, not the writer of everything.**

Keith Rabois, who operated at PayPal, Square and beyond, frames the CEO's real job as editing: not producing every piece of work yourself, but simplifying, clarifying, and pointing your limited attention at the few things where it matters most. ==An editor doesn't write every sentence — she decides what matters, cuts what doesn't, and raises the quality of the whole by focusing on the vital few.==

*Your job isn't to do the most. It's to make sure the most important things are done well — and to say no to the rest.*

For most of the day-to-day, that means one hard question about every task on your plate: does this genuinely need *me*, or does it just currently *have* me? The things that need your judgment, your face, your founder's conviction — those stay. Everything else is a candidate to hand off.

And here's where the modern twist changes the old advice. In the AI era, the sequence of handing off is different:

*Automate and delegate to AI before you hire a human. Headcount is the last resort, not the first.*

The old instinct was: overwhelmed? Hire someone. But hiring is slow, expensive, and adds management overhead you may not be ready for. Today, a huge share of what used to require a first hire — drafting, research, scheduling, first-pass work — can be handed to AI and automation first. You reach for a person when the work genuinely needs human judgment or a human relationship, not just human hands.

This is exactly what the platform's own design reflects: AI does the repetitive drafting; you keep the judgment. In the exercises you'll sort your own recurring work into what only you can do, what you can delegate, and what you can automate — and actually offload one real thing this week, so it stops being theory and starts giving you your time back.`,
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
        body: `Every founder eventually reaches the same fork in the road: push harder on the path you're on, or change it. Get this decision right and you compound; get it wrong in either direction and you can burn a year. The whole trick is deciding from your numbers, not your feelings.

**The most dangerous move at this fork is scaling something that doesn't yet work.**

Research by Startup Genome, across thousands of startups, found that *premature scaling* — pouring fuel and headcount and ad spend onto an engine that doesn't reliably run yet — is the single most common cause of startup death. ==Growth applied to a broken model doesn't fix it; it just makes you lose money faster and more spectacularly.==

The antidote is discipline about what you're deciding *from*:

*Decide from the evidence you gathered in Module 9 — not from hope, not from fear, not from how much you've already invested.*

Notice the three emotional traps in that line. *Hope* — "it'll surely work if we just grow." *Fear* — "we have to move now or we'll miss it." And the sneakiest, *sunk cost* — "we've put so much in, we can't change course now." All three feel like reasons. None of them are evidence. The founders who navigate this fork well are the ones who can set aside a year of emotional investment and look coldly at whether people actually come back and pay.

This is why Module 9 came first. The retention curve, the funnel, the honest three numbers — that's the input to this decision. If the evidence says the engine runs (people return, unit economics point the right way), you have earned the right to think about scaling. If it says the engine sputters, then more fuel is the wrong answer, and the honest move is to change something.

The two branches ahead — pivot or scale — are the subject of this module. But the meta-skill is this one: at the fork, be the founder who reads the data, not the one who follows the feeling. In the exercises, you'll bring your real evidence to the decision.`,
      },
      {
        id: 'm11l2',
        type: 'text',
        kind: 'theory',
        title: 'Types of pivot: changing course ≠ failure',
        body: `The word "pivot" carries a whiff of failure for a lot of first-time founders — as if changing your idea means you got it wrong. Let's kill that idea completely, because the opposite is true: knowing how and when to pivot is one of the most valuable skills a founder can have.

**A pivot isn't starting over. It's a turn that keeps one foot on what you've learned.**

Eric Ries, who catalogued the different kinds, defined a pivot precisely as a structured course-change that keeps you standing on your validated learning while you move in a new direction. ==You're not throwing away the last eight modules — you're keeping the customer knowledge, the market understanding, the relationships, and redirecting them at a better target.==

He named several types, and recognising which one you're doing brings real clarity. The *zoom-in* pivot: one feature everyone loved becomes the whole product. The *customer-segment* pivot: the product's right, but a different audience is the true buyer. There are channel pivots, revenue-model pivots, and more — each a specific, deliberate turn, not a panicked restart.

The examples should reassure you:

*Slack was a game company. Instagram was a check-in app. Shopify was a snowboard shop.*

None of those founders failed when they pivoted — they were paying close attention to what the evidence was telling them, and they had the courage to move. The game studio noticed the internal chat tool was the real product. The check-in app noticed people only cared about the photos. That's not defeat; that's exactly the skill this whole program has been training you to use.

So if the evidence from Module 9 is telling you something has to change, this lesson is permission and structure at once: changing course on real evidence is discipline, not failure, and there's a right way to do it that keeps your hard-won learning intact. In the exercises, if a pivot is where the data points, you'll pick which *kind* of pivot fits — and turn deliberately, not blindly.`,
      },
      {
        id: 'm11l3',
        type: 'text',
        kind: 'theory',
        title: 'Scale only what repeats',
        body: `The other branch of the fork is the exciting one: scale. But scaling is a privilege you earn, not a phase you enter on schedule — and mistaking the two is how good businesses blow themselves up. So let's be precise about when you've actually earned it.

**Scale only what already repeats.**

An engine is ready to scale when it *repeats* on its own: customers arrive through a channel you understand, they stay (that retention curve from Module 9 has flattened), and the money works — the value a customer brings over her life comfortably exceeds what it cost to win her. ==The rough rule people cite is LTV at least 3× CAC, but the real test isn't a magic ratio — it's whether the whole loop happens predictably without you pushing every single time.==

Run the checklist before you pour fuel: Is there real product-market fit — do people come back and would they be very disappointed to lose you? Is there a repeatable way to find more of them? Does the money work? If any answer is a genuine "not yet," then scaling isn't the next step — fixing that gap is.

When you *have* earned it, the classic mistake is scaling in the wrong direction — trying to serve everyone at once. Bill Aulet's advice holds: expand from your beachhead to *adjacent* markets, one careful step at a time, not to "everyone" in a leap. You won a specific group completely; grow to the group most like them next, and use that base as your foundation.

For a certain kind of contested, winner-take-all market, there's a more aggressive playbook:

*"Blitzscaling: prioritise speed over efficiency in the face of uncertainty." — Reid Hoffman*

But — and this is the part founders skip — Hoffman is explicit that blitzscaling is the right move only in specific conditions, and *wrong* most of the time. Burning efficiency for speed makes sense when a market will be won by whoever gets big fastest and there's a real land-grab on. It's reckless when there isn't. Most businesses, most of the time, should scale steadily on proven unit economics, not blitz.

So the discipline of this lesson is restraint as much as ambition: earn the right to scale by proving the engine repeats, then expand deliberately from strength. In the exercises you'll run the readiness checklist against your own evidence — and be honest about whether you're truly ready to pour fuel, or whether there's one more gap to close first.`,
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
        body: `Fundraising has a gravity to it — a sense that "real" founders raise venture capital, and raising it is a milestone to celebrate. Before you get pulled in, let's take a clear-eyed look, because for a lot of good businesses, VC is the wrong tool entirely.

**Venture capital is one financing tool, not a graduation ceremony.**

There's a whole menu, and each option costs something different. *Bootstrapping* — funding growth from revenue — keeps you in full control but grows only as fast as your cash allows. *Grants* — free money, no equity, in exchange for paperwork and patience. *Angels* — individuals who invest their own money and often bring belief and connections. *Crowdfunding* — your customers funding you directly. And *venture capital* — which buys speed, but at the price of ownership, control, and a permanent obligation to chase very large outcomes fast.

==VC isn't "better" money — it's specific money, with strings. It suits businesses that need to get big fast in a winner-take-all market, and it actively harms ones that would be perfectly happy growing steadily and profitably.== Taking venture money for a business that doesn't need venture-scale returns is signing up for a pressure that can break the very thing you were building.

And there's a piece of the map worth knowing specifically as a woman founder:

*The dedicated map of grants and women-focused angel networks is growing — know it exists before you default to the hardest, most competitive path.*

Traditional VC funds a tiny fraction of women-led companies — a real, documented gap. But it's not the only door, and it's often not the best first one. Grants and angel networks built specifically for founders like you can be a faster, less punishing route to your first outside capital, without the venture treadmill.

So the honest first question of this module isn't "how do I raise?" — it's "do I even need to, and if so, from whom?" In the lessons ahead you'll learn how a round actually works so the knowledge is yours either way. But choose the tool that fits the business you actually want to build, not the one that sounds most impressive at a dinner party.`,
      },
      {
        id: 'm12l2',
        type: 'text',
        kind: 'theory',
        title: 'How a round works + SAFE basics',
        body: `If you do decide to raise, the mechanics can feel like a foreign language designed to make you feel small. It isn't — it's a handful of concepts, and once you see them clearly, you negotiate from understanding instead of intimidation. Let's demystify it.

**See the round through the investor's eyes first.**

An early-stage investor is buying a slice of a future outcome that will probably never happen — most startups don't return the big win. So their whole model runs on *power law*: a few investments have to pay for all the ones that fail. ==That's why they underwrite team, market size, and momentum so hard — they're not asking "is this a nice business?" but "could this be one of the rare huge ones?"== Understanding that reframes everything about how you pitch: you're not proving you're safe, you're proving you *could* be enormous.

Now the instruments, in plain terms. A **SAFE** — Simple Agreement for Future Equity, created by Y Combinator — is the most common early tool: an investor gives you money now, and it converts into shares later, at your next priced round, on agreed terms. It defers the hard question of "what's the company worth today" — which is genuinely hard to answer pre-revenue. A **priced round** does the opposite: it sets a valuation now and sells shares against it.

A few terms actually matter, and they're worth knowing by name:

*Dilution — every share you sell shrinks your slice. Valuation cap — the ceiling price at which a SAFE converts. Pro-rata — an investor's right to keep their percentage in future rounds. Liquidation preference — who gets paid first if the company sells.*

You don't need to master the fine print — that's what a good startup lawyer is for, and you should absolutely use one before signing anything real. But you *do* need to understand the shape of the deal well enough to know when something's off, because plenty of first-time founders sign terms they didn't understand and regret them for years.

The one number to feel in your bones is dilution. Every round, you sell part of your company to fund its growth. A little dilution to build something huge is a great trade; too much, too early, at too low a valuation, and you can end up a minority owner of your own company before it's even working. Raise what you need to hit real milestones, not the biggest number your ego enjoys. In the exercises you'll see how the maths actually plays out on your own hypothetical round.`,
      },
      {
        id: 'm12l3',
        type: 'text',
        kind: 'theory',
        title: 'Founder storytelling & the deck that works',
        body: `At the end of the day, fundraising comes down to a story told well enough that someone believes in a future that doesn't exist yet. The good news: there's a proven structure for that story, and you've spent twelve modules gathering everything it needs.

**Investors decide in about ninety seconds whether to keep listening. Your story has to land fast.**

The structure that's carried more successful pitches than any other is the classic Sequoia deck — a sequence, not a random pile of slides:

*Problem → Solution → Why now → Market size → Product → Traction → Team → The ask.*

Each slide does one job. The *problem* makes them feel a real pain. The *solution* shows your answer. *Why now* explains why this is possible today and wasn't five years ago. *Market* shows it could be big. *Product* makes it concrete. *Team* argues you're the ones to do it. And *traction* — for you, at your stage — is the star of the whole show.

==At the earliest stage, investors aren't buying your projections — they can't be verified. They're buying evidence that you turn insight into motion.== That's exactly what the last twelve modules built: real interviews, a validated problem, first customers, a retention signal. Your traction slide isn't a formality — it's the single most persuasive thing in the deck, because it's the one part that already happened.

On delivery, one rule from a legendary early investor cuts through all the polish:

*"If you can't explain your business in two sentences, you don't understand it yet." — echoing Ron Conway's test*

The founders who raise well aren't the ones with the most beautiful slides. They're the ones who can make you *feel* the problem and then show you they're already in motion against it — clearly, in plain words, in the time it takes to ride an elevator.

Here's the quiet payoff of doing the program in order: you're not inventing a story for the deck. You're assembling one from things that actually happened — the market you sized, the persona you found, the problem you validated, the first sale you closed. In the exercise, the platform will draft your deck from your Brain, and you'll shape the narrative until it sounds like you — and until you can tell it, compellingly, in two sentences.`,
      },
      {
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
