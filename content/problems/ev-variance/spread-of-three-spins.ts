import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// E[max] and E[min] of three iid uniform draws on {1..s} are reflections of each other about
// (s+1)/2, so the expected range is 2E[max] - (s+1) = (s^2 - 1)/(2s). Printing the integer
// numerator and denominator keeps the chain exact.
export const spreadOfThreeSpins: ProblemTemplate = {
  id: "ev-variance/spread-of-three-spins",
  version: 1,
  firms: [{ firm: "sig", weight: 0.4 }, { firm: "optiver", weight: 0.35 }, { firm: "akuna", weight: 0.25 }],
  topic: "probability/ev-variance",
  difficulty: 2,
  source: { kind: "free-resource", inspiration: "expected spread between the largest and smallest of three uniform draws" },
  params: {
    sectors: { range: { min: 4, max: 40, step: 1 } },
    rate: { choices: [1, 2, 3, 5, 10] },
  },
  derived: (p) => {
    const sqMinus = p.sectors * p.sectors - 1;
    const twiceS = 2 * p.sectors;
    return {
      sqMinus,
      twiceS,
      meanMax: ((3 * p.sectors - 1) * (p.sectors + 1)) / (4 * p.sectors),
      meanMin: ((p.sectors + 1) * (p.sectors + 1)) / (4 * p.sectors),
      maxGap: p.sectors - 1,
      meanRange: sqMinus / twiceS,
      ev: (p.rate * sqMinus) / twiceS,
    };
  },
  statement: (p) =>
    `A spinner has ${fmtNum(p.sectors)} equal sectors labelled ${fmtNum(1)} through ${fmtNum(p.sectors)}. You spin it three times and note the largest and smallest labels you saw. A game pays ${fmtNum(p.rate)} dollars for every unit of gap between those two. What payment should you expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "The gap is a difference of two expectations", body: `The payment tracks the largest spin minus the smallest, and expectation is linear, so the expected gap is the expected largest minus the expected smallest — no joint distribution needed.` },
    { title: "The two ends are mirror images", body: `Relabelling every sector $v$ as $${fmtNum(p.sectors)}+${fmtNum(1)}-v$ leaves the spinner unchanged and swaps largest with smallest. So the two expectations sit symmetrically about the midpoint, and the expected largest is $${fmtNum(d.meanMax)}$ while the expected smallest is $${fmtNum(d.meanMin)}$.` },
    { title: "Subtract", body: `The expected gap is therefore $\\frac{${fmtNum(d.sqMinus)}}{${fmtNum(d.twiceS)}}=${fmtNum(d.meanRange)}$ sectors.` },
    { title: "Price it", body: `At ${fmtNum(p.rate)} dollars per unit of gap, the expected payment is $\\frac{${fmtNum(p.rate)}\\times${fmtNum(d.sqMinus)}}{${fmtNum(d.twiceS)}}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `The gap can never exceed ${fmtNum(d.maxGap)} sectors, and the expected gap comes in comfortably below that — three spins rarely land on both extremes at once.` },
  ],
  keyInsight: "The reflection that maps a spinner onto itself swaps the largest and smallest of any number of spins, which pins the two order statistics symmetrically about the midpoint and turns the expected range into a one-line subtraction.",
  commonTrap: "Assuming the expected gap is about half the full range, or computing the median of the three instead. The median of three draws from a symmetric spinner has the same expectation as a single spin, so it tells you nothing about the spread.",
  expectedPaceS: 120,
  constants: [1, 3],
  verify: { method: "brute-force" },
};
