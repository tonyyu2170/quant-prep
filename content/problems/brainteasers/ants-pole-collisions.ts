import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A pair collides exactly when the left ant walks right AND the right one walks left — one of
// the four equally likely direction pairs, not two, since the other closing-looking case has
// them walking apart. So probability 1/4 per pair and the expectation is C(n,2)/4 = n(n-1)/8.
export const antsPoleCollisions: ProblemTemplate = {
  id: "brainteasers/ants-pole-collisions",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "akuna", weight: 0.3 }, { firm: "flow", weight: 0.25 }],
  source: { kind: "original", inspiration: "ants on a pole; pairwise indicators" },
  params: {
    ants: { choices: [4, 5, 6, 7, 8, 9, 10, 11, 12] },
    trials: { range: { min: 20, max: 400, step: 10 } },
  },
  derived: (p) => {
    const pairs = (p.ants * (p.ants - 1)) / 2;
    return { pairs, antsLess1: p.ants - 1, perTrial: pairs / 4, answer: (p.trials * p.ants * (p.ants - 1)) / 8 };
  },
  statement: (p) =>
    `${fmtNum(p.ants)} ants are placed at distinct random points on a thin pole, each facing left or right with equal probability, and all walk at the same speed. When two ants meet they instantly reverse direction; an ant reaching an end falls off. Repeating the whole setup ${fmtNum(p.trials)} times, how many collisions should you expect in total?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Count pairs, not events", body: `Number the ants by starting position and ask, for each of the $\\binom{${p.ants}}{2}=${fmtNum(d.pairs)}$ pairs, whether that pair ever meets. Expectation adds across these indicators whether or not they are independent.` },
    { title: "A collision does not change who meets whom", body: `Two ants bouncing off each other is indistinguishable from two ants passing through each other with their labels swapped. Under the pass-through picture every ant walks in a straight line, which makes each pair easy to judge.` },
    { title: "When does one pair meet", body: `A given pair meets exactly when the left one walks right and the right one walks left — one of the four equally likely direction combinations, so probability $\\frac{1}{4}$.` },
    { title: "Add it up", body: `Each trial expects $\\frac{${p.ants}\\times${d.antsLess1}}{8}=${fmtNum(d.perTrial)}$ collisions — that is ${fmtNum(d.pairs)} pairs, each meeting a quarter of the time — so ${fmtNum(p.trials)} trials give $\\frac{${p.trials}\\times${p.ants}\\times${d.antsLess1}}{8}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The pole's length and the ants' exact positions never appear — only how many ants there are. That independence is the signature of a pairwise-indicator argument.` },
  ],
  keyInsight: "Reversal on contact is equivalent to passing through with relabelled ants, which turns a tangle of interactions into independent straight-line walks.",
  commonTrap: "Trying to trace the collision cascade forward in time. The bounces change which ant is where but not which pairs cross, and the pairwise view sidesteps the whole simulation.",
  expectedPaceS: 185,
  constants: [1, 2, 4, 8],
  verify: { method: "montecarlo" },
};
