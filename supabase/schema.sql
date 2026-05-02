-- ContentFactory Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User profiles (extends Supabase auth.users)
create table if not exists public.user_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan text not null default 'start' check (plan in ('start', 'business', 'agency')),
  gens_used integer not null default 0,
  gens_limit integer not null default 20,
  onboarding_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects (business profiles)
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Мой бизнес',
  icon text default '🏢',
  color text default '#C8F135',
  niche text default '',
  business_name text default '',
  description text default '',
  usp text default '',
  advantages text default '',
  audience text default '',
  style text default '😊 Дружелюбный',
  tg_bot_token text default '',
  tg_channel_id text default '',
  vk_token text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generations (history)
create table if not exists public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  topic text not null,
  details text default '',
  platforms text[] not null default '{}',
  results jsonb default '[]',
  image_url text default '',
  created_at timestamptz not null default now()
);

-- Platform connections
create table if not exists public.platform_connections (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  platform text not null,
  token text not null,
  channel_id text default '',
  created_at timestamptz not null default now(),
  unique (project_id, platform)
);

-- ────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────

alter table public.user_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.generations enable row level security;
alter table public.platform_connections enable row level security;

-- user_profiles: own rows only
create policy "user_profiles_own" on public.user_profiles
  for all using (auth.uid() = user_id);

-- projects: own rows only
create policy "projects_own" on public.projects
  for all using (auth.uid() = user_id);

-- generations: own rows only
create policy "generations_own" on public.generations
  for all using (auth.uid() = user_id);

-- platform_connections: via project ownership
create policy "platform_connections_own" on public.platform_connections
  for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- ────────────────────────────────────────────────
-- Trigger: auto-create user_profile on signup
-- ────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (user_id, plan, gens_used, gens_limit)
  values (new.id, 'start', 0, 20)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────
-- Indexes
-- ────────────────────────────────────────────────

create index if not exists idx_generations_user_id on public.generations(user_id);
create index if not exists idx_generations_created_at on public.generations(created_at desc);
create index if not exists idx_projects_user_id on public.projects(user_id);
