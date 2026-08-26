import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

const answerOf = (par: Params) => (par.t - par.a) / (par.b - par.a);

export const cuniformBelowThreshold: ProblemTemplate = {
  id: "distributions/cuniform-below-threshold",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "continuous uniform CDF as a ratio of interval lengths" },
  params: {
    a: { range: { min: 0, max: 20, step: 1 } },
    b: { range: { min: 30, max: 80, step: 1 } },
    t: { range: { min: 0, max: 80, step: 1 } },
  },
  // a=0 is excluded: there (t-a)/(b-a) and t/b (the raw-distance-from-zero commonTrap) coincide
  // exactly, since a itself vanishes from both the numerator and denominator.
  constraint: (p) => p.a !== 0 && p.a < p.t && p.t < p.b && answerOf(p) >= 0.1 && answerOf(p) <= 0.9 && !complementGrades(answerOf(p)),
  derived: (p) => {
    const range = p.b - p.a;
    const answer = (p.t - p.a) / range;
    return { range, answer };
  },
  statement: (p) =>
    `A fill price for a large block trade is modeled as uniformly distributed between ${fmtNum(p.a)} and ${fmtNum(p.b)} price points. What is the probability the fill executes below ${fmtNum(p.t)} price points?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The fill price is uniform on $[a,b]$, a total span of $b-a=${fmtNum(d.range)}$ price points, with equal density everywhere in that span.` },
    { title: "Formula", body: `For a continuous uniform, $P(X<t)=\\frac{t-a}{b-a}$ — the fraction of the span below the threshold.` },
    { title: "Compute", body: `$P(X<${fmtNum(p.t)})\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The threshold ${fmtNum(p.t)} sits strictly between ${fmtNum(p.a)} and ${fmtNum(p.b)} by construction, so this probability must land strictly between $0$ and $1$ — and it does.` },
  ],
  keyInsight: "A continuous uniform CDF is linear in the threshold — the probability below any point is exactly the fraction of the total span that point has covered, with no density weighting needed.",
  commonTrap: "Using the threshold's raw distance from zero instead of its distance from the lower endpoint a, which ignores that the distribution does not start at zero.",
  expectedPaceS: 40,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
