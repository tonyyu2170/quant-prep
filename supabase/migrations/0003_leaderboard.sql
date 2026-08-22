-- Phase 1.5 chunk C: public leaderboard.
-- All-time best score per user per preset (spec §5; no rolling windows in 1.5).

create or replace view public.leaderboard
-- SECURITY DEFINER semantics, deliberately (spec §5). Supabase advisor 0010 flags every
-- definer view in `public`, and the flag is accepted here for a reason worth recording:
-- the invoker alternative needs a permissive SELECT policy on `profiles`, and RLS is
-- row-level, so it would publish `profiles.target_firms` to `anon`. This view's SELECT
-- list IS the entire exposure surface — no user_id, no timings, no target_firms — and
-- `handle` is machine-generated (`trader_` + hex), not user-supplied. The underlying
-- tables keep their own-row-only policies untouched.
with (security_invoker = false) as
with canonical (preset, question_count, duration_s) as (
  -- Must track packages/engine/src/presets.ts. A non-standard `?count=` run does not rank:
  -- 3 correct out of 3 would otherwise outrank 41 out of 80.
  values ('optiver-80in8'::text, 80, 480),
         ('sequences-sprint'::text, 20, 480)
),
best as (
  select distinct on (s.user_id, s.preset)
         s.user_id, s.preset, s.score, s.created_at
  from public.test_sessions s
  join canonical c on c.preset = s.preset
  where not s.merged_from_local          -- forgeable local history never ranks (parent spec §7)
    and s.total = c.question_count       -- null `total` (pre-1.5 rows) drops out here
    and s.duration_s = c.duration_s
    and s.score <= c.question_count      -- max achievable is one point per question
    and s.score >= -2 * c.question_count -- floor of the harshest scoring in use (+1/-2)
  order by s.user_id, s.preset, s.score desc, s.created_at
)
select b.preset,
       rank() over (partition by b.preset order by b.score desc) as rank,
       p.handle,
       b.score,
       b.created_at::date as played_on
from best b
join public.profiles p on p.id = b.user_id;

comment on view public.leaderboard is
  'Public all-time best score per user per preset. Definer-owned on purpose: exposes only handle/score/date while the base tables stay own-row-only. See the header comment in 0003_leaderboard.sql.';

revoke all on public.leaderboard from public;
grant select on public.leaderboard to anon, authenticated;

notify pgrst, 'reload schema';
