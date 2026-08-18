# Phase 1.5 Chunk B2: Counting Batch — Design

**Date:** 2026-08-18
**Status:** approved, ready for implementation plan
**Parent specs:** `2026-08-15-quant-prep-site-design.md` (§6 content model), `2026-08-16-phase1.5-design.md` (§4 Chunk B)
**Predecessor:** Chunk B1 (`2026-08-16-phase1.5b1-probability-infra.md`), shipped at `b2f76c2` — 30 Bayes problems plus all shared infra.

---

## 1. Scope

25 counting problems as a **content-only batch**. Every piece of engine, parser, drill-UI, emitter and verifier machinery already shipped with B1; this batch adds templates, Python solvers, and four small registration deltas (§6). No new infrastructure.

| property | value |
|---|---|
| topic | `probability/counting` |
| templates | `content/problems/counting/*.ts` (25) |
| solvers | `verification/solvers/counting.py` |
| difficulty mix | 10 × L1 / 10 × L2 / 5 × L3 (parent spec's 40/40/20) |
| answer shape | 15 exact counts / 10 probabilities |

Counting is deliberately first among the remaining five topics: its sample spaces enumerate, so every problem verifies by an exact independent path with **no new verifier machinery**, and combinatorics is the foundation the later `ev-variance` and `distributions` batches lean on.

## 2. Answer shape and tolerance

Counting questions occur in two forms and the batch carries both, because interviews do:

- **Exact counts** ("how many distinct arrangements?") — `accepted: { tolerance: { abs: 0 } }`. In `grade.ts` this yields `bound = Math.max(0, 0) = 0`, i.e. strict integer equality. Nothing in the engine changes to support it.
- **Probabilities** ("what is the probability?") — `accepted: { tolerance: { rel: 0.005 } }`, identical to the Bayes batch.

Tolerance stays explicit per problem, per parent spec §6. The hardest and most interview-realistic shape — an L3 probability whose numerator *and* denominator each require a non-obvious count — is reachable only because both forms coexist.

## 3. Verification design

This is the substantive part of the batch. Monte Carlo cannot verify an exact integer, and the failure mode that would quietly gut the pipeline is a Python solver that re-calls **the same closed form** the TS template used (`math.comb` mirroring a TS `choose`). That is transcription, not double-entry, and it would pass every gate while proving nothing.

Each solver's `brute()` therefore takes an exact path *derivationally independent* of the template's formula:

| family | independent path |
|---|---|
| binomial coefficients | Pascal's recurrence, built bottom-up |
| multiset permutations | enumeration of distinct orderings |
| stars and bars | DP over bins |
| lattice paths | cell-by-cell grid DP |
| derangements | `D(n) = (n−1)(D(n−1) + D(n−2))` |
| inclusion–exclusion | direct enumeration over the universe |
| card/hand problems | enumeration over a reduced parameterized deck (§5) |
| pigeonhole / extremal | independent search over candidate parameters for the threshold, rather than enumerate-and-count |

**Rule of thumb:** enumerate (`itertools`) where the sample space is under ~10⁵ atoms; use DP or a recurrence above that. The 10⁵ ceiling is set by throughput, not correctness — `verify.py` sets `BF_INSTANCES = 25`, so `brute()` runs 25 times per problem and a 10⁶-atom enumeration would push CI well past its current ~45s.

`exact()` additionally re-derives **every** key in the template's `derived` map with plain arithmetic, exactly as in the Bayes solvers.

### Dispatch

All 25 problems declare `verify: { method: "brute-force" }`. Both enumeration and DP register under this method; the dispatch at `verify.py:50-53` calls `solver["brute"](params)` and asserts `abs(bf - answer) > 1e-9`, which for integer answers is strictly an off-by-one catch. **The unimplemented `symbolic` branch stays untouched** — no problem in this batch needs it.

## 4. Numeric window

Every emitted value — answer and intermediate alike — must land inside **`[1e-6, 1e9)`**. Two of the three bounds are machine-enforced; the operative upper bound is not, which is why it is stated here.

### Upper bound: 1e9 (operative), 1e15 (hard)

The hard limit is 1e15: `emit.ts:46` rejects any `Math.abs(v) >= 1e15` because `fmtNum`'s decimal-safe window ends there, and JS integers stop being exact past `2^53 ≈ 9.0e15` anyway.

But **exactness is lost long before that, silently.** `verify.py:32` and `:35` compare relatively:

```python
abs(py_val - ts_val) > REL_EXACT * max(1.0, abs(ts_val))   # REL_EXACT = 1e-9
```

An off-by-one is caught only while `1 > 1e-9 · |v|`. At `|v| = 1e9` the bound is exactly `1.0`, so a difference of one passes; above that, `exact()` degrades into a nine-significant-figure check. The answer is only partly covered: the brute-force branch (`verify.py:52`) compares unscaled and *does* catch off-by-one at any magnitude — but it runs on `instances[:BF_INSTANCES]`, the first 25 of the 100 emitted. **For any value at or above 1e9, instances 26–100 lose exact verification while the gate stays green.**

A silent loss of verification is worse than a gate failure, so the batch ceiling is **1e9**, applied to answers and intermediates alike. The cost is near zero — `C(28,5) = 98,280`, `26³·10³ = 17,576,000`, `C(20,10) = 184,756` and `D(12) = 176,214,841` all fit comfortably. Only `D(13) ≈ 2.29e9` and unrestricted surjection counts exceed it; items 21–22 are sized below it.

### Lower bound: 1e-6 (machine-enforced)

`emit.ts:46` equally rejects any nonzero `Math.abs(v) < 1e-6`, and counting probabilities run into this from underneath. Item 10 ("probability of one specific arrangement") over 10 distinct objects is `1/10! ≈ 2.8e-7` and **trips the gate**; over 9 it is `1/9! ≈ 2.8e-6` and passes. So specific-arrangement spaces are capped at 9 distinct objects. The reduced deck of §5 clears this comfortably (`1/98,280 ≈ 1.0e-5`).

Consequence: no `52!`, no `20!`, no unrestricted large-alphabet product-rule blowups, and no vanishing single-arrangement probabilities.

## 5. Card and hand problems

Poker-style problems enumerate `C(52,5) = 2,598,960` hands — over the §3 throughput ceiling at 25 instances per problem. These problems are therefore parameterized on a **reduced deck** (`r` ranks × `s` suits, with `r·s ≤ 28`), which keeps the sample space under 10⁵ — `C(28,5) = 98,280` fits, whereas a 30-card deck at `C(30,5) = 142,506` would not —, keeps the answer under the §4 ceiling, and has the pedagogical benefit of making the parameters genuinely variable rather than pinned to one real deck.

## 6. Registration deltas

Four small changes; this is the first non-Bayes topic, so a few B1 assumptions come due.

1. **`content/problems/registry.test.ts:24` breaks by construction.** The assertion `problemsFor("probability/bayes").length === PROBLEMS.length` is false the moment a second topic lands — the outcome anticipated in the B1 parked-polish list. Replace with: bayes = 30, counting = 25, and the two summing to `PROBLEMS.length`. Add a counting difficulty-distribution pin (10/10/5) mirroring the Bayes 12/12/6 pin — this pin alone lands with sub-batch 3 (§9), since it cannot pass until all 25 exist; the other deltas land with sub-batch 1.
2. **`verification/solvers/__init__.py`** — aggregate `counting.SOLVERS` alongside `_bayes`.
3. **`content/problems/index.ts`** — import and register all 25.
4. **One `TOPIC_LABELS` entry.** The drill page derives its topic chips from `PROBLEMS` (`app/drills/probability/page.tsx:8`) and falls back to the raw topic string, so the chip appears unaided; the label only keeps it reading `counting` rather than `probability/counting`.

**Stats requires no change** — the topic filter shipped in B1 Task 7 matches on the `probability` prefix, so `probability/counting` is already covered.

## 7. Coverage

Each bullet is one problem. Surface contexts vary and are never reused at the same tier.

### L1 — 10 problems (6 counts, 4 probabilities)
1. distinct permutations of distinct objects — *count*
2. combinations / committee selection — *count*
3. multiset permutations (repeated letters) — *count*
4. product rule (plates, passwords, menu paths) — *count*
5. selection with a forced member — *count*
6. basic stars and bars (identical items, distinct bins) — *count*
7. circular seating: probability two named people sit adjacent — *probability*
8. equally-likely-count probability (draw k, all one type) — *probability*
9. at-least-one via the complement — *probability*
10. probability of one specific arrangement — *probability*

### L2 — 10 problems (5 counts, 5 probabilities)
11. inclusion–exclusion, two sets — *count*
12. inclusion–exclusion, three sets — *count*
13. adjacency forbidden (gap method) — *count*
14. stars and bars with lower bounds — *count*
15. at-least-k committee — *count*
16. adjacency required (block method), asked as a probability — *probability*
17. hand probability: exactly one pair, reduced deck — *probability*
18. birthday-style collision — *probability*
19. lattice paths: probability a random monotone path passes a given corner — *probability*
20. small derangement (nobody in their own seat) — *probability*

### L3 — 5 problems (4 counts, 1 probability)
21. general derangements — *count*
22. surjections / no-empty-bin distribution via inclusion–exclusion — *count*
23. lattice paths with a forbidden node — *count*
24. pigeonhole / extremal counting — *count*
25. comparative hand probability (two-pair vs full-house, reduced deck) — *probability*

## 8. Authoring contract

Unchanged from B1 Task 10, restated so authoring is one pass:

1. `id` = `counting/<slug>`, `topic: "probability/counting"`, `version: 1`; params yield ≥ 12 distinct instances; `constraint` guards degenerate draws (empty selections, zero denominators, `k > n`).
2. Every intermediate number lives in `derived`; the answer is one `answerKey`; tolerance explicit per §2.
3. Statement in plain prose, numbers via `fmtNum`/`pc` only. Solution 3–6 steps ending in a **Sanity check**. `keyInsight` and `commonTrap` number-free. `firms` and `expectedPaceS` set. `source` records kind plus inspiration honestly (new prose, new parameters, own solution).
4. Python counterpart ships in the same sub-batch: `exact()` re-deriving every derived key, `brute()` taking the independent path of §3.
5. Registered in `index.ts` `PROBLEMS` and in `solvers/counting.py` `SOLVERS`.

## 9. Cadence and gates

Three sub-batches mirroring B1, each committed only when `npm run test && npm run verify:emit && python3 verification/verify.py` is green:

- **Sub-batch 1 (9)** — includes all four §6 registration deltas, since this is the commit that breaks `registry.test.ts`.
- **Sub-batch 2 (8)**
- **Sub-batch 3 (8)** — plus the counting distribution pin.

Ship gate: `npm run typecheck && npm run test && npm run e2e && npm run verify:emit && python3 verification/verify.py` all green, then push (Vercel deploys `main`). Prod smoke on **`quant-prep-gold.vercel.app`** — the only public origin; the `quant-prep-tonyyu2170s-projects.vercel.app` project alias sits behind Vercel deployment protection and proves nothing about public visitors.

## 10. Out of scope

- Any new verifier method (`symbolic` stays unimplemented).
- Changes to `fmtNum`, including thousands separators for large counts — it is the contract the emitter's numbers-in-text audit compares against, and changing it would ripple through every shipped Bayes walkthrough.
- The sign-blind number-audit weakness, which matters for negative EVs and is a prerequisite for the `ev-variance` batch, not this one.
- Topics `ev-variance`, `distributions`, `ruin`, `geometric`; Chunks C and D.
