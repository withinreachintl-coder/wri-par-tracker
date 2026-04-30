# PROGRESS.md — wri-par-tracker

## Product
**Par Level Tracker** — Restaurant staff submit daily par counts via PIN → manager email alert on shortfalls.

## URLs & Infrastructure

| | |
|---|---|
| **Live URL** | https://par.wireach.tools |
| **Repo** | [withinreachintl-coder/wri-par-tracker](https://github.com/withinreachintl-coder/wri-par-tracker) (public) |
| **Vercel project** | `wri-par-tracker` (team: with-reach-tools) |
| **Supabase project** | `wri-par-tracker` / ref `ljqhfrmkhypsjpsvnwds` / us-east-2 |
| **Stripe** | `$19/mo` recurring, 14-day trial — [payment link](https://buy.stripe.com/cNieVcdFL0gJaYL1Ml9k40f) |
| **Resend** | `noreply@wireach.tools` — auth magic link confirmed working |

---

## Current State (as of 2026-04-17)

### ✅ Working
- Magic link auth (`/login` → email → `/auth/callback`)
- Org + user auto-creation on first login (service role, bypasses RLS)
- `/setup` — 3-tab setup: Par List (add/edit items), Staff PIN, Alert Emails
- `/check` — PIN entry → per-item count form with live shortfall preview → submit
- Variance display: counts vs par shown inline with shortfall highlighted
- DB write: `shift_checks` + `shift_check_items` created on submit
- Resend auth emails deliver correctly

### ❌ Broken / Not Verified
1. ~~**Shortfall alert email not delivering**~~ ✅ FIXED — Root cause: `RESEND_API_KEY` env var in Vercel was malformed/empty (flagged "Needs Attention"). Updated the key in Vercel project settings; Vercel auto-redeployed. Both configured recipients (gmail + hotmail) now receive shortfall alerts with correct sender, subject, table, and note. No code change needed.
2. ~~**Landing page is placeholder**~~ ✅ FIXED — Real landing page live at par.wireach.tools (PR #2, Apr 30 2026).
3. ~~**Mobile viewport not verified**~~ ✅ FIXED — /check verified at 390px iPhone 14 (PR #3, Apr 30 2026).

---

## Stack
- Next.js 14 (App Router), TypeScript, Supabase SSR auth, Resend email
- **Styling: inline styles throughout.** Tailwind PostCSS is bypassed (known workaround, deferred to v2 — do not use utility classes).
- Deployment: Vercel auto-deploy from `main` branch

---

## Next Priorities (SPEC-0011)
1. ~~PROGRESS.md~~ ✅ Done
2. ~~Shortfall alert email~~ ✅ Verified working Apr 30
3. ~~Real landing page~~ ✅ Done (PR #2)
4. ~~Mobile viewport fixes~~ ✅ Done (PR #3)
5. ~~SPEC-0012: naming + accessibility~~ ✅ Done (PR #4)
6. SPEC-0013 TBD

---

## Session Log

| Date | Session | Key work |
|------|---------|----------|
| 2026-04-17 | Initial scaffold | Next.js 14 scaffold, Supabase client, CLAUDE.md, WRI design system, placeholder landing page |
| 2026-04-17 | Day 1 | Auth (`/login` + `/auth/callback`), `/setup` 3-tab, `/check` PIN+count+submit, Resend email alert route, variance display. Build passes. |
| 2026-04-17 | CLAUDE.md update | Contrast rule tightened to all surfaces; Tailwind PostCSS workaround documented in backlog. |
| 2026-04-29 | SPEC-0011 planning | Identified 4 problems: alert email, landing page, mobile, PROGRESS.md. Plan approved. |
| 2026-04-29 | SPEC-0011 execution | PR #1 PROGRESS.md merged. Alert email fix: `RESEND_API_KEY` was malformed in Vercel env — fixed by Keon directly, no code change. Both recipients confirmed receiving alerts. |
| 2026-04-30 | SPEC-0011 close-out | **Initial PROGRESS.md entry — repo had no prior session history captured here.** PR #3 (mobile /check fixes, e69209c) merged, production deployed 17:36 UTC. PR #2 (landing page at par.wireach.tools, 90691d0) merged 16:39 UTC — Coming soon placeholder retired, Stripe $19/mo trial link wired, mobile-responsive grid + hero font scaling verified at 390px. |
| 2026-04-30 | SPEC-0012 execution | PR #4 (68d273c) merged 17:18 UTC: (A) nav logo Par Tracker → Par Level Tracker; (D) id+name on all /check and /setup inputs (accessibility). B: shortfall alert email verified working — prior Apr 28 RESEND_API_KEY env var fix had already resolved it; sub-par test delivered to both recipients with correct item table format. C1: magic link auth verified end-to-end from incognito — template clean, allowlist correct, auth healthy. C2: Vercel preview wildcard added to Supabase allowlist by Keon in dashboard. |
| 2026-04-30 | Process note | Lesson: re-verify OPEN BUG items in PROGRESS.md against production before drafting fix SPECs. Items B and C1 were phantom — prior fixes already resolved them. Check live before spec-ing a fix. |

---

_Last updated: 2026-04-30_
