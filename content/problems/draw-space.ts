// The draw-space counters, in a plain module. They lived inside draw-space.test.ts until a
// second caller appeared — tools/probe.ts, which measures a template's draw space WHILE it is
// being drafted — and importing the test file also imports vitest, which only resolves inside
// a test run. Same move printed-precision.ts made, for the same reason.
//
// Extracting rather than copying is the point. verification-gate-lessons is about two people
// measuring "distinct answers at tolerance" under two different rules and reporting numbers
// eleven times apart on identical data; a probe that carried its own copy of `distinctAtBand`
// would recreate exactly that, and a comment saying "keep in step with the gate" is not a
// mechanism. The assertions that run these counters as corpus floors stay in the test file.
import { DRAW_ATTEMPTS, drawParams, type Params, type ProblemTemplate } from "@qp/engine";

/** Every value each param can take, in `drawParams`' key order. Shared so that the acceptance
 *  rate below is counted over exactly the space the enumeration walks — computing the product
 *  size from a second copy of this is how the two would drift apart. */
function axesOf(t: ProblemTemplate): number[][] {
  return Object.keys(t.params).sort().map((k) => {
    const spec = t.params[k];
    if (spec.choices) return [...spec.choices];
    const { min, max, step } = spec.range!;
    const out: number[] = [];
    for (let i = 0; i <= Math.round((max - min) / step); i++) out.push(Math.round((min + step * i) * 1e10) / 1e10);
    return out;
  });
}

/** Walk the full cartesian product of a template's param specs, legal draws only. */
export function forEachLegalDraw(t: ProblemTemplate, cb: (p: Params) => void): void {
  const keys = Object.keys(t.params).sort();
  const axes = axesOf(t);
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
 * How often `drawParams` gets a tuple past the constraint — and what that costs the student.
 *
 * B18 shipped a constraint tight enough that `drawParams` exhausted its retries and threw,
 * and no gate in this file could see it: every counter here reads the LEGAL space and says
 * nothing about how much of the product had to be thrown away to reach it. A template can
 * clear all three floors above on a space its constraint rejects 999 times in 1000.
 *
 * Every param draws uniformly and independently over its own axis, so the acceptance rate is
 * exactly legal/total over the cartesian product, and the retries are independent Bernoulli
 * trials: P(throw) on one call is (1 - rate)^DRAW_ATTEMPTS. That is a real page, not a caught
 * error — see DRAW_ATTEMPTS.
 */
export function acceptance(t: ProblemTemplate) {
  const total = axesOf(t).reduce((n, axis) => n * axis.length, 1);
  let legal = 0;
  forEachLegalDraw(t, () => legal++);
  const rate = legal / total;
  return { legal, total, rate, pThrow: Math.pow(1 - rate, DRAW_ATTEMPTS) };
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
