create or replace view public.public_profile
with (security_barrier = true)
as
select
  id,
  username,
  full_name,
  profile_image_url,
  bio,
  hometown,
  current_city,
  work,
  education,
  relationship_status,
  interests,
  favorite_scripture
from public.profiles
where coalesce(profile_in_search_privacy, true) = true;

revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;

drop policy if exists profiles_select_all on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

revoke all on public.public_profile from anon, authenticated;
grant select on public.public_profile to anon, authenticated;
