import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the expectation would be typed
// twice — once to pin the answer away from zero, once to derive it.
const pointsNumerOf = (p: Params) =>
  (p.faces - p.floor + 1) * (p.floor + p.faces) + (p.floor - 1) * (p.faces + 1);
const evOf = (p: Params) => (p.rate * pointsNumerOf(p)) / (2 * p.faces);

// A stated re-roll rule, valued by splitting on the first roll. The branch that stands must be
// averaged over only the faces that actually stop the game — conditioning on having stopped is
// the whole lesson. Both branch averages land on an exact half, so they are safe operands.
// The Sanity check prices the re-roll as an option instead, which is a second derivation.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const oneOptionalReroll: ProblemTemplate = {
  id: "ev-variance/one-optional-reroll",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "original", inspiration: "a house re-roll rule on a single die, valued by conditioning on whether the first roll stands" },
  params: {
    faces: { choices: [4, 6, 8, 10, 12, 20] },
    floor: { range: { min: 2, max: 20, step: 1 } }, // rolls below this are thrown out
    rate: { range: { min: 2, max: 20, step: 1 } },
  },
  // The threshold has to sit inside the die: at 1 nothing is ever thrown out and the rule does
  // nothing, and above the top face it is not a threshold at all. Constraint 2's floor cannot
  // bind — the payout is at least two dollars a point on a roll that always shows at least one,
  // so measured over the legal space |answer| runs [5.75, 260].
  constraint: (p) => p.floor <= p.faces,
  derived: (p) => {
    const standCount = p.faces - p.floor + 1;
    const tossCount = p.floor - 1;
    return {
      standCount,
      tossCount,
      standMean: (p.floor + p.faces) / 2,
      freshMean: (p.faces + 1) / 2,
      pointsNumer: pointsNumerOf(p),
      points: pointsNumerOf(p) / (2 * p.faces),
      evNoRule: (p.rate * (p.faces + 1)) / 2,
      ev: evOf(p),
    };
  },
  statement: (p) =>
    `A fair die with ${fmtNum(p.faces)} faces, numbered 1 up to ${fmtNum(p.faces)}, is rolled once. The house rule is that a first ` +
    `roll below ${fmtNum(p.floor)} is thrown out: the die is rolled again and the second roll stands whatever it shows. Any ` +
    `other first roll stands as it is. You are paid ${fmtNum(p.rate)} dollars for each point on the roll that stands. ` +
    `What is your expected payout, in dollars?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Split on the first roll", body: `The rule creates two situations, so value each one separately. The first roll stands on ${fmtNum(d.standCount)} of the ${fmtNum(p.faces)} faces; on the other ${fmtNum(d.tossCount)} it is thrown out.` },
    // Both branch averages land on an exact half, so they can safely be operands in the weighted
    // average below; rounding either one first would drift off the printed result.
    { title: "Value each branch", body: `When the first roll stands it is not an average die at all — it is known to be at least ${fmtNum(p.floor)}. ${
      d.standCount === 1
        ? `Only the top face clears that, so the branch is worth exactly ${fmtNum(d.standMean)} points.`
        : `The faces that stand are evenly spread, so that branch averages the midpoint of them: $\\frac{${fmtNum(p.floor)}+${fmtNum(p.faces)}}{2}=${fmtNum(d.standMean)}$ points.`
    } When it is thrown out, what follows is an untouched roll of the same die, worth $\\frac{${fmtNum(p.faces)}+1}{2}=${fmtNum(d.freshMean)}$ points, and the discarded value has no say in it.` },
    { title: "Weight and scale", body: `Weight the two branches by how many faces send you to each: $\\frac{${fmtNum(d.standCount)}\\times${fmtNum(d.standMean)}+${fmtNum(d.tossCount)}\\times${fmtNum(d.freshMean)}}{${fmtNum(p.faces)}}=${fmtNum(d.points)}$ points on average. At ${fmtNum(p.rate)} dollars a point that is $\\frac{${fmtNum(p.rate)}\\times${fmtNum(d.pointsNumer)}}{2\\times${fmtNum(p.faces)}}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Price the rule as an option instead of splitting the tree. Without it every roll would simply stand, averaging ${fmtNum(d.freshMean)} points. The rule fires on ${fmtNum(d.tossCount)} of the ${fmtNum(p.faces)} faces, and when it fires it swaps a low roll for a fresh one, so add that gain on top of the plain average: $${fmtNum(d.freshMean)}+\\frac{${fmtNum(d.tossCount)}\\times${fmtNum(d.standCount)}}{2\\times${fmtNum(p.faces)}}=${fmtNum(d.points)}$ points, matching the figure above. In money that means the rule has to beat the $\\frac{${fmtNum(p.rate)}\\times(${fmtNum(p.faces)}+1)}{2}=${fmtNum(d.evNoRule)}$ dollars a plain roll would pay, and it does.` },
  ],
  keyInsight: "Splitting on the first roll is what collapses the tree, and the branch that stands must be averaged over only the faces that actually stop the game — a roll known to have cleared the threshold is worth more than a roll about which nothing is known. The branch that is thrown out simply inherits a fresh draw, because the discarded value tells you nothing about what comes next.",
  commonTrap: "Averaging the roll that stands over the whole die rather than over the faces that stand. Conditioning on having cleared the threshold is exactly what lifts that branch, and ignoring it collapses the whole calculation back to the value of a plain roll, as though the rule were worth nothing.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  // 1 is the lowest face and the offset in the fresh-roll average; 2 is the halving in both
  // branch midpoints and in the pair of faces the numerator is spread over.
  constants: [1, 2],
};
