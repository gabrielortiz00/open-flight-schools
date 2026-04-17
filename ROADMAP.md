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
- [ ] Google OAuth — session not persisting after redirect (fix pushed, pending propagation)

### Features needed at scale (don't matter at 30 schools, critical at 200)
- [ ] City / airport search — search by city name or FAA/ICAO identifier
- [ ] "Near me" radius search on map
- [ ] Sorting on browse page — by rating, distance, cert type
- [ ] Pagination on browse page (will break without it at 200+ schools)

### Polish
- [ ] Mobile responsiveness audit
- [ ] UI polish pass — remaining contrast and layout rough edges
- [ ] Empty states — map and browse page when no results match filters

### Data
- [ ] Bulk insert tooling — CSV → SQL script to seed metro areas efficiently
- [ ] Cover large US metros (NYC, LA, Chicago, Dallas, Houston, Miami, Atlanta, Phoenix, Seattle, Denver, Boston, SF, Las Vegas, Orlando) — target 150–250 schools

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