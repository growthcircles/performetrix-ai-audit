-- PerforMetrix AI Audit — admin users
-- Run this once in the Supabase SQL editor.
-- It is idempotent: uses IF NOT EXISTS so it can be re-run safely.

create table if not exists public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text not null,
  password_hash text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_email_idx on public.admin_users (email);

-- Seed the current admin from environment variables if the table is empty.
-- The hash is bcrypt-like: sha256 of "salt:password". Replace the salt per
-- deployment by updating the SESSION_SECRET env var.
do $$
declare
  v_email    text := null;
  v_password text := null;
  v_name     text := null;
begin
  v_email    := current_setting('pmx.admin.email', true);
  v_password := current_setting('pmx.admin.password', true);
  v_name     := current_setting('pmx.admin.name', true);

  if v_email is null or v_password is null then
    -- Settings not supplied: skip seeding. Admins must be added manually.
    return;
  end if;

  if not exists (select 1 from public.admin_users where email = v_email) then
    insert into public.admin_users (email, name, password_hash)
    values (
      v_email,
      coalesce(v_name, 'PerforMetrix Admin'),
      encode(hmac(v_password, coalesce(current_setting('pmx.session.secret', true), 'performetrix-local-dev-secret'), 'sha256'), 'hex')
    );
  end if;
end $$;