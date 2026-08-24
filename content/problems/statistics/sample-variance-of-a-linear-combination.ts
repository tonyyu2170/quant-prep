import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// An equicorrelated book: every leg has the same variance and every pair the same covariance.
// That is what keeps a three-asset quadratic form printable as integers. `constraint` rejects
// draws whose covariance matrix is not positive semi-definite — for this structure the
// eigenvalues are v+2c once and v-c twice, so both must be positive or the quoted matrix
// describes no real book at all.
export const sampleVarianceOfALinearCombination: ProblemTemplate = {
  id: "statistics/sample-variance-of-a-linear-combination",
  version: 1,
  topic: "statistics/moments",
  difficulty: 3,
  firms: [{ firm: "millennium", weight: 0.25 }, { firm: "citadel", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the variance of a weighted sum under a covariance matrix" },
  params: {
    w1: { choices: [1, 2, 3, 4, 5, 6] },
    w2: { choices: [1, 2, 3, 4, 5, 7] },
    w3: { choices: [-3, -2, -1, 1, 2, 3] },
    v: { choices: [16, 25, 36, 49, 64, 100] },
    c: { choices: [-12, -8, -6, 6, 9, 12, 15] },
  },
  constraint: (p) => p.v + 2 * p.c > 0 && p.v - p.c > 0,
  derived: (p) => {
    const sumSq = p.w1 * p.w1 + p.w2 * p.w2 + p.w3 * p.w3;
    const sumCross = p.w1 * p.w2 + p.w1 * p.w3 + p.w2 * p.w3;
    const varTerm = p.v * sumSq;
    const covTerm = 2 * p.c * sumCross;
    return {
      sumSq,
      sumCross,
      varTerm,
      covTerm,
      answer: varTerm + covTerm,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A book holds ${fmtNum(p.w1)}, ${fmtNum(p.w2)} and ${fmtNum(p.w3)} lots of three instruments — a negative count being a short position. Each instrument's daily P&L per lot has variance ${fmtNum(p.v)}, and every pair of them has covariance ${fmtNum(p.c)}. ` +
    `What is the variance of the book's daily P&L?`,
  solution: (p, d) => [
    { title: "A quadratic form, not a sum of variances", body: `The book's P&L is $w_1X_1+w_2X_2+w_3X_3$, and its variance collects every product of two legs: each leg with itself carries its variance, and each PAIR carries twice its covariance, once for each order the pair can be taken in.` },
    { title: "The diagonal", body: `Squaring the three positions gives $(${fmtNum(p.w1)})^2+(${fmtNum(p.w2)})^2+(${fmtNum(p.w3)})^2=${fmtNum(d.sumSq)}$, so the variance terms contribute $${fmtNum(p.v)}\\times${fmtNum(d.sumSq)}=${fmtNum(d.varTerm)}$. The short leg squares positive, which is why a hedge cannot reduce this half.` },
    { title: "The cross terms", body: `The three pairs give $(${fmtNum(p.w1)})\\times(${fmtNum(p.w2)})+(${fmtNum(p.w1)})\\times(${fmtNum(p.w3)})+(${fmtNum(p.w2)})\\times(${fmtNum(p.w3)})=${fmtNum(d.sumCross)}$, and each is counted twice: $2\\times(${fmtNum(p.c)})\\times(${fmtNum(d.sumCross)})=${fmtNum(d.covTerm)}$.` },
    { title: "Answer", body: `Adding the two halves, $${fmtNum(d.varTerm)}+(${fmtNum(d.covTerm)})=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The cross total ${fmtNum(d.sumCross)} is where the short position earns its keep — it enters the pair sums with a minus sign and can pull the whole second half negative, while the first half is stuck positive. That asymmetry is the entire mechanism of hedging.` },
  ],
  keyInsight: "The variance of a weighted sum is a quadratic form, so positions enter squared on the diagonal and multiplied in pairs off it. Only the off-diagonal half can be made negative, which is why diversification works through covariances and never through variances.",
  commonTrap: "Adding the three variances weighted by the positions and forgetting the cross terms, which is only right when the instruments are uncorrelated. The other slip is counting each pair once rather than twice.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [1, 2, 3],
};
