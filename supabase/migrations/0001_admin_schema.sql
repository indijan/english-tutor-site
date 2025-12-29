-- Core admin/content schema updates.

-- Extend profiles for Stripe + manual access control + admin flag.
alter table if exists public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz,
  add column if not exists access_revoked boolean not null default false,
  add column if not exists is_admin boolean not null default false;

-- Update videos table for Vimeo + publishing.
alter table if exists public.videos
  add column if not exists vimeo_id text,
  add column if not exists is_published boolean not null default true,
  add column if not exists is_free boolean not null default false,
  add column if not exists sort_order integer not null default 0;

-- Categories and many-to-many linkage.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_slug_key on public.categories (slug);

create table if not exists public.video_categories (
  video_id uuid not null references public.videos(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, category_id)
);

-- Editable content blocks (home + legal/contact pages).
create table if not exists public.content_blocks (
  key text primary key,
  title text,
  body text,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);
