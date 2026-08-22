import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Uniform point on [0, L]: probability of landing in [start, end] is the length ratio.
// `constraint` cannot see `derived` (packages/engine/src/problem.ts:24), so the Monte Carlo
// probability band (plan constraint 3) is asked through this same helper.
const afterOf = (p: Params) => 1 - p.endMark / p.trailLength;

export const segmentSubinterval: ProblemTemplate = {
  id: "geometric/segment-subinterval",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "original", inspiration: "uniform point on a segment, interval probability" },
  params: {
    trailLength: { range: { min: 60, max: 150, step: 10 } },
    endMark: { range: { min: 12, max: 135, step: 3 } },
  },
  constraint: (p) => p.endMark < p.trailLength && afterOf(p) >= 0.1 && afterOf(p) <= 0.99,
  derived: (p) => {
    const frac = p.endMark / p.trailLength;
    const complement = 1 - frac;
    const windowLeft = p.trailLength - p.endMark;
    return { frac, complement, windowLeft };
  },
  statement: (p) =>
    `A tram arrives at a uniformly random moment during a ${fmtNum(p.trailLength)}-minute service window that starts at time zero. What is the probability it arrives after minute ${fmtNum(p.endMark)}?`,
  answerKey: "complement",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Uniform arrival means the probability of landing in any stretch of minutes equals that stretch's share of the whole window.` },
    { title: "Measure the target stretch", body: `After minute ${fmtNum(p.endMark)} leaves $${fmtNum(p.trailLength)}-${fmtNum(p.endMark)}=${fmtNum(d.windowLeft)}$ minutes out of ${fmtNum(p.trailLength)} — a share of $\\frac{${fmtNum(d.windowLeft)}}{${fmtNum(p.trailLength)}}=${fmtNum(d.complement)}$.` },
    { title: "Answer", body: `The probability is $${fmtNum(d.complement)}$.` },
    { title: "Sanity check", body: `Arriving before minute ${fmtNum(p.endMark)} has probability ${fmtNum(d.frac)}, and the two shares sum to one: $\\frac{${fmtNum(p.endMark)}}{${fmtNum(p.trailLength)}}+\\frac{${fmtNum(d.windowLeft)}}{${fmtNum(p.trailLength)}}=${fmtNum(1)}$.` },
  ],
  keyInsight: "For a uniform draw the probability of any region is simply its measure divided by the whole — here, minutes over minutes.",
  commonTrap: "Reaching for distribution machinery on what is pure geometry — no arrival pattern exists beyond the flat one, so lengths do all the talking.",
  expectedPaceS: 25,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
