import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Sharpe scales with the square root of the horizon because the mean adds linearly in time
// while the standard deviation adds in quadrature. The final product is stated in words
// rather than printed as an equation: both factors are rounded four-significant-figure
// decimals, and multiplying two rounded operands is what the printed-precision gate exists
// to catch. `constraint` needs the answer, so the helper is licensed.
const sharpeOf = (par: { edge: number; sd: number; periods: number }) =>
  (par.edge / par.sd) * Math.sqrt(par.periods);

export const sharpeTimeScaling: ProblemTemplate = {
  id: "statistics/sharpe-time-scaling",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "millennium", weight: 0.3 }, { firm: "citadel", weight: 0.25 }, { firm: "drw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "square-root-of-time scaling of the Sharpe ratio" },
  params: {
    edge: { choices: [2, 3, 4, 5, 7, 9, 12, 15] },
    sd: { choices: [40, 50, 65, 80, 95, 110, 130, 150] },
    periods: { choices: [252, 63, 21, 12] },
  },
  constraint: (p) => sharpeOf(p as { edge: number; sd: number; periods: number }) >= 0.2,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      perDay: round(p.edge / p.sd),
      root: round(Math.sqrt(p.periods)),
      totalEdge: p.edge * p.periods,
      totalVar: p.sd * p.sd * p.periods,
      totalSd: round(p.sd * Math.sqrt(p.periods)),
      answer: round((p.edge / p.sd) * Math.sqrt(p.periods)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A strategy's daily P&L has a mean of ${fmtNum(p.edge)} basis points and a standard deviation of ${fmtNum(p.sd)} basis points. Days are independent and identically distributed, and there is no financing cost to net off. ` +
    `What is the strategy's Sharpe ratio measured over a window of ${fmtNum(p.periods)} trading days?`,
  solution: (p, d) => [
    { title: "Sharpe over a window is total edge over total risk", body: `The Sharpe ratio of the window is $\\text{Sharpe}(T)=\\dfrac{T\\mu}{\\sqrt{T}\\,\\sigma}$ — the mean P&L of the whole window divided by its standard deviation, so both have to be pushed out to the horizon before dividing.` },
    { title: "The mean adds linearly, the variance too — but not the deviation", body: `Over ${fmtNum(p.periods)} independent days the means simply add, giving ${fmtNum(d.totalEdge)} basis points. The variances add as well, to ${fmtNum(d.totalVar)}, but the standard deviation is the square root of that, so it grows by the square root of the horizon rather than by the horizon: $\\sqrt{${fmtNum(p.periods)}}=${fmtNum(d.root)}$, giving ${fmtNum(d.totalSd)} basis points.` },
    { title: "Divide", body: `The daily Sharpe is $${fmtNum(p.edge)}/${fmtNum(p.sd)}=${fmtNum(d.perDay)}$. Scaling it by the square root of the horizon — the horizon's growth in the numerator over its square root in the denominator leaves exactly one square root — gives ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `The Sharpe ratio over ${fmtNum(p.periods)} days is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Read it the other way: ${fmtNum(d.totalEdge)} basis points of expected P&L against ${fmtNum(d.totalSd)} of standard deviation is the same ratio, which is the check that the horizon was applied to both halves and not just to the numerator.` },
  ],
  keyInsight: "Independence makes means add and variances add, and those two facts scale differently: the ratio of the two therefore grows like the square root of the horizon. Every square-root-of-time rule in finance is that single asymmetry.",
  commonTrap: "Scaling the Sharpe by the number of periods rather than by its square root, which inflates a daily figure by a factor of the horizon's square root all over again. The opposite slip is scaling neither and quoting the per-period ratio as if the horizon did not matter.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [],
};
