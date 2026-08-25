import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Prices step in halves so the net debit — an alternating sum of three quotes — stays an exact
// decimal, and the one printed chain that carries it is over exact operands. `constraint` needs
// the debit and the profit, both of which have to be positive for the question to have an
// answer worth asking, so the helper is licensed.
const debitOf = (par: { cLow: number; cMid: number; cHigh: number }) => par.cLow - 2 * par.cMid + par.cHigh;

export const butterflyMaxProfit: ProblemTemplate = {
  id: "finance/butterfly-max-profit",
  version: 1,
  topic: "finance/options",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "sig", weight: 0.25 }, { firm: "jump", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "payoff of a long call butterfly at expiry" },
  params: {
    k1: { choices: [30, 35, 40, 45, 50, 55, 60] },
    width: { choices: [5, 10, 15, 20] },
    cLow: { range: { min: 8, max: 20, step: 0.5 } },
    cMid: { range: { min: 4, max: 12, step: 0.5 } },
    cHigh: { range: { min: 1, max: 6, step: 0.5 } },
  },
  constraint: (p) => p.cLow > p.cMid && p.cMid > p.cHigh && debitOf(p as { cLow: number; cMid: number; cHigh: number }) >= 0.5 && p.width - debitOf(p as { cLow: number; cMid: number; cHigh: number }) >= 1,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const debit = round(p.cLow - 2 * p.cMid + p.cHigh);
    return {
      k2: p.k1 + p.width,
      k3: p.k1 + 2 * p.width,
      debit,
      breakevenLow: round(p.k1 + debit),
      breakevenHigh: round(p.k1 + 2 * p.width - debit),
      answer: round(p.width - debit),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `On one underlying, with one expiry, calls are quoted at ${fmtNum(p.cLow)} for the ${fmtNum(p.k1)} strike, ${fmtNum(p.cMid)} for the ${fmtNum(d.k2)} strike, and ${fmtNum(p.cHigh)} for the ${fmtNum(d.k3)} strike — three strikes evenly spaced ${fmtNum(p.width)} apart. ` +
    `You buy one of the ${fmtNum(p.k1)} calls, sell two of the ${fmtNum(d.k2)} calls, and buy one of the ${fmtNum(d.k3)} calls. ` +
    `What is the most this position can be worth in profit at expiry, per unit?`,
  solution: (p, d) => [
    { title: "What the structure costs", body: `Buying the outer two and selling two of the middle costs $${fmtNum(p.cLow)}-${fmtNum(2)}\\times${fmtNum(p.cMid)}+${fmtNum(p.cHigh)}=${fmtNum(d.debit)}$ per unit, paid up front. That is also the most it can lose, since every leg is a call and none is naked once the position is held as a whole.` },
    { title: "Trace the payoff", body: `Below ${fmtNum(p.k1)} everything expires worthless. Between ${fmtNum(p.k1)} and ${fmtNum(d.k2)} only the lowest call is in the money and the payoff rises one-for-one. Past ${fmtNum(d.k2)} the two short calls bite twice as hard as the long one gains, so the payoff falls back at the same rate until ${fmtNum(d.k3)}, where the top call starts covering the shorts and the payoff flattens at zero.` },
    { title: "The peak sits at the middle strike", body: `The payoff is highest exactly at ${fmtNum(d.k2)}, where the lowest call is worth the full spacing of ${fmtNum(p.width)} and the other two are worthless.` },
    { title: "Answer", body: `Net of what the structure cost, the best case is $${fmtNum(p.width)}-${fmtNum(d.debit)}=${fmtNum(d.answer)}$ per unit.` },
    { title: "Sanity check", body: `The position breaks even at ${fmtNum(d.breakevenLow)} on the way up and ${fmtNum(d.breakevenHigh)} on the way down, symmetric about ${fmtNum(d.k2)} as the payoff diagram is. Outside ${fmtNum(p.k1)} and ${fmtNum(d.k3)} the loss is the ${fmtNum(d.debit)} paid and no more.` },
  ],
  keyInsight: "A butterfly is a bet on where the underlying finishes rather than on which way it goes, and its whole payoff is fixed by the strike spacing and what it cost. The maximum is the spacing less the debit, and it is reached at exactly one price.",
  commonTrap: "Reading the maximum as the strike spacing and forgetting the debit, or forgetting that the middle leg is sold twice — one short call instead of two turns a capped structure into a spread with a different shape and a different worst case.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [2],
};
