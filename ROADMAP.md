# Roadmap

Living document. Steps and priorities will shift as the project evolves.

---

## Phase 1 — Foundation

- [x] Scaffold Next.js project (TypeScript, Tailwind, shadcn/ui)
- [x] Set up Supabase project, enable PostGIS extension
- [x] Define and migrate initial database schema (schools, certifications, fleet, pricing, reviews, contributions, profiles)
- [x] Configure Vercel deployment, link to GitHub repo
- [x] Set up environment variables (Supabase URL/keys, Mapbox token)
- [x] Basic ESLint + Prettier config

## Phase 2 — Core Data Layer

- [x] Supabase Row Level Security (RLS) policies
- [x] `/api/schools` route — filtered school list (part 61/141, certs)
- [x] Seed database with ~30 US flight schools for development
- [ ] Type generation from Supabase schema (`supabase gen types`)

## Phase 3 — Map View (Home Page)

- [x] Integrate Mapbox GL JS
- [x] Render school pins on map from API
- [x] Filter panel UI (Part 61/141, certifications) with collapsible panel and school count
- [x] Debounced re-fetch on filter change
- [x] Clicking a pin shows a preview popup with link to detail page
- [x] Custom SVG markers with palette colors
- [x] Map error state with retry button

## Phase 4 — School Detail Page

- [x] `/schools/[id]` page
- [x] Display all school fields: location, contact, fleet, certifications, pricing
- [x] Reviews section with star ratings display
- [x] Link to contribute/edit this listing

## Phase 5 — Auth + User Accounts

- [x] Supabase Auth (email/password)
- [x] `profiles` table with role field (user / admin)
- [x] Auth UI: sign up, log in, log out
- [x] Password reset flow (forgot-password + update-password pages)
- [x] Gate reviews and contributions behind auth

## Phase 6 — Community Contributions

- [x] Submit new school form (`/contribute`)
- [x] Edit existing school form (`/schools/[id]/edit`, pre-populated)
- [x] Contributions written to `contributions` table with `status = pending`
- [ ] User can see their own pending submissions

## Phase 7 — Reviews

- [x] Submit review form (rating + text)
- [x] Display reviews on school detail page
- [x] Prevent duplicate reviews per user per school

## Phase 8 — Moderation

- [x] `/admin` route, gated to admin role
- [x] Queue view of all pending contributions
- [x] Approve (publish school / apply edits) or reject
- [x] Approve/reject success feedback in UI
- [x] Geocode address on new school approval via Mapbox
- [ ] Email notification to contributor on decision (optional)

## Phase 9 — Polish + Launch

- [x] Full UI redesign: navy/sky/teal/offwhite palette, Space Grotesk + Source Sans 3 + JetBrains Mono
- [x] Input contrast fixed globally (white-on-white bug)
- [x] SEO: metadata + OpenGraph (root layout + per-school `generateMetadata`)
- [x] Sitemap (`/sitemap.xml`) — URL driven by `NEXT_PUBLIC_BASE_URL` env var
- [x] School list/browse view (`/schools`) with name, state, and cert filters
- [x] Rate limiting on API routes (sliding-window in middleware)
- [x] `school.website` validated to `https://` in contribution API + detail page
- [x] Cert filter fixed: OR logic (was AND)
- [x] Map error state with retry
- [x] Contribution success screen fixed (`router.back()` → navigate to `/`)
- [ ] Mobile responsiveness audit
- [ ] Production data import — community-driven; no bulk import planned

---

## Pre-Launch Checklist

Things to validate and build before scaling to 150–250 schools.

### Bugs / In-Progress
- [x] Google OAuth — session not persisting after redirect (fix pushed, pending propagation)

### Features needed at scale (don't matter at 30 schools, critical at 200)
- [x] City / airport search — search by city name or FAA/ICAO identifier
- [ ] "Near me" radius search on map
- [x] Sorting on browse page — by rating (A–Z is default)
- [x] Pagination on browse page (PAGE_SIZE = 25)

### Polish
- [ ] Mobile responsiveness audit
- [ ] UI polish pass — remaining contrast and layout rough edges
- [ ] Empty states — map and browse page when no results match filters

### Data
- [ ] Bulk insert tooling — CSV → SQL script to seed metro areas efficiently
- [ ] Cover large US metros (NYC, LA, Chicago, Dallas, Houston, Miami, Atlanta, Phoenix, Seattle, Denver, Boston, SF, Las Vegas, Orlando) — target 150–250 schools

---

## Before Expanding to 200+ Schools

Schema and feature decisions that are hard or painful to change once schools, URLs, and reviews accumulate.

### 🔴 Do first (breaking/risky to change later)

- [x] **Write migration to sync production schema** — `airport_id` was added manually to the DB; the migration file doesn't have it. Also fixes F-05 from security audit (vulnerable RLS UPDATE policy still in migration file). One new migration captures both.
- [x] **Add `slug` column to `schools`** — SEO-friendly URLs (`/schools/journeys-aviation-boulder-co`) instead of UUID paths. Breaking URL change if done after traffic/inbound links exist.
- [x] **Add `display_name` to `profiles`** — reviews currently show no reviewer identity. Needs to exist before reviews accumulate; backfilling is possible but messy.

### 🟡 Do before data import push

- [x] **Add avg_rating view or denormalized column** — trigger-maintained avg_rating and review_count columns on schools; browse page sort-by-rating now uses them.
- [ ] **Move cert filtering to DB** — `/api/schools` currently fetches all schools and filters certs in JavaScript. Fine at 200 schools, wrong pattern; move to a DB-side filter before the import push.
- [ ] **Add `updated_at` to `pricing` rows** — pricing changes frequently; no staleness signal right now erodes user trust over time.

### 🔒 Security (from audit)

- [x] **Fix migration file** — remove/replace vulnerable `profiles` UPDATE policy (see F-01/F-05 in `security-audit-openflightschools.md`). Covered by the migration sync task above.
- [ ] **Add rate limiting to `/api/admin/*`** — currently has no limits; low priority since admin role is required, but easy defense-in-depth.
- [x] **Add security headers to `next.config.ts`** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Quick win, low risk.
- [ ] **Strengthen middleware auth** — add centralized `/admin` route protection in middleware as a safety net for future routes.

---

## Completed (was "Remaining / Future")

- [x] User submissions history page
- [x] Admin: delete or unpublish a school
- [x] Admin: delete a review
- [x] OAuth login (Google)

---

## Future (post-launch)

- [ ] Email notification to contributor on approval/rejection
- [ ] Compare schools side by side
- [ ] School photos (Supabase storage)
- [ ] Airport identifier (ICAO) field on school listings

---

## Data Strategy

No bulk import planned. The app is designed to grow organically — pilots and students submit schools through the contribution form, the community improves listings over time, and reviews add signal. The moderation queue keeps quality high.

The FAA Part 141 school list (av-info.faa.gov) is the authoritative source if a bulk scrape is ever needed, but the site blocks automated access. Google Places API (~$50–100 for full US coverage) is the fallback if organic growth is too slow.