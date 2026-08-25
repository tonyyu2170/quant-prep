import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const displacementWaterLevelRise: ProblemTemplate = {
  id: "solid-geometry/displacement-water-level-rise",
  version: 1,
  topic: "pure-math/solid-geometry",
  difficulty: 2,
  firms: [{ firm: "akuna", weight: 0.25 }, { firm: "imc", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "displacement: a volume spread over a constant base" },
  params: {
    tankA: { choices: [10, 12, 15, 16, 20, 24, 25, 30] },
    tankB: { choices: [8, 10, 12, 15, 16, 18, 20, 25] },
    cube: { choices: [2, 3, 4, 5, 6, 8, 9, 10] },
  },
  constraint: (p) => p.cube <= Math.min(p.tankA, p.tankB) / 2,
  derived: (p) => ({
    displaced: Math.pow(p.cube, 3),
    base: p.tankA * p.tankB,
    answer: Math.round((Math.pow(p.cube, 3) / (p.tankA * p.tankB)) * 1e9) / 1e9,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A tank has a rectangular base measuring ${fmtNum(p.tankA)} by ${fmtNum(p.tankB)} centimetres ` +
    `and holds enough water to cover its floor. A solid metal cube of side ${fmtNum(p.cube)} ` +
    `centimetres is lowered in and sinks completely. By how many centimetres does the water level rise?`,
  solution: (p, d) => [
    { title: "The water has to go somewhere", body: `A submerged solid takes up room the water previously occupied, so the water is pushed upward by exactly the solid's own volume. The tank's walls are vertical, so that displaced volume spreads over an unchanging floor area — which makes the rise a single division: $\\text{rise}=\\dfrac{V}{A}$, with $V$ the solid's volume and $A$ the floor area.` },
    { title: "How much room the cube takes", body: `Its volume is $${fmtNum(p.cube)}\\times${fmtNum(p.cube)}\\times${fmtNum(p.cube)}=${fmtNum(d.displaced)}$ cubic centimetres. Note that nothing about the cube's shape matters here beyond its volume — a sphere of the same volume would raise the level identically.` },
    { title: "Spread over the floor", body: `The floor covers $${fmtNum(p.tankA)}\\times${fmtNum(p.tankB)}=${fmtNum(d.base)}$ square centimetres, so the rise is $\\dfrac{${fmtNum(d.displaced)}}{${fmtNum(d.base)}}=${fmtNum(d.answer)}$ centimetres.` },
    { title: "Answer", body: `The level rises by ${fmtNum(d.answer)} centimetres.` },
    { title: "Sanity check", body: `The rise must come in below the cube's own height of ${fmtNum(p.cube)}, since the cube's volume is spread over a floor much wider than the cube itself: $${fmtNum(d.answer)}<${fmtNum(p.cube)}$. If the tank's floor were exactly the cube's footprint, the two would be equal — and nothing can make the rise exceed the cube's height.` },
  ],
  keyInsight: "Displacement converts a solid's volume into a height by dividing by a constant base area, and the solid's shape drops out entirely. That is the whole of Archimedes' insight, and it is why an irregular object's volume is measured by dunking it rather than by measuring it.",
  commonTrap: "Dividing by the tank's volume rather than by its floor area, which produces a dimensionless number rather than a height. The other slip is using the cube's face area instead of its volume.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [],
};
