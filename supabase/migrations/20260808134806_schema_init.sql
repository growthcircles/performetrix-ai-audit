-- Core schema for the FutureReady Admin Portal.
-- customers -> users (chro/super_admin) -> leaders -> submissions, plus an audit_log.

create type public.user_role as enum ('super_admin', 'chro');
create type public.leader_status as enum ('pending', 'completed');

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Profile table keyed to auth.users; auth handles credentials, this holds
-- the role/tenant assignment that RLS policies key off of.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  role public.user_role not null,
  name text not null,
  email text not null,
  created_at timestamptz not null default now(),
  constraint chro_requires_customer check (
    (role = 'chro' and customer_id is not null) or
    (role = 'super_admin' and customer_id is null)
  )
);

create table public.leaders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  name text not null,
  token uuid not null default gen_random_uuid(),
  status public.leader_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index leaders_token_key on public.leaders (token);
create index leaders_customer_id_idx on public.leaders (customer_id);

-- One submission per leader: the assessment is a single pass, not versioned.
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null unique references public.leaders (id) on delete cascade,
  raw_answers jsonb not null,
  computed_scores jsonb not null,
  submitted_at timestamptz not null default now()
);

-- Access log for the "who viewed which report" data-protection requirement.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  created_at timestamptz not null default now()
);

create index audit_log_actor_id_idx on public.audit_log (actor_id);

-- Populates public.users from auth.users on account creation. Shiva invites
-- CHRO accounts (or her own) via the Supabase Admin API, passing role/
-- customer_id/name in the invite's user metadata; this trigger reads that
-- metadata back out on insert so there's no separate "create profile" step.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, customer_id, role, name, email)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'customer_id', '')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'chro'),
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
