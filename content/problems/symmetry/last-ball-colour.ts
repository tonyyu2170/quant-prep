import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The last ball is exactly as likely to be red as the first: a uniformly random draw order makes
// every position identically distributed, so the answer is the plain share and the depletion of
// the urn along the way is a distraction.
export const lastBallColour: ProblemTemplate = {
  id: "symmetry/last-ball-colour",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "akuna", weight: 0.3 }, { firm: "flow", weight: 0.25 }],
  source: { kind: "original", inspiration: "the last-ball symmetry argument, counted over trials" },
  params: {
    red: { choices: [2, 3, 4, 5, 6, 7, 8, 9] },
    blue: { choices: [2, 3, 4, 5, 6, 7, 8, 9] },
    trials: { range: { min: 50, max: 600, step: 25 } },
  },
  constraint: (p) => p.red !== p.blue,
  derived: (p) => {
    const total = p.red + p.blue;
    return { total, share: p.red / total, answer: (p.trials * p.red) / total, blueEnds: (p.trials * p.blue) / total };
  },
  statement: (p, d) =>
    `An urn holds ${fmtNum(p.red)} red and ${fmtNum(p.blue)} blue balls. You draw all ${fmtNum(d.total)} out one at a time without replacement and note the colour of the very last one. Repeating this with a freshly filled urn ${fmtNum(p.trials)} times, how often should the last ball be red?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Drawing all of them is a shuffle", body: `Emptying the urn produces a uniformly random ordering of all ${fmtNum(d.total)} balls. The draws are dependent, but the ORDER is just a random permutation.` },
    { title: "No position is special", body: `In a random permutation every position is equally likely to hold any given ball. The last slot has no more claim on a colour than the first does, so the chance it is red is the plain share $\\frac{${p.red}}{${d.total}}=${fmtNum(d.share)}$.` },
    { title: "Count the trials", body: `Expected red endings across ${fmtNum(p.trials)} trials: $\\frac{${p.trials}\\times${p.red}}{${d.total}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Blue should end $\\frac{${p.trials}\\times${p.blue}}{${d.total}}=${fmtNum(d.blueEnds)}$ of them, and the two counts add back to ${fmtNum(p.trials)} — every trial ends on some colour.` },
  ],
  keyInsight: "Draw-without-replacement questions about a single position are permutation questions: every position is exchangeable, so the answer is the starting share.",
  commonTrap: "Conditioning on what came out first and tracking the shrinking urn. The dependence is real but it cancels exactly, and the bookkeeping answers a question nobody asked.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
};
