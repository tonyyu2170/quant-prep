# B18: statistics/regression — design

**Date:** 2026-08-25
**Status:** approved, ready for a plan
**Bank at design time:** 307 templates; statistics 47 at moments 17 / estimation 15 / inference 15

---

## Goal

Take the regression strand from 5 templates to 17 and split it out as a fourth statistics topic,
`statistics/regression`. Twelve new templates at 3 easy / 6 medium / 3 hard, which is the bank's
own 26/48/26 mix. Statistics ends at 59, the bank at 319.

## Why this roster and not another

The choice of strand is evidence-led, not taste. Of the eleven Statistics-tagged problems in the
QuantGuide catalogue (`docs/research/quantguide-2026-08/catalogue.tsv`), **five are OLS-shaped** —
Coefficient Swap, Defining Regression, Error and Residual, OLS Review I, Double Data Trouble I/II.
Against that, our regression coverage was five templates, none of them a d1, all buried inside
`statistics/estimation` where no drill can reach them as a group.

The alternatives were weighed and rejected for this batch: **time series** (AR(1), variance ratio)
has only two templates but several answers are geometric-series limits with real collapse risk and
it overlaps `pure-math/stochastic`; **MLE / Fisher information** is a true zero in the bank but is
thinly represented in both harvested banks and several MLEs are one-line answers that struggle to
fill a d2/d3 tier; **extending inference** would widen a topic that went 3 → 15 the day before and
leave the regression gap untouched. Time series and MLE both remain live candidates for B19.

## Decisions

**Approach: identity and invariance, with sufficient statistics as the substrate.** Each template
tests a structural fact about OLS — what happens to the slope, the intercept or the fit when x is
rescaled, when x is shifted, when the intercept is forced to zero, when a correlated regressor is
dropped, when a point is added, when the regressors are orthogonal. Numbers arrive as sufficient
statistics. The rejected alternative was twelve plug-ins into the slope and R² formulas, which is
one skill in twelve costumes — the same trap B17 named when it turned down "twelve dressings of Φ".

**Every invariance template asks for the transformed quantity, never the invariant ratio.** "By what
factor does the slope change when x is in cents?" answers `100` on every seed: a constant answer
cannot clear a 12-distinct floor and makes the mutation check vacuous, since a broken answer
expression still returns the same constant. "What is the slope in the new units?" tests the same
understanding and varies with the draw. This constraint shaped #4, #5 and #11.

**No new engine helpers and no LaTeX allowlist changes.** Everything here is arithmetic, one square
root and ratios, all already licensed. The allowlist stays closed.

**Answers are computed from exact operands, never from a rounded label** (the B17 rule). #6 and #11
are exactly rational by construction; #8's RSS is built as `s²(n−2)` so the division is exact and
the root is taken of an exact literal.

## The roster — probed 2026-08-25 before any prose

All twelve measured with `tools/probe.ts` against the live gate counters. Floors:
`distinct@band ≥ 12`, `texts/100 ≥ 70`, `maxRepeat ≤ 4` (`content/problems/draw-space.test.ts:93`,
`:123-124`).

**These are the STUB numbers, and the shipped ones are smaller.** Implementation added constraints
the stubs did not have, in every case to make a template's own `commonTrap` punishable — a draw
where the trap's arithmetic returns the correct answer teaches the wrong lesson and no gate detects
it. Tasks 1 and 2 shed 19, 12, 9, 242 and 16 draws that way, with `distinct@band` holding in every
case. Task 7 records the shipped figures; this table stays as the pre-prose measurement it was.

**#4's direction, corrected:** both variables move to SMALLER units — one old unit of the response
becomes `c` new ones and one old unit of the predictor becomes `k` new ones, giving `b' = cb/k`.
The first draft of this table's row and of the plan's Step 1 said "larger" for the response, which
contradicts the formula the roster was measured against.

| # | id | d | the fact it tests | tuples | texts/100 | maxRep | distinct@band |
|---|---|---|---|---|---|---|---|
| 1 | `fitted-value-and-residual` | 1 | a residual is `y − ŷ`, not the unobservable error | 1742 | 96 | 3 | 52 |
| 2 | `regression-intercept-from-means` | 1 | the line passes through `(x̄, ȳ)` | 1080 | 95 | 2 | 188 |
| 3 | `r-squared-from-sums-of-squares` | 1 | R² is a share of variation, `1 − RSS/TSS` | 290 | 88 | 2 | 83 |
| 4 | `slope-after-rescaling-x` | 2 | rescaling x scales the slope inversely | 660 | 95 | 2 | 201 |
| 5 | `intercept-after-shifting-x` | 2 | shifting x moves the intercept by `b·c`, slope fixed | 1080 | 94 | 2 | 157 |
| 6 | `slope-through-the-origin` | 2 | no intercept ⇒ `Σxy/Σx²`, not `Sxy/Sxx` | 400 | 91 | 2 | 45 |
| 7 | `omitted-variable-bias` | 2 | short coefficient `= β₁ + β₂δ` | 1248 | 96 | 2 | 192 |
| 8 | `standard-error-of-a-slope` | 2 | `s/√Sxx`, with `s` recovered from RSS and `n−2` | 420 | 84 | 3 | 40 |
| 9 | `regression-to-the-mean-prediction` | 2 | over two periods `sx = sy`, so the slope **is** `r` | 2744 | 99 | 2 | 26 |
| 10 | `variance-of-a-fitted-value` | 3 | `σ√(1/n + (x₀−x̄)²/Sxx)` — widens away from x̄ | 990 | 97 | 2 | 46 |
| 11 | `slope-after-adding-a-point` | 3 | the rank-one update from one high-leverage point | 15840 | 100 | 1 | 229 |
| 12 | `prediction-with-orthogonal-regressors` | 3 | zero sample correlation ⇒ multiple = simple | 7560 | 98 | 2 | 88 |

### What the probe changed before a word of prose

- **#8 failed the gate as first drafted** — the residual SD was given directly, two axes, 96 tuples
  and **60 texts per 100 against a floor of 70**. Restructured to give RSS and `n`, so the solver
  recovers `s = √(RSS/(n−2))` and `n` becomes a real axis rather than decoration: 420 tuples, 84
  texts. This is the batch's evidence that "obviously wide enough" is not a measurement.
- **#3 did *not* collapse.** The design anticipated the B16 rate-shape failure — a ratio in (0,1)
  landing inside one band — and held an inversion (ask for RSS instead) in reserve. Measured at 83
  distinct answers at band, so the fallback is **not** needed and #3 ships as the ratio.
- **#9 was restructured before probing**, for duplication rather than draw space. As first drafted
  it gave `r`, `sx`, `sy` and asked for a prediction, which computes `r·sy/sx` — precisely the
  existing d2 `regression-slope-from-moments` — and then does one thing more. A same-difficulty
  superset is not the prerequisite-versus-harder relationship that licensed #3 against
  `adjusted-r-squared-from-sums`. Recast as one variable over two periods, so `sx = sy`, the slope
  collapses to `r`, and the answer is `ȳ + r(x − x̄)`. The solver never forms the ratio.

### Duplication rulings against the five existing templates

`regression-slope-from-moments` (d2, slope from `r` and the two SDs), `reverse-regression-slope`
(d2, the two slopes multiply to `r²`), `adjusted-r-squared-from-sums` (d3),
`duplicated-sample-slope-variance` (d2), `weighted-least-squares-single-mean` (d3).

- **#3 versus `adjusted-r-squared-from-sums`** — same ingredients, different question. Plain R² is
  the prerequisite fact at d1; the df adjustment is the harder one at d3. This is the same shape as
  the standing `hypergeom-exact-draw` ruling, where the general case cannot rank below its own
  degenerate sibling.
- **#9 versus `regression-slope-from-moments`** — resolved by construction, see above.
- **Deliberately not attempted:** the y-on-x × x-on-y product identity and the duplicated-sample
  variance, both already owned.

## What was considered and cut

- **A t-statistic on a slope** — the same statistic as the shipped
  `correlation-significance-t-statistic` by a different route. Too close to justify at d2.
- **Prediction interval for a new observation** (`σ√(1 + 1/n + (x₀−x̄)²/Sxx)`) — differs from #10 by
  one term inside the same root. Cut as a near-duplicate of a template in the same batch.
- **Leverage `hᵢᵢ` as its own template** — the interesting half of it is already inside #11.
- **An F-statistic from R²** — plausible, but the third d3 slot went to #12, where the orthogonality
  insight is worth more than another ratio.

## Figures to check at ship

- Bank **307 → 319**; statistics **47 → 59**; regression **5 → 17** at **3/9/5** once the five
  existing templates join it (confirmed 0 easy / 3 medium / 2 hard: slope-from-moments,
  reverse-slope and duplicated-sample at d2; adjusted-R² and WLS at d3).
- `statistics/estimation` **15 → 10** after the re-tag; moments 17 and inference 15 unchanged.
- Bank difficulty **80/148/79 → 83/154/82**.
- Market-playable floor in `registry.test.ts` **302 → 314** (319 less the 5 choice templates), pinned
  exactly, never as a loose floor.
- The `abs: 0` pin is **expected to stay at 42** — none of the twelve is a count or an exact-integer
  answer. Task 7 confirms this against the emitted corpus rather than assuming it.
- Probability's share **59% → 57%**.

## The topic split, and the risk on both sides of it

The re-tag to `statistics/regression` is the **last** content task, never the first.
`printed-precision.test.ts` asserts `checked > 1000` **and** `claimFree > 0` per topic, so a topic
declared before any template carries the tag audits zero chains and fails — the B13 lesson.

Four scopes move together, and a topic missing from any **one** of them goes silently unaudited
rather than failing: `TOPICS` in `printed-precision.test.ts`, `TOPICS` in `draw-space.test.ts`,
`CLAIMED_TOPICS` in `prose-claims.test.ts`, `TOPIC_LABELS` in `index.ts`. Plus the per-topic sum in
`registry.test.ts`, which asserts every template is accounted for. No `version` bumps: a changed
question needs one, a changed topic does not.

**The split cuts both ways.** Moving five templates out drops `statistics/estimation` from 15 to 10,
and nothing guarantees the remaining ten still clear their own `checked > 1000` floor. The audit
runs on **both** topics after the re-tag. If `estimation` falls short, the fix is to reassign a
specific template — `weighted-least-squares-single-mean` is the natural candidate, being an
estimator-combination result rather than a regression one — and never to revert the split.

## Task order

```
0. Probe all twelve                      DONE 2026-08-25, table above
1. The d1 trio (#1-3)                    → verify:emit + vitest green
2. d2 first half (#4-6)                  → same
3. d2 second half (#7-9)                 → same
4. The d3 trio (#10-12)                  ← the deferrable quarter
5. Python counterparts, all twelve       → verify.py over the whole bank
6. Re-tag all 17 to statistics/regression, audit BOTH topics   ← last
7. Ship measurement + registry pins
```

**Brute routes**, reusing what B17 established: `scipy.stats.linregress` for #1-9,
`numpy.linalg.lstsq` for #12, exact `Fraction` for #6 and #11. For #12, B17's orthonormal-pattern
trick — `[1,−1,0,…]` and `[1,1,−2,0,…]` scaled — constructs series with exact population moments and
zero sample correlation by construction.

`tools/_b18-roster.ts` holds the probe stubs and is **deleted at Task 7**, unlike `_b14-roster.ts`,
which was left behind and is still in the tree.
