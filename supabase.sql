create table if not exists public.user_progress (
  user_id text primary key,
  completed jsonb not null default '[]'::jsonb,
  attempts jsonb not null default '[]'::jsonb,
  stars integer not null default 0,
  age integer not null default 6,
  updated_at timestamptz not null default now()
);

alter table public.user_progress
add column if not exists attempts jsonb not null default '[]'::jsonb;

alter table public.user_progress enable row level security;

create policy "Users can read own progress"
on public.user_progress
for select
using (auth.uid()::text = user_id);

create policy "Users can insert own progress"
on public.user_progress
for insert
with check (auth.uid()::text = user_id);

create policy "Users can update own progress"
on public.user_progress
for update
using (auth.uid()::text = user_id);

create index if not exists user_progress_stars_idx
on public.user_progress (stars desc);
