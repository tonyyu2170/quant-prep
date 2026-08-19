import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Total expectation over a two-stage tree: which box, then which chip. Each box holds ten
// chips so its own expectation lands on an exact tenth of a dollar, which is what lets those
// two figures be operands in the weighted average that follows.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const urnChoiceTotalExpectation: ProblemTemplate = {
  id: "ev-variance/urn-choice-total-expectation",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "the law of total expectation on a two-stage draw, where the stage-one weights are deliberately lopsided" },
  params: {
    boxPct: { range: { min: 10, max: 90, step: 10 } }, // chance the first box is the one used
    redA: { range: { min: 2, max: 8, step: 1 } },
    redB: { range: { min: 2, max: 8, step: 1 } },
    prize: { range: { min: 10, max: 50, step: 5 } },
  },
  // Two rejections, both aimed at the Sanity check and the commonTrap. At an even split the
  // plain average of the two boxes IS the answer, so the check would assert nothing and the
  // trap would be right; with the two boxes identically stocked the two-stage structure
  // disappears entirely. Constraint 2's floor cannot bind — measured over the 3,024 legal
  // draws the answer runs [2.1, 39.5], since every box pays on at least two of its ten chips.
  constraint: (p) => p.boxPct !== 50 && p.redA !== p.redB,
  derived: (p) => {
    const otherPct = 100 - p.boxPct;
    const evA = (p.redA * p.prize) / 10;
    const evB = (p.redB * p.prize) / 10;
    return {
      otherPct, evA, evB,
      plainAvg: (evA + evB) / 2,
      ev: (p.boxPct * evA + otherPct * evB) / 100,
    };
  },
  statement: (p, d) =>
    `A dealer keeps two boxes of ten chips each. Box A holds ${fmtNum(p.redA)} red chips and the rest blue; box B holds ` +
    `${fmtNum(p.redB)} red chips and the rest blue. He reaches for box A ${fmtNum(p.boxPct)} percent of the time and box B the ` +
    `other ${fmtNum(d.otherPct)} percent, then draws one chip at random from whichever box he took. A red chip pays you ` +
    `${fmtNum(p.prize)} dollars and a blue chip pays nothing. What is your expected payout, in dollars?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Split on the first stage", body: `Do not try to list every path at once. Condition on which box the dealer takes: work out what a draw from each box is worth on its own, then average those two values using the chances of reaching each box.` },
    // Each box expectation is an exact tenth of a dollar, so both can safely appear as operands
    // in the weighted average below. Rounding either one first is what drifts.
    { title: "Value each box on its own", body: `Box A pays only on its red chips, ${fmtNum(p.redA)} of the ten, so a draw from it is worth $\\frac{${fmtNum(p.redA)}\\times${fmtNum(p.prize)}}{10}=${fmtNum(d.evA)}$ dollars. Box B has ${fmtNum(p.redB)} red chips of the ten, worth $\\frac{${fmtNum(p.redB)}\\times${fmtNum(p.prize)}}{10}=${fmtNum(d.evB)}$ dollars.` },
    { title: "Average the two, with the right weights", body: `Now weight each box by how often the dealer reaches for it: $\\frac{${fmtNum(p.boxPct)}\\times${fmtNum(d.evA)}+${fmtNum(d.otherPct)}\\times${fmtNum(d.evB)}}{100}=${fmtNum(d.ev)}$ dollars. The two-stage tree never had to be flattened into individual paths — each box's own value stood in for everything inside it.` },
    { title: "Sanity check", body: `Two things pin the figure. First, it is an average of ${fmtNum(d.evA)} and ${fmtNum(d.evB)}, so it has to land between them, and it does. Second, an even split between the boxes would answer $\\frac{${fmtNum(d.evA)}+${fmtNum(d.evB)}}{2}=${fmtNum(d.plainAvg)}$ dollars; the dealer favours box ${p.boxPct > 50 ? "A" : "B"} instead, so the answer must be dragged ${(p.boxPct > 50 ? d.evA : d.evB) > d.plainAvg ? "above" : "below"} that even-split figure — and it is.` },
  ],
  keyInsight: "A two-stage experiment collapses by conditioning on the first stage: value each branch on its own, then average those values with the weights of the branch itself. Nothing is gained by enumerating the individual paths, and the branch that is reached more often pulls the answer toward its own value.",
  commonTrap: "Averaging the two boxes' values as though the dealer flipped a coin between them. The weights of the first stage are part of the answer, so a lopsided choice moves the result off the midpoint by exactly how lopsided it is.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  // 10 is the chips in a box, 100 the percentage denominator, 2 the halving in the even-split
  // comparison.
  constants: [2, 10, 100],
};
