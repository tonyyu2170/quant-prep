import type { Params, ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

const answerOf = (par: Params) => 1 - normalCdf(par.x, par.mu, par.sigma);

export const normalAbove: ProblemTemplate = {
  id: "distributions/normal-above",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "the standardized-z lookup for a Normal survival probability" },
  params: {
    mu: { range: { min: 50, max: 150, step: 5 } },
    sigma: { range: { min: 5, max: 30, step: 1 } },
    x: { range: { min: 0, max: 200, step: 2 } },
  },
  // x=mu is excluded: there z=0 and P(X<x)=P(X>x)=0.5 exactly, making the answer and the
  // below-threshold CDF (the commonTrap) algebraically identical.
  constraint: (p) => p.x !== p.mu && Math.abs((p.x - p.mu) / p.sigma) <= 4 && answerOf(p) >= 0.1 && answerOf(p) <= 0.9,
  derived: (p) => {
    const z = (p.x - p.mu) / p.sigma;
    const below = normalCdf(p.x, p.mu, p.sigma);
    const answer = 1 - below;
    return { z, below, answer };
  },
  statement: (p) =>
    `A trading strategy's daily P&L is modeled as Normal with mean ${fmtNum(p.mu)} and standard deviation ${fmtNum(p.sigma)}. What is the probability that a given day's P&L exceeds ${fmtNum(p.x)}?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Standardize", body: `Convert the threshold to a $z$-score: $z=\\frac{x-\\mu}{\\sigma}$, which is $\\frac{${fmtNum(p.x)}-${fmtNum(p.mu)}}{${fmtNum(p.sigma)}}\\approx${fmtNum(d.z)}$.` },
    { title: "Look up the CDF and complement it", body: `$P(X<${fmtNum(p.x)})\\approx${fmtNum(d.below)}$, so $P(X>${fmtNum(p.x)})\\approx1-${fmtNum(d.below)}\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The below-threshold and above-threshold probabilities partition every outcome, so they must sum to $1$: $${fmtNum(d.below)}+${fmtNum(d.answer)}=${fmtNum(1)}$, and they do.` },
  ],
  keyInsight: "A Normal survival probability is the complement of its CDF at the same standardized z-score — there is no separate upper-tail table to memorize.",
  commonTrap: "Reporting the CDF value Phi(z) directly as the above-threshold probability, forgetting to take the complement.",
  expectedPaceS: 50,
  verify: { method: "montecarlo" },
  constants: [1],
};
