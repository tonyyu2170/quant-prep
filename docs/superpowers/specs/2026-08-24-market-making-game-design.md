# Market-making game — design

**Date:** 2026-08-24
**Status:** SHIPPED 2026-08-24. Two sections below were changed by contact with the
running game and are marked AMENDED; the rest describes what was built.
**Closes:** the `Coming next: market-making game` line in `app/page.tsx:55`, which has advertised this since before the probability bank shipped.

---

## 1. What this is, and what it is not

A timed game in which the player quotes a two-way market on a quantity drawn from the
problem bank, and a bot picks them off when the quote is wrong.

The brainstorming session considered three readings of "market-making game" and two were
rejected on the record:

- **Running a live order book** (continuous quoting, inventory, position limits) — closest to
  the real job, furthest from what an interview asks, and it needs a flow-and-book engine the
  repo has nothing resembling. Rejected as a different product.
- **A Fermi estimation / calibration game** — accepted, but as a *separate game with its own
  spec*, not folded into this one. See §9.

## 2. Decisions taken, with their alternatives

| Decision | Chosen | Rejected, and why |
|---|---|---|
| Relationship to the Fermi game | Two separate games, this one first | Fusing them would have made all content Fermi and left the 224-problem bank unused |
| Scoring rule | Free width, paid for (§3) | Fixed width (player never chooses width — half the skill missing); bot-always-trades (widening always helps, degenerate) |
| Anti-degeneracy | Tight 25s round timer | Settling on a realized draw instead of the computed answer — richer, but needs templates to expose a sampler and only some problems have an underlying random variable |
| Quote unit | Declared per template, derived once (§4) | Per-round derivation from the answer's magnitude — leaks the order of magnitude, which is part of the problem |
| Persistence | Local only in v1 | Leaderboard/stats need a migration and a score model that is a P&L, not a count correct |

## 3. The scoring rule

A pure function in `packages/engine/src/market.ts`. No React, no clock, no storage — the same
shape as `grade.ts` and `srs.ts`, and testable in isolation.

```
width = (ask − bid) / unit

truth inside [bid, ask]   →  pnl = max(0, CREDIT_CAP − width)     no trade
truth > ask               →  pnl = (ask − truth) / unit           bot lifts your offer
truth < bid               →  pnl = (truth − bid) / unit           bot hits your bid
no quote submitted        →  pnl = −CREDIT_CAP
```

**Why a timeout costs `−CREDIT_CAP` rather than zero.** If not quoting scored zero, "never
quote" would be a safe zero and strictly better than risky play — the session-level form of
exactly the degeneracy that ruled out the naive adverse-selection rule. A market maker who
will not quote is worse than one who quotes wide, because a wide market at least trades.

**Losses are not clamped.** A badly wrong market should cost more than a good round earns.
One blow-up ruining a session is the lesson, not a bug.

**Zero width is legal.** `bid == ask` earns the full credit if truth lands exactly on it, and
is otherwise picked off. It is the aggressive extreme and is almost always wrong; forbidding
it would be arbitrary. **Inverted quotes (`ask < bid`) are rejected at the input**, not scored.

## 4. The unit, and why one global constant works

Every eligible template declares a `unit`. It is **derived once from the template's whole
legal draw space, not from the drawn answer**:

```
spread = p95(answers over all legal draws) − p5(answers over all legal draws)
unit   = 10 ^ round( log10( spread / 100 ) )
```

so the spread lands within a factor of ~3 of 100 units for every template. p5–p95 rather than
min–max so one extreme draw cannot set the scale for the whole template.

**CORRECTED 2026-08-24 against the implementation.** An earlier draft of this table predicted
three tidy classes (116 probability / 67 integer / 36 money) from a by-hand reading of answer
types. Deriving the unit for all 219 templates gives **nine** classes, not three — the rule
keys off each template's measured spread, not off what kind of quantity it is, so two
probability templates can land on different units:

| count | unit | |
|---|---|---|
| 82 | 0.01 | |
| 52 | 1 | |
| 29 | 0.1 | |
| 23 | 0.001 | |
| 19 | 10 | |
| 10 | 100 | |
| 2 | 10000000 | |
| 1 | 0.0001 | |
| 1 | 100000 | |
| 5 | — | multiple-choice, excluded: nothing to quote on |

Measured spreads land in 31.8–315.0 units, median 75.1 — inside the factor-of-~3.2 band that
rounding `log10` can guarantee. `content/problems/market.test.ts` asserts the band rather than
describing it. **This spread of unit classes is what broke the §6 unit label**: with nine
scales in play, most of them have no readable name.

Two properties matter:

1. **It normalises every template onto a comparable scale**, which is the only reason a single
   `CREDIT_CAP` can mean the same thing on a probability and on a £1,250 expected value.
2. **It is a property of the template, not the draw**, so it leaks nothing about the specific
   question — the requirement that ruled out per-round derivation.

Because the class is derived rather than hand-authored, it costs no edits across 219 files.
A test pins it: every eligible template must resolve to a finite unit whose resulting spread
lands inside a stated band. That test is the thing that fails if a future template's answers
drift out of scale.

## 5. `CREDIT_CAP` — the one tuning constant

**Measured, not invented — and now tuned.** The initial value came from the answer-spread
distribution: the median inter-quartile spread across the 219 eligible templates is 35.8 units,
so a cap of 40 makes a market as wide as the typical uncertainty worth nothing.

**AMENDED 2026-08-24, after the game ran.** The spread derivation fixes the *scale* but says
nothing about whether the resulting game has an interesting decision in it. `tools/market-tune.ts`
answers that, and it is the rig to re-run if this constant ever moves. Modelling a player whose
centre lands at truth + Normal(0, sigma) units, choosing half-width h:

- **Width choice matters at every skill level** — there is an interior optimum throughout, with
  h* rising from 2.25 units (sigma 1) to 15.75 (sigma 30). Neither extreme is ever best:
  zero width is always negative EV, and the widest still-earning market tops out at 0.00.
- **The cap sets the break-even skill bar.** At 20, break-even is sigma ~10 — estimating inside
  ~13% of a template's spread. At 80, a sigma=30 player still earns +11.31, so the pressure is
  gone. At 40, break-even is sigma ~20, about 27% of the typical 75-unit p5-p95 spread.

So 40 is load-bearing rather than arbitrary, and the two degeneracy arguments in §3 are now
measured rather than asserted.

**One coupling this exposed.** The optimal pick-off rate is 33% at cap 40 for a mid-skill
player, which is exactly what §6's session-end diagnosis tells the player to aim for. That
number moves with both the cap and the player's skill. **Changing `CREDIT_CAP` means
re-deriving the one-third advice, not carrying it over.**

What still cannot be measured is whether the game is *fun*, and whether a strong player can beat
the 25s clock by solving exactly (§10, Risk 2). Both need a human session.

## 6. Round and session

- **12 rounds, 25 seconds each** (~5 minutes). The bank's `expectedPaceS` runs 55–110s, so 25s
  makes exact computation infeasible and forces estimation. That pressure *is* the mechanic:
  without it, the dominant strategy is to solve exactly and quote zero width.
- Statement shown, solution withheld. **AMENDED 2026-08-24 — the unit label was removed, and
  the player quotes in the quantity's own scale.** As specced, the inputs were labelled with the
  quote unit ("in percentage points"). That reads correctly on the 82 templates at unit 0.01 and
  the 52 at unit 1, and badly on the other 85 of 219: a question reading "a fair price for one
  ticket, **in dollars**" (truth $4.08) was labelled "in units of 0.1", so the player had to type
  40.8, and typing the natural 4.08 quoted a tenth of the truth and was picked off for it. A
  label that contradicts the question is worse than no label. The player now types what the
  statement asks for — 0.75 for a probability, 4.08 for a price, 1001 for a count — which is also
  what `ProblemRunner` grades against everywhere else in the app. `unit` never reaches the input;
  it remains purely the scoring normaliser of §4, which is what still lets one `CREDIT_CAP` mean
  the same thing across templates. Width and centre error are reported in points.
- **Submitting early advances immediately** — the 25s is a ceiling, not a wait. The unused
  time is not banked or rewarded; speed buys nothing directly, only the option to think longer
  on a later round.
- **Round mix: 3 L1, 6 L2, 3 L3**, matching the shape of the existing sim ladders, drawn from
  eligible templates without repeating a template within a session.
- The quote area **resolves in place** — no navigation between quoting and settlement.
- After each round: truth, whether the bot traded and on which side, and the round P&L, with
  the market drawn as a band and truth marked on it so being picked off is visible rather than
  described.

**Session end** reports total P&L, pick-off rate, average width, and average centre error —
then names the failure mode in a sentence. "Well-centred but too wide" and "tight but
mis-centred" are opposite mistakes with opposite fixes, and a bare P&L number distinguishes
neither.

## 7. The running P&L chart

A cumulative P&L sparkline: building round by round during play, full width at session end.

**A new small component, not a reuse of `components/charts/LineChart.tsx`.** That chart is
date-indexed — it takes `SeriesPoint[]`, calls `Date.parse`, spans by timestamp, and carries
empty-state copy about "two days of drilling". A per-round P&L series is round-indexed and
needs a zero line, because P&L crosses zero and the stats series never does. Generalising
LineChart would mean changing a shipped component that `/stats` and its tests depend on, to
serve a shape it was not built for. The dedicated version is smaller than the adapter would be.

## 8. Files, tests, and what must be watched failing

```
packages/engine/src/market.ts          scoring rule (pure)
packages/engine/test/market.test.ts    inside / both pick-off sides / timeout /
                                       zero width / inverted quote rejected
content/problems/market-units.ts       unit derivation over the draw space
content/problems/market-units.test.ts  every eligible template resolves; spread in band
components/MarketRunner.tsx            round clock, quote entry, in-place settlement
components/MarketRunner.test.tsx       clock expiry scores −CREDIT_CAP; submit settles
components/charts/PnlSparkline.tsx     round-indexed cumulative P&L with a zero line
app/game/market-maker/page.tsx         the route
app/page.tsx                           replace the "Coming next" line with the real link
```

Per the repo's standing rule, **every new gate is watched failing before it is trusted**:
the scoring tests must fail with the branch inverted, and `MarketRunner`'s clock test must
fail with the timeout penalty removed. A checker nobody has watched fail is not evidence.

## 9. Not in v1 — deferred deliberately, not overlooked

- **Leaderboard and `/stats`.** Both need a Supabase migration; the leaderboard view carries a
  canonical preset list, which is what `0004_leaderboard_mc_preset.sql` had to fix. The score
  is also a P&L rather than a count correct, so the existing session schema does not fit
  without change. Ship playable and local first, wire persistence once `CREDIT_CAP` has
  survived contact with real play.
- **The Fermi / calibration game**, sub-project 2. Its content is researched real-world
  constants, each with a cited source and a recorded retrieval date. It needs a content type
  exempt from `verify.py` — there is no independent Python route to "piano tuners in Chicago" —
  plus a staleness policy, since populations and prices drift. That exemption is a real
  weakening of this repo's verification story and deserves its own design discussion rather
  than a paragraph here.

## 10. Risks

- **~~`CREDIT_CAP` is unfalsifiable before play.~~ PARTLY RETIRED 2026-08-24.** The half that
  was measurable has been measured — `tools/market-tune.ts` shows width choice has an interior
  optimum at every skill level and that 40 sets a sensible break-even bar (§5). No test can still
  say whether the game is *fun*; that half stands, and needs a human session.
- **A fast solver beats the clock.** 25s is tuned against `expectedPaceS`, but a strong player
  may still compute exactly on L1 draws and collect maximum credit. If that turns out to
  dominate, the fix is the rejected alternative — settle on a realized draw instead of the
  computed answer — which is recorded above precisely so it can be reached for.
- **Answer spread is not the same as answer *uncertainty*.** The unit rule normalises how far
  apart a template's answers are across draws, which is a proxy for how hard the quantity is to
  pin down, not a measurement of it. Templates whose answers cluster tightly but are hard to
  estimate will feel punishing.
