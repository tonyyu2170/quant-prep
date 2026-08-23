import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two window sums built to share days on purpose. Everything printed is an integer product of
// integers, so no chain here can round. `constraint` only rejects an overlap that would not fit
// inside both windows, which is structural and never asks the answer — hence no helper.
export const overlappingWindowSums: ProblemTemplate = {
  id: "statistics/overlapping-window-sums",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.3 }, { firm: "hrt", weight: 0.25 }, { firm: "citadel", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "variance of a sum of two overlapping window totals of an iid series" },
  params: {
    v: { choices: [2, 3, 4, 5, 6, 9] },
    a: { range: { min: 4, max: 10, step: 1 } },
    b: { range: { min: 4, max: 10, step: 1 } },
    ov: { choices: [1, 2, 3] },
  },
  constraint: (p) => p.ov < Math.min(p.a, p.b),
  derived: (p) => ({
    varX: p.v * p.a,
    varY: p.v * p.b,
    cov: p.v * p.ov,
    crossTerm: 2 * p.v * p.ov,
    answer: p.v * (p.a + p.b + 2 * p.ov),
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A desk's daily P&L is independent from day to day with variance ${fmtNum(p.v)} on every day. X is the total P&L over the first ${fmtNum(p.a)} trading days. Y is the total over a window of ${fmtNum(p.b)} days that begins ${fmtNum(p.ov)} days before X's window ends, so the two windows share exactly ${fmtNum(p.ov)} days. ` +
    `What is the variance of X plus Y?`,
  solution: (p, d) => [
    { title: "Variance of a sum is not a sum of variances", body: `For any two quantities $\\text{Var}(X+Y)=\\text{Var}(X)+\\text{Var}(Y)+2\\,\\text{Cov}(X,Y)$. The covariance term vanishes only when the two are uncorrelated, and these two are built to share days.` },
    { title: "Each window on its own", body: `Independent days add their variances, so X has variance $${fmtNum(p.v)}\\times${fmtNum(p.a)}=${fmtNum(d.varX)}$ and Y has $${fmtNum(p.v)}\\times${fmtNum(p.b)}=${fmtNum(d.varY)}$.` },
    { title: "Only the shared days covary", body: `A day in X and a different day in Y contribute nothing to the covariance, because distinct days are independent. A day counted in both contributes its own variance. With ${fmtNum(p.ov)} shared days that is $${fmtNum(p.v)}\\times${fmtNum(p.ov)}=${fmtNum(d.cov)}$.` },
    { title: "Answer", body: `The covariance enters twice: $${fmtNum(d.varX)}+${fmtNum(d.varY)}+${fmtNum(2)}\\times${fmtNum(d.cov)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Count it the other way as a check. X plus Y is a weighted sum over the distinct days involved, not over ${fmtNum(p.a)} plus ${fmtNum(p.b)} of them: a day in only one window carries a weight of one, and each of the ${fmtNum(p.ov)} shared days carries a weight of two. Variance squares those weights, so a shared day contributes four times one day's variance where two separate days would have contributed twice. That excess, summed over the shared days, is exactly the cross term counted above.` },
  ],
  keyInsight: "Overlap between two sums is the whole covariance: independent days contribute nothing across windows, and each shared day contributes exactly one day's variance. Sliding the second window by a day changes the answer even though neither window's own variance moves.",
  commonTrap: "Adding the two window variances and stopping, which is right only for disjoint windows. The cross term enters twice, so ignoring a small overlap understates the variance by twice what the shared days are worth.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [2],
};
