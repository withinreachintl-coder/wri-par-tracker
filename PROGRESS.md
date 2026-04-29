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
| **Stripe** | TBD — not wired for billing yet |
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
2. **Landing page is placeholder** — `par.wireach.tools` shows "Coming soon" text, not a real product page.
3. **Mobile viewport not verified** — `/check` flow (the highest-frequency staff-facing surface) has not been tested at iPhone 390px width.

---

## Stack
- Next.js 14 (App Router), TypeScript, Supabase SSR auth, Resend email
- **Styling: inline styles throughout.** Tailwind PostCSS is bypassed (known workaround, deferred to v2 — do not use utility classes).
- Deployment: Vercel auto-deploy from `main` branch

---

## Next Priorities (SPEC-0011)
1. ~~PROGRESS.md~~ ✅ Done (PR #1 merged)
2. ~~Diagnose + fix shortfall alert email~~ ✅ Done (Vercel env var fix, no PR needed)
3. Real landing page at `/` (PR #2)
4. Mobile viewport fixes on `/check` (PR #3)
5. Investigate `SUPABASE_SERVICE_ROLE_KEY` "Needs Attention" warning in Vercel (after 3+4)

---

## Session Log

| Date | Session | Key work |
|------|---------|----------|
| 2026-04-17 | Initial scaffold | Next.js 14 scaffold, Supabase client, CLAUDE.md, WRI design system, placeholder landing page |
| 2026-04-17 | Day 1 | Auth (`/login` + `/auth/callback`), `/setup` 3-tab, `/check` PIN+count+submit, Resend email alert route, variance display. Build passes. |
| 2026-04-17 | CLAUDE.md update | Contrast rule tightened to all surfaces; Tailwind PostCSS workaround documented in backlog. |
| 2026-04-29 | SPEC-0011 planning | Identified 4 problems: alert email, landing page, mobile, PROGRESS.md. Plan approved. |
| 2026-04-29 | SPEC-0011 execution | PR #1 PROGRESS.md merged. Alert email fix: `RESEND_API_KEY` was malformed in Vercel env — fixed by Keon directly, no code change. Both recipients confirmed receiving alerts. |

---

_Last updated: 2026-04-29_
