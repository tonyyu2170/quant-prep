# B17: statistics/inference — design

**Date:** 2026-08-24. **Status:** approved by delegation (the user chose "B17, 12 templates,
approach B" and delegated the remaining calls). Implementation plan:
`docs/superpowers/plans/2026-08-24-phase1.5b17-inference-batch.md`.

## Goal

Take `statistics/inference` from 3 templates (2/1 at d2/d3, no easy tier) to **15** by adding
twelve, taking the bank from 295 to **307**. The topic is the thinnest in the bank; the three it
holds are the one-sample z-statistic, the two-sided p-value and one-sided power. Everything a
candidate actually meets in a testing question — proportions, two-sample designs, sample size for
power, track-record significance, multiple testing — is missing.

## Why this roster and not another

The research corpus does not decide this one. QuantGuide's 76 statistics prompts are OLS-heavy
and the only testing prompt scraped is a locked one-proportion yes/no (`statistical-test-review-iv`:
400 of 1000 chose plan A — is there a preference?). QuantProf's index has nothing under
hypothesis testing. So the roster is built from what interviews ask, and three approaches were
weighed:

- **A. The z-family, deep** — twelve dressings of Φ(gap/se). Safest to verify, least worth
  shipping: after the first four they are the same three formulas re-dressed.
- **B. Interview-shaped, mixed machinery** — *chosen*. Proportions, two-sample and paired designs,
  power both ways, a correlation test, track-record significance, multiple testing, a likelihood
  ratio. No new engine helpers: chi-square and t appear only as *statistics* with the critical
  value given, and the normal CDF does everything else.
- **C. Decision-theoretic** — Bayes factors, posterior odds, SPRT bounds, FDR. Distinctive, but
  posterior odds is `bayes/base-rate-test`'s question, FDR and sequential looks need a bivariate
  normal the engine does not have, and fewer are asked. Its best item (the likelihood ratio) is
  in B.

## Decisions

**1. Every multiplier is a GIVEN, stated in the problem.** The Python verifier holds a brute
route to 1e-9 absolute. A quantile the template rounds silently (0.8416 for 80 percent power)
misses an exact brute by 1e-5 and fails. So the statement names the critical value ("rejects when
the statistic exceeds 1.645") and, where power is a target, the normal point for it ("the normal
point for 80 percent power is 0.842"), and the brute honours the statement. Table values are kept
to THREE decimals — `1.282 / 1.645 / 2.326` one-sided, `1.645 / 1.96 / 2.576` two-sided, `0.842 /
1.282 / 1.645` for 80/90/95 percent power — so that any sum of two is four significant figures and
can stand as a printed operand (`1.645 + 0.842 = 2.487`). The precedent is
`type-two-error-and-power`, whose Python brute integrates the density over the region the
statement's critical value defines.

**2. Ask for a signed distance, never a level.** `distinctAtBand` is scale-invariant and
transitive (B16, non-negotiable B). Every statistic here is signed and spread around zero, or is
a count, or is a probability that moves across most of (0, 1). Nothing asks for a rate near a
fixed level.

**3. Exactness by construction, not by luck.** Where a printed chain needs an exact operand, the
draw is shaped so it is exact: perfect-square sample sizes so `√n` is an integer; null
proportions in `{0.1, 0.2, 0.5, 0.8, 0.9}` so `√(p₀(1−p₀))` is `0.3/0.4/0.5`; correlations from
Pythagorean pairs (`0.28/0.96`, `0.6/0.8`) so `√(1−r²)` is exact; a paired design that DRAWS the
difference's standard deviation and derives the covariance; a Sharpe ratio drawn from a nice set
with the mean return derived. Where the last step is a root or a power of exact literals it is
written as ONE chain evaluated once (`\sqrt{2.25+5.76}`, `0.95^{20}`) — the printed-precision gate
reads both — and the rounded result is never re-used as an operand. `exact4` licenses everything
else in `constraint`.

**4. A count answer grades exactly.** `sample-size-for-target-power` is a smallest-n question:
`abs: 0`, round at the ninth decimal before the ceiling, and the constraint keeps the fractional
part of the raw requirement inside `[0.02, 0.98]` so no float boundary is ever near. The registry's
`abs: 0` pin moves 41 → 42.

**5. Two-sided power prints its far tail, in words.** `Φ(δ−c) + Φ(−δ−c)`: the far tail is kept
above 1e-6 (fmtNum's window) by constraint and printed as its own labelled value; the sum is
stated in prose, never as `a + b = c` over two rounded renderings.

**6. Multiple testing has a real third axis.** "Each strategy must pass on k disjoint periods"
with `k ∈ {1, 2}` gives a per-strategy false-positive rate of `α^k` — the in-sample /
out-of-sample lesson inside one template — rather than a decoy axis.

**7. The Sharpe standard error is Lo (2002) with the observation frequency.** For iid returns
`SE(annual SR) = √((1 + SR²/(2q)) / years)`, `q` observations per year. The frequency is a real
axis and the lesson is that it barely matters: the error is dominated by the mean's, which only
years of history reduce.

**8. Claims travel with each template.** `statistics/inference` is already in `CLAIMED_TOPICS`,
so the coverage test fails the moment a template ships without its `CLAIMS` entry (B16's
outcome). There is no separate claims task.

**9. No new machinery.** Twelve `ProblemTemplate`s under `content/problems/statistics/`,
registered in `index.ts`; Python counterparts appended to `verification/solvers/statistics.py`
(scipy and numpy only — `verification/requirements.txt` installs nothing else in CI); all five
gates unchanged. The topic already exists in all four scope arrays, so there is no split.

**10. Branch and push.** Work lands on `b17-inference` off local `main`, one commit per strand.
Nothing is pushed: the user has declined twice and the 27 unpushed commits are their call.

## The roster — probed 2026-08-24 before any prose

Stubs with real `params`, `constraint` and `derived` are in `tools/_b17-roster.ts` (deleted at
ship; parameter sets are recorded in the plan). Floors: `texts/100 ≥ 70`, `maxRepeat ≤ 4`,
`distinct@band ≥ 12`.

```
I1  one-proportion-z-statistic           tuples=753     texts/100=95   maxRepeat=3  distinct@band=118
I2  chi-square-statistic-for-a-die       tuples=674     texts/100=93   maxRepeat=2  distinct@band=135
I3  two-sample-z-statistic               tuples=183776  texts/100=100  maxRepeat=1  distinct@band=77
I4  two-proportion-z-statistic           tuples=814     texts/100=94   maxRepeat=2  distinct@band=172
I5  years-to-a-significant-sharpe        tuples=591     texts/100=91   maxRepeat=3  distinct@band=56
I6  false-positive-among-many-backtests  tuples=212     texts/100=81   maxRepeat=3  distinct@band=58
I7  correlation-significance-t-statistic tuples=4214    texts/100=100  maxRepeat=1  distinct@band=86
I8  power-of-a-two-sided-test            tuples=322     texts/100=90   maxRepeat=3  distinct@band=65
I9  sample-size-for-target-power         tuples=606     texts/100=89   maxRepeat=3  distinct@band=175
I10 paired-test-statistic-with-correlation tuples=14223 texts/100=99   maxRepeat=2  distinct@band=99
I11 likelihood-ratio-for-a-biased-coin   tuples=501     texts/100=92   maxRepeat=2  distinct@band=323
I12 standard-error-of-a-sharpe-ratio     tuples=500     texts/100=93   maxRepeat=4  distinct@band=62
```

Zero/window audit over every legal draw: no zero answers, nothing outside fmtNum's window on any
of the twelve; answers span `1.03e-3` (I11) to `4.38e+3` (I9).

**What the probe changed before a word was written:** the first I3 required the two-sample
standard error to be a perfect square and left a legal fraction so thin that `drawParams` failed
outright ("constraint unsatisfiable"); I4, I5 and I10 carried the same risk. All four were
restructured (the root as a single chain; `n_B = n_A × {1, 2, 4}`; the Sharpe drawn and the mean
derived; the difference's standard deviation drawn and the covariance derived). I6 and I12 were
widened from the edge of the floors (I6: 154 tuples at texts 76, repeat 4 → 212 at 81, repeat 3).
**I12 remains at `maxRepeat = 4`**, the cap; its seeds re-roll under the real id, and if it lands
on 4 again a fourth axis is the fix (B7's lesson), not a bigger list.

| # | id (after `statistics/`) | d | answer | exactness | brute route |
|---|---|---|---|---|---|
| I1 | `one-proportion-z-statistic` | 1 | `(k−np₀)/√(np₀(1−p₀))`, signed | `√n` integer, `√(p₀q₀) ∈ {.3,.4,.5}` | a 0/1 sample with exactly k ones; the statistic from its measured mean in the PROPORTION form `(p̂−p₀)/√(p₀q₀/n)` |
| I2 | `chi-square-statistic-for-a-die` | 1 | `Σ(O−E)²/E`, six faces, `E` integer | integer arithmetic | `scipy.stats.chisquare` on the observed counts |
| I3 | `two-sample-z-statistic` | 2 | `(x̄_A−x̄_B)/√(σ_A²/n_A+σ_B²/n_B)`, signed | both terms and their sum `exact4`; root inside one chain; SE a label | two samples constructed with the quoted moments; numpy measures both back |
| I4 | `two-proportion-z-statistic` | 2 | `(p̂_A−p̂_B)/√(p̄q̄(1/n_A+1/n_B))`, pooled, signed | `p̄` an integer percent by constraint (`n_B = n_A×{1,2,4}`), so `p̄q̄` is ≤ 4 sf; `1/n_A+1/n_B` `exact4` | `chi2_contingency(correction=False)` on the 2×2 table: `z = sign·√χ²` |
| I5 | `years-to-a-significant-sharpe` | 2 | `(t/SR)² − elapsed` | SR drawn from `{.25,.4,.5,.625,.8,1,1.25,2}`; mean `= SR×vol` to one decimal; ratio and square `exact4` | `brentq` on `SR·√T − t = 0` for T, then subtract |
| I6 | `false-positive-among-many-backtests` | 2 | `1−(1−α^k)^m`, `k ∈ {1,2}` | `α^k` and `1−α^k` `exact4`; the power is one chain | binomial PMF summed over `j ≥ 1` (complement never taken) |
| I7 | `correlation-significance-t-statistic` | 2 | `r√(n−2)/√(1−r²)`, r from cov and two variances, signed | `r ∈ ±{.28,.6,.8,.96}`, variances perfect squares, `n−2` a perfect square | two series constructed with exactly that correlation; `scipy.stats.linregress` slope t-statistic |
| I8 | `power-of-a-two-sided-test` | 2 | `Φ(δ−c)+Φ(−δ−c)`, `c` given | `δ = gap√n/σ` `exact4`; far tail ≥ 1e-6 | `integrate.quad` of the density under the ALTERNATIVE over both rejection regions |
| I9 | `sample-size-for-target-power` | 3 | `⌈((c+z_β)σ/gap)²⌉`, both given; `abs: 0` | `c+z_β` four sf; the square one chain; frac ∈ [0.02, 0.98] | scan n upward with `norm.cdf` until power clears `Φ(z_β)`; assert n−1 fails |
| I10 | `paired-test-statistic-with-correlation` | 3 | `d̄√n/σ_D`, `σ_D² = σ_X²+σ_Y²−2cov` | `σ_D` DRAWN, cov derived (half-integers allowed), `√n` integer | paired samples constructed with those moments; the difference's SD MEASURED, never expanded |
| I11 | `likelihood-ratio-for-a-biased-coin` | 3 | `(2p₁)^k(2(1−p₁))^{n−k}` | both bases exact; the product one chain; LR in `[1e-3, 1e5]` | `binom.pmf` ratio (the binomial coefficient cancels) |
| I12 | `standard-error-of-a-sharpe-ratio` | 3 | `√((1+SR²/(2q))/years)`, `q ∈ {1,4,12,52,252}` | `SR²` exact; the root one chain | delta method with a NUMERIC gradient and the exact asymptotic covariance of `(mean, variance)` under normality, annualised; a long-T simulation as a loose assertion |

Split **2/6/4**; inference lands at **15 = 2/8/5**.

## What was considered and cut

| candidate | why not |
|---|---|
| minimum detectable effect `(c+z_β)σ/√n` | the same content as I9 read the other way; a real-valued answer over a rounded quantile fails the 1e-9 brute unless the quantile is a given, at which point I9 already teaches it |
| Bonferroni family-wise rate `1−(1−α/m)^m` | the answer sits within a percent of α on every draw — the rate-near-a-level collapse of B16 |
| P(real edge given significant) | `bayes/base-rate-test` |
| sequential looks / peeking inflation | needs the bivariate normal; not computable to 1e-9 with what the engine has |
| Wald SPRT bounds `(1−β)/α`, `β/(1−α)` | exactly rational and a fine d3, but a one-for-one swap away from I8 and less asked; the first candidate for a later batch |
| chi-square or t p-values | no CDF in the engine and the file says not to extend the LaTeX allowlist; statistics with the critical value given cover the interview question |

## Figures to check at ship

Bank **295 → 307**; difficulty **78/142/75 → 80/148/79**; statistics **35 → 47**; inference
**3 → 15** at 2/8/5; probability's share **61% → 59%**; market-playable **290 → 302**; `abs: 0`
**41 → 42**. Per-topic printed-precision: `checked > 1000` and `claimFree > 0` for inference,
read not assumed; and non-negotiable 6 measured **per template over the whole topic** (all 15).
