import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The other regression. Both slopes come from the same two second moments, and their product is
// the correlation squared — so the reverse slope is NOT the reciprocal unless the fit is
// perfect. `constraint` needs the answer: a reverse slope near zero grades at rel 0.005 of
// almost nothing, and the quotient here can get small when the correlation is weak against a
// steep forward slope.
//
// The answer chain divides the ORIGINAL correlation product by the original slope rather than
// reusing the printed R-squared, which is a repeating decimal on some draws.
const reverseOf = (par: { rho: number; byx: number }) => (par.rho * par.rho) / par.byx;

export const reverseRegressionSlope: ProblemTemplate = {
  id: "statistics/reverse-regression-slope",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "millennium", weight: 0.3 }, { firm: "two-sigma", weight: 0.25 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the two least-squares slopes multiply to the squared correlation" },
  params: {
    byx: { choices: [0.2, 0.4, 0.5, 0.8, 1, 1.5, 2, 2.5] },
    rho: { range: { min: 0.3, max: 0.9, step: 0.05 } },
    n: { choices: [60, 120, 250] },
  },
  constraint: (p) => reverseOf(p as { rho: number; byx: number }) >= 0.05,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      r2: round(p.rho * p.rho),
      reciprocal: round(1 / p.byx),
      answer: round((p.rho * p.rho) / p.byx),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Over ${fmtNum(p.n)} observations, regressing Y on X by least squares gives a slope of ${fmtNum(p.byx)}, and the sample correlation between X and Y is ${fmtNum(p.rho)}. ` +
    `Someone now regresses X on Y instead. What slope does that fit produce?`,
  solution: (p, d) => [
    { title: "Both slopes are the same covariance over different variances", body: `Least squares divides the covariance by the variance of whatever is being regressed ON: $b_{YX}=\\dfrac{\\text{Cov}}{\\text{Var}(X)}$ and $b_{XY}=\\dfrac{\\text{Cov}}{\\text{Var}(Y)}$. The numerator is shared; only the denominator swaps.` },
    { title: "So their product is fixed", body: `Multiplying the two, the covariance appears squared over both variances — which is the squared correlation. Here that is $${fmtNum(p.rho)}\\times${fmtNum(p.rho)}=${fmtNum(d.r2)}$, so the two slopes must multiply to it.` },
    { title: "Answer", body: `Dividing out the slope already known: $\\dfrac{${fmtNum(p.rho)}\\times${fmtNum(p.rho)}}{${fmtNum(p.byx)}}=${fmtNum(d.answer)}$.` },
    { title: "Why it is not the reciprocal", body: `Inverting the first slope would give $\\dfrac{${fmtNum(1)}}{${fmtNum(p.byx)}}=${fmtNum(d.reciprocal)}$, and $${fmtNum(d.answer)}<${fmtNum(d.reciprocal)}$. The two agree only when the correlation is one in size. Each regression pulls its prediction toward the mean of the variable being predicted, and doing that in both directions cannot give one line.` },
    { title: "Sanity check", body: `The gap between the two is entirely the ${fmtNum(d.r2)} factor, and that factor is at most one for any data at all. So the reverse slope is always the reciprocal shrunk toward zero, never stretched away from it — a weaker fit means a bigger gap between the two lines.` },
  ],
  keyInsight: "Regressing Y on X and X on Y are different questions, and their slopes multiply to the squared correlation rather than to one. The two lines coincide only under a perfect fit, and the weaker the correlation the further apart they sit.",
  commonTrap: "Inverting the known slope. That answer is right only when the correlation is one in size, and it is always too large otherwise — by exactly the factor the fit fails to explain.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [1],
};
