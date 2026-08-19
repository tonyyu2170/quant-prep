import { describe, expect, it } from "vitest";
import { drawParams, type Params, type ProblemTemplate } from "@qp/engine";
import { PROBLEMS } from "./index";

// The mechanical half of what constraint 8 orders an author to measure, promoted out of
// Task 3's throwaway harness so that no task has to re-derive it. Task 3 proved the cost of
// leaving it uncommitted: two implementers measured "distinct answers at the band" under two
// different rules and reported numbers differing by up to eleven times on identical data.
//
// Everything here is problem-agnostic — it takes a template or a list of answers and returns
// a number — so it does not grow as the corpus does. The counters are exported so an author
// can call them while drafting a param range, which is when the numbers are actually useful;
// the assertions at the bottom are the same counters run as floors over the shipped corpus.
//
// What is deliberately NOT here: the per-problem Sanity / keyInsight / commonTrap predicates.
// Those are bespoke to each template and would grow to one hand-written claim per problem.
// Promoting them is a separate decision with its own maintenance cost.
//
// Scope is ev-variance, matching printed-precision.test.ts. Constraint 8 is a B3 rule and the
// 55 bayes and counting problems predate it; widening is a decision to take on its own
// evidence, not a side effect of this file.
const TOPIC = "probability/ev-variance";

/** Walk the full cartesian product of a template's param specs, legal draws only. */
export function forEachLegalDraw(t: ProblemTemplate, cb: (p: Params) => void): void {
  const keys = Object.keys(t.params).sort();
  const axes = keys.map((k) => {
    const spec = t.params[k];
    if (spec.choices) return [...spec.choices];
    const { min, max, step } = spec.range!;
    const out: number[] = [];
    for (let i = 0; i <= Math.round((max - min) / step); i++) out.push(Math.round((min + step * i) * 1e10) / 1e10);
    return out;
  });
  const acc: Params = {};
  const rec = (i: number) => {
    if (i === keys.length) { if (!t.constraint || t.constraint(acc)) cb({ ...acc }); return; }
    for (const v of axes[i]) { acc[keys[i]] = v; rec(i + 1); }
  };
  rec(0);
}

export function legalAnswers(t: ProblemTemplate): number[] {
  const out: number[] = [];
  forEachLegalDraw(t, (p) => out.push(t.derived(p)[t.answerKey]));
  return out;
}

/**
 * Constraint 8's canonical count, and the ONLY rule that may be used for it.
 *
 * Each answer `v` carries the grading interval `[v(1-rel), v(1+rel)]`. Two answers are the
 * same answer when those intervals overlap — for sorted neighbours `a <= b`, when
 * `b - a <= rel*(|a| + |b|)` — and the merge is transitive, so a run of overlapping
 * neighbours collapses to one. The count is the number of runs.
 *
 * The rule that is NOT this one, and that Task 3 first reported under: keeping a value
 * whenever it falls outside the band of the last value KEPT. That is non-transitive and much
 * looser — see the self-test below, which pins the divergence rather than describing it.
 */
export function distinctAtBand(answers: number[], rel = 0.005): number {
  const s = [...answers].sort((a, b) => a - b);
  let runs = 0;
  for (let i = 0; i < s.length; i++) {
    if (i === 0) { runs++; continue; }
    const a = s[i - 1], b = s[i];
    if (!(b - a <= rel * (Math.abs(a) + Math.abs(b)))) runs++;
  }
  return runs;
}

/**
 * The density diagnostic behind constraint 8's validity condition. `distinctAtBand` measures
 * range connectivity, not distinguishability, and connectivity saturates on any space dense
 * relative to its band: once `meanGap` falls below `bandAtMedian`, the count collapses toward
 * 1 and stops carrying information about the template. Read `texts/100` instead when it does.
 *
 * `distinct` is deduped at an explicit tolerance rather than by float identity. Raw identity
 * counts last-ulp duplicates as separate answers — on sum-of-bets-variance it reports 2341
 * where 2224 are mathematically distinct.
 */
export function neighbourDensity(answers: number[], rel = 0.005, dedupe = 1e-9) {
  const vals = [...new Set(answers.map((v) => Math.round(v / dedupe) * dedupe))].sort((a, b) => a - b);
  const gaps = vals.slice(1).map((v, i) => v - vals[i]);
  const median = vals[Math.floor(vals.length / 2)];
  let largestRun = 1, run = 1;
  for (let i = 1; i < vals.length; i++) {
    const a = vals[i - 1], b = vals[i];
    if (b - a <= rel * (Math.abs(a) + Math.abs(b))) { run++; largestRun = Math.max(largestRun, run); } else run = 1;
  }
  return {
    distinct: vals.length,
    meanGap: gaps.length ? gaps.reduce((x, y) => x + y, 0) / gaps.length : Infinity,
    bandAtMedian: 2 * rel * Math.abs(median),
    largestRun,
    /** true when the count above has saturated and should not be read as a quality signal */
    saturated: gaps.length > 0 && gaps.reduce((x, y) => x + y, 0) / gaps.length < 2 * rel * Math.abs(median),
  };
}

/**
 * What a learner actually meets: the repeat rate across the 100 instances the emitter serves.
 * This is constraint 8's PRIMARY bar — it needs no merge rule and cannot saturate.
 *
 * The seeding mirrors verification/emit.ts:10-14 and :36-38 and must stay in step with it;
 * emit.ts is a script with top-level side effects, so it cannot be imported here.
 */
export function emittedSpread(t: ProblemTemplate, n = 100) {
  let h = 2166136261;
  for (const c of t.id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const base = h >>> 0;
  const counts = new Map<string, number>();
  const answers: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = drawParams(t, (base + i) >>> 0);
    counts.set(JSON.stringify(p), (counts.get(JSON.stringify(p)) ?? 0) + 1);
    answers.push(t.derived(p)[t.answerKey]);
  }
  return { texts: counts.size, maxRepeat: Math.max(...counts.values()), answers };
}

/**
 * DIAGNOSTIC ONLY — never assert on this. Returns every standalone printed `1` with the two
 * words after it, for a human to read while drafting. Task 3 found "on the other 1 it is
 * thrown out" this way, which a plural-suffix heuristic misses because a pronoun follows.
 *
 * It must not become a gate: run over the shipped corpus it returns 6498 hits that are all
 * false positives, because `die-payoff-table`'s "a roll of 1 pays X dollars" is correct
 * English that trips any noun-suffix rule. The value is in reading the distinct contexts,
 * which number in the handful, not in the hit count.
 */
export function printedOnesInContext(texts: string[]): string[] {
  const found = new Set<string>();
  for (const raw of texts) {
    const plain = raw.replace(/\$[^$]*\$/g, " MATH ").replace(/\\[a-zA-Z]+/g, " ");
    for (const m of plain.matchAll(/(?:^|[^\d.])1(?![\d.])\s+(\S+\s+\S+)/g)) found.add(m[1]);
  }
  return [...found].sort();
}

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

describe("ev-variance draw spaces clear constraint 8", () => {
  const templates = PROBLEMS.filter((t) => t.topic === TOPIC);
  it("has templates to measure", () => expect(templates.length).toBeGreaterThan(0));

  it("every template yields at least 12 distinct answers over its full legal space", () => {
    for (const t of templates) {
      const answers = legalAnswers(t);
      expect(answers.length, `${t.id}: constraint rejects the entire space`).toBeGreaterThan(0);
      expect(distinctAtBand(answers), `${t.id} distinct answers at band`).toBeGreaterThanOrEqual(12);
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
