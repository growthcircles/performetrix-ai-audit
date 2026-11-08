-- RLS for the 360 tables. Same enforcement philosophy as
-- rls_policies.sql: tenant isolation for CHRO-owned data, and for the two
-- most sensitive tables (rater_submissions, leader_report_tokens) no
-- authenticated-role policy at all - reads only ever happen through the
-- service-role client inside server-only aggregation code, so "even
-- super_admin can't see an individual rater's raw response" is a Postgres
-- guarantee, not just an app-layer convention.

alter table public.raters enable row level security;
alter table public.rater_submissions enable row level security;
alter table public.report_access_grants enable row level security;
alter table public.leader_report_tokens enable row level security;

-- raters: CHRO manages the nomination list for their own tenant's leaders.
-- Seeing rater names/emails is expected here (the CHRO nominated them) -
-- anonymity protects response *content*, not the nomination list itself.
create policy "super_admin reads all raters"
  on public.raters for select
  using (public.current_user_role() = 'super_admin');

create policy "chro reads own customer raters"
  on public.raters for select
  using (
    leader_id in (
      select id from public.leaders where customer_id = public.current_user_customer_id()
    )
  );

create policy "chro inserts own customer raters"
  on public.raters for insert
  with check (
    leader_id in (
      select id from public.leaders where customer_id = public.current_user_customer_id()
    )
  );

create policy "chro deletes own customer raters"
  on public.raters for delete
  using (
    leader_id in (
      select id from public.leaders where customer_id = public.current_user_customer_id()
    )
  );

-- rater_submissions: no select/insert policy for any authenticated role.
-- Writes happen only via the service-role client in the rater-token submit
-- flow; reads happen only via service-role inside aggregation code that
-- collapses rows into group means/pooled text before returning anything.

-- report_access_grants: CHRO grants/revokes their own access to their own
-- tenant's leader reports; super_admin (the coach) always has access
-- regardless of this table, enforced in app code.
create policy "super_admin reads all report access grants"
  on public.report_access_grants for select
  using (public.current_user_role() = 'super_admin');

create policy "chro reads own customer report access grants"
  on public.report_access_grants for select
  using (
    leader_id in (
      select id from public.leaders where customer_id = public.current_user_customer_id()
    )
  );

create policy "chro inserts own customer report access grants"
  on public.report_access_grants for insert
  with check (
    leader_id in (
      select id from public.leaders where customer_id = public.current_user_customer_id()
    )
    and granted_by = auth.uid()
  );

create policy "chro revokes own customer report access grants"
  on public.report_access_grants for update
  using (
    leader_id in (
      select id from public.leaders where customer_id = public.current_user_customer_id()
    )
  );

-- leader_report_tokens: no policy for any authenticated role. The CHRO UI
-- shows only "sent on {date}" / "not yet sent" - never the token or URL -
-- so there is no legitimate authenticated read path to this table at all.

-- get_leader_360_status() is security definer and reads raters (already
-- RLS-permitted for CHRO/super_admin), so it's safe for both authenticated
-- roles to call directly for the completion tracker.
grant execute on function public.get_leader_360_status(uuid) to authenticated, service_role;
