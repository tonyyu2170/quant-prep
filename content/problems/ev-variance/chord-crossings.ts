import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Four endpoints on a circle can be paired into chords three ways and exactly one of those
// pairings crosses, so any two independent chords cross with probability 1/3. Linearity then
// adds that over all C(n,2) pairs without ever asking whether the crossings are independent.
export const chordCrossings: ProblemTemplate = {
  id: "ev-variance/chord-crossings",
  version: 1,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "citadel-securities", weight: 0.3 }, { firm: "drw", weight: 0.25 }],
  topic: "probability/ev-variance",
  difficulty: 2,
  source: { kind: "free-resource", inspiration: "expected number of intersections among random chords of a circle" },
  params: {
    chords: { range: { min: 4, max: 40, step: 1 } },
    bounty: { choices: [2, 3, 5, 7, 10] },
  },
  derived: (p) => {
    const pairs = (p.chords * (p.chords - 1)) / 2;
    return { pairs, numer: p.bounty * pairs, ev: (p.bounty * pairs) / 3 };
  },
  statement: (p) =>
    `${fmtNum(p.chords)} chords are drawn across a circle. Each chord is made by picking its two endpoints independently and uniformly at random on the circumference, and the chords are drawn independently of one another. A gallery pays ${fmtNum(p.bounty)} dollars for every point where two chords cross. How much should the artist expect to be paid?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Count crossings pair by pair", body: `Three chords almost never meet at a single point, so every crossing belongs to exactly one pair of chords. Attach an indicator to each of the $\\binom{${fmtNum(p.chords)}}{2}=${fmtNum(d.pairs)}$ pairs and add them up.` },
    { title: "One pair at a time", body: `Two chords use four endpoints in total, and those four points sit in some order around the circle. Which of them are joined to which is decided by the pairing, and there are three ways to split four labelled points into two pairs.` },
    { title: "Only one of the three crosses", body: `Reading the four points in circular order, the chords cross exactly when the pairing joins opposite points rather than neighbours — one of the three splits. Since all four endpoints were drawn from the same distribution, each split is equally likely, so a pair crosses with probability one third.` },
    { title: "Add it up", body: `Expectation adds whether or not the crossing indicators are independent, so the expected payment is $\\frac{${fmtNum(p.bounty)}\\times\\binom{${fmtNum(p.chords)}}{2}}{3}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `The circle's size never appears, and neither does any angle — only how many chords there are. That is the signature of a pairwise-indicator argument, and it is why the answer grows with the square of the chord count rather than linearly.` },
  ],
  keyInsight: "Reduce to one pair of chords, where the geometry collapses to a question about four exchangeable points: of the three ways to pair them up, exactly one crosses.",
  commonTrap: "Trying to integrate over endpoint positions, or assuming crossings are independent so the count needs a binomial. Linearity of expectation needs neither — it adds the indicators regardless of how tangled their dependence is.",
  expectedPaceS: 110,
  constants: [2, 3],
  verify: { method: "montecarlo" },
};
