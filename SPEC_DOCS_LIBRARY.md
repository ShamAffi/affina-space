# Docs Library — branded downloadable files (stable links, swappable content)

> Decision (Shamil, 2026-07-06): docs are DOWNLOADABLE FILES, not in-app pages.
> The assets are authored, branded PDFs (logo, design) — they're meant to
> circulate and market Affina on their own. So: no auth gate, no page renderer.
> What matters: (1) every doc has a STABLE link that never changes, (2) the file
> BEHIND the link can be updated/replaced later, (3) clicks are trackable, and
> (4) a registry feeds the popup, the Resources section, and the future admin.

## §1 — Storage & stable URLs (swap-friendly)
- Files live in the repo: **`public/downloads/<slug>.pdf`** → served statically
  at **`/downloads/<slug>.pdf`**. Filename = slug, NO version in the name.
- **Replacing a doc = overwrite the file at the same path + deploy.** The URL
  never changes, so every email/popup/share link keeps working; a new Vercel
  deployment serves the new bytes (per-deployment assets — no stale CDN issue).
- Public by design: the files are branded marketing artifacts — if a link
  spreads, that's distribution, not leakage. (The phone-gate is the in-app
  exchange moment, not file security.)
- Self-serve replacement WITHOUT a deploy (upload from an admin panel / Vercel
  Blob) = later, with the admin panel. The URL scheme survives that migration
  (a redirect route can take over the same path).

## §2 — Registry (`src/docs.ts`)
```ts
export type Doc = {
  slug: string;          // '/downloads/<slug>.pdf'
  title: string;
  description: string;   // one-liner for cards
  kind: 'file';          // reserved: 'page' (in-app rendered docs, later)
};
export const DOCS: Doc[] = [
  { slug: 'ai-first-founders-guide',
    title: "The AI-First Founder's Guide",
    description: 'How to build your business with AI doing the heavy lifting.',
    kind: 'file' },
];
```
Single source of truth for the popup, the Resources section, emails, and the
future admin panel.

## §3 — Surfacing
- **Programs page (SPEC_PROGRAMS_PAGE, same sprint):** "Resources" section —
  small cards from `DOCS` (title + description + download icon) → click opens
  `/downloads/<slug>.pdf` in a new tab (browser shows the PDF; user saves it).
- **Phone popup A (SPEC_PHONE_CAPTURE):** unchanged as originally written —
  "[ Open the guide → ]" opens `GUIDE_URL` in a new tab. Now
  `GUIDE_URL=/downloads/ai-first-founders-guide.pdf`.
- **Guide email:** button links the same absolute URL
  (`${APP_URL}/downloads/…`). Files are public → NO magic-link/`?next`
  threading needed (simplification vs the previous page-based design: the
  /login?next work is DROPPED from this spec).
- **Broadcasts (Resend dashboard):** link the file URL directly; Resend's own
  click tracking covers those clicks.

## §4 — Analytics
- In-app click surfaces (popup, Resources cards) fire
  **`doc_downloaded {slug}`** before opening the file (add to SPEC_ANALYTICS §5
  taxonomy; replaces the earlier `doc_viewed` idea).
- Email clicks: Resend click tracking (no code).

## §5 — Amendments to other specs (apply with this one)
- **SPEC_PHONE_CAPTURE:** `GUIDE_URL` value = `/downloads/ai-first-founders-guide.pdf`.
  Popup behavior as originally specced (new tab). Guide email links the same URL.
  The earlier in-app-navigate amendment is VOID.
- **SPEC_ANALYTICS §5:** add `doc_downloaded {slug}`.
- **SPEC_PROGRAMS_PAGE:** add the Resources section (§3 above).

## §6 — Asset intake (Shamil)
- Shamil supplies the ready branded PDF → dev drops it at
  `public/downloads/ai-first-founders-guide.pdf` → set
  `GUIDE_URL=/downloads/ai-first-founders-guide.pdf` in Vercel → popup A goes
  live. Future updates: hand over a new file, same path, deploy.

## §7 — Out of scope (later, with admin panel)
Self-serve upload (Vercel Blob + admin UI) · in-app rendered docs
(`kind:'page'`) · per-doc access tiers · download counters server-side.

## §8 — Acceptance
- [ ] `public/downloads/` + registry in `src/docs.ts`; guide entry present
      (placeholder PDF ok until Shamil's file arrives).
- [ ] `/downloads/ai-first-founders-guide.pdf` opens in a new tab from: the
      phone popup, the Resources section, a plain email link.
- [ ] Replacing the file at the same path + deploy → same URL serves the new
      file (verify once).
- [ ] `doc_downloaded {slug}` fires from in-app click surfaces.
- [ ] No auth required on file URLs; no /login?next work included.
- [ ] `tsc -b` + `vite build` pass.
