import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Linearity on a total: two dice of different sizes, averaged separately and added, then
// scaled by a pay rate. The Sanity check reaches the same expected total from the symmetry
// of the total's distribution instead — a different argument, not a rearrangement.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const sumOfTwoDraws: ProblemTemplate = {
  id: "ev-variance/sum-of-two-draws",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "expected total of two dice of different sizes, paid at a rate per point" },
  params: {
    red: { choices: [4, 6, 8, 10, 12, 20] },
    blue: { choices: [4, 6, 8, 10, 12, 20] },
    rate: { range: { min: 2, max: 5, step: 1 } }, // at least two so the prose never reads "1 dollars"
  },
  // Two dice of the same size collapse the problem to one doubled average and let the
  // solver skip the step the problem is drilling, so those draws are rejected.
  // Constraint 2's floor cannot bind — the smallest legal payout is 12 and the largest 85.
  constraint: (p) => p.red !== p.blue,
  derived: (p) => ({
    meanRed: (p.red + 1) / 2,
    meanBlue: (p.blue + 1) / 2,
    meanTotal: (p.red + 1) / 2 + (p.blue + 1) / 2,
    maxTotal: p.red + p.blue,
    ev: p.rate * ((p.red + 1) / 2 + (p.blue + 1) / 2),
  }),
  statement: (p) =>
    `A game rolls two fair dice together: a red one with ${fmtNum(p.red)} faces and a blue one with ${fmtNum(p.blue)} faces, ` +
    `each numbered from 1 up to its own face count. You are paid ${fmtNum(p.rate)} dollars for every point of the combined total. ` +
    `What is your expected payout, in dollars, from one roll of the pair?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The payout tracks the combined total, so find the expected total first and scale it afterwards. The joint table of every red-and-blue pair is never needed: the expectation of a sum is the sum of the expectations, whatever the two dice look like.` },
    // Both die averages land on an exact half, so adding them and scaling by an integer
    // rate stays exact; nothing rounded is ever fed into the next step.
    { title: "Average each die on its own", body: `A fair die numbered from 1 up to its face count averages the midpoint of that run. The red die averages $\\frac{${fmtNum(p.red)}+1}{2}=${fmtNum(d.meanRed)}$ and the blue die averages $\\frac{${fmtNum(p.blue)}+1}{2}=${fmtNum(d.meanBlue)}$.` },
    { title: "Add, then scale", body: `The expected total is $${fmtNum(d.meanRed)}+${fmtNum(d.meanBlue)}=${fmtNum(d.meanTotal)}$ points, and every point pays ${fmtNum(p.rate)}, so the expected payout, in dollars, is $${fmtNum(p.rate)}\\times${fmtNum(d.meanTotal)}=${fmtNum(d.ev)}$.` },
    { title: "Sanity check", body: `Reach the expected total a second way, from the shape of the total's distribution rather than from the dice separately. The total runs from 2, when both dice show their lowest face, up to $${fmtNum(p.red)}+${fmtNum(p.blue)}=${fmtNum(d.maxTotal)}$, and it is symmetric about the middle of that run — every total is exactly as likely as its mirror image. So the mean total is the midpoint, $\\frac{2+${fmtNum(d.maxTotal)}}{2}=${fmtNum(d.meanTotal)}$, matching what the two die averages gave.` },
  ],
  keyInsight: "The expectation of a total is the total of the expectations, so a pair of dice never needs its joint table: each die is averaged on its own, the averages are added, and a payout rate applies to the whole thing as one final multiplication.",
  commonTrap: "Taking a fair die to average half its face count. The faces start at one rather than at zero, so each die averages half a point higher than that, and the shortfall gets paid out at the full rate.",
  expectedPaceS: 35,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
