import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const atmVega: ProblemTemplate = {
  id: "finance/atm-vega",
  version: 1,
  topic: "finance/options",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "sig", weight: 0.2 }, { firm: "flow", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the vega of an at-the-money option, per point of implied volatility" },
  params: {
    spot: { choices: [40, 50, 60, 80, 100, 120, 150, 200, 250] },
    // Only months that give a terminating fraction of a year: 1/12 and 2/12 do not print
    // exactly at four significant figures, and the root chain would then be read off a
    // truncated radicand.
    months: { choices: [3, 6, 9, 12, 18, 24] },
    volPct: { choices: [16, 20, 24, 28, 32, 40] },
    ratePct: { choices: [2, 3, 4] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const round4 = (x: number) => Math.round(x * 1e4) / 1e4;
    const years = round(p.months / 12);
    const sigma = round(p.volPct / 100);
    const rate = round(p.ratePct / 100);
    const d1 = round((rate + (sigma * sigma) / 2) * Math.sqrt(years) / sigma);
    const density = round4(Math.exp((-d1 * d1) / 2) / Math.sqrt(2 * Math.PI));
    return {
      years, sigma, rate, d1, density,
      rootT: round(Math.sqrt(years)),
      answer: round((p.spot * Math.sqrt(years) * density) / 100),
      twoPoints: round((2 * p.spot * Math.sqrt(years) * density) / 100),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A ${fmtNum(p.months)}-month at-the-money call on a ${fmtNum(p.spot)} stock is marked at ${fmtNum(p.volPct)}% implied volatility, with a risk-free rate of ${fmtNum(p.ratePct)}% and no dividends. The standard normal density at the first Black-Scholes term comes to ${fmtNum(d.density)}. ` +
    `How much does the option's value move for a one-point rise in implied volatility?`,
  solution: (p, d) => [
    { title: "Vega is the spot times the root of time times a density", body: `Differentiating Black-Scholes in volatility leaves the spot, the root of the time to expiry, and the normal density at the first term — the cumulative probabilities drop out entirely. Time enters under a root, so a two-year option is not twice as vega-heavy as a one-year one.` },
    { title: "Put the numbers in", body: `Here $\\sqrt{${fmtNum(d.years)}}=${fmtNum(d.rootT)}$, so the raw sensitivity is $${fmtNum(p.spot)}\\times\\sqrt{${fmtNum(d.years)}}\\times${fmtNum(d.density)}$ per unit of volatility.` },
    { title: "Rescale to one volatility point", body: `That figure is per unit — a move of a full 100 points. Desks quote vega per POINT, so divide by 100: $\\dfrac{${fmtNum(p.spot)}\\times\\sqrt{${fmtNum(d.years)}}\\times${fmtNum(d.density)}}{100}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The option gains about ${fmtNum(d.answer)} per point of implied volatility.` },
    { title: "Sanity check", body: `Two points would be worth about ${fmtNum(d.twoPoints)}, and the linearity is the point: vega is a derivative, so it holds for a small move and drifts for a large one. Note also what is missing — the level of implied volatility barely enters at the money, which is why an at-the-money option's vega is nearly the same whether the market is calm or panicked.` },
  ],
  keyInsight: "Vega is the spot times the root of the remaining life times the normal density at the first term, so it grows with the square root of time rather than with time itself. At the money that density is near its peak and almost flat in volatility, which is why an at-the-money option is the cleanest instrument for taking a view on volatility alone.",
  commonTrap: "Quoting the raw derivative, which is the move for a rise of a full hundred volatility points, when the desk convention is per single point — an error of exactly a hundredfold. The other slip is scaling vega linearly in time to expiry: it goes as the ROOT of time, so a four-times-longer option carries twice the vega, not four times.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [2, 100],
};
