import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The classic broken-stick triangle question in conditional form: the first break is drawn
// at uL, the remainder is broken uniformly, and P(triangle | u) = u/(1-u) for u <= 1/2.
// Generative story is sequential (break once, then break the remainder) — its unconditional
// value is ln 2 - 1/2, deliberately not the simultaneous-two-cuts 1/4.
const triangleOf = (p: Params) => p.firstBreakPct / 100 / (1 - p.firstBreakPct / 100);

export const stickTriangleConditional: ProblemTemplate = {
  id: "geometric/stick-triangle-conditional",
  version: 1,
  topic: "probability/geometric",
  difficulty: 2,
  firms: [{ firm: "hrt", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "conditional broken-stick triangle via a drawn first break" },
  params: {
    stickCm: { range: { min: 40, max: 90, step: 5 } },
    firstBreakPct: { range: { min: 10, max: 48, step: 2 } },
  },
  constraint: (p) => triangleOf(p) >= 0.1 && triangleOf(p) <= 0.99,
  derived: (p) => {
    const u = p.firstBreakPct / 100;
    const answer = u / (1 - u);
    const seqUnconditional = Math.log(2) - 0.5;
    const remainderPct = 100 - p.firstBreakPct;
    return { answer, seqUnconditional, remainderPct };
  },
  statement: (p) =>
    `A stick of ${fmtNum(p.stickCm)} centimeters is snapped once at a uniformly random point, and — unusually — you are told where: exactly ${fmtNum(p.firstBreakPct)} percent along, measured from the left. The right-hand remainder is then snapped a second time at a uniformly random point along its own length, leaving three pieces in order. What is the probability the three pieces form a triangle?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Pieces are ${fmtNum(p.firstBreakPct)} percent of the stick and two shares of the remaining ${fmtNum(100 - p.firstBreakPct)} percent. A triangle needs every piece under half the whole stick.` },
    { title: "Condition on the known break", body: `The left piece at ${fmtNum(p.firstBreakPct)} percent already clears the half-bar; both remainder pieces fit when the second snap lands in a stretch whose length works out to ${fmtNum(d.answer)} of that remainder.` },
    { title: "Answer", body: `The conditional probability is $\\frac{${fmtNum(p.firstBreakPct)}}{${fmtNum(100 - p.firstBreakPct)}}=${fmtNum(d.answer)}$ — the left share over the right share.` },
    { title: "Sanity check", body: `Averaging this expression over all first breaks gives about ${fmtNum(d.seqUnconditional)}, the sequential-break answer — noticeably below the famous quarter, which belongs to the DIFFERENT story of two simultaneous uniform cuts. Same puzzle words, different generative order, different number.` },
  ],
  keyInsight: "Conditioning on the first break turns the triangle test into one interval for the second snap, and the answer collapses to the ratio of the two stick shares.",
  commonTrap: "Quoting the famous one-in-four — that constant answers the simultaneous-cuts story, not this sequential one, where even the unconditional average differs.",
  expectedPaceS: 70,
  verify: { method: "montecarlo" },
  constants: [0, 1],
};
