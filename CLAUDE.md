# WRI Par Level Tracker — Developer Reference

## Design System

| Token | Value |
|-------|-------|
| Dark background | `#1C1917` |
| Amber accent | `#D97706` |
| Cream interior | `#FAFAF9` |
| Error/shortfall | `#EF4444` |
| Border | `#E5E0D8` |
| Muted text (on dark only) | `#A8A29E` |

**Rule: All text rendered on cream (#FAFAF9) or white (#FFFFFF) backgrounds MUST be #1C1917 or darker. Never use light gray / muted text on cream.**

### Typography
- **Headings:** Playfair Display (serif) — `font-playfair` / `var(--font-playfair)`
- **Body/UI:** DM Sans (sans-serif) — `font-dmsans` / `var(--font-dmsans)`

### Stack
- Next.js 14 (App Router)
- Supabase (auth + database)
- Tailwind CSS
- TypeScript
- Vercel (deploy from withinreachintl-coder/wri-par-tracker main branch)
- Resend (transactional email via noreply@wireach.tools)

### Patterns
- Auth: Supabase magic link. `createServerClient` from `@supabase/ssr` for session exchange. `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` for server-side admin ops (bypasses RLS).
- RLS: Non-recursive. SELECT policies use `auth.uid() = id` or `owner_email = auth.email()` — never subquery-through-users for SELECT.
- PIN validation: Server-side only via API routes using service role. Never trust client.
- New user flow: /auth/callback → create org + user (service role) → redirect to /setup. Returning user → /check.

---

## Supabase Project

- **Project name:** wri-par-tracker
- **Ref:** ljqhfrmkhypsjpsvnwds
- **Region:** us-east-2

## Tables

| Table | Purpose |
|-------|---------|
| `organizations` | One per restaurant. Holds PIN, alert_emails[], Stripe data, trial info. |
| `users` | Manager accounts linked to orgs. |
| `par_items` | Items tracked (name, unit, par_minimum). |
| `shift_checks` | One record per staff submission. |
| `shift_check_items` | Line items per check. `shortfall` is a generated column. |

---

## Backlog (v2 — do not implement in v1)

1. **Index on shift_check_items.par_item_id** — needed for per-item time-series queries (e.g., "show all Chicken Breast counts over 30 days"). Not needed for v1.
2. **Harden set_updated_at() trigger** — add `SET search_path = public` or `SECURITY DEFINER` to clear Supabase linter warning.
3. **submitted_by field on shift_checks** — PIN submission audit trail. Ship v1 without it; add when managers need to trace disputes.

---

## Git / Deploy Rules

- `npm run build` locally before every push — "Compiled successfully" ≠ passing build
- No secrets in `.env.example` — placeholders only
- `node_modules/` never committed
- Any deviation from approved plan is flagged BEFORE the change, not after
