# Content: Modules M5–M12 (EN)

> Companion to SPEC_PROGRAM_V2.md §2 and CONTENT_M0-M4.md. Texts for all NEW and
> REWRITE blocks. KEEP blocks keep their existing texts (listed for order only).
> Voice: a seasoned professional telling a friend how this really works. Founder = "you",
> her customer = "she". Frameworks are credited, never copied.

## ID map (source of truth for the developer)

| Block | id | type | kind | status |
|---|---|---|---|---|
| 5.1 | m7l1 | text | theory | REWRITE |
| 5.2 | m7l2 | text | theory | REWRITE |
| 5.3 | m8l1 | text | theory | REWRITE (merged with m8l2 — retire m8l2) |
| 5.4 | m7l3 | input | exercise | REWRITE (entryType: business_model) |
| 5.5 | m8l3 | input | exercise | REWRITE (entryType: unit_economics) |
| 5.6 | m11l6 | structured | exercise | MOVE+REWRITE (aiMode: north-star; entryType: north_star) |
| 5.7 | m5l7 | field | field | NEW (artifactType: interview_log, minEntries: 5) |
| 6.1 | m9l1 | text | theory | KEEP |
| 6.2 | m9l2 | text | theory | KEEP |
| 6.3 | m10l1 | text | theory | REWRITE (merged with m10l2 — retire m10l2) |
| 6.4 | m6l5 | text | theory | NEW |
| 6.5 | m9l3 | input | exercise | KEEP |
| 6.6 | m10l3 | input | exercise | KEEP |
| 6.7 | m6l7 | input | exercise | NEW (entryType: site_structure) |
| 6.8 | m6l8 | field | field | NEW (artifactType: url_with_numbers; entryType: launch_results) |
| 7.1 | m6l1 | text | theory | KEEP |
| 7.2 | m6l2 | text | theory | KEEP |
| 7.3 | m7l5 | text | theory | NEW |
| 7.4 | m7l6 | text | theory | NEW |
| 7.5 | m6l3 | input | exercise | KEEP |
| 7.6 | m6l4 | input | exercise | KEEP |
| 7.7 | m7l7 | input | exercise | NEW (entryType: channel_shortlist) |
| 7.8 | m7l8 | field | field | NEW (artifactType: text_template; entryType: acquisition_results) |
| 8.1 | m8l7 | text | theory | NEW |
| 8.2 | m8l8 | text | theory | NEW |
| 8.3 | m8l9 | text | theory | NEW |
| 8.4 | m8l4 | input | exercise | NEW (entryType: sales_script) |
| 8.5 | m8l5 | input | exercise | NEW (entryType: pipeline) |
| 8.6 | m8l6 | field | field | NEW (artifactType: screenshot; entryType: first_sale) |
| 9.1 | m9l7 | text | theory | NEW |
| 9.2 | m9l8 | text | theory | NEW |
| 9.3 | m11l2 | text | theory | MOVE+REWRITE |
| 9.4 | m11l3 | input | exercise | MOVE+REWRITE (entryType: traction_metrics) |
| 9.5 | m9l5 | input | exercise | NEW (entryType: progress_report) |
| 9.6 | m9l6 | field | field | NEW (artifactType: text_template; entryType: non_buyer_insights) |
| 10.1 | m10l4 | text | theory | NEW |
| 10.2 | m10l6 | text | theory | NEW |
| 10.3 | m10l7 | text | theory | NEW |
| 10.4 | m10l8 | input | exercise | NEW (entryType: strengths_audit) |
| 10.5 | m10l5 | input | exercise | NEW (entryType: delegation_matrix) |
| 10.6 | m10l9 | field | field | NEW (artifactType: text_template; entryType: delegation_action) |
| 11.1 | m11l8 | text | theory | NEW |
| 11.2 | m11l9 | text | theory | NEW |
| 11.3 | m11l10 | text | theory | NEW |
| 11.4 | m11l7 | input | exercise | NEW (Delegate mode C; entryType: pivot_scale_decision) |
| 11.5 | m11l4 | input | exercise | REWRITE (entryType: roadmap) |
| 11.6 | m11l11 | field | field | NEW (branching; entryType: verification_sprint) |
| 12.1 | m12l4 | text | theory | NEW |
| 12.2 | m12l7 | text | theory | NEW |
| 12.3 | m12l1 | text | theory | REWRITE (merged with m12l2 — retire m12l2) |
| 12.4 | m12l3 | input | exercise | REWRITE (entryType: pitch_narrative) |
| 12.5 | m12l5 | field | field | NEW (artifactType: text_template; entryType: investor_targets) |
| 12.6 | m12l6 | field | field | NEW (artifactType: outreach_log; entryType: outreach_log) |

*Retired ids: m8l2, m10l2, m12l2, m11l1, m11l5. Deltas to spec §3.5: `m7l3: business_model`
(existing), `m11l7: pivot_scale_decision` (was m11l4 — m11l4 stays `roadmap`),
add `m6l8: launch_results`, `m7l8: acquisition_results`, `m10l8: strengths_audit`,
`m10l9: delegation_action`, `m11l11: verification_sprint`.*

---

# MODULE 5 — Business Model & Revenue

## 5.1 · m7l1 · theory — REWRITE
**Title:** How you charge decides what you build

**Body:**
Let me tell you the thing about business models that took most of us embarrassingly long to see: your model isn't a detail you sort out later. It quietly decides everything — what product you build, how you talk to customers, even what your year looks like.

Here's the menu, roughly. **Subscription**: she pays monthly; you get predictable revenue but must earn her loyalty every single month. **One-off purchase**: simpler, but you're hunting new buyers forever. **Marketplace or commission**: you win when others transact — powerful, but you're building two audiences at once. **Freemium**: free brings the crowd, a few percent pay — works with big volumes, brutal with small ones. **Services or productized services**: money now, and it doesn't scale — which is completely fine as a starting bridge.

Now the part that matters. Bill Aulet's team at MIT treats choosing a model as its own deliberate step — because "a thousand women on a $15 subscription" and "six companies on a $10K contract" are *different companies*. Different product depth, different marketing, different pace, different you. Neither is better. But you can't be both at once, and pretending you can is how founders stay stuck.

By the end of this module you'll pick one — and turn it into a goal for the year.

## 5.2 · m7l2 · theory — REWRITE
**Title:** Price from value — and stop discounting yourself

**Body:**
Pricing feels scary because most founders price from the wrong end. They add up their costs, add a modest margin, and hope nobody objects. Flip it. The right question is never "what does this cost me to make?" — it's "what is the change worth to her?"

You already did the hard part in Module 4: you quantified the before-and-after. If your product saves her six hours a week, or brings her three new clients a month, price against *that*. A rule of thumb the value-pricing world lives by: charge a fraction of the value you create — if she gains €1,000 a month, €100 is not expensive, it's obvious.

Now the sisterly truth, because the data backs it: women founders systematically underprice. We soften the number, add a discount before anyone asked, apologize with our pricing page. Here's the reframe — your price is a signal of what *you* believe your product does. A too-low price doesn't say "kind"; it says "unsure it works."

You don't have to guess. In this module's interviews you'll ask real people real money questions — what they pay today, what feels cheap, what feels steep. And remember: the easiest test in business is raising a price. If nobody flinches, you were too low.

## 5.3 · m8l1 · theory — REWRITE (merged, retire m8l2)
**Title:** Napkin math + the one number that steers you

**Body:**
Two small pieces of math and one big idea, and then you're free — I promise this is lighter than it sounds.

Piece one: **LTV**, lifetime value. Roughly: what she pays you per month × how many months she stays (or the value of a one-off purchase × how often she returns). Piece two: **CAC**, customer acquisition cost — what you spend in money and time to win one customer. The healthy shape, as a rule of thumb: LTV at least **three times** CAC. If you pay €90 to win a customer worth €100 — you don't have a business, you have an expensive hobby. Don't aim for precision yet; aim for honesty. Napkin numbers that face reality beat spreadsheets that flatter you.

The big idea: the **North Star Metric** — an approach popularized by Sean Ellis and the growth community. One number that best reflects real value delivered to customers. Airbnb tracks nights booked. Spotify, hours listened. Not revenue directly — the thing that *causes* revenue.

And here's where your model choice pays off: it dictates your North Star's shape. Subscription → active subscribers who stay. Big contracts → deals closed × deal size. Marketplace → completed transactions. Next exercise, you'll pick yours and turn it into a goal for the year. From then on, every week answers one question: did the number move?

## 5.4 · m7l3 · exercise — REWRITE
**Title:** Your business model — and why this one

**Body:**
Time to choose. Pick the model that fits three things at once: your customer (how does *she* prefer to pay?), your value (one-time fix or ongoing change?), and your own ambition from Module 0 (calm profitable business or venture-scale ride?). Then defend it in writing — not for us, for you. A choice you can't explain is a choice you'll quietly abandon in week six.

**inputPrompt:** "(1) Your model. (2) Why this one — connect it to your customer, your value, and your own goal. (3) Which alternative you rejected, and what would make you reconsider."
**inputMaxLength:** 600

## 5.5 · m8l3 · exercise — REWRITE
**Title:** Unit economics v1 — napkin version

**Body:**
Rough numbers, honestly stated. Price per customer, months she'll stay (or repeat purchases), what one customer costs to acquire. Your mentor will assemble the LTV:CAC picture and — more usefully — flag the two or three assumptions doing the heaviest lifting. Those shaky numbers aren't a problem; they're your test list. You'll check the price one against real people in this module's interviews.

**inputPrompt:** "Your napkin math: expected price · how long a customer stays (or how often she buys) · what you think one customer costs to acquire — and which of these numbers you're least sure about."
**Note for dev:** AI response must mark each assumption confident / shaky and connect shaky ones to upcoming tests (5.7 interviews, M6 launch, M8 sales).

## 5.6 · m11l6 · structured exercise — MOVE+REWRITE (aiMode: north-star)
**Title:** Your North Star — and what "a good year" means

**Body:**
Based on your model, your mentor will suggest a few North Star candidates — each with why it fits and how to measure it. Pick the one that best reflects real value delivered (not vanity, not raw revenue). Then make it a year goal and cut it into four quarterly steps. This number becomes your compass for the rest of the program: the weekly check-in will ask about it, the dashboard will track it, and module by module we'll push it.

**Note for dev:** existing north-star mechanic (candidates + recommended) stays; add fields `yearGoal` (number + unit) and `quarterMilestones[4]`. AI sanity-checks the goal against unit economics (5.5) and market size (M2) — flags "brave but unrealistic" kindly.

## 5.7 · m5l7 · field task
**Title:** 5–10 interviews — now with money questions

**Briefing (static part):**
You've done warm interviews; now we widen the circle and add the questions that used to feel awkward. Target 5–10 conversations with people matching your persona — beyond friends-of-friends this time: communities, LinkedIn, referrals from earlier interviews ("who else should I talk to?" — remember?).

Everything from Module 3 still applies: her life, past behavior, no pitching. New layer — money, asked without selling anything: *"What does this problem cost you today — time, money, nerves?" "Have you ever paid for anything to solve it? What happened?"* And when it flows naturally: *"If something did X, what would feel like a fair price? At what price would it feel suspiciously cheap — and at what price, way too much?"* (That last pattern comes from the Van Westendorp pricing method — you're just having a normal conversation.)

You're not selling. You're measuring the temperature of money around this pain. Five entries minimum in your Interview Log — aim for ten.

**Artifact:** Interview Log, ≥5 entries (same 5 fields; field 4 "price signal" is now required, not optional).
**Debrief hint (AI):** aggregate WTP signals → update pricing hypothesis (5.5) and flag if evidence contradicts chosen model (5.4); update Snapshot → Model; tee up M6: "you know the pain, the person, and the price range — time to build the smallest thing that earns."

---

# MODULE 6 — MVP & Website

## 6.1 · m9l1 — KEEP (Identify your riskiest assumptions)
## 6.2 · m9l2 — KEEP (Pretotyping: fake door, landing page, Wizard of Oz)

## 6.3 · m10l1 · theory — REWRITE (merged, retire m10l2)
**Title:** MVBP, the scope knife, and why building is the easy part now

**Body:**
Forget "MVP" as an excuse to ship something embarrassing. The MIT framing is sharper — a **Minimum Viable *Business* Product**: the smallest thing that (a) genuinely delivers the value you promised, (b) someone *pays* for, and (c) teaches you something real. Payment is part of the definition, not a later milestone. Reid Hoffman's line still stings because it's true — if you're not a little embarrassed by version one, you shipped too late — but embarrassed about polish, never about value.

Getting there takes a knife, not a roadmap. List everything your product "should" do, then cut until what remains barely — *barely* — delivers the core change for your one persona. Every feature you keep delays the day a real customer teaches you something. When it hurts a little, you're close.

And here's your unfair advantage in 2026: building stopped being the bottleneck. With AI builders and no-code tools, a working landing page is an evening and a first product version is days — Harvard Business School students now ship working demos inside a one-week bootcamp. The scarce skill isn't code anymore; it's *clarity* — knowing exactly what the smallest valuable thing is. Which, after five modules of evidence, you have. Let's use it.

## 6.4 · m6l5 · theory
**Title:** A landing page has exactly one job

**Body:**
Think of the best shop assistant you've ever met: she gets what you need in one sentence, shows you the exact thing, and doesn't perform a company presentation at you. That's a good landing page.

One page, one job: turn the right visitor into one signal — an email, a booking, a pre-order. Not "tell everything." One.

The shape that works, top to bottom. **Hero**: whose problem you solve and the result — in her words, ideally words straight from your interviews (this is called message-match: she should feel read, not advertised to). **The problem**: two or three lines proving you *get* it. **How it works**: three simple steps, no jargon. **Proof**: quotes, numbers, your story — whatever's true. **The offer and the ask**: one button, one action, zero "learn more."

Two notes worth their weight. First — a trick from the StoryBrand school: she is the hero of this story; you're the guide. Pages that brag lose to pages that understand. Second: decide *now* what number tells you the page works (visitors → sign-ups is the usual one). A page without a success metric isn't a test; it's decoration.

## 6.5 · m9l3 — KEEP (Assumptions map)
## 6.6 · m10l3 — KEEP (MVBP definition)

## 6.7 · m6l7 · exercise
**Title:** Your site structure

**Body:**
Your mentor has drafted the full structure below — hero, problem, steps, proof, offer — assembled from your Brain: your persona's words, your quantified value, your price. Your job is editorial, and it's the part that matters: make every line true and make it sound like you. Kill anything you can't back up. A visitor should read the hero and think "how did they know?" — that's the bar.

**inputPrompt:** "Edit your site structure until every sentence is true, specific, and sounds like you. Mark the one metric that will tell you the page works."
**Note for dev:** Delegate mode A is the default flow here (draft pre-generated on open).

## 6.8 · m6l8 · field task
**Title:** Publish it. Let real people see it.

**Briefing (static part):**
This week your startup gets an address on the internet. Build the page with any tool you like (AI builders make this an evening — we'll suggest options in the task), publish it, and *before* you share it anywhere, write down your success threshold: "I'll call this validated if X of Y visitors leave an email / book a call / pre-order."

Then bring it to the people who already know the pain: your interviewees, the communities where you found them, two or three places where your persona actually spends time. This is not "launching to the world" — it's showing a door to people who told you they want what's behind it.

Perfect is not the assignment. Live is the assignment.

**Artifact:** URL + numbers (visitors, sign-ups/conversions, vs. your pre-declared threshold).
**Debrief hint (AI):** compare result to threshold honestly; conversions → Snapshot → Traction; below threshold → diagnose with her (message? audience? offer?) — this is data, not defeat; tee up M7: "now let's get you traffic on purpose instead of by luck."

---

# MODULE 7 — Customer Acquisition & Marketing

## 7.1 · m6l1 — KEEP (The path to a paying customer)
## 7.2 · m6l2 — KEEP (Who really decides)

## 7.3 · m7l5 · theory
**Title:** Nineteen channels exist. You need two.

**Body:**
Open any marketing blog and you'll drown: SEO, ads, influencers, PR, communities, content, partnerships, events… Gabriel Weinberg — the founder who later built DuckDuckGo — catalogued nineteen distinct traction channels and, more usefully, gave us the **Bullseye** method for choosing: brainstorm across all of them without prejudice, cheaply test the two or three most promising, then pour everything into the one or two that actually move your number. Not five channels. One or two, done properly.

Here's the counterintuitive part for your stage, and it's pure Paul Graham: right now, **unscalable beats scalable**. Personal messages beat ad campaigns. Showing up in her community beats SEO you'll wait six months for. The Airbnb founders went door to door photographing apartments; the Stripe brothers installed their product on founders' laptops on the spot. Nobody's proud of tactics like these at dinner parties — but they produce your first ten customers *and* teach you exactly what makes people say yes, which is knowledge every scalable channel will need later.

So resist the "be everywhere" itch. At your size, focus isn't a constraint — it's the strategy.

## 7.4 · m7l6 · theory
**Title:** The leaky bucket (or: why retention comes first)

**Body:**
Picture pouring water into a bucket with a hole in the bottom. That's what "more marketing" does for a product people don't stick with — you pay for water and lose it through the hole. Alex Schultz, who ran growth at Facebook, is blunt about this: retention is the single most important thing for growth; without it, nothing else matters.

So before scaling any channel, map the whole journey. The classic frame is Dave McClure's **AARRR** — pirate metrics, genuinely: **A**cquisition (she finds you) → **A**ctivation (she gets real value the first time) → **R**etention (she comes back) → **R**eferral (she tells someone) → **R**evenue (she pays). Five stages, five numbers, and usually one stage quietly bleeding.

Two habits to take from this. First, find your product's **magic moment** — the point where she *feels* the value (for Facebook it was seeing friends on the feed; for you, maybe the first result your product delivers) — and shorten the road to it ruthlessly. Second, watch cohorts, not totals: of the ten people who tried it two weeks ago, how many are still here? That flattening curve — people who stay — is the most honest compliment a product can get. We'll measure it properly in Module 9.

## 7.5 · m6l3 — KEEP (Acquisition path)
## 7.6 · m6l4 — KEEP (Decision & influence map)

## 7.7 · m7l7 · exercise
**Title:** Five candidate channels, two bets

**Body:**
Bullseye time. Your mentor has ranked candidate channels for *your* persona and budget — where she actually spends time, what you can test for near-zero money this week. Review the shortlist, adjust from what you know, then commit: pick the **two** you'll test, and write one falsifiable hypothesis for each — "channel X will bring me Y conversations for Z hours of effort." That sentence is what turns marketing from vibes into an experiment.

**inputPrompt:** "Your 5 candidate channels ranked → the 2 you'll test this week → one hypothesis per channel: expected result per effort ('X will bring Y for Z')."
**Note for dev:** Delegate mode B — AI proposes ranked list, she picks and commits.

## 7.8 · m7l8 · field task
**Title:** First traffic on purpose

**Briefing (static part):**
Run your two channel tests this week — small, cheap, personal. If it's a community: show up, be useful, share your page where appropriate (not spam — contribution). If it's direct outreach: personal messages, her language, no copy-paste blast. If it's content: one honest post about the problem, not about you.

Track everything simply: how many people saw / clicked / converted per channel. Numbers, not impressions of numbers. At your scale even 30 visitors split across two channels tells a story — one of them will quietly outperform, and that's your answer for the next month.

**Artifact (per channel):** what you did · reach · clicks/replies · conversions · hours spent · verdict (double down / drop / adjust).
**Debrief hint (AI):** compute rough CAC per channel; update unit economics (5.5) with real numbers; winner → Snapshot → Traction; tee up M8: "people are arriving. Now — the conversation where they become customers."

---

# MODULE 8 — Sales: You Are the Founder Who Sells

## 8.1 · m8l7 · theory
**Title:** You are the sales team now (good news, actually)

**Body:**
Let's address the plan you may secretly have: "I'll build the product, and someone else — someone *salesy* — will sell it." Tyler Bosmeny, who built Clever into the product used by more than half of America's schools, opens his famous Y Combinator sales lecture by demolishing exactly that fantasy: at the start, the founder *is* the sales team. Not because you can't afford a salesperson — because a salesperson can't do what you do. You know the problem deeply, you met the customer in her own words, and you carry a founder's honest conviction no hired closer can fake.

And there's a second reason nobody can substitute for you: at this stage, **selling is research**. Every conversation tells you what landed, what confused, what objection keeps repeating, what price makes people go quiet. A hired salesperson would report "they said no." You'll hear *why* — and fix the product, the offer, or the audience next week.

The shape of the work is simple, and we'll build it step by step: prospecting (who to talk to — you already have a list warmer than most founders dream of), conversations (where you mostly listen), closing (where you ask). It's a craft, not a talent. Crafts are learnable.

## 8.2 · m8l8 · theory
**Title:** You're not selling. You're helping.

**Body:**
Now the honest part. For many founders — and, research and a thousand accelerator batches suggest, especially for women — the biggest obstacle in sales isn't skill. It's the cringe. *I don't want to be pushy. I don't want to bother anyone. What if it sounds like I'm begging?*

Here's the reframe, and it isn't a trick — it's the literal truth of your situation. These people **told you about this pain themselves**. You sat with them; they described what it costs — in hours, money, nerves. You then built something that removes that pain. Offering it to them is not an imposition. Staying silent about it is. Imagine knowing a good doctor and hiding her from a friend with a bad back — that's what "not wanting to bother people" actually does.

A few beliefs to install permanently. A "no" is information about fit — wrong moment, wrong budget, wrong shape — never a verdict on you. Pushiness isn't asking; it's not listening after you ask (and you're a trained listener now — three modules of interviews say so). And confidence in a price comes from Module 4's numbers: you're not naming a wish, you're naming a fraction of the value you measurably create.

You'll rehearse before anything real. Fear shrinks with repetitions — that's the entire secret.

## 8.3 · m8l9 · theory
**Title:** Funnel math: volume beats perfection

**Body:**
Sales at your stage is a numbers game with humbling, liberating math. Bosmeny's picture of it: a wide funnel that narrows fast — of the people you reach, some reply; of those, some talk; of those, a few buy. Early on, converting even a few percent of cold-ish conversations into deals is *normal*. Which means a thin week of selling isn't a message about your worth — it's just not enough at-bats. Thirty real conversations will teach and earn you more than three perfect ones.

Three mechanics do most of the work. **The ask**: at the end of a good conversation, actually propose the deal — name the price, then stop talking. The silence after a price feels eternal; let it. Founders lose deals not by asking badly but by never quite asking. **The follow-up**: most yeses arrive on touch three, four, five — not because people are rude, but because they're busy. A warm, short follow-up is professionalism, not desperation. **The honest pipeline**: track every prospect by stage, and let "maybe"s die with dignity — a clean no beats a zombie maybe every time.

One founder-math note to keep you sane: at the beginning, one paying customer changes everything. Not because of the revenue — because of the proof.

## 8.4 · m8l4 · exercise
**Title:** Your sales script

**Body:**
Your mentor has drafted a script from your Brain — persona, pain, quantified value, price, and the objections that actually came up in your interviews. Structure: open with curiosity (a discovery question, not a pitch — yes, still Mom Test rules), connect their pain to your fix in one honest sentence, make the ask with the price, and handle the top objections without flinching. Edit until it's your voice. Then rehearse with the AI customer — it will push back, stall, and ask about price, on purpose.

**inputPrompt:** "Edit your sales script: the opener, the one-sentence bridge from her pain to your offer, the exact ask with price, and your answers to the top 3 objections."
**Note for dev:** Delegate mode A (pre-drafted); "Rehearse" button → AI skeptic role-play with debrief (where she pitched too early, where she didn't ask).

## 8.5 · m8l5 · exercise
**Title:** Your pipeline

**Body:**
List every real prospect you have — interviewees who felt the pain, waitlist sign-ups, warm intros, the community members who engaged. Real names only (no imaginary "segments"). Stage each one: to contact → in conversation → offer made → closed / passed. Then set your weekly quota — how many touches per week you'll actually sustain. A modest quota you hit beats an ambitious one you avoid.

**inputPrompt:** "Your pipeline: real prospects with stages, and your weekly touch quota."
**Note for dev:** AI pre-fills candidates from Brain (interview log, waitlist) — she confirms/extends; inventing prospects is forbidden (no-fabrication rule).

## 8.6 · m8l6 · field task
**Title:** Close your first paid deal

**Briefing (static part):**
This is the week the program has been pointing at since day one. Work your pipeline: conversations, asks, follow-ups. The goal — one real, paid yes. Small counts. A discounted pilot counts. A pre-payment counts. A €30 first month counts. What matters is the shape: money moved because someone valued what you made.

Practical notes. Offer a founder-price honestly ("early customer price — you're helping me build this") — it's dignified and true. Ask at the natural moment, name the number, and hold the silence. If the week ends without a close: collect every "no, because…" carefully — you're one module away from the review where those reasons become your sharpest data.

Go get it. And when the payment lands — screenshot it. That picture goes in your Snapshot, your future pitch deck, and honestly, maybe a frame.

**Artifact:** payment proof (screenshot) — or, if no close: ≥5 documented asks with reasons given.
**Debrief hint (AI):** on close → celebrate LOUDLY, log first_sale → Snapshot → Traction (+Launch Readiness spike), capture what worked; no close → zero shame, aggregate no-reasons → direct input for M9; either way tee up M9: "now we look at everything the numbers are trying to tell you."

---

# MODULE 9 — Review: Look at the Truth

## 9.1 · m9l7 · theory
**Title:** Three numbers tell the truth

**Body:**
Halfway point. Time to do what strong founders do and weak founders avoid: look at the numbers without flinching.

MIT's delta v accelerator — the one that turned student teams into a billion dollars of funded companies — makes every team track just three things, and it's the cleanest dashboard I know. **Traction**: real customer signals — sign-ups, pilots, payments, retention. **Product**: is the thing itself moving — launched, improved, closer to the magic moment? **Cash**: money in versus money out, and how long you can keep going. Their rule is worth tattooing somewhere: *every meaningful action should map to one of these three.* If a week's work moved none of them, it was motion, not progress — and we've all had those weeks; the skill is noticing.

One distinction before you open your dashboard: **lagging vs leading** numbers. Revenue is lagging — it tells you about decisions made weeks ago. Conversations started, demos booked, activation rate — those are leading; they predict next month. Beginners stare at the lagging number and despair; operators move the leading ones and wait.

This module is a checkpoint, not a course. Less learning, more looking. Let's see what your business is actually saying.

## 9.2 · m9l8 · theory
**Title:** Vanity numbers feel good. Real numbers change decisions.

**Body:**
Eric Ries gave us the term **vanity metrics**: numbers that go up, feel wonderful, and inform exactly nothing. Total registrations since launch. Page views. Followers. They only ever grow (nobody un-registers), so they flatter you regardless of reality. The test for a real metric is brutal and simple: *if this number changes, will I do something differently?* No? Decoration.

The real ones live in your **funnel**: visitors → sign-ups → activated → paying → staying. Written as conversion rates between stages, your whole business becomes five honest numbers. And here's the near-universal law: **one stage is leaking far worse than the others**. Not five problems — one bottleneck wearing five costumes. People visit but don't sign up? Message problem — the page promises the wrong thing or speaks the wrong language. Sign up but never activate? The road to first value is too long. Activate but don't pay? Value's real but the offer or price is off. Pay but don't stay? The product under-delivers on the promise.

Fixing the bottleneck moves everything downstream of it — which is why one focused fix beats five scattered improvements. Your only job in the next exercise: find yours, and form a hypothesis about *why* it leaks.

## 9.3 · m11l2 · theory — MOVE+REWRITE
**Title:** Retention: do they come back?

**Body:**
Of every metric you own, this one is the most honest: **do people come back?** Anyone can be persuaded to try something once — curiosity, politeness, a good landing page. Returning is different. Returning means it worked.

The tool here is the **cohort curve**. Take everyone who started in a given week and watch what fraction is still active one week later, two, four. The curve always drops at first — normal, universal, fine. The question is what it does next. If it keeps sliding toward zero, the bucket leaks and growth would just be expensive water. If it **flattens** — some stable group stays and uses — congratulations: those people found real value. A flattening retention curve is the closest thing early-stage life has to proof of product-market fit.

Want a second opinion on fit? Sean Ellis — the man who coined "growth hacking" — uses one survey question: *"How would you feel if you could no longer use this product?"* When 40%+ answer "very disappointed," you're onto something; below that, keep tuning who it's for or what it does. Ask your actives this week — it takes an hour and removes a lot of self-deception.

And if the numbers are small — five users, eight? Then retention is conversations, not curves: you can simply *ask* each one whether it's working. Smallness is an advantage here. Use it.

## 9.4 · m11l3 · exercise — MOVE+REWRITE
**Title:** Your traction dashboard

**Body:**
Your mentor has pulled everything you've logged — site conversions, channel tests, pipeline, payments — into one funnel view. Look at it the way an investor would: coldly, for five minutes. Then answer: where's the biggest leak, and what's your best hypothesis for *why* it leaks? (Message, audience, road-to-value, offer, price — pick your suspect and say what evidence points there.)

**inputPrompt:** "Your biggest leak (which stage), your hypothesis for why, and the evidence behind that hypothesis."
**Note for dev:** AI assembles funnel from Brain data and marks the weakest stage; her job is the why-hypothesis.

## 9.5 · m9l5 · exercise
**Title:** Your progress report — and the defense

**Body:**
Accelerators like Founder Institute put founders in front of a mentor panel at the two-thirds mark — not to judge, but because *articulating* progress out loud is where founders finally see it. Same ritual, your data. Draft is pre-assembled from your Brain: the three numbers (traction / product / cash), what you shipped, what you learned, what you changed. Your part: the honest narrative — biggest win, hardest surprise, and the one thing you'd tell yourself eight weeks ago. Then defend it to the mentor panel; you'll get a score and three priorities for the next sprint.

**inputPrompt:** "Complete your report: biggest win (with the number), hardest surprise, what you changed because of evidence, and your own top priority for the next four weeks."
**Note for dev:** Delegate mode A for the facts (AI pre-fills); the narrative fields are hers alone. "Defend" = AI panel Q&A, produces rating + 3 priorities → Snapshot.

## 9.6 · m9l6 · field task
**Title:** Talk to the ones who said no

**Briefing (static part):**
The most underused resource in any young business: people who *almost* became customers. Visitors who didn't sign up, sign-ups who never activated, prospects who said "let me think." This week, find 3–5 of them and ask — gently, zero sales energy: *"You didn't go ahead, and that's completely fine — I'm trying to learn. What was the moment you decided it wasn't for you?"*

People are surprisingly generous with this when they feel it's safe to be honest. And what they tell you is gold of a purity yeses can't match: yeses confirm what works, but no's point at exactly what to fix — and they're the raw material for the pivot-or-scale decision you'll make in Module 11.

Don't defend, don't explain, don't rescue the conversation. Just ask, listen, write it down.

**Artifact (per conversation):** who (stage they stopped at) · their words about why · what would have changed it (if they say) · your read: price / trust / timing / value / fit.
**Debrief hint (AI):** cluster reasons across entries; match against the funnel leak from 9.4 (usually they rhyme); feed the top pattern into Snapshot → Risk flags and into M11 scorecard.

---

# MODULE 10 — Be a Solopreneur

## 10.1 · m10l4 · theory
**Title:** Your energy is the company's runway

**Body:**
Let's talk about the asset your startup actually runs on. It's not the product and it's not the funding — it's you: your hours, your focus, your energy. And unlike code, you don't scale by pushing harder. Founders who treat themselves like an infinite resource all discover the same thing, always at the worst moment.

Two ideas will do most of the protecting. First, Paul Graham's **maker vs manager schedule**: deep work (building, writing, thinking) needs long unbroken blocks; scattered calls and "quick things" shred those blocks into confetti. Solo, you're both maker and manager — so split them deliberately: mornings for making, afternoons for the world, or whatever split matches your life. A calendar that mixes them randomly produces busy, exhausted, and strangely unproductive weeks.

Second: manage **energy**, not just time. You have two or three genuinely sharp hours a day. Spend them on the highest-leverage thing — usually the uncomfortable one, usually involving other humans — not on the inbox. And take Sam Altman's pairing seriously: focus *and* intensity, on very few things, beats moderate effort on many.

Last, the unglamorous truth: rest is a business function. Burnout doesn't announce itself — it arrives as "I've somehow hated this for a month." The pause button exists in this program on purpose. A rested founder makes better decisions, and decisions are your actual job.

## 10.2 · m10l6 · theory
**Title:** Manage like Horowitz — even a company of one

**Body:**
Ben Horowitz ran companies through the kind of storms that make startup books worth reading, and his management playbook translates surprisingly well to a team of one-plus-freelancers-plus-AI.

His ordering: take care of **the people, the product, and the profit — in that order**. Solo edition: the people is *you* (see previous lesson — not a joke, a priority), then the product, then the money. Founders who invert it — grinding themselves down to chase revenue — lose all three in sequence.

His hiring rule: hire for **strength**, not absence of weakness. When you bring in your first freelancer or contractor, don't seek a safe generalist with no flaws — buy the specific superpower you lack this quarter, flaws included. This applies to tools and AI agents too: the best one at *the one job* beats the decent all-in-one.

And his hardest gift: **brutal honesty with yourself**. Horowitz calls running a company "the struggle" — the gap between what you're telling people and what you fear is true. Solo founders have nobody to perform for, which is exactly why self-deception gets comfortable. The dashboard from Module 9 is your antidote: numbers first, story second. When something isn't working, saying it plainly — to yourself — is the beginning of every fix.

## 10.3 · m10l7 · theory
**Title:** Operate like Rabois: be the editor, and automate before you hire

**Body:**
Keith Rabois — the operator behind PayPal-to-Square legends — describes a leader's job with one image I want you to keep: the CEO is the **editor**, not the writer. You don't produce every page; you decide what the story is, cut what doesn't belong, and put the right resource on the right paragraph. Solo, this means your job is deciding *what gets done and to what standard* — not heroically doing everything.

His other frame: **barrels and ammunition**. Ammunition is capacity — hours, tools, helpers. Barrels are whatever can take an initiative from idea to done. In a company of one, you are the only barrel — so guard your barrel-time ferociously, and turn everything else into ammunition.

Which brings us to the 2026 rule of thumb: **automate before you hire**. The old first hire — an assistant for research, drafts, scheduling, bookkeeping — is now mostly an AI stack plus a few subscriptions, at a fraction of the cost, available at 2am. The honest sequence when you're overloaded: can a tool or agent do it? If not, a freelancer per-task? Only when a *recurring, judgment-light* stream of work outgrows both — hire. And set a **cadence** (Rabois again): a weekly rhythm of review and priorities — which, conveniently, is what your check-in already is.

## 10.4 · m10l8 · exercise
**Title:** Audit yourself honestly

**Body:**
Your mentor has drafted a portrait from everything it's seen — your intake, your work across nine modules, where you flew and where you stalled. Review it: what are you genuinely strong at (the things only you can do for this business), and what drains you or keeps sliding? No performance, no modesty. This audit decides what you delegate next.

**inputPrompt:** "Confirm or correct: your 3 real strengths (things only you should do here), your 3 drains (things that slide or exhaust you), and one blind spot you suspect you have."
**Note for dev:** Delegate mode A⚠ — AI drafts from behavioral data (which tasks stalled, which flew); she confirms.

## 10.5 · m10l5 · exercise
**Title:** Do / Delegate / Automate

**Body:**
List every recurring thing you do in a week — business and busywork alike. Sort into three buckets: **Do** (needs your judgment or your face: strategy, customers, decisions), **Automate** (a tool or AI agent can own it), **Delegate** (a human can own it per-task). Then pick the single item you'll actually offload this week. One. The habit matters more than the volume.

**inputPrompt:** "Your task inventory in three buckets — and the ONE item you're offloading this week (to what or whom)."
**Note for dev:** AI suggests automation candidates per item (incl. what Affina's own agents can take).

## 10.6 · m10l9 · field task
**Title:** Actually offload one thing

**Briefing (static part):**
Plans don't free hours; handoffs do. This week, take your chosen item and genuinely move it off your plate: set up the automation, brief the freelancer, configure the agent — whatever it takes for the task to happen *without you* at least once.

Then notice two numbers: hours freed, and what you spent them on (be honest — "scrolled" is a valid, human answer; next week aim those hours at your leading metrics).

Founders resist this with a familiar voice: "explaining takes longer than doing it myself." True — once. False by the third week, forever after.

**Artifact:** what you offloaded · to what/whom · proof it ran without you · hours freed · where the hours went.
**Debrief hint (AI):** log freed capacity → adjust weekly plan intensity; if it worked, propose candidate #2; tee up M11: "you've made room to think. Good — the next module is the biggest thinking of the program."

---

# MODULE 11 — Pivot or Scale

## 11.1 · m11l8 · theory
**Title:** The fork: let the data vote

**Body:**
Every founder reaches this crossroads, usually right about now: things are *partly* working. Some signal, some silence. And the question arrives: push harder on this exact plan — or change the plan?

First, respect the stakes. The Startup Genome project studied thousands of startups, and their most famous finding says the quiet part loudly: **premature scaling is the number-one killer** — teams pouring money and effort into growing something that wasn't yet working. Scaling a broken thing doesn't fix it; it makes it break faster and more expensively. Growth is a multiplier. Multiply zero, get zero — at scale.

Second, respect the other failure: mood-based decisions. Founders pivot out of a discouraging week and scale out of a flattering one. Both are coin flips wearing conviction. The alternative is sitting right in your Module 9 dashboard: the funnel, the retention curve, the no-reasons from real people. Data votes first; you decide second.

Third — and hear this properly — **neither road is failure**. A pivot with your evidence in hand is the smartest version of continuing. Scaling something validated is earned momentum, not luck. The only genuinely wrong move at this fork is standing still because choosing is scary. This module exists so the choice is informed, deliberate, and yours.

## 11.2 · m11l9 · theory
**Title:** A pivot is a turn, not a restart

**Body:**
The word "pivot" gets abused into meaninglessness, so let's restore Eric Ries's original picture: a pivot is a **change in strategy with one foot planted** — you keep what the evidence validated and turn the rest. It's a basketball move, not a demolition.

Knowing the types helps you see your options instead of a fog. **Customer-segment pivot**: the product works — for someone other than who you targeted (your interviews may have already hinted). **Problem pivot**: right audience, but you discovered a stronger neighboring pain (Slack was a failed game whose team chat turned out to be the product). **Zoom-in**: one feature everyone loves becomes the whole product (Instagram was a cluttered check-in app; the photo filter won). **Business-model pivot**: same value, different charging — subscription instead of one-off, B2B instead of B2C. **Channel pivot**: the product's fine; the road to customers changes.

Notice what every version keeps: your interviews, your persona insights, your quantified value, your hard-won judgment. That's the planted foot. A founder pivoting with nine modules of evidence isn't starting over — she's making her second, far better-informed attempt, at a fraction of the original cost.

Shopify pivoted from selling snowboards. Twitter from a podcast platform. The move has a distinguished history. What it requires is the next lesson's honesty about *when*.

## 11.3 · m11l10 · theory
**Title:** Scale only what repeats

**Body:**
So when do you press the other button? The readiness checklist is short and strict — and Aulet's MIT framework, Thiel's beachhead logic, and every honest growth operator converge on the same items.

**Signals of fit**: your retention curve flattens (people stay), and your Sean Ellis test clears or nears the 40% bar. **Economics that carry weight**: LTV comfortably above CAC — the 3:1 neighborhood — *on real numbers*, not projections. **Repeatability**: this is the big one. You can name *why* customers buy and produce the next one *on purpose* — same motion, same message, same channel, working more than once. One sale is an event. Five sales through the same motion is a machine. Machines scale; events don't.

If that's you, scaling means **more of what works, deliberately**: pour into the winning channel, deepen the beachhead until you own it — and only then expand to the adjacent segment (Amazon's books-first path, Thiel's small-market-first logic; MIT even makes "follow-on markets" its own numbered step).

A word on **blitzscaling** — Reid Hoffman's doctrine of speed-over-efficiency: it's real, and it's for winner-take-all markets with capital to burn. That's almost certainly not your next move — and knowing that is wisdom, not smallness. For you, scaling is a bigger flame under a pot that's already cooking. Never a bigger pot with nothing in it.

## 11.4 · m11l7 · exercise (Delegate mode C)
**Title:** The scorecard

**Body:**
Your mentor has compiled the full case file: retention, unit economics, funnel health, first-sale evidence, non-buyer patterns — everything, weighed for and against each road, with a recommendation and its reasoning. Read it like a board member: where is the evidence strong, where is it thin, what would you want to know that we don't?

Then the part no AI should ever do for you: **the decision**. Pivot (which type, keeping what), scale (which motion, which channel), or a focused fix-first quarter. Write it with your reasoning — future-you will want to know not just what you chose, but why it made sense with what you knew today.

**inputPrompt:** "Your decision — pivot / scale / fix-first — and your reasoning: which evidence weighed most, what you're consciously betting on, and what would make you revisit."
**Note for dev:** mode C strictly — analysis panel renders above; decision field never pre-filled.

## 11.5 · m11l4 · exercise — REWRITE
**Title:** Your 12-month plan

**Body:**
Whatever you chose, give it a spine. Four quarters, each with: the milestone (what exists by quarter's end), the metric target (your North Star number at that point), and the resources it needs (hours, money, first hire or agent). Aulet calls this the product plan — the final step of his framework for a reason: it converts a decision into a calendar. Keep it one page. Plans that fit on one page get followed; decks don't.

**inputPrompt:** "Four quarters: milestone → North Star target → resources needed. Plus the one assumption your whole plan leans on."
**Note for dev:** Delegate mode A⚠ — AI drafts skeleton from scorecard + North Star; milestones confirmed by her.

## 11.6 · m11l11 · field task (branching)
**Title:** Verify before you commit

**Briefing (static part — branch by 11.4 decision):**
A year is a long time to be wrong. Before you commit the next twelve months, spend one week testing the riskiest assumption in your plan — cheap, small, real.

**If you chose scale:** run one experiment on the exact motion you're about to bet on. Twenty outreaches into the new segment, a €50 test in the channel you'll fund, three conversations about the offer you'll push. You're checking that the machine really repeats *before* feeding it a year.

**If you chose pivot:** back to the craft you know best — 3–5 discovery interviews against the *new* hypothesis (your Interview Log is waiting; Module 3 rules apply). You're checking the new direction has a pulse before you steer into it.

**If you chose fix-first:** ship the fix for your bottleneck and re-measure the leaking stage for a week.

One week. Real people. Then — and only then — the plan gets your full commitment.

**Artifact:** what you tested · with whom/where · the numbers or log entries · verdict: plan confirmed / plan adjusted (how).
**Debrief hint (AI):** update scorecard + roadmap with results; confirmed → lock the plan into Snapshot and celebrate the discipline; contradicted → this just saved her a year, say exactly that; gate to M12 passes either way once verdict is written.

---

# MODULE 12 — Fundraising & Your Story

## 12.1 · m12l4 · theory
**Title:** Do you actually need investors?

**Body:**
Before a single pitch deck slide, the question nobody selling you "fundraising advice" asks: **do you need this at all?**

Venture capital is one financing tool with a very specific shape. Taking VC money means promising fast, aggressive growth toward a large outcome — investors need their winners enormous, because most of their bets return nothing. That's not good or bad; it's a treadmill you *choose*, and it fits certain businesses beautifully and others miserably. Remember your Module 0 answer about the life you're building? Match the money to that — not the other way around.

The full menu: **Revenue** — the least dilutive financing on earth; every sale is fundraising nobody can reject. **Bootstrapping** — full ownership, your pace, your rules. **Grants and competitions** — free money that takes applications instead of equity; women-founder programs (Cartier Women's Initiative, national women-in-business funds, EU schemes) exist precisely for you — use them without hesitation. **Angels** — individuals writing smaller checks, often with warmth and doors attached; women-angel networks are growing fast and actively look for founders like you. **Crowdfunding** — money plus market proof in one move. **Revenue-based financing** — repay as a share of sales, keep your equity. And yes, **VC** — for venture-scale ambitions with the evidence to match.

Whatever you pick, the next lessons still matter: how rounds work is negotiation literacy, and a sharp pitch opens doors that have nothing to do with money.

## 12.2 · m12l7 · theory
**Title:** How a round actually works (plain words, no mystique)

**Body:**
Let's demystify the machine, because founders negotiate badly when the other side knows the rules and they don't.

**Why investors behave that way:** a fund's returns follow a power law — a couple of investments repay the whole portfolio; the rest fade. So every investor is scanning for "could this be enormous?" It's why they obsess over market size (your bottom-up TAM from Module 2 finally gets its stage) and why a "no" often means "not fund-scale" — not "not good."

**How much to raise:** enough to reach the next proof point — typically 18–24 months of runway to hit milestones that justify the *next* conversation. Raising less strands you mid-experiment; raising much more sells equity you didn't need to sell.

**The paperwork, translated:** early rounds mostly run on the **SAFE** — a Y Combinator-invented agreement where money arrives now and converts to shares at the next priced round. The **valuation cap** sets the maximum price for that conversion — in practice, it's the number everyone actually negotiates. **Dilution** is your share shrinking as new shares are issued: normal, survivable, worth modeling before you sign anything (your deck exercise includes a calculator).

**The process:** fundraising is a parallel sprint, not a sequential stroll — talk to many investors in the same window, let momentum build, close fast, and get back to the actual business. Marc Andreessen's crowd says it plainly: the raise is fuel, not the destination.

## 12.3 · m12l1 · theory — REWRITE (merged, retire m12l2)
**Title:** Your story, and the deck that carries it

**Body:**
Here's what investors actually buy at your stage — because the spreadsheet can't prove much yet: **a founder who sees something clearly, and evidence she turns insight into motion.** Your story delivers the first; your traction slide delivers the second.

The story isn't biography — it's logic with you inside it: *I lived this problem → I went and verified it was real (your interviews!) → here's what I found that others miss → here's the proof people want it → here's why it gets big.* Ron Conway, who backed Google early, insists you should manage the two-sentence version: what you do, why it wins. If a stranger can't repeat your idea after hearing it once, the deck won't save it.

The deck itself — the Sequoia-shaped skeleton the whole industry speaks: **problem → solution → why now → market size → product → traction → business model → competition → team → the ask.** Ten-ish slides, one idea each, readable without you narrating (decks travel; you won't be in the room when partners re-read it).

At your stage, **traction is the star slide**: your interviews, your conversions, your first payment screenshot, your retention signal. It's the slide that says "this founder doesn't wait for permission" — which, between us, is the whole pitch.

## 12.4 · m12l3 · exercise — REWRITE
**Title:** Build your deck

**Body:**
Your mentor has assembled a first draft from nine modules of your Brain: the problem in your customer's words, your bottom-up market math, the product, every scrap of traction, your model and your 12-month plan. The skeleton is investor-standard; the facts are yours. Now do the founder's part: sharpen the narrative until slide one makes a stranger lean in, and make the ask specific — how much, for what milestones, on roughly what terms. Then rehearse: the AI investor will ask the uncomfortable questions on purpose — better here than in the room.

**inputPrompt:** "Polish your deck narrative: the one-sentence hook, the story arc across slides, and your specific ask (amount → milestones it buys → rough terms)."
**Note for dev:** Delegate mode A (auto-assembled); "Rehearse Q&A" → AI investor role-play (market size, competition, why-you, why-now, use of funds) with debrief; dilution mini-calculator embedded.

## 12.5 · m12l5 · field task
**Title:** Find 20 investors who actually fit

**Briefing (static part):**
Spraying decks at famous funds is how founders collect silence. Fit-first research is how they collect meetings. Build a list of ~20 targets that genuinely match you on four axes: **stage** (they do pre-seed/seed, not just growth), **sector** (they've backed things in your space — check their portfolio, it's public), **check size** (matches your ask), **geography/thesis** (they invest where and in whom you are). Angels count. Women-focused funds and angel networks count double — they exist to find you. Grants and competitions belong on this list too; an application is an outreach.

For each target, note the warmth of your best path in: a real intro beats a lukewarm one beats cold — but a *sharp* cold email with traction beats a vague warm intro, so don't over-wait for perfect paths.

**Artifact (per target):** name · type (VC/angel/grant) · why they fit (portfolio evidence) · check size vs your ask · warmest path in · priority (A/B/C).
**Debrief hint (AI):** score list for fit-honesty (famous ≠ fitting); seed additional candidates by direction (mode: suggestions, she verifies); prioritized list → Snapshot.

## 12.6 · m12l6 · field task
**Title:** Talk to 10 of them

**Briefing (static part):**
Now the real thing. Work your A-priorities first: request the intros, send the emails (your mentor drafts each one from your deck — your words, their thesis — you edit and hit send yourself), submit the grant applications. Target: 10 real contacts out, and at least **one live conversation** — a call, a meeting, a genuine email exchange with questions.

Hold two truths for the week. First: momentum compounds — batch your outreach into the same few days so conversations overlap; investors move faster when they sense others moving. Second: every "no" that comes with a reason is deck-sharpening data — log it exactly like you logged non-buyers in Module 9, because it's the same craft. Rejections here are volume math, not verdicts; even excellent founders hear mostly no.

And when the first investor asks you a hard question you answer well — notice that feeling. Nine modules ago this conversation would have been unimaginable. Now it's Tuesday.

**Artifact (outreach log):** target · channel (intro/cold/application) · date sent · response · if conversation: their questions + objections · next step.
**Debrief hint (AI):** aggregate objections → deck iteration list; any meeting → prep brief from their portfolio; close the program loop: graduation review (S3) references this log + the whole Snapshot journey.

---

*Next: scoring rubrics M5–M12 (same format as RUBRICS_M0-M4.md).*
