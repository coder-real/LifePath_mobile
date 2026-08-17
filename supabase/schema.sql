-- ============================================================
-- LiFePath — Supabase schema + Row Level Security
-- Run this in the Supabase SQL editor (or via supabase db push).
-- ============================================================

-- ---------- profiles ----------
-- Mirrors auth.users. The id is the auth user id.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null check (role in ('mentee', 'mentor')),
  bio text,
  interests text[] default '{}',
  created_at timestamptz not null default now()
);

-- ---------- mentor_profiles ----------
create table if not exists public.mentor_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  headline text,
  expertise text[] default '{}',
  categories text[] default '{}',
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- goals ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  category text,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now()
);

-- ---------- goal_milestones ----------
create table if not exists public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- mentorship_requests ----------
create table if not exists public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  unique (mentee_id, mentor_id)
);

-- ---------- conversations ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  mentorship_id uuid references public.mentorship_requests (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.goals enable row level security;
alter table public.goal_milestones enable row level security;
alter table public.mentorship_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Helper: is the requesting uid a participant of a conversation?
-- Determined by joining through the accepted mentorship.
create or replace function public.conversation_participant(cid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1
    from conversations c
    join mentorship_requests mr on mr.id = c.mentorship_id
    where c.id = cid
      and (mr.mentee_id = auth.uid() or mr.mentor_id = auth.uid())
  );
$$;

-- ---------- profiles ----------
-- Everyone can read profiles (needed to display other people's names/photos).
create policy "profiles_select" on public.profiles for select using (true);
-- A user can update their own profile.
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
-- A user inserts their own profile on signup (also allow for the trigger path).
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- ---------- mentor_profiles ----------
-- Anyone can browse mentors.
create policy "mentor_profiles_select" on public.mentor_profiles for select using (true);
-- Only the owning mentor can update.
create policy "mentor_profiles_update_own" on public.mentor_profiles for update using (auth.uid() = id);
create policy "mentor_profiles_insert_own" on public.mentor_profiles for insert with check (auth.uid() = id);

-- ---------- goals ----------
create policy "goals_select_own" on public.goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on public.goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on public.goals for update using (auth.uid() = user_id);
create policy "goals_delete_own" on public.goals for delete using (auth.uid() = user_id);

-- ---------- goal_milestones ----------
-- Only the goal owner can read/modify its milestones.
create policy "milestones_select" on public.goal_milestones for select
  using (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy "milestones_insert" on public.goal_milestones for insert
  with check (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy "milestones_update" on public.goal_milestones for update
  using (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()));
create policy "milestones_delete" on public.goal_milestones for delete
  using (exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid()));

-- ---------- mentorship_requests ----------
-- Mentee or mentor involved can read a request.
create policy "requests_select" on public.mentorship_requests for select
  using (auth.uid() = mentee_id or auth.uid() = mentor_id);
-- Mentee creates requests to themselves.
create policy "requests_insert" on public.mentorship_requests for insert
  with check (auth.uid() = mentee_id);
-- Only the mentor can accept/reject (update status).
create policy "requests_update_mentor" on public.mentorship_requests for update
  using (auth.uid() = mentor_id);

-- ---------- conversations ----------
create policy "conversations_select" on public.conversations for select
  using (public.conversation_participant(id));
create policy "conversations_insert" on public.conversations for insert
  with check (
    exists (
      select 1 from mentorship_requests mr
      where mr.id = mentorship_id
        and (auth.uid() = mr.mentee_id or auth.uid() = mr.mentor_id)
    )
  );

-- ---------- messages ----------
create policy "messages_select" on public.messages for select
  using (public.conversation_participant(conversation_id));
create policy "messages_insert" on public.messages for insert
  with check (
    auth.uid() = sender_id
    and public.conversation_participant(conversation_id)
  );

-- ============================================================
-- Trigger: create a profile row automatically when a user signs up.
-- This is the recommended pattern and avoids race conditions with
-- the client-side insert in signup.tsx (which is kept as a fallback).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'mentee')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
