import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

const answerOf = (par: Params) => 1 - Math.exp(-par.lam * par.t);

export const exponentialCdfThreshold: ProblemTemplate = {
  id: "distributions/exponential-cdf-threshold",
  version: 1,
  topic: "probability/distributions",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "original", inspiration: "exponential CDF as a complement of the survival probability" },
  params: {
    lam: { range: { min: 0.05, max: 2, step: 0.05 } },
    t: { range: { min: 0.5, max: 40, step: 0.5 } },
  },
  constraint: (p) => answerOf(p) >= 0.1 && answerOf(p) <= 0.9,
  derived: (p) => {
    const survival = Math.exp(-p.lam * p.t);
    const answer = 1 - survival;
    return { survival, answer };
  },
  statement: (p) =>
    `The time between consecutive trades on an illiquid name follows an exponential distribution with rate $\\lambda$ equal to ${fmtNum(p.lam)} per second. What is the probability the next trade happens within ${fmtNum(p.t)} seconds?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `An exponential wait with rate $\\lambda$ has $P(X>t)=e^{-\\lambda t}$ — the survival probability of waiting past $t$.` },
    { title: "Compute the survival probability", body: `$P(X>${fmtNum(p.t)})\\approx${fmtNum(d.survival)}$.` },
    { title: "Take the complement", body: `"Within $t$ seconds" is the complement of surviving past it: $P(X<${fmtNum(p.t)})\\approx1-${fmtNum(d.survival)}\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The survival probability ${fmtNum(d.survival)} and this answer must sum to $1$, since every outcome either arrives within ${fmtNum(p.t)} seconds or survives past it — and they do.` },
  ],
  keyInsight: "The exponential CDF is one minus the survival function e^{-\\lambda t} — computing the survival probability first, then complementing, avoids sign errors more reliably than differentiating a memorized CDF formula.",
  commonTrap: "Reporting the survival probability e^{-\\lambda t} itself as the answer, which is the probability of NOT arriving within t, the opposite of what was asked.",
  expectedPaceS: 45,
  verify: { method: "montecarlo" },
  constants: [1],
};
