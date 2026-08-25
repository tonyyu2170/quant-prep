import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { answerOf, drawParams, grade } from "@qp/engine";
import { PROBLEMS, byId, problemsFor } from "./index";
import { MARKET_TEMPLATES } from "./market";

describe("problem registry invariants", () => {

  it("every non-choice template is playable in the market game", () => {
    // MARKET_TEMPLATES is derived so it cannot drift out of sync — but the COUNT can fall,
    // and a sudden drop is how we would learn that a batch shipped as choice templates by
    // accident. The floor tracks the REAL count rather than an old one: 219 was pinned at a
    // bank of 224 and was 25 too loose by the time the bank reached 249.
    //
    // 249 is EXACTLY the count at a bank of 254 with 5 choice templates, and the exactness is
    // deliberate: at zero slack this fires on the next choice template, forcing whoever adds
    // one to come here and say so. That is the same discipline the per-topic counts above use
    // (toBe, not a floor). A loose floor detects nothing, which is what the last one did.
    expect(MARKET_TEMPLATES.length).toBe(PROBLEMS.length - PROBLEMS.filter((t) => t.choices).length);
    expect(MARKET_TEMPLATES.length).toBeGreaterThanOrEqual(290);
  });
  it("has unique ids and topic-prefixed ids", () => {
    expect(new Set(PROBLEMS.map((t) => t.id)).size).toBe(PROBLEMS.length);
    // Five families now: probability/*, brainteasers/*, statistics/*, finance/* and
    // pure-math/*. The prefix is still pinned — an id must declare which family it belongs
    // to — but none of the other four is a probability sub-topic.
    const FAMILIES = ["probability/", "brainteasers/", "statistics/", "finance/", "pure-math/"];
    for (const t of PROBLEMS) expect(FAMILIES.some((f) => t.topic.startsWith(f)), `${t.id}: unknown topic family "${t.topic}"`).toBe(true);
  });
  // `firms` is a free-form string rendered raw to users at ProblemRunner.tsx. Two spellings of one
  // firm (`sig`/`susquehanna`, `flow`/`flow-traders`) shipped before this guard existed.
  it("firm tags come from the canonical slug set, with no firm listed twice", () => {
    const CANON = new Set([
      "akuna", "citadel", "citadel-securities", "de-shaw", "drw", "flow", "hrt",
      "imc", "jane-street", "jump", "millennium", "optiver", "sig", "two-sigma",
    ]);
    for (const t of PROBLEMS) {
      const slugs = t.firms.map((f) => f.firm);
      for (const s of slugs) expect(CANON.has(s), `${t.id}: unknown firm slug "${s}"`).toBe(true);
      expect(new Set(slugs).size, `${t.id}: duplicate firm in ${slugs.join(",")}`).toBe(slugs.length);
    }
  });
  it("every problem draws, derives, and answers finitely across 50 seeds", () => {
    for (const t of PROBLEMS) {
      for (let seed = 0; seed < 50; seed++) {
        const p = drawParams(t, seed);
        const d = t.derived(p);
        expect(Object.keys(d)).toContain(t.answerKey);
        expect(Number.isFinite(answerOf(t, d))).toBe(true);
        expect(t.statement(p, d).length).toBeGreaterThan(20);
        expect(t.solution(p, d).length).toBeGreaterThanOrEqual(3);
        expect(t.expectedPaceS).toBeGreaterThan(0);
      }
    }
  });
  it("choice templates declare usable labels and an in-range integer answer", () => {
    // `choices` is a new user-visible text surface that printed-precision and prose-claims do
    // not walk — they scan `statement` and solution bodies. Number-free labels keep it out of
    // the traceability problem entirely rather than teaching those gates a new field.
    for (const t of PROBLEMS.filter((x) => x.choices)) {
      const labels = t.choices!;
      expect(labels.length, `${t.id}: needs at least two options`).toBeGreaterThanOrEqual(2);
      expect(labels.length, `${t.id}: ChoiceGrid keys off 1-4`).toBeLessThanOrEqual(4);
      expect(new Set(labels).size, `${t.id}: duplicate labels`).toBe(labels.length);
      for (const l of labels) {
        expect(l.trim().length, `${t.id}: empty label`).toBeGreaterThan(0);
        expect(l, `${t.id}: label "${l}" contains a digit — labels must be number-free`).not.toMatch(/\d/);
      }
      // Exact grading: a 1-based index has no meaningful neighbourhood.
      expect(t.accepted.tolerance, `${t.id}: choice problems grade exactly`).toEqual({ abs: 0 });
      for (let seed = 0; seed < 50; seed++) {
        const a = answerOf(t, t.derived(drawParams(t, seed)));
        expect(Number.isInteger(a) && a >= 1 && a <= labels.length,
          `${t.id} seed ${seed}: answer ${a} outside 1..${labels.length}`).toBe(true);
      }
    }
  });
  it("filters by topic and difficulty", () => {
    const bayes = problemsFor("probability/bayes").length;
    const counting = problemsFor("probability/counting").length;
    const ev = problemsFor("probability/ev-variance").length;
    const distributions = problemsFor("probability/distributions").length;
    const ruin = problemsFor("probability/ruin").length;
    const geometric = problemsFor("probability/geometric").length;
    const markov = problemsFor("probability/markov").length;
    const symmetry = problemsFor("probability/symmetry").length;
    const brainteasers = problemsFor("brainteasers/logic").length;
    const statistics = problemsFor("statistics/moments").length;
    const estimation = problemsFor("statistics/estimation").length;
    const inference = problemsFor("statistics/inference").length;
    const options = problemsFor("finance/options").length;
    const arbitrage = problemsFor("finance/arbitrage").length;
    const fixedIncome = problemsFor("finance/fixed-income").length;
    const stochastic = problemsFor("pure-math/stochastic").length;
    const linearAlgebra = problemsFor("pure-math/linear-algebra").length;
    const numberTheory = problemsFor("pure-math/number-theory").length;
    const solidGeometry = problemsFor("pure-math/solid-geometry").length;
    expect(bayes).toBe(30);
    expect(counting).toBe(27);
    expect(ev).toBe(35);
    expect(distributions).toBe(28);
    expect(ruin).toBe(20);
    expect(geometric).toBe(21);
    expect(markov).toBe(8);
    expect(symmetry).toBe(12);
    expect(brainteasers).toBe(23);
    expect(statistics).toBe(17);
    expect(estimation).toBe(15);
    expect(inference).toBe(3);
    expect(options).toBe(14);
    expect(arbitrage).toBe(7);
    expect(fixedIncome).toBe(5);
    expect(stochastic).toBe(10);
    expect(linearAlgebra).toBe(6);
    expect(numberTheory).toBe(8);
    expect(solidGeometry).toBe(6);
    expect(bayes + counting + ev + distributions + ruin + geometric + markov + symmetry + brainteasers + statistics + estimation + inference + options + arbitrage + fixedIncome + stochastic + linearAlgebra + numberTheory + solidGeometry).toBe(PROBLEMS.length);
    expect(problemsFor("probability/bayes", 1).every((t) => t.difficulty === 1)).toBe(true);
    expect(problemsFor("probability/counting", 1).every((t) => t.difficulty === 1)).toBe(true);
    expect(byId.get("bayes/base-rate-test")).toBeDefined();
    expect(byId.get("counting/committee-selection")).toBeDefined();
  });
  it("geometric stays inside its 8/8/5 difficulty budget", () => {
    // L3 widened by one for unit-square-product: the hyperbolic region needs a real integral
    // rather than an area ratio, which is a tier above the rest of the batch.
    const geo = PROBLEMS.filter((t) => t.id.startsWith("geometric/"));
    expect(geo.filter((t) => t.difficulty === 1).length).toBeLessThanOrEqual(8);
    expect(geo.filter((t) => t.difficulty === 2).length).toBeLessThanOrEqual(8);
    expect(geo.filter((t) => t.difficulty === 3).length).toBeLessThanOrEqual(5);
    expect(geo.length).toBeLessThanOrEqual(21);
  });
  it("ruin batch hits the re-derived 4/12/4 difficulty distribution", () => {
    // The batch closed at 20/20, so this is now the equality the old comment promised.
    // The 4/12/4 shape is derived from what a template asks rather than from a quota:
    // L1 applies a fair-game formula forward (s/N, the s(N-s) parabola), L2 either runs
    // the unfair machinery (the odds ratio, exponential in stack) or inverts/composes a
    // fair one, and L3 chains two stages. The previous 8/8/4 predated that reading and
    // split L1 from L2 on nothing — both tiers averaged ~56s over identical 40-85 ranges.
    const ruin = PROBLEMS.filter((t) => t.id.startsWith("ruin/"));
    expect(ruin.length).toBe(20);
    expect(ruin.filter((t) => t.difficulty === 1).length).toBe(4);
    expect(ruin.filter((t) => t.difficulty === 2).length).toBe(12);
    expect(ruin.filter((t) => t.difficulty === 3).length).toBe(4);
  });
  it("distributions batch hits the 9/13/6 difficulty distribution", () => {
    const dist = PROBLEMS.filter((t) => t.id.startsWith("distributions/"));
    expect(dist.length).toBe(28);
    expect(dist.filter((t) => t.difficulty === 1).length).toBe(9);
    expect(dist.filter((t) => t.difficulty === 2).length).toBe(13);
    expect(dist.filter((t) => t.difficulty === 3).length).toBe(6);
  });
  it("every distributions problem grades on rel 0.005 — never abs", () => {
    const dist = PROBLEMS.filter((t) => t.id.startsWith("distributions/"));
    for (const t of dist) {
      expect(t.accepted.tolerance.rel).toBe(0.005);
      expect(t.accepted.tolerance.abs).toBeUndefined();
    }
  });
  it("counting batch hits the 10/12/5 difficulty distribution", () => {
    const counting = PROBLEMS.filter((t) => t.id.startsWith("counting/"));
    expect(counting.length).toBe(27);
    expect(counting.filter((t) => t.difficulty === 1).length).toBe(10);
    expect(counting.filter((t) => t.difficulty === 2).length).toBe(12);
    expect(counting.filter((t) => t.difficulty === 3).length).toBe(5);
  });
  it("ev-variance stays inside its 12/17/6 difficulty budget", () => {
    // Kept as an upper bound, but the batch closed at 34/34 long ago and the equality pin
    // below now covers everything this asserts — it survives only because it is the pin a
    // reader finds first, and a re-tag that updated one and not the other would look green
    // on the wrong one. Update both together or delete this one.
    const ev = PROBLEMS.filter((t) => t.id.startsWith("ev-variance/"));
    expect(ev.filter((t) => t.difficulty === 1).length).toBeLessThanOrEqual(12);
    expect(ev.filter((t) => t.difficulty === 2).length).toBeLessThanOrEqual(17);
    expect(ev.filter((t) => t.difficulty === 3).length).toBeLessThanOrEqual(6);
    expect(ev.length).toBeLessThanOrEqual(35);
  });
  it("a module-level helper exists only if constraint reaches it", () => {
    // Constraint 2 licenses a module-local helper for exactly one reason: `constraint` never
    // sees `derived` (packages/engine/src/problem.ts:24), so pinning an answer floor would
    // otherwise mean typing the answer formula twice. Where `constraint` is a structural
    // rejection that never asks the answer, a helper is a second copy of the formula for
    // nothing — and Task 3 shipped two whose comments claimed a double use their code did not
    // have. Reachability is transitive: max-of-two-dice's `topNumerOf` is reached through
    // `evOf`, and sum-of-bets-variance's `varLeg` through `totalVarOf`.
    let checked = 0;
    for (const topic of readdirSync("content/problems", { withFileTypes: true }).filter((d) => d.isDirectory())) {
      for (const file of readdirSync(join("content/problems", topic.name)).filter((f) => f.endsWith(".ts"))) {
        const src = readFileSync(join("content/problems", topic.name, file), "utf8");
        const helpers = [...src.matchAll(/^const (\w+)\s*=/gm)].map((m) => m[1]);
        if (!helpers.length) continue;
        checked += helpers.length;
        const constraintSrc = (src.match(/^\s*constraint:.*$/m) ?? [""])[0];
        const bodyOf = (h: string) => (src.match(new RegExp(`^const ${h}\\s*=[\\s\\S]*?;$`, "m")) ?? [""])[0];
        const reached = new Set<string>();
        const walk = (text: string) => {
          for (const h of helpers)
            if (!reached.has(h) && new RegExp(`\\b${h}\\b`).test(text)) { reached.add(h); walk(bodyOf(h)); }
        };
        walk(constraintSrc);
        expect(helpers.filter((h) => !reached.has(h)), `${topic.name}/${file}: helper not reachable from constraint`).toEqual([]);
      }
    }
    expect(checked, "no helpers found at all — the check has gone vacuous").toBeGreaterThan(0);
  });
  it("exact-count problems grade strictly from their own tolerance object", () => {
    // {abs: 0} is the only strict-equality path in the corpus and it reaches grade()
    // straight off the template, so pin it against real templates rather than a
    // synthetic tolerance: one off the true count must fail.
    const exact = PROBLEMS.filter((t) => t.accepted.tolerance.abs === 0);
    expect(exact.length).toBe(41);   // 17 counting exact counts, 5 choice templates, 7 exact brainteaser answers, 2 statistics sample sizes, 8 number-theory exact integers, 2 whole-number solid-geometry volumes
    for (const t of exact) {
      for (let seed = 0; seed < 5; seed++) {
        const answer = answerOf(t, t.derived(drawParams(t, seed)));
        expect(grade(answer, answer, t.accepted.tolerance)).toBe(true);
        expect(grade(answer + 1, answer, t.accepted.tolerance)).toBe(false);
        expect(grade(answer - 1, answer, t.accepted.tolerance)).toBe(false);
      }
    }
  });
  it("counting batch splits 17 exact counts / 10 probabilities", () => {
    const counting = PROBLEMS.filter((t) => t.id.startsWith("counting/"));
    expect(counting.filter((t) => t.accepted.tolerance.abs === 0).length).toBe(17);
    expect(counting.filter((t) => t.accepted.tolerance.rel === 0.005).length).toBe(10);
  });
  it("ev-variance batch hits the 12/17/6 difficulty distribution", () => {
    const ev = PROBLEMS.filter((t) => t.id.startsWith("ev-variance/"));
    expect(ev.length).toBe(35);
    expect(ev.filter((t) => t.difficulty === 1).length).toBe(12);
    expect(ev.filter((t) => t.difficulty === 2).length).toBe(17);
    expect(ev.filter((t) => t.difficulty === 3).length).toBe(6);
  });
  it("every ev-variance problem grades on rel 0.005 — never abs", () => {
    // An expectation is a decimal the solver rounds, so strict equality would be a
    // grading bug; and an abs tolerance would have to satisfy the smallest |answer|
    // across all 100 emitted draws (emit.ts:43), which no author can pick safely.
    const ev = PROBLEMS.filter((t) => t.id.startsWith("ev-variance/"));
    for (const t of ev) {
      expect(t.accepted.tolerance.rel).toBe(0.005);
      expect(t.accepted.tolerance.abs).toBeUndefined();
    }
  });
  it("bayes batch hits the 12/12/6 difficulty distribution", () => {
    const bayes = PROBLEMS.filter((t) => t.id.startsWith("bayes/"));
    expect(bayes.length).toBe(30);
    expect(bayes.filter((t) => t.difficulty === 1).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 2).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 3).length).toBe(6);
  });
});
