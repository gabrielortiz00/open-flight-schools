-- 1. Add display_name to profiles
alter table public.profiles add column display_name text;

-- Update handle_new_user to capture display_name from OAuth metadata (full_name/name)
-- and from email signup metadata (display_name passed via signUp options.data)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    )
  );
  return new;
end;
$$;

-- 2. Add display_name snapshot to reviews (captured at write time, stays stable even if user renames)
alter table public.reviews add column display_name text;

-- 3. Add avg_rating and review_count to schools (trigger-maintained, avoids expensive aggregation on every query)
alter table public.schools
  add column avg_rating numeric(3,1),
  add column review_count integer not null default 0;

create or replace function public.update_school_rating()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  sid uuid;
begin
  sid := coalesce(new.school_id, old.school_id);
  update public.schools
  set
    avg_rating   = (select round(avg(rating)::numeric, 1) from public.reviews where school_id = sid),
    review_count = (select count(*) from public.reviews where school_id = sid)
  where id = sid;
  return coalesce(new, old);
end;
$$;

create trigger reviews_update_school_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.update_school_rating();

-- Backfill avg_rating and review_count for existing reviews
update public.schools s
set
  avg_rating   = sub.avg,
  review_count = sub.cnt
from (
  select school_id,
         round(avg(rating)::numeric, 1) as avg,
         count(*)::integer              as cnt
  from public.reviews
  group by school_id
) sub
where s.id = sub.school_id;