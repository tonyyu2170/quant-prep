# Phase 1.5 Chunk B4: Distributions Batch — Design

**Date:** 2026-08-19
**Status:** draft, pending approval
**Parent specs:** `2026-08-15-quant-prep-site-design.md` (§6 content model), `2026-08-16-phase1.5-design.md` (§4 Chunk B)
**Predecessors:** B1 (`2026-08-16-phase1.5b1-probability-infra.md`) shipped at `b2f76c2` — 30 Bayes problems plus all shared infra. B2 (`2026-08-18-chunk-b2-counting-design.md`) shipped at `c41a90b` — 25 counting problems, content-only. B3 (`2026-08-18-chunk-b3-ev-variance-design.md`) shipped at `dbda956` — 30 EV/variance problems, plus four committed quality gates (printed-precision, draw-space, prose-claims, registry invariants) now shared by every topic.

---

## 1. Scope

25 problems treating **named distributions as objects**, not as a source of ad-hoc expectations. Explicitly distinct from two neighbors:

- **Not `ev-variance`** — that topic already covers `binomial-mean`, `binomial-variance`, `hypergeometric-mean` etc. as *computations*. This batch asks about the distribution itself: a specific PMF/CDF value, a quantile, or which parameter produces a stated probability.
- **Not `geometric`** (a future, unrelated topic name) — continuous geometric-probability problems (random points, meeting-time, Buffon's-needle) stay out of this batch entirely.

Like B3, this is not a pure content batch: it carries one infrastructure delta (§2), because the Normal distribution is the first thing in the corpus that has no closed rational form.

| property | value |
|---|---|
| topic | `probability/distributions` |
| templates | `content/problems/distributions/*.ts` (25) |
| solvers | `verification/solvers/distributions.py` |
| difficulty mix | 10 × L1 / 10 × L2 / 5 × L3 (parent spec's 40/40/20) |
| families | binomial (4), Poisson (4), geometric (3), negative binomial (2), hypergeometric (2), uniform (3), exponential (3), Normal (4) |
| tolerance | `rel: 0.005`, no `abs` — same discipline as B2/B3 (§4) |
| verify method | `brute-force` for discrete families, `montecarlo` for continuous families (§5) |

## 2. The infra delta — `erf` and the Normal distribution in TypeScript

JavaScript has no native error function or normal CDF, but `verify.py`'s mandatory `exact()` cross-check (line 27) compares every TS-computed value against Python's independently-derived one at `1e-9` relative tolerance, regardless of a problem's declared `method`. Python gets this for free via `scipy.stats.norm`; TypeScript needs its own implementation precise enough to agree.

New module `packages/engine/src/erf.ts`:

```ts
export function erf(x: number): number { ... }               // double-precision rational approximation
export function normalCdf(x: number, mu = 0, sigma = 1): number {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}
export function normalQuantile(p: number, mu = 0, sigma = 1): number { ... }  // inverse CDF
```

`erf` uses a high-order rational/continued-fraction approximation (the family used by Boost and glibc's `erf`, not the low-order Abramowitz-Stegun 7.1.26 formula — that one only clears ~1e-7 and would fail the verify gate outright). Target accuracy: ~1e-15, i.e. double-precision-limited, giving two to three orders of margin under the `1e-9` bound.

`normalQuantile` uses Acklam's rational approximation (~1e-9 accurate on its own) refined by one Newton step against `normalCdf`/the standard normal PDF, pushing the combined error safely under `1e-9`.

**Unit tests** (`packages/engine/test/erf.test.ts`) pin known values — `Φ(0) = 0.5`, `Φ(1) ≈ 0.8413`, `Φ(1.96) ≈ 0.975`, `Φ(-2) ≈ 0.0228` — and assert the round trip `normalQuantile(normalCdf(x)) ≈ x` to `1e-8`.

This is the batch's only *numerical* infrastructure delta — §8 item 14 carries a separate, still-open authoring risk (closed-form availability, not numerics; flagged there). The parser, grader, and drill UI are unchanged.

Of the four content gates, only `registry.test.ts` is topic-generic by construction. The other three each key off an explicit per-topic allowlist and silently check *nothing* for a topic left out of it — no assertion fails, coverage just drops to zero for the new content: `printed-precision.test.ts:13` hardcodes a `TOPICS` array, `draw-space.test.ts:22` hardcodes `const TOPIC = "probability/ev-variance"` for the describe block that enforces §6's floors, and `prose-claims.test.ts` iterates a hand-authored `CLAIMS` dict keyed by slug. None of these extend automatically. Closing this is not optional cleanup — it's §7 items 6–8.

## 3. Small probabilities are the hazard of this batch

B3's hazard was an expectation landing at or near zero. This batch's analogue is the same failure mode wearing a different shape: **a PMF/CDF answer landing near zero.**

1. **Grading collapses the same way.** `grade.ts`'s bound is `rel · |expected|`; at `expected → 0` the bound shrinks toward strict float equality.
2. **Distributions manufacture near-zero answers easily, by design.** `P(X = 20)` for a `Poisson(λ = 2)` is on the order of `1e-14` — a tail event, not a typo. Parameter ranges that look reasonable (`λ ∈ 1..10`, `k ∈ 0..20`) will routinely draw combinations whose PMF is far below any usable tolerance floor.
3. **The complement direction does not have the same problem.** An answer near 1 keeps a comfortable band (`rel · |answer| ≈ rel` for `answer ≈ 1`) — the hazard is one-sided, toward zero, exactly as it was for EV.

**The same hard rule from B3 carries over unchanged: `|answer| >= 0.01` for every legal draw**, enforced in each template's `constraint`. Concretely this means:

- Tail/rare-event framings (`P(X = k)` for `k` far from the mean) need `constraint` to reject draws where `k` sits too many standard deviations out — not a fixed `k` range, since "too far" depends on `λ`/`n`/`p` jointly.
- Parameter-fit problems (find `p`, `n`, or `λ` given a stated probability) must choose the *stated* probability from a range that keeps it `>= 0.01`, which is the easier direction to guard since it's an input, not a derived tail value.
- The upper end needs no matching rule — no answer in this batch, including quantiles, plausibly exceeds B3's `1e4` ceiling, so that ceiling is inherited without needing to re-derive it (§4).

## 4. Answer shape and tolerance

Three answer shapes appear, not one:

| shape | example items | typical range |
|---|---|---|
| a probability (PMF/CDF/complement value) | most L1/L2 items | `[0.01, 1)` per §3 |
| a fitted parameter (`n`, `p`, `λ`) | negative-binomial #14, discrete-uniform #16, exponential #18 | problem-dependent, not probability-shaped |
| a raw quantile/threshold | Normal #25 | problem-dependent (e.g. a dollar amount or a time), not probability-shaped |

**All 25 problems use `rel: 0.005`.** No `abs`, for the identical reason B3 gave: `emit.ts`'s `tol.abs > |answer| / 10` gate must hold for the *smallest* `|answer|` across all 100 draws, which requires enumerating the draw space to choose correctly, while `rel` scales with the answer by construction. This also keeps `registry.test.ts`'s tolerance-species pin at two shapes (`{rel: 0.005}` and counting's `{abs: 0}`) rather than three.

The floor and ceiling from B3 (§3 there, restated in §3 here) are reused verbatim: `0.01 <= |answer| <= 1e4`. No problem in this batch may use `abs: 0`.

## 5. Verification design

Every problem still supplies an **independent** `exact()` — same rule as B2 and B3: it must not be the same formula the brute/simulate check uses, or the "double-entry" is theater. The `method`-specific check is chosen per family by sample-space shape:

| family | template's closed form | `exact()`'s independent reimplementation | 2nd check (`method`) |
|---|---|---|---|
| binomial | `C(n,k) p^k (1-p)^{n-k}` | same formula, written from scratch in Python (not `scipy.stats.binom`) | `brute-force`: enumerate all `2^n` trial sequences, count matches (`n` capped for enumeration cost) |
| Poisson | `e^{-λ} λ^k / k!` | independent Python formula | `brute-force`: sum the PMF from 0 to a truncation point with provably negligible tail (§3) |
| geometric | `(1-p)^{k-1} p` | independent Python formula | `brute-force`: same truncated-sum approach |
| negative binomial | `C(k-1, r-1) p^r (1-p)^{k-r}` | independent Python formula | `brute-force`: truncated-sum |
| hypergeometric | `C(K,k)C(N-K,n-k)/C(N,n)` | independent Python formula | `brute-force`: `itertools.combinations` over the population |
| uniform (discrete) | `(b-a+1)` range-count over total range | independent Python formula | `brute-force`: direct integer counting |
| uniform (continuous) | `(b-a)` interval-length over total range | independent Python formula | `montecarlo`: draw uniforms, estimate the interval probability |
| exponential | `1 - e^{-λx}` (or its complement) | independent Python formula | `montecarlo`: draw exponentials, estimate the tail probability |
| Normal | `normalCdf`/`normalQuantile` (TS, §2) | `scipy.stats.norm.cdf`/`.ppf` (Python, genuinely independent — different library, different numerical method) | `montecarlo`: draw normals, estimate the probability |

For `montecarlo` problems, `verify.py`'s existing noise-bound check (`3·se <= bound/2`) governs trial-count choice — the same mechanism B1's Bayes solvers already use, not new machinery.

**Truncation for unbounded discrete families** (Poisson, geometric, negative binomial): the enumeration cap is chosen per-instance so the untruncated tail is provably `< 1e-12` — comfortably under both `verify.py`'s `1e-9` bound and the `rel: 0.005` display tolerance. This mirrors B3's payoff-capping discipline (§5 there) applied to a truncation point instead of a payoff magnitude.

## 6. Distinctness at tolerance

The B2/B3 rule is unchanged: **≥ 12 distinct answers over the full legal draw space, counted at grading tolerance**, plus the existing `draw-space.test.ts` floors (≥ 70 texts/100 distinct, max repeat ≤ 4). Two distribution-specific risks to check before authoring prose, both to be enumerated with `draw-space.test.ts` helpers exactly as B3 did (its §6 table), not reasoned about:

- **PMF/CDF values can be flatter than they look over "natural" integer parameter ranges** — e.g. `P(X ≤ k)` for a binomial with `n` fixed and only `p` varying over a coarse grid may cluster tightly if `k` sits near the mode for most of the range. Draw both `n`/`λ`/`p` **and** `k` where the problem allows it, the same lesson B3 generalized in its §6: collapse tracks how many independent dimensions feed the answer, not any one factor's symmetry.
- **Parameter-fit answers (`p`, `n`, `λ`) are exactly as prone to collapse as any other answer** — a "find `p` given `P(X=0) = c`" problem's distinctness depends on how finely `c` is drawn, not on the underlying distribution family.

## 7. Registration deltas

1. **`content/problems/registry.test.ts`** — extend the topic-sum check to `bayes(30) + counting(25) + ev-variance(30) + distributions(25) === PROBLEMS.length` (85 → 110). Add a distributions 10/10/5 difficulty pin and confirm the tolerance-species pin still holds at two shapes (§4).
2. **`verification/solvers/__init__.py`** — aggregate `distributions.SOLVERS` alongside the existing three.
3. **`content/problems/index.ts`** — import and register all 25.
4. **`TOPIC_LABELS`** needs no change — `"probability/distributions": "distributions"` was already seeded in B1 (confirmed present at `content/problems/index.ts:186`, unused until now).
5. **`verification/emit.ts`** — no delta expected. Unlike B3, no answer in this batch goes negative (probabilities, fitted parameters, and quantiles here are all non-negative by construction), so the sign-blind audit issue B3 fixed does not recur. This is confirmed, not assumed, when **sub-batch 4** lands and gates run — sub-batch 1 (binomial + Poisson) contains no family capable of producing a negative value, so it cannot test this claim. The Normal family (§8 #17, #19, #20, #25) is the first place a raw endpoint or threshold can legitimately be negative (e.g. `x < μ` when `x` sits left of the mean); that's where this actually gets watched, not assumed from earlier sub-batches passing.
6. **`content/problems/printed-precision.test.ts`** — add `"probability/distributions"` to the hardcoded `TOPICS` array (line 13). Omitting this does not fail CI; `describe.each(TOPICS)` just never generates a block for the new topic, so its printed-precision chains go unchecked while every other gate reports green.
7. **`content/problems/draw-space.test.ts`** — the ≥12-distinct-answer / ≥70-distinct-text / ≤4-repeat floors (§6) live in a describe block scoped to the hardcoded `const TOPIC = "probability/ev-variance"` (line 22). The file's own top comment notes scope was deliberately left at ev-variance and that widening it is "a decision to take on its own evidence, not a side effect of this file" — so this batch has to make that decision explicitly (widen `TOPIC` to a list, or duplicate the block for `probability/distributions`), not inherit coverage by assumption.
8. **`content/problems/prose-claims.test.ts`** — each of the 25 problems needs its own entry in the hand-authored `CLAIMS` dict (keyed by slug) before its claims are checked at all; an unregistered slug produces zero test cases, not a failure. This belongs in the authoring contract (§9 item 9) as a per-problem deliverable, not just a one-time file edit here.

## 8. Coverage

Each bullet is one problem. Surface contexts vary per problem and are never reused at the same tier.

### L1 — 10 problems (direct PMF/CDF plug-in from stated parameters)
1. binomial — probability of exactly `k` successes in `n` independent trials — *PMF*
2. binomial — probability of at most `k` successes in `n` trials — *CDF*
3. Poisson — probability of exactly `k` arrivals given rate `λ` over a stated interval — *PMF*
4. Poisson — probability of at most `k` arrivals given rate `λ` — *CDF*
5. geometric — probability the first success lands exactly on trial `k` — *PMF*
6. negative binomial — probability the `r`-th success lands exactly on trial `k` — *PMF*
7. hypergeometric — probability of exactly `k` successes drawn without replacement from a finite population — *PMF*
8. discrete uniform — probability a uniformly-drawn integer lands in a stated sub-range — *PMF/CDF*
9. continuous uniform — probability a uniform draw on `[a,b]` lands below a stated threshold — *CDF*
10. exponential — probability a wait time falls under (or exceeds) a stated threshold, given rate `λ` — *CDF*

### L2 — 10 problems (one extra step: complement, rescale, interval, or single-parameter fit)
11. binomial — probability of at least one success in `n` trials — *complement*
12. Poisson — probability of at least one event over a *different* time window than the one the rate was stated for — *rescale + complement*
13. geometric — probability more than `k` trials are needed for the first success — *tail, `(1-p)^k`*
14. negative binomial — find `p` given a stated probability that the `r`-th success lands by trial `k` — *parameter fit* ⚠ open question, see note below
15. hypergeometric — probability of drawing zero successes (all failures) — *complement/boundary case*
16. discrete uniform — find the range size such that a stated sub-range probability holds — *parameter fit*
17. Normal — probability a normal variable falls strictly between two stated raw values — *standardize both endpoints, subtract CDFs*
18. exponential — find the rate `λ` such that a stated tail probability holds — *parameter fit*
19. Normal — probability a normal variable falls below a stated raw value, given `μ, σ` — *standardize + CDF lookup*
20. Normal — probability a normal variable exceeds a stated raw value — *standardize + complement*

**Open question on #14, blocking sub-batch 2:** inverting for `p` from a stated CDF or PMF value is solving a degree-`k` polynomial in `p` for general `r`, with no closed algebraic form. There's no numeric escape hatch on the Python side either — `scipy.stats.nbinom` has no inverse-in-`p`, so `verify.py`'s independent `exact()` (§5) would need something like `brentq`, and nothing resembling a root-finder exists anywhere in this codebase today. Three ways out, to be settled at sub-batch-2 authoring time, not by this spec: pin `k = r` (single term, `p^r = c`, closed form, but removes one degree of freedom from the draw space — check §6's ≥12-distinct-answer floor still clears); let #14 collapse to `r = 1` (closed form via the geometric CDF, but then it duplicates #13's fit instead of testing anything negative-binomial-specific); or add a bisection helper to §2's infra delta and accept numeric inversion on both the TS and Python sides. Not resolved here.

### L3 — 5 problems (two genuinely dependent stages, not one harder formula)
21. binomial — given `P(X=0)` for `n` trials, find `p`, then use it to compute `P(X=1)` — *parameter fit, then PMF*
22. Poisson — given `P(X=0)` over interval `t`, find `λ`, then compute `P(X >= 2)` over a *different* interval — *parameter fit, then rescale + complement*
23. geometric — given no success in the first `j` trials, probability the first success is more than `k` further trials away — *conditional via memorylessness*
24. exponential — given a wait has already exceeded `s`, probability it exceeds `s + t` — *conditional via memorylessness, the continuous analogue of 23; the two must not restate each other's `keyInsight`*
25. Normal — find the raw threshold `x` such that `P(X > x)` equals a stated probability (a quantile via `normalQuantile`), then use that `x` to answer a second stated probability (e.g. the chance of landing within a stated distance of `x`) — *quantile, then range probability*

## 9. Authoring contract

Inherited from B1 Task 10, B2 §8, and B3 §9 verbatim except where marked ▲:

1. `id` = `distributions/<slug>`, `topic: "probability/distributions"`, `version: 1`; params yield ≥ 12 distinct answers **counted at the grading tolerance** (§6); `constraint` guards degenerate draws.
2. `constraint` also guarantees `0.01 <= |answer| <= 1e4` on every legal draw (§3, §4) — same floor/ceiling as B3, now guarding a small-probability collapse instead of a near-zero EV. This floor is about the *answer* specifically; `emit.ts`'s audit (line 46) separately floors **every** `params`/`derived` value at `1e-6` regardless of tolerance or `answerKey`. Don't put a raw PMF term, a truncation-tail mass, or any other sub-1e-6 quantity into `derived` even when it isn't the answer — in particular, §5's `<1e-12` truncation-tail bound must never itself be stored in `derived`; only the enumeration *cap* (an integer, per item 4 below) belongs there.
3. Every intermediate number lives in `derived`; the answer is one `answerKey`; tolerance is `{ rel: 0.005 }` — never `abs` (§4).
4. ▲ **Unbounded discrete families (Poisson, geometric, negative binomial) declare their enumeration cap as a `derived` value**, so both the TS emit-side reasoning and the Python truncated-sum check can be inspected against the same number rather than each hard-coding its own cap.
5. ▲ **Normal-family templates route every printed probability through `normalCdf`/`normalQuantile` (§2), never a hand-rolled approximation** — the whole point of the infra delta is one precise, tested implementation shared by every Normal template.
6. Never write a literal `$` for currency (B3 §9 item 6 — this batch is unlikely to need currency at all, but the rule stands if any problem frames a parameter-fit in dollar terms).
7. Statement in plain prose, numbers via `fmtNum`/`pc` only. Solution 3–6 steps ending in a **Sanity check**. `keyInsight` and `commonTrap` number-free. `firms` and `expectedPaceS` set. `source` records kind honestly, tagged **at authoring time** — closing B3's unresolved `source.kind` review item rather than repeating it.
8. Python counterpart in the same sub-batch: `exact()` is a from-scratch reimplementation (§5), not a call into the same helper the template itself effectively uses; the second check (`brute`/`simulate`) takes the independent path from §5's table.
9. Registered in `index.ts` `PROBLEMS`, in `solvers/distributions.py` `SOLVERS`, **and** in `prose-claims.test.ts`'s `CLAIMS` dict under its slug (§7 item 8) — omitting the last one ships the problem with that gate silently not looking at it.

## 10. Cadence and gates

Four sub-batches, matching B3's cadence, each committed only when `npm run typecheck && npm run test && npm run verify:emit && python3 verification/verify.py` is green:

- **Sub-batch 1 (8)** — carries the §2 `erf.ts` infra delta and its unit tests, the `index.ts`/`__init__.py` registrations, the `registry.test.ts` sum fix, the `printed-precision.test.ts` `TOPICS` addition and the `draw-space.test.ts` scope-widening decision (§7 items 6–7 — both land now, since every later sub-batch depends on these gates actually running against this topic), `CLAIMS` entries for its own 8 problems (§7 item 8, §9 item 9), and binomial (4) + Poisson (4).
- **Sub-batch 2 (7)** — geometric (3) + negative binomial (2) + hypergeometric (2), plus their `CLAIMS` entries. Blocked on resolving #14's open closed-form question (§8) before authoring starts.
- **Sub-batch 3 (6)** — uniform (3) + exponential (3), plus their `CLAIMS` entries.
- **Sub-batch 4 (4)** — Normal (4), plus their `CLAIMS` entries, the distributions 10/10/5 difficulty pin and tolerance-species re-check in `registry.test.ts`, and the §7 item 5 sign-blind-audit confirmation (this is the first sub-batch capable of producing a negative endpoint, so it's the one that actually tests that claim).

Ship gate: identical to B3's — `npm run typecheck && npm run test && npm run e2e && npm run verify:emit && python3 verification/verify.py` all green, merge `--no-ff`, push, confirm CI logs show both `Emitted <n>` and `Verified <n>` (not just a green checkmark), then prod smoke on `quant-prep-gold.vercel.app` (the only public origin — the project alias sits behind Vercel deployment protection).

## 11. Out of scope

- Distribution algebra: convolutions/sums of independent distributions, moment generating functions, order statistics — a plausible future batch, deliberately excluded here (§1).
- Continuous geometric-probability problems (random points, meeting-time, Buffon's needle) — belong to the `geometric` topic, not this one.
- Ad-hoc E[X]/Var(X) derivations for these same families — already covered in `ev-variance`.
- Any change to `fmtNum`, the emit audit's tokenizer, or `verify.py`'s dispatch logic (including the still-unimplemented `symbolic` method, noted but not touched — same as B3 §11).
- Topic `ruin`; Chunks C and D.
