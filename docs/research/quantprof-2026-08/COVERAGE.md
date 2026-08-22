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
