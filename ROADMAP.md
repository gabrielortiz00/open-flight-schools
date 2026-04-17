# Roadmap

Living document. Steps and priorities will shift as the project evolves.

---

## Phase 1 — Foundation

- [ ] Scaffold Next.js project (TypeScript, Tailwind, shadcn/ui)
- [ ] Set up Supabase project, enable PostGIS extension
- [ ] Define and migrate initial database schema (schools, certifications, fleet, pricing, reviews, contributions, profiles)
- [ ] Configure Vercel deployment, link to GitHub repo
- [ ] Set up environment variables (Supabase URL/keys, Mapbox token)
- [ ] Basic ESLint + Prettier config

## Phase 2 — Core Data Layer

- [ ] Supabase Row Level Security (RLS) policies
- [ ] `/api/schools` route — filtered school list (location bbox, part 61/141, certs, price)
- [ ] Seed database with a sample set of real US flight schools for development
- [ ] Type generation from Supabase schema (`supabase gen types`)

## Phase 3 — Map View (Home Page)

- [ ] Integrate Mapbox GL JS
- [ ] Render school pins on map from API
- [ ] Filter panel UI (location, Part 61/141, certifications, fleet, price range)
- [ ] Debounced re-fetch on filter change
- [ ] Clicking a pin shows a preview card with link to detail page

## Phase 4 — School Detail Page

- [ ] `/schools/[id]` page
- [ ] Display all school fields: location, contact, fleet, certifications, pricing
- [ ] Reviews section (read-only first)
- [ ] Link to contribute/edit this listing

## Phase 5 — Auth + User Accounts

- [ ] Supabase Auth (email/password to start, add OAuth later)
- [ ] `profiles` table with role field (user / admin)
- [ ] Auth UI (sign up, log in, log out)
- [ ] Gate reviews and contributions behind auth

## Phase 6 — Community Contributions

- [ ] Submit new school form
- [ ] Edit existing school form (pre-populated)
- [ ] Contributions written to `contributions` table with `status = pending`
- [ ] User can see their own pending submissions

## Phase 7 — Reviews

- [ ] Submit review form (rating + text)
- [ ] Display reviews on school detail page
- [ ] Prevent duplicate reviews per user per school

## Phase 8 — Moderation

- [x] `/admin` route, gated to admin role
- [x] Queue view of all pending contributions
- [x] Approve (publish school / apply edits) or reject
- [ ] Email notification to contributor on decision (optional)

## Phase 9 — Polish + Launch

- [x] SEO: metadata + OpenGraph (root layout + per-school generateMetadata)
- [x] School list/browse view (`/schools`) with name, state, and certification filters
- [ ] Sitemap (`/sitemap.xml`)
- [ ] Mobile responsiveness audit
- [x] Rate limiting on API routes (sliding-window in middleware)
- [x] Validate `school.website` starts with `https://` — done in contribution API + school detail page
- [ ] Production data import — seed with comprehensive US school data

---

## Future — Flight School Data Aggregation API

There is no single clean public source for US flight school data. The FAA has a searchable tool for Part 141 schools (av-info.faa.gov) but no downloadable dataset. Part 61 schools have no central registry at all.

**Idea:** Build a separate open source project (or a later phase of this one) — a data aggregation pipeline that scrapes and normalizes flight school data from multiple sources:
- FAA Part 141 search tool (av-info.faa.gov/PilotSchool.asp)
- AOPA flight school finder
- State aviation authority directories
- Google Places API (for schools not listed elsewhere)

Output would be a clean, regularly-updated JSON/CSV dataset released publicly so any project can use it. This solves the data problem not just for this app but for the aviation community broadly.