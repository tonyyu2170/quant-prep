import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Dartboard bullseye: P(within concentric r | board R) = (r/R)^2. Parameterized so the
// answer varies over draws — never the fixed pi/4 icon (spec §3 hazard 4).
const bullseyeOf = (p: Params) => Math.pow(p.bullR / p.boardR, 2);

export const concentricCircles: ProblemTemplate = {
  id: "geometric/concentric-circles",
  version: 1,
  topic: "probability/geometric",
  difficulty: 1,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "millennium", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "concentric dartboard area ratio" },
  params: {
    boardR: { range: { min: 20, max: 50, step: 2 } },
    bullR: { range: { min: 7, max: 34, step: 1 } },
  },
  constraint: (p) => p.bullR < p.boardR && bullseyeOf(p) >= 0.1 && bullseyeOf(p) <= 0.99,
  derived: (p) => {
    const ratio = p.bullR / p.boardR;
    const answer = ratio * ratio;
    const ringShare = 1 - answer;
    return { ratio, answer, ringShare };
  },
  statement: (p) =>
    `A dartboard is a circle of radius ${fmtNum(p.boardR)} centimeters with a concentric bullseye of radius ${fmtNum(p.bullR)} centimeters. Darts land uniformly at random on the board. What is the probability a dart lands in the bullseye?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Uniform landing reduces everything to areas — and both areas carry the same factor of $\\pi$, which cancels.` },
    { title: "Cancel pi", body: `Bullseye over board cancels the common factor of pi, leaving only the squared radius ratio: about ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `The probability is $${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The outer ring takes the remaining ${fmtNum(d.ringShare)} of the board, and the two shares sum to one — the squared-ratio reading and the area reading agree.` },
  ],
  keyInsight: "Concentric circles compare through squared radius ratios alone; the constant of area never survives the division.",
  commonTrap: "Comparing radii linearly — doubling a circle's radius quadruples its area share, so the eye's guess at the bullseye is always too generous.",
  expectedPaceS: 30,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
