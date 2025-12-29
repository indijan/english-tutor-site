-- Sync profiles with auth.users and remove legacy subscription levels.

alter table if exists public.profiles
  add column if not exists email text,
  add column if not exists full_name text;

update public.profiles p
set email = u.email,
    full_name = coalesce(p.full_name, u.raw_user_meta_data->>'full_name')
from auth.users u
where p.user_id = u.id;

insert into public.profiles (user_id, email, full_name)
select id, email, raw_user_meta_data->>'full_name'
from auth.users
on conflict (user_id) do nothing;

alter table if exists public.profiles
  drop column if exists subscription_level;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;
