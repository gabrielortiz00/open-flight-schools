-- Backfill display_name for existing Google OAuth users whose name sits in auth metadata
update public.profiles p
set display_name = coalesce(
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'name'
)
from auth.users u
where p.id = u.id
  and p.display_name is null
  and coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name'
  ) is not null;
