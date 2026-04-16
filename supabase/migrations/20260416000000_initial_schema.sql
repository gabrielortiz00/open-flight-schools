-- profiles: extends auth.users with role info
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- schools: core directory listing
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  state char(2) not null,
  zip text not null,
  location extensions.geography(Point, 4326) not null,
  part_61 boolean not null default false,
  part_141 boolean not null default false,
  website text,
  phone text,
  email text,
  description text,
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  submitted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- spatial index for map bounding box queries
create index schools_location_idx on public.schools using gist (location);
-- index for filtering by status (published schools)
create index schools_status_idx on public.schools (status);
-- index for state filtering
create index schools_state_idx on public.schools (state);

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_updated_at
  before update on public.schools
  for each row execute procedure public.set_updated_at();

-- certifications offered by each school
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  cert_type text not null check (cert_type in ('PPL', 'IR', 'CPL', 'MEL', 'CFI', 'CFII', 'ATP')),
  unique (school_id, cert_type)
);

create index certifications_school_id_idx on public.certifications (school_id);

-- aircraft fleet at each school
create table public.fleet (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  aircraft text not null,
  unique (school_id, aircraft)
);

create index fleet_school_id_idx on public.fleet (school_id);

-- pricing per school per certification
create table public.pricing (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  cert_type text not null check (cert_type in ('PPL', 'IR', 'CPL', 'MEL', 'CFI', 'CFII', 'ATP')),
  price_low integer check (price_low >= 0),
  price_high integer check (price_high >= 0),
  unique (school_id, cert_type)
);

create index pricing_school_id_idx on public.pricing (school_id);

-- user reviews of schools
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create index reviews_school_id_idx on public.reviews (school_id);

-- community contributions: new school submissions and edits
create table public.contributions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete set null,  -- null = new school submission
  submitted_by uuid references public.profiles (id) on delete set null,
  data jsonb not null,  -- full proposed school data
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewer_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index contributions_status_idx on public.contributions (status);
create index contributions_submitted_by_idx on public.contributions (submitted_by);

-- RLS policies

alter table public.profiles enable row level security;
alter table public.schools enable row level security;
alter table public.certifications enable row level security;
alter table public.fleet enable row level security;
alter table public.pricing enable row level security;
alter table public.reviews enable row level security;
alter table public.contributions enable row level security;

-- profiles: users can read and update their own
create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- schools: anyone can read published schools
create policy "anyone can read published schools"
  on public.schools for select
  using (status = 'published');

create policy "admins can read all schools"
  on public.schools for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins can update schools"
  on public.schools for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins can insert schools"
  on public.schools for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- certifications, fleet, pricing: readable if school is published
create policy "anyone can read certifications for published schools"
  on public.certifications for select
  using (exists (select 1 from public.schools where id = school_id and status = 'published'));

create policy "admins can manage certifications"
  on public.certifications for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "anyone can read fleet for published schools"
  on public.fleet for select
  using (exists (select 1 from public.schools where id = school_id and status = 'published'));

create policy "admins can manage fleet"
  on public.fleet for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "anyone can read pricing for published schools"
  on public.pricing for select
  using (exists (select 1 from public.schools where id = school_id and status = 'published'));

create policy "admins can manage pricing"
  on public.pricing for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- reviews: anyone can read, authenticated users can write their own
create policy "anyone can read reviews"
  on public.reviews for select
  using (exists (select 1 from public.schools where id = school_id and status = 'published'));

create policy "authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- contributions: authenticated users can submit, users can read own, admins can read all
create policy "authenticated users can submit contributions"
  on public.contributions for insert
  with check (auth.uid() = submitted_by);

create policy "users can read own contributions"
  on public.contributions for select
  using (auth.uid() = submitted_by);

create policy "admins can read all contributions"
  on public.contributions for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "admins can update contributions"
  on public.contributions for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));