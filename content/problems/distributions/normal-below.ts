import type { Params, ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

const answerOf = (par: Params) => normalCdf(par.x, par.mu, par.sigma);

export const normalBelow: ProblemTemplate = {
  id: "distributions/normal-below",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "original", inspiration: "the standardized-z lookup for a Normal CDF" },
  params: {
    mu: { range: { min: 50, max: 150, step: 5 } },
    sigma: { range: { min: 5, max: 30, step: 1 } },
    x: { range: { min: 0, max: 200, step: 2 } },
  },
  constraint: (p) => Math.abs((p.x - p.mu) / p.sigma) <= 4 && answerOf(p) >= 0.1 && answerOf(p) <= 0.9 && !complementGrades(answerOf(p)),
  derived: (p) => {
    const z = (p.x - p.mu) / p.sigma;
    const answer = normalCdf(p.x, p.mu, p.sigma);
    return { z, answer };
  },
  statement: (p) =>
    `A trading strategy's daily P&L is modeled as Normal with mean ${fmtNum(p.mu)} and standard deviation ${fmtNum(p.sigma)}. What is the probability that a given day's P&L is below ${fmtNum(p.x)}?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Standardize", body: `Convert the threshold to a $z$-score: $z=\\frac{x-\\mu}{\\sigma}$, which is $\\frac{${fmtNum(p.x)}-${fmtNum(p.mu)}}{${fmtNum(p.sigma)}}\\approx${fmtNum(d.z)}$.` },
    { title: "Look up the standard normal CDF", body: `$P(X<${fmtNum(p.x)})\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Since the threshold ${fmtNum(p.x)} sits ${d.z >= 0 ? "above" : "below"} the mean ${fmtNum(p.mu)}, the answer should sit ${d.z >= 0 ? "above" : "below"} $${fmtNum(0.5)}$ — and it does.` },
  ],
  keyInsight: "Every Normal CDF question reduces to the same standard normal lookup once the threshold is standardized to a z-score — the mean and standard deviation only matter through that one transformation.",
  commonTrap: "Plugging the raw threshold directly into the standard normal CDF without first standardizing it against the mean and standard deviation.",
  expectedPaceS: 50,
  verify: { method: "montecarlo" },
  constants: [0.5],
};
