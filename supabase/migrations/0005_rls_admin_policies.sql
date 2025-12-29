-- RLS policies for admin-managed tables.

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
      and is_admin = true
  );
$$;

-- VIDEOS
alter table public.videos enable row level security;

drop policy if exists "videos_select_all" on public.videos;
create policy "videos_select_all"
on public.videos for select
using (true);

drop policy if exists "videos_admin_all" on public.videos;
create policy "videos_admin_all"
on public.videos for all
using (public.is_admin())
with check (public.is_admin());

-- CATEGORIES
alter table public.categories enable row level security;

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all"
on public.categories for select
using (true);

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

-- VIDEO_CATEGORIES
alter table public.video_categories enable row level security;

drop policy if exists "video_categories_select_all" on public.video_categories;
create policy "video_categories_select_all"
on public.video_categories for select
using (true);

drop policy if exists "video_categories_admin_all" on public.video_categories;
create policy "video_categories_admin_all"
on public.video_categories for all
using (public.is_admin())
with check (public.is_admin());

-- CONTENT_BLOCKS
alter table public.content_blocks enable row level security;

drop policy if exists "content_blocks_select_all" on public.content_blocks;
create policy "content_blocks_select_all"
on public.content_blocks for select
using (true);

drop policy if exists "content_blocks_admin_all" on public.content_blocks;
create policy "content_blocks_admin_all"
on public.content_blocks for all
using (public.is_admin())
with check (public.is_admin());

-- PROFILES
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());
