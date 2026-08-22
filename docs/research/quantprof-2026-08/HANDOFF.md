# Handoff — integrating the QuantProf findings

## NEXT SESSION STARTS HERE (paused 2026-08-22)

**Nothing from this work is committed.** `main` is at `a2960ae`, level with
`origin/main`, carrying 30 modified and 9 untracked paths. Everything below is
verified green at that working tree: typecheck, **368 unit tests / 23 files**,
**5/5 e2e**, `next build` clean, and `npm run verify:emit` reporting
**Emitted 174 problems x 100 instances — all static gates green**.

First decision next session: commit this. Suggested split, in dependency order —

1. `feat(generators): weighted sequence families + missing-operand drill`
   — `packages/generators/*`, `packages/engine/src/{types,presets}.ts`,
   `components/{ChoiceGrid,DrillRunner,TestRunner,DrillNav}.tsx`,
   `app/drills/missing-operand/`, `app/stats/page.tsx`, `e2e/`,
   `components/DrillRunner.test.tsx`.
2. `fix(content): merge duplicate firm slugs` — `content/problems/*/*.ts`
   plus the `registry.test.ts` guard.
3. `content(b6): markov, symmetry and brainteasers — 24 problems, bank at 174`
   — `content/problems/{markov,symmetry,brainteasers}/`, `index.ts`, and the
   four gate files.
4. `docs(research): quantprof harvest + coverage analysis` — `docs/research/`.

**Also still open from before this work:** branch `phase-d-review-queue` holds
3 unmerged commits (tip `b69fbb1`) in `.worktrees/phase-d-review-queue` —
chunk D review queue, sequences intake, chunk C leaderboard. That is unrelated
to this batch and its file set is disjoint. Land it separately.

`verify:emit` initially reported **7828 issues** across 21 of the 24 new
templates, and finding that is the reason it was worth running: it enforces a
rule no content test does — every number printed in prose must trace to a
param, a derived value, or a declared `constants` entry. Fixed by promoting
printed intermediates into `derived` and declaring structural literals. One
case was subtler than the rest: a zero-padded clock minute renders "09", which
the tokenizer reads as a number that can never be traceable, so that template
now never draws a single-digit minute.

Still NOT run: the Python side (`verification/verify.py`). `instances.json` is
regenerated and the TS static gates pass, but the double-entry numeric check
has only ever seen the pre-B6 bank. That is the one gate still unexercised.

---

Research done 2026-08-22. Nothing in `app/`, `packages/` or `content/` was
touched. This directory is untracked; commit it or delete it.

Report: https://claude.ai/code/artifact/955f78ec-bdcd-409f-89ec-4c0834d15803
Data inventory and collection method: `INDEX.md` in this directory.

Re-run the family analysis any time:

```
cd docs/research/quantprof-2026-08 && python3 classify.py seq.jsonl
```

## Status — 2026-08-22

Integrated: **1, 2, 4, 5, 6** (see below), plus the coverage work in
`COVERAGE.md`. Not done: **3** (four-term display), and combinatorial-game
brainteasers, which need a non-numeric answer type in the engine.

**B6 content batch — 24 templates, bank now 174.** `probability/markov` (8),
`probability/symmetry` (8), `brainteasers/logic` (8), all written at L2/L3.
Every one clears registry, printed-precision, draw-space and prose-claims, and
all three topics were added to those gates' scopes rather than shipping outside
them. Every answer was additionally checked against an independent brute force
— Monte-Carlo for the chains, exhaustive enumeration for the rare-event
symmetry ones, and a real solver for the brainteasers (toggling every bulb,
solving the pirate game backward, Dijkstra over bridge states, event-driven ant
collisions). **That check caught two wrong formulas** that had already passed
every content gate: ants-on-a-pole was off by a factor of two, and both
bridge-crossing strategies were mis-costed.

- `packages/generators/src/sequences.ts` — family choice is now weighted per
  difficulty (`SEQ_WEIGHTS`), eight new families added, geometric runs both
  directions.
- `packages/generators/src/arithmetic.ts` — `div` divisor bounds per difficulty.
- `packages/generators/test/sequences.test.ts` — an independent verifier per
  family, plus a per-difficulty mix assertion and an id-collision check.
  Mutation-checked: of eight deliberate generator bugs, seven were caught on the
  first pass; the survivor (`mult-plus-linear` with a frozen offset, which is
  just `recur-linear`) exposed a hole in the shared verifier, which now rejects
  step 0 — after that, eight of eight.

- `packages/generators/src/missing-operand.ts` — Optiver-style four-way choice
  with a blanked slot, calibrated to `optiver-80.txt` (n=24): op mix ÷11/+7/×4/−2,
  blank position result 11 / left 7 / right 6, integer offsets for integer
  answers and tenths otherwise, uniform shuffle. New `optiver-mc-80in8` preset,
  `/drills/missing-operand` page, and a shared `ChoiceGrid` (1–4 answers,
  Enter skips). Mutation-checked: eight deliberate bugs, six caught first pass;
  the two survivors were weak assertions (a 1e-9 tolerance that accepted float
  dirt like `4.730000000000001`, and a decimal-ramp test satisfied by noise),
  both tightened, then eight of eight.
- `content/problems/*` — duplicate firm slugs merged; `registry.test.ts` pins
  the canonical set.

Note `optiver-80in8` is misnamed: their real Optiver 80-in-8 is the
multiple-choice format above, while ours is a Zetamac-style free-entry sprint.
Both are kept so stored runs stay comparable — renaming is a call for later.

Seed replay was checked before touching family selection and is **not**
load-bearing: only `components/DrillRunner.tsx` and `components/TestRunner.tsx`
call the generators, both from a fresh rng at mount. The `seed` column on
attempt rows is write-only provenance — nothing reads it back to regenerate an
item, and `problemId` already carries the terms. `problemVersion` left at 1.

## Integration candidates, highest value first

### 1. Vary family mix by difficulty in `packages/generators/src/sequences.ts`

The headline finding. They ladder difficulty by *which families appear*; we
ladder it by widening `randInt` bounds. Their measured mix is in
`family-mix.txt`. Today `sequenceItem` does:

```ts
const family = pick(rng, SEQ_FAMILIES);   // uniform, difficulty-independent
```

so `difficulty` never reaches the family choice at all.

**Blocker to resolve first.** `sequences.ts:11` states the invariant: *"Per
(family, difficulty) the number of rng draws is fixed — changing a family's
draw count breaks seed replay."* A per-difficulty weighted pick changes how
many draws the *selection* consumes, and adding entries to `SEQ_FAMILIES`
shifts what `pick` returns for an existing seed. Either way, previously stored
seeds stop replaying to the same items. Decide deliberately:

- version the generator and keep old seeds resolving through the old path, or
- accept a one-off replay break and say so in the commit, or
- keep the selection draw fixed-width (e.g. always draw one uniform, then map
  through a per-difficulty table) so only the mapping changes.

Check what depends on replay before choosing — `packages/generators/test/sequences.test.ts`
asserts every family is eventually drawn, and the review queue stores items by
pattern family.

### 2. Add the eight missing families

Rules and worked examples are in the report and in `sequence-families.txt`.
`ratio-linear-offset` is the one that matters — 54% of their hard mode, and the
parameter check (82 of 93 cases sharing one narrow shape) says it is a real
generator family, not a solver artefact.

Also cheap: our `geometric` only ascends; theirs runs both directions
(`15625, 3125, 625, 125`).

### 3. Show four terms, not five or six

`sequences.ts:10` sets `n = difficulty === 1 ? 5 : 6`. They always show four,
which leaves several rules fitting and forces the solver to pick the simplest.
Adopting this means the answer checker must accept **any** rule consistent with
the shown terms, not just the generating one — 4 of our 652 harvested sequences
genuinely admit two rules. Don't ship the display change without the checker
change.

### 4. Audit `packages/generators/src/arithmetic.ts` against their invariants

Two invariants they never broke across 515 played questions: division always
has an integer quotient (131/131) and subtraction never returns a negative
(130/130). Their observed operand ranges per difficulty are in the report —
treat them as observed minima/maxima over 31–60 samples per cell, not declared
bounds, and round to the obvious design intent (`104–995` means 100–999).

Note `arithmetic.ts:17` carries the same fixed-draw-count constraint.

### 5. New drill type: Optiver-style missing operand

We have no equivalent. Four-way multiple choice, decimals, and the unknown
moves around the equation (`? ÷ 1.7 = 19.3`, `4.3 × ? = 4.73`, `5.4 × 2.4 = ?`).
Samples with their real option sets in `optiver-80.txt`. Distractor spacing is
tight in the typical case (median 1.15× spread across the four options) but
opens up when the unknown is a small operand.

### 6. Content coverage

`problems-index.tsv` is their full 976-row catalogue: title, topic, difficulty,
firm tags, free/paid. Their whole bank is three topics — probability 71%,
brainteasers 20%, combinatorics 9% — with mass at difficulty 4–6 and only 91
problems at 9–10. Useful for picking what to write next and for firm tagging.

Use it for coverage and gap analysis. Do not copy their problem wording; one of
their 60 free problems ("Standing Table I") is internally inconsistent anyway.
