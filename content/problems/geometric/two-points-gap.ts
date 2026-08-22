import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two independent uniform points on [0, L]: P(|X - Y| < d) = 1 - (1 - d/L)^2. The band is
// asked through this helper because `constraint` cannot see `derived`
// (packages/engine/src/problem.ts:24).
const gapOf = (p: Params) => 1 - Math.pow(1 - p.gapUnits / p.stickLength, 2);

export const twoPointsGap: ProblemTemplate = {
  id: "geometric/two-points-gap",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "two random points closer than d on a segment" },
  params: {
    stickLength: { range: { min: 60, max: 150, step: 10 } },
    gapUnits: { range: { min: 6, max: 120, step: 6 } },
  },
  constraint: (p) => p.gapUnits < p.stickLength && gapOf(p) >= 0.1 && gapOf(p) <= 0.99,
  derived: (p) => {
    const t = p.gapUnits / p.stickLength;
    const answer = 1 - Math.pow(1 - t, 2);
    const farProb = Math.pow(1 - t, 2);
    const cornerLeg = p.stickLength - p.gapUnits;
    return { t, answer, farProb, cornerLeg };
  },
  statement: (p) =>
    `Two drops land independently at uniformly random positions on a ${fmtNum(p.stickLength)}-centimeter ruler. What is the probability the two marks sit less than ${fmtNum(p.gapUnits)} centimeters apart?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Work in the unit square of possible pairs: horizontal axis for the first drop, vertical for the second, both running $0$ to ${fmtNum(p.stickLength)}. Every point is equally likely.` },
    { title: "Draw the close band", body: `Pairs closer than ${fmtNum(p.gapUnits)} fill a diagonal band around the main diagonal. Its complement is two corner right triangles, each with legs of ${fmtNum(d.cornerLeg)} centimeters — the pairs that fit in opposite corners are automatically far apart.` },
    { title: "Answer", body: `Each triangle holds half of ${fmtNum(d.cornerLeg)} squared square centimeters against the square of the full length, so the close-band probability is one minus the corners' share: about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The complement — a separation of at least ${fmtNum(p.gapUnits)} — has probability ${fmtNum(d.farProb)}, and the two together account for the whole square: ${fmtNum(d.answer)}+${fmtNum(d.farProb)}=${fmtNum(1)}.` },
  ],
  keyInsight: "Two uniform draws form one uniform point in a square, and geometric probability turns the closeness condition into areas of corner triangles.",
  commonTrap: "Multiplying the per-drop chance of landing near the other by two — independence lives in the square's geometry, and the band around the diagonal is not two independent events.",
  expectedPaceS: 45,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
