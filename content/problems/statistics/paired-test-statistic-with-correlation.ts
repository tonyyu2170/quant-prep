import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The standard deviation of the daily DIFFERENCE is drawn, and the covariance is derived from it
// and the two standard deviations, so the paired variance is a perfect square by construction —
// drawing the covariance and hoping the difference came out square left too thin a legal space.
// `constraint` keeps the covariance positive and below the product of the standard deviations,
// so pairing is a real correlation and really helps. The sample size is a perfect square; the
// final chain divides by the drawn root and is evaluated once.
export const pairedTestStatisticWithCorrelation: ProblemTemplate = {
  id: "statistics/paired-test-statistic-with-correlation",
  version: 1,
  topic: "statistics/inference",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "jane-street", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the paired z-test, and why pairing correlated measurements buys power" },
  params: {
    sx: { choices: [3, 4, 5, 6, 7, 8, 10] },
    sy: { choices: [3, 4, 5, 6, 7, 8, 10] },
    sdD: { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] },
    n: { choices: [9, 16, 25, 36, 49, 64, 100] },
    dbar: { choices: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6] },
  },
  constraint: (p) => (p.sx * p.sx + p.sy * p.sy - p.sdD * p.sdD) / 2 > 0 && (p.sx * p.sx + p.sy * p.sy - p.sdD * p.sdD) / 2 < p.sx * p.sy && (p.dbar * Math.sqrt(p.n)) / p.sdD >= 0.3 && (p.dbar * Math.sqrt(p.n)) / p.sdD <= 6,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const varX = p.sx * p.sx;
    const varY = p.sy * p.sy;
    const varD = p.sdD * p.sdD;
    const cov = round((varX + varY - varD) / 2);
    const rootN = Math.sqrt(p.n);
    const unpairedVar = varX + varY;
    const unpairedSe = round(Math.sqrt(unpairedVar / p.n));
    return {
      varX,
      varY,
      cov,
      rho: round(cov / (p.sx * p.sy)),
      varD,
      rootN,
      se: round(p.sdD / rootN),
      unpairedVar,
      unpairedSe,
      unpairedZ: round(p.dbar / unpairedSe),
      answer: round((p.dbar * rootN) / p.sdD),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `Two execution algorithms are run side by side on the same ${fmtNum(p.n)} trading days, each working the same orders. Their daily costs, X and Y in basis points, have variances ${fmtNum(d.varX)} and ${fmtNum(d.varY)} across the days and a covariance of ${fmtNum(d.cov)}, and algorithm X averaged ${fmtNum(p.dbar)} basis points more than Y. ` +
    `Treating the daily differences as normal with these known moments, what is the paired z-statistic for the mean difference?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Pair first, then test", body: `The two algorithms saw the same days, so their costs move together and the right unit of observation is the daily DIFFERENCE. Its variance is not the sum of the two variances: $\\text{Var}(X-Y)=\\sigma_X^{2}+\\sigma_Y^{2}-2\\,\\text{Cov}(X,Y)$, and a positive covariance takes variance away. The statistic is the mean difference over that variance's standard error.` },
    { title: "The variance of a day's difference", body: `Plugging in, $${fmtNum(d.varX)}+${fmtNum(d.varY)}-2\\times${fmtNum(d.cov)}=${fmtNum(d.varD)}$, so one day's difference has standard deviation $\\sqrt{${fmtNum(d.varD)}}=${fmtNum(p.sdD)}$ basis points.` },
    { title: "The standard error of the mean difference", body: `Averaged over the days, $\\dfrac{${fmtNum(p.sdD)}}{\\sqrt{${fmtNum(p.n)}}}=${fmtNum(d.se)}$.` },
    { title: "Answer", body: `The mean difference over its standard error, written over the original figures so nothing rounded is re-used: $\\dfrac{${fmtNum(p.dbar)}\\times\\sqrt{${fmtNum(p.n)}}}{${fmtNum(p.sdD)}}=${fmtNum(d.answer)}$. X is that many standard errors dearer than Y.` },
    { title: "Sanity check", body: `Ignoring the pairing — treating the two cost series as independent samples — would put the variance of the difference at $${fmtNum(d.varX)}+${fmtNum(d.varY)}=${fmtNum(d.unpairedVar)}$ and the statistic at only ${fmtNum(d.unpairedZ)}. The correlation $\\dfrac{${fmtNum(d.cov)}}{\\sqrt{${fmtNum(d.varX)}\\times${fmtNum(d.varY)}}}=${fmtNum(d.rho)}$ is what pairing captures: the days that were expensive for X were expensive for Y too, and subtracting removes that shared noise before the comparison is made.` },
  ],
  keyInsight: "Pairing turns a two-sample question into a one-sample question about differences, and when the two series are positively correlated the difference is less noisy than either series alone. The covariance term is where the power comes from; a test that ignores it throws that power away and calls a real difference noise.",
  commonTrap: "Adding the two variances as if the samples were independent, which is the unpaired test and understates the statistic whenever the covariance is positive. The other slip is the sign on the covariance term — it is subtracted for a difference, added for a sum.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [2],
};
