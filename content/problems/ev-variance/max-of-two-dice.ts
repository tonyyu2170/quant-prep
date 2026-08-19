import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the expectation would be typed
// twice — once to pin the answer away from zero, once to derive it.
const topNumerOf = (n: number) => n * n * n - ((n - 1) * n * (2 * n - 1)) / 6;
const evOf = (p: Params) => (p.rate * topNumerOf(p.faces)) / (p.faces * p.faces) - p.fee;

// The expected larger of two draws, reached by counting how many of the ordered pairs sit at
// or below each level rather than by listing the pairs. Everything stays as an integer
// numerator over the pair count, so the entry fee can be netted off inside the same chain.
// The Sanity check reads the lower die out of the same total and carries through to the fee.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const maxOfTwoDice: ProblemTemplate = {
  id: "ev-variance/max-of-two-dice",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "citadel-securities", weight: 0.3 }],
  source: { kind: "original", inspiration: "the expected higher of two dice, priced against an entry fee" },
  params: {
    faces: { choices: [4, 6, 8, 10, 12, 20] },
    rate: { range: { min: 2, max: 10, step: 1 } },
    fee: { range: { min: 2, max: 20, step: 1 } },
  },
  // Constraint 2's floor and ceiling, stated as the requirement: a fee that exactly matches
  // the expected payout answers zero, which grades as strict float equality. Neither binds on
  // this space — the check rejects none of the 1,026 draws and |answer| runs [0.02778, 136.3]
  // — but the expectation moves in steps as fine as a four-hundredth on the twenty-sided draw,
  // so a wider rate or fee would reach the floor and the rule travels with the template.
  constraint: (p) => Math.abs(evOf(p)) >= 0.01,
  derived: (p) => {
    const sqBelow = ((p.faces - 1) * p.faces * (2 * p.faces - 1)) / 6;
    const topNumer = topNumerOf(p.faces);
    const pairs = p.faces * p.faces;
    return {
      sqBelow,
      topNumer,
      // The lower die is reconciled against the higher one in integer numerators, never by
      // differencing the two printed averages: at twenty faces those round to 13.83 and 7.175,
      // which add to 21.01 against a total of 21. Contract 6's second paragraph, exactly.
      lowNumer: (p.faces + 1) * pairs - topNumer,
      topMean: topNumer / pairs,
      lowMean: ((p.faces + 1) * pairs - topNumer) / pairs,
      singleMean: (p.faces + 1) / 2,
      evSingle: (p.rate * (p.faces + 1)) / 2 - p.fee,
      ev: evOf(p),
    };
  },
  statement: (p) =>
    `Two fair dice, each with ${fmtNum(p.faces)} faces numbered 1 up to ${fmtNum(p.faces)}, are rolled together. You are paid ` +
    `${fmtNum(p.rate)} dollars for every point showing on the higher of the two dice; if both show the same number, that number ` +
    `is the higher one. A turn costs ${fmtNum(p.fee)} dollars to play. What is your expected profit, in dollars, on one turn?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Count from the top down", body: `Listing every pair is unnecessary. The higher die comes out at or below some level only when both dice do, so of the ${fmtNum(p.faces)} times ${fmtNum(p.faces)} ordered pairs, the number failing to beat a level is that level squared. Adding up how often the higher die falls short at each level in turn is what gives the average.` },
    // Every chain stays on integers over the pair count, so the fee can be netted off inside the
    // same fraction; printing the average first and multiplying the rounded decimal by the rate
    // is the drift this avoids.
    { title: "Add the shortfalls", body: `Those squared counts, taken over every level below the top, total $\\frac{(${fmtNum(p.faces)}-1)\\times${fmtNum(p.faces)}\\times(2\\times${fmtNum(p.faces)}-1)}{6}=${fmtNum(d.sqBelow)}$. Subtracting them from the ${fmtNum(p.faces)} full sets of pairs leaves $${fmtNum(p.faces)}\\times${fmtNum(p.faces)}\\times${fmtNum(p.faces)}-${fmtNum(d.sqBelow)}=${fmtNum(d.topNumer)}$ points across all the pairs.` },
    { title: "Average and net off the fee", body: `Spread that total over the pairs and the higher die averages $\\frac{${fmtNum(d.topNumer)}}{${fmtNum(p.faces)}\\times${fmtNum(p.faces)}}=${fmtNum(d.topMean)}$ points. The fee is owed whatever the dice show, so it comes straight off: $\\frac{${fmtNum(p.rate)}\\times${fmtNum(d.topNumer)}}{${fmtNum(p.faces)}\\times${fmtNum(p.faces)}}-${fmtNum(p.fee)}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Read the lower die out of the same total. On every roll the higher and the lower die between them show exactly what the two dice show, so the points the two of them carry across all the pairs have to add up to the whole: $${fmtNum(d.topNumer)}+${fmtNum(d.lowNumer)}=(${fmtNum(p.faces)}+1)\\times${fmtNum(p.faces)}\\times${fmtNum(p.faces)}$. That puts the lower die at $\\frac{${fmtNum(d.lowNumer)}}{${fmtNum(p.faces)}\\times${fmtNum(p.faces)}}=${fmtNum(d.lowMean)}$ points, below the $\\frac{${fmtNum(p.faces)}+1}{2}=${fmtNum(d.singleMean)}$ a single die averages — the right side of it for the smaller of two. Carrying that through to the money: the same rate and the same fee on one plain die would leave $\\frac{${fmtNum(p.rate)}\\times(${fmtNum(p.faces)}+1)}{2}-${fmtNum(p.fee)}=${fmtNum(d.evSingle)}$ dollars, so taking the higher of two has to pay more, and it does.` },
  ],
  keyInsight: "Taking the larger of two independent draws pulls the average up toward the top of the range, because the pair only fails to beat a level when both draws fail — squaring that chance is what makes the high values so much more likely to be the one that counts.",
  commonTrap: "Pricing the higher die at what a single die averages, or equivalently at the average of the two dice. That is what the pair averages between them, not what its larger member averages, and it undercharges for the game by the whole benefit of getting to keep the better roll.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  // 1 is the lowest face and the offset in the level counts, 2 the doubling in the squared-count
  // total and the halving of a single die's range, 6 the denominator of that same total.
  constants: [1, 2, 6],
};
