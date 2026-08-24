import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const gbmExpectedPrice: ProblemTemplate = {
  id: "stochastic/gbm-expected-price",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 2,
  firms: [{ firm: "citadel-securities", weight: 0.25 }, { firm: "optiver", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the half-variance gap between the mean and the median of a lognormal price" },
  params: {
    // Coarser than it looks like it should be, deliberately. The first draft drew 1776 tuples
    // and reported distinct@band=13 against a floor of 12: the answer space SATURATED, and a
    // near-continuum of prices merges into a handful of bands. Fewer, better-separated
    // exponents and a wide spot axis give 264 tuples and 61 bands. More draws is not more
    // spread once the answers are dense.
    spot: { choices: [40, 50, 60, 75, 90, 110, 130, 150] },
    growPct: { choices: [2, 5, 8, 12] },
    volPct: { choices: [20, 30, 40] },
    years: { choices: [1, 2, 4] },
  },
  constraint: (p) => p.growPct * p.years <= 40,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const halfVarPct = round((p.volPct * p.volPct) / 200);
    const meanRatePct = round(p.growPct + halfVarPct);
    return {
      halfVarPct,
      meanRatePct,
      medianGrowthPct: round(p.growPct * p.years),
      meanGrowthPct: round(meanRatePct * p.years),
      median: round(p.spot * Math.exp((p.growPct * p.years) / 100)),
      answer: round(p.spot * Math.exp((meanRatePct * p.years) / 100)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A name trades at ${fmtNum(p.spot)}. Its LOG price drifts up by ${fmtNum(p.growPct)} percent a year and carries an ` +
    `annual volatility of ${fmtNum(p.volPct)} percent. After ${fmtNum(p.years)} years, what is the EXPECTED price?`,
  solution: (p, d) => [
    { title: "The average log is not the log of the average", body: `A drift quoted on the log price fixes the MEDIAN outcome, because the log is symmetric about its own mean. The price itself is that log exponentiated, and exponentiating is convex — so the average price sits above the median price, by an amount that grows with the volatility and nothing else.` },
    { title: "Price the convexity", body: `The gap is exactly half the variance per unit time: $\\dfrac{${fmtNum(p.volPct)}\\times${fmtNum(p.volPct)}}{200}=${fmtNum(d.halfVarPct)}$ percent a year. Adding it to the log drift gives the rate the AVERAGE price grows at: $${fmtNum(p.growPct)}+${fmtNum(d.halfVarPct)}=${fmtNum(d.meanRatePct)}$ percent a year.` },
    { title: "Run it out to the horizon", body: `Over ${fmtNum(p.years)} years that compounds continuously at $${fmtNum(d.meanRatePct)}\\times${fmtNum(p.years)}=${fmtNum(d.meanGrowthPct)}$ percent in total, against $${fmtNum(p.growPct)}\\times${fmtNum(p.years)}=${fmtNum(d.medianGrowthPct)}$ percent for the median.` },
    { title: "Answer", body: `Applying the total growth to today's ${fmtNum(p.spot)} gives an expected price of ${fmtNum(d.answer)}, against a median of only ${fmtNum(d.median)}.` },
    { title: "Sanity check", body: `The expected price has to exceed the median, and here it does: $${fmtNum(d.answer)}>${fmtNum(d.median)}$. The gap is pure volatility — set the vol to nothing and the two collapse together, which is the only case in which quoting "the" expected price is unambiguous.` },
  ],
  keyInsight: "For a price that moves multiplicatively, the mean and the median are different questions with different answers, and the wedge between them is half the variance. Quoting one when a desk means the other is how a hedge gets sized wrong in exactly the direction that hurts.",
  commonTrap: "Exponentiating the log drift and calling the result the expected price, which actually returns the median and understates the mean. The other slip is adding the full variance rather than half of it.",
  expectedPaceS: 120,
  verify: { method: "montecarlo" },
  constants: [200],
};
