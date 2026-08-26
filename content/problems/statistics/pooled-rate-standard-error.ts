import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const pooledRateStandardError: ProblemTemplate = {
  id: "statistics/pooled-rate-standard-error",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "millennium", weight: 0.2 }, { firm: "imc", weight: 0.15 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "original", inspiration: "pooling Poisson counts over unequal exposure, and the standard error of the pooled rate" },
  params: {
    x1: { choices: [9, 16, 25, 36, 49, 64] },
    x2: { choices: [15, 24, 39, 60, 75, 96] },
    t1: { choices: [2, 4, 6, 8] },
    t2: { choices: [5, 10, 15, 25] },
  },
  constraint: (p) => (p.x1 + p.x2) / (p.t1 + p.t2) >= 1.5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const totalEvents = p.x1 + p.x2;
    const totalDays = p.t1 + p.t2;
    const rate = round(totalEvents / totalDays);
    return { totalEvents, totalDays, rate, rootEvents: round(Math.sqrt(totalEvents)), answer: round(Math.sqrt(totalEvents) / totalDays), rate1: round(p.x1 / p.t1), rate2: round(p.x2 / p.t2) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Two colocation sites report packet drops, and drops are modelled as a Poisson process running at the same rate at both. The first site logged ${fmtNum(p.x1)} drops over ${fmtNum(p.t1)} days of uptime; the second logged ${fmtNum(p.x2)} drops over ${fmtNum(p.t2)} days. ` +
    `What is the standard error of the pooled maximum-likelihood estimate of the drop rate, in drops per day?`,
  solution: (p, d) => [
    { title: "Pool the exposure, not the two rates", body: `The joint likelihood of two independent Poisson samples at a common rate depends on the data only through the total count and the total exposure, so the estimate is $\\dfrac{\\text{total drops}}{\\text{total days}}$. Here that is $\\dfrac{${fmtNum(d.totalEvents)}}{${fmtNum(d.totalDays)}}=${fmtNum(d.rate)}$ drops per day. Averaging the two site rates instead would weight ${fmtNum(p.t1)} days of evidence equally with ${fmtNum(p.t2)}.` },
    { title: "The variance of a count is the count", body: `The total drop count is Poisson with mean equal to the rate times the total exposure, so its variance is that same quantity. Dividing the count by a FIXED exposure divides its variance by the square of that exposure, which leaves $\\dfrac{\\text{rate}}{\\text{total days}}$ as the variance of the estimate.` },
    { title: "Take the root", body: `The standard error is therefore the root of the total count over the total exposure: $\\sqrt{${fmtNum(d.totalEvents)}}=${fmtNum(d.rootEvents)}$, and $\\dfrac{\\sqrt{${fmtNum(d.totalEvents)}}}{${fmtNum(d.totalDays)}}=${fmtNum(d.answer)}$ drops per day.` },
    { title: "Answer", body: `The pooled rate carries a standard error of ${fmtNum(d.answer)} drops per day.` },
    { title: "Sanity check", body: `The two sites on their own read ${fmtNum(d.rate1)} and ${fmtNum(d.rate2)} drops per day, and the pooled figure of ${fmtNum(d.rate)} lies between them, pulled toward whichever site contributed more days. The standard error depends on the total count only through its square root, so it is the exposure that buys precision here — the same ${fmtNum(d.totalEvents)} drops spread over more days would be a tighter estimate of a slower rate.` },
  ],
  keyInsight: "Two Poisson samples at a common rate pool by adding counts and adding exposures, never by averaging the two rates, because the likelihood sees only those two totals. The precision of the result then rides on the total count, while the exposure sets the scale the rate is measured in.",
  commonTrap: "Taking the simple average of the two site rates, which silently gives a short observation window the same weight as a long one. It is right only by coincidence: when the two exposures match, or when the two sites happen to read the same rate anyway. The second trap is treating the standard error as the root of the pooled rate rather than the root of the pooled COUNT divided by the exposure, which confuses a rate with the count that produced it.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [],
};
