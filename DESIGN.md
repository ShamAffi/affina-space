# Affina Space — Design System (v2, 2026-07)

Confident, editorial, tactile. Warm bone canvas (not white), near-black ink, a single royal-purple brand + emerald accent, one variable font (Archivo) doing everything from heavy display to condensed uppercase tags, on flat surfaces with soft warm shadows and a faint grain over the whole thing.

Tokens are wired into **`tailwind.config.js`** + **`src/index.css`** — build with the Tailwind classes (`bg-brand`, `text-ink`, `bg-canvas`, `rounded-card`, `rounded-control`, `rounded-pill`, `font-display`, `font-sans`, `bg-brand-50`, …), never raw hex.

---

## Fonts — one family: Archivo (variable, width + weight axes)
Loaded in `index.html`: `Archivo:ital,wdth,wght@…,62..125,400..900`.

| Role | Treatment |
|---|---|
| **Display / headings** | Archivo **900**, letter-spacing **−0.045em** (`font-display` sets the tracking; add `font-black`) |
| **Body** | Archivo **500**, letter-spacing **−0.01em** (the global default on `body`) |
| **Buttons / eyebrows / tags** | Archivo **700**, `font-stretch: 66%` (condensed), **UPPERCASE**, letter-spacing **+0.02em** → helper class **`.type-tag`** |
| **Logo** | `affina/space` lowercase 900 — the slash is `text-brand`, `space` is *italic* |

---

## Colors

**Neutrals** (warm):
| Token | Hex | Use |
|---|---|---|
| `canvas` | `#ECE9E2` | page background — warm bone, never white |
| `surface` | `#FFFFFF` | cards |
| `inset` | `#E2DED4` | tracks, insets, empty states |
| `hairline` | `#D9D4C7` | 1px borders |
| `ink` | `#0B0A08` | primary text (near-black), also black buttons |
| `ink-soft` | `#55524B` | secondary text |
| `ink-mute` | `#98948A` | captions / labels |

**Brand — royal purple** (`brand-600` = `#6D28D9` primary):
`50 #F3EBFB · 100 #E7D6F7 · 200 #CBA9EF · 300 #B27EEB · 400 #9A5CE6 · 500 #843BE0 · 600 #6D28D9 · 700 #5B21B6 · 800 #4C1D95 · 900 #2E1065`

**Accent — emerald** (point use only): `50 #E4F5EE · 100 #BEE9D8 · 600 #0F9D74 · 800 #0A5E47`

**Dark panels** (gradient): `linear-gradient(155deg, #3B1580, #2E1065 55%, #160A33)` + a soft white radial highlight top.

---

## Patterns
- **Radii:** cards `rounded-card` 16px · controls/buttons `rounded-control` 8px · pills `rounded-pill` 999px.
- **Buttons:** primary = halo-gradient fill + **black condensed uppercase** label (`.type-tag`); secondary = 2px black (`ink`) outline. Radius `rounded-control` (8px).
- **Shadows** (soft, warm): `0 1px 2px rgba(11,10,8,.05), 0 18px 40px -28px rgba(11,10,8,.25)`; hover-lift `-4px`.
- **Number chips:** black square, 8px radius, white **900** digit.
- **Tint cards:** `bg-brand-50` + `text-brand-800` (or `accent-50` / `accent-800`).
- **Grain:** a fixed `feTurbulence` texture over everything at `opacity .05` (wired in `index.css` `body::after`).
- **Focus ring:** `#6D28D9`, 2px, offset 2px (wired globally on `:focus-visible`).

---

## Do / Don't
**DO:** warm bone canvas; white cards; one heavy Archivo display moment per screen; condensed-uppercase for buttons/eyebrows/tags; flat surfaces + soft warm shadows; grain over all.
**DON'T:** Inter / system default; pure `#fff` page bg; pure `#000` (use `ink #0B0A08`); the old violet `#7150EA` / `#9333EA`; serif display (retired Fraunces); more than 2 brand colors per screen.

---

## Implementation status (2026-07-19)
- ✅ **Wired globally (cascades):** Archivo font (`index.html` + config), full new palette (config + `index.css` vars + component SVG hex), radii (16/8/999), grain overlay, `:focus-visible` ring, body weight/tracking, `.font-display` tracking, `.type-tag` helper.
- 🔜 **Per-component pass (in progress):** converting inline buttons/eyebrows/tags to the black **condensed-uppercase** treatment (`.type-tag`), number chips, and dark-gradient panels — done screen-by-screen so nothing regresses (UI is eyeballed, no preview in CI).
- **Emails** (`src/server/email.ts`) keep their own inline-hex brand for now — update separately if the app/email brand must match exactly.
