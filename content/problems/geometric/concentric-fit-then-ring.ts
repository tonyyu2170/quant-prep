import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two-stage dartboard: stage one sizes the bullseye from a stated hit share (r = R sqrt(c));
// stage two prices the ring between r and an outer radius drawn as a percentage of R.
const impliedBullR = (p: Params) => p.boardR * Math.sqrt(p.bullseyePct / 100);

export const concentricFitThenRing: ProblemTemplate = {
  id: "geometric/concentric-fit-then-ring",
  version: 1,
  topic: "probability/geometric",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.3 }, { firm: "de-shaw", weight: 0.35 }],
  source: { kind: "original", inspiration: "fit a bullseye from its share, then price the ring around it" },
  params: {
    boardR: { range: { min: 30, max: 60, step: 5 } },
    bullseyePct: { range: { min: 12, max: 60, step: 4 } },
    outerPct: { choices: [70, 75, 80, 85, 90, 95] },
  },
  constraint: (p) => Math.pow(p.outerPct / 100, 2) - p.bullseyePct / 100 >= 0.1 && Math.pow(p.outerPct / 100, 2) - p.bullseyePct / 100 <= 0.99 && impliedBullR(p) < p.boardR,
  derived: (p) => {
    const bullR = impliedBullR(p);
    const outerR = (p.outerPct / 100) * p.boardR;
    const ringShare = Math.pow(p.outerPct / 100, 2) - p.bullseyePct / 100;
    return { bullR, outerR, ringShare };
  },
  statement: (p) =>
    `A circular board of radius ${fmtNum(p.boardR)} centimeters is being designed so that its central bullseye takes exactly ${fmtNum(p.bullseyePct)} percent of the board's area. Scoring also credits a ring whose outer edge sits at ${fmtNum(p.outerPct)} percent of the board's radius. What is the probability a uniformly random dart lands in that scoring ring — inside the outer edge but outside the bullseye?`,
  answerKey: "ringShare",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Stage one: size the bullseye", body: `Area shares are squared radius ratios, so the bullseye's radius is ${fmtNum(p.boardR)} times the square root of ${fmtNum(p.bullseyePct)} percent: about ${fmtNum(d.bullR)} centimeters.` },
    { title: "Stage two: price the ring", body: `The outer edge at ${fmtNum(d.outerR)} centimeters holds $(${fmtNum(p.outerPct)})^{2}$ percent of the area by itself; subtracting the bullseye's ${fmtNum(p.bullseyePct)} leaves the ring with about ${fmtNum(d.ringShare)}.` },
    { title: "Answer", body: `The ring scores with probability about ${fmtNum(d.ringShare)}.` },
    { title: "Sanity check", body: `The stage-one radius never enters stage two's arithmetic directly — only its SQUARED share does, which is the whole lesson of working in area space: radii square, shares subtract.` },
  ],
  keyInsight: "Dartboard questions live in squared-radius space: fit shares there once and every annulus is one subtraction of two printed percentages.",
  commonTrap: "Taking square roots early and carrying radii through the ring computation — rounding drift creeps in where pure percentage arithmetic stays exact.",
  expectedPaceS: 70,
  verify: { method: "montecarlo" },
  constants: [0, 2, 100],
};
