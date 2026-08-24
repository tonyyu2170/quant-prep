import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const brownianCovarianceCorrelation: ProblemTemplate = {
  id: "stochastic/brownian-covariance-correlation",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the correlation of a Brownian path with its own later value" },
  params: {
    early: { choices: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12] },
    late: { choices: [6, 8, 9, 10, 12, 15, 16, 18, 20, 24] },
    volPct: { choices: [12, 15, 20, 25, 30, 40] },
  },
  // The ratio floor is a VERIFICATION constraint, not a pedagogical one: the Monte Carlo
  // counterpart's standard error scales as (1 - r*r)/sqrt(n), so a small correlation needs
  // quadratically more draws to clear verify.py's noise bar.
  constraint: (p) => p.early < p.late && p.early / p.late >= 0.2,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      ratio: round(p.early / p.late),
      answer: round(Math.sqrt(p.early / p.late)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A price's cumulative log return follows a driftless random walk in continuous time with an annual volatility of ` +
    `${fmtNum(p.volPct)} percent. Consider the cumulative return at month ${fmtNum(p.early)} and the cumulative return ` +
    `at month ${fmtNum(p.late)}. What is the correlation between those two quantities?`,
  solution: (p, d) => [
    { title: "The later value contains the earlier one", body: `Write $a$ for the return up to the earlier date and $b$ for the FRESH return earned between the two dates. Then the later value is $a+b$, and the two increments are independent — that independence is the only property of the walk being used.` },
    { title: "Covariance keeps only the shared part", body: `Because $b$ is independent of $a$ and has no drift, it contributes nothing to the covariance. What is left is the variance of $a$ alone. So the covariance between the two dates is the variance at the EARLIER of them — the later date adds risk, but none of it is shared.` },
    { title: "Divide by the two standard deviations", body: `Variance grows in proportion to elapsed time, so the ratio of the earlier variance to the later one is $\\dfrac{${fmtNum(p.early)}}{${fmtNum(p.late)}}=${fmtNum(d.ratio)}$. The correlation divides the covariance by both standard deviations rather than by both variances, which takes a square root of that.` },
    { title: "Answer", body: `The correlation is $\\sqrt{\\dfrac{${fmtNum(p.early)}}{${fmtNum(p.late)}}}=${fmtNum(d.answer)}$ — rooted from the fraction rather than from its rounded value ${fmtNum(d.ratio)}, which would cost a digit.` },
    { title: "Sanity check", body: `The volatility of ${fmtNum(p.volPct)} percent never entered the arithmetic, and it cannot: scaling both quantities by the same factor leaves a correlation alone. Note also that the root pushes the answer UP, $${fmtNum(d.answer)}>${fmtNum(d.ratio)}$ — two dates share more correlation than their variance ratio suggests.` },
  ],
  keyInsight: "A random walk's value at two dates is correlated only through the stretch they have in common, so the covariance is set by the earlier date alone. The square root is what separates correlation from a variance ratio, and it is why distant observations stay more related than intuition expects.",
  commonTrap: "Reporting the ratio of the two times without taking the root, which confuses a variance ratio with a correlation. The other slip is expecting the volatility to matter, when scaling both series identically cannot change how they move together.",
  expectedPaceS: 115,
  verify: { method: "montecarlo" },
  constants: [],
};
