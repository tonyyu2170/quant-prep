# Handoff — integrating the QuantProf findings

## NEXT SESSION STARTS HERE (resumed and landed 2026-08-22)

**Everything below is landed and pushed.** `main` is at `057c5ba`. The four
commits named here were pushed, then `phase-d-review-queue` merged in as
`44e6006`, then the B7 batch as `11ea7b5` and `057c5ba` (bank 174 -> 188).

Original four commits on top of `a2960ae`,
in the order the earlier draft of this section proposed:

1. `3bcf19d` feat(generators): weighted sequence families + missing-operand drill
2. `93329bd` fix(content): merge duplicate firm slugs
3. `725cd46` content(b6): markov, symmetry and brainteasers — 24 problems +
   Python counterparts, bank at 174
4. `5c98986` docs(research): quantprof harvest + coverage analysis

All of it is pushed; CI green on each push.

**The Python gate has now been run and is green.** It was the one gate this work
had never exercised, and the reason was concrete rather than incidental: all 24
new problems were missing their `verification/solvers/*` counterpart, and
`verify.py` treats a missing counterpart as a failure, so CI would have gone red
on the first push. The three new solver modules close that.

Writing them surfaced two header comments that contradicted their own verified
code — both leftovers from the factor-of-two and mis-costing fixes made when the
answers were first checked. `ants-pole-collisions` claimed `C(n,2)/2` where the
code correctly has `C(n,2)/4`, and `bridge-crossing-time` named both strategy
costs wrong. The code was right in both cases; only the comments changed.

The counterparts were themselves checked rather than merely written: `brute()`
matches `exact()` across the full legal parameter space (20,940 draws, against
the 25 `verify.py` samples), a 2% perturbation of `exact()` is caught on every
one of those draws, and perturbing one emitted answer per problem makes
`verify.py` report exactly 48 failures and exit 1. That last one matters most —
before it, nobody had watched this gate fail.

**Open next, in rough value order.** Nothing below is started.

- **Apply `supabase/migrations/0003_leaderboard.sql`.** It is committed and
  `/leaderboard` builds and passes e2e against local state, but the page cannot
  work in production until the migration runs against the Supabase project. This
  is the only thing blocking a shipped feature.
- **The difficulty mix — now scoped; read `COVERAGE.md` before acting.** The
  scope killed the plan this bullet used to propose. A mass re-tag of the L1
  tier is *not* available: per topic the `expectedPaceS` ladders are clean, so
  the L1 tier is genuinely easy and promoting it would move the ratio without
  making anything harder. Exactly six templates are mis-tagged, `ruin`'s L1/L2
  boundary turns out to be arbitrary (identical pace bands), and the overweight
  traces to the rigid ~12/12/6 authoring template rather than to bad tags. The
  recommendation is to stop treating 16% as a target, land the six re-tags, and
  let the mix move through ordinary B8+ authoring. Awaiting a ruling.
- Four-term sequence display, still blocked on the answer checker accepting any
  rule consistent with the shown terms.
- Combinatorial-game brainteasers, still blocked on a non-numeric answer type.
- The `optiver-80in8` naming collision, which needs a ruling rather than a fix.

**Read `[[quantprep-authoring-gates]]` in memory before authoring another batch.**
B7 cost real time to four traps that are all now written down: consecutive-seed
correlation defeating tuple count in draw-space, answer spaces that are too
DENSE rather than too sparse, rounded transcendentals as chain operands, and
prose claims that are exactly true but false at display precision.

**The gate that earns its keep is the Python counterpart.** In B6 it caught the
ants factor-of-two and both bridge mis-costings. In B7 it caught a wrong
QUESTION: comparing-heads-counts asked who gets strictly more heads and answered
"half of what the tie leaves", which needs the two flip counts to be equal. It
cleared registry, draw-space, printed-precision and prose-claims while being
wrong by a factor of two at 24 flips against 4. The content gates check internal
consistency; only an independent derivation checks truth.

**Resolved, and this paragraph used to say otherwise:** `phase-d-review-queue`
(tip `b69fbb1` — chunk D review queue, sequences intake, chunk C leaderboard) is
**fully merged** into `main` as `44e6006`, which the top of this file already
says. `git merge-base --is-ancestor b69fbb1 main` confirms it and
`git log main..phase-d-review-queue` is empty. The branch and its
`.worktrees/phase-d-review-queue` checkout have been removed.

`verify:emit` initially reported **7828 issues** across 21 of the 24 new
templates, and finding that is the reason it was worth running: it enforces a
rule no content test does — every number printed in prose must trace to a
param, a derived value, or a declared `constants` entry. Fixed by promoting
printed intermediates into `derived` and declaring structural literals. One
case was subtler than the rest: a zero-padded clock minute renders "09", which
the tokenizer reads as a number that can never be traceable, so that template
now never draws a single-digit minute. The Python double-entry check has since
been run too, and now covers the whole bank rather than only the pre-B6
problems.

---

Research done 2026-08-22. The section above records what was integrated from
it; this directory is committed as `5c98986` and is raw data plus analysis, not
anything the app imports.

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
