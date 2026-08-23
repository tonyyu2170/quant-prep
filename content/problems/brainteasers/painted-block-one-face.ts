import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Every printed quantity is an integer count, so no chain here can drift at display precision.
export const paintedBlockOneFace: ProblemTemplate = {
  id: "brainteasers/painted-block-one-face",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "hrt", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "painted block cut into unit cubes, counted by how many faces were exposed" },
  params: { a: { range: { min: 3, max: 12, step: 1 } }, b: { range: { min: 3, max: 12, step: 1 } }, c: { range: { min: 3, max: 12, step: 1 } } },
  constraint: (p) => p.a <= p.b && p.b <= p.c,
  derived: (p) => {
    const ia = p.a - 2, ib = p.b - 2, ic = p.c - 2;
    const faceAB = ia * ib, faceAC = ia * ic, faceBC = ib * ic;
    return {
      ia, ib, ic, faceAB, faceAC, faceBC,
      panelSum: faceAB + faceAC + faceBC,
      total: p.a * p.b * p.c,
      hidden: ia * ib * ic,
      answer: 2 * (faceAB + faceAC + faceBC),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A solid block measuring ${fmtNum(p.a)} by ${fmtNum(p.b)} by ${fmtNum(p.c)} unit cubes is glued together, and every square of its outside surface is painted. ` +
    `The block is then broken back into its ${fmtNum(d.total)} unit cubes. ` +
    `How many of those cubes have paint on exactly one face?`,
  solution: (p, d) => [
    { title: "Where a one-face cube can sit", body: `A unit cube gets paint on a face only where that face lay on the block's surface. Corner cubes show three painted faces and edge cubes two, so a cube with exactly one comes from the interior of one of the six flat sides — inside its border, never touching an edge of the block.` },
    { title: "Each side is a smaller rectangle", body: `Strip the border of width one off a side and what is left is a rectangle two shorter in each direction. The two sides measuring ${fmtNum(p.a)} by ${fmtNum(p.b)} each contribute $(${fmtNum(p.a)}-${fmtNum(2)})\\times(${fmtNum(p.b)}-${fmtNum(2)})=${fmtNum(d.faceAB)}$ cubes, the ${fmtNum(p.a)} by ${fmtNum(p.c)} sides ${fmtNum(d.faceAC)} each, and the ${fmtNum(p.b)} by ${fmtNum(p.c)} sides ${fmtNum(d.faceBC)} each.` },
    { title: "Add the six sides", body: `They pair up opposite one another, so the total is $${fmtNum(2)}\\times(${fmtNum(d.faceAB)}+${fmtNum(d.faceAC)}+${fmtNum(d.faceBC)})=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `${fmtNum(d.answer)} of the ${fmtNum(d.total)} unit cubes carry paint on exactly one face.` },
    { title: "Sanity check", body: `The completely unpainted cubes form the inner block, ${fmtNum(d.ia)} by ${fmtNum(d.ib)} by ${fmtNum(d.ic)}, which is ${fmtNum(d.hidden)} cubes. Together with the ${fmtNum(d.answer)} one-face cubes those are strictly fewer than the ${fmtNum(d.total)} in the block, the remainder being the edges and corners — which is the check that no side has been double-counted.` },
  ],
  keyInsight: "Classify by position rather than counting cubes: a unit cube's painted-face count is decided entirely by how many of the block's faces it touches, so the interior of a side, an edge and a corner are three separate populations and each is a rectangle, a line or a point.",
  commonTrap: "Stripping only one unit off a side instead of one from each end, which counts the border twice over and inflates every side by roughly its perimeter. The interior of a side is two shorter in both directions, not one.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [2],
};
