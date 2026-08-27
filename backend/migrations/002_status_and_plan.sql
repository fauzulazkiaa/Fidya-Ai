-- Fidya migration 002: curriculum lifecycle + user plan
-- Run in Supabase SQL Editor (Dashboard → SQL).

alter table curricula add column if not exists status text default 'active';
alter table users add column if not exists plan text default 'free';
alter table users add column if not exists display_name_override text;
