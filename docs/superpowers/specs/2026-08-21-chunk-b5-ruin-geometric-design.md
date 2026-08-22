# Phase 1.5 Chunk B5: Ruin & Geometric Batch — Design

**Date:** 2026-08-21
**Status:** Approved by user (brainstorm decisions §1–§4 structure/verification/cadence/discipline settled individually; full spec reviewed and approved 2026-08-21)
**Parent specs:** `2026-08-15-quant-prep-site-design.md` (§6 content model), `2026-08-16-phase1.5-design.md` (§4 Chunk B)
**Predecessors:** B1 shipped at `b2f76c2` (30 Bayes + shared infra). B2 shipped at `c41a90b` (25 counting, content-only). B3 shipped at `dbda956` (30 EV/variance + four committed quality gates). B4 shipped at `3317a9d` (25 named-distribution problems + `erf`/Normal infra). This chunk is the **final content batch of Chunk B** — after it ships, the bank holds the full 150 problems the Phase 1.5 spec targets, and Chunk C (leaderboards) starts.

---

## 1. Scope

40 problems across the two remaining topics, completing the bank:

| topic | count | difficulty mix | templates | solvers |
|---|---|---|---|---|
| `probability/ruin` | 20 | 8 × L1 / 8 × L2 / 4 × L3 | `content/problems/ruin/*.ts` | `verification/solvers/ruin.py` |
| `probability/geometric` | 20 | 8 × L1 / 8 × L2 / 4 × L3 | `content/problems/geometric/*.ts` | `verification/solvers/geometric.py` |

Both topics are explicitly distinct from their neighbors:

- **`ruin` is not `ev-variance`** — expected values/variances of random sums and bets stay there. Ruin is about *absorbing-barrier processes*: the probability of reaching one barrier before another, and the expected time to absorption, for random walks and repeated even-money games.
- **`ruin` is not `distributions`** — the geometric *distribution* shipped in B4 as a named PMF. Here "geometric" means **continuous geometric probability**: uniform sample spaces (segments, rectangles, disks, circles, needles, sticks) where the answer is a ratio of length or area.
- **`geometric` is not `distributions`** — no named-distribution machinery appears; every sample space is uniform and every answer is an area/length ratio (possibly involving π), not a PMF/CDF evaluation.

Surface contexts never cross topics: ruin owns casino/trading/walk/insurance framings; geometric owns darts/meetings/sticks/needles/dartboard framings. A "meeting problem" is a geometric-topic item (uniform arrival times), never a ruin item.

Like B2, this is planned as a **content-only batch: zero engine deltas** (§2 makes the argument; the assumption is re-confirmed per-formula at planning time, not silently inherited).

## 2. No infra delta — and why that claim needs an argument

B1 carried the parser and registry; B3 carried the tolerance gates; B4 carried `erf`. B5 carries nothing, and that is a claim to defend, not a default:

- **Ruin needs only rational arithmetic, real powers, and log inversions.** The absorption formulas involve `(q/p)^n` and `ln` — plain `Math.pow`/`Math.log`, double precision, no special functions. Parameter fits invert *closed forms only* (§3 hazard 4): linear (fair capital), logarithmic (unfair capital), quadratic (fair goal from duration) — all plain algebra.
- **Geometric answers are ratios of lengths/areas; π is the only constant.** `Math.PI` and Python `math.pi` are both correctly-rounded doubles — bit-identical — so the `verify.py` mandatory `exact()` cross-check at `1e-9` relative tolerance passes trivially wherever π appears (Buffon, disks, quarter-circles).
- **No new answer shapes.** Probabilities, positive fitted parameters, and expected durations — all already graded by `grade.ts` with `{rel}` tolerance. No negative answers anywhere (§7 item 5), no quantiles (B4's `normalQuantile` covered the only inverse-CDF need in the bank).
- **`verify.py`'s dispatch already covers every method this batch uses** — `brute-force` and `montecarlo` both exist and are exercised by B1/B4 solvers today. The still-unimplemented `symbolic` method stays parked (B4 §11), because every problem here has a from-scratch closed form or an enumerable/simulable check on at least one side.

**The standing rule that makes "no infra" safe:** no problem may require a numerical root-finder (B4's negative-binomial #14 lesson, applied at design time instead of mid-batch). Any inventory item whose fit would need one gets re-posed (§8 marks the fair-only choices explicitly) or dropped. If planning still surfaces a gap, it is resolved there — this spec does not grow speculative infra.

## 3. Hazards of this batch

B3's hazard was EV near zero; B4's was PMF/CDF near zero. This batch has B4's hazard **plus two of its own**:

1. **Small probabilities recur, by the same mechanics.** A thin meeting window (`w ≪ T`) gives `P ≈ 2w/T`; lopsided ruin barriers with adverse drift give `(p/q)^a`-shaped smallness. The B3/B4 hard rule carries unchanged: **`|answer| ≥ 0.01` on every legal draw**, enforced in each template's `constraint` — which for this batch means guarding *ratios* (`w/T`, `d/L`, `q/p`), not just raw parameters, since smallness comes from combinations.
2. **Answers at exactly 0 or 1 are natural here, and banned.** Fair walks hit every level with probability 1, so "ever-hit" questions in fair games have answer exactly 1; degenerate windows give exactly 0. Certainty/impossibility answers are pedagogically flat and stress the distinctness floor. **New rule: every probability-shaped answer is constrained into `[0.01, 0.99]`** — the upper cap is new relative to B4 (whose answers were naturally `< 1`), and exists because this batch's draw spaces *can* produce 0.995+. Duration/parameter-shaped answers are exempt from the 0.99 cap but inherit the `1e4` ceiling.
3. **Cancellation in the unfair expected-duration formula.** `E[T] = [i − N·Π]/(q−p)` with `Π = (1−(q/p)^i)/(1−(q/p)^N)` suffers catastrophic cancellation as `p → q` (numerator terms nearly cancel, `q−p → 0`). The template's `constraint` keeps `|p−q| ≥ 0.02`, and §5's independent second check genuinely polices the result (it is not the same formula).
4. **Fixed-answer gravity.** The classic puzzles exert pull toward constant answers: broken stick → 1/4, inscribed circle → π/4, symmetric meeting at half-window → 3/4. Per the approved decision, **every problem is parameterized so its answer varies over the legal draw space** — the ≥12-distinct-answers floor (§6) is designed-in, not retrofitted. Where a classic is too valuable to skip (conditional broken-stick triangle), it enters in a parameterized conditional form (§8 #30).

## 4. Answer shape and tolerance

| shape | example items | legal range |
|---|---|---|
| a probability (two-barrier absorption, one-barrier touch, area/length ratio, spacing/meeting prob) | most items | `[0.01, 0.99]` (§3 hazards 1–2) |
| a fitted parameter (capital `i`, goal `N`, window `w`, needle length `L`, spacing `d`, radius `r`) | #10, #11, #13, #29, #35, #37, #38, #40 | problem-dependent, positive |
| an expected duration / remaining time | #5, #6, #16, #17, #20 | `(0, 1e4]` |

**All 40 problems use `rel: 0.005`. No `abs`** — same reasoning as B3/B4: `emit.ts`'s `tol.abs > |answer| / 10` gate must hold for the smallest `|answer|` across all 100 draws, which requires enumerating the draw space to choose correctly, while `rel` scales by construction. The registry tolerance-species pin stays at two shapes (`{rel: 0.005}`, counting's `{abs: 0}`).

Floor and ceiling inherited verbatim from B3/B4: `0.01 ≤ |answer| ≤ 1e4`. No problem uses `abs: 0`.

## 5. Verification design

Every problem supplies an **independent** `exact()` — a from-scratch Python reimplementation of its closed form, never the same helper the template effectively uses, never a call into `scipy`/`numpy` where a formula exists. The second check (`method`) is chosen per family:

| family | template's closed form | `exact()` independent reimpl | 2nd check (`method`) |
|---|---|---|---|
| ruin — fair two-barrier (prob) | `i/N` | from-scratch Python | `brute-force`: independent `numpy` solve of the absorption system `(I−Q)x=R` — matrix inversion vs the closed form's difference-equation algebra |
| ruin — unfair two-barrier (prob) | `(1−(q/p)^i)/(1−(q/p)^N)` | from-scratch Python | `brute-force`: same absorption-system solve with biased transition weights |
| ruin — one-barrier drift (prob) | `(q/p)^b` or `(p/q)^a` | from-scratch Python | `montecarlo`: simulate walks, estimate ever-touch probability |
| ruin — expected durations | `i(N−i)`, `[i−N·Π]/(q−p)`, `b/(p−q)` | from-scratch Python | `montecarlo`: sample-mean of simulated absorption times (enumeration cannot average durations without the same tail machinery; the sample mean under the existing noise-bound rule is the honest independent check) |
| geometric — single-point regions (segment, rectangle, disk, band, quarter-disk, triangle band) | length/area ratio | from-scratch Python | `montecarlo`: uniform point sampling |
| geometric — two-point problems (gap, meeting, chord angle) | `1−(1−d/L)²`, `1−((T−w)/T)²`, `α₀/π` | from-scratch Python | `montecarlo`: independent pairs/arrivals drawn and measured |
| geometric — three-point spacing | shifted-simplex cube (⚠ §8 #32) | from-scratch Python | `montecarlo`: triples sorted, min gap measured |
| geometric — Buffon short needle | `2L/(πT)` | from-scratch Python | `montecarlo`: needle drops (center + angle uniform), cross counted |
| geometric — conditional broken stick | piecewise in first-break position | from-scratch Python | `montecarlo`: two independent breaks, condition evaluated |

**Why enumeration is out entirely (corrected at planning time):** a walk on `{0..N}` survives step `D` with probability decaying like `cos(π/(N+1))^D`, so provable `< 1e-12` tail truncation needs depth `D ∝ N²` — even the toy case `N=2` needs depth ≈ 40 (`2^40` sequences) and `N=5` needs ≈ 193 (`2^193`). Path enumeration cannot reach the discipline at any feasible depth, so the linear-system solve carries the `brute` slot for all two-barrier probabilities: algorithmically independent (matrix inversion vs difference-equation algebra), and `verify.py:52`'s **absolute** `1e-9` comparison is comfortable at probability magnitudes (`κ·eps ≈ 4e-11` for barriers ≤ ~700 states). Durations never route through `brute()` — at magnitude ~1e3 the same absolute bound leaves only ~100× margin — so they stay `montecarlo`, as does every one-barrier and geometric problem.

**The linear solve is the second check for two-barrier ruin probabilities:** it solves `(I−Q)^{-1}R` (probabilities) numerically via `numpy` — already imported by `verify.py` and pinned in `requirements.txt`, so no dependency change. For `montecarlo` problems, `verify.py`'s existing noise-bound check (`3·se ≤ bound/2`) governs trial counts; §3's floors keep trial counts sane by construction. Monte Carlo-method probability answers floor at **0.1**, not 0.01 (B4's measured noise-bound lesson carried forward); fit-problem simulations follow B4's invert-through-the-closed-form pattern with propagated standard errors.

For `montecarlo` problems, `verify.py`'s existing noise-bound check (`3·se ≤ bound/2`) governs trial counts — the same mechanism B1's Bayes and B4's continuous solvers already use. The §3 floor (`answers ≥ 0.01`) keeps trial counts sane by construction.

## 6. Distinctness at tolerance

The B2/B3/B4 rule is unchanged: **≥ 12 distinct answers over the full legal draw space at grading tolerance**, plus the `draw-space.test.ts` floors (≥ 70 texts/100 distinct, max repeat ≤ 4). Topic-specific collapse risks, both to be *enumerated* with the draw-space helpers, not reasoned about:

- **Ruin ratios collapse when only one dimension varies.** `i/N` with `N` fixed walks a fine grid in `i` but the *texts* repeat; draw `i`, `N`, and the surface numbers (stakes, debts, targets) jointly — B4 §6's lesson (collapse tracks independent dimensions, not any single factor's fineness) applied from the first authored problem.
- **Geometric ratios collapse under coarse shape draws.** Radii, window widths, and stick fractions must be drawn on ranges fine enough that `(r/R)²`, `(w/T)²`-shaped answers stay separated at `rel: 0.005`; the fit-family answers inherit the fineness of the stated target `c` (B4 §6's parameter-fit lesson verbatim).

## 7. Registration deltas

1. **`content/problems/registry.test.ts`** — the topic-sum assertion (line 34) gains `ruin` at sub-batch 1 and `geometric` at sub-batch 3, so it stays green as each topic registers; final form: six topics summing to `PROBLEMS.length` (150). **Two new difficulty pins** — `ruin` 8/8/4 and `geometric` 8/8/4 — a new pattern (all existing pins are 10/10/5 for 25- and 30-problem topics; 20-problem topics pin 8/8/4). Tolerance-species pin re-checked at two shapes (§4).
2. **`verification/solvers/__init__.py`** — aggregate `ruin.SOLVERS` and `geometric.SOLVERS` alongside the existing four.
3. **`content/problems/index.ts`** — import and register all 40.
4. **`TOPIC_LABELS`** needs no change — `"probability/ruin": "ruin & walks"` and `"probability/geometric": "geometric"` were pre-seeded in B1 (confirmed at `content/problems/index.ts:237-238`); sub-batch 1 confirms both render on `/drills/probability`.
5. **`verification/emit.ts`** — no delta expected: no answer, param, or derived value in this batch is negative or sub-`1e-6` by construction (all lengths, times, probabilities, fitted parameters are positive; §9 item 3 keeps sub-`1e-6` quantities out of `derived`). As in B4 §7 item 5, this is *watched, not assumed* — the earliest sub-batches cannot test it, so the confirmation is an explicit ship-gate item (§10).
6. **`content/problems/printed-precision.test.ts`** — add `"probability/ruin"` (sub-batch 1) and `"probability/geometric"` (sub-batch 3) to the `TOPICS` array (line 13). Silent-zero coverage is the failure mode if omitted.
7. **`content/problems/draw-space.test.ts`** — add both topics to the `TOPICS` list (line 22) at the same sub-batches. Same silent-zero failure mode.
8. **`content/problems/prose-claims.test.ts`** — each of the 40 problems gets its own `CLAIMS` entry (keyed by slug) in its authoring sub-batch; an unregistered slug produces zero test cases, not a failure.

## 8. Coverage

Each bullet is one problem. Surface contexts vary per problem and never repeat at the same tier, within or across topics (§1). ⚠ marks the two items with authoring-time care notes.

### `ruin` L1 — 8 problems (direct closed-form plug-in)

1. **fair-reach-goal** — bankroll `i` of goal `N`, fair even-money game: `P(reach N before 0) = i/N` — *casino framing*
2. **unfair-reach-goal** — same with win prob `p ≠ ½`: `(1−(q/p)^i)/(1−(q/p)^N)` — *trading stop-out framing*
3. **walk-hit-upper-first** — symmetric ±1 walk from 0: `P(hit +a before −b) = b/(a+b)` — *price-walk framing*
4. **walk-hit-loss-first** — mirror question `a/(a+b)` — *drawdown framing; keyInsight must not restate #3's* (risk-side reading of the same algebra)
5. **fair-expected-duration** — `E[time to absorption] = i(N−i)` — *game-length framing*
6. **unfair-expected-duration** — `[i − N·Π]/(q−p)` plug-in; constraint `|p−q| ≥ 0.02` (§3 hazard 3) — *session-length framing*
7. **drift-touch-downside** — favorable drift `p > q`, walk from 0: `P(ever touch −b) = (q/p)^b` — *insurance-surplus framing*
8. **adverse-drift-reach-upside** — adverse drift `p < q`: `P(ever reach +a) = (p/q)^a` — *longshot-goal framing; sibling of #7 with the opposite drift; insights must differ*

### `ruin` L2 — 8 problems (complement, fit, rescale, restart)

9. **complement-ruin-first** — `P(ruin before goal) = 1 − success` as the primary ask — *insurance-blowup framing*
10. **fit-capital-fair** — minimum `i` with `i/N ≥ c`: `⌈cN⌉` — *linear inversion*
11. **fit-capital-unfair** — invert the power formula for `i` via logs — *log inversion; ⚠ the `⌈·⌉` must be verified against strict `≥` at authoring (off-by-one is the live defect)*
12. **doubling-strategy** — bankroll backs `n` consecutive losses: session win probability `1 − q^n` (the session fails only on n straight losses; fair stakes: `1 − 2^{−n}`) — *complement of a losing streak* (formula corrected at planning; the `1 − (q/p)^n` quantity belongs to the unshipped table-limit/infinite-time variant)
13. **fit-goal-from-duration-fair** — given `i(N−i) = E`, solve the quadratic for `N` (admissible root) — *quadratic inversion*
14. **stake-rescale** — recompute an absorption probability after units are halved/doubled — *scale-invariance teaching; arithmetic twist, not new theory*
15. **restart-after-survival** — given level `j` was reached unharmed, fresh `P(goal)` from there — *Markov-restart decomposition*
16. **drift-one-sided-duration** — `E[time to touch −b] = b/(p−q)` under favorable drift — *expected-time framing; constraint keeps `p−q` clear of zero (same cancellation logic as #6)*

### `ruin` L3 — 4 problems (two genuinely dependent stages)

17. **fit-then-duration** — from stated fair `P(success) = c` and `N`, infer `i`, then `E[T] = i(N−i)` — *fit, then duration*
18. **infer-capital-then-new-goal** — fair-only: from `i/N = c₁` infer `i`, then success probability toward a different goal `M` — *deliberately fair-only: the unfair version would need a forbidden root-finder (§2)*
19. **drift-fit-then-duration** — from `P(ever touch −b) = c` fit `q/p = c^{1/b}`, then `E[T] = b/(p−q)` for stated `p` — *log fit, then duration*
20. **survive-then-remaining-duration** — given level `j` reached, remaining `E[T] = j(N−j)` — *conditional expectation resets; must not restate #5's or #17's keyInsight (the B4 #23/#24 pair pattern)*

### `geometric` L1 — 8 problems (direct ratio)

21. **segment-subinterval** — point uniform on `[0, L]`: probability in a stated sub-interval — *length ratio*
22. **two-points-gap** — two independent points on `[0, L]`: `P(|X−Y| < d) = 1−(1−d/L)²` — *overlap-interval derivation*
23. **meeting-window** — arrivals uniform on `[0, T]`, meet iff within `w`: `1−((T−w)/T)²` — *the classic, parameterized*
24. **square-inner-disk** — point uniform in a rectangle: `P(within r of center) = πr²/(ab)` — *area ratio with π*
25. **concentric-circles** — dartboard: `P(inside concentric r | board R) = (r/R)²` — *parameterized, never the fixed π/4 icon (§3 hazard 4)*
26. **broken-stick-left-share** — one break uniform: `P(left piece > cL) = 1−c` — *the naive classic made varying*
27. **border-band** — point uniform in a rectangle: probability within `ε` of the boundary — *band/area-complement ratio*
28. **chord-angle-cap** — two points uniform on a circle's circumference: `P(central angle < α₀) = α₀/π` — *angle ratio*

### `geometric` L2 — 8 problems (inverse, conditional, composite)

29. **meeting-inverse-fit** — find `w` with `P(meet) = c`: `w = T(1−√(1−c))` — *inverse of #23*
30. **stick-triangle-conditional** — first break at drawn `uL`: `P(three pieces form a triangle | u)` — *piecewise in `u`; the 1/4 classic survives as a conditional, and the drawn `u` keeps the answer varying (§3 hazard 4)*
31. **buffon-short-needle** — needle `L ≤ board spacing T`: `P(cross) = 2L/(πT)` — *π in the answer; §2's bit-identical doubles argument applies*
32. **three-points-spacing** — three uniform points on `[0, L]`, all pairwise gaps ≥ `d`: shifted-simplex cube `((L−2d)/L)³` — *⚠ the simplex-shift derivation and its `2d ≤ L` validity bound are re-derived at authoring time, not trusted from this spec*
33. **corner-quarter-disk** — point uniform in rectangle: `P(within r of a corner)` — *quarter-circle area ratio*
34. **disk-in-rect-complement** — circle radius `r` inside rectangle `a×b` (`r < min(a,b)/2`): `P(outside the circle) = 1 − πr²/(ab)` — *complement framing; parameterized so it never collapses to π/4*
35. **buffon-fit-length-inverse** — find `L` with `P(cross) = c`: `L = cTπ/2` — *linear-in-π inversion of #31*
36. **triangle-parallel-cut** — apex-up triangle cut parallel to the base at a drawn height fraction `t`: below-area `1−(1−t)²` — *area ratio under a drawn shape* (reframed at planning: the centroid line alone is fixed-answer 8/9, §3 hazard 4)

### `geometric` L3 — 4 problems (two dependent stages)

37. **fit-window-then-other-window** — from `P(meet) = c₁` fit `w`, then compute the meeting probability for a different window — *inverse, then re-evaluation*
38. **buffon-fit-then-other-board** — fit `L` from a stated cross probability, then compute the crossing probability on different board spacing — *inverse, then rescale*
39. **delayed-arrival-meeting** — one arrival's window starts offset by `s`: composite window meeting probability — *two-stage window algebra, still quadratic-family closed form*
40. **concentric-fit-then-ring** — from `P(bullseye) = c` fit `r`, then the probability of the ring between `r` and a stated outer radius — *inverse, then annulus*

## 9. Authoring contract

Inherited from B1 Task 10, B2 §8, B3 §9, and B4 §9 verbatim except where marked ▲:

1. `id` = `ruin/<slug>` or `geometric/<slug>`, `topic` matching §1, `version: 1`; params yield ≥ 12 distinct answers at grading tolerance (§6); `constraint` guards degenerate draws.
2. ▲ `constraint` guarantees `0.01 ≤ |answer| ≤ 1e4` **and**, for probability-shaped answers, `answer ≤ 0.99` (§3 hazard 2) — the first batch to need an upper probability cap. `emit.ts`'s audit separately floors every `params`/`derived` value at `1e-6`; no sub-1e-6 quantity (tail masses, enumeration tails, `1−Π` complements near 1) enters `derived` — only integer caps and the quantities prose actually prints.
3. Every intermediate number lives in `derived`; the answer is one `answerKey`; tolerance is `{ rel: 0.005 }` — never `abs` (§4).
4. ▲ **No template may require a numerical root-finder** — fits invert closed forms only (§2); the inventory's fair-only choices (#18) and log/sqrt/linear inversions (#11, #29, #35, #37, #38, #40) are the enforcement of this rule.
5. ▲ **π enters only via `Math.PI`** — no hand-typed `3.14159` literals anywhere in `geometric` templates or prose chains.
6. ▲ **Unfair-duration and one-sided-duration templates carry the `|p−q| ≥ 0.02` (resp. `p−q ≥ 0.02`) constraint** (§3 hazard 3, #6, #16).
7. Statement in plain prose, numbers via `fmtNum`/`pc` only. Solution 3–6 steps ending in a **Sanity check**. `keyInsight` and `commonTrap` number-free. `firms` and `expectedPaceS` set. `source` records kind honestly, tagged at authoring time.
8. Python counterpart in the same sub-batch: `exact()` is a from-scratch reimplementation (§5), never a call into the same helper the template effectively uses; the second check takes the independent path from §5's table.
9. Registered in `index.ts` `PROBLEMS`, in the topic solver file's `SOLVERS` dict, **and** in `prose-claims.test.ts`'s `CLAIMS` dict under its slug (§7 item 8) — omitting the last ships the problem with that gate silently not looking at it.

## 10. Cadence and gates

Four sub-batches, tier-grouped per the approved decision, each committed only when `npm run typecheck && npm run test && npm run verify:emit && python3 verification/verify.py` is green:

- **Sub-batch 1 (9)** — the registration/gate widenings (§7 items 1-partial, 2, 6, 7), `ruin` L1 (8) with their Python counterparts and `CLAIMS` entries. The topic-sum assertion gains `ruin` here. `numpy` is already imported by `verify.py` and pinned in `requirements.txt` — confirmed at planning, no dependency work exists in this batch.
- **Sub-batch 2 (12)** — `ruin` L2 (8) + L3 (4) with counterparts and `CLAIMS` entries.
- **Sub-batch 3 (9)** — the `geometric` gate widenings (§7 items 1-partial, 6, 7), `geometric` L1 (8) with counterparts and `CLAIMS` entries; the topic-sum assertion gains `geometric`.
- **Sub-batch 4 (12)** — `geometric` L2 (8) + L3 (4) with counterparts and `CLAIMS` entries, the two 8/8/4 difficulty pins and tolerance-species re-check in `registry.test.ts`, and the §7 item 5 sign/sub-1e-6-audit confirmation (explicitly stated at ship, not assumed from earlier sub-batches).

Ship gate: identical to B3/B4 — `npm run typecheck && npm run test && npm run e2e && npm run verify:emit && python3 verification/verify.py` all green, merge `--no-ff`, push, confirm CI logs show both `Emitted 150 problems` and `Verified 150 problems` (not just a green checkmark), then prod smoke on `quant-prep-gold.vercel.app` (the only public origin): both new chips appear beside the existing four and serve their topics; one ruin walkthrough and one geometric walkthrough render KaTeX cleanly end-to-end; a wrong answer unfolds to the Sanity check and re-roll changes numbers; `/stats` gains both topic rows and the probability filter includes them.

## 11. Out of scope

- **Optimal-play theory** — bold/cautious bet-size comparisons (Dubins–Savage), red-and-black strategy: the answers have no elementary closed form and would violate §2's no-root-finder rule.
- **Martingale/optional-stopping derivations** beyond the doubling-strategy session probability (#12) — a plausible future batch.
- **Bertrand-chord variants** — the chord problem enters only in its unambiguous angle-ratio form (#28); the paradox's competing methods are out of scope by design.
- **Multi-dimensional geometric probability** (random points in the plane, distance distributions in the unit square) — no closed forms at this batch's tolerance discipline; parked.
- **Gambler's ruin with finite horizons or non-nearest-neighbor jumps** — linear-system territory without closed forms; parked with the above.
- The `symbolic` verify method (still unimplemented; nothing here needs it); any change to `fmtNum`, the emit audit, or `verify.py`'s dispatch; engine, parser, grading, or drill-UI changes (§2).
- Chunks C and D.
