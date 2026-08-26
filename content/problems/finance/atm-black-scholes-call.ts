import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

export const atmBlackScholesCall: ProblemTemplate = {
  id: "finance/atm-black-scholes-call",
  version: 1,
  topic: "finance/options",
  difficulty: 3,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "Black-Scholes at the money, where the log-moneyness term vanishes" },
  params: {
    spot: { choices: [40, 50, 60, 80, 100, 120, 150, 200] },
    volPct: { choices: [16, 20, 24, 28, 32, 36, 40] },
    months: { choices: [3, 6, 9, 12] },
    ratePct: { choices: [2, 3, 4, 5] },
  },
  // The one degenerate draw: when the rate equals half the variance the second term is exactly
  // zero, and a chain whose two halves cancel prints as float dust rather than as the 0 it is.
  // A 20% vol against a 2% rate is the only pair in these grids that does it.
  constraint: (p) => Math.abs(p.ratePct / 100 - (p.volPct / 100) ** 2 / 2) > 1e-12,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const round4 = (x: number) => Math.round(x * 1e4) / 1e4;
    const years = round(p.months / 12);
    const sigma = round(p.volPct / 100);
    const rate = round(p.ratePct / 100);
    const rootT = round(Math.sqrt(years));
    const d1 = round((rate + (sigma * sigma) / 2) * Math.sqrt(years) / sigma);
    const d2 = round(d1 - sigma * Math.sqrt(years));
    // Quoted to four decimals in the statement, and the answer is built from those quotes —
    // the desk reads them off a table, so the arithmetic a solver does must be the arithmetic
    // the answer records. Deriving from unrounded values instead would put the printed chain a
    // last-digit step away from the answer on a fraction of the draws.
    const nd1 = round4(normalCdf(d1));
    const nd2 = round4(normalCdf(d2));
    const disc = round4(Math.exp(-rate * years));
    return {
      years, sigma, rate, rootT, d1, d2, nd1, nd2, disc,
      discounted: round(disc * nd2),
      answer: round(p.spot * (nd1 - disc * nd2)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A stock trades at ${fmtNum(p.spot)} and a ${fmtNum(p.months)}-month call is struck exactly at the money, also at ${fmtNum(p.spot)}. Implied volatility is ${fmtNum(p.volPct)}% a year, the risk-free rate is ${fmtNum(p.ratePct)}%, and there are no dividends. ` +
    `Working without a calculator, you are given that the two Black-Scholes probabilities come to ${fmtNum(d.nd1)} and ${fmtNum(d.nd2)}, and that the discount factor is ${fmtNum(d.disc)}. What is the call worth?`,
  solution: (p, d) => [
    { title: "At the money, the awkward term disappears", body: `The first Black-Scholes term normally carries the log of spot over strike. Struck at the money that log is zero, so what is left is $\\left(\\dfrac{${fmtNum(d.rate)}}{${fmtNum(d.sigma)}}+\\dfrac{${fmtNum(d.sigma)}}{2}\\right)\\times\\sqrt{${fmtNum(d.years)}}=${fmtNum(d.d1)}$ — carry and variance only, with nothing about where the strike sits.` },
    { title: "The second is one volatility step below the first", body: `Subtracting a standard deviation of the log price over the life turns the plus into a minus, and the half-variance term flips sign: $\\left(\\dfrac{${fmtNum(d.rate)}}{${fmtNum(d.sigma)}}-\\dfrac{${fmtNum(d.sigma)}}{2}\\right)\\times\\sqrt{${fmtNum(d.years)}}=${fmtNum(d.d2)}$. The gap between the two is entirely volatility times the root of time, which is the only place the option's life enters.` },
    { title: "Combine the two legs", body: `The call is the stock leg less the discounted strike leg. With the strike equal to the spot, both legs scale by ${fmtNum(p.spot)}: $${fmtNum(p.spot)}\\times(${fmtNum(d.nd1)}-${fmtNum(d.disc)}\\times${fmtNum(d.nd2)})=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The at-the-money call is worth ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The discounted second leg comes to ${fmtNum(d.discounted)} against a first leg of ${fmtNum(d.nd1)}, so the option is worth a modest fraction of the stock — an at-the-money call is nearly all time value and no intrinsic value at all, since exercising today would return nothing. Both probabilities sit near a half, which is what being at the money means before carry tilts them.` },
  ],
  keyInsight: "At the money the log-moneyness term vanishes and Black-Scholes collapses to carry and variance over volatility, which is why the at-the-money price is the one traders can quote from memory. The two probabilities differ by exactly volatility times the root of time, so the whole structure of the formula is a single volatility step.",
  commonTrap: "Discounting the stock leg as well as the strike leg. Only the strike is paid in the future, so only that leg carries the discount factor, and discounting both understates the option. The other slip is subtracting the strike from the spot to get an intrinsic value first — struck at the money there is none, and the entire premium is time value.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [2],
};
