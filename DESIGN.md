# Affina Space — Design System

Inspiration: **Female Invest** — editorial, minimal-but-stylish. Deliberately **NOT** the default "AI" look: no Inter, no pure-white, no purple gradients, no heavy shadows.

## Brand in one line
Editorial, confident, minimal. Big readable typography, generous whitespace, ultra-rounded pills, flat surfaces — one **royal-violet primary** + one **emerald accent** on a **soft light-gray canvas**.

---

## Tokens (already wired into `tailwind.config.js` + `src/index.css`)

**Colors** (Tailwind class → hex):

| Purpose | Tailwind | Hex |
|---|---|---|
| Primary — royal violet | `bg-brand` / `text-brand` | `#7150EA` (scale `brand-50…800`) |
| Secondary — emerald | `bg-accent` / `text-accent` | `#119C74` (scale `accent-50…800`) |
| Page background (NOT white) | `bg-canvas` | `#F4F4F5` |
| Card surface | `bg-surface` | `#FFFFFF` |
| Inset (tracks, empty states) | `bg-inset` | `#E9E9EC` |
| Hairline border | `border-hairline` | `#E0E0E4` |
| Text primary (soft, never `#000`) | `text-ink` | `#1F1F23` |
| Text secondary | `text-ink-soft` | `#6C6C74` |
| Text muted | `text-ink-mute` | `#9D9DA6` |

Tint chips: `brand-50` bg + `brand-800` text, or `accent-50` bg + `accent-800` text.

**Fonts:**
- `font-sans` = **Hanken Grotesk** → all UI, body, functional headings.
- `font-display` = **Fraunces** (serif) → brand / emotional moments only (dashboard greeting, onboarding reveal, hero). **No italic for now.**
- Weights: 400 regular, 500 medium, 600 semibold, 700 heavy headlines.

**Radius:**
- `rounded-pill` (999px) → buttons, chips.
- `rounded-card` (20px) → cards.
- `rounded-control` (12px) → inputs, small controls.

---

## Typography rules
- **Hero / brand headline:** `font-display`, large, weight 500, `tracking-tight`. Use **sparingly** — one per screen.
- **Functional headline:** `font-sans`, weight 600–700.
- **Body:** `font-sans`, weight 400, `leading-relaxed` (~1.6).
- **Eyebrow/label:** `font-sans` 600, uppercase, `tracking-wide`, `text-ink-mute`, 11–12px.
- Sentence case everywhere. No italic until later.

---

## Components (build with these)
- **Primary button:** `bg-brand text-white rounded-pill px-5 py-3 font-semibold` (hover → `brand-700`).
- **Secondary button:** `bg-transparent text-brand border-[1.5px] border-brand rounded-pill px-5 py-3 font-semibold`.
- **Card:** `bg-surface border border-hairline rounded-card p-5` (flat — no shadow, or very soft).
- **Chip / tag:** `rounded-pill bg-brand-50 text-brand-800 text-xs font-medium px-3 py-1` (or `accent-50/accent-800`).
- **Progress bar:** track `bg-inset rounded-pill`, fill `bg-brand`.
- **Input:** `bg-surface border border-hairline rounded-control`, focus ring `brand`.
- **Accent badge:** circle, `bg-accent-100` + `text-accent-800` icon (Female-Invest-style accent circle).

---

## Do / Don't
**DO:** soft light-gray canvas; white cards on top; one big serif brand moment per screen; lots of whitespace; pill buttons; flat surfaces.
**DON'T:** Inter / system default look; pure `#fff` page bg; pure `#000` text; purple gradients; drop shadows everywhere; italic (for now); more than 2 brand colors per screen.

---

## Handoff task (for the implementing agent)
Apply this system across the app — replace the old Inter / white / generic styling. **Visual only — do not touch logic, data, or API behavior.**

1. Confirm fonts load (`index.html` links Fraunces + Hanken Grotesk) and Tailwind tokens resolve (`bg-brand`, `text-ink`, `rounded-pill`, `font-display`).
2. Page backgrounds → `bg-canvas`; cards → `bg-surface border border-hairline rounded-card`.
3. All buttons → pill primary/secondary styles above.
4. Text colors → `text-ink` / `text-ink-soft` / `text-ink-mute` (never `#000`).
5. One brand headline per screen in `font-display` (dashboard greeting, onboarding reveal); everything else `font-sans`.
6. Tags/chips → pill with `brand-50` / `accent-50` tints.
7. Replace any hardcoded old purple (`#9333EA`, `rgba(147,51,234,…)`) with `brand` (`#7150EA`).

**Screens / components to restyle:** `src/screens/` (Welcome, Question, EmailCapture, Analyzing, Score, LMS, Dashboard, ProgramIntro) and `src/components/` (AccountPanel, CompareCard, DocumentsPanel, FeedbackCard, ProfileButton).
