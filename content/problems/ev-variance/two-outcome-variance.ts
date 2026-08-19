import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper here, deliberately. Constraint 2 asks for one only where
// `constraint` has to re-ask the answer to pin its floor; this template's floor cannot bind
// (the smallest legal variance is 1.44) and its `constraint` is a structural rejection that
// never needs the variance, so a helper would be a second copy of the formula for nothing.
// The spread of a two-point payoff, reached through the definition rather than through a
// remembered formula: locate the mean, measure each branch's distance from it, and average
// the squares. Probabilities are whole tens so that every printed distance is an exact tenth
// and no rounded operand ever enters the next chain.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const twoOutcomeVariance: ProblemTemplate = {
  id: "ev-variance/two-outcome-variance",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "original", inspiration: "the variance of a single win-or-lose position, where the two amounts matter only through their sum" },
  params: {
    winPct: { range: { min: 10, max: 90, step: 10 } },
    w: { range: { min: 2, max: 12, step: 1 } },
    l: { range: { min: 2, max: 12, step: 1 } },
  },
  // An evenly matched position makes the Sanity check's cap an equality rather than a bound,
  // and makes the commonTrap — pricing the spread as though the branches were equally likely —
  // accidentally right, which is the Task 1 failure mode this batch guards against.
  // Constraint 2's floor cannot bind: the smallest legal variance is 1.44 and the largest
  // 138.2, both well inside [0.01, 1e4].
  constraint: (p) => p.winPct !== 50,
  derived: (p) => {
    const losePct = 100 - p.winPct;
    const gap = p.w + p.l;
    return {
      losePct,
      gap,
      mean: (p.winPct * p.w - losePct * p.l) / 100,
      devWin: (losePct * gap) / 100,
      devLose: (p.winPct * gap) / 100,
      capVar: (gap * gap) / 4,
        varProfit: (p.winPct * losePct * gap * gap) / 10000,
    };
  },
  statement: (p) =>
    `A desk puts on a single position. It gains ${fmtNum(p.w)} dollars with probability ${fmtNum(p.winPct)} percent, and otherwise ` +
    `it loses ${fmtNum(p.l)} dollars. What is the variance of the profit on the position, in squared dollars?`,
  answerKey: "varProfit",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Variance — written $\\sigma^2$ — is the average squared distance from the mean, so start by finding the mean. Weighting each branch by its own probability, the average profit is $\\frac{${fmtNum(p.winPct)}\\times${fmtNum(p.w)}-${fmtNum(d.losePct)}\\times${fmtNum(p.l)}}{100}=${fmtNum(d.mean)}$ dollars.` },
    // Every distance below is an exact tenth of a dollar, because the probabilities are whole
    // tens; the squares are then formed from those exact operands rather than from anything
    // already rounded for display.
    { title: "Measure each branch from the mean", body: `The two outcomes are ${fmtNum(p.w)} and minus ${fmtNum(p.l)}, so there is only one distance in this position: the two sit $${fmtNum(p.w)}+${fmtNum(p.l)}=${fmtNum(d.gap)}$ dollars apart. The mean falls between them and splits that gap in proportion to the two probabilities, so the winning branch lies $\\frac{${fmtNum(d.losePct)}\\times${fmtNum(d.gap)}}{100}=${fmtNum(d.devWin)}$ above it and the losing branch lies $\\frac{${fmtNum(p.winPct)}\\times${fmtNum(d.gap)}}{100}=${fmtNum(d.devLose)}$ below it.` },
    { title: "Average the squared distances", body: `Square each distance, weight it by how often that branch arrives, and add: $\\frac{${fmtNum(p.winPct)}\\times${fmtNum(d.devWin)}\\times${fmtNum(d.devWin)}+${fmtNum(d.losePct)}\\times${fmtNum(d.devLose)}\\times${fmtNum(d.devLose)}}{100}=${fmtNum(d.varProfit)}$ squared dollars. Notice the rare branch sits far from the mean but is seldom visited, while the common branch is close but visited often — the two effects work against each other.` },
    { title: "Sanity check", body: `Cap it. Among all positions whose two outcomes are ${fmtNum(d.gap)} dollars apart, the widest spread belongs to the evenly matched one, where the mean sits at the midpoint and each branch is half the gap away: that gives $\\frac{${fmtNum(d.gap)}\\times${fmtNum(d.gap)}}{4}=${fmtNum(d.capVar)}$ squared dollars. This position is not evenly matched — one branch arrives ${fmtNum(p.winPct)} percent of the time — so its variance has to come in under that ceiling, and it does.` },
  ],
  keyInsight: "A payoff with only two outcomes contains a single distance, the gap between them, so the size of the win and the size of the loss reach the spread only through their sum; everything else is how lopsided the two probabilities are, and the spread is at its widest when the branches are evenly matched.",
  commonTrap: "Treating the two branches as equally likely and quoting a quarter of the squared gap. That is the widest a payoff with this gap could ever be, so it overstates the spread of any position whose two branches arrive at different rates.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  // 100 is the percentage denominator, 4 the quartering in the Sanity check's cap, and 2 the
  // exponent in the sigma-squared notation — a bare digit the audit can trace to nothing else.
  constants: [2, 4, 100],
};
