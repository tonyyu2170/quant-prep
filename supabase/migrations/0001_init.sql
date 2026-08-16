-- profiles: one per auth user, auto-created with a generated handle
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text unique not null,
  target_firms text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, 'trader_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id text not null,
  problem_version int not null default 1,
  seed int not null default 0,
  mode text not null check (mode in ('practice', 'test', 'review')),
  topic text not null,
  answer text,
  correct boolean not null,
  time_ms int not null,
  session_id uuid,
  merged_from_local boolean not null default false,
  created_at timestamptz not null default now()
);
create index attempts_user_created on public.attempts (user_id, created_at desc);

create table public.test_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  preset text not null,
  score int not null,
  correct int not null,
  wrong int not null,
  skipped int not null,
  duration_s int not null,
  timings jsonb not null default '[]',
  merged_from_local boolean not null default false,
  created_at timestamptz not null default now()
);
create index test_sessions_user on public.test_sessions (user_id, created_at desc);
create index test_sessions_preset_score on public.test_sessions (preset, score desc) where not merged_from_local;

create table public.game_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  game text not null,
  score numeric not null,
  rounds int not null,
  created_at timestamptz not null default now()
);

create table public.review_queue (
  user_id uuid not null references auth.users (id) on delete cascade,
  problem_id text not null,
  due_at timestamptz not null,
  interval_days int not null default 1,
  ease numeric not null default 2.5,
  primary key (user_id, problem_id)
);

create table public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current int not null default 0,
  longest int not null default 0,
  last_active date
);

create table public.problem_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  problem_id text not null,
  reason text not null,
  note text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.benchmarks (
  id bigint generated always as identity primary key,
  preset text not null,
  label text not null,
  value numeric not null,
  source text not null,   -- provenance required (spec §7)
  note text
);

-- RLS: users touch only their own rows; benchmarks are world-readable
alter table public.profiles enable row level security;
alter table public.attempts enable row level security;
alter table public.test_sessions enable row level security;
alter table public.game_sessions enable row level security;
alter table public.review_queue enable row level security;
alter table public.streaks enable row level security;
alter table public.problem_reports enable row level security;
alter table public.benchmarks enable row level security;

create policy "own profile read" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own attempts read" on public.attempts for select using (auth.uid() = user_id);
create policy "own attempts insert" on public.attempts for insert with check (auth.uid() = user_id);

create policy "own sessions read" on public.test_sessions for select using (auth.uid() = user_id);
create policy "own sessions insert" on public.test_sessions for insert with check (auth.uid() = user_id);

create policy "own games read" on public.game_sessions for select using (auth.uid() = user_id);
create policy "own games insert" on public.game_sessions for insert with check (auth.uid() = user_id);

create policy "own queue all" on public.review_queue for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own streaks all" on public.streaks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reports insert" on public.problem_reports for insert
  with check ((auth.uid() = user_id or user_id is null)
    and char_length(reason) <= 60
    and (note is null or char_length(note) <= 2000));

create policy "benchmarks public read" on public.benchmarks for select using (true);

-- Seed benchmarks (provenance per spec §7)
insert into public.benchmarks (preset, label, value, source, note) values
  ('optiver-80in8', 'historical invite zone', 55,
   'Publicly reported candidate thresholds, forum-compiled 2024-2026 cycles; unofficial',
   'Raw +1/-2 score; treat as a zone, not a cutoff'),
  ('sequences-sprint', 'strong pace reference', 15,
   'Owner-set reference from documented IMC/Optiver-style tests; unofficial', null);
