import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Uniform point in a w x h rectangle; P(within r of a chosen corner) = pi r^2 / (4wh),
// the corner clipping the quarter-disk. Band asked through this helper (constraint cannot
// see `derived`, packages/engine/src/problem.ts:24).
const quarterOf = (p: Params) => (Math.PI * p.zoneR * p.zoneR) / (4 * p.boardW * p.boardH);

export const cornerQuarterDisk: ProblemTemplate = {
  id: "geometric/corner-quarter-disk",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "imc", weight: 0.35 }, { firm: "drw", weight: 0.3 }],
  source: { kind: "original", inspiration: "quarter-circle zone anchored at a rectangle's corner" },
  params: {
    boardW: { range: { min: 40, max: 100, step: 10 } },
    boardH: { range: { min: 40, max: 100, step: 10 } },
    zoneR: { range: { min: 10, max: 38, step: 1 } },
  },
  constraint: (p) => p.zoneR <= Math.min(p.boardW, p.boardH) && quarterOf(p) >= 0.1 && quarterOf(p) <= 0.99,
  derived: (p) => {
    const zoneArea = (Math.PI * p.zoneR * p.zoneR) / 4;
    const boardArea = p.boardW * p.boardH;
    const answer = zoneArea / boardArea;
    return { zoneArea, boardArea, answer };
  },
  statement: (p) =>
    `A sprinkler sits at one corner of a ${fmtNum(p.boardW)} by ${fmtNum(p.boardH)} meter rectangular lawn and wets everything within ${fmtNum(p.zoneR)} meters of itself. A stray seed lands uniformly at random on the lawn. What is the probability it lands in the watered zone?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The watered region is a quarter-disk — the rectangle's corner clips the full circle of radius ${fmtNum(p.zoneR)}. Uniform landing means area ratio decides.` },
    { title: "Quarter of the circle", body: `The zone covers about ${fmtNum(d.zoneArea)} square meters against the lawn's ${fmtNum(d.boardArea)} — one quarter of the circle's area, since exactly one quadrant fits inside the rectangle.` },
    { title: "Answer", body: `The probability is about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The zone stays inside the lawn on this draw, so its share cannot reach one; and it grows with the square of the sprinkler radius while the lawn stays put, which the printed numbers reflect.` },
  ],
  keyInsight: "A corner-mounted circular zone is a quarter-disk by construction, so the usual area ratio carries a built-in factor of one quarter.",
  commonTrap: "Charging the full circle's area against the lawn when only one quadrant survives inside the boundary.",
  expectedPaceS: 40,
  verify: { method: "montecarlo" },
  constants: [Math.PI, 4],
};
