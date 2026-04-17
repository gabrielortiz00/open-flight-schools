-- New columns on schools table (all optional/nullable)
alter table public.schools
  add column gi_bill        boolean not null default false,
  add column intro_flight   boolean not null default false,
  add column ground_school  boolean not null default false,
  add column financing      boolean not null default false,
  add column simulator      boolean not null default false,
  add column simulator_notes text check (char_length(simulator_notes) <= 100),
  add column founded_year   integer check (founded_year >= 1900 and founded_year <= 2030),
  add column hours          text check (char_length(hours) <= 200);

-- Expand cert enum to include REC, SPORT, HELI on certifications table
alter table public.certifications drop constraint certifications_cert_type_check;
alter table public.certifications add constraint certifications_cert_type_check
  check (cert_type in ('PPL', 'IR', 'CPL', 'MEL', 'CFI', 'CFII', 'ATP', 'REC', 'SPORT', 'HELI'));

-- Expand cert enum on pricing table too
alter table public.pricing drop constraint pricing_cert_type_check;
alter table public.pricing add constraint pricing_cert_type_check
  check (cert_type in ('PPL', 'IR', 'CPL', 'MEL', 'CFI', 'CFII', 'ATP', 'REC', 'SPORT', 'HELI'));

-- Specialties join table (advanced training offerings)
create table public.specialties (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools (id) on delete cascade,
  specialty  text not null check (specialty in (
    'mountain_flying', 'upset_recovery', 'aerobatics',
    'seaplane', 'tailwheel', 'ski_flying', 'night_vision', 'fire_fighting'
  )),
  unique (school_id, specialty)
);

create index specialties_school_id_idx on public.specialties (school_id);

alter table public.specialties enable row level security;

create policy "anyone can read specialties for published schools"
  on public.specialties for select
  using (exists (select 1 from public.schools where id = school_id and status = 'published'));

create policy "admins can manage specialties"
  on public.specialties for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
