-- Phase 1.5 chunk A: configured question count per run (null on pre-1.5 rows).
alter table public.test_sessions add column total int;
