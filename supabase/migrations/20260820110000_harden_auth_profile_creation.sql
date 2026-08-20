-- Authentication parity hardening.
-- The legacy app generated usernames, persisted phone/country data, rejected
-- duplicate phones, and sent a welcome email during registration. This trigger
-- makes profile creation transaction-safe and independent of an immediate
-- client session (important when email confirmation is enabled).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  username_base text;
  username_candidate text;
  suffix integer := 1;
  normalized_phone text;
  country_code text;
  full_name text;
  existing_phone uuid;
begin
  requested_username := lower(nullif(btrim(new.raw_user_meta_data->>'username'), ''));
  full_name := coalesce(new.raw_user_meta_data->>'full_name', '');
  country_code := nullif(btrim(new.raw_user_meta_data->>'country_code'), '');
  normalized_phone := nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'phone', ''), '[[:space:]().-]', '', 'g'), '');

  if normalized_phone is not null then
    select id into existing_phone
      from public.profiles
     where phone = case when country_code is null then normalized_phone else country_code || normalized_phone end
       and id <> new.id
     limit 1;

    if existing_phone is not null then
      raise exception using
        errcode = '23505',
        message = 'Phone already exists';
    end if;
  end if;

  username_base := regexp_replace(
    coalesce(requested_username, split_part(coalesce(new.email, ''), '@', 1), full_name),
    '[^a-zA-Z0-9]', '', 'g'
  );
  username_base := lower(nullif(username_base, ''));
  if username_base is null then
    username_base := 'user';
  end if;

  username_candidate := username_base;
  loop
    begin
      insert into public.profiles (id, username, full_name, email, phone, country_code)
      values (
        new.id,
        username_candidate,
        full_name,
        new.email,
        case when normalized_phone is null then null else coalesce(country_code, '') || normalized_phone end,
        country_code
      );
      exit;
    exception when unique_violation then
      -- A username collision is expected and receives the same numeric suffix
      -- behavior as the legacy registration flow. Other uniqueness conflicts
      -- should surface rather than silently creating a different profile.
      if exists (select 1 from public.profiles where username = username_candidate) then
        username_candidate := username_base || suffix::text;
        suffix := suffix + 1;
      else
        raise;
      end if;
    end;
  end loop;

  perform public.queue_email(
    new.email,
    'Welcome to Bishram Ekata Mandali',
    format('Hello %s,%sWelcome to Bishram Ekata Mandali! Your account has been created successfully.%s%s— Bishram Ekata Mandali', full_name, chr(10), chr(10), chr(10)),
    format('<p>Hello %s,</p><p>Welcome to Bishram Ekata Mandali! Your account has been created successfully.</p><p>— Bishram Ekata Mandali</p>', full_name)
  );

  return new;
end;
$$;
