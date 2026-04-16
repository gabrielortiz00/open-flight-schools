# open-flight-schools

Open source, community-maintained flight school registry for pilots in the United States.

## The Problem

Finding a flight school is harder than it should be. Information is scattered across individual school websites, outdated forum posts, and word of mouth. There's no central place to discover schools, compare what they offer, or read honest reviews — especially if you're a student pilot just starting out or a licensed pilot relocating.

## What This Is

A comprehensive, searchable directory of every flight school in the US. The core experience is a map view showing all schools as pins, with filters to narrow down by location, training type, certifications offered, fleet, and price range. Each school has a detail page with everything you need to make a decision.

**Key features:**
- Interactive map (Mapbox) with all US flight schools as filterable pins
- Filter by: state/city, Part 61 / Part 141, certifications offered, aircraft fleet, price range
- School detail pages: location, contact info, fleet, certifications, pricing, reviews
- Community-submitted entries with a moderation queue before publishing
- User reviews and ratings

**Certifications covered:** PPL, Instrument Rating, Commercial, Multi-Engine, CFI, CFII, ATP

## Stack

- **Next.js (TypeScript)** — full-stack framework, App Router
- **Supabase** — PostgreSQL + PostGIS + auth + storage
- **Mapbox GL JS** — interactive map
- **shadcn/ui** — component library
- **Vercel** — deployment

## Contributing

This is a community project. You can contribute by:
- Submitting a new flight school via the app
- Suggesting edits to existing school listings
- Opening issues or PRs on this repo

## License

MIT