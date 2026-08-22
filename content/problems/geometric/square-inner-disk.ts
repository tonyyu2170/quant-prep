import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Dart lands uniformly in a w x h rectangle; P(within r of center) = pi r^2 / (wh).
// Constraint keeps the disk inside the rectangle and the answer in the MC probability band
// (plan constraint 3). `constraint` cannot see `derived`
// (packages/engine/src/problem.ts:24).
const diskOf = (p: Params) => (Math.PI * p.diskR * p.diskR) / (p.boardW * p.boardH);

export const squareInnerDisk: ProblemTemplate = {
  id: "geometric/square-inner-disk",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.35 }, { firm: "drw", weight: 0.3 }],
  source: { kind: "original", inspiration: "area ratio of a disk in a rectangular board" },
  params: {
    boardW: { range: { min: 40, max: 100, step: 10 } },
    boardH: { range: { min: 40, max: 100, step: 10 } },
    diskR: { range: { min: 6, max: 24, step: 1 } },
  },
  constraint: (p) => 2 * p.diskR <= Math.min(p.boardW, p.boardH) && diskOf(p) >= 0.1 && diskOf(p) <= 0.99,
  derived: (p) => {
    const diskArea = Math.PI * p.diskR * p.diskR;
    const boardArea = p.boardW * p.boardH;
    const answer = diskArea / boardArea;
    return { diskArea, boardArea, answer };
  },
  statement: (p) =>
    `A dartboard is a ${fmtNum(p.boardW)} by ${fmtNum(p.boardH)} centimeter rectangle, and darts land uniformly over it. A circular bullseye of radius ${fmtNum(p.diskR)} centimeters is painted at the exact center. What is the probability a dart lands inside the bullseye?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Uniform darts make every region's chance equal to its area over the whole board — position never matters, only area.` },
    { title: "Two areas", body: `The bullseye covers about ${fmtNum(d.diskArea)} square centimeters; the board covers ${fmtNum(d.boardArea)}.` },
    { title: "Answer", body: `The probability is the bullseye's share of the board, ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The whole board is the limit of growing the circle, and a circle inscribed in even a square can cover at most $\\pi/4$ of it — ${fmtNum(d.answer)} sits below that ceiling, as it must.` },
  ],
  keyInsight: "Uniform landing strips every question down to area ratios; the center position is decoration.",
  commonTrap: "Using the diameter where the radius belongs, or doubling the circle's share because the dart 'aims' at the middle — uniform means aimless.",
  expectedPaceS: 35,
  verify: { method: "montecarlo" },
  constants: [Math.PI, 4],
};
