import { drawParams, makeRng, pick, type Params, type ProblemTemplate } from "@qp/engine";
import { PROBLEMS } from ".";
import { legalAnswers } from "./draw-space";

/** Choice templates have no quantity to quote on — `answerKey` resolves to a label index. */
export const MARKET_TEMPLATES: ProblemTemplate[] = PROBLEMS.filter((t) => !t.choices);

const quantile = (sorted: readonly number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

// Sweeping a template's whole legal space is O(tuples) and some are large, so the answers are
// computed at most once per template. A session touches twelve of them.
//
// ponytail: exact sweep, sample the draw space if first-paint cost starts to matter. Measured
// over 300 seeds on 2026-08-24 a session's twelve sweeps cost a median of 7ms, but p90 139ms
// and p99 463ms — the tail is two heavy templates (counting/inclusion-exclusion-three-sets at
// 1.9M tuples, ev-variance/sum-of-bets-variance at 531k). That is a one-time cost at session
// start, paid before the first round paints, so it stays exact: unitOf only needs the spread
// to within a factor of 3 (it rounds log10), so if the tail ever does matter, a fixed-seed
// sample of a few thousand draws gets the same answer for O(1) work and still leaks nothing
// about the drawn round.
const answerCache = new Map<string, number[]>();

function answersOf(t: ProblemTemplate): number[] {
  const hit = answerCache.get(t.id);
  if (hit) return hit;
  const out = legalAnswers(t).sort((a, b) => a - b);
  answerCache.set(t.id, out);
  return out;
}

/**
 * The unit the player quotes in — percentage points for a probability, whole counts for a
 * count, a power of ten for money.
 *
 * Derived from the template's WHOLE legal draw space, never from the drawn answer: that is
 * what keeps it from leaking the magnitude of the specific question, and what makes it stable
 * enough to be worth caching. Normalising every template to a spread near 100 units is the
 * only reason one CREDIT_CAP can mean the same thing on a probability and on a four-figure
 * expected value.
 */
export function unitOf(t: ProblemTemplate): number {
  const a = answersOf(t);
  const spread = quantile(a, 0.95) - quantile(a, 0.05);
  if (!(spread > 0)) return 1; // a template with a single answer has no scale to derive
  return 10 ** Math.round(Math.log10(spread / 100));
}

export interface MarketRound {
  template: ProblemTemplate;
  params: Params;
  statement: string;
  truth: number;
  unit: number;
}

/** 3 L1, 6 L2, 3 L3 — the shape the existing sim ladders use. */
const MIX: readonly (1 | 2 | 3)[] = [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3];

export function marketRounds(seed: number): MarketRound[] {
  const rng = makeRng(seed);
  const used = new Set<string>();
  return MIX.map((d) => {
    const t = pick(rng, MARKET_TEMPLATES.filter((c) => c.difficulty === d && !used.has(c.id)));
    used.add(t.id);
    const params = drawParams(t, Math.floor(rng() * 2 ** 31));
    const derived = t.derived(params);
    return {
      template: t,
      params,
      statement: t.statement(params, derived),
      truth: derived[t.answerKey],
      unit: unitOf(t),
    };
  });
}
