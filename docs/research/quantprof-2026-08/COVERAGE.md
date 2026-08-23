# Probability coverage — our 174 vs their 976

_Updated after the B6 batch: 24 new templates across markov, symmetry and brainteasers._

Ours read from `content/problems/index.ts`; theirs from `problems-index.tsv`.

|  | ours | theirs |
|---|---|---|
| total | 174 | 976 |
| probability | 166 (95%) | 694 (71%) |
| brainteasers | 8 (5%) | 196 (20%) |
| combinatorics | 25, as `probability/counting` | 86 (9%) |
| difficulty scale | 1–3 | 1–10 |

## Not gaps — checked and dismissed

Their titles are evocative rather than technique-descriptive ("Frog Jumping",
"Ants on a Triangle"), so keyword clustering left 576 of 694 unmatched and is
too weak to support a coverage claim. The 60 full free statements were read
instead. Two suspicions died on contact:

- **Geometric probability.** Suspected missing because their titles are thick
  with triangle/circle/square/intersection. We have 20 — Buffon needle, chords,
  disk-in-rectangle, broken stick, meeting windows. Covered.
- **Linearity of expectation.** Their free set leans on it hard ("expected
  number of intersections among 10 random chords"). We have `indicator-match-count`,
  `matching-indicators-variance`, `labeled-tickets-draw`, `distinct-types-collected`,
  `wald-random-sum`. Covered.

Bayes, distributions, ev/variance, counting and 1-D gambler's ruin are all
solidly covered too.

## Real gaps, highest value first

### 1. Our bank is bottom-weighted; theirs is middle-weighted

Comparing probability-only, their 694 against our 150:

| | bottom third | middle third | top third |
|---|---|---|---|
| theirs, levels 1-3 / 4-6 / 7-10 | 16% | 53% | 31% |
| theirs, levels 1-3 / 4-7 / 8-10 | 16% | 65% | 19% |
| ours before B6, L1 / L2 / L3 | 40% | 40% | 20% |
| **ours now (probability only)** | **36%** | **40%** | **23%** |

The 1–10 and 1–3 scales have no canonical mapping, so read the two rows as a
range rather than a target. The conclusion survives either: they put only ~16%
of problems in their bottom three levels, we put 40% in L1. Our easy tier is
roughly 2.5× overweight, and the mass they concentrate in the middle is where
an interview candidate actually lives.

**Status:** the B6 batch was written entirely at L2/L3 (14 at L2, 10 at L3),
which moved the mix from 40/40/20 to 36/40/23. That is real movement and it is
**not** a fix — the gap is still wide, because the existing 60 L1 templates
dominate. Closing it means promoting existing L1 problems, which is its own
edit and has not been done. Note the pre-B6 per-topic split was a rigid 12/12/6
(or 10/10/5) applied uniformly: that ladder was laid down by template, not by
measuring anything.

### 2. Brainteasers — 196 of theirs, 8 of ours (was zero)

A distinct interview category, not a probability sub-topic. Split by effort:

- **Most fit `ProblemTemplate` as-is** — they have a numeric answer, so
  `answerKey` resolves and no engine change is needed.
- **Combinatorial games do not.** "Game Of Chords", "Moving The Piece" — Alice
  and Bob alternate, the answer is *who wins*. `answerKey` must name a numeric
  derived value, so this subset needs an engine change (a non-numeric answer
  type, and a grader for it). Of ~14 free statements read, 2–3 were non-numeric.

**Done:** 8 numeric brainteasers shipped as `brainteasers/logic` (clock angle,
bulb toggling, factorial zeros, pirates, two-egg drop, ants on a pole, bridge
crossing, frog in a well). `registry.test.ts` now pins two topic families
rather than requiring a `probability/` prefix.

**Still open:** the combinatorial-game subset, which needs the engine change.

### 3. Markov chains on a structure — DONE

8 templates as `probability/markov`: deuce, two-state uptime, a two-room maze,
the three-tunnel miner, coin-switching, a three-state server with a backward
repair edge, success runs, and a k-step transition. All multi-state; none is a
1-D walk in disguise.

### 4. Symmetry arguments — DONE

8 templates as `probability/symmetry`: all-wins-before-loss, first-ace by gap
symmetry, Bertrand's ballot, the last-ball argument, the standing table,
exchangeable rivals, a circular-table block, and relative order of a subset.

## Firm tags — dedup APPLIED 2026-08-22

They tag Graviton (42 problems) and FiveRings (30); we tag neither. We tag
`de-shaw` and `millennium`; they tag neither. Neither list is authoritative —
both are hearsay about where a problem was "seen".

Our own slugs carried two duplicate pairs: `sig`/`susquehanna` and
`flow`/`flow-traders`, both rendered raw to users at
`components/ProblemRunner.tsx:117`. Merged to the dominant slug (`sig` 40,
`flow` 20), which is also the house style — the bank abbreviates (`hrt`, `drw`,
`imc`). 14 canonical slugs remain, no template lists a firm twice.
`registry.test.ts` now pins the slug set so this cannot regress; the guard was
checked by reintroducing `susquehanna` and watching it fail.

`citadel` and `citadel-securities` should **not** be merged: Citadel LLC and
Citadel Securities are different entities, though QuantProf tags both as
"Citadel".

---

# Scoping the difficulty mix — 2026-08-22 (post-B7, bank 188)

No content files were touched to produce this. It is the "scope it before anyone
starts" that the handoff asked for, and its main result is that **the obvious
plan was wrong**.

## The numbers, with the denominator stated

The `36/40/23` row above is not comparable to a fresh count: it was taken over
the post-B6 probability set, while the `our 150` in the header table is the
*pre*-B6 bank total. Recomputed at `337e966`, counting a template as probability
when its `topic` starts `probability/` (so `probability/counting` is in, and the
8 `brainteasers/logic` are out):

| | L1 | L2 | L3 | total |
|---|---|---|---|---|
| probability only | 62 (34%) | 76 (42%) | 42 (23%) | 180 |
| whole bank | 62 (33%) | 79 (42%) | 47 (25%) | 188 |
| theirs, bottom/middle/top third | 16% | 53% | 31% | 694 |

B7 moved the probability mix 36/40/23 → 34/42/23. As with B6: real movement, not
a fix.

## The mis-tag theory, tested and mostly dead

The cheap read of the gap is that the L1 tier is full of mis-tagged problems, so
a relabel would fix the mix for free. `expectedPaceS` is the field to test that
against — it is the author's own time estimate, written per template and never
compared across templates until now.

Globally it looked damning: L1 spans 25–90s, L2 spans 40–130s, and 26 of the 62
L1 templates are paced at or above the L2 *minimum*. Bayes alone contributed 11.

That reading is topic-confounded and wrong. Per topic the ladders are clean:

| topic | L1 pace | L2 pace | L3 pace |
|---|---|---|---|
| bayes | 45–60 | 90–100 | 130–140 |
| geometric | 25–45 | 40–70 | 70–130 |
| counting | 35–75 | 45–100 | 70–120 |
| distributions | 40–65 | 40–110 | 65–120 |
| ev-variance | 30–90 | 45–120 | 90–120 |
| **ruin** | **40–80** | **40–85** | 65–85 |

Bayes' L1 tier is paced at 45–60s not because it is mis-tagged but because Bayes
is a slower topic at every tier — its own L2 starts at 90. All 11 "candidates"
there are correctly tagged. **The L1 tier is, with six exceptions, genuinely
easy.** Promoting it would improve the measured mix without making one problem
harder, which is the failure mode `[[verification-gate-lessons]]` is about.

## The five that are genuinely mis-tagged

"Paced above its own topic's L2 average" was the first criterion tried and it is
too weak to carry a promotion: distributions' L2 band is 40–110 and ruin's is
40–85, so clearing a mean by three or four seconds means nothing. The criterion
that survives is **paced inside its own topic's L3 band**, which is a claim about
where the template actually sits rather than about one summary statistic.

Five templates qualify. All five were read, not just counted:

| template | pace | own-topic L3 band | what it actually asks |
|---|---|---|---|
| `ev-variance/covariance-sum-difference` | 90 | 90–120 | `Cov(X+Y, X−Y) = Var X − Var Y`. Sits at ev-variance's L3 floor. |
| `ruin/unfair-expected-duration` | 80 | 65–85 | Asymmetric-ruin duration — the hardest closed form in the family. |
| `ruin/unfair-reach-goal` | 75 | 65–85 | Solves the recursion to the odds-ratio exponential; 5 solution steps. |
| `counting/steps-to-height` | 75 | 70–120 | Endpoint-constrained walk count, two linear equations then a binomial. |
| `distributions/hypergeom-exact-draw` | 65 | 65–120 | **Weakest of the five.** One PMF, three binomial coefficients, divide — 4 steps, and on content it is barely above `binomial-exact-count` (L1, 40s). It qualifies only by sitting exactly on distributions' L3 floor. Treat its 65s as a possibly over-estimated pace, not as evidence, and promote it only if a second reader agrees. |

**Dropped on the content read: `ruin/fair-expected-duration`** (60s). It cleared
the weak criterion by 3.1s over ruin's L2 mean, but it is below ruin's L3
minimum of 65 and its content — fit a parabola to two boundaries — is the
standard fair-ruin derivation. It is not mis-tagged; it is caught up in the ruin
ladder problem below.

Promoting all five moves probability-only from 34/42/23 to 32/45/23 — counts
57/81/42 over 180. That is honest and it is nearly nothing.

## Separate finding: the `ruin` ladder is not real

`ruin` L1 averages 56.2s and L2 averages 56.9s, over identical 40–85 ranges.
Three of the six mis-tags above are ruin, and that is the same fact seen from
one side: the L1/L2 boundary in that topic was never derived from anything.
Worth fixing on its own merits, independent of the mix question — it is 16
templates and the split between them is currently arbitrary.

## So what actually causes the overweight

Not mis-tagging. The six pre-B6 topics were each authored to a fixed
~12/12/6 shape — the note above already says this ladder "was laid down by
template, not by measuring anything" — and six topics × ~11 L1 is the 62. The
easy tier is exactly as large as the authoring template made it, and every
problem in it is correctly tagged.

That leaves three real options, and only the third is free of a cost:

1. **Retire surplus L1 templates.** Deleting ~30 correctly-tagged working
   problems to improve a ratio. Cheapest diff, worst trade.
2. **Author L2/L3 mass.** With L1 fixed at 62, reaching 20% bottom-tier needs a
   bank of ~310, i.e. **130** more L2/L3 templates. Honest, and it is B8–B12.
3. **Re-scope the metric.** Their 976 rows are a browsable catalogue where a user
   picks a problem; ours is a randomized drill pool. `/drills/probability`
   defaults to `difficulty: undefined`, so the default pool *is* all 188 and a
   third of served problems are warm-ups — which is a defensible thing for a
   drill to do, and is not what a 16%-bottom catalogue is measuring.

**Recommendation: 3, then the five re-tags, then 2 as ordinary batch authoring.**
Do not chase 16%. COVERAGE.md already says the 1–10 and 1–3 scales have no
canonical mapping and the rows should be read "as a range rather than a target";
treating 16% as a number to hit is false precision on top of that caveat. The
defect worth naming is the arbitrary ruin ladder and the five mis-tags, both of
which are real and both of which are small.

## Constraints anyone editing tags must know

- **`registry.test.ts` will go red, by design — and the failure list undercounts
  the edit.** This was verified rather than reasoned: the five promotions were
  applied to a scratch tree and the suite run. It reports **5 failed tests**, at
  `registry.test.ts:79, :86, :100, :111, :166`. But vitest abandons a test at its
  *first* failed assertion, so the L2 half of every equality pin never executes.
  The complete set of assertions a five-template promotion must rewrite:

  | topic | pin | assertion | now | after |
  |---|---|---|---|---|
  | ruin | `<=` budget `:78-80` | L1 `<=8` | 8 | 6 (still passes, update anyway) |
  | ruin | `<=` budget `:78-80` | L2 `<=8` **fails** | 8 | 10 |
  | distributions | equality `:86-88` | L1 `toBe(10)` **fails** | 10 | 9 |
  | distributions | equality `:86-88` | L2 `toBe(12)` *(masked)* | 12 | 13 |
  | counting | equality `:100-102` | L1 `toBe(11)` **fails** | 11 | 10 |
  | counting | equality `:100-102` | L2 `toBe(11)` *(masked)* | 11 | 12 |
  | ev-variance | `<=` budget `:110-112` | L2 `<=15` **fails** | 15 | 16 |
  | ev-variance | equality `:166-168` | L1 `toBe(13)` **fails** | 13 | 12 |
  | ev-variance | equality `:166-168` | L2 `toBe(15)` *(masked)* | 15 | 16 |

  **`ev-variance` carries two pins, not one** — a `<=` budget at `:104-112` and an
  equality pin at `:163-168` — and a promotion trips both independently. bayes and
  geometric are untouched by these five. The pins exist to catch a misassignment
  *during authoring*, so a deliberate re-tag updates them to the new intended
  shape and keeps the equality pins as equalities; loosening them to `<=` would
  delete the guard.
- **`expectedPaceS` is authored, not measured.** Everything above tests the tag
  against the same author's own estimate — a consistency check, not ground
  truth. Real per-template solve times from `attempts` would settle it properly
  and are not reachable from here.
- **What consumes `difficulty`:** the topic × L1/L2/L3 chips at
  `app/drills/probability/page.tsx:29`, the review-queue label at
  `app/review/page.tsx:14`, and the "harder" link at
  `components/ProblemRunner.tsx:23`. Presets do not — `presets.ts` ladders only
  the arithmetic/missing-operand/sequences generators. An empty pool renders a
  placeholder (`ProblemRunner.tsx:21`), and markov/symmetry/brainteasers already
  ship with zero L1, so a topic losing its L1 tier is precedented, not a break.
