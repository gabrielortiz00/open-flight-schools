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

- [ ] `/admin` route, gated to admin role
- [ ] Queue view of all pending contributions
- [ ] Approve (publish school / apply edits) or reject
- [ ] Email notification to contributor on decision (optional)

## Phase 9 — Polish + Launch

- [ ] SEO: metadata, sitemap, OpenGraph
- [ ] School list/browse view (alternative to map for non-map users)
- [ ] Search by school name
- [ ] Mobile responsiveness
- [ ] Rate limiting on API routes
- [ ] Production data import — seed with comprehensive US school data