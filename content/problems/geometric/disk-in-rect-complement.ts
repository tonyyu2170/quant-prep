import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Circle fully inside a rectangle but OFF-center: P(inside circle) = pi r^2 / (wh) still —
// position is irrelevant, only area speaks. Complement framing; parameterized so the answer
// never collapses to the fixed pi/4 icon (spec §3 hazard 4).
const insideOf = (p: Params) => (Math.PI * p.diskR * p.diskR) / (p.boardW * p.boardH);

export const diskInRectComplement: ProblemTemplate = {
  id: "geometric/disk-in-rect-complement",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "millennium", weight: 0.3 }, { firm: "flow", weight: 0.35 }],
  source: { kind: "original", inspiration: "off-center disk complement, position-invariance lesson" },
  params: {
    boardW: { range: { min: 40, max: 100, step: 10 } },
    boardH: { range: { min: 40, max: 100, step: 10 } },
    diskR: { range: { min: 8, max: 19, step: 1 } },
  },
  constraint: (p) => 2 * p.diskR <= Math.min(p.boardW, p.boardH) && insideOf(p) >= 0.01 && 1 - insideOf(p) >= 0.1 && 1 - insideOf(p) <= 0.99,
  derived: (p) => {
    const diskShare = insideOf(p);
    const answer = 1 - diskShare;
    return { diskShare, answer };
  },
  statement: (p) =>
    `A workshop table measures ${fmtNum(p.boardW)} by ${fmtNum(p.boardH)} centimeters. A circular stain of radius ${fmtNum(p.diskR)} centimeters sits entirely on the table but nowhere in particular — off-center, not touching any edge. A coin tossed onto the table lands uniformly at random on it. What is the probability the coin misses the stain entirely?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The stain's position is a red herring: uniform landing prices every region by area alone, and a circle's area does not care where it sits.` },
    { title: "Stain share", body: `The stain holds about ${fmtNum(d.diskShare)} of the table — its area over the table's, with no correction for being off-center.` },
    { title: "Answer", body: `Missing the stain is the complement: about ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Sliding the same circle anywhere that keeps it on the table changes nothing in the printed numbers — if a candidate formula reacts to position, it is measuring something other than uniform area.` },
  ],
  keyInsight: "Uniformity makes position invisible: an off-center region scores exactly its area share, and the complement finishes the job.",
  commonTrap: "Adjusting for the circle being off-center — shrinking or growing its effective reach — when the landing law never looked at the center in the first place.",
  expectedPaceS: 40,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
