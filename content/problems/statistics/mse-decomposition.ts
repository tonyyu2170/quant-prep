import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const mseDecomposition: ProblemTemplate = {
  id: "statistics/mse-decomposition",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.2 }, { firm: "hrt", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "mean squared error as bias squared plus variance" },
  params: {
    bias: { choices: [-14, -12, -9, -6, -4, 3, 5, 7, 10, 15] },
    variance: { choices: [16, 25, 36, 49, 64, 81, 100, 144] },
    n: { choices: [20, 25, 40, 50, 60, 80] },
  },
  derived: (p) => ({
    biasSquared: p.bias * p.bias,
    absBias: Math.abs(p.bias),
    naive: p.variance,
    answer: p.bias * p.bias + p.variance,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A pricing model estimates a spread from ${fmtNum(p.n)} observations. Across many repetitions its estimate sits on average ${fmtNum(Math.abs(p.bias))} ticks ${p.bias < 0 ? "below" : "above"} the true spread, and the estimates have a variance of ${fmtNum(p.variance)} ticks squared around their own average. ` +
    `What is the mean squared error of this estimator?`,
  solution: (p, d) => [
    { title: "Two ways to be wrong", body: `Mean squared error measures distance from the TRUTH, while variance measures distance from the estimator's own average. Expanding the square around that average splits them cleanly and the cross term vanishes: $\\text{MSE}=b^2+\\sigma^2$, the squared bias $b^2$ plus the variance $\\sigma^2$.` },
    { title: "Square the bias", body: `The bias is ${fmtNum(p.bias)} ticks, so $(${fmtNum(p.bias)})^2=${fmtNum(d.biasSquared)}$. Squaring is what puts it in the same units as the variance — and it is also why the direction of the bias stops mattering.` },
    { title: "Add the variance", body: `Together that is $${fmtNum(d.biasSquared)}+${fmtNum(p.variance)}=${fmtNum(d.answer)}$ ticks squared.` },
    { title: "Answer", body: `The mean squared error is ${fmtNum(d.answer)} ticks squared.` },
    { title: "Sanity check", body: `Quoting the variance alone would have reported ${fmtNum(d.naive)}, understating the error, because an estimator can be beautifully consistent about landing in the wrong place. Only when the bias is zero do the two figures agree.` },
  ],
  keyInsight: "Squared error decomposes into a part that repetition can shrink and a part it cannot, and the cross term between them is exactly zero. That orthogonality is why bias and variance can be traded against each other at all, and why the lowest-variance estimator is often not the best one.",
  commonTrap: "Reporting the variance as the error, which ignores a systematic offset entirely. The other slip is adding the bias rather than its square, which mixes units and lets a negative bias appear to reduce the error.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [2],
};
