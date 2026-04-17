-- Add slug column for SEO-friendly URLs (/schools/journeys-aviation-boulder-co)
alter table public.schools add column slug text;

-- Generate slugs for all existing schools: lowercase name+city+state, strip non-alphanumeric, collapse spaces to hyphens
update public.schools
  set slug = lower(
    regexp_replace(
      regexp_replace(name || ' ' || city || ' ' || state, '[^a-zA-Z0-9 ]', '', 'g'),
      '\s+', '-', 'g'
    )
  );

alter table public.schools alter column slug set not null;
create unique index schools_slug_idx on public.schools (slug);