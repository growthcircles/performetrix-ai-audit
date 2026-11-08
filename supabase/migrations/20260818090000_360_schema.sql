-- 360 multi-rater assessment: raters, their submissions, CHRO report-access
-- grants, and leader report-delivery tokens. Extends leaders/customers/users
-- from schema_init.sql without touching the existing diagnostic tables.

create type public.rater_group as enum ('self', 'manager', 'peer', 'direct_report', 'other_stakeholder');
create type public.rater_status as enum ('pending', 'completed');

-- One row per participant in a leader's 360 cycle, including the leader's
-- own self-rated response (rater_group = 'self'). Reusing one table for
-- self + external raters keeps status/token/submission handling on one
-- code path instead of forking leader-self vs external-rater logic.
create table public.raters (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references public.leaders (id) on delete cascade,
  rater_group public.rater_group not null,
  name text,
  email text,
  token uuid not null default gen_random_uuid(),
  status public.rater_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index raters_token_key on public.raters (token);
create unique index raters_one_self_per_leader on public.raters (leader_id) where rater_group = 'self';
create unique index raters_unique_email_per_group on public.raters (leader_id, rater_group, lower(email)) where email is not null;
create index raters_leader_id_idx on public.raters (leader_id);

-- 1:1 with raters, mirrors submissions but scoped to a rater not a leader,
-- and carries the 4 open-ended pillar responses alongside the closed items.
create table public.rater_submissions (
  id uuid primary key default gen_random_uuid(),
  rater_id uuid not null unique references public.raters (id) on delete cascade,
  raw_answers jsonb not null,
  open_responses jsonb not null,
  computed_scores jsonb not null,
  submitted_at timestamptz not null default now()
);

create index rater_submissions_rater_id_idx on public.rater_submissions (rater_id);

-- Marks when a leader's 360 cycle begins (first rater nominated). Kept as a
-- nullable timestamp on leaders rather than a new table - no multi-cycle
-- requirement exists yet.
alter table public.leaders add column three_sixty_started_at timestamptz;

-- CHRO's per-leader acknowledgment/self-grant to view the 360 report. A
-- table (not a boolean column) so it's auditable and revocable, matching
-- the "at the CHRO's discretion, not automatic" access requirement.
create table public.report_access_grants (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references public.leaders (id) on delete cascade,
  granted_by uuid not null references public.users (id),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index report_access_grants_active_idx on public.report_access_grants (leader_id) where revoked_at is null;

-- Persistent-but-scoped link minted only when the CHRO clicks "send" -
-- distinct from leaders.token (that one is diagnostic-specific and already
-- one-shot-consumed for existing leaders).
create table public.leader_report_tokens (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null references public.leaders (id) on delete cascade,
  token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  revoked_at timestamptz
);

create unique index leader_report_tokens_token_key on public.leader_report_tokens (token);
create unique index leader_report_tokens_active_idx on public.leader_report_tokens (leader_id) where revoked_at is null;

-- Security-definer helper (same pattern as current_user_role()) so 360
-- status can be computed safely from RLS-constrained contexts. Returns
-- 'ready' once self has submitted and every group with at least one rater
-- has met its minimum (manager: 1, peer/direct_report/other_stakeholder: 3)
-- - matching "ready to report (minimum counts met per group)" literally,
-- not "every single rater has submitted."
create function public.get_leader_360_status(p_leader_id uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select case
    when l.three_sixty_started_at is null then 'not_started'
    when (
      select r.status = 'completed' from public.raters r
      where r.leader_id = p_leader_id and r.rater_group = 'self'
    ) is not true then 'in_progress'
    when exists (
      select 1 from (
        select rater_group, count(*) filter (where status = 'completed') as done
        from public.raters
        where leader_id = p_leader_id and rater_group in ('peer', 'direct_report', 'other_stakeholder')
        group by rater_group
      ) g where g.done > 0 and g.done < 3
    ) then 'in_progress'
    when not exists (
      select 1 from public.raters
      where leader_id = p_leader_id and rater_group <> 'self'
    ) then 'in_progress'
    else 'ready'
  end
  from public.leaders l where l.id = p_leader_id;
$$;
