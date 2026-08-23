import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// How many observations a target margin of error buys. The confidence level is the PARAM and
// the multiplier is derived from it, so the two can never disagree on the page — declaring the
// three multipliers as constants instead would let a draw print a 95 percent level beside the
// 99 percent number and pass the traceability audit.
//
// The squared chain is written over the original literals inside one \dfrac. Dividing first and
// squaring the printed quotient is the trap this repo has hit twice: z times sigma over the
// margin is a repeating decimal on most draws, and squaring its four-figure rendering lands a
// long way from the answer.
// The ceiling is taken on a ROUNDED requirement, and that is not cosmetic. At a multiplier of
// 1.96, a spread of 5 and a margin of 0.7 the ratio is exactly 14 in real arithmetic and
// 14.000000000000002 in floats, so squaring lands a hair above 196 and a bare ceiling returns
// 197 — an answer one too large, which would then grade a correct 196 as wrong. The prose-claim
// gate caught it on 6 of 392 draws.
const sizeOf = (par: { sd: number; margin: number; conf: number }) =>
  Math.ceil(Math.round(((((par.conf === 90 ? 1.645 : par.conf === 95 ? 1.96 : 2.576) * par.sd) / par.margin) ** 2) * 1e9) / 1e9);

export const sampleSizeForMargin: ProblemTemplate = {
  id: "statistics/sample-size-for-margin",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.3 }, { firm: "jane-street", weight: 0.25 }, { firm: "imc", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "sample size for a target margin of error on a mean" },
  params: {
    sd: { choices: [4, 5, 6, 8, 10, 12, 15, 20] },
    margin: { range: { min: 0.4, max: 2, step: 0.1 } },
    conf: { choices: [90, 95, 99] },
  },
  constraint: (p) => sizeOf(p as { sd: number; margin: number; conf: number }) <= 4000,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const z = p.conf === 90 ? 1.645 : p.conf === 95 ? 1.96 : 2.576;
    return {
      z,
      zsd: round(z * p.sd),
      raw: round(((z * p.sd) / p.margin) ** 2),
      answer: Math.ceil(round(((z * p.sd) / p.margin) ** 2)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A quantity varies with a known standard deviation of ${fmtNum(p.sd)}, and you will estimate its mean from independent measurements. You want a ${fmtNum(p.conf)} percent confidence interval for that mean no wider than plus or minus ${fmtNum(p.margin)}, which at that level uses a multiplier of ${fmtNum(d.z)}. ` +
    `What is the smallest number of measurements that does it?`,
  solution: (p, d) => [
    { title: "What the margin is made of", body: `The interval's half-width is the multiplier times the standard error of the mean, and the standard error falls with the square root of the count: $\\text{margin}=z\\,\\dfrac{\\sigma}{\\sqrt{n}}$. Only the count is yours to choose.` },
    { title: "Put the numerator together", body: `The multiplier and the spread give $${fmtNum(d.z)}\\times${fmtNum(p.sd)}=${fmtNum(d.zsd)}$, which is the margin a single measurement would leave.` },
    { title: "Invert the square root", body: `Setting the margin to ${fmtNum(p.margin)} and solving for the count squares the ratio: $\\left(\\dfrac{${fmtNum(d.z)}\\times${fmtNum(p.sd)}}{${fmtNum(p.margin)}}\\right)^2=${fmtNum(d.raw)}$.` },
    { title: "Answer", body: `Measurements come in whole numbers and a fraction of one buys nothing, so round up: ${fmtNum(d.answer)}, since $${fmtNum(d.answer)}\\geq${fmtNum(d.raw)}$. Stopping one short leaves the interval wider than asked for.` },
    { title: "Sanity check", body: `The count enters through a square root, so precision is expensive: halving the margin from ${fmtNum(p.margin)} would take four times ${fmtNum(d.answer)} measurements, not twice. That square is why a target width, not a sample size, is the thing worth arguing about at the start of a study.` },
  ],
  keyInsight: "A margin of error shrinks with the square root of the sample size, so solving for the size squares everything else. The count is quadratic in the multiplier and in the standard deviation, and inversely quadratic in the width you are willing to accept.",
  commonTrap: "Rounding the count down, or forgetting the square and scaling the sample linearly with the margin. Both fail the same way — the interval comes out wider than the one that was specified.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [2],
};
