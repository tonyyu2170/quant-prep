import { describe, expect, it } from "vitest";
import type { ProblemTemplate } from "@qp/engine";
import { PROBLEMS } from "./index";
import { distinctAtBand, emittedSpread, legalAnswers, neighbourDensity, printedOnesInContext } from "./draw-space";

// The mechanical half of what constraint 8 orders an author to measure, promoted out of
// Task 3's throwaway harness so that no task has to re-derive it. Task 3 proved the cost of
// leaving it uncommitted: two implementers measured "distinct answers at the band" under two
// different rules and reported numbers differing by up to eleven times on identical data.
//
// The counters themselves now live in ./draw-space.ts so tools/probe.ts can call them while a
// template is being drafted, which is when the numbers are actually useful. What stays here is
// the half that needs vitest: the mutation cases that make each counter fail, and the same
// counters run as floors over the shipped corpus.
//
// What is deliberately NOT here: the per-problem Sanity / keyInsight / commonTrap predicates.
// Those are bespoke to each template and would grow to one hand-written claim per problem.
// Promoting them is a separate decision with its own maintenance cost.
//
// Scope is ev-variance and distributions. Constraint 8 is a B3 rule and the 55 bayes and
// counting problems predate it; widening further is a decision to take on its own evidence,
// not a side effect of this file.
const TOPICS = ["probability/ev-variance", "probability/distributions", "probability/ruin", "probability/geometric", "probability/markov", "probability/symmetry", "brainteasers/logic", "statistics/moments", "statistics/estimation", "statistics/inference", "finance/pricing", "pure-math/stochastic", "pure-math/linear-algebra"];

// A counter nobody has watched fail is not evidence that anything passed.
describe("the draw-space counters fail when they should", () => {
  it("distinctAtBand merges inside the band, splits outside it, and scales with the answer", () => {
    expect(distinctAtBand([1, 2, 3])).toBe(3);
    expect(distinctAtBand([100, 100.4])).toBe(1);   // band is 0.5 either side at 100
    expect(distinctAtBand([100, 101.5])).toBe(2);
    expect(distinctAtBand([1, 1.4])).toBe(2);       // the same absolute gap, far outside the band at 1
    expect(distinctAtBand([])).toBe(0);
  });
  it("distinctAtBand is transitive, and diverges from the non-canonical greedy rule", () => {
    // A ladder whose neighbours each overlap: one run, however far the ends are apart.
    const ladder = Array.from({ length: 400 }, (_, i) => 100 * 1.004 ** i);
    expect(distinctAtBand(ladder)).toBe(1);
    expect(ladder[ladder.length - 1] / ladder[0]).toBeGreaterThan(4); // a fourfold range, one answer
    // The greedy rule that must NOT be substituted keeps a value when it clears the band of
    // the last value KEPT, so the same ladder reports hundreds. Pinning the divergence is
    // what stops the substitution being made silently.
    const greedy = (vals: number[], rel = 0.005) => {
      const s = [...vals].sort((a, b) => a - b);
      let n = 0, rep = NaN;
      for (const v of s) if (!Number.isFinite(rep) || Math.abs(v - rep) > rel * Math.abs(rep)) { n++; rep = v; }
      return n;
    };
    expect(greedy(ladder)).toBeGreaterThan(100);
  });
  it("neighbourDensity flags a saturated space and clears a sparse one", () => {
    const dense = Array.from({ length: 5000 }, (_, i) => 10 + i * 0.01);
    const sparse = Array.from({ length: 20 }, (_, i) => 10 * (i + 1));
    expect(neighbourDensity(dense).saturated).toBe(true);
    expect(distinctAtBand(dense)).toBe(1);          // saturation and collapse are the same event
    expect(neighbourDensity(sparse).saturated).toBe(false);
    expect(neighbourDensity([1, 1, 1.0000000001]).distinct).toBe(1); // last-ulp noise is not an answer
  });
  it("emittedSpread counts distinct texts and the worst repeat", () => {
    const stub = (choices: number[]): ProblemTemplate => ({
      id: "stub/x", version: 1, topic: "t", difficulty: 1, firms: [],
      source: { kind: "original", inspiration: "" },
      params: { a: { choices } }, derived: (p) => ({ v: p.a }),
      statement: () => "", answerKey: "v", accepted: { tolerance: { rel: 0.005 } },
      solution: () => [], keyInsight: "", commonTrap: "", expectedPaceS: 1,
      verify: { method: "brute-force" },
    });
    const one = emittedSpread(stub([7]), 10);
    expect(one).toMatchObject({ texts: 1, maxRepeat: 10 });   // one tuple, served ten times
    const many = emittedSpread(stub(Array.from({ length: 500 }, (_, i) => i + 1)), 10);
    expect(many.texts).toBeGreaterThan(8);
  });
  it("printedOnesInContext finds a pronoun-following 1, and is honest about false positives", () => {
    expect(printedOnesInContext(["stands on 3 faces; on the other 1 it is thrown out"]))
      .toContain("it is");
    // The false positive that makes this a diagnostic and not a gate:
    expect(printedOnesInContext(["a roll of 1 pays 4 dollars"]).length).toBe(1);
    expect(printedOnesInContext(["numbered 1 through 20, drawn evenly"])).toEqual(["through 20,"]);
  });
});

describe("distribution-batch draw spaces clear constraint 8", () => {
  const templates = PROBLEMS.filter((t) => TOPICS.includes(t.topic));
  it("has templates to measure", () => expect(templates.length).toBeGreaterThan(0));

  it("every template yields at least 12 distinct answers over its full legal space", () => {
    // Choice templates are measured by the balance rule below instead — a two-option "who
    // wins" answer can never clear a 12-distinct floor, and excluding them without putting
    // something in its place would leave the category ungated, which is the hole this whole
    // file exists to close.
    for (const t of templates.filter((x) => !x.choices)) {
      const answers = legalAnswers(t);
      expect(answers.length, `${t.id}: constraint rejects the entire space`).toBeGreaterThan(0);
      expect(distinctAtBand(answers), `${t.id} distinct answers at band`).toBeGreaterThanOrEqual(12);
    }
  });

  it("every choice template actually uses all of its options, none below 15% of the space", () => {
    // The failure this catches is a game whose answer never moves: if Alice wins on every
    // legal draw, the template is a constant dressed as a question and a student learns to
    // answer it without reading. A skew floor rather than a bare "both occur" also rejects
    // the near-degenerate case where one option survives on a handful of corner draws.
    const choiceTemplates = templates.filter((t) => t.choices);
    expect(choiceTemplates.length, "no choice templates to measure").toBeGreaterThan(0);
    for (const t of choiceTemplates) {
      const answers = legalAnswers(t);
      expect(answers.length, `${t.id}: constraint rejects the entire space`).toBeGreaterThan(0);
      const n = t.choices!.length;
      for (const a of answers)
        expect(Number.isInteger(a) && a >= 1 && a <= n, `${t.id}: answer ${a} outside 1..${n}`).toBe(true);
      for (let i = 1; i <= n; i++) {
        const share = answers.filter((a) => a === i).length / answers.length;
        expect(share, `${t.id} option ${i} ("${t.choices![i - 1]}") share of legal space`).toBeGreaterThanOrEqual(0.15);
      }
    }
  });

  it("every template serves at least 70 distinct texts per 100 instances, repeating none above 4", () => {
    // The floors are Task 2's thinnest shipped template, sum-of-two-draws, which is compliant
    // and deliberately not reopened. They are a floor because they shipped, not a target: the
    // corpus median is ~92 texts at a repeat of 2.
    for (const t of templates) {
      const { texts, maxRepeat } = emittedSpread(t);
      expect(texts, `${t.id} distinct texts per 100`).toBeGreaterThanOrEqual(70);
      expect(maxRepeat, `${t.id} most-repeated tuple`).toBeLessThanOrEqual(4);
    }
  });
});
