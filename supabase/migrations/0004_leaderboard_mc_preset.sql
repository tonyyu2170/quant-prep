-- The multiple-choice 80-in-8 could never rank: 0003's canonical CTE listed only
-- `optiver-80in8` and `sequences-sprint`, so the join dropped every `optiver-mc-80in8`
-- session on the floor. It is a shipped preset with the same 80 questions and 480 seconds
-- as the free-entry sprint, and it is the format Optiver actually uses.
--
-- The whole view is recreated rather than patched, because the canonical list is a CTE
-- inside it. Everything below the CTE is byte-identical to 0003 — diff the two files and
-- the only change is the added values row. The definer semantics, the exposure surface and
-- the grants are all unchanged, and the header comment in 0003 still explains them.
--
-- Safe to apply on a live board: the view is stateless, and adding a preset can only make
-- rows that were being discarded start ranking. Nothing already ranked moves, because rank
-- is partitioned BY preset.

create or replace view public.leaderboard
with (security_invoker = false) as
with canonical (preset, question_count, duration_s) as (
  -- Must track packages/engine/src/presets.ts. A non-standard `?count=` run does not rank:
  -- 3 correct out of 3 would otherwise outrank 41 out of 80.
  values ('optiver-80in8'::text, 80, 480),
         ('optiver-mc-80in8'::text, 80, 480),
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
