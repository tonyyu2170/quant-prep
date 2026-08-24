# Fermi / calibration estimation game — design

**Date:** 2026-08-24
**Status:** approved in brainstorming, not yet planned
**Origin:** sub-project 2, deferred on the record in
`2026-08-24-market-making-game-design.md` §9.

---

## 1. What this is, and what it is not

A game in which the player decomposes an unknown real-world quantity into factors, states a
90% confidence interval on each, and is scored on whether their stated confidence matches how
often they are actually right.

It trains **two** skills that are usually conflated:

- **Decomposition** — breaking an unknown into a product of estimable factors. The thing an
  interviewer is actually watching.
- **Calibration** — knowing what you do not know. Whether your 90% really means 90%.

It is **not** the market-making game with different content. That game scores `CAP − width`,
where trading width against risk is the whole decision. Here the player *declares* a confidence
level, so the scoring rule must be one under which stating your honest belief is optimal (§4).
Reusing the market rule would be both duplicative and gameable.

It is also **not** a general trivia bank. The content is parameterised (§5), because static
Fermi items do not replay.

## 2. Decisions taken, with their alternatives

| Decision | Chosen | Rejected, and why |
|---|---|---|
| Skill trained | Decomposition **and** calibration | Either alone: order-of-magnitude speed drills is closest to existing drills but teaches least; calibration alone leaves the interview skill untrained |
| Who builds the chain | Player invents it, canonical chain revealed after | Game supplies named factors — richest feedback, but removes the invention that is the actual interview skill |
| Where uncertainty is stated | An interval on **every** factor | One interval on the final answer only — simpler and avoids §3 entirely, but the per-factor reveal ("which factor carried your error") is most of the teaching |
| Combining intervals | Closed-form lognormal (§3) | Endpoint multiplication (wrong); asking for 0.9^(1/n) per factor (correct, unusable) |
| Scoring | Interval/Winkler score in log space (§4) | The market game's `CAP − width` — gameable, and would make the two games one game |
| Content shape | Cited data tables × question templates (§5) | Static authored items — do not replay, and are spent before calibration can report |
| Persistence | `localStorage` from v1 | Stateless like the market game — calibration is meaningless under ~50 answers |

## 3. Combining the intervals — the part that must be right

The player states `[lo, hi]` per factor, meaning "90% sure the truth is in here". Treat that as
the 90% range of a lognormal:

**Everything is in log10, one base throughout.** An earlier draft of this spec fitted in natural
log and scored in log10, which is the kind of mismatch that produces a plausible-looking answer
that is wrong by a factor of ln(10) = 2.303. If `X` is lognormal then `log10(X)` is normal, so the
normal quantile is unchanged and nothing is lost by picking the base the scoring needs:

```
mu_i    = (log10 lo_i + log10 hi_i) / 2
sigma_i = (log10 hi_i - log10 lo_i) / (2 * 1.6449)     1.6449 = z(0.95)
```

**The product of independent lognormals is exactly lognormal**, so the combined interval is
closed-form — no simulation, no sampling noise, and a Python counterpart that is four lines:

```
mu    = sum(mu_i)
sigma = sqrt(sum(sigma_i^2))
interval = [10 ** (mu - 1.6449*sigma), 10 ** (mu + 1.6449*sigma)]
```

**Why this is the centrepiece rather than an implementation detail.** Multiplying the endpoints
gives a log-width of `sum(w_i)`. Combining correctly gives `sqrt(sum(w_i^2))`. Uncertainty adds
**in quadrature, not linearly** — because independent errors do not all point the same way. For
five equally uncertain factors the naive interval is `5w` against a true `2.24w`: too wide by a
factor of 2.24.

So the reveal does not assert that estimators over-widen compound estimates; it shows the player
their own two numbers side by side. That is the single most transferable thing in the game, and
it falls out of doing the statistics correctly rather than being bolted on.

**The independence assumption is real and is stated to the player**, not hidden: correlated
factors (a city's population and its number of households) break it. v1 assumes independence and
says so in the reveal. See §10.

## 4. Scoring

**Per question — the interval score (Winkler), computed on log10 values:**

```
alpha = 0.10;   y, lo, hi are log10 of truth and of the player's combined interval

S = (hi - lo)                      width, always paid
  + (2/alpha) * (lo - y)   if y < lo
  + (2/alpha) * (y - hi)   if y > hi

lower is better; S >= 0
```

Two properties earn it:

1. **It is a proper scoring rule.** Expected score is minimised by reporting your true 90%
   interval. A calibration trainer whose optimal strategy is anything other than honesty is
   training the wrong thing.
2. **Log space makes questions comparable.** Fermi answers span orders of magnitude. In absolute
   units one "US GDP" question would swamp fifty others; in logs, width and miss are both
   measured in orders of magnitude and every question weighs the same.

**Per session:** hit rate, median log-width, median log-error of the interval centre. These
separate two failure modes with opposite fixes, and a bare score distinguishes neither:

- hit rate well under 90% → **overconfident**, widen.
- hit rate at 100% with multi-order widths → **underconfident**, tighten; you know more than you
  are admitting.

**Decomposition feedback** is separate and per-factor: the player's estimate against the cited
value, in log units, so the reveal names *which* factor carried the error. Being two orders off
on "pianos per household" is a different lesson from an arithmetic slip.

**Calibration is a cross-session statistic.** Hit rate over 12 questions is 9 +/- 1 — noise. The
headline number stays hidden until **`CALIBRATION_MIN_ANSWERS = 50`** have accumulated, and says
so rather than reporting a number that cannot mean anything yet. 50 is chosen so the standard
error on a 90% hit rate is about 4 points (`sqrt(.9*.1/50)`), which is small enough that a
genuinely overconfident player (70%) separates from a calibrated one. Like `CREDIT_CAP`, it is a
tuning constant and should carry its derivation beside it.

## 5. Content — cited tables x templates, not static items

**Static Fermi items do not replay.** The whole repo is parameterised templates precisely so
drilling never runs out. Once you have seen "piano tuners in Chicago" it is dead. Forty authored
items give forty plays, and calibration needs ~50 answers — so a static bank is spent *before it
can report the number it exists to report*. That is structural, not a volume problem.

Instead:

- **A cited data table.** e.g. ~60 world cities: name, population, one source, one retrieval date
  for the whole table.
- **Question templates** over it: *"How many ⟨profession⟩ are there in ⟨city⟩?"*, each carrying a
  canonical chain whose factors reference the table plus a small number of cited rates.

This yields hundreds of reachable items from one auditable data layer, restores replay, and
collapses authoring from per-item research to per-table research. It also makes the citation gate
tractable: one table, one source, one date — not 200 loose citations.

**v1 scope: 2–3 templates over 1–2 tables, ~200 reachable items.**

## 6. Staleness — smaller than it looked

§9 of the market spec flagged staleness as a reason this needed its own design. Under log-scale
scoring it mostly evaporates: a population drifting 5% is 0.02 log units, and even 30% drift is
0.11, against interval widths around a full order of magnitude. **The noise the player is scored
on exceeds the data drift by an order of magnitude.**

So the policy is cheap and honest: a retrieval date per table, a gate that fails when a table is
older than 24 months, and no pretence of precision that log-scale scoring cannot see.

## 7. Verification — differently checked, not exempt

The worry in market spec §9 was that this content needs an exemption from `verify.py`, weakening
the repo's verification story. It does not, and the reason is mechanical: **every existing content
gate keys off the `PROBLEMS` array** (27 references across the gate tests), including `emit.ts`,
which is what feeds `verify.py`. Content that is not in `PROBLEMS` is outside those gates by
construction. `verify.py`'s rule — every problem ships with a Python counterpart — stays fully
intact for `PROBLEMS`.

This is therefore a **second content type with its own registry and its own gates**, not a hole in
the first one. Three gates replace what `verify.py` does here:

1. **The two-route cross-check.** Each canonical chain's factors must multiply to the
   separately-cited total **within 0.2 log10 units** (a factor of ~1.6). The total is cited
   independently of its factors, so two sources agreeing is real evidence — the same shape as
   `verify.py`'s two-route rule, and the gate that fails if a cited number is wrong or a chain is
   mis-specified. 0.2 is provisional and **must be measured before it is fixed**, exactly as
   `CREDIT_CAP` was: author the first two chains, look at the actual agreement, then set it. A
   tolerance loose enough that nothing ever fails it is not a gate.
2. **Citation integrity.** Every cited value carries a source and a retrieval date; no table older
   than 24 months (§6).
3. **The mathematics has a Python counterpart.** The lognormal fit, the quadrature combination and
   the interval score are pure functions with no real-world input. They are cross-checked in
   Python exactly like everything else in the repo — the closed form of §3 makes this exact rather
   than statistical.

What remains genuinely unverifiable is small and bounded: whether a cited real-world value is
true. That is a sourcing question, and gate 1 is what constrains it.

## 8. Session shape

- Statement, then the player builds a chain: add factors, each a label and a `[lo, hi]`.
- Submit → the combined interval (§3), the truth, the interval score, and **both** widths: the
  naive endpoint product against the correct quadrature combination.
- Then the canonical chain side by side, per-factor log error.
- Session end: hit rate, median log-width, median centre error, and the named failure mode.
- Calibration history in `localStorage`, headline hit rate withheld under ~50 answers.

No navigation between estimating and settlement; the area resolves in place, as the market runner
does.

## 9. Files

```
packages/engine/src/calibration.ts        lognormal fit, quadrature combination, interval score
packages/engine/test/calibration.test.ts  each branch, plus the quadrature-vs-naive claim
content/fermi/tables/*.ts                 cited data tables: value + source + retrievedAt
content/fermi/templates/*.ts              question templates + canonical chains
content/fermi/index.ts                    the second registry — deliberately NOT PROBLEMS
content/fermi/fermi.test.ts               the three gates of §7
verification/solvers/calibration.py       Python counterpart for the §3/§4 mathematics
components/FermiRunner.tsx                chain entry, in-place settlement, reveal
components/CalibrationCurve.tsx           stated confidence vs actual hit rate
app/game/estimator/page.tsx               the route
```

Per the repo's standing rule, **every new gate is watched failing before it is trusted**.

## 10. Not in v1 — deferred deliberately

- **Correlated factors.** v1 assumes independence and tells the player so. Modelling correlation
  needs a covariance the content would have to author per chain, and the lesson of §3 lands
  without it.
- **Supabase persistence and a calibration leaderboard.** Same reasoning as the market game:
  local first, persist once the scoring has survived contact with real play.
- **Player-authored chains as content.** Interesting, unverifiable, out of scope.

## 11. Risks

- **Content authoring is still the expensive part**, even collapsed to tables. The cited rates in
  each canonical chain ("pianos per household", "tunings per tuner-day") are per-template research
  and have no table to hide in. Mitigation: hold v1 to 2–3 templates and find out what one costs
  before committing to more.
- **Free-form chain entry is a UI problem**, not a scoring one. A player who enters two factors and
  one who enters seven both get a valid combined interval, but the canonical comparison is only
  legible when the chains are roughly commensurable. Unresolved; the mockup should be built before
  the runner.
- **~50 answers before the headline number appears** is a long runway for a player to stay engaged
  without the thing the game is for. Per-session feedback has to carry it alone until then.
- **Independence is often false** in exactly the decompositions players reach for, which makes the
  combined interval too narrow. Stated to the player rather than silently applied.
