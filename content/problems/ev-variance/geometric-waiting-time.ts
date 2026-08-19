import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper here. Constraint 2 licenses one only where `constraint` has to
// re-ask the answer to pin its floor; this template's `constraint` is a structural rejection
// (the threshold has to sit inside the die) and the floor cannot bind — every game pays for at
// least one roll: measured over the legal space |answer| runs [2.105, 240].
// The first-step equation, priced by the roll. The losing side is written as a strict
// inequality so the sentence reads at both ends of the threshold range: "a roll below 2" and
// "a roll below 20" are both English, while "a roll of 20 or higher" on a twenty-sided die is
// not. The Sanity check re-prices the same game with one more ending face, which is a
// comparison against a different derived value rather than a restatement of the answer's own.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const geometricWaitingTime: ProblemTemplate = {
  id: "ev-variance/geometric-waiting-time",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "original", inspiration: "the expected wait for a first success, charged by the attempt" },
  params: {
    faces: { choices: [4, 6, 8, 10, 12, 20] },
    k: { range: { min: 2, max: 20, step: 1 } }, // rolls below k are misses
    cost: { range: { min: 2, max: 12, step: 1 } },
  },
  // The threshold must sit inside the die: above the top face nothing ever ends the game and
  // the expectation is infinite. At k = 2 exactly one face misses, which is the shortest legal
  // wait; at k = faces exactly one face ends it, which is the longest.
  constraint: (p) => p.k <= p.faces,
  derived: (p) => {
    const winFaces = p.faces - p.k + 1;
    return {
      winFaces,
      missFaces: p.k - 1,
      pEnd: winFaces / p.faces,
      rolls: p.faces / winFaces,
      evEasier: (p.cost * p.faces) / (winFaces + 1),
      spend: (p.cost * p.faces) / winFaces,
    };
  },
  statement: (p) =>
    `A fair die with ${fmtNum(p.faces)} faces, numbered 1 up to ${fmtNum(p.faces)}, is rolled over and over. ` +
    `A roll below ${fmtNum(p.k)} is a miss and the die is rolled again; the game ends on the first roll that is ` +
    `not below ${fmtNum(p.k)}. Every roll costs ${fmtNum(p.cost)} dollars, misses included. What is your expected ` +
    `total spend, in dollars, by the time the game ends?`,
  answerKey: "spend",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    // Both counts are named with a word rather than a numeral where they land on one, since
    // "1 faces" and "1 of them" are the plural bug constraint 5 warns about. The same draw —
    // a threshold at the top face — also makes the division by the ending faces a no-op, and
    // \frac{20}{1} reads as a mistake rather than as a step, so both chains drop it there.
    { title: "Count the faces that end it", body: `The faces below ${fmtNum(p.k)} are misses — ${
      d.missFaces === 1 ? "a single one of them" : `${fmtNum(d.missFaces)} of them`
    } — which leaves ${
      d.winFaces === 1 ? "a single face" : `${fmtNum(d.winFaces)} faces`
    } able to end the game. So any one roll ends it with probability $\\frac{${fmtNum(d.winFaces)}}{${fmtNum(p.faces)}}=${fmtNum(d.pEnd)}$.` },
    { title: "Fold the game into itself", body: `A miss leaves you facing exactly the game you started with — the die carries no memory of what it just showed. So the expected number of rolls is one roll plus the miss chance times that same expected number, and collecting the two sides leaves the wait as the reciprocal of the chance a roll ends it: ${
      d.winFaces === 1
        ? `just one face in ${fmtNum(p.faces)} ends the game, so the wait is the full ${fmtNum(d.rolls)} rolls`
        : `$\\frac{${fmtNum(p.faces)}}{${fmtNum(d.winFaces)}}=${fmtNum(d.rolls)}$ rolls`
    }.` },
    // The money is taken off the integer numerator, not off the printed roll count: at 20 faces
    // and 3 enders the wait prints as 6.667, and 6.667 times a rate drifts off the answer.
    { title: "Price the wait", body: `Every roll is paid for, so the spend is the roll count at ${fmtNum(p.cost)} dollars each: ${
      d.winFaces === 1
        ? `$${fmtNum(p.cost)}\\times${fmtNum(p.faces)}=${fmtNum(d.spend)}$`
        : `$\\frac{${fmtNum(p.cost)}\\times${fmtNum(p.faces)}}{${fmtNum(d.winFaces)}}=${fmtNum(d.spend)}$`
    } dollars.` },
    { title: "Sanity check", body: `Move the threshold one face lower, so that one more face ends the game. Nothing else about the game changes, and the spend comes to $\\frac{${fmtNum(p.cost)}\\times${fmtNum(p.faces)}}{${fmtNum(d.winFaces)}+1}=${fmtNum(d.evEasier)}$ dollars — below the answer, which is the only direction an easier game can move. The answer also has to clear ${fmtNum(p.cost)} dollars, since even the luckiest game pays for the roll that ends it, and it does.` },
  ],
  keyInsight: "A miss puts you back exactly where you began, so the whole remaining game can be folded back into the same unknown — that self-reference is what turns an endless sum into one line of algebra. The expected wait is the reciprocal of the chance a single attempt succeeds, so halving that chance doubles the wait.",
  commonTrap: "Paying for only the roll that ends the game, as though the misses were free. Every attempt is charged, so the cost multiplies the expected number of rolls, not the single successful one.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  // 1 is the lowest face and the extra ending face in the Sanity check's comparison.
  constants: [1],
};
