# WRI Par Level Tracker — Developer Reference

## Design System

| Token | Value |
|-------|-------|
| Dark background | `#1C1917` |
| Amber accent | `#D97706` |
| Cream interior | `#FAFAF9` |
| Error/shortfall | `#EF4444` |
| Border | `#E5E0D8` |

### Contrast Rule (applies to ALL surfaces)

- **On dark (#1C1917):** primary text = `#F5F0E8` or `#FAFAF9` (cream/near-white). Never gray.
- **On cream (#FAFAF9) or white (#FFFFFF):** all text = `#1C1917` or darker. No light gray, no muted variants.
- **Secondary / supporting text:** use amber (`#D97706`) or reduce size — never reduce contrast.
- **Banned:** `text-gray-400`, `text-gray-500`, `opacity-60`, `color: '#A8A29E'` on dark, or any equivalent muted treatment that lowers readability.
- The WRI aesthetic is high-contrast and confident. If text looks like a placeholder, it's wrong.

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
- **Styling: Inline styles throughout.** Tailwind PostCSS is bypassed (see backlog). Do not use Tailwind utility classes — they will not apply. All styling must use inline `style={{}}` props.

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
4. **Fix Tailwind PostCSS config (known workaround)** — `postcss.config.mjs` was removed to resolve a build failure with Next.js 14. Tailwind is installed but not running through PostCSS — utility classes do nothing. All styling currently uses inline styles as an intentional workaround (same pattern as wri-tip-pool). Fix by either: (a) installing correct PostCSS config for Next.js 14 + Tailwind v3, or (b) migrating to Tailwind v4 which uses a different CSS-based config. Do not mix Tailwind classes and inline styles until this is resolved.

---

## Git / Deploy Rules

- `npm run build` locally before every push — "Compiled successfully" ≠ passing build
- No secrets in `.env.example` — placeholders only
- `node_modules/` never committed
- Any deviation from approved plan is flagged BEFORE the change, not after

## Agent Commit Process Rule

**Frontend repos (Next.js/TypeScript) require a verified build before any commit.**

The GitHub API commit path does NOT run npm run build. JSX/TSX files with encoding
issues, raw Unicode, or syntax errors will commit silently and fail on Vercel.

Required process for any file change in this repo:
1. Write the file to /opt/wri-par-tracker/ on the VPS
2. Run: cd /opt/wri-par-tracker && npm run build
3. Verify exit code 0 and no compile errors
4. ONLY THEN commit via API or git push

This applies to: app/**, lib/**, any .tsx/.ts file.
It does NOT apply to: PROGRESS.md, CLAUDE.md, README.md (docs only, no compile step).

Applies equally to: wri-restaurant-ops, wri-staff-comms, wri-suite-landing, wri-par-tracker.
