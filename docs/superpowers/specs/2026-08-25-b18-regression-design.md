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

## Outcome

**Shipped in full 2026-08-26**, Tasks 0-7, on `b18-regression` (twelve content templates over four
tasks, seven review-fix commits, Python, the topic split, one reassignment, ship). Measured at
Task 7, not predicted:

| | before | after | spec said |
|---|---|---|---|
| bank | 307 | **319** | 319 ✓ |
| bank difficulty | 80/148/79 | **83/154/82** | 83/154/82 ✓ |
| statistics | 47 | **59** | 59 ✓ |
| `statistics/regression` | — | **16** at **3/9/4** | 17 at 3/9/5 ✗ |
| `statistics/estimation` | 15 | **11** at 1/7/3 | 10 ✗ |
| `statistics/moments` | 17 | 17 | unchanged ✓ |
| `statistics/inference` | 15 | 15 | unchanged ✓ |
| market-playable | 302 | **314** | 314 ✓ |
| probability's share | 59% | **56.74%** (181/319) | 57% ✓ |
| `abs: 0` pin | 42 | **42** | 42 ✓ |

`tsc` clean, 319 emitted, **656 tests** (36 files), "Verified 319 problems", `next build` green.

The `abs: 0` pin at `registry.test.ts:213` did not move, and reconciles against its own comment
rather than merely matching: brainteasers/logic 12 (5 choice + 7 exact), counting 17,
number-theory 8, solid-geometry 2, estimation 2 + inference 1 (the three sample sizes). None of the
twelve is a count or an exact-integer answer, as predicted.

**Per-template chain audit over BOTH whole topics** (200 seeds each, `auditChains` as the gate calls
it, per-template sums reconciled against the topic aggregate so the zeros are measured and not
narrated): `regression` 16 templates, checked **9400**, claimFree **14800**, segments 24200;
`estimation` 11 templates, checked **7200**, claimFree **4200**, segments 11400. Zero mismatches,
zero unevaluable, partition exact on both. **No template sits at `checked = 0` or `claimFree = 0`**
. The thinnest single template is `slope-through-the-origin` at
checked 200 (one chain per draw), and the thinnest claimFree is 200 — one symbolic opening per draw,
the house convention exactly — at ten templates across the two topics (3 in `regression`, 7 in
`estimation`). The nine templates this repo
has shipped at `claimFree = 0` behind a green topic gate are not in either of these.

**Mutation check:** `r-squared-from-sums-of-squares`'s answer expression scaled by 1.02, re-emitted,
`verify.py` reported **225 issues** — decomposed by re-running the three loops separately as
**100 derived-key + 100 answerKey + 25 brute-force** (100 instances, brute capped at
`BF_INSTANCES = 25`). Restored, re-emitted, green. The Task 5 commit had already measured 225 /
225 / 425 on three different templates, so the count is a per-template quantity and never a
constant.

`tools/_b18-roster.ts` deleted; `tools/_b14-roster.ts` deliberately left in the tree.

### What the gates caught

- **Templates that graded their own `commonTrap` as CORRECT, per template — no quantifier.** The
  measurements are the point, and only these are measured: `r-squared-from-sums-of-squares` answered
  exactly 0.5 on **9 of 290** draws, the MODAL answer, where quoting the residual share is
  indistinguishable from the explained one (fixed by `2 * rss !== tss`, 290 → 281);
  `regression-intercept-from-means` gave an intercept of exactly 0 on **12 of 1080** draws, which is
  its own negation, so subtracting the wrong way round graded correct (fixed by a `>= 1` floor, the
  grid's smallest nonzero intercept being exactly 1, 1080 → 1068); `slope-after-adding-a-point`
  graded "raw deviations, no mean shift" correct on **1368 of 6336** tuples with the mean-shift
  conjunct dropped, and 410 of the 2350 survivors plus 167 for a plain average of the old slope and
  the new point's own. Trap-punishability conjuncts were added across Tasks 1-4 — three recorded in
  Tasks 1-2, four on #7, three on #9, four on #11 — the exact total depending on how a re-scoped
  conjunct is counted, which is why no total is asserted here. **A trap is only a trap where the
  arithmetic separates it from the answer**, and the plan sketched one conjunct where the shipped
  templates carry four. Not every defect found this way was a trap defect:
  `fitted-value-and-residual`'s was plausibility — it predicted negative share volume on 13 of 1742
  draws — fixed by `fitted > 0`, which subsumed a rendering problem and let the `paren` helper go.
- **A constraint that rejects too much CRASHES PRODUCTION, and no gate sees it.** The most serious
  finding of the batch. `#11 slope-after-adding-a-point` shipped at **5.13% acceptance** — 812 of
  15840 tuples — and `drawParams` retries 100 times and then throws
  (`packages/engine/src/problem.ts:46`). Measured over 200,000 seeds: **1099 threw**, 0.55%, into
  two paths with no `try/catch` — `ProblemRunner.tsx:41` inside a `useMemo` (an uncaught render
  exception, roughly one serve in two hundred) and `market.ts:66`. Every gate missed it:
  `registry.test.ts` uses 50 seeds and the first failure is at seed 637, `emit.ts` uses 0-99, and
  `emittedSpread` seeds off an FNV hash of the id that happened to survive — **166 of 400 arbitrary
  bases would have thrown**, so a rename was a coin flip on the suite. The fix thinned the CHOICE
  LISTS to what the constraint already admitted (`n` never reached 24, `dx` never reached 4, 5 or
  6 on a legal draw), leaving the legal set **bit-identical** — sha256 over all 812 draws unchanged
  at `1d5a3b02`, every trap margin still valid — rather than relaxing a conjunct. Acceptance
  5.13% → 12.82%, throws 1099 → **1** per 200,000. Task 7 re-measured all twelve: eleven at zero,
  `slope-after-adding-a-point` at the documented 1.
- **`keyInsight` and `commonTrap` are read by NOTHING in this repo** — `emit` audits statements and
  solution bodies, `CLAIMS` reads derived values — and **five separate defects** shipped into them
  before a clause-by-clause hand re-read caught them. Two were false statements about the template's
  own algebra: "a far-out point moves the slope even when it lies close to where the old line would
  have put it" (`b' - b` is proportional to `dy - b*dx`, so a point ON the line moves nothing at any
  leverage — the constraint depends on that fact, so the insight contradicted the code beneath it),
  and "the newcomer's weight is the square of its distance from the predictor's mean" (the weight is
  `w*dx^2`; dropping `w` turns the sentence into the trap `commonTrap` names first, and at
  `n=11, sxx=150, b=1.2, dx=10, dy=8` it returns 1.04 — exactly the raw-deviation trap, wrong on all
  812 draws). The solution body had it right; only the field a candidate would memorise did not.
- **A quantifier the audit did not support.** "Every trap in the audit misses by at least 6.0
  tolerances" was false against two traps named in the same file (plain average 4.44,
  half-application 5.88). Replaced with per-trap figures and a note saying why no replacement
  universal goes there — a quantifier over a set a future editor can extend is how four rounds of
  stale figures happened.
- **The rounded-operand non-negotiable was violated four times, all in the plan's own sketches**:
  #3's sanity-check root (measured failing 36 of 290 draws), #10's inner root, #11's `w`, and #10's
  outer multiply feeding a four-figure rendering back in as an operand. Three of the four would
  probably have passed the printed-precision gate — it reconciles at DISPLAYED precision, and a
  rounded operand is display-identical. Caught by reading the code, never by a gate.
- **No `constraint` threshold a draw can land on exactly.** `constraint` sees the raw float while
  `derived` rounds at 1e-9, so a threshold on a reachable value decides those draws by IEEE dirt
  rather than by the rule. #7 shipped 927 draws at a `0.3` floor and 933 at `0.25` — same intent,
  six draws apart, decided by nothing. #11's three thresholds were then chosen to be unlandable and
  the bracketing pairs recorded (0.145 sits between the reachable 0.14482759 and 0.14634146; 0.15,
  0.2 and 0.25 are all hit exactly).
- **Trap margins must be measured through the engine's own `grade()`**, which compares with `<=`: a
  scratch harness using `<` undercounts a trap sitting exactly on the tolerance boundary by one,
  which is how 1673 was first reported as 1672.
- **The Python counterparts fit a constructed data set** rather than re-evaluating the closed form
  the template teaches, so a wrong formula loses against the fit instead of being echoed back. All
  five JS content gates stayed green under three deliberate mutations (the R² denominator, the sign
  of the omitted-variable bias term, the leverage denominator); only the Python caught them.

### What the plan got wrong

- **#4's rescaling direction was backwards.** The plan said the response moves to units
  "`ybarScale` times larger", contradicting `answer = b*ybarScale/k` — stated three times in the
  same plan and the thing actually measured against. Both variables move to SMALLER units. Task 2
  anchored on the formula and the docs were corrected after.
- **#7's sketched identity was subscripted**, and subscripts are numbers to the emit tokenizer, so
  the sketch contradicted the `constants` array the same template required. Replaced with the
  plain-letter form.
- **#10's Answer step multiplied the labelled root by sigma**, consuming a rounded operand — the
  fourth appearance of the one defect, and in the plan rather than the code.
- **#11's `w` was never addressed anywhere in the plan.** `n/(n+1)` does not terminate at `n = 11`
  or `n = 14`, so printing it as a label and multiplying by it puts a four-figure rendering in as an
  operand. The shipped fix clears the fraction by `n+1` instead — every operand an exact integer,
  the quotient unchanged, `w` never printed at all, and it is how the arithmetic is done by hand.
- **`claimFree` and `checked` were conflated** in how the audit was described. They measure
  different things: `checked = 0` means a template is UNAUDITED, `claimFree = 0` means it has no
  purely-symbolic opening segment and so violates the house convention. The per-topic gate floors
  (`checked > 1000`, `claimFree > 0`) can each be satisfied by ONE template for a whole topic, which
  is how nine templates have shipped at `claimFree = 0` behind a green topic gate across three
  batches. Task 7 audited per template, and reconciled the per-template sums against the topic
  aggregate — a per-template number that does not sum to the gate's own total is an artefact, not an
  audit.
- **`regression 17 / estimation 10 at 3/9/5` became `16 / 11 at 3/9/4`.**
  `weighted-least-squares-single-mean` (a d3) asks for the minimum-variance unbiased combination of
  three independent model prices — inverse-variance weighting, with no regressor, no fit and no
  regression vocabulary anywhere a student reads; the only matches were the id string and the topic
  line. The spec had named it as the reassignment candidate **if `estimation` fell below its audit
  floor**. It did not — `estimation` clears `checked > 1000` six times over — and the template was
  reassigned anyway, on content grounds. Predicting a split by counting ids is not the same as
  reading what each template asks.
- The spec's roster table holds **stub** counts, not shipped ones: re-probing under the real id
  matters because `emittedSpread` seeds off an FNV hash of the id and `maxRepeat` re-rolls.

### Lessons for a next batch

- **Two of the worst findings are permanently checkable, and would make a better B19 opener than
  more content.** Neither needs new machinery:
  - **P(throw) per template over 200k seeds.** `drawParams` throwing is an uncaught production
    render exception, no existing gate samples enough seeds to see it (50, then 0-99), and the one
    gate that might is seeded off an id hash — so it is a coin flip that a rename does not break the
    suite. A whole-bank sweep is a loop around `drawParams` in a `try`; Task 7's ran in seconds.
    Pin a ceiling and the 85x outlier can never ship again.
  - **`keyInsight` and `commonTrap` are read by nothing.** Five defects shipped into them in one
    batch, two of them statements the template's own algebra contradicts. They are the two fields a
    candidate is most likely to memorise. At minimum they belong in the `CLAIMS` scope; even a
    number-free-prose and register check would have caught the 127-word insight.
- **A trap is not a trap until the arithmetic separates it from the answer.** Measure every named
  `commonTrap` against the real `grade()` over the FULL legal draw space before shipping, not over a
  seed sample. Three templates here shipped a region where their own trap won, and the worst was
  the MODAL answer of an easy-tier template — the region a seed sample is most likely to hit and
  least likely to flag.
- **The two lessons pull against each other, and the resolution is always the same.**
  Trap-punishability constraints push acceptance down; low acceptance throws in production. Fix by
  thinning the CHOICE LISTS to what the constraint already admits — that keeps the legal set
  bit-identical and every trap measurement valid — never by relaxing a conjunct.
- **The non-negotiable beats the sketch every time.** Four rounded-operand violations in this batch
  originated in the plan, not in drafting. A sketch is a suggestion; the rounded-operand rule is not.
- **Reconcile a measurement against the gate that owns it.** Every per-template figure in this
  outcome was summed and checked against the topic aggregate the gate itself computes. A checker
  nobody has watched fail is not evidence, and a number nobody has reconciled is not a measurement.

**Registry note, not fixed here:** `registry.test.ts:20` pins `MARKET_TEMPLATES.length` to
`PROBLEMS.length - choices` — exact by derivation — and line 21 then adds
`toBeGreaterThanOrEqual(314)`. The spec asked for the market floor "pinned exactly, never as a loose
floor"; line 20 already delivers that, so line 21 is redundant rather than wrong. Recorded, left
alone — out of Task 7's scope.

### B19 candidates

Both were named in this spec as deferred:

- **Time series** — AR(1) (mean reversion, the half-life, the stationary variance) and the variance
  ratio. It is the strand a regression batch most naturally opens onto, and the one every desk
  interview reaches for.
- **MLE / Fisher information** — the score, the information bound, the asymptotic variance of an
  estimator. It sits behind `statistics/estimation`, which this batch has just left at 11.

Weigh the two permanently-checkable gates above first: they are cheap, they close defects this batch
proved are invisible, and content added on top of them is content that cannot ship the same way.
