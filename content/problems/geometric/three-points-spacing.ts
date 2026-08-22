import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Three uniform points on [0, L], pairwise gaps >= d: sorted adjacent gaps both >= d,
// a shifted-simplex volume giving ((L - 2d)/L)^3 for 2d <= L. Band asked through this
// helper (constraint cannot see `derived`, packages/engine/src/problem.ts:24).
const spacingOf = (p: Params) => Math.pow((p.stickLength - 2 * p.gapUnits) / p.stickLength, 3);

export const threePointsSpacing: ProblemTemplate = {
  id: "geometric/three-points-spacing",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "three random points with a minimum separation" },
  params: {
    stickLength: { range: { min: 60, max: 150, step: 10 } },
    gapUnits: { range: { min: 2, max: 30, step: 2 } },
  },
  constraint: (p) => 2 * p.gapUnits < p.stickLength && spacingOf(p) >= 0.1 && spacingOf(p) <= 0.99,
  derived: (p) => {
    const t = (p.stickLength - 2 * p.gapUnits) / p.stickLength;
    const answer = Math.pow(t, 3);
    const consumed = 2 * p.gapUnits;
    return { t, answer, consumed };
  },
  statement: (p) =>
    `Three drops land independently at uniformly random points on a ${fmtNum(p.stickLength)}-centimeter shelf. What is the probability every pair of marks sits at least ${fmtNum(p.gapUnits)} centimeters apart?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Order the three drops left to right; the two gaps between neighbours must each reach ${fmtNum(p.gapUnits)} — that is exactly what pairwise separation means for sorted points.` },
    { title: "Shift and rescale", body: `Demanding ${fmtNum(p.gapUnits)} from each interior gap consumes ${fmtNum(d.consumed)} of the length outright, leaving an effective span of ${fmtNum(d.t)} of the original — and uniform order statistics fill a shrunken interval just as they fill the whole one.` },
    { title: "Answer", body: `The chance is the effective span's fraction cubed: about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The cube reads correctly in both directions: doubling the demand shrinks the effective span faster than linearly, and zero separation would make the answer certain.` },
  ],
  keyInsight: "Sorted uniform points turn pairwise separation into two neighbour-gap constraints, and shifting the simplex by the demanded space cubes the surviving fraction.",
  commonTrap: "Treating the three pairwise distances as independent events to multiply — ordering the points first shows only two gaps are free.",
  expectedPaceS: 65,
  verify: { method: "montecarlo" },
  constants: [0, 1, 2],
};
