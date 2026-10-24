# Our Love Space

A private shared space for exactly two people, using Next.js App Router, strict TypeScript, Tailwind CSS, and Supabase Auth/PostgreSQL/Storage/Realtime.

## Current scope

Our Adventures persists shared trips, daily itineraries, a travel bucket list with activity conversion, chronological memories with private photos, and expenses with separate totals per currency/category/payer. Home shows the next upcoming trip, or an ongoing adventure when no future trip exists. Trips are never automatically created from meetings or marked complete.

Other Home cards still use `lib/mock-love-space.ts`. Our Day has no persisted editing flow and Our Story does not exist, so their trip integrations are deferred. Mock names are not authenticated identities; travel attribution and expense payers come from the provisioned pair.

## Public English pronunciation practice

`/english-game` works without login or Supabase configuration and is linked from the login page. It offers separate Numbers, Ordinals, Dates, and Times modes with American English pronunciation, word-by-word IPA, approximate Vietnamese reading hints, preset/custom whole-number ranges from 0 to 1,000,000, and browser-based recording/replay. Ordinals start at 1. Dates cover 2000–2099 using month-first readings; times use a 12-hour clock with AM/PM. Switching modes resets the range and clears the current recording. US pronunciation guides are checked against [CMUdict](https://github.com/cmusphinx/cmudict); Vietnamese hints are approximate memory aids, not a phonetic transcription.

Microphone access is requested only after Record is pressed and needs HTTPS or localhost. Each recording is limited to 30 seconds, stays in page memory, and clears on the next round or page exit. Nothing records to Supabase. Answer audio uses an available US English browser voice; devices without one retain the written guides and recording controls. Browser voice services may require a connection. There is no transcription, scoring, or saved recording history.

## Setup

Use Node.js 22.18+ (tests use native TypeScript stripping).

```sh
npm ci
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from your Supabase project. These are browser-safe values; the app needs no service-role/secret key. Configure the deployment environment **before building** because Next.js embeds browser variables in the client bundle. Restart development after environment changes.

Without configuration, `/login` shows a setup state and private routes redirect there. Private routes always render dynamically.

### Provision the pair

1. In Supabase Auth, disable new user signups and anonymous sign-ins. Provision two email/password accounts in the dashboard and record their UUIDs. Share credentials privately.
2. Apply `supabase/migrations/` files in filename order using the SQL Editor or your migration workflow. Apply each once, transactionally; roll back failed migrations before retrying. No existing relationship data is migrated.
3. In the SQL Editor, insert the actual accounts and names:

```sql
insert into public.private_pair (person_one, person_two, name_one, name_two)
values ('<first-auth-user-uuid>', '<second-auth-user-uuid>', '<first-name>', '<second-name>');
```

Both IDs must exist and differ. The singleton row permits only this pair; no application user can change membership. Data remains inaccessible until provisioning. Never use mock `person-a`/`person-b` IDs as identities.

4. In Realtime settings, disable **Allow public access**. The migrations send empty signals to the private `our-adventures` channel; relationship tables are not published through Postgres Changes. Review preexisting policies on `realtime.messages` and `storage.objects`: permissive PostgreSQL policies combine, so unrelated allow-all policies must not expose this feature. Prefer a dedicated project if policies cannot be isolated.
5. Run `npm run dev`, then sign in as each partner.

### Private photos

The migration creates a private `travel-photos` bucket. Accepts JPEG, PNG, and WebP, up to 3 MB each, with up to 12 photos per memory upload batch. Files upload sequentially to stay below hosting request limits. Export HEIC images as JPEG first. The server validates size, MIME type, signature, membership, trip/memory references, and generated storage paths.

Signed read URLs expire after ten minutes. **Refresh shared plans & photos** renews them. Pending manifests stay hidden until upload completion. Removed files enter the durable `photo_cleanup` queue. Retry unfinished cleanup from a trip’s Memories page; retries also remove abandoned manifests older than one hour. Cleanup is user-triggered, not scheduled. Trip deletion also attempts cleanup. If no trips remain and cleanup is pending, create another trip to access retry or ask an administrator to finish removal through the Storage API. Deleting only `storage.objects` SQL metadata does not remove file bytes.

### Collaboration, dates, and money

Both partners can edit shared travel content. Server-side membership checks and database RLS independently protect reads/writes. Creator attribution is immutable. Revision checks prevent stale edits; reload after conflicts. Wish conversion and itinerary reordering are transactional.

Private update signals make a refresh available instead of replacing unfinished forms. Reconnecting or returning to a tab also offers refresh. No relationship content is included in broadcast payloads.

Travel days are calendar dates, using the trip’s IANA timezone. Departure countdowns assume destination-local midnight on the first day. Timed plans stay chronological; reorder within equal-time or untimed groups. Status changes are manual. Itinerary estimates do not create expenses.

Money uses decimal strings and exact integer arithmetic. Totals remain separate by currency, category, and payer, with currency precision validated in the app and database. No FX conversion or financial settlement.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

If sandbox restrictions prevent Turbopack binding its worker port, verify with `npm run build -- --webpack`. Fonts use the existing system stack.

### Browser checks

```sh
npx playwright install chromium
npm run test:browser
```

Or use installed Chrome:

```sh
PLAYWRIGHT_CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser
```

Tests run a separate production server on port 3108 and a **test-only simulated Supabase HTTP service** on port 55439. They cover private-route redirects, mobile/light and desktop/dark layouts, navigation, trip edits, activities, wish conversion, separate currency totals, and memory photo uploads. They do not validate actual Auth, Storage, or websocket services. Fixtures are outside production routes and use no real credentials. The existing dev server can keep running.

Browser tests build using fixture environment values. **Run the normal production build again with your deployment values afterward.**

### Database checks

`supabase/tests/adventures.sql` exercises real PostgreSQL constraints/RLS: partner collaboration, outsiders, anonymous access, attribution, stale writes/reorders, duplicate conversion, precision, private update signals, cascades, and storage cleanup. Fixtures roll back. Use a **disposable database**, never a live relationship database.

For standalone PostgreSQL, apply `tests/postgres-bootstrap.sql`, then all migrations, then the authorization test file. Bootstrap contains test-only approximations of Supabase Auth, Storage metadata, and Realtime interfaces. A disposable Supabase project should skip bootstrap; Auth fixture inserts may need adaptation to its required Auth fields. These SQL tests do not exercise storage bytes, signed URL expiry, token refresh, or websocket delivery. Verify those with both real accounts and a denied third account before publishing private content.

`types/database.ts` manually mirrors the migrations; it was not generated from a live project. Keep it aligned when SQL changes.

## Structure

- `app/(auth)/`, `app/(space)/`: sign-in and authenticated routes.
- `components/ui/`, `components/space/`: shared primitives, shell, navigation, clocks/countdowns.
- `features/adventures/`: travel UI, Server Actions, uploads, private update subscription.
- `lib/auth.ts`, `lib/supabase/`, `lib/adventures/`: authorization, clients, server-only reads, validation, date logic, exact totals.
- `supabase/migrations/`, `supabase/tests/`: schema, policies, database functions and verification.

Existing Next.js and transitive dependency advisories reported by `npm audit` are outside this feature change. Review them before production deployment; the installed framework version is preserved.

References: [Supabase SSR auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [Storage policies](https://supabase.com/docs/guides/storage/security/access-control), [private Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).
