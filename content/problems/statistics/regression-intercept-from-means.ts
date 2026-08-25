import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The intercept from the point of means. Both means are integers and the slope steps in fifths,
// so the slope term is exact on every draw and the subtraction that produces the answer has no
// rounded operand. The answer is the axis nobody can read off the statement: it moves with all
// three params and runs from well below zero to well above it, which is also what stops a
// student pattern-matching the intercept to the mean response.
export const regressionInterceptFromMeans: ProblemTemplate = {
  id: "statistics/regression-intercept-from-means",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the least-squares line passes through the point of means" },
  params: {
    xbar: { choices: [8, 12, 15, 20, 24, 30, 36, 40, 45, 50] },
    ybar: { choices: [30, 45, 60, 72, 84, 96, 110, 125, 140] },
    b: { range: { min: 0.4, max: 2.6, step: 0.2 } },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      slopeTerm: round(p.b * p.xbar),
      answer: round(p.ybar - p.b * p.xbar),   // from the exact operands, not from `slopeTerm`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A fund's monthly return is regressed on a factor's monthly return over the same sample of months, both measured in basis points. Across that sample the factor averaged ${fmtNum(p.xbar)} basis points and the fund averaged ${fmtNum(p.ybar)}. ` +
    `The fitted slope is ${fmtNum(p.b)}. What is the intercept of the fitted line?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "The fitted line passes through the point of means", body: `Least squares picks the intercept to make the residuals sum to zero, and that condition is exactly the statement that the line goes through the sample's centre of mass: $\\bar{y}=a+b\\bar{x}$. Rearranged, the intercept is whatever is left of the mean response once the slope has accounted for the mean predictor, $a=\\bar{y}-b\\bar{x}$. The slope is fitted first; the intercept only follows it.` },
    { title: "What the slope accounts for at the average factor return", body: `At the factor's own average the fitted line's tilt contributes $${fmtNum(p.b)}\\times${fmtNum(p.xbar)}=${fmtNum(d.slopeTerm)}$ basis points.` },
    { title: "Answer", body: `The fund averaged ${fmtNum(p.ybar)} basis points, so the intercept is $${fmtNum(p.ybar)}-${fmtNum(d.slopeTerm)}=${fmtNum(d.answer)}$ basis points.` },
    { title: "Sanity check", body: `The intercept is the line's prediction when the factor returns 0, and the factor averaged ${fmtNum(p.xbar)} over this sample — so that prediction sits outside the range the data actually covers, and reading ${fmtNum(d.answer)} as "the fund's return in a flat month" is an extrapolation the fit does not support. It is a bookkeeping constant that puts the line at the right height, not a measured alpha.` },
  ],
  keyInsight: "The least-squares line is pinned to the point of means, so the intercept is not a free parameter: once the slope is chosen, the requirement that the residuals sum to zero fixes the height. That is why the intercept moves whenever the slope does, and why it carries the units of the response rather than a ratio of units.",
  commonTrap: "Reading the intercept as the response's average, which it only equals when the predictor has been centred at its own mean. The other slip is subtracting the wrong way round and reporting the slope term less the mean response, which flips the sign.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [0],
};
