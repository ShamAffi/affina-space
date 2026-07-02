# Affina Space

Virtual incubator for early-stage female founders. React + Vite + TS + Tailwind, deployed on Vercel (Neon/Drizzle backend in `/api`).

## Design — read this before any UI work
The visual design system is defined in **[DESIGN.md](./DESIGN.md)**. Tokens are wired into `tailwind.config.js` and `src/index.css`.

Use the Tailwind classes (`bg-brand`, `text-ink`, `bg-canvas`, `rounded-pill`, `rounded-card`, `font-display`, `font-sans`, `bg-brand-50`, etc.). **Never** reintroduce Inter, pure-white (`#fff`) page backgrounds, pure-black (`#000`) text, purple gradients, or the old `#9333EA` purple.

Brand in one line: **editorial, confident, minimal — royal-violet primary (`#7150EA`) + emerald accent (`#119C74`) on a soft light-gray canvas (`#F4F4F5`), big typography, ultra-rounded pills, flat surfaces.**
