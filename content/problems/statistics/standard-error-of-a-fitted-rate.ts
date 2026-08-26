import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const standardErrorOfAFittedRate: ProblemTemplate = {
  id: "statistics/standard-error-of-a-fitted-rate",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "hrt", weight: 0.2 }, { firm: "jump", weight: 0.15 }, { firm: "optiver", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the asymptotic standard error of a maximum-likelihood estimate from Fisher information" },
  params: {
    rate: { choices: [0.4, 0.5, 0.6, 0.75, 0.8, 1.2, 1.5, 1.6, 2, 2.4, 2.5, 3, 3.2, 4, 5] },
    n: { choices: [16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 324, 400] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const root = round(Math.sqrt(p.n));
    return { root, answer: round(p.rate / root), quadN: 4 * p.n, quadRoot: round(2 * root), quadSe: round(p.rate / (2 * root)) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A risk team has fitted an exponential model to the time between margin breaches, using ${fmtNum(p.n)} independent observed intervals. The maximum-likelihood breach rate came out at ${fmtNum(p.rate)} per year. ` +
    `Using the Fisher information for an exponential rate, what is the standard error of that fitted rate?`,
  solution: (p, d) => [
    { title: "The information an exponential sample carries about its rate", body: `One exponential observation carries information equal to the reciprocal of the squared rate, and independent observations add, so ${fmtNum(p.n)} intervals carry ${fmtNum(p.n)} times that. Note the information depends on the rate itself — a fast process is easier to pin down in absolute terms than a slow one is.` },
    { title: "A maximum-likelihood estimate has variance one over the information", body: `Inverting gives a variance of the squared rate over the count, so $\\text{standard error}=\\dfrac{\\text{rate}}{\\sqrt{\\text{count}}}$. The estimate's precision improves with the root of the sample size, the same square root that governs any average.` },
    { title: "Put the numbers in", body: `$\\sqrt{${fmtNum(p.n)}}=${fmtNum(d.root)}$, so the standard error is $\\dfrac{${fmtNum(p.rate)}}{${fmtNum(d.root)}}=${fmtNum(d.answer)}$ per year.` },
    { title: "Answer", body: `The fitted rate carries a standard error of ${fmtNum(d.answer)} per year.` },
    { title: "Sanity check", body: `The standard error is a fixed fraction of the rate itself — divide one by the other and the rate cancels, leaving only the sample size. That is why a fitted exponential rate always has the same RELATIVE precision at a given count: quadrupling to ${fmtNum(d.quadN)} intervals gives $\\dfrac{${fmtNum(p.rate)}}{${fmtNum(d.quadRoot)}}=${fmtNum(d.quadSe)}$, exactly half.` },
  ],
  keyInsight: "A maximum-likelihood estimate inherits its precision from the curvature of the log-likelihood, so the standard error is one over the root of the Fisher information rather than anything read off the data spread directly. For an exponential rate that information scales as the count over the squared rate, which makes the relative precision depend on the sample size alone.",
  commonTrap: "Dividing by the sample size instead of its square root, which overstates the precision badly at any realistic count. The subtler error is forgetting that this information depends on the parameter being estimated, so the standard error scales with the fitted rate — quoting a fixed absolute error regardless of how fast the process runs gets the units right and the magnitude wrong.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [2, 4],
};
