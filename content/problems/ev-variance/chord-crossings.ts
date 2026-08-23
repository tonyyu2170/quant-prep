import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Any two chords bring four independent uniform endpoints into play; in circular order the
// two chords interleave under exactly one of the three equally likely relative patterns, so
// each pair crosses with probability 1/3 and linearity gives C(n,2)/3 crossings.
export const chordCrossings: ProblemTemplate = {
  id: "ev-variance/chord-crossings",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "citadel-securities", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "free-resource", inspiration: "expected intersections of chords with random endpoints, by linearity of expectation" },
  params: {
    chords: { range: { min: 4, max: 40, step: 1 } },
    bounty: { choices: [2, 3, 5, 7, 10] },
  },
  derived: (p) => {
    const pairs = (p.chords * (p.chords - 1)) / 2;
    return { pairs, crossings: pairs / 3, ev: (p.bounty * pairs) / 3 };
  },
  statement: (p) =>
    `A design studio scatters ${fmtNum(p.chords)} chords across a circular logo: each chord gets two endpoints chosen uniformly at random and independently on the circumference. The client pays ${fmtNum(p.bounty)} dollars for every point where two chords cross (chords sharing an endpoint or overlapping have probability zero here, and no three chords ever meet at one point). What is the expected payout for the finished logo?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "One pair at a time", body: `Name an indicator for each of the $\\binom{${fmtNum(p.chords)}}{2}=${fmtNum(d.pairs)}$ pairs of chords, worth the bounty when that pair crosses. Crossings never interact, so the expected total is the sum of the per-pair expectations.` },
    { title: "The chance one pair crosses", body: `A pair of chords drags four independent uniform endpoints onto the circle. Read them in circular order: what matters is only whether the two chords' endpoints alternate, and by symmetry the three possible relative patterns are equally likely. Exactly one pattern alternates, so each pair crosses with probability $\\frac{${fmtNum(1)}}{${fmtNum(3)}}$.` },
    { title: "Add up the indicators", body: `Expected crossings are $\\frac{${fmtNum(d.pairs)}}{${fmtNum(3)}}$, and the expected payout is $\\frac{${fmtNum(p.bounty)}\\times\\binom{${fmtNum(p.chords)}}{2}}{3}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Doubling the chord count roughly quadruples the number of pairs, so the payout grows quadratically in ${fmtNum(p.chords)} — and the average crossing fraction stays pinned at a third regardless of how busy the logo gets. Both hold here.` },
  ],
  keyInsight: "Expected counts ignore dependence completely: stamp one indicator on every pair, argue each pair crosses with probability one third by the alternation symmetry of four random endpoints, and sum.",
  commonTrap: "Reaching for integral geometry, or halving the chance by treating 'interleave one way' and 'interleave the other way' as separate crossing patterns when both mean the chords cross.",
  expectedPaceS: 110,
  constants: [1, 2, 3],
  verify: { method: "montecarlo" },
};
