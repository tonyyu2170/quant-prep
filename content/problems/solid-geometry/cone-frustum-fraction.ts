import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const coneFrustumFraction: ProblemTemplate = {
  id: "solid-geometry/cone-frustum-fraction",
  version: 1,
  topic: "pure-math/solid-geometry",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "flow", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the frustum as a cone with a similar cone removed" },
  params: {
    bigR: { choices: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 24, 25] },
    smallR: { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16] },
    wanted: { choices: [1, 2] },
  },
  constraint: (p) => p.smallR < p.bigR,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const bigCube = Math.pow(p.bigR, 3);
    const smallCube = Math.pow(p.smallR, 3);
    const frac = round((bigCube - smallCube) / bigCube);
    return {
      bigCube,
      smallCube,
      difference: bigCube - smallCube,
      frustumFraction: frac,
      answer: p.wanted === 1 ? frac : round(1 - frac),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A conical funnel is cut horizontally, and the pointed tip is discarded. The full funnel's ` +
    `mouth has radius ${fmtNum(p.bigR)} centimetres; the cut is made where the radius is ` +
    `${fmtNum(p.smallR)} centimetres. ` +
    `${p.wanted === 1 ? `What FRACTION of the original cone remains?` : `What fraction was discarded?`}`,
  solution: (p, d) => [
    { title: "The tip is a smaller copy of the whole", body: `A horizontal cut through a cone leaves a tip that is the same shape as the original, just smaller — every length scaled by the ratio of the two radii. So the tip's volume is the whole cone's, scaled by the CUBE of that ratio, and asking for a fraction cancels the constant entirely: $\\text{share}=\\dfrac{R^3-r^3}{R^3}$.` },
    { title: "Cube each radius", body: `The full mouth gives $${fmtNum(p.bigR)}\\times${fmtNum(p.bigR)}\\times${fmtNum(p.bigR)}=${fmtNum(d.bigCube)}$ and the cut radius gives $${fmtNum(p.smallR)}\\times${fmtNum(p.smallR)}\\times${fmtNum(p.smallR)}=${fmtNum(d.smallCube)}$.` },
    { title: "Answer", body: `What remains is the difference over the whole: $\\dfrac{${fmtNum(d.bigCube)}-${fmtNum(d.smallCube)}}{${fmtNum(d.bigCube)}}=\\dfrac{${fmtNum(d.difference)}}{${fmtNum(d.bigCube)}}=${fmtNum(d.frustumFraction)}$${p.wanted === 1 ? "" : `, so the discarded share is ${fmtNum(d.answer)}`}.` },
    { title: "Sanity check", body: `Cutting at ${fmtNum(p.smallR)} out of ${fmtNum(p.bigR)} removes a tip whose share is that ratio CUBED, so the discarded piece is far smaller than the cut looks: the remaining fraction ${fmtNum(d.frustumFraction)} sits well above zero. Most of a cone's volume lives near its wide end, which is why the tip is worth so little.` },
  ],
  keyInsight: "A cone cut parallel to its base leaves a scaled copy of itself, so the pieces are compared by cubing the radius ratio and nothing else. The cube is why the pointed end of any tapering shape holds so much less than it appears to.",
  commonTrap: "Taking the discarded share as the ratio of the radii, or of their squares, rather than of their cubes — both wildly overstate the tip. The other slip is treating the frustum as a cylinder of some average radius.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  // 3 is structural: the symbolic share is written with cubed radii.
  constants: [3],
};
