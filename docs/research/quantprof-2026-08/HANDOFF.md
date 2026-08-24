# Handoff — integrating the QuantProf findings

## FOUR-TERM SWEEP — the revert's justification does not survive measurement (2026-08-24)

**The measurement the handoff has asked for across three sessions is done.**
`four-term-sweep.ts`, beside `catalogue.py`. One instrument, two fit spaces, two populations.
Run it with `npx tsx docs/research/quantprof-2026-08/four-term-sweep.ts`; `--stragglers` and
`--show` print the individual prompts behind the numbers.

**The headline: `3, -1, -5, -17` is UNIQUE under our own parameter windows.** That prompt is
the whole stated basis of the 2026-08-22 revert and of
`[[quantprep-four-term-sequences]]` — "fits every multiplier from -6 to 12, nineteen
different next terms". Enumerated against the real `ratio-linear-offset` range
(start 2..6, p 1..3, c -4..5, s = ±1) it admits **exactly one** tuple, p=1 c=-4 s=+1,
next term -69. The nineteen came from letting the multiplier run unbounded, which is not
our generator and never was — pick a wider p window and the count rises with it (I get 25
over -12..12), which is the tell that the quantity being counted was the window, not the
ambiguity.

The degeneracy is real but conditional, and worth writing down because it is the actual
mechanism: for both three-parameter families, eliminating c and s leaves eq3 linear in the
multiplier with coefficient `t2 + t0 - 2*t1`. That is zero exactly when the first three
terms are in arithmetic progression — and only then does every multiplier fit. `3, -1, -5`
is such a run. Our windows clip it to one solution anyway.

### The numbers

| population x fit space | prompts | ambiguous |
|---|---|---|
| ours x SPACE A — our own windows | 7,638 | **14 (0.2%)** |
| ours x SPACE B — generalized | 7,638 | 453 (5.9%) |
| ours x **SPACE C — generalized, multiplier keeps its sign** | 7,638 | **187 (2.4%)** |
| QuantProf's 652 x SPACE B, same instrument | 543 reproducible | 18 (3.3%) |
| QuantProf's 652 x **SPACE C**, same instrument | 471 reproducible | **4 (0.8%)** |

SPACE A is a self-consistency check: does our own rule set pin a unique fifth term. The
generalized spaces are the ones that decide shipping, because a candidate does not know our
windows — same family FORMS, generous integer windows (offsets -60..60), stated in the script.

**Read the C row, not the B row, and the difference between them is the methodological
point.** B lets the multiplier run negative, which fits `1, 2, 4, 8` as
`ratio-linear-offset` at p=-2 — a multiplier stepping -2, -1, 0, 1 — and `1, 3, 9, 27` at
p=-3. A rule whose multiplier passes through zero is not a rule anyone states; it is the same
unconstrained-fitter defect `interleaved` is excluded for, in smaller doses. C keeps every
other window generous and only requires the multiplier to hold the sign our generator uses.
It **halves both numbers**, which is the measure of how much B was counting fits nobody would
defend. B is left in the script and the table as the conservative upper bound.

**Ours at 2.4% against theirs at 0.8% under the identical instrument.** Same order of
magnitude, and both small. Four-term display is not a standard we uniquely fail; it is one
QuantProf does not fully meet either, on a bank that ships four terms commercially. Their
prompts also fall largely outside our windows — 80.4% under SPACE A, since their geometric
ratios reach x5 and x7 against our r in 2..4 — which answers the "their ranges are narrower"
hypothesis *no*: they are not narrower, they are different, and under a common instrument the
two banks land close together.

### One structural exclusion, and it is not a judgement call

**`interleaved` cannot ship at four terms.** Each of its two streams holds two points, a
straight line through two points always exists, so it matches EVERY four-term prompt and
predicts `2*t2 - t0` regardless. That is precisely the defect the existing solver-ambiguity
gate already names for cubics — "four points always admit one exactly, so a degree-3 fitter
matches everything and proves nothing". Left in the fit space it alone drove SPACE B to 100%
ambiguity on thirteen of sixteen families, and left in the population it was 97,920 of the
105,558 reachable tuples. It is excluded from both, and the exclusion is the finding, not a
convenience.

### What the 14 stragglers are

All fourteen printed under `--stragglers`. Every one is a **between-family** clash, the class
`[[quantprep-four-term-sequences]]` already says a rejection loop fixes:
`4, 6, 10, 16` (quadratic 24 against fiblike 26 — the case already pinned in the existing
gate's test), `3, 5, 8, 13`, and twelve `ratio-linear-offset` against `mult-plus-linear`
collisions. **Zero are within-family underdetermination**, which was the stated blocker.

### The ruling this implies — **TAKEN 2026-08-24, SHIPPED**

Implemented, with one change from the recommendation below: `interleaved` is kept and shown at
**five** terms rather than dropped from the draw. Term count already varied by family, and
losing a pattern family to a display change was the worse trade. It is still excluded from the
FIT space, which is the part that was structural.

Shipped as: `packages/generators/src/seq-ambiguity.ts` (the SPACE C fitter and the solver rules,
in ONE module so the redraw loop and the gate cannot drift), a redraw loop in
`sequenceItemOfFamily`, and a gate asserting no shipped prompt admits a next term other than its
own answer — strictly stronger than the tripwire it replaced. Both were watched failing.

One caveat on the numbers below, recorded because it bounds what was measured: SPACE A mirrors
the generator's bounds at the **widest difficulty per axis**, so the population is a union across
tiers and is unweighted, while shipping draws weighted by `SEQ_WEIGHTS` per tier. The 0.2%/2.4%
are therefore not the shipped rate. The redraw loop does not depend on them being exact.

The original recommendation, for the record — four-term display looks shippable behind two
changes: drop `interleaved` from the four-term
draw, and add a generation-time rejection loop that redraws when the SPACE B fitter returns
more than one next term. 2.4% rejection is cheap. **Not implemented** — the tripwire in
`packages/generators/test/sequences.test.ts` still asserts the block, and reversing a landed
ruling is a decision rather than a fix. The measurement is what was asked for; the reversal is
the next call to make.

---

## B12 — TEN TEMPLATES, FINANCE AND STATISTICS DOUBLED (2026-08-23)

Bank **215 -> 220** across two commits, `bf1a0ab` (finance) and `98a0a6b` (statistics). Both
families were five templates, thinner than a single sitting; both are now ten. No new wiring —
both topics were already in every gate scope, which is why this was worth more than opening
Pure Math as a sixth thin family.

**Finance (b12a):** payment-stream-present-value, put-hedge-from-parity, covered-call-max-profit
(L2), call-lower-bound-arbitrage, box-spread-arbitrage (L3).
**Statistics (b12b):** adjusted-r-squared-from-sums (L3), duplicated-sample-slope-variance,
overlapping-window-sums, reverse-regression-slope, sample-size-for-margin (L2).

**Measuring the draw space first killed the obvious finance design.** A coupon bond's full
price scores **3 distinct answers against a floor of 12** — bond prices sit within a few percent
of par whatever the curve does, so the space collapses under the transitive merge rule. The
payment stream alone scores 56, teaches the same technique, and its last solution step names
the principal leg that would make it a bond. The same probe showed a half-cent grid on the
curve drops the count to 9 where whole cents give 56: the count is carried by the payment size
and the three-or-four-year term, not by the curve's fine structure.

**Two gates caught things no amount of reading would have.**

1. `\Delta` is not in the printed-precision command allowlist, so the parity relation reports
   unevaluable rather than being quietly accepted. Written with a plain `D` it passes.
2. **A float boundary made an answer wrong, not just imprecise.** At a multiplier of 1.96, a
   spread of 5 and a margin of 0.7, the ratio is exactly 14 in real arithmetic and
   14.000000000000002 in floats; squaring lands a hair above 196 and a bare `Math.ceil` returns
   197. That is one measurement too many, and it would have graded a correct 196 as WRONG on 6
   of 392 draws. The template now rounds at the ninth decimal before rounding up. **Any template
   whose answer passes through a ceiling or a floor needs this** — rounding is not cosmetic when
   an integer boundary is what the answer is made of.

**Every answer is reached twice.** The independent Python routes avoid the identity each
template teaches: backward induction through implied forward factors, a Black-Scholes world
constructed to have the quoted call delta, payoff grids for the three option structures, a data
set constructed to HAVE the given sums of squares and then actually regressed, the doubled
design matrix inverted rather than a factor of two applied, indicator vectors for the two
windows, the implied covariance matrix refitted both ways, and an upward scan for the smallest
sample size. All ten were mutation-checked: a 2% perturbation is caught 25/25 by both routes.

**Three defects shipped and were fixed in `8d0f0cb`, and all three are one species:** every
gate checks that the printed numbers are consistent with each other, and none checks that the
question and the answer are the same question.

1. `duplicated-sample-slope-variance` asked for *the variance of the fitted slope* on the
   doubled data — which does not change, since duplicating rows leaves the same estimator on the
   same information. What halves is what the standard formula REPORTS once it takes 2n dependent
   rows as independent. The solution, key insight and common trap all said this correctly while
   the question asked for the opposite, so a careful candidate would have been graded wrong.
   **The Python counterpart could not catch it** — it inverts the doubled design matrix and so
   shares the template's independence assumption. That is verification-gate-lessons species 4, a
   checker measuring the wrong population, and it is the first time in this repo the independent
   route has been wrong in the same direction as the template.
2. `sample-size-for-margin` graded on rel 0.005, which at an answer of 1000 accepts 995 — and
   995 measurements provably leave the interval wider than the question asks for. **A template
   whose answer is a COUNT needs `abs: 0`, not a relative band**, the same family of lesson as
   the ceiling above. The exact-count pin in `registry.test.ts` moves 27 -> 28.
3. `overlapping-window-sums`' sanity step counted `a+b` distinct days where there are
   `a+b-ov`. Followed literally it gives `v(a+b+3ov)`: 72 against the true 64 at a=7, b=5, ov=2,
   v=4. Only a human reading the rendered sentence finds this one — the prose-claim there
   asserts the answer beats the disjoint case, which stays true either way.

**The in-flight rewrite is finished and landed as `848007c`** — bank 220 -> 221. What it needed,
recorded because the same shape will recur whenever a shipped template is restyled:

- **A renamed derived key breaks two things silently.** `verify.py` requires every derived key
  to be re-derived in Python, and a stale key name there raises `KeyError` at import — which
  aborts the gate for the WHOLE bank, not just that template. `favourable`/`outcomes` and
  `numer` were renamed in the templates only; the prose claims reading them returned `undefined`
  and crashed on `toPrecision`.
- **Dropping a parameter axis is a draw-space change, not a prose change.** Both symmetry
  templates went from three axes to two and fell to 57 and 62 distinct texts per 100 against a
  floor of 70. `disjoint-subsets` deleted the very comment that explained why its third axis
  existed. Restored: 92 and 84.
- **A changed question needs a version bump.** `comparing-heads-counts` now asks a different
  question (equal flip counts and a lead, rather than unequal counts and a draw count), so it is
  `version: 2`; stored attempts carry `problemVersion` and would otherwise be attributed to a
  question that no longer exists. Its equal-flip framing is correct, and the header comment
  recording WHY — the B7 exchangeability trap — is back, since deleting it is how that error
  returns.
- `median-of-three` was sound but registered nowhere, so no gate could see it. It now draws its
  spin count over {3,5,7} rather than fixing it at three: the reflection argument never counts
  the spins, so any odd number gives the same mean, and the axis buys the draw space its third
  dimension at the same time.
- **Two chains written while finishing this drifted at display precision** — `10 x 2 x 0.3953`
  renders 7.906 against an answer of 7.905. Same rounded-operand trap as ever. Both steps now
  state the product rather than chaining it, with the exact-integer form one step above.

**How it arrived.** Through this session another agent was editing the same
working tree — `symmetry/comparing-heads-counts.ts` (rewritten to the equal-flip-counts version
of the "who leads" question), `symmetry/disjoint-subsets.ts`, `ev-variance/chord-crossings.ts`,
and a new untracked `ev-variance/median-of-three.ts`. It stopped at 08:04 and left that work red.
**None of it is in either B12 commit** — both were staged path by path rather than with
`git add -A`, so each pushed tree was green on its own. It was finished separately in `848007c`,
above.

---

## FIRM TRACKS — shipped 2026-08-23 (morning)

The landing page had advertised "firm tracks · market-making game" as coming next — the same
line that advertised the probability bank for weeks after it shipped. Half of it is now real.

**No new data.** Every one of the 210 templates already carries `firms: [{firm, weight}]`, and
the walkthrough already printed those slugs as "seen at". A track is that tag used as a filter:
`problemsFor(topic, difficulty, firm)`, a `FIRMS` list derived from the tags (most-covered
first, so a new slug appears in the UI the moment a template names it), and a third chip row on
the bank page. 14 firms, jane-street 67 down to millennium 16; every template is tagged, so no
track is empty. The `weight` field is still read by nothing — it was unused before this and the
picker starts at a random offset, so sorting by it would not change what you see.

**The check.** `app/drills/probability/page.test.tsx` pins `Math.random` so the picker is
deterministic, then walks every firm chip and asserts the problem on screen is in that firm's
pool — once unfiltered, once intersected with L3. Both were watched fail: dropping the `firm`
prop the page passes makes them report `imc track showed bayes/base-rate-test`.

**Not done, deliberately:** no URL state (`?firm=`), because topic and difficulty are local
state too and a link-shareable track is a different feature. Gates: 456 tests / 29 files green,
`tsc --noEmit` clean, `next build` clean, and the page was opened in a browser — the firm row
wraps to two lines at 760px and reads fine.

---

## SESSION OF 2026-08-23 (overnight) — READ THIS FIRST

`main` is at the `fix(nav)` commit; everything below in this section is landed, pushed and
green. Bank went **191 -> 210** and the site gained two whole families.

**Content — four batches, twenty templates, all L2/L3.**

- **B8, five combinatorial-game brainteasers** (`brainteasers/logic`, 11 -> 16):
  chocolate-bar-breaks and mutilated-board-tiling as choice templates, plus
  josephus-every-second, coin-row-take-ends and nim-three-pile-move.
- **B9, a new `statistics/` family** (5 templates): portfolio-variance-two-asset,
  min-variance-weight, correlation-bound-third-pair, regression-slope-from-moments,
  sharpe-time-scaling.
- **B10, a new `finance/` family** (5 templates): book-overround-arbitrage,
  triangular-fx-arbitrage, put-call-parity, growing-perpetuity-value,
  butterfly-max-profit.
- **B11, four more brainteasers** (16 -> 20): painted-block-one-face,
  divisor-count-factorisation, average-speed-round-trip, bird-between-trains.
  Brainteasers are QuantGuide's second-biggest category (246 to our 20) and cost
  no new wiring, so they are the cheapest remaining coverage.

**Two new families means two new prefixes.** `registry.test.ts` now pins four:
`probability/`, `brainteasers/`, `statistics/`, `finance/`. Each new topic was added to the
draw-space, printed-precision and prose-claims scopes, given a `TOPIC_LABELS` entry, and
given its own solver module (`verification/solvers/statistics.py`, `finance.py`).

**The QuantGuide harvest contradicts COVERAGE.md's difficulty-mix premise.** See
`../quantguide-2026-08/FINDINGS.md`. 323 pages scraped, 265 unlocked: their mix is
**41/40/18** Easy/Medium/Hard against our 27/48/25 on a three-level scale needing no
mapping. The "easy tier is 2.5x overweight, 130 more L2/L3 templates needed" reading rests
on QuantProf's 1-10 scale mapped to thirds. The obvious objection — platforms unlock easy
questions — was tested against their playlist cards, which show a difficulty on locked rows
too: the locked half is the *easier* half (47% Easy against 37%). COVERAGE.md now carries a
SUPERSEDED banner pointing here. **Author L2/L3 because it is worth more to a candidate, not
to chase a ratio two outside banks disagree about by a factor of two.**

**Two UI fixes.** The landing page advertised the probability bank as "coming next" while 191
problems shipped behind it, and omitted `/drills/probability` and `/drills/missing-operand`
entirely; counts are now derived from `PROBLEMS` so it cannot go stale again. And advancing
past a walkthrough was bound to Enter and nothing else — no route at all on a touch device —
so there is now a "Next problem" button, with a test that was watched fail without it.

**Whole-bank mix is now 27/48/25 at n=210** (probability-only 31/46/23 at n=180), recomputed
from `PROBLEMS`. Every one of the twenty templates added this session is L2 or L3.

**New tool: `tools/probe.ts`.** The draw-space gate helpers in a plain tsx script, so a
template's tuple count, texts/100, maxRepeat and either distinct@band or per-option shares
can be measured *while drafting*. Every batch before this re-derived that harness by hand.
`npx tsx tools/probe.ts <id-fragment>`; no argument probes the whole bank.

**Three authoring lessons this session, worth the read before B11:**

1. **Measure the parameter space before writing prose.** Probing is why the statistics
   templates quote variances and a covariance as integers rather than standard deviations and
   a correlation: it keeps every printed term exact. It also showed two templates could
   produce an answer of 1e-17, which at rel 0.005 is exact-equality grading and outside the
   emitter's decimal-safe window — hence their answer-floor constraints.
2. **A new topic must contribute at least one claim-free segment.** `printed-precision.test.ts`
   asserts the partition per topic, and a topic whose every math segment is arithmetic fails at
   zero. Stating the formula symbolically before plugging numbers in satisfies it and reads
   better anyway.
3. **The gates caught a false prose claim, not just a false number.** "Parity gives the call
   and the put the same time value" is the textbook line for zero rates and is false on every
   draw here — they differ by the strike times one less the discount factor. No amount of
   arithmetic checking would have found it; the prose predicate did.

**Both of those long-open rulings are CLOSED as of 2026-08-23 (`0408723`).**
`distributions/hypergeom-exact-draw` is L2 — its own sibling `hypergeom-zero-successes` is
already L2 at 55s and is the degenerate k=0 case of the same formula, so the general case
cannot rank below it; see COVERAGE.md for the full reading and why it is not L3. And
`optiver-80in8` KEEPS its slug: a slug is an identifier, persisted in `test_sessions.preset`
and in every visitor's localStorage, and renaming it would drop their own sim history off the
stats chart to fix something only the URL shows. The titles carry the truth instead — ours is a
free-entry numerical sprint, and the multiple-choice preset is the one that is actually
Optiver's.

**A leaderboard bug turned up while checking that ruling.** 0003's canonical CTE listed only
`optiver-80in8` and `sequences-sprint`, so the join discarded every multiple-choice session and
that preset could never rank. `0004_leaderboard_mc_preset.sql` recreates the view with it
added; everything below the CTE is byte-identical to 0003, which `diff` confirms.

**APPLIED to the live project 2026-08-23**, over the shared pooler
(`aws-0-ca-central-1.pooler.supabase.com:5432`, user `postgres.<ref>`) — the dedicated host is
IPv6-only and resolves nowhere from an IPv4 network, and psql's password prompt hangs in a
runner with no TTY, so `PGPASSWORD` in the environment is the working route. Verified two ways,
because one of them cannot see what it needs to: over REST the view is anon-readable (200) and
the exposure surface is unchanged — `user_id`, `target_firms`, `duration_s`, `merged_from_local`
and `total` each still return 400 / 42703 — but REST **cannot** confirm the canonical list
changed, since filtering an empty board on the new preset returns `[]` under the old view too.
The check that settles it reads the view's own definition:
`select definition ilike '%optiver-mc-80in8%' from pg_views where viewname='leaderboard'`
returns `t`.
**Newly open:** Pure Math is QuantGuide's other zero for us — 60 of theirs, and the strand
that matters is martingales and optional stopping. The raw QuantGuide prompts are in the
gitignored `.firecrawl/qg/.firecrawl/` (323 files); re-scraping costs a credit each, so look
there first.

---


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

- ~~Apply `supabase/migrations/0003_leaderboard.sql`~~ **— APPLIED 2026-08-22.**
  Run against the live project over the *shared* pooler
  (`aws-0-ca-central-1.pooler.supabase.com:5432`, user `postgres.<ref>`) —
  `db.<ref>.supabase.co` is IPv6-only and resolves nowhere from an IPv4-only
  network, which is what the dedicated-IPv4 add-on sells and the shared pooler
  gives away. Verified from outside: anon gets 200 on the view, and each of
  `user_id`/`target_firms`/`duration_s`/`merged_from_local`/`total`/`created_at`
  returns 400 "column does not exist", so the five-column exposure surface holds.
  The board is empty and will stay so until a session clears
  `not merged_from_local` with a canonical `total`/`duration_s` — nothing has
  ever flowed through it in prod. RLS on the base tables remains unverified from
  outside; it needs `pg_class.relrowsecurity` via psql.
- ~~The difficulty mix~~ **— scoped, ruled on and landed 2026-08-22.**
  Probability-only is now 31/46/23 (was 34/42/23). The mass re-tag the earlier
  draft proposed was never available: per topic the pace ladders are clean, so
  the L1 tier is genuinely easy and promoting it would have moved the ratio
  without making anything harder. What landed instead: five promotions on a
  content-derived criterion, and a full re-derivation of the `ruin` ladder
  (8/8/4 → 4/12/4) whose L1/L2 split had never been derived from anything.
  `distributions/hypergeom-exact-draw` is the one open thread — it did not
  survive the criterion and stays L1, pending a human second reader.
  Do not chase 16%; see `COVERAGE.md` for why that is false precision.
- ~~Four-term sequence display~~ **— tried and reverted 2026-08-22; the blocker is
  not the answer checker.** At four terms `ratio-linear-offset`, 47% of the hard
  tier, is underdetermined within its own parameter range: the drawn prompt
  `3, -1, -5, -17` fits every multiplier from -6 to 12, nineteen different next
  terms, none preferable. "Accept any consistent rule" would mean accepting
  nineteen numbers. A tripwire test now fails if anyone shortens the term count.
  What would actually unblock it is a measurement, not code — sweep their 652
  harvested four-term prompts in `sequences.txt` and count how many admit more
  than one next term. See `COVERAGE.md`.
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
