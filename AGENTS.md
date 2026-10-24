<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Rules

## Product Scope

- Build one private shared digital space for exactly two people in a long-distance romantic relationship.
- This is not a dating app, social network, multi-tenant SaaS product, or messaging replacement.
- Do not add multi-couple, public-feed, follower, invitation-marketplace, discovery, scoring, leaderboard, or gamified competition behavior.
- Optimize every product decision for making two people living apart feel like they still share ordinary everyday life.

## V1 Product Areas

- Our Home: shared homepage, both local times, current mood/status, next meeting countdown, recent shared moments, and a Thinking of You interaction.
- Our Now: current mood, optional short status, and current need: `nothing`, `talk_to_me`, `distract_me`, `space`, `stay_with_me`, or `i_need_you`.
- Thinking of You: one-tap signal with sender and timestamp; no scores, streaks, or competitive counters.
- Open Me When: private letters with emotional trigger labels, optional date locks, text/image/voice attachments, and opened/unopened state.
- Our Day: small daily moments with photo, optional caption, timestamp, and chronological daily view.
- Until We Meet Again: next meeting date, countdown, meeting location, and a small shared list of things to do.

## Technical Stack

- Use Next.js App Router, TypeScript, Tailwind CSS, Supabase/PostgreSQL, Supabase Auth, Supabase Storage, and Supabase Realtime where it meaningfully improves shared presence or immediacy.
- Follow the installed Next.js version, not memory of older Next.js behavior. Read the relevant local guide under `node_modules/next/dist/docs/` before writing Next.js code.
- Keep TypeScript strict and avoid unnecessary dependencies.
- Prefer Server Components for data-backed views and small Client Components for browser state, live clocks, countdowns, realtime subscriptions, upload controls, and subtle animation.
- Use Server Actions or route handlers only when they have a clear purpose. Always verify authentication and authorization inside mutations.

## Application Architecture

- Keep routing in `app/` and organize product routes with route groups when useful, for example `(auth)` and `(space)`.
- Keep reusable primitives in `components/ui/`.
- Keep shared application shell and relationship-space components in `components/space/`.
- Keep feature-specific code in `features/<feature>/`.
- Keep Supabase clients, auth helpers, data access, validation, and shared types in `lib/` or `types/` with clear server/client boundaries.
- Keep database migrations and SQL policy files in `supabase/`.
- Do not overengineer for multiple couples. If a structure exists only to support many spaces or tenants, do not add it without explicit approval.

## Data And Security

- Treat all relationship content as private by default.
- Enforce the exactly-two-user model in database constraints, RLS policies, and server-side authorization checks; never rely only on UI hiding.
- Keep privileged Supabase keys and private environment variables server-only. Only expose browser-safe variables with the `NEXT_PUBLIC_` prefix when truly needed.
- Use a server-only data access layer for private reads and writes. Return minimal DTOs to Client Components.
- Validate file type, file size, storage path, ownership, and recipient access for image and voice uploads.
- Realtime channels must be scoped to the private pair and should not leak presence or updates beyond the two authenticated users.

## Design Direction

- Design mobile-first, responsive, accessible UI.
- Aim for intimate, warm, calm, dreamy, minimal, premium, and emotionally mature.
- Avoid childish visuals, excessive pink, excessive hearts, novelty gimmicks, noisy gradients, and cluttered dashboards.
- Dark mode should feel especially beautiful, calm, and intentional.
- Use subtle animation only where it supports emotional presence or clarity. Respect reduced-motion preferences.

## Verification

- Run `npm run lint` after code or markup changes.
- Run `npm run build` before considering implementation complete, unless a known environment issue blocks it; document the blocker clearly.
- If build fails because `next/font/google` cannot fetch fonts in a restricted environment, prefer a reviewed self-hosted font strategy rather than ignoring the failure.
- For UI work, check mobile layout first, then desktop. Verify keyboard focus, labels, contrast, and reduced-motion behavior when relevant.

## Git

- Never commit or push unless explicitly requested.
- Preserve unrelated uncommitted changes.
- Keep changes minimal and focused on the requested task.
