import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the expectation would be
// typed twice — once to pin the answer away from zero, once to derive it.
const evOf = (p: Params) => (p.winners * p.prize) / p.slots - p.cost;

// A price paid on every play against a payout collected on a few. Both signs of edge are
// drawn, so every sign-dependent sentence is a ternary rather than an assumption. The
// Sanity check re-assembles the same expectation with the price charged inside each branch.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const profitNetOfCost: ProblemTemplate = {
  id: "ev-variance/profit-net-of-cost",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "citadel-securities", weight: 0.3 }],
  source: { kind: "original", inspiration: "netting a per-play cost against a probability-weighted payout, with the edge falling either way" },
  params: {
    slots: { choices: [10, 15, 20, 25, 30, 35, 40] },
    winners: { range: { min: 2, max: 6, step: 1 } },
    prize: { range: { min: 20, max: 100, step: 10 } },
    cost: { range: { min: 2, max: 12, step: 1 } }, // at least two so the prose never reads "1 dollars"
  },
  // Constraint 2's floor, stated as the requirement. It binds here: winners*prize/slots and
  // cost can coincide exactly, and a zero expectation grades as strict float equality.
  // Payouts are multiples of 1/slots with slots at most 40, so the smallest surviving
  // |answer| is 0.025 and the largest is 58 — both comfortably inside [0.01, 1e4].
  constraint: (p) => Math.abs(evOf(p)) >= 0.01,
  derived: (p) => ({
    pWin: p.winners / p.slots,
    payoutLeg: (p.winners * p.prize) / p.slots,
    losers: p.slots - p.winners,
    ev: evOf(p),
  }),
  statement: (p) =>
    `A dealer lays out ${fmtNum(p.slots)} identical sealed envelopes. Of those, ${fmtNum(p.winners)} hold ${fmtNum(p.prize)} dollars ` +
    `each and the rest hold nothing. He sells you one envelope, drawn at random from the ${fmtNum(p.slots)}, for ${fmtNum(p.cost)} dollars. ` +
    `What is your expected profit, in dollars, on one envelope?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Two things happen on every play: you hand over the price, always, and you collect whatever is inside one envelope, which is usually nothing. Expected profit weighs the second against the first.` },
    { title: "Weight the payout", body: `The envelope you draw is a winner with probability $\\frac{${fmtNum(p.winners)}}{${fmtNum(p.slots)}}=${fmtNum(d.pWin)}$, so the expected contents, in dollars, come to $\\frac{${fmtNum(p.winners)}\\times${fmtNum(p.prize)}}{${fmtNum(p.slots)}}=${fmtNum(d.payoutLeg)}$.` },
    // Netting the price off the ROUNDED payout drifts off the printed answer, so the
    // subtraction is done over the common denominator with exact integer operands.
    { title: "Net off the price", body: `The price is paid whatever the envelope holds, so it comes off the top. Over the common denominator ${fmtNum(p.slots)} that is $\\frac{${fmtNum(p.winners)}\\times${fmtNum(p.prize)}-${fmtNum(p.slots)}\\times${fmtNum(p.cost)}}{${fmtNum(p.slots)}}=${fmtNum(d.ev)}$, the expected profit per envelope, in dollars.` },
    { title: "Sanity check", body: `Rebuild it with the price charged inside each branch instead of at the end. A winning envelope nets the prize less the price, a losing one is down the price and nothing else, and there are ${fmtNum(d.losers)} losers, so the average is $\\frac{${fmtNum(p.winners)}\\times(${fmtNum(p.prize)}-${fmtNum(p.cost)})-${fmtNum(d.losers)}\\times${fmtNum(p.cost)}}{${fmtNum(p.slots)}}=${fmtNum(d.ev)}$ — the same figure by a different route. Read once more: ${fmtNum(d.payoutLeg)} is the most an envelope is worth paying for, and the dealer asks ${fmtNum(p.cost)}, ${d.ev > 0 ? "less than that, so the edge is yours" : "more than that, so the edge is his"}.` },
  ],
  keyInsight: "A price paid on every play and a payout collected on only a few cannot be compared until the payout has been scaled by how often it actually arrives; once it has, the price simply comes off the top, because it is owed whatever the outcome turns out to be.",
  commonTrap: "Charging the price only on the plays that win — writing the winning branch as the prize less the price and stopping there, which quietly refunds the price on every losing play and overstates the profit.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [],
};
