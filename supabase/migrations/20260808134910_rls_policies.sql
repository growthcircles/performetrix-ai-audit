-- Row Level Security: this is the primary enforcement point for the
-- confidentiality requirement. A CHRO must never see another customer's
-- data, and no authenticated role may ever write to submissions directly
-- (that only ever happens via the service-role client in the leader-token
-- flow, which bypasses RLS entirely).

-- security definer + fixed search_path so these can be called from within
-- RLS policies on public.users itself without infinite-recursing into RLS.
create function public.current_user_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create function public.current_user_customer_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select customer_id from public.users where id = auth.uid();
$$;

alter table public.customers enable row level security;
alter table public.users enable row level security;
alter table public.leaders enable row level security;
alter table public.submissions enable row level security;
alter table public.audit_log enable row level security;

-- customers
create policy "super_admin reads all customers"
  on public.customers for select
  using (public.current_user_role() = 'super_admin');

create policy "chro reads own customer"
  on public.customers for select
  using (id = public.current_user_customer_id());

-- users (profile rows)
create policy "users read own profile"
  on public.users for select
  using (id = auth.uid());

create policy "super_admin reads all users"
  on public.users for select
  using (public.current_user_role() = 'super_admin');

-- leaders
create policy "super_admin reads all leaders"
  on public.leaders for select
  using (public.current_user_role() = 'super_admin');

create policy "chro reads own customer leaders"
  on public.leaders for select
  using (customer_id = public.current_user_customer_id());

create policy "chro inserts own customer leaders"
  on public.leaders for insert
  with check (customer_id = public.current_user_customer_id());

create policy "chro deletes own customer leaders"
  on public.leaders for delete
  using (customer_id = public.current_user_customer_id());

-- submissions: read-only for authenticated roles, scoped by tenant.
-- Writes happen only through the service-role client (see src/lib/supabase/service.ts).
create policy "super_admin reads all submissions"
  on public.submissions for select
  using (public.current_user_role() = 'super_admin');

create policy "chro reads own customer submissions"
  on public.submissions for select
  using (
    leader_id in (
      select id from public.leaders
      where customer_id = public.current_user_customer_id()
    )
  );

-- audit_log: super_admin only. Written server-side, not by client roles.
create policy "super_admin reads audit log"
  on public.audit_log for select
  using (public.current_user_role() = 'super_admin');
