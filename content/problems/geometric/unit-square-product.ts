import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The region xy <= c inside the unit square is the full strip x <= c plus the area under the
// hyperbola y = c/x from c to 1, which integrates to c*ln(1/c). Total c*(1 + ln(1/c)).
export const unitSquareProduct: ProblemTemplate = {
  id: "geometric/unit-square-product",
  version: 1,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "sig", weight: 0.3 }, { firm: "akuna", weight: 0.25 }],
  topic: "probability/geometric",
  difficulty: 3,
  source: { kind: "free-resource", inspiration: "probability that the product of two uniform draws falls below a threshold" },
  params: {
    threshold: { range: { min: 0.025, max: 0.975, step: 0.025 } },
    bounty: { choices: [1, 2, 3, 5, 10, 20] },
  },
  derived: (p) => {
    const posLog = -Math.log(p.threshold);
    const area = p.threshold + p.threshold * posLog;
    return { posLog, strip: p.threshold, curved: p.threshold * posLog, area, ev: p.bounty * area };
  },
  statement: (p) =>
    `A dart lands uniformly at random on a square dartboard one metre on each side, and its position is recorded as a pair of coordinates, each between ${fmtNum(0)} and ${fmtNum(1)}. The board pays ${fmtNum(p.bounty)} dollars whenever the product of the two coordinates comes out at most ${fmtNum(p.threshold)}. What payment should a thrower expect per dart?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Draw the winning region", body: `The paying darts are those under the curve where the product equals ${fmtNum(p.threshold)}. That curve is a hyperbola, and the region below it is the whole strip where the first coordinate is at most ${fmtNum(p.threshold)}, plus a tail that thins out as the first coordinate grows.` },
    { title: "The strip is free", body: `Whenever the first coordinate is below ${fmtNum(p.threshold)}, the product is below ${fmtNum(p.threshold)} no matter what the second coordinate does — the second is at most ${fmtNum(1)}. That strip contributes area $${fmtNum(d.strip)}$ on its own.` },
    { title: "Integrate the tail", body: `Past that, the second coordinate must stay under the hyperbola, which leaves a slice of height ${fmtNum(p.threshold)} divided by the first coordinate. Integrating those slices from ${fmtNum(p.threshold)} up to ${fmtNum(1)} gives the threshold times a logarithm, worth $${fmtNum(d.curved)}$ here.` },
    // No arithmetic chain here on purpose. The tail is a threshold times a logarithm, and a
    // logarithm printed to four significant figures is not a safe operand: 0.9 + 0.9 x 0.1054
    // displays as 0.9949 while the true area displays as 0.9948, so the chain would straddle a
    // rounding boundary and fail printed-precision. The pieces are shown as labelled values.
    { title: "Add and price", body: `Adding the strip to the tail gives a winning area of $${fmtNum(d.area)}$, and at ${fmtNum(p.bounty)} dollars a win that is ${fmtNum(d.ev)} dollars per dart.` },
    { title: "Sanity check", body: `The winning area always beats the threshold itself, because the strip alone already matches it and the hyperbolic tail is pure bonus. It also stays below ${fmtNum(1)}, so the expected payment never reaches the full prize.` },
  ],
  keyInsight: "A product falling below a threshold is a hyperbolic region, not a triangular one — and it splits into a rectangle where the constraint is automatic and an integral where it binds.",
  commonTrap: "Guessing that the region is the triangle below a straight line, which would give half the threshold squared. The hyperbola bulges far above that line, and for small thresholds the true area is several times larger.",
  expectedPaceS: 130,
  constants: [0, 1],
  verify: { method: "montecarlo" },
};
