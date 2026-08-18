import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Ordered arrangements without repetition: the falling product P(n, r).
// `nMinus1`/`lastFactor` name the first and last factors of that product so the
// prose can show it; the r = 2 case is written out in full because a "first x
// ... x last" ellipsis would repeat the same factor twice.
export const distinctPermutations: ProblemTemplate = {
  id: "counting/distinct-permutations",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.4 }, { firm: "imc", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "classic permutation drill: ordered arrangements of distinct objects into a fixed number of slots" },
  params: {
    n: { range: { min: 5, max: 8, step: 1 } },
    r: { range: { min: 2, max: 5, step: 1 } },
  },
  // r <= n-2 leaves at least two books off the display, so the Sanity check's
  // multiplier (n-r)! is at least 2 — at r = n it would collapse to n! = n!.
  constraint: (p) => p.r <= p.n - 2,
  derived: (p) => {
    let ways = 1;
    for (let i = 0; i < p.r; i++) ways *= p.n - i;
    let nFact = 1;
    for (let i = 2; i <= p.n; i++) nFact *= i;
    const leftover = p.n - p.r;
    let leftoverFact = 1;
    for (let i = 2; i <= leftover; i++) leftoverFact *= i;
    return {
      ways,
      nFact,
      leftover,
      leftoverFact,
      nMinus1: p.n - 1,
      lastFactor: p.n - p.r + 1,
    };
  },
  statement: (p) =>
    `A bookshop owns ${fmtNum(p.n)} different signed hardbacks. The window display has ${fmtNum(p.r)} stands in a row, and the owner puts one book on each stand. ` +
    `Passers-by read the display left to right, so swapping two books gives a different display. How many different window displays are possible?`,
  answerKey: "ways",
  accepted: { tolerance: { abs: 0 } },
  solution: (p, d) => [
    { title: "Setup", body: `Order matters here — the leftmost stand is not the same as the rightmost — and no book can appear twice. So this is an ordered arrangement, not a selection.` },
    {
      title: "Fill the stands left to right",
      body: p.r === 2
        ? `The first stand can take any of the ${fmtNum(p.n)} books. Whichever goes there is used up and cannot reappear, so the second and last stand is down to ${fmtNum(d.lastFactor)} books.`
        : `The first stand can take any of the ${fmtNum(p.n)} books. Whichever goes there is used up, so the second stand has ${fmtNum(d.nMinus1)} books left, and each later stand has one fewer than the stand before it. The last of the ${fmtNum(p.r)} stands is down to ${fmtNum(d.lastFactor)} books.`,
    },
    {
      title: "Multiply the stand counts",
      // The falling product is written out in full below r = 4; an ellipsis there
      // would sit between two factors with nothing hidden between them.
      body: `The choices are made one after another and each count is already conditioned on the earlier picks, so multiply them: $${
        p.r === 2 ? `${fmtNum(p.n)}\\times${fmtNum(d.lastFactor)}`
        : p.r === 3 ? `${fmtNum(p.n)}\\times${fmtNum(d.nMinus1)}\\times${fmtNum(d.lastFactor)}`
        : `${fmtNum(p.n)}\\times${fmtNum(d.nMinus1)}\\times\\cdots\\times${fmtNum(d.lastFactor)}`
      }=${fmtNum(d.ways)}$ displays.`,
    },
    { title: "Sanity check", body: `Line up all ${fmtNum(p.n)} books on a shelf instead: there are $${fmtNum(p.n)}!=${fmtNum(d.nFact)}$ full orderings. Every full ordering splits into a window display plus an arrangement of the ${fmtNum(d.leftover)} books left over, and those leftovers can be ordered $${fmtNum(d.leftover)}!=${fmtNum(d.leftoverFact)}$ ways. So the display count times ${fmtNum(d.leftoverFact)} has to rebuild the full count: $${fmtNum(d.ways)}\\times${fmtNum(d.leftoverFact)}=${fmtNum(d.nFact)}$.` },
  ],
  keyInsight: "When order matters and nothing may repeat, fill the positions one at a time: each position has exactly one fewer option than the one before it, and the product rule turns that chain of shrinking choices into a single falling product.",
  commonTrap: "Treating the display as an unordered selection and dividing by the number of orderings — that answers a different question, because a display read left to right does change when two books swap stands.",
  expectedPaceS: 35,
  verify: { method: "brute-force" },
  constants: [],
};
