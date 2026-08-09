-- Same gap pattern as the earlier missing INSERT policy: customers only
-- ever had SELECT policies until super_admin needed to write to it.
-- Editing an organisation's name (e.g. fixing a typo) needs UPDATE too.
create policy "super_admin updates customers"
  on public.customers for update
  using (public.current_user_role() = 'super_admin')
  with check (public.current_user_role() = 'super_admin');
