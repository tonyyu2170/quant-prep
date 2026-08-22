import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Apex-up triangle cut parallel to the base at a drawn depth fraction t (measured from the
// apex down): the piece above the cut is a similar triangle of area share t^2, so
// P(below the cut) = 1 - t^2. Reframed from a centroid version whose answer was fixed at
// 8/9 (plan constraint 12c).
const belowOf = (p: Params) => 1 - Math.pow(p.cutPct / 100, 2);

export const triangleParallelCut: ProblemTemplate = {
  id: "geometric/triangle-parallel-cut",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.35 }, { firm: "drw", weight: 0.3 }],
  source: { kind: "original", inspiration: "parallel slice of a triangle at a drawn height" },
  params: {
    cutPct: { range: { min: 6, max: 90, step: 3 } },
    // Scale never touches the ratio; it varies the surface only.
    baseCm: { range: { min: 30, max: 80, step: 10 } },
  },
  constraint: (p) => belowOf(p) >= 0.1 && belowOf(p) <= 0.99,
  derived: (p) => {
    const t = p.cutPct / 100;
    const answer = 1 - t * t;
    const topShare = t * t;
    return { t, answer, topShare };
  },
  statement: (p) =>
    `A triangle with a ${fmtNum(p.baseCm)}-centimeter base is drawn on paper. A horizontal line cuts through it parallel to the base, passing exactly ${fmtNum(p.cutPct)} percent of the way down from the apex to the base line. A dart lands uniformly at random on the triangle's area. What is the probability it lands BELOW the cut?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `A parallel slice of a triangle is a similar, smaller triangle: at height fraction t from the apex, its linear scale is t and its area scale is t squared.` },
    { title: "Top piece", body: `Everything above the cut forms that similar triangle with area share $(${fmtNum(d.t)})^{2}$ of the whole — about ${fmtNum(d.topShare)}.` },
    { title: "Answer", body: `Below the cut is everything else: $1-${fmtNum(d.topShare)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Cutting halfway down would leave a quarter of the area above — squares of one half — and the printed numbers follow that same square law from whatever height was drawn.` },
  ],
  keyInsight: "Parallel slices of triangles are similar figures, so area shares follow the square of the height fraction and the complement finishes the question.",
  commonTrap: "Reading heights as areas directly — the strip near the apex looks thin but the area law is quadratic, which is exactly why mid-height cuts already hold three quarters.",
  expectedPaceS: 45,
  verify: { method: "montecarlo" },
  constants: [0, 1, 2],
};
