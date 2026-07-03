# M0–M4 theory lectures v2 — length standard + formatting

> Replaces theory lecture `body` text for all 15 blocks below. Exercises and
> field tasks are untouched — this covers ONLY theory-kind lessons.
> Length standard: **350 words** default · **450 words** reserve for
> citation-heavy or conceptually denser topics (marked 🔵 below).

## Formatting legend (plain markdown, no rich editor needed)

| Markup | Meaning | Render rule for dev |
|---|---|---|
| `**Text**` — a full paragraph, nothing else on that line | **Subheading** | Bold, brand-accent color, slightly larger, margin above/below — visually distinct from inline bold |
| `**text**` inline, mid-sentence | normal bold emphasis | unchanged — existing behavior (already used live, e.g. "your **Brain**") |
| `==text==` | Color highlight | Wrap in `<mark>`/span with ONE accent color from DESIGN.md tokens. Used at most once, sometimes twice, per lecture — never more |
| `*"Quote text" — Attribution*` — a full paragraph, italic, ending in em-dash + name | Quote block | Italic + subtle left border/indent (cheap CSS, not a new component) |
| `*text*` inline, mid-sentence | normal italic | unchanged |

**Verify before writing more content:** confirm inline `**bold**`/`*italic*` markdown is actually parsed and rendered today (live m0l1 already contains `**Brain**` — check it renders bold, not literal asterisks). If not, this is a prerequisite fix.

---

## Module 0

### m0l1 — "This is not a course" (~360w)

Welcome to Affina Space. Before anything else, let's be honest about what this is — and what it isn't.

**This is not a course.**

Courses give you information and a certificate. We're here for something harder and far more valuable: a real business, with a real customer who pays you real money. Every module works the same way — a short piece of theory, an exercise where you apply it to *your* startup, and a field mission you complete out in the real world. What you bring back gets reviewed, scored, and turned into your next move.

==Everything you do feeds your Brain== — a living memory of your startup. Your answers, your interviews, your numbers all land there, and your AI mentor uses them to give advice about your business specifically, not generic startup wisdom pulled from a textbook. The further you go, the smarter it gets about you.

**Three honest rules.**

One: we will never do the parts that matter for you — talking to customers and making decisions is founder work, always. Two: you will leave this platform and speak to real humans, more than once, starting sooner than feels comfortable. Three: changing your plan when the evidence says so isn't failure here — it's the exact skill we're teaching, and you'll practice it on purpose, more than once, before this is over.

Your finish line is not "completed the program." It's your first paying customer. Every module, every exercise, every awkward conversation you're about to have — it all points at that one moment. Let's get to it.

### m0l2 — "Being a founder in the AI era" (~350w)

Let's clear out the myths first, because they'll cost you if you carry them in.

**Founding a company will not give you more free time.**

Not at the start, maybe not for years. You won't have fewer bosses — you'll have more; every customer is one, and so is every investor, and so, some days, is your own bank balance. Nobody is coming to tell you what to do next. You are the engine now. If that thought excites you more than it scares you, you're exactly where you should be.

Here's what's also true, and it's genuinely new: there has never been a better moment in history to be a solo founder. AI has collapsed the cost of building. A landing page in an evening instead of a month. A working prototype in days instead of a quarter. Research that used to take a paid consultant weeks — done in minutes, by you, tonight. ==One determined founder with the right AI tools can now do the work of a small team.== That's not a slogan; it's the actual, measurable shift this program is built around.

But notice what AI did *not* make cheap. Knowing your customer well enough that she trusts you. Judgment — the ability to decide what's actually worth building, out of a hundred things you could build. That's exactly what this program trains, module by module. We'll hand the repetitive work — drafts, research, first passes — to AI at every step. The thinking, the conversations, the decisions: those stay with you, because that's precisely where the value of your company lives.

One more thing, before you start doubting yourself, which every founder does around week two.

*"I was told no by over a hundred investors before Canva became a company worth billions." — Melanie Perkins*

Sara Blakely started Spanx with $5,000 and zero industry contacts. Nobody gave either of them permission. Nobody needs to give you permission either.

---

## Module 1

### m1l1 — "Think in hypotheses: the lean loop" 🔵 (~400w)

Here's the single most useful mental shift a founder can make in her first week, and most never make it at all.

**Your idea is not a plan. It's a stack of guesses.**

Right now you're guessing who your customer really is, what she struggles with most, what she'd actually pay, and why she'd pick you over doing nothing. That's not a weakness in your thinking — every company that ever mattered started as a stack of guesses. Eric Ries has a name for what a startup actually is:

*"A startup is a human institution designed to create something new under conditions of extreme uncertainty." — Eric Ries, The Lean Startup*

In practice, that means treating your business less like a plan you're executing and more like a search — for a business model that actually works, run through a repeating loop: state a belief, design the cheapest possible test for it, run the test, look honestly at what happened, and adjust. Steve Blank, who taught this before Ries wrote it down, called the discipline "customer development" — get out of the building and let reality answer, instead of your own optimism.

**Here's the part that changes how the next 12 weeks will feel.**

==Changing your idea based on evidence is not failure — it's the skill.== Slack started as a gaming company that never shipped a game. Instagram was a location check-in app nobody used. Their founders weren't lucky; they were paying close attention to what the loop was telling them, and they moved. If, somewhere in the coming weeks, you discover your real customer isn't who you first thought, or your first solution misses the mark — that's not this program breaking your idea. That's the program doing exactly what it exists to do, while the correction is still cheap and the stakes are still small.

You'll run this loop constantly from here on: hypothesis, test, evidence, decision. Get comfortable saying "I was wrong about that" out loud. It will be, without exaggeration, the most valuable sentence you learn to say in this entire program.

### m1l2 — "Why a clear idea beats a big idea" 🔵 (~430w)

The instinct at the start is almost universal: make the idea bigger. More features, more audiences, more "it could also do this for..." It feels like the responsible move — why limit yourself before you've even started? But this instinct is exactly backwards, and understanding why will save you months.

**A big idea is impossible to validate, impossible to explain, and impossible to win.**

If your product is "for everyone who wants to save money, eat healthy, and manage their time better," which of those three do you test first, with whom, using what? Watch anyone try to pitch "an all-in-one platform for X" in one sentence — it always takes three, and by the third one the listener has stopped picturing a real person and started picturing a slide deck. And you've just volunteered to compete with everyone, on every front, with no home turf of your own.

A clear idea does the opposite of all three. Compare "a meal-planning app for busy people" — big, vague, forgettable — against "a 10-minute dinner plan for parents working night shifts." The second is small enough to test this week, sharp enough to explain in a single breath, and specific enough that the right person — an actual night-shift parent — reads it and thinks, *that's written for me.* The wrong person self-selects out immediately too, which quietly saves you both time.

**Here's what surprises most first-time founders, and the reason this module exists.**

Narrowing your idea isn't a compromise you accept until you're bigger and can afford to widen out. ==It's the actual advantage.== Peter Thiel's advice to early founders is blunt on exactly this point:

*"Focus on a small market where your product or service already fulfills a need that goes unaddressed... it's much better to be a big fish in a small pond." — Peter Thiel*

A two-person team obsessed with one painful problem, for one clearly-defined person, will consistently out-move a company a hundred times their size — because that company is busy serving everyone adequately, while you're busy serving one person exceptionally well.

So here is the one hard, valuable thing this module asks of you: say what you're building so clearly that a complete stranger would understand it in a single breath — no jargon, no "it's kind of like X but for Y." Not because clarity is a nice writing exercise, but because it's the fastest, cheapest test of whether the idea itself is sharp enough to survive contact with a real customer.

### m1l3 — "The shape of a one-liner that lands" (~350w)

A great one-sentence pitch has exactly three parts: who you help, the painful problem you solve for them, and the concrete result they get. Drop any one of the three and the whole thing goes fuzzy — watch the difference for yourself.

**Vague:** "A marketplace platform with smart matching for flexible work."

**Sharp:** "I help moms on maternity leave earn 2–3 hours a day from home, without going back to an office."

The second one names an actual person, a real and specific pain, and a result you can picture happening in someone's actual week. Say the vague version to ten people and most will nod politely and forget it by lunch. Say the sharp version to the right person and she leans forward.

**Notice what the sharp version says nothing about: technology.**

No "AI-powered," no "platform," no "smart matching." ==Customers don't buy your tech — they buy the change in their life.== A founder who leads with the tech is usually still hiding, even from herself, from the harder question: what specifically changes for her, and how do I know that's true?

This isn't a copywriting exercise you do once and file away. This exact sentence is the test you'll run every single one-liner you write against for the rest of the program — your pricing page, your outreach messages, your investor deck, all of it traces back to whether this one sentence actually lands with a stranger. If it doesn't land here, in one breath, with no context given in advance, it won't land anywhere downstream either.

Your job next, in the exercise that follows: write the sharp version of your own idea, and then say it out loud to someone who has never heard it before. Watch their face, not just their words — that's where the real feedback lives.

---

## Module 2

### m2l1 — "Is this a market worth winning?" (~360w)

A brilliant idea in a tiny or shrinking market is a genuinely hard place to spend the next several years of your life. Before you fall in love with your solution, it pays to look hard at the market underneath it — and three questions tell you most of what you need to know.

**How intense is the pain?**

Is this a painkiller people are actively hunting for, or a vitamin that's nice to have but easy to postpone? Painkillers get bought. Vitamins get "maybe next month," forever.

**How often does it strike?**

Daily problems build daily habits, and habits build businesses. Once-a-year problems get forgotten the moment they're solved, and so does your product, right along with them.

**Is she already paying — in some form?**

Money, time, or plain effort spent on a clumsy workaround today is the strongest signal there is. ==Existing spend, even on something inferior, beats a hundred people saying "I'd probably use that."==

If all three answers point the same direction, you've found something worth years of your attention. If they don't — if the pain is mild, rare, or nobody's currently doing anything about it — far better to learn that now, in an afternoon of honest thinking, than after a year spent building the wrong thing beautifully.

This isn't about picking the objectively "biggest" market either. It's about picking one where the pain is real enough, frequent enough, and expensive enough that a customer will actually change her behavior for you. A smaller market with all three signals strong will outperform a huge market with all three signals weak, every time, because the huge market simply won't move.

Hold these three questions loosely in mind as you go into the next few exercises — you'll come back to them again once real customer conversations start giving you real answers instead of guesses.

### m2l2 — "Your real competitor is the status quo" (~350w)

Founders love to say "we have no competitors." It's almost never true, and believing it usually means you haven't looked hard enough yet.

**You always have competitors — they're just probably not who you think.**

Your real competitor is however your customer solves this problem *today*: a spreadsheet she built herself, a WhatsApp group, a freelancer she found through a friend, or — more often than founders want to admit — simply doing nothing at all and living with the problem.

==Doing nothing is the most underrated competitor of all==, precisely because it's free, familiar, and requires zero behavior change. To win, you don't have to be better than some other flashy startup. You have to be clearly, obviously better than the clumsy workaround she already trusts and has already built habits around — a much higher bar than it sounds, because habits are sticky even when they're bad.

So the exercise ahead asks something that feels almost too simple: map exactly what she uses right now, today, to deal with this problem, and be genuinely honest about *why* it's good enough for her most of the time. Not why it's bad — every founder can list reasons the old way is bad. Why does it survive anyway?

That honesty is uncomfortable, and it's exactly where your real opening hides. The gap between "good enough most of the time" and "actually solves it" is the only space you have to build a business in. Founders who skip this step build products that are better on paper and still lose — because paper isn't what she's comparing you against. Her Tuesday afternoon is.

### m2l3 — "Market size: TAM bottom-up" 🔵 (~440w)

At some point — an investor, a co-founder, or your own doubting voice at 2am — someone will ask: *how big is this, really?* Most founders answer with theater: "the wellness market is worth $500 billion, and if we just capture 1%..." Nobody actually believes that math, including the person saying it, and you shouldn't either.

**Top-down numbers describe an industry. They say nothing about your business.**

Bill Aulet's Disciplined Entrepreneurship framework, taught at MIT, insists on the opposite approach: build your market size from the bottom up, one real number at a time.

**Three numbers, multiplied.**

How many people genuinely match your actual target customer — not a demographic bracket, but people who have this specific problem? What would one of them realistically pay you per year? And what slice of them could you plausibly reach in the next few years, given how you'll actually find them? Multiply the three together and you have an honest market size — one you built yourself and can defend.

Say you serve independent nutrition coaches in Portugal. Roughly 8,000 exist. Your product costs €30 a month, or €360 a year. That's a €2.9 million total addressable market — and reaching even 10% of it means €288K a year. Small? Perhaps, by venture-capital fantasy standards. ==Real? Completely, and defensible in a way "1% of $500 billion" never will be.== And it tells you something immediately actionable: with numbers like these, you either need to raise your price, widen the niche later once you've won this one, or both — decisions that top-down math can never hand you, because it never touched reality in the first place.

Here's the rule of thumb worth keeping: a bottom-up number you can walk someone through, line by line, beats a top-down number that merely impresses on a slide. Investors have heard "just 1% of a huge market" a thousand times and stopped believing it around the tenth. A founder who knows exactly how many real customers exist, and exactly what each one is worth — that's genuinely rare, and it shows the moment she opens her mouth.

You don't need a forty-tab spreadsheet for this. You need a napkin, three honest numbers, and the willingness to be conservative on purpose.

---

## Module 3

### m3l1 — "You can't build for everyone" (~370w)

It feels safer to keep your audience wide — more people should mean more customers, shouldn't it? At the idea stage, it's almost exactly backwards.

**A product built for everyone delights no one in particular.**

The founders who actually win pick one specific group, fall in love with that group's problem specifically, and become the obvious, unmistakable choice for them first — before they ever think about anyone else. Bill Aulet's MIT framework has a name for this: your **beachhead market** — the single narrow front where you can win completely before expanding anywhere else.

It's the same instinct behind Peter Thiel's advice to dominate a small market entirely before going wide — own the beachhead first, then use it as a base. Counterintuitively, ==the narrower you go at the start, the faster you actually grow==, because a sharp message travels between people, while a vague one dies in every single conversation it's mentioned in. A delighted niche audience talks to itself; a mildly-satisfied general audience mostly stays quiet.

So in the exercises ahead, we're going to do something that will feel backwards, maybe even uncomfortable: make your intended audience deliberately smaller, on purpose, even though every instinct says to widen it. Not because a small audience is the destination — it's the fastest, cheapest way to become undeniably good at solving one real problem for one real kind of person, which is the only foundation anything bigger can later be built on.

Picking a beachhead isn't picking who you'll serve forever. It's picking who you'll serve *first*, completely, so well that they tell someone else without being asked. Every company you admire that now serves "everyone" started by serving a very specific someone extremely well, for quite a while, before they ever earned the right to widen out.

### m3l2 — "What makes a great first customer" (~350w)

Not all customers are created equal at the start, and treating them as if they are is one of the quieter ways founders waste their first few months.

**Your ideal first customer usually shares four specific traits, and Bill Aulet's beachhead framework scores exactly this.**

Her pain is intense — felt often, and badly enough that she's actively looking for a fix rather than tolerating it. She's reachable — you can find her and get her on a call without a marketing budget, through a community, a group, a mutual connection. She can pay — there's real money or genuine value already changing hands around this problem, even informally. And she talks — she's connected to other people just like her, so a single delighted customer doesn't stay a secret for long.

==Miss any one of these four and the whole beachhead strategy quietly stalls.== A customer in severe pain who you can't reach is a headline, not a business. A reachable customer with mild pain will politely ignore you forever. A customer who talks constantly but can't pay teaches you things without ever paying you for them.

In the exercise just ahead, you'll sketch three genuinely different candidate customers — not three versions of the same person with different job titles — and we'll score each one honestly against exactly these four traits. Then, together, we'll help you decide who to try to win first. This isn't the audience you'll serve forever, and it doesn't need to be. It's simply the sharpest, most winnable front to start from — the one where all four traits line up well enough that you can move fast and learn even faster.

### m3l3 — "Interviews that tell the truth" 🔵 (~400w)

Here's an uncomfortable fact worth sitting with before you talk to a single real customer: most founder interviews are almost worthless, and it's not because the founder asked bad questions on purpose. It's because people are polite, and opinions about the future are free to give away.

**Describe your idea, and she'll say "oh, I'd definitely use that." Then she goes home and never thinks about it again.**

She wasn't lying to hurt you. Rob Fitzpatrick's *The Mom Test* names the trap precisely — the test being, could your own mother lie to you about your idea without even realizing she's doing it?

*"The Mom Test: talk about their life instead of your idea." — Rob Fitzpatrick, The Mom Test*

So we follow one discipline, without exception: talk about her actual life, never about your idea. Past behavior, not future promises. Not "would you use an app that plans dinners?" but "walk me through what actually happened at dinner last Tuesday." Not "would you pay for this?" but "what have you already tried, and what did it cost you — in money, in time, in patience?" ==What she actually did is real evidence. What she says she'd probably do is just noise dressed up as data.==

Three rules for the room, worth writing on a sticky note before your first call. Don't pitch — the second you start selling, honest information stops flowing entirely. Ask a genuinely open question, then go quiet and let the silence sit there; the best material almost always comes out after the pause, not during your question. And chase the emotion whenever you hear it — a sigh, a laugh, a sudden change in her tone of voice. "Tell me more about that" is, without exaggeration, the single most valuable sentence you'll use in this entire program.

You'll practice this craft first on friendly, low-stakes people before you ever run it on strangers. Getting comfortable with the discipline matters more, at this stage, than racking up a high number of conversations.

---

## Module 4

### m4l1 — "Fall in love with the problem, not the solution" 🔵 (~410w)

The single most common reason startups fail isn't bad luck, weak funding, or a clever competitor. Post-mortem studies of failed startups keep landing on the same answer, over and over: they built something nobody actually needed.

**It happens the same way almost every time — a founder falls in love with her solution and quietly stops checking whether the underlying problem is even real.**

So in this module, we flip the order deliberately. The problem is your constant. The solution is only ever your current best guess at fixing it — nothing more, nothing sacred about it. Clayton Christensen's framework makes the distinction sharp:

*"Customers don't buy products, they hire them to do a job." — Clayton Christensen, Jobs-to-be-Done*

Nobody genuinely wants a meal-planning app. She wants to stop feeling guilty and frantic at 6pm when dinner has once again become chaos. That underlying job is the truth of the situation. Your app is merely one possible way to get hired for it, and she'll fire you the instant something else does that job better, faster, or cheaper.

**Test your problem honestly against three bars before building anything on top of it.**

Intensity — is this a painkiller or a vitamin? Frequency — does it hurt weekly, or once a year and then get forgotten? And spend — is she already putting real money, time, or effort into dealing with it today? ==A problem that clears all three bars is worth years of your life. A problem that clears none of them will quietly kill even the most beautifully designed product built on top of it.==

You now hold something most founders skip straight past on their way to building: real interview data from actual conversations, not assumptions. In this module, we put the idea you originally arrived with on the table, right next to what real people actually told you — and we keep whatever survives contact with that evidence, and let the rest go without ceremony. That's not a step backward. It's the entire point of doing the work in this order.

### m4l2 — "Full life-cycle use case" (~350w)

*Framework: MIT Disciplined Entrepreneurship, Step 6 (Bill Aulet).*

Most founders picture their product at exactly one moment — she opens the app, gets value, done. But that's a single frame lifted out of an entire film.

**Bill Aulet's MIT framework calls this the Full Life Cycle Use Case, and it insists you map every single stage.**

How does she first hear about you? How does she decide to actually try it, out of everything else competing for her attention that week? How does she get set up? How does she use it day to day, in the middle of an ordinary Tuesday? How does she pay? And — the stage almost everyone conveniently skips — how, or whether, she comes back, or tells someone else about it.

Here's why this matters more than it sounds like it should: ==most businesses don't die at "the product doesn't work."== They die quietly in the gaps *between* stages. She heard about you but couldn't figure out how to actually start. She loved using it but the payment step confused her at the exact wrong moment. She paid once, and then nothing ever brought her back a second time. Each transition between stages is a place a real, willing customer can fall off without you ever noticing why — and you genuinely cannot fix a gap you never bothered to map.

Walk through your own product this way, stage by stage, and ask honestly at each one: what does she actually, literally do here — and where might she quietly get stuck? You already have raw material for this sitting in your notes: your interviews already told you how she discovers and evaluates things roughly like yours today. Use exactly that, rather than guessing from scratch.

### m4l3 — "Sketch your product, not your tech" (~350w)

*Framework: MIT Disciplined Entrepreneurship, Step 7 — High-Level Product Specification (Bill Aulet).*

Here's a trap founders fall into constantly, almost without noticing: describing the product by its technology instead of by the experience it creates. "An AI-powered platform with a recommendation engine" tells a real customer nothing whatsoever about her actual life. "You open it, tell it your problem, and get three matched options back in ten seconds" — that, she can picture clearly, without any translation required.

**Aulet's High-Level Product Spec asks for exactly that: what the product does and feels like, never what powers it underneath.**

Tech stack, architecture, which model you happen to be using — none of that belongs in this conversation. It belongs in a different room entirely, later, with different people — engineers, or investors doing technical diligence. Right now, in this exercise, you are describing an experience, full stop, and nothing else.

==A useful, quick test: could you sketch this on a napkin as a sequence of screens or moments, using zero jargon, and have a total stranger nod along without needing anything explained?== If the description genuinely needs an engineering background to follow, it isn't a product spec yet at all — it's a technical memo wearing a product's clothes, hoping nobody checks underneath.

Sketch the moments first: what she sees, what she taps, what changes for her immediately afterward. Save the technical stack, the architecture diagrams, and the "how it's actually built" conversation for later, with the people who genuinely need that information to do their jobs. Right now, your only job is making a stranger picture her own life changing — nothing about your code belongs in that picture yet.

### m4l4 — "Value in numbers: before and after" (~360w)

*Framework: MIT Disciplined Entrepreneurship, Step 8 — Quantify the Value Proposition (Bill Aulet).*

"Makes life easier" doesn't sell anything to anyone. "Saves six hours a week" sells, every time, because one is a vague feeling and the other is a number she can immediately picture sitting inside her own actual calendar.

**Aulet's Quantified Value Proposition step exists purely to force that exact translation — from soft adjectives into hard arithmetic.**

The method itself is genuinely simple. Describe her life *before* your product: how she currently deals with this problem, and what it costs her today, in hours, in money, or in plain stress. Then describe her life *after*: what changes, measured in those exact same units, nothing fancier. Subtract one from the other. If she currently spends eight hours a week wrestling with something, and your product gets that down to two, that's "six hours a week back" — a sentence that survives being repeated out loud to an investor, to a skeptical partner, or to her own doubting brain at two in the morning.

==Don't invent these numbers sitting at your desk.== Pull them directly from what real people already told you in your interviews. A number that traces back to an actual conversation — "she told me, unprompted, that she spends about five hours a week on this" — will always beat a number you privately guessed at, because it's a number you can defend the instant someone pushes back on it, which someone eventually will.

This exercise is short on the page and heavy in what it does downstream: this exact quantified number becomes your pricing anchor in Module 5, the headline of your landing page in Module 6, and the first real line of your pitch deck much later on. Get it grounded in truth now, and every one of those later moments gets easier.
