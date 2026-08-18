# Phase 1.5 Chunk B3: EV & Variance Batch — Design

**Date:** 2026-08-18
**Status:** draft, pending approval
**Parent specs:** `2026-08-15-quant-prep-site-design.md` (§6 content model), `2026-08-16-phase1.5-design.md` (§4 Chunk B)
**Predecessors:** B1 (`2026-08-16-phase1.5b1-probability-infra.md`) shipped at `b2f76c2` — 30 Bayes problems plus all shared infra. B2 (`2026-08-18-chunk-b2-counting-design.md`) shipped at `c41a90b` — 25 counting problems, content-only.

---

## 1. Scope

30 expected-value and variance problems. Unlike B2 this is **not** a pure content batch: it carries exactly one infrastructure delta, a three-line fix to the emitter's numbers-in-text audit (§2), because this is the first batch whose values go negative and the audit is sign-blind. Everything else — engine, parser, drill UI, verifier — is unchanged.

| property | value |
|---|---|
| topic | `probability/ev-variance` |
| templates | `content/problems/ev-variance/*.ts` (30) |
| solvers | `verification/solvers/ev_variance.py` |
| difficulty mix | 12 × L1 / 12 × L2 / 6 × L3 (parent spec's 40/40/20) |
| answer shape | 22 expectations / 8 variances-or-sd |
| tolerance | `rel: 0.005` on all 30 (§4) |
| verify method | `brute-force` on all 30 (§5) |

The batch is discrete-only. Continuous expectations (the expected maximum of two uniforms, expected distance between random points) belong to `distributions` and `geometric`; keeping them out means every sample space in this batch is finite or closes under a recurrence, which is what makes §5's exact verification possible.

## 2. The emitter delta — a sign-blind audit

`emit.ts:25` tokenizes prose with `/\d+(?:\.\d+)?/g`. The regex has no sign, so a minus sign is never part of a token, while the allowed-set is built from `fmtNum(v)` and `fmtNum(-0.95)` is `"-0.95"`. Take a bet paying 4 with probability 0.45 and losing 5 otherwise, whose walkthrough closes on

```
$0.45\times4 - 0.55\times5 = -0.95$
```

The audit extracts the token `"0.95"`, the allowed set holds `"-0.95"`, and it reports *"number 0.95 not traceable to params/derived/constants"*. Run against the current builder that example yields exactly one untraceable token, `0.95`; against the builder below, none. The 55 shipped problems have no negative value anywhere, which is why the flaw has never fired.

**The failure is seed-dependent, which makes it worse than a hard break.** A negative value is untraceable only when its magnitude appears nowhere else among the params and derived values. Draw a bet losing 0.4 in a problem that already carries a 0.4 somewhere and the audit passes; draw one losing 0.95 and it fails. An author would see a template pass on the seeds they tried and fail on some subset of the 100 emitted — an intermittent gate failure attributable to nothing in the template.

The fix is in the allowed-set builder, not the tokenizer:

```ts
for (const v of [...Object.values(p), ...Object.values(d), ...(t.constants ?? [])]) {
  const a = Math.abs(v);
  // The audit's tokenizer is sign-blind — a minus sign is never part of a token — so a
  // negative value must be traceable by its magnitude. Sign errors in prose are caught by
  // the Python double-entry on derived values, not here; this audit only proves that every
  // number in the text came from the params.
  allowed.add(fmtNum(v));
  allowed.add(fmtNum(a));
  if (a > 0 && a < 1) allowed.add(fmtNum(Math.round(100 * a * 1e8) / 1e8)); // percent renderings
}
```

Three properties make this the right shape:

- **It is a no-op for the shipped corpus.** For `v >= 0`, `fmtNum(a) === fmtNum(v)` and the percent branch is unchanged. Verified, not assumed: applying the delta and re-emitting produces a `problems` payload identical to the baseline across all 55 problems × 100 instances, gates green. The delta cannot regress Bayes or counting.
- **It loses only what was never checked.** The audit's job is traceability — proving no number was hand-typed into prose. It has never validated signs, because negatives could not previously appear. Sign correctness lives where it belongs: `verify.py` re-derives every `derived` key in Python and compares signed values.
- **Widening the tokenizer instead would break.** Making it `/-?\d+(?:\.\d+)?/g` turns `$12-3.5$` into the token `"-3.5"`, which no allowed set contains — subtraction written without spaces becomes a false failure. The tokenizer stays as it is.

The regression guard is the gate itself: sub-batch 1 ships a negative-EV problem (§8 item 2) in the same commit as the delta, so the emit run proves the fix in the commit that introduces it. No test harness is built around a script.

## 3. Zero is the hazard of this batch

B2's signature failure was a param space with too few distinct answers. B3's is **an expectation that lands on or near zero**, and it is worse because three independent mechanisms break at once:

1. **Grading collapses.** `grade.ts` computes `bound = Math.max(tol.abs ?? 0, (tol.rel ?? 0) * Math.abs(expected))`. With `rel` and `expected === 0` the bound is `0` — strict float equality on a computed decimal. Nobody types the right answer.
2. **The `abs` escape hatch is closed.** `emit.ts:43` fails any problem where `tol.abs > Math.abs(answer) / 10`. At `answer === 0` every positive `abs` fails, and `abs: 0` is strict equality again.
3. **A near-zero answer starves the tolerance.** The band is `0.005 · |answer|`, so it shrinks with the answer. At `|EV| = 0.001` the band is `5e-6` — five significant figures, on a mental-math drill.

Hence two hard rules, enforced in each template's `constraint` so no draw can violate them:

- **`|answer| >= 0.01` for every legal draw**, with 0.05 preferred.
- **A fair game is never asked as "what is the EV?"** The interview question behind a fair game is a *price*: "what stake makes this fair?", "what is this re-roll worth?", "what premium breaks even?" Those answers are the fair value itself — bounded away from zero and far more interview-realistic than the number `0`. Items 3, 23, 27 and 29 use this framing deliberately.

This is not a reason to avoid negative expectations — negative EV is the honest answer to most casino-shaped questions and the batch leans into it. The rule is about *magnitude*, not sign.

## 4. Answer shape and tolerance

**All 30 problems use `rel: 0.005`.** No `abs` tolerances, for a reason worth writing down: the gate `tol.abs > Math.abs(answer) / 10` runs inside the per-seed loop, so an `abs` tolerance must satisfy the **smallest** `|answer|` across all 100 draws, not a typical one. Choosing it correctly requires enumerating the draw space, and an unlucky small draw fails the gate long after the author has moved on. `rel` scales with the answer by construction and has none of that coupling.

The cost of `rel: 0.005` is that it demands three significant figures, which for an EV of `-1/6` means typing `-0.167`, not `-0.17`. The mitigation is a content rule, not an engine change: **design answers as rationals with small denominators**, because `parseAnswerExpr` accepts `-1/6` and evaluates it exactly (it normalizes Unicode minus signs and handles unary minus). The exact route is always available to the solver who worked in fractions — which is how the answer should be reached anyway.

Keeping the corpus at two tolerance species (`{rel: 0.005}` and counting's `{abs: 0}`) also leaves `registry.test.ts`'s `exact.length === 15` pin untouched. **No problem in this batch may use `abs: 0`**: an expectation is a decimal the solver rounds, and strict equality would be a grading bug dressed as rigor.

## 5. Verification design

**Every problem declares `verify: { method: "brute-force" }`. Monte Carlo is not used in this batch.** Two reasons:

- *Precision.* An expectation is a sum over the sample space, so enumeration gives the answer **exactly** — there is no noise to bound. Monte Carlo would only add error where none exists.
- *Cost.* `verify.py` requires `3·se <= bound/2`, i.e. `se <= rel·|μ|/6`. For a mean that is `T >= 36·CV²/rel² = 1.44e6 · CV²` trials; for a variance estimate it is `T >= 72/rel² ≈ 2.9e6` even in the Gaussian case, worse under heavy tails. Against a ~45s CI budget already carrying one 20-million-trial Bayes solver, that is a large bill for a worse answer.

### Independence

The B2 rule carries over verbatim and matters more here, because EV closed forms are one-liners and re-typing `n*p` in Python is pure transcription. `exact()` mirrors the template's derivation — that mirroring is the double-entry check. `brute()` must reach the answer by a **derivationally independent** path:

| family | template's closed form | `brute()`'s independent path |
|---|---|---|
| payoff table on one variable | `Σ p·x` from the table | enumerate the outcome space, accumulate with `Fraction` |
| linearity of expectation | `E[X] + E[Y]` | enumerate the joint grid and take one expectation over sums |
| indicator counts | `n · P(one match)` | enumerate the full sample space (permutations, draws) |
| binomial mean and variance | `np`, `npq` | build the pmf by convolution DP, then `Σ p·k` and `Σ p·k² − μ²` |
| affine scaling | `a²·Var(X)` | transform every outcome, then recompute the variance from scratch |
| variance of a sum | `Var(X) + Var(Y)` | enumerate the joint, compute `E[S²] − E[S]²` |
| total expectation / mixture | `Σ P(branch)·E[branch]` | flatten the two-stage tree to one outcome list, take a single expectation |
| hypergeometric mean and variance | `k·K/N`, with the FPC factor | enumerate `itertools.combinations` over the population |
| geometric waiting time | `1/p` | solve the first-step linear equation, or sum the series with a bounded tail |
| pattern waiting (HH, HT) | the per-pattern closed form | first-step analysis on the state graph as a small linear system |
| optimal stopping | backward induction, written out | enumerate every policy over the outcome tree and take the maximum |
| Wald / random sum | `E[N]·E[X]` | enumerate the joint over `(N, summands)` across the truncated support |
| truncated doubling game | `n/2` | walk the round-by-round payoff ladder |
| dependent indicators / matching | `n·p + n(n−1)·cov` | enumerate all permutations (`n <= 8`) |

The two functions do not share an arithmetic convention, and must not. **`exact()` stays in plain floats** — it mirrors the template, and mirroring means mirroring its float arithmetic; a `Fraction`-based `exact()` would quietly absorb a template that loses precision, which is the one thing the double-entry exists to catch. **`brute()` works in `fractions.Fraction`** wherever the sample space is rational, and **returns `float(...)` explicitly** — `abs(Fraction - float)` demotes silently, and the cast is what tells the reader the comparison is a float one. Enumeration stays under ~10⁵ atoms per B2's throughput rule (`BF_INSTANCES = 25`); above that, use the DP or the recurrence.

### Why the brute branch caps this batch's magnitudes

`verify.py:52` compares **unscaled**: `abs(bf - answer) > 1e-9`. For B2 that was free — counting answers are integers, exact in float. B3's answers are not. The TS template accumulates float rounding of roughly `|answer| · 1e-15` over a handful of operations, and `brute()`, being exact, does not. So the gap grows with the answer:

| `|answer|` | TS rounding vs the 1e-9 bound |
|---|---|
| 1e4 | ~1e-11 — two orders of margin |
| 1e6 | ~1e-9 — the gate becomes a coin flip |
| 1e7 | ~1e-8 — fails on correct problems |

**Batch ceiling: `|answer| <= 1e4`.** Since variance scales as the square of the payoff, that means **payoff magnitudes at or under 100** — comfortably interview-shaped, and it keeps the sd under 100 too. Derived intermediates inherit B2's 1e9 ceiling and the machine-enforced `[1e-6, 1e15)` window from `emit.ts:46`.

The ceiling has a second use: `e2e/test-run.spec.ts:37` submits `99999` to a randomly drawn probability problem and asserts a wrong verdict. Any B3 answer within `0.005·|answer|` of 99999 would flake that test; the 1e4 ceiling makes it unreachable by construction.

## 6. Distinctness at tolerance — harder here than in B2

B2's lesson stands and tightens: **a param space must yield ≥ 12 distinct answers, counted at the grading tolerance.** With `rel: 0.005` the band scales with the answer, so large answers collapse easily — a variance of 400 carries a band of 2.0, and draws producing 400 and 401 are the same answer as far as grading is concerned.

Three candidates in §8 are single-dimensional by nature and **must be enumerated before any prose is written**. The draw spaces below were enumerated while writing this spec; the counts are measured, not estimated:

| item | the collapse, measured | remedy, measured |
|---|---|---|
| 11 — affine scaling | `a²·Var(die)` with only `a` drawn over 2..10: **9 answers** | draw the underlying variable too (die faces `n`): **77** |
| 26 — pattern waiting | a fair coin gives **2 answers** (4 and 6). Drawing the pattern *and* a bias `p = k/12` over `k ∈ 3..9` still gives only **11** — below the floor | needs a third dimension or a materially wider bias set; the obvious two-dimensional fix is not enough |
| 29 — truncated doubling | `n/2` over `n ∈ 4..15`: **exactly 12**, zero margin | add a stake dimension: **47** |

**Two candidates that look at risk and are not.** `two-outcome-variance` and `binomial-variance` both carry a symmetric factor — `p(1−p)` takes only 5 distinct values over `p = k/10` and only 3 over a die threshold — and the tempting conclusion is that half the draws collapse. They do not: `p(1−p)(w+l)²` with `w` and `l` drawn independently gives **84 distinct answers at the band**, and `n·p·(1−p)` over `n ∈ 10..30` gives **82**. The lesson generalises and is the one to carry into later batches: **collapse is driven by how many dimensions enter the answer, not by symmetry within one factor.** A symmetric factor halves that factor's range; a second independent factor multiplying it restores far more variety than the symmetry removed. Enumerate rather than reason about it — the reasoning misleads in both directions.

The check is cheap: enumerate the legal draw space, map to answers, and count how many survive merging at `0.005·|answer|`.

## 7. Registration deltas

1. **`content/problems/registry.test.ts` breaks by construction again.** Line 27's `expect(bayes + counting).toBe(PROBLEMS.length)` is false the moment a third topic lands. Replace with bayes = 30, counting = 25, ev-variance = 30, and all three summing to `PROBLEMS.length` — 55 today, 85 when the batch closes. Add an ev-variance 12/12/6 distribution pin and a tolerance-species pin (all 30 at `rel: 0.005`); both land with sub-batch 4, since neither can pass until all 30 exist. The sum fix lands with sub-batch 1.
2. **`verification/solvers/__init__.py`** — aggregate `ev_variance.SOLVERS` alongside `_bayes` and `_counting`.
3. **`content/problems/index.ts`** — import and register all 30.
4. **`verification/emit.ts`** — the §2 delta.

**`TOPIC_LABELS` needs no change** — `"probability/ev-variance": "ev & variance"` was already seeded in B1. **Stats needs no change** — the filter matches the `probability` prefix. The drill page derives its chips from `PROBLEMS`, so the new chip appears unaided.

## 8. Coverage

Each bullet is one problem. Surface contexts vary and are never reused at the same tier.

### L1 — 12 problems (9 expectations, 3 variance/sd)
1. EV of a payoff table on one die — *EV*
2. EV of a two-outcome bet, negative to the player — *EV* — **ships in sub-batch 1; this is the problem that exercises the §2 delta**
3. fair ticket price for a raffle prize — *EV as an indifference price*
4. EV of a sum of two independent draws (linearity) — *EV*
5. EV of a draw from labeled tickets with unequal counts — *EV*
6. EV of profit net of a per-play cost — *EV*
7. expected number of successes in n trials (binomial mean) — *EV*
8. expected count via indicators (matches) — *EV*
9. variance of a two-outcome bet — *variance*
10. variance from a spinner's pmf table — *variance*
11. sd under affine scaling of a payoff — *sd*
12. EV of a three-outcome bet with a push (refund) branch — *EV*

### L2 — 12 problems (9 expectations, 3 variance/sd)
13. variance of a sum of independent bets (additivity) — *variance*
14. law of total expectation: choose an urn, then draw — *EV*
15. EV of the maximum of two dice — *EV*
16. EV with one optional re-roll (stop-or-re-roll threshold) — *EV*
17. expected waiting time to the first success (geometric) — *EV*
18. EV of a draw without replacement (hypergeometric mean) — *EV*
19. expected number of distinct types collected in k draws (dependent indicators) — *EV*
20. variance of a binomial count — *variance*
21. two games with equal EV: which has the larger sd, and by how much — *sd*
22. EV of a payoff capped at a maximum — *EV*
23. break-even premium on an insurance-style contract — *EV as a fair price*
24. conditional expectation given an event (the roll is at least k) — *EV*

### L3 — 6 problems (4 expectations, 2 variance)
25. covariance and the variance of a sum of dependent indicators (the matching problem) — *variance*
26. first-step analysis: expected flips until a two-flip pattern, HH against HT — *EV*
27. two-stage optimal stopping: the value of a game with up to two re-rolls — *EV*
    - **A deliberate escalation of item 16, not a repeat.** Item 16's lesson is comparing one draw against the pool average; item 27's is backward induction — the second stage's value sets the first stage's threshold. The `keyInsight` must say that and must not restate 16's.
28. Wald / random sum: expected total when the number of summands is itself random — *EV*
29. truncated doubling game (St. Petersburg capped at n rounds): its EV and its fair price — *EV*
30. variance of sampling without replacement, and the finite-population correction — *variance*

## 9. Authoring contract

Inherited from B1 Task 10 and B2 §8, with four B3-specific additions (marked ▲):

1. `id` = `ev-variance/<slug>`, `topic: "probability/ev-variance"`, `version: 1`; params yield ≥ 12 distinct answers **counted at the grading tolerance** (§6); `constraint` guards degenerate draws.
2. ▲ `constraint` also guarantees `|answer| >= 0.01` on every legal draw, and `|answer| <= 1e4` (§3, §5).
3. Every intermediate number lives in `derived`; the answer is one `answerKey`; tolerance is `{ rel: 0.005 }` — never `abs` (§4).
4. ▲ **Variance and sd templates declare `constants: [2]`** (often `[1, 2]`). `E[X^2] - (E[X])^2` and `\sigma^2` put a bare `2` in the text; without the declaration every such template fails the audit on its first emit.
5. ▲ Prefer answers that are rationals with small denominators, so `-1/6` is an exact typing route under a three-significant-figure band (§4).
6. ▲ **Never write a literal `$` for currency.** `auditText` treats `$` as a math delimiter. Two currency signs in one sentence give an even count, so the parity check passes, and the text between them is handed to KaTeX — which accepts it. Verified: `you win $5 dollars; otherwise you lose $3 dollars.` renders `5 dollars; otherwise you lose ` as italic math in the drill and **passes every gate**. This is the one content error in the batch that no gate catches; write amounts unitless or say "dollars" in words.
7. Statement in plain prose, numbers via `fmtNum`/`pc` only. Solution 3–6 steps ending in a **Sanity check**. `keyInsight` and `commonTrap` number-free. `firms` and `expectedPaceS` set. `source` records kind plus inspiration honestly.
8. ▲ Python counterpart in the same sub-batch: `exact()` re-derives every derived key with plain float arithmetic (mirroring is the point); `brute()` takes §5's independent path, works in `Fraction` where the space is rational, and returns `float(...)` explicitly.
9. Registered in `index.ts` `PROBLEMS` and in `solvers/ev_variance.py` `SOLVERS`.

## 10. Cadence and gates

Four sub-batches, each committed only when `npm run test && npm run verify:emit && python3 verification/verify.py` is green:

- **Sub-batch 1 (8)** — carries the §2 emitter delta, the `index.ts` and `__init__.py` registrations, the `registry.test.ts` sum fix, and item 2 (negative EV) so the delta is proven by the gate that commit runs.
- **Sub-batch 2 (8)**
- **Sub-batch 3 (7)**
- **Sub-batch 4 (7)** — plus the ev-variance distribution and tolerance-species pins.

Ship gate: `npm run typecheck && npm run test && npm run e2e && npm run verify:emit && python3 verification/verify.py` all green, then push (Vercel deploys `main`). Prod smoke on **`quant-prep-gold.vercel.app`** — the only public origin; the project alias sits behind Vercel deployment protection and proves nothing about public visitors. Smoke items include **a negative-EV problem graded correctly from a typed minus sign**, which is the one path no local gate covers end to end.

## 11. Out of scope

- Continuous expectations — they belong to `distributions` and `geometric` (§1).
- Monte Carlo verification and the unimplemented `symbolic` method (§5).
- Any change to `fmtNum`, or to the audit's tokenizer (§2).
- Utility, risk aversion, Kelly sizing: this batch computes EV and variance, it does not price preferences.
- Topics `distributions`, `ruin`, `geometric`; Chunks C and D.
