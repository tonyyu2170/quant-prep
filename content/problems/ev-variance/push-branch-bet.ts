import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the expectation would be typed
// twice — once to pin the answer away from zero, once to derive it.
const evOf = (p: Params) => (p.winPct * p.payout - (100 - p.winPct - p.drawPct) * p.stake) / 100;

// Three branches, the middle one paying exactly nothing. A branch worth zero still consumes
// probability, and the drill is that it cannot simply be deleted. Both signs of edge are
// drawn, so every sign-dependent sentence is a ternary rather than an assumption.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const pushBranchBet: ProblemTemplate = {
  id: "ev-variance/push-branch-bet",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "flow", weight: 0.3 }],
  source: { kind: "original", inspiration: "a three-way market where the middle result refunds the stake and pays no profit at all" },
  params: {
    winPct: { range: { min: 20, max: 70, step: 5 } },
    drawPct: { range: { min: 5, max: 30, step: 5 } },
    payout: { range: { min: 2, max: 20, step: 1 } },
    stake: { range: { min: 2, max: 20, step: 1 } },
  },
  // The losing branch must keep at least a sliver of probability or the bet stops being a bet.
  // Constraint 2's floor, stated as the requirement: a fairly priced bet answers zero, which
  // grades as strict float equality. Every expectation here is a multiple of 0.05, so the
  // floor really only rejects the exactly-fair draws; measured over the 23,254 legal draws
  // |answer| runs [0.05, 14.6].
  constraint: (p) => 100 - p.winPct - p.drawPct >= 5 && Math.abs(evOf(p)) >= 0.01,
  derived: (p) => {
    const lossPct = 100 - p.winPct - p.drawPct;
    return {
      lossPct,
      winLegNum: p.winPct * p.payout,
      lossLegNum: lossPct * p.stake,
      fairPayout: (lossPct * p.stake) / p.winPct,
      ev: evOf(p),
    };
  },
  statement: (p) =>
    `A bookmaker prices one match three ways. The home side wins ${fmtNum(p.winPct)} percent of the time, and a bet on them then ` +
    `returns a profit of ${fmtNum(p.payout)} dollars. The match is drawn ${fmtNum(p.drawPct)} percent of the time, and a draw ` +
    `refunds the stake in full, so the bet neither gains nor loses. The rest of the time the bet loses its stake of ` +
    `${fmtNum(p.stake)} dollars. What is the expected profit, in dollars, on one such bet?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Set out all three branches", body: `The three results have to account for the whole match, so the losing branch takes what is left: $100-${fmtNum(p.winPct)}-${fmtNum(p.drawPct)}=${fmtNum(d.lossPct)}$ percent. The draw branch is the one to be careful with — it pays a profit of 0, which is a contribution to the average, not an absence of one.` },
    // The two legs are kept as integer numerators over a hundred and differenced there. Weighting
    // each branch into a decimal first and subtracting those would feed a rounded operand into
    // the last step, which is what drifts off the printed answer.
    { title: "Weight the two branches that move", body: `Measured in dollars, the winning branch contributes ${fmtNum(p.winPct)} hundredths of ${fmtNum(p.payout)}, and the losing branch takes away ${fmtNum(d.lossPct)} hundredths of ${fmtNum(p.stake)}. The draw contributes ${fmtNum(p.drawPct)} hundredths of 0, which is 0 however often it happens.` },
    { title: "Combine", body: `Difference the two live branches over the common denominator, where the arithmetic stays exact: $\\frac{${fmtNum(p.winPct)}\\times${fmtNum(p.payout)}-${fmtNum(d.lossPct)}\\times${fmtNum(p.stake)}}{100}=${fmtNum(d.ev)}$ dollars of expected profit per bet placed.` },
    { title: "Sanity check", body: `Price the bet the other way round: what profit would the winning branch have to return to break even against the losing branch? Exactly enough to cover it, which is $\\frac{${fmtNum(d.lossPct)}\\times${fmtNum(p.stake)}}{${fmtNum(p.winPct)}}=${fmtNum(d.fairPayout)}$ dollars — a figure the draw branch never enters, since a refund neither helps nor hurts. The bookmaker offers ${fmtNum(p.payout)}, ${d.ev > 0 ? "more than that, so the expected profit must come out positive" : "less than that, so the expected profit must come out negative"} — and it does.` },
  ],
  keyInsight: "A branch that pays nothing is not the same as a branch that is not there: it contributes zero to the average but still takes up probability, and that is exactly what holds the winning and losing branches down to their true share of the whole outcome space.",
  commonTrap: "Deleting the refund branch and rescaling the other two so their probabilities add back to one, as though the bet were always won or lost. That answers the profit per settled bet rather than per bet placed, a figure pushed further from zero than the truth in whichever direction the bet already leans.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  // 100 is the percentage denominator; 0 is the profit on the refund branch, a bare digit no
  // param or derived value carries.
  constants: [0, 100],
};
