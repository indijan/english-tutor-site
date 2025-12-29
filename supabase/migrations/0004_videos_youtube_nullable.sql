-- Allow Vimeo-only videos; legacy youtube_id can be null.

alter table if exists public.videos
  alter column youtube_id drop not null;

alter table if exists public.videos
  alter column level drop not null;
