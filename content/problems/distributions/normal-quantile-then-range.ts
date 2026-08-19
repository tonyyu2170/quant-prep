import type { ProblemTemplate } from "@qp/engine";
import { normalCdf, normalQuantile } from "@qp/engine";
import { fmtNum } from "../util";

export const normalQuantileThenRange: ProblemTemplate = {
  id: "distributions/normal-quantile-then-range",
  version: 1,
  topic: "probability/distributions",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.35 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "original", inspiration: "finding a Normal threshold from a stated tail probability, then a second probability around that threshold" },
  params: {
    mu: { range: { min: 50, max: 150, step: 25 } },
    sigma: { range: { min: 5, max: 30, step: 5 } },
    c: { range: { min: 0.1, max: 0.4, step: 0.02 } },
    d: { range: { min: 2, max: 30, step: 4 } },
  },
  constraint: (p) => {
    const x = normalQuantile(1 - p.c, p.mu, p.sigma);
    const stage2 = normalCdf(x + p.d, p.mu, p.sigma) - normalCdf(x - p.d, p.mu, p.sigma);
    return stage2 >= 0.1 && stage2 <= 0.9;
  },
  derived: (p) => {
    const x = normalQuantile(1 - p.c, p.mu, p.sigma);
    const cdfUpper = normalCdf(x + p.d, p.mu, p.sigma);
    const cdfLower = normalCdf(x - p.d, p.mu, p.sigma);
    const answer = cdfUpper - cdfLower;
    return { x, cdfUpper, cdfLower, answer };
  },
  statement: (p) =>
    `A trading strategy's daily P&L is modeled as Normal with mean ${fmtNum(p.mu)} and standard deviation ${fmtNum(p.sigma)}. First, find the threshold $x$ such that the probability of a day's P&L exceeding $x$ is ${fmtNum(p.c)}. Then find the probability that a day's P&L falls within ${fmtNum(p.d)} of that threshold.`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Find the threshold", body: `$P(X>x)=${fmtNum(p.c)}$ means $x$ is the $${fmtNum(1)}-${fmtNum(p.c)}$ quantile of the distribution: $x\\approx${fmtNum(d.x)}$.` },
    { title: "Set up the second-stage range", body: `"Within ${fmtNum(p.d)} of $x$" means the interval $(x-${fmtNum(p.d)},\\,x+${fmtNum(p.d)})$, a fresh interval built from the threshold just found, not the original ${fmtNum(p.c)}.` },
    { title: "Look up both endpoint CDFs and subtract", body: `$P(X<x+${fmtNum(p.d)})\\approx${fmtNum(d.cdfUpper)}$ and $P(X<x-${fmtNum(p.d)})\\approx${fmtNum(d.cdfLower)}$, so $P(|X-x|<${fmtNum(p.d)})\\approx${fmtNum(d.cdfUpper)}-${fmtNum(d.cdfLower)}\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Both endpoint CDFs bracket the threshold's own tail probability ${fmtNum(p.c)}, since $x-${fmtNum(p.d)}<x<x+${fmtNum(p.d)}$, so the two CDFs must land in increasing order — and they do.` },
  ],
  keyInsight: "A two-stage Normal problem is two ordinary Normal lookups chained together: first invert a tail probability to a threshold with the quantile function, then treat that threshold as a fresh, known number for the second probability.",
  commonTrap: "Reusing the first-stage tail probability c as part of the second-stage answer, instead of computing an entirely fresh interval probability around the threshold x.",
  expectedPaceS: 85,
  verify: { method: "montecarlo" },
  constants: [1],
};
