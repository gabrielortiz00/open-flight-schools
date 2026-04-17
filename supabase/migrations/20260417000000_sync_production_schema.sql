-- Sync migration file with production database state.
-- Two changes were made directly in the Supabase dashboard and never captured here:
--   1. airport_id column added to schools
--   2. vulnerable profiles UPDATE policy removed (privilege escalation via role self-promotion)

-- Add airport_id to schools (FAA/ICAO identifier, e.g. KSMO, KPAO, 52F)
alter table public.schools
  add column if not exists airport_id text
  check (airport_id ~ '^[A-Z0-9]{2,5}$');

create index if not exists schools_airport_id_idx on public.schools (airport_id);

-- Drop the unrestricted UPDATE policy on profiles.
-- It allowed any authenticated user to update their own role column, enabling
-- privilege escalation to admin via a direct Supabase REST API call.
-- No profile editing UI exists, so the policy is not needed.
drop policy if exists "users can update own profile" on public.profiles;