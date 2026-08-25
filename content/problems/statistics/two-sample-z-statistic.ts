import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// Each group's variance of the mean (its variance over its count) and their sum are licensed
// exact by `constraint`, so all three can stand as printed operands. The root is evaluated ONCE,
// inside the final chain, and the standard error itself is printed only as a label — a perfect
// square was the first design and left the legal space too thin to draw from. The gap between
// the sample means is the drawn axis, so the statistic is signed and spread about zero.
export const twoSampleZStatistic: ProblemTemplate = {
  id: "statistics/two-sample-z-statistic",
  version: 1,
  topic: "statistics/inference",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the two-sample z-test for a difference in means with known variances" },
  params: {
    varA: { choices: [16, 25, 36, 64, 100, 144, 225, 400] },
    varB: { choices: [16, 25, 36, 64, 100, 144, 225, 400] },
    nA: { choices: [16, 25, 36, 50, 64, 100, 144, 400] },
    nB: { choices: [16, 25, 36, 50, 64, 100, 144, 400] },
    gap: { choices: [-8, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 8, 10] },
    meanB: { choices: [40, 50, 60, 80, 100, 120, 150, 200] },
  },
  constraint: (p) => exact4(p.varA / p.nA) && exact4(p.varB / p.nB) && exact4(p.varA / p.nA + p.varB / p.nB) && Math.abs(p.gap / Math.sqrt(p.varA / p.nA + p.varB / p.nB)) >= 0.3 && Math.abs(p.gap / Math.sqrt(p.varA / p.nA + p.varB / p.nB)) <= 5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const termA = round(p.varA / p.nA);
    const termB = round(p.varB / p.nB);
    const seSq = round(termA + termB);
    const se = round(Math.sqrt(seSq));
    return {
      termA,
      termB,
      seSq,
      se,
      meanA: p.meanB + p.gap,
      gap: p.gap,
      answer: round(p.gap / se),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `Two venues are compared on fill latency, in microseconds. Venue A is sampled ${fmtNum(p.nA)} times and averages ${fmtNum(d.meanA)}; venue B is sampled ${fmtNum(p.nB)} times and averages ${fmtNum(p.meanB)}. The latency variances are known from long history — ${fmtNum(p.varA)} at A and ${fmtNum(p.varB)} at B — and the two samples share no orders. ` +
    `What is the z-statistic for the difference in mean latency, A minus B?`,
  solution: (p, d) => {
    const paren = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
      { title: "Two means, two sources of noise", body: `Each sample mean carries its own sampling error, and because the samples are independent the variance of their difference is the SUM of the two means' variances — each group's variance over its own count. The statistic is the observed difference in those units: $z=\\dfrac{\\bar{x}_A-\\bar{x}_B}{\\sqrt{\\sigma_A^{2}/n_A+\\sigma_B^{2}/n_B}}$.` },
      { title: "Each mean's variance", body: `Averaging shrinks a variance by the count: $\\dfrac{${fmtNum(p.varA)}}{${fmtNum(p.nA)}}=${fmtNum(d.termA)}$ for venue A and $\\dfrac{${fmtNum(p.varB)}}{${fmtNum(p.nB)}}=${fmtNum(d.termB)}$ for venue B.` },
      { title: "Add them", body: `The difference of the means has variance $${fmtNum(d.termA)}+${fmtNum(d.termB)}=${fmtNum(d.seSq)}$, so its standard error is the root of that, about ${fmtNum(d.se)} microseconds.` },
      { title: "The observed difference", body: `A minus B is $${fmtNum(d.meanA)}-${fmtNum(p.meanB)}=${fmtNum(d.gap)}$ microseconds.` },
      { title: "Answer", body: `Dividing the difference by its standard error, $\\dfrac{${paren(d.gap)}}{\\sqrt{${fmtNum(d.termA)}+${fmtNum(d.termB)}}}=${fmtNum(d.answer)}$. The sign says which venue was slower in the sample; the size says how surprising that is if they are really the same.` },
      { title: "Sanity check", body: `Subtracting the means does not subtract the noise. The yardstick of ${fmtNum(d.se)} is wider than either mean's own standard error, because both sampling errors survive in the difference — a candidate who divides by only one venue's standard error overstates the evidence every time.` },
    ];
  },
  keyInsight: "A difference of two independent estimates is noisier than either estimate alone: their variances add, whatever the sign of the combination. The two-sample statistic is just the one-sample statistic with that combined standard error, and everything else — the sign convention, the two-sided verdict — carries over unchanged.",
  commonTrap: "Pooling the two variances as if the groups were one, or dividing by the standard error of a single mean. The other slip is adding the standard errors instead of the variances, which overstates the yardstick and understates the statistic.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [2],
};
