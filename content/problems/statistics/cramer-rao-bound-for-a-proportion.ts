import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const cramerRaoBoundForAProportion: ProblemTemplate = {
  id: "statistics/cramer-rao-bound-for-a-proportion",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "Fisher information and the Cramer-Rao lower bound for a Bernoulli proportion" },
  params: {
    n: { choices: [100, 200, 250, 400, 500, 625, 800, 1000, 1250, 1600, 2000, 2500] },
    pct: { choices: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const q = round(p.pct / 100);
    const oneMinus = round(1 - q);
    const product = round(q * oneMinus);
    // The root and the answer are taken from the UNROUNDED ratio. Rounding a variance of order
    // 1e-4 to nine decimal places keeps only six significant figures, and the square root then
    // carries that error into the answer — enough to miss the true bound in the sixth digit,
    // which is exactly what the Python cross-check reports at 1e-9.
    const exactVariance = (q * oneMinus) / p.n;
    return {
      q, oneMinus, product,
      variance: round(exactVariance),
      seFraction: round(Math.sqrt(exactVariance)),
      answer: round(100 * Math.sqrt(exactVariance)),
      quadN: 4 * p.n,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A execution desk wants to estimate the true fill rate of a routing venue, which it believes sits near ${fmtNum(p.pct)}%. It can afford ${fmtNum(p.n)} independent test orders, each of which either fills or does not. ` +
    `Across every possible unbiased estimator built from those ${fmtNum(p.n)} orders, what is the smallest standard error any of them can achieve, in percentage points?`,
  solution: (p, d) => [
    { title: "The bound is set by the curvature of the log-likelihood", body: `A single fill/no-fill draw carries Fisher information $\\dfrac{1}{\\text{rate}\\times(1-\\text{rate})}$ about the rate, and information from independent draws adds, so ${fmtNum(p.n)} orders carry ${fmtNum(p.n)} times that. The Cramer-Rao inequality says no unbiased estimator can have variance below the reciprocal of the total information — a floor that exists before anyone proposes an estimator.` },
    { title: "Invert the information", body: `The reciprocal of the total gives the variance floor $\\dfrac{\\text{rate}\\times(1-\\text{rate})}{\\text{orders}}$. With a rate of ${fmtNum(d.q)}, the numerator is $${fmtNum(d.q)}\\times${fmtNum(d.oneMinus)}=${fmtNum(d.product)}$.` },
    { title: "Divide by the sample size and take the root", body: `$\\dfrac{${fmtNum(d.product)}}{${fmtNum(p.n)}}=${fmtNum(d.variance)}$, and $\\sqrt{\\dfrac{${fmtNum(d.product)}}{${fmtNum(p.n)}}}=${fmtNum(d.seFraction)}$ as a fraction of one — that is ${fmtNum(d.answer)} percentage points.` },
    { title: "Answer", body: `No unbiased estimator can beat a standard error of ${fmtNum(d.answer)} percentage points.` },
    { title: "Sanity check", body: `The bound is attained here: the sample proportion itself has exactly this standard error, so the floor is reached rather than merely approached. Quadrupling the budget to ${fmtNum(d.quadN)} orders would halve it, because the information grows with the count while the standard error goes as the reciprocal of its root.` },
  ],
  keyInsight: "The Cramer-Rao bound turns a question about every possible estimator into an arithmetic problem about one number, the curvature of the log-likelihood at the truth. Information from independent observations adds, so the floor on variance falls as the reciprocal of the sample size no matter how the estimator is constructed.",
  commonTrap: "Reporting the variance floor where a standard error was asked for, which is out by a square root and lands far below the truth for a small variance. The other slip is treating the bound as a property of the sample proportion rather than of the model — it constrains every unbiased estimator at once, which is exactly what makes it worth computing before choosing one.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1, 4],
};
