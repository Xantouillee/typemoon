-- Typemoon — accounts & global leaderboard schema.
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- It is idempotent: safe to re-run after edits. Nothing here trusts the client
-- with more than its own rows — every table has Row-Level Security on.

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: the public face of an account (what a leaderboard row shows)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are readable by everyone" on public.profiles;
create policy "profiles are readable by everyone"
  on public.profiles for select using (true);

drop policy if exists "a user updates only their own profile" on public.profiles;
create policy "a user updates only their own profile"
  on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- On sign-up, mint a profile with a unique default username derived from the
-- OAuth provider's data. Runs as definer so it can write before the user has a
-- session of their own.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base      text;
  candidate text;
  n         int := 0;
begin
  base := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1),
    'typist'
  );
  base := regexp_replace(base, '\s+', '', 'g');
  if length(base) < 2 then base := 'typist'; end if;

  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- scores: one row per finished run
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.scores (
  id           bigint generated always as identity primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  wpm          real not null,
  raw          real not null default 0,
  accuracy     real not null,
  consistency  real not null default 0,
  mode         text not null,
  language     text not null,
  chars        integer not null default 0,
  time_seconds real not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists scores_board_idx on public.scores (mode, language, created_at desc, wpm desc);
create index if not exists scores_user_idx  on public.scores (user_id, created_at desc);

alter table public.scores enable row level security;

drop policy if exists "scores are readable by everyone" on public.scores;
create policy "scores are readable by everyone"
  on public.scores for select using (true);

drop policy if exists "a user inserts only their own scores" on public.scores;
create policy "a user inserts only their own scores"
  on public.scores for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- get_leaderboard: the best run per player within a window, fastest first.
-- p_since NULL = all-time; p_mode / p_language NULL = don't filter that facet.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.get_leaderboard(
  p_since    timestamptz,
  p_mode     text,
  p_language text,
  p_limit    int
)
returns table (
  user_id    uuid,
  username   text,
  avatar_url text,
  wpm        real,
  accuracy   real,
  mode       text,
  language   text,
  created_at timestamptz
)
language sql stable
as $$
  select t.user_id, t.username, t.avatar_url, t.wpm, t.accuracy, t.mode, t.language, t.created_at
  from (
    select distinct on (s.user_id)
      s.user_id, p.username, p.avatar_url, s.wpm, s.accuracy, s.mode, s.language, s.created_at
    from public.scores s
    join public.profiles p on p.id = s.user_id
    where (p_since is null or s.created_at >= p_since)
      and (p_mode is null or s.mode = p_mode)
      and (p_language is null or s.language = p_language)
    order by s.user_id, s.wpm desc
  ) t
  order by t.wpm desc
  limit coalesce(p_limit, 100);
$$;

grant execute on function public.get_leaderboard(timestamptz, text, text, int) to anon, authenticated;
