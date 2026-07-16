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

## AMENDMENT (2026-07-16) — hide the lead-magnet card in Resources until the
## phone is given (decided by Shamil; keeps the popup exchange honest)

Problem found in live testing: the Resources section listed the guide for every
logged-in user — so the phone popup offered something she could already grab
for free in-app. Fix: a per-doc display gate.

- **`Doc.gate?: 'phone'`** — new optional field in the registry. Set it on the
  guide entry. Docs without `gate` behave as before (future docs aren't all
  lead magnets).
- **Programs.tsx Resources:** render a `gate:'phone'` doc's card ONLY when the
  user has a phone on file (`userData.phone`). Otherwise the card is hidden
  entirely — no teaser/locked state in v1.
- **Unlock = phone from ANY source** (`guide` popup or `paywall` offer) — she
  gave a number somewhere, the exchange is honored everywhere.
- If gating leaves ZERO visible docs, hide the whole Resources section
  (header included) — the `DOCS.length` check becomes a visible-docs check.
- **This is a display gate, not security** — deliberate: the file URL stays
  public (emails, broadcasts, shares keep working; SPEC_DOCS_LIBRARY §1
  rationale unchanged).

Amendment acceptance:
- [ ] Fresh user, no phone → no guide card in Resources (and no empty
      "Resources" header when it's the only doc).
- [ ] Phone given via the M1 popup OR the paywall offer → guide card appears.
- [ ] Direct file URL still opens logged-out (public, unchanged).
- [ ] Ungated future docs render for everyone (add a temp second entry to test,
      or unit-check the filter).

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
