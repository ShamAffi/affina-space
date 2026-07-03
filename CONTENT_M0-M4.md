# Content: Modules M0–M4 (EN) — pre-paywall "wow" modules

> **IDs normalized 2026-07-03:** all lesson ids below now use the LIVE `src/data.ts` numbering (this file was originally authored in pre-restructure numbering; the old ids survive only as `old-mXlY` markers on retired blocks).

> Companion to SPEC_PROGRAM_V2.md §2. Ready-to-paste lecture texts, exercise prompts,
> and field-task briefings for all NEW and REWRITE blocks. KEEP blocks are listed for
> order/ID reference only — their existing texts in `data.ts` stay unchanged.
> Voice: editorial, warm, direct. Founder = "you". Her customer = "she".

## ID map

| Block | id | type | kind | status |
|---|---|---|---|---|
| 0.1 | m0l1 | text | theory | NEW |
| 0.2 | m0l2 | text | theory | NEW |
| 0.3 | m0l3 | structured | exercise | NEW (entryType: founder_intake) |
| 0.4 | m0l4 | input | exercise | NEW (entryType: imported_assets) |
| 0.5 | m0l5 | system | system | NEW (Snapshot generation) |
| 1.1 | m1l1 | text | theory | NEW (order: first in M1) |
| 1.2 | m1l2 | text | theory | KEEP |
| 1.3 | m1l3 | text | theory | KEEP |
| 1.4 | m1l4 | input | exercise | NEW (entryType: mission_vision) |
| 1.5 | m1l5 | input | exercise | KEEP |
| 1.6 | m1l6 | input | exercise | KEEP |
| 2.1 | m2l1 | text | theory | REWRITE |
| 2.2 | m2l2 | text | theory | KEEP |
| 2.3 | m2l3 | text | theory | REWRITE (new topic: TAM) |
| 2.4 | m2l4 | input | exercise | KEEP |
| 2.5 | m2l5 | input | exercise | KEEP |
| 2.6 | m2l6 | premium | premium | NEW |
| 2.7 | m2l7 | field | field | NEW (artifactType: text_template; entryType: competitor_journey) |
| 3.1 | m3l1 | text | theory | KEEP |
| 3.2 | m3l2 | text | theory | KEEP |
| 3.3 | m3l3 | text | theory | NEW |
| 3.4 | m3l4 | input | exercise | KEEP |
| 3.5 | m3l5 | input | exercise | KEEP |
| 3.6 | m3l6 | input | exercise | NEW (entryType: interview_script) |
| 3.7 | m3l7 | field | field | NEW (artifactType: interview_log, minEntries: 1) |
| 4.1 | m4l1 | text | theory | NEW |
| 4.2 | m4l2 | text | theory | KEEP |
| 4.3 | m4l3 | text | theory | KEEP |
| 4.4 | m4l4 | text | theory | KEEP (moved from old M5) |
| 4.5 | m4l5 | input | exercise | NEW ⭐ (entryType: problem_solution_check) |
| 4.6 | m4l6 | input | exercise | KEEP |
| 4.7 | m4l7 | input | exercise | KEEP |
| 4.8 | m4l8 | input | exercise | REWRITE (merged with old old-m5l4; entryType: quantified_value) |
| 4.9 | m4l9 | field | field | NEW (artifactType: screenshot; entryType: micro_commitment) |

*Delta to spec §3.5: add `m1l4: mission_vision`, `m2l7: competitor_journey`, `m4l9: micro_commitment`.*

---

# MODULE 0 — Welcome to Affina Space

## 0.1 · m0l1 · theory
**Title:** This is not a course

**Body:**
Welcome to Affina Space. Before anything else, let's be honest about what this is — and what it isn't.

This is not a course. Courses give you information and a certificate. We're here for something harder and far more valuable: a real business, with a real customer who pays you real money. Every module works the same way. A few short lessons give you just enough theory to act — never more. Then you do the work: exercises here on the platform, and real-world tasks out there, with real people. What you bring back gets reviewed, scored, and turned into your next move.

Everything you do feeds your **Brain** — a living memory of your startup. Your answers, your interviews, your numbers all land there, and your AI mentor uses them to give advice about *your* business, not generic startup wisdom. The further you go, the smarter it gets about you.

Three honest rules. One: we will never do the parts that matter for you — talking to customers and making decisions is founder work. Two: you will leave this platform and speak to real humans, more than once. Three: changing your plan when the evidence says so isn't failure here — it's the skill we're teaching.

Your finish line is not "completed the program." It's your first paying customer. Everything points at that.

## 0.2 · m0l2 · theory
**Title:** Being a founder in the AI era

**Body:**
Let's clear out the myths first. Founding a business will not give you more free time — not at the start. You won't have fewer bosses; you'll have more — every customer is one. And nobody is coming to tell you what to do next. You are the engine now. If that excites you more than it scares you, you're in the right place.

Here's what's also true: there has never been a better moment to be a solo founder. AI has collapsed the cost of building. A landing page in an evening. A working prototype in days. Research that used to take a consultant a month — in minutes. One focused woman with the right tools can now move like a team of ten.

But notice what AI did *not* make cheap: knowing your customer, earning her trust, and judgment — the ability to decide what's worth building at all. That's exactly what this program trains. We'll hand the repetitive work to AI at every step. The thinking, the conversations, the decisions stay with you — because that's where the value of your company lives.

One more thing. Melanie Perkins was rejected by over a hundred investors before Canva became a $25B company. Sara Blakely started Spanx with $5,000 and no industry contacts. Nobody gave them permission. Nobody needs to give you permission either.

## 0.3 · m0l3 · structured exercise
**Title:** Your project today

**Intro (body):**
Now tell us where you actually are — honestly. Not where you wish you were. This becomes the foundation of your Startup Snapshot: the more real you are here, the sharper every recommendation you get from now on. Some answers are pre-filled from your sign-up — check them, correct them, go deeper.

**Form fields:**
1. `idea_now` (textarea, prefill from onboarding `idea`) — Label: "Your idea, as you'd tell a friend" · Placeholder: "Plain words. What are you building, for whom, and why does it matter?"
2. `done_so_far` (multi-select + textarea) — Label: "What have you already done?" · Options: Nothing yet — just the idea / Talked to potential customers / Landing page or website / Prototype or MVP / First sign-ups / First sales / Something else · Follow-up textarea: "Tell us more — what exactly, and what happened?"
3. `stuck_point` (textarea) — Label: "Where are you stuck or unsure right now?" · Placeholder: "e.g. I don't know if people would pay, I can't choose between two audiences, I launched but nobody came…"
4. `capacity` (choice) — Label: "How many hours a week can you realistically give this?" · Options: Under 5 / 5–10 / 10–20 / 20+ (full focus)
5. `goal_12w` (textarea, short) — Label: "In 12 weeks, what would make you say 'this was worth it'?" · Placeholder: "e.g. First paying customer. A validated idea I believe in. A live product with 50 users…"
6. `why_me` (textarea, short) — Label: "Why you? Why this?" · Placeholder: "Your story, your access, your skills — whatever connects you to this problem."

## 0.4 · m0l4 · exercise
**Title:** Show us what exists

**Body:**
If your project already lives somewhere — a website, an Instagram, a pitch doc, a Notion page — drop the links below. Your AI mentor will read everything and fold it into your Snapshot, so the program starts from what you have instead of from zero. Nothing yet? Completely fine — most founders here start with exactly nothing but an idea. Skip ahead.

**inputPrompt:** "Paste up to 5 links (website, socials, docs). One per line. Add a note if anything needs context."
**inputPlaceholder:** "https://…"

## 0.5 · m0l5 · system screen — Snapshot reveal
**Headline:** Meet your Startup Snapshot
**Sub:** One page. Everything we know about your business so far — and what to attack first.
**Sections rendered from Snapshot v1:** Founder & edge · Project & stage · Your hypothesis · Risk flags · First focus.
**Footer note:** "Your Snapshot updates itself as you work. Something changes or looks off? Say it in your weekly check-in — it listens."
**CTA:** Start Module 1 →

---

# MODULE 1 — Find Your Focus

## 1.1 · m1l1 · theory (place first in module)
**Title:** Everything you believe is a hypothesis

**Body:**
Here's the single most useful mental shift a founder can make: right now, your idea is not a plan. It's a stack of guesses. You're guessing who the customer is, what she struggles with, what she'd pay, and why she'd choose you. That's not a weakness — every great company started as a stack of guesses. The difference between founders who make it and founders who burn a year is simple: the first group *knows* they're guessing, and tests the guesses cheaply, one by one.

That's the loop this whole program runs on: state a hypothesis → design the cheapest possible test → collect real evidence → decide. Keep what survives, kill what doesn't, adjust and go again. Eric Ries called it build–measure–learn. We'll just call it how you work now.

One consequence, and read this twice: **changing your idea based on evidence is not failure — it's the skill.** Slack started as a gaming company. Instagram was a check-in app. Their founders weren't lucky; they were paying attention. If somewhere in the next weeks you discover your real customer isn't who you thought — that's not the program breaking your idea. That's the program doing exactly what it's for, while the discovery is still cheap.

## 1.2 · m1l2 — KEEP (Why a clear idea beats a big idea)
## 1.3 · m1l3 — KEEP (The shape of a one-liner that lands)

## 1.4 · m1l4 · exercise
**Title:** Mission & Vision

**Body:**
Two sentences will steer thousands of decisions you can't foresee yet. Your **mission** is why your company exists — one sentence, so plain you could say it to a stranger without taking a breath. Your **vision** is what the world looks like in ten years if you win. The mission keeps you focused this month; the vision keeps you going in month nine, when it's hard. Don't write poetry. Write something true — you'll refine it as the evidence comes in. We've drafted a starting point from your Snapshot below: challenge it, sharpen it, make it yours.

**inputPrompt:** "Your mission (1 sentence: why this company exists) and your vision (2–3 sentences: the world in 10 years if you succeed)."
**inputMaxLength:** 500

## 1.5 · m1l5 — KEEP (Your value proposition)
## 1.6 · m1l6 — KEEP (Why you?)

---

# MODULE 2 — Research the Market

## 2.1 · m2l1 · theory — REWRITE
**Title:** Is this a market worth winning?

**Body:**
A brilliant idea in the wrong market is a hard place to spend your years. Before you fall in love with your solution, interrogate the market with three questions. How intense is the pain — a painkiller she hunts for, or a vitamin that's nice to have? How often does it strike — daily problems build daily habits; yearly problems get forgotten. And is she already paying — in money, time, or duct-tape workarounds? Existing spend is the strongest signal there is.

Now the part most founders get backwards. You do not need a huge market to start — you need a small one you can *own*. Peter Thiel puts it bluntly: competition is for losers. Amazon didn't start as "the everything store"; it started as books, won books completely, then expanded. Facebook started at one university. The founder who says "my market is every woman aged 25–45" has no market; she has a wish. The founder who says "first-time mothers in Lisbon returning to work" can find her customers this week, learn faster than any big player, and become the obvious choice in her niche — then grow outward from a position of strength.

Small and winnable first. Big later. That's not thinking small — that's how the big ones did it.

## 2.2 · m2l2 — KEEP (Your real competitor is the status quo)

## 2.3 · m2l3 · theory — REWRITE (new topic)
**Title:** Market size without the hand-waving

**Body:**
At some point someone — an investor, a partner, or the doubting voice at 2am — will ask: "how big is this, really?" Most founders answer with theatre: "the wellness market is $500 billion, if we capture just 1%…" Nobody believes that math, and you shouldn't either. Top-down numbers describe an industry; they say nothing about *your* business.

Do it bottom-up instead. Three numbers, multiplied: how many people match your actual target customer? What would one of them pay you per year? What slice could you realistically reach in a few years? That's your honest market. Say you serve independent nutrition coaches in Portugal: roughly 8,000 exist, your product costs €30/month — that's a €2.9M annual market, and reaching 10% means €288K a year. Small? Maybe. Real? Completely. And it tells you something actionable: with those numbers you either raise your price, expand the niche later, or both — decisions top-down math can never give you.

Rule of thumb: a bottom-up number you can defend beats a top-down number that impresses. Investors have heard "1% of billions" a thousand times. A founder who knows exactly how many customers exist and what each is worth — that's rare, and it shows.

## 2.4 · m2l4 — KEEP (Map your competitive landscape)
## 2.5 · m2l5 — KEEP (Your positioning & differentiation)

## 2.6 · m2l6 · premium card
**Title:** Your personal Market Research, done for you

**Card copy:**
Skip two weeks of googling. Our AI research engine builds a report on *your* niche: market size with sources, key trends, a map of direct and indirect competitors with their pricing, and — most valuable — the gaps: underserved segments and openings where you can win. Delivered into your Documents within 48 hours, woven into your Snapshot, and used by your mentor in every recommendation after.

**Bullets:** Market size & growth, bottom-up · Competitor map with pricing · Trends & timing ("why now") · Gap analysis: your openings
**CTA:** Order my research
**Note under CTA:** Included with your Affina subscription.

## 2.7 · m2l7 · field task
**Title:** Walk your competitors' user journey

**Briefing (static part — AI personalizes with names from m2l4):**
Time to stop reading about competitors and *feel* them. Pick 3–5 from your landscape map — include at least one "status quo" workaround (the spreadsheet, the WhatsApp group, the do-nothing option). Sign up as a real customer. Go as far as you can: onboarding, first value, pricing page, even support chat. You're not spying — you're learning what your customer experiences today, and where it quietly breaks. That break is your opening.

**Artifact template (per competitor, text_template):**
1. Competitor & link
2. First impression (what they promise, to whom)
3. Path to value — how many steps until it's actually useful?
4. Pricing — what they charge and how they frame it
5. Where it shines
6. Where it breaks or annoys
7. Your opening — what would make her switch?

**Debrief hint (AI, post-submit):** Compare findings against her positioning (m2l5); flag the sharpest opening; update Snapshot → Market.

---

# MODULE 3 — Customer Discovery

## 3.1 · m3l1 — KEEP (You can't build for everyone)
## 3.2 · m3l2 — KEEP (What makes a great first customer)

## 3.3 · m3l3 · theory
**Title:** Interviews that tell the truth

**Body:**
Here's the uncomfortable fact about customer interviews: done wrong, they *feel* great and teach you nothing. You describe your idea, she says "oh, I'd totally use that," you float home — and she never thinks about it again. She wasn't lying to hurt you. People are polite, and opinions about the future are free.

So we follow one discipline, borrowed from Rob Fitzpatrick's *The Mom Test*: talk about her life, never about your idea. Past behavior, not future promises. Not "would you use an app that plans meals?" but "how did dinner happen last Tuesday?" Not "would you pay for this?" but "what have you already tried? What did it cost you?" Specifics, not generalities: "when was the last time that happened? Walk me through it." What she *did* is evidence. What she *would do* is noise.

Three rules for the room. Don't pitch — the moment you start selling, honest data stops. Ask open questions, then be quiet; the silence after an answer is where the gold comes out. And chase the emotion: when her voice changes — frustration, a sigh, a laugh — pull the thread. "Tell me more about that" is the most valuable sentence in your toolkit.

You'll practice on friendly people first. The craft comes before the volume.

## 3.4 · m3l4 — KEEP (Three candidate customers)
## 3.5 · m3l5 — KEEP (Your beachhead persona)

## 3.6 · m3l6 · exercise
**Title:** Your interview script

**Body:**
A good script is a safety net, not a cage — you'll improvise once the conversation flows, but you'll never freeze. Below, your mentor has drafted a script for *your* persona from everything in your Brain. It follows the shape that works: a warm open ("I'm researching how women like you handle X — no selling, I promise"), her context, past behavior ("walk me through the last time…"), the pain and what it costs her, what she's tried, and a soft close ("who else should I talk to?"). Edit it until it sounds like you — you're the one who'll be saying it out loud. Then rehearse once with your AI practice customer before the real thing.

**inputPrompt:** "Review and edit your interview script. Make it sound like you — you'll be saying these words to a real person this week."
**Note for dev:** AI pre-generates the draft from persona (m3l5) + problem hypothesis; "Practice with AI customer" button = v1 chat rehearsal or tips panel per spec §2.

## 3.7 · m3l7 · field task
**Title:** Run your first real interviews (1–2, warm)

**Briefing (static part):**
This is the week your startup stops being a document and starts being a conversation. Find 1–2 people who match your persona through friends-of-friends — close enough to say yes easily, distant enough to be honest. Ask for 20–30 minutes, say you're doing research, and promise not to sell anything. Then keep that promise.

Nervous? Every founder is, the first time. Remember: you're not imposing, and you're not asking for a favor — most people love talking about their own life to someone who genuinely listens. You need exactly one skill today: curiosity. Your script is ready. The goal isn't volume — it's learning the craft and bringing back your first real signals.

**Artifact: Interview Log (min 1 entry, fields):**
1. Who (name/role — how well they match your persona)
2. Main pain + how she solves it today
3. Key quotes & moments (her words, not yours)
4. Price signal (what she already spends — money, time, workarounds)
5. Verdict: confirms or contradicts your hypothesis? What changes?

**Debrief hint (AI):** Extract pains/quotes → persona doc + Snapshot; score signal strength; encourage; tee up M4 ("in the next module we'll test your idea against what you just heard").

---

# MODULE 4 — Problem, Solution & Product

## 4.1 · m4l1 · theory (place first in module)
**Title:** Fall in love with the problem, not the solution

**Body:**
The number one killer of startups isn't competition, funding, or bad code. It's building something nobody needs — post-mortem studies put it at nearly half of all failures. And it almost always happens the same way: a founder falls in love with her solution and stops checking whether the problem is real.

So we flip the order. The problem is your constant; the solution is just your current hypothesis about how to fix it. Clayton Christensen's frame helps: customers "hire" products to do a job. Nobody wants a meal-planning app — she wants to stop feeling guilty at 6pm when dinner is chaos. The job is the truth. Your app is one possible hire, and she'll switch the moment something does the job better.

Test your problem against three bars. **Intensity** — painkiller or vitamin? **Frequency** — does it hurt weekly, or once a year? **Budget** — is she already spending money, time, or effort on it? A problem that clears all three is worth years of your life. A problem that clears none will quietly kill the prettiest product.

You now hold something most founders skip straight past: real interview data. In this module we put your original idea on the table next to what real women actually told you — and keep what survives.

## 4.2 · m4l2 — KEEP (Full life-cycle use case)
## 4.3 · m4l3 — KEEP (Sketch your product, not your tech)
## 4.4 · m4l4 — KEEP, moved into M4 (Value in numbers: before and after)

## 4.5 · m4l5 · exercise ⭐ (wow moment)
**Title:** Reality check: your idea vs. your interviews

**Body:**
This is where Affina earns its keep. Your mentor has just cross-referenced the idea you arrived with (Module 1) against everything real people told you (Module 3) — and laid out the verdict below: where you were right, where reality disagrees, and what surprised us. Read it slowly. Being wrong somewhere is not bad news; it's the cheapest correction you'll ever get — you're fixing your aim before you've built anything. Now rewrite your problem and solution the way the evidence points. This becomes the foundation for your product, your pricing, and your pitch.

**inputPrompt:** "Rewrite with the evidence in mind: (1) The problem — in your customer's own words. (2) Your solution — what you'll actually build or do. (3) What you changed from your original idea, and why."
**Note for dev:** on open, AI generates comparison card: Confirmed ✓ / Contradicted ✗ / Surprises ! — from m1l5 + m1l4 vs interview_log entries; render above input.

## 4.6 · m4l6 — KEEP (Use-case map)
## 4.7 · m4l7 — KEEP (Product sketch)

## 4.8 · m4l8 · exercise — REWRITE (merged with old old-m5l4)
**Title:** Your value, in numbers — and why it's hard to copy

**Body:**
Two short answers that do heavy lifting for the rest of the program. First, quantify the change you create: what does her life cost *before* you — in hours, euros, stress — and what does it look like *after*? "Saves 6 hours a week" sells; "makes life easier" doesn't. Use what she told you in interviews, not what you hope. Second, name your core — the one thing behind that value that's genuinely hard to copy: your access to an audience, your lived expertise, a data loop, a relationship no one else has. Features get cloned in a weekend. A core doesn't.

**inputPrompt:** "(1) Before → After, in numbers: what changes for her, measurably? (2) Your core: the one advantage behind this that a competitor can't easily copy — and why."
**inputMaxLength:** 600

## 4.9 · m4l9 · field task
**Title:** Ask for a micro-commitment

**Briefing (static part):**
Words are kind; actions are honest. This week you go back to the people you interviewed (and anyone else who fits your persona) and ask for something small but *real*: join the waitlist with their email, agree to be a pilot user, put down a symbolic pre-order, or introduce you to someone who'd pay. You're not selling — you're offering a concrete next step to people who described this exact pain to you.

The magic is in what happens next. A "yes" is your first genuine demand signal — the thing investors, partners, and your own doubting brain all respect. A "no, because…" is nearly as valuable: it tells you precisely what's missing — wrong price, wrong moment, wrong shape. Aim for 3–5 asks. Collect every answer. Screenshot the yeses.

**Artifact:** screenshot (waitlist entry, message thread, or payment) + short note: how many asks, how many yeses, the most useful "no".

**Debrief hint (AI):** Log commitments → Snapshot → Traction; analyze the "no" reasons against value prop; celebrate properly — then: "You've validated a problem, a persona, and real interest. Module 5 turns it into a business: money, pricing, and your North Star."

---

*Next content batches: (2) AI-mentor scoring rubrics for all 🔴/🟡 blocks M0–M4; (3) done-for-you rules (market research etc.); (4) lecture texts M5–M12.*
