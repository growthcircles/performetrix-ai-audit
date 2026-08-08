-- Missing since the original RLS migration: nothing wrote to `customers`
-- through the authenticated client until the admin "create a customer"
-- feature, so the gap (SELECT-only policies) went unnoticed until now.
create policy "super_admin creates customers"
  on public.customers for insert
  with check (public.current_user_role() = 'super_admin');
