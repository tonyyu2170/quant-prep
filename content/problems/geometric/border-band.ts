import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Uniform point in a w x h rectangle: P(within eps of the boundary) = 1 - (w-2e)(h-2e)/(wh).
// Band and geometry guards asked through this helper (constraint cannot see `derived`,
// packages/engine/src/problem.ts:24).
const bandOf = (p: Params) => {
  const inner = (p.boardW - 2 * p.bandWidth) * (p.boardH - 2 * p.bandWidth);
  return 1 - inner / (p.boardW * p.boardH);
};

export const borderBand: ProblemTemplate = {
  id: "geometric/border-band",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "flow", weight: 0.35 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "original", inspiration: "boundary strip of a rectangular field" },
  params: {
    boardW: { range: { min: 40, max: 100, step: 10 } },
    boardH: { range: { min: 40, max: 100, step: 10 } },
    bandWidth: { range: { min: 3, max: 14, step: 1 } },
  },
  constraint: (p) => 2 * p.bandWidth < Math.min(p.boardW, p.boardH) && bandOf(p) >= 0.1 && bandOf(p) <= 0.99,
  derived: (p) => {
    const boardArea = p.boardW * p.boardH;
    const innerW = p.boardW - 2 * p.bandWidth;
    const innerH = p.boardH - 2 * p.bandWidth;
    const innerArea = innerW * innerH;
    const answer = 1 - innerArea / boardArea;
    return { boardArea, innerW, innerH, innerArea, answer };
  },
  statement: (p) =>
    `A surveyor drops a pebble uniformly at random onto a ${fmtNum(p.boardW)} by ${fmtNum(p.boardH)} meter rectangular plot. What is the probability it lands within ${fmtNum(p.bandWidth)} meters of the plot's edge?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Uniform landing makes the answer an area ratio; the strip hugging all four edges is easiest measured by what it leaves behind.` },
    { title: "The safe interior", body: `Peeling the ${fmtNum(p.bandWidth)}-meter band off every side leaves a ${fmtNum(d.innerW)} by ${fmtNum(d.innerH)} rectangle of ${fmtNum(d.innerArea)} square meters inside the ${fmtNum(d.boardArea)}-square-meter plot.` },
    { title: "Answer", body: `The band's share is $1-\\frac{${fmtNum(d.innerArea)}}{${fmtNum(d.boardArea)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The interior rectangle keeps positive width and height on this draw, so the band can never reach one — and its share grows as the peel thickens, exactly as intuition orders it.` },
  ],
  keyInsight: "Bands around a rectangle are complements of the shrunken copy — measure the easy interior, subtract from one.",
  commonTrap: "Adding the four strips' full rectangles together — corners get counted twice that way; the complement counts every band point once.",
  expectedPaceS: 35,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
