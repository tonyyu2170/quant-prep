import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The European call's no-arbitrage floor, quoted violated, asked for the profit. `constraint`
// needs the profit itself, both to keep it away from zero — rel 0.005 of nothing is exact
// grading — and to keep the mispricing inside a range a real quote could plausibly show. An
// arbitrage of fifty on a sixty-dollar stock is arithmetically fine and reads as a typo.
//
// The strike moves in fives and the bond price in whole cents, so the discounted strike is an
// exact two-decimal number and the printed chain that carries it never rounds an operand.
const edgeOf = (par: { spot: number; strike: number; df: number; call: number }) =>
  par.spot - par.strike * par.df - par.call;

export const callLowerBoundArbitrage: ProblemTemplate = {
  id: "finance/call-lower-bound-arbitrage",
  version: 1,
  topic: "finance/arbitrage",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "sig", weight: 0.25 }, { firm: "optiver", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the European call's lower bound, and the arbitrage when a quote violates it" },
  params: {
    spot: { choices: [50, 55, 60, 65, 70, 75, 80] },
    strike: { choices: [30, 35, 40, 45, 50, 55] },
    df: { choices: [0.94, 0.95, 0.96, 0.97, 0.98] },
    call: { range: { min: 1, max: 20, step: 0.5 } },
  },
  constraint: (p) => edgeOf(p as { spot: number; strike: number; df: number; call: number }) >= 0.5 && edgeOf(p as { spot: number; strike: number; df: number; call: number }) <= 6,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      pvK: round(p.strike * p.df),
      floor: round(p.spot - p.strike * p.df),
      intrinsic: round(Math.max(p.spot - p.strike, 0)),
      answer: round(p.spot - p.strike * p.df - p.call),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A non-dividend-paying stock trades at ${fmtNum(p.spot)}. A European call struck at ${fmtNum(p.strike)} expires on a date when a bond paying one dollar is worth ${fmtNum(p.df)} today. A dealer quotes that call at ${fmtNum(p.call)}. ` +
    `Borrowing, lending and short selling are all free of frictions. What riskless profit can you lock in today, per share?`,
  solution: (p, d) => [
    { title: "The floor the quote has to clear", body: `A European call is worth at least the share less the discounted strike: $C\\geq S-K\\,\\text{DF}$. Any less and the call, plus a bond that pays the strike at expiry, is a cheaper way to end up holding the share than buying the share.` },
    { title: "Price the floor", body: `Paying the strike on the expiry date costs $${fmtNum(p.strike)}\\times${fmtNum(p.df)}=${fmtNum(d.pvK)}$ today, so the floor sits at $${fmtNum(p.spot)}-${fmtNum(p.strike)}\\times${fmtNum(p.df)}=${fmtNum(d.floor)}$. The quote of ${fmtNum(p.call)} is below it.` },
    { title: "Build the trade", body: `Buy the call, short the share, and put ${fmtNum(d.pvK)} into the bond that pays the strike at expiry. That takes in ${fmtNum(p.spot)} from the short and pays out ${fmtNum(p.call)} and ${fmtNum(d.pvK)}, for a net receipt today of $${fmtNum(p.spot)}-${fmtNum(p.strike)}\\times${fmtNum(p.df)}-${fmtNum(p.call)}=${fmtNum(d.answer)}$.` },
    { title: "Answer: nothing can go wrong at expiry", body: `The bond delivers the strike. Above it, exercise the call, pay the strike, return the share, and the position closes at nothing. Below it, buy the share in the market for less than the strike, return it, and keep the difference. Either way the expiry leg is worth zero or better, so the ${fmtNum(d.answer)} taken in today is riskless.` },
    { title: "Sanity check", body: `The floor ${fmtNum(d.floor)} is above the call's intrinsic value of ${fmtNum(d.intrinsic)}, which is the point: the usual "worth at least what it is in the money by" bound is the weaker one, because the strike is not paid until expiry. Grading the quote against intrinsic value alone would have found no arbitrage here at all.` },
  ],
  keyInsight: "A European call's floor is the share less the DISCOUNTED strike, not the share less the strike. Waiting to pay the strike is worth something, and that difference is exactly the gap between the bound that finds this arbitrage and the one that misses it.",
  commonTrap: "Testing the quote against intrinsic value and concluding the price is fine. Intrinsic value discounts nothing, so it is a strictly weaker floor — and a quote can sit above it while still being an arbitrage against the real one.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [],
};
