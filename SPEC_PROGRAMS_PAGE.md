# Programs / Courses catalog page

> A catalog page showing all learning programs. Closes the "paywall value stack
> promises specialized programs but none exist" gap — even as "Coming soon"
> cards, the catalog makes the promise honest and gives subscribers a roadmap.
> Inspired by Female Invest: clean, editorial, image-topped cards.

## 1. Access & routing

- New screen `programs` (add to Screen type + navigation).
- Entry point: **Dashboard → Learning Path card → "View all lessons" link**
  now routes to this Programs page (repurpose the existing link).
- (Optional) also reachable from a top-nav/menu entry later.

## 2. Layout (per Shamil)

- Centered container, generous max width.
- **Three cards per row**, **large gaps** between them (roomy — e.g. gap-10/12),
  cards centered in the grid. Responsive: 3 → 2 (tablet) → 1 (mobile).
- Page header: title "Programs" + short subtitle
  (e.g. "Your Launch Program, plus deep-dives to go further").
- Female-Invest-style card:
  - Top: **image** (placeholder for now — random/solid brand-tint or a
    placeholder service; Shamil replaces later).
  - Small pill: category or status.
  - Course **title**.
  - One-line description.
  - Meta row: module count + status label.
  - Whole card is clickable.

## 3. Card states

- **Launch Program (the main M0–M12)** — featured first card. Status "In
  progress" / "Continue". Click → LMS (existing behavior/gating: M0–M4 free,
  M5–M12 behind paywall).
- **Specialized programs** (the 4 below) — status **"Coming soon"** for now
  (content not built). Click → a course-preview panel: the 6–8 module titles
  as a teaser + "Full lessons coming soon" + (optional) "Notify me".
  - When their content ships later, they become part of the subscription
    (per the paywall value stack): locked → paywall if not subscribed,
    open if subscribed.
- Design should read honestly: a subscriber sees the roadmap of what's coming,
  not a dead end.

## 4. Data model

- Reuse the existing `COURSES` structure (added in the course-level-pills work).
  Each course: `{ id, name, description, image, moduleCount, status:
  'in_progress'|'coming_soon'|'locked', category, color }`.
- The 4 specialized programs are new COURSES entries with `status:
  'coming_soon'` and a `modules` outline array (titles only for now — full
  Lesson content added later).
- Placeholder images: a field `image` per course; use random/solid placeholders
  now, real assets later.

## 5. The 4 specialized programs — module outlines (titles only; lessons later)

### Digital Marketing — "Get your first customers online" (7 modules)
1. Marketing foundations for founders (positioning, message-market fit)
2. Your content engine (organic content, SEO basics)
3. Social media that converts (pick your platform, sell without being salesy)
4. Email & your owned audience (list building, welcome sequences)
5. Paid ads 101 (Meta/Google basics, small-budget testing, reading numbers)
6. Landing pages & conversion (deeper than the Launch Program)
7. Analytics & doubling down (tracking, attribution basics, finding your channel)

### AI for Business — "Your team of one, powered by AI" (8 modules)
1. The AI-native founder mindset (where AI helps vs where it doesn't)
2. Your AI toolkit (essential tools and when to use each)
3. AI for content & marketing (scale content, keep your voice)
4. AI for building (no-code + AI: MVPs, landing pages, prototypes)
5. AI for operations (automate admin/support/research — Zapier/Make + AI)
6. AI for customer insight (analyze interviews, feedback, research with AI)
7. Build your own AI agents/assistants (custom GPTs, simple agents)
8. Prompting & judgment (good output, spotting hallucinations, human-in-the-loop)

### Founder Finance — "Money & numbers, demystified" (6 modules)
1. Money mindset for founders (pricing confidence; the women-founder angle)
2. Pricing that works (value-based pricing, testing, raising prices)
3. Cash flow & runway (the number that actually kills businesses)
4. Unit economics deep dive (LTV, CAC, margins, contribution)
5. Bookkeeping & taxes basics (what to track, tools, when to get an accountant)
6. Financial modeling on a napkin (a simple forecast you can actually use)

### Personal Brand & Founder-Led Growth — "Build the audience that buys" (7 modules)
1. Why founder-led growth wins (your story is your moat)
2. Finding your voice & niche (content pillars, your unique angle)
3. LinkedIn for founders (presence that attracts customers & investors)
4. Short-form & storytelling (Instagram/TikTok/video, your founder story)
5. Building in public (turn the journey into customers and community)
6. PR & getting noticed (press, podcasts, features — no PR budget)
7. Turning audience into revenue (attention → customers, community, list)

*Alt for #4 if Shamil prefers a Female-Invest soft-power angle: "Founder
Mindset & Confidence" — imposter syndrome, resilience, decision-making under
uncertainty, negotiation & asking, money confidence, founder support network.*

## 6. Out of scope (later)
- Actual lectures/exercises for the 4 specialized programs (this spec is the
  catalog page + course outlines only).
- Real course images.
- Paywall gating of specialized programs (wire when their content ships).

## 7. Acceptance
- Dashboard "View all lessons" → Programs page.
- Cards render 3-per-row, centered, large gaps, responsive down to 1.
- Launch Program card → LMS; specialized cards → coming-soon preview with the
  module outline.
- Placeholder images render and are easy to swap later.
