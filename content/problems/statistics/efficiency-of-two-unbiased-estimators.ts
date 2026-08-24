import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const efficiencyOfTwoUnbiasedEstimators: ProblemTemplate = {
  id: "statistics/efficiency-of-two-unbiased-estimators",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "jane-street", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "relative efficiency of two unbiased estimators" },
  params: {
    varA: { choices: [8, 10, 16, 20, 25, 32, 40, 50] },
    varB: { choices: [12, 15, 18, 24, 30, 36, 45, 60] },
    nA: { choices: [40, 50, 60, 80, 100, 120, 150, 200, 250, 300] },
  },
  // Equal variances make the two estimators indistinguishable and the question empty.
  constraint: (p) => p.varB > p.varA,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const answer = round(p.varB / p.varA);
    return {
      answer,
      matchingN: round(p.nA * answer),
      extraN: round(p.nA * answer - p.nA),
      sdRatio: round(Math.sqrt(answer)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Two estimators of the same quantity are both unbiased. From a sample of ${fmtNum(p.nA)} observations, estimator A has variance ${fmtNum(p.varA)} and estimator B has variance ${fmtNum(p.varB)}. ` +
    `What is the variance of B as a multiple of the variance of A — that is, the factor by which B is the less efficient of the two?`,
  solution: (p, d) => [
    { title: "Unbiased means variance is the whole story", body: `Both estimators are centred on the truth, so neither carries a squared-bias term and their mean squared errors ARE their variances. Comparing them is then a single ratio, $\\text{Var}(B)/\\text{Var}(A)$, with no trade-off to weigh.` },
    { title: "Take the ratio", body: `That is $${fmtNum(p.varB)}/${fmtNum(p.varA)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `Estimator B has ${fmtNum(d.answer)} times the variance of estimator A.` },
    { title: "What the factor buys", body: `Variance falls like one over the sample size, so B needs that same factor more data to match A: $${fmtNum(p.nA)}\\times${fmtNum(p.varB)}/${fmtNum(p.varA)}=${fmtNum(d.matchingN)}$ observations, or ${fmtNum(d.extraN)} more than A used. That is the honest cost of the weaker estimator, and it is the number worth quoting rather than the ratio itself.` },
    { title: "Sanity check", body: `In the units of the quantity being estimated, B's typical error is only ${fmtNum(d.sdRatio)} times A's — the square root of that variance ratio. The square root is why a large efficiency gap looks modest on a chart of errors while costing a great deal of data.` },
  ],
  keyInsight: "Relative efficiency is a ratio of variances, but the cost it implies is a ratio of sample sizes, and those are the same number only because variance falls like one over n. Reported as standard errors the gap looks half as large, which is why efficiency claims are worth converting into observations before believing them.",
  commonTrap: "Comparing standard deviations rather than variances, which understates the inefficiency by taking a square root. The other slip is comparing estimators that are not both unbiased, where variance alone no longer decides which is better.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [],
};
