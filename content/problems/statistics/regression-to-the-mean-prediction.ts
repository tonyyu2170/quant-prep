import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The equal-spread clause in the statement is load-bearing twice over. It is what collapses the
// least-squares slope r*sy/sx to r, which is the whole lesson; and it is what keeps this
// template off statistics/regression-slope-from-moments, which hands over sx, sy and r and asks
// for the slope. Written so the solver has to form sy/sx, this would be that problem plus an
// addition, at the same difficulty.
//
// `constraint` earns its keep on the trap audit over all 2744 draws:
//
//  * r !== 0.5 removes the 343 draws where shrinking by r and shrinking by 1-r are the same
//    number, so the muddle between "keep r of the deviation" and "give up r of it" is
//    unpunishable. Same removal as omitted-variable-bias's b1 !== b2.
//  * The shrinkage gap must be at least five percent of the prediction — ten times the grading
//    tolerance. Without it, predicting the FULL deviation with no shrinkage at all grades
//    correct where r is 0.9 and the deviation is small against the mean, and squaring the
//    correlation by shrinking twice grades correct on two more. With it, every trap in the
//    audit misses by at least twice the tolerance and the named ones by ten times.
//
// The cost is that high correlations get rare (r = 0.9 survives on 26 of 1639 draws), which is
// the honest trade: a correlation that high with a small deviation is exactly the region where
// the shrinkage cannot be seen, and a drill whose answer is indistinguishable from the naive
// one teaches the naive one.
//
// `exact4` is the guarantee, not the grid: a half-integer z against an integer sd and a
// one-decimal correlation happen to make both printed operands exact today.
export const regressionToTheMeanPrediction: ProblemTemplate = {
  id: "statistics/regression-to-the-mean-prediction",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "citadel-securities", weight: 0.2 }, { firm: "optiver", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "Galton's regression to the mean as a least-squares prediction" },
  params: {
    mean: { choices: [50, 60, 70, 75, 80, 100, 120] },
    sd: { choices: [4, 5, 6, 8, 10, 12, 15] },
    r: { range: { min: 0.2, max: 0.9, step: 0.1 } },
    z: { choices: [-2.5, -2, -1.5, 1.5, 2, 2.5, 3] },
  },
  constraint: (p) =>
    p.r !== 0.5 &&
    (1 - p.r) * Math.abs(p.z * p.sd) >= 0.05 * Math.abs(p.mean + p.r * p.z * p.sd) &&
    exact4(p.z * p.sd) && exact4(p.r * p.z * p.sd),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      dev: round(p.z * p.sd),
      shrunk: round(p.r * p.z * p.sd),
      answer: round(p.mean + p.r * p.z * p.sd),   // from the exact operands, not from `shrunk`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A firm scores each of its trading desks once a year. Across desks the score averages ${fmtNum(p.mean)} points with a standard deviation of ${fmtNum(p.sd)} points, and that spread was the same in both of the last two years. Scores in consecutive years correlate ${fmtNum(p.r)} across desks. ` +
    `One desk finished last year ${fmtNum(Math.abs(p.z))} standard deviations ${p.z > 0 ? "above" : "below"} the firm average. Fitting this year's score on last year's by least squares, what does the fit predict for that desk this year?`,
  solution: (p, d) => {
    const paren = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
      { title: "With the spreads equal, the slope IS the correlation", body: `The least-squares slope of one variable on another is $r\\dfrac{s_y}{s_x}$ — the correlation, scaled by the ratio of the two spreads because a slope carries units and a correlation does not. Here the two measurements are the same quantity in two years and the spread is the same in both, so that ratio is one and the slope is the correlation itself. The prediction is then $\\bar{y}+r(x-\\bar{x})$: take the desk's deviation from the mean, keep the fraction $r$ of it, and put it back on the mean.` },
      { title: "The desk's deviation, in points", body: `A standard deviation is ${fmtNum(p.sd)} points, so last year the desk sat $${paren(p.z)}\\times${fmtNum(p.sd)}=${fmtNum(d.dev)}$ points from the firm average.` },
      { title: "Keep the correlation's share of it", body: `The fit carries forward the fraction ${fmtNum(p.r)} of that gap: $${fmtNum(p.r)}\\times${paren(d.dev)}=${fmtNum(d.shrunk)}$ points.` },
      { title: "Answer", body: `Putting it back on the firm average, the predicted score is $${fmtNum(p.mean)}+${paren(d.shrunk)}=${fmtNum(d.answer)}$ points — still ${d.dev > 0 ? "above" : "below"} average, but nearer to it than last year.` },
      { title: "Sanity check", body: `The prediction moves the desk a fraction of the way out, never the whole way, and that is true of every desk on the list — the ones that finished high are predicted to come down and the ones that finished low are predicted to come up, at the same time. Nothing about the desks is being claimed: with a correlation below one, part of last year's gap was the year rather than the desk, and the part that was the year does not repeat. Read the same fact backwards and it is just as true — the desks predicted highest this year were, on average, less extreme last year.` },
    ];
  },
  keyInsight: "Regression to the mean is not a force acting on anything; it is what least squares does with an imperfect correlation. The prediction keeps the correlation's share of a deviation and gives up the rest, because the rest is the part of the reading that was luck rather than level — and luck, by construction, does not repeat.",
  commonTrap: "Predicting the full deviation again, which is the fit with the slope set to one rather than to the correlation and quietly assumes last year's reading was all signal. The mirror slip is shrinking the whole score toward zero instead of the deviation toward the mean, which drags the prediction down by a fraction of the average as well and answers a question about a quantity with no natural origin.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [],
};
