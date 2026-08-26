import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The slope of the least-squares line from the second moments alone. `constraint` needs the
// answer: a slope near zero grades at rel 0.005 of almost nothing, which is exact equality in
// disguise. Note the printed chain multiplies the two ORIGINAL numbers and divides — feeding
// the rounded ratio into the product instead would put a rounded operand in a printed chain.
const slopeOf = (par: { rho: number; sdX: number; sdY: number }) => (par.rho * par.sdY) / par.sdX;

export const regressionSlopeFromMoments: ProblemTemplate = {
  id: "statistics/regression-slope-from-moments",
  version: 1,
  topic: "statistics/regression",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.3 }, { firm: "de-shaw", weight: 0.25 }, { firm: "jump", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "least-squares slope as correlation times the ratio of standard deviations" },
  params: {
    rho: { range: { min: -0.9, max: 0.9, step: 0.1 } },
    sdX: { choices: [4, 5, 8, 10, 12, 16] },
    sdY: { choices: [3, 6, 9, 15, 20, 25] },
  },
  constraint: (p) => Math.abs(slopeOf(p as { rho: number; sdX: number; sdY: number })) >= 0.15,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      ratio: round(p.sdY / p.sdX),
      r2: round(p.rho ** 2),
      unexplained: round(1 - p.rho ** 2),
      reverseSlope: round((p.rho * p.sdX) / p.sdY),   // the slope of the other regression
      answer: round((p.rho * p.sdY) / p.sdX),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A signal X and a forward return Y are measured over a long sample. X has standard deviation ${fmtNum(p.sdX)}, Y has standard deviation ${fmtNum(p.sdY)}, and their correlation is ${fmtNum(p.rho)}. ` +
    `You fit the least-squares line that predicts Y from X. What is its slope?`,
  solution: (p, d) => [
    { title: "The slope is a covariance over a variance", body: `Least squares puts the slope at $b=\\dfrac{\\text{Cov}(X,Y)}{\\text{Var}(X)}$, the covariance of X and Y divided by the variance of X. Writing the covariance as the correlation times the two standard deviations, one factor of X's standard deviation cancels and the slope becomes the correlation times the ratio of the standard deviations, Y's over X's.` },
    { title: "Take the ratio the right way up", body: `Y's spread over X's is $${fmtNum(p.sdY)}/${fmtNum(p.sdX)}=${fmtNum(d.ratio)}$. It is Y's on top because the slope answers "how much does the prediction of Y move per unit of X", so its units are units of Y per unit of X.` },
    { title: "Answer", body: `Multiplying by the correlation: $${fmtNum(p.rho)}\\times${fmtNum(p.sdY)}/${fmtNum(p.sdX)}=${fmtNum(d.answer)}$ units of Y per unit of X.` },
    { title: "How much that line actually explains", body: `The share of Y's variance the fit accounts for is the correlation squared, $${fmtNum(p.rho)}\\times${fmtNum(p.rho)}=${fmtNum(d.r2)}$, which leaves ${fmtNum(d.unexplained)} of it unexplained. A steep slope and a weak fit are perfectly compatible — the slope is set by the ratio of spreads as much as by the strength of the relationship.` },
    { title: "Sanity check", body: `Regressing the other way round, X on Y, gives a slope of ${fmtNum(d.reverseSlope)} rather than the reciprocal of this one. The two slopes multiply to the correlation squared, which is at most one, so the two lines coincide only under a perfect fit.` },
  ],
  keyInsight: "A regression slope carries units and a correlation does not, so the slope is the correlation rescaled by the ratio of the two spreads. Strength of relationship and steepness of line are separate facts, and only one of them is symmetric in the two variables.",
  commonTrap: "Inverting the ratio and dividing by Y's spread instead of X's, which is the slope of the other regression. The two are not reciprocals: regressing Y on X and X on Y give different lines unless the fit is perfect.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
