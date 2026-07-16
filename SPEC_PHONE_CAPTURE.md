# Phone capture — target-lead numbers for personal sales (alpha)

> Goal: collect phone numbers from HIGH-INTENT founders for personal sales
> calls during alpha — without damaging the signup funnel. TWO placements
> (decided by Shamil 2026-07-06): (A) lead-magnet popup after finishing the
> first module — free AI-business guide, ~~€49~~; (B) paywall-dismiss "talk to
> a founder" offer. Both optional — onboarding is NEVER gated on a phone.
> (An S1-booking phone field was considered and dropped.)

## §0 — Decision log
- **Mandatory phone at onboarding — rejected** (completion killer before value;
  collects non-targets).
- **A = magnet after Module 1 completion** — the intent filter is the placement
  itself: she finished a whole module, so she's an engaged target; the guide is
  the motivation to hand the number. Freebie-seeker risk is low because the
  popup only exists deep in the product.
- **B = paywall dismiss** — saw the price, hesitated: the moment a human closes.
- **C (S1 booking field) — dropped** by decision.

## §1 — Data model & storage (secure)
`users` additions (migration via node script; `schema.ts` same change):
```ts
phone: text,                 // light validation only (a human will dial it)
phoneSource: text,           // 'guide' | 'paywall'
phoneAt: timestamptz,
```
Security: stored on the user row in Neon; written ONLY via the session-authed
PATCH path (Auth Phase B — identity from the signed cookie); readable only via
the owner's session. Never exposed on any pre-auth/public surface. The only
egress is the hot-lead alert email to Shamil (§4).

## §2 — Placement A: guide popup after finishing Module 1 (PRIMARY)
**Trigger:** the moment the LAST block of **M1** flips to completed (module
completion, client-side event in LMS).
> Assumption: "первый модуль" = M1 "Find Your Focus" (M0 is the welcome/intake
> module). If Shamil means M0 — it's a one-line constant change.

**Gating:**
- Never show if `users.phone` is already set.
- Show once; on dismiss remember in localStorage (re-showing on another device
  is acceptable for a magnet).
- **Feature-gated on `GUIDE_URL` env:** if the env var is unset, the popup does
  not render at all — the code can ship before the guide asset exists.

**Popup content (modal, DESIGN.md tokens, celebratory not naggy):**
- Eyebrow: **You finished your first module 🎉**
- Headline: **The AI-First Founder's Guide — our gift**
- Sub: *"How to build your business with AI doing the heavy lifting — the
  playbook we use inside Affina."*
- Price line: **~~€49~~ Free for alpha founders**
- Field: phone (placeholder `+34 600 000 000 · WhatsApp is fine`)
- CTA: **[ Get my free guide ]** · quiet dismiss: "No thanks"
- Consent microline under the field: *"By continuing you agree to our
  [Privacy Policy] and [Terms of Use]. We may contact you about your program."*
  (external links, same `ConsentLine` pattern as onboarding).

**On submit:**
1. Save phone (`phoneSource='guide'`) via the authed PATCH.
2. Instantly swap the popup body to the deliverable: **[ Open the guide → ]**
   (link = `GUIDE_URL`, opens new tab).
3. Also send it by email (durable copy + re-engagement): small transactional
   template "Your AI-First Founder's Guide 🎁" with the same link — reuses
   `sendEmail`, fire-and-forget, dedupe via `email_log` type `guide`.
4. Fire the hot-lead alert (§4) + analytics events.

**⚠️ Asset dependency (Shamil):** the guide itself (PDF/Notion/page) must exist
and its URL go into `GUIDE_URL` (Vercel env). Until then the popup stays hidden
by the env gate. The promise "€49 value" is Shamil's pricing call on the asset.

## §3 — Placement B: paywall dismiss (hot sales moment)
**When:** she clicks "Not now — I'll keep exploring" on the paywall
(`Paywall.tsx` `onDismiss`).
- Small step (inline section or lightweight modal) before returning to
  Dashboard: **"Not sure yet? Talk it through with a founder."**
- *"15 minutes, honest answers about whether the full program fits your stage.
  Leave your number — we'll reach out."* + phone field + **[ Have someone call
  me ]** / **"Just take me back"**.
- Same consent microline as §2. Never re-shown more than once per paywall
  visit; skipped entirely if phone already on file (`phoneSource` stays the
  FIRST source — don't overwrite on a later save from another surface).

## §4 — Hot-lead alert + analytics
On ANY phone save: fire-and-forget email to `sk@affina.space` via `sendEmail`:
- Subject: `📞 New lead: {name} ({source})`
- Body: name, project, phone, source (guide/paywall), current module,
  verified/subscribed status, her email.
Analytics events (SPEC_ANALYTICS taxonomy): `guide_offer_shown` ·
`phone_submitted {source}` · `phone_skipped {source}` · `guide_opened`.

## §5 — Env vars
- `GUIDE_URL` — public URL of the guide asset. Unset = Placement A hidden.

## §6 — Acceptance
- [ ] `users.phone/phoneSource/phoneAt` added; writes only via session-authed
      PATCH; no pre-auth surface exposes them.
- [ ] Finishing M1's last block (with `GUIDE_URL` set, no phone on file) → popup
      with ~~€49~~ Free, consent links, phone field.
- [ ] Submit → phone saved (`source='guide'`) → "Open the guide" reveals
      `GUIDE_URL` → guide email delivered once (email_log dedupe).
- [ ] Dismiss → not re-shown on that device; never shown once phone is set;
      popup absent entirely when `GUIDE_URL` unset.
- [ ] Paywall "Not now" → founder-call offer (once per visit; skipped if phone
      on file); both paths return to Dashboard.
- [ ] Every phone save fires the hot-lead email to sk@affina.space + analytics
      events.
- [ ] Onboarding completion untouched — no step anywhere requires a phone.
- [ ] `tsc -b` + `vite build` pass.
