import type { Params, ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

const cdfAOf = (par: Params) => normalCdf(par.a, par.mu, par.sigma);
const answerOf = (par: Params) => normalCdf(par.b, par.mu, par.sigma) - cdfAOf(par);

export const normalBetween: ProblemTemplate = {
  id: "distributions/normal-between",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "original", inspiration: "a Normal interval probability as a difference of two standardized CDF lookups" },
  params: {
    mu: { range: { min: 50, max: 150, step: 25 } },
    sigma: { range: { min: 5, max: 30, step: 5 } },
    a: { range: { min: 0, max: 200, step: 5 } },
    b: { range: { min: 0, max: 200, step: 5 } },
  },
  // cdfA>=0.02 is required: below that, cdfB-cdfA rounds to the same 4-sig-fig string as cdfB
  // alone, making the answer and the commonTrap (cdfB alone) print identically.
  constraint: (p) => p.a < p.b && Math.abs((p.a - p.mu) / p.sigma) <= 4 && Math.abs((p.b - p.mu) / p.sigma) <= 4 && cdfAOf(p) >= 0.02 && answerOf(p) >= 0.1 && answerOf(p) <= 0.9,
  derived: (p) => {
    const cdfA = normalCdf(p.a, p.mu, p.sigma);
    const cdfB = normalCdf(p.b, p.mu, p.sigma);
    const answer = cdfB - cdfA;
    return { cdfA, cdfB, answer };
  },
  statement: (p) =>
    `A trading strategy's daily P&L is modeled as Normal with mean ${fmtNum(p.mu)} and standard deviation ${fmtNum(p.sigma)}. What is the probability that a given day's P&L lands between ${fmtNum(p.a)} and ${fmtNum(p.b)}?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Look up both endpoint CDFs", body: `$P(X<${fmtNum(p.a)})\\approx${fmtNum(d.cdfA)}$ and $P(X<${fmtNum(p.b)})\\approx${fmtNum(d.cdfB)}$, each read off the standardized $z$-score at its own endpoint.` },
    { title: "Subtract", body: `The interval probability is the difference of the two CDFs: $P(${fmtNum(p.a)}<X<${fmtNum(p.b)})\\approx${fmtNum(d.cdfB)}-${fmtNum(d.cdfA)}\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Since $a<b$, the CDF at $b$ must sit above the CDF at $a$, so this difference must land strictly between $0$ and $1$ — and it does.` },
  ],
  keyInsight: "A Normal interval probability is always the difference of two CDF lookups, one per endpoint — there is no separate \"between\" formula to memorize beyond subtraction.",
  commonTrap: "Computing the CDF at only one endpoint and reporting it directly, or subtracting in the wrong order and getting a negative probability.",
  expectedPaceS: 65,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
