-- Human-readable label captured at the time of the action (e.g. the
-- organisation or leader name), not resolved later via a join. This keeps
-- the log meaningful even after the target row is deleted (delete_leader)
-- and avoids showing raw UUIDs in the admin activity panel.
alter table public.audit_log add column detail text;
