import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The multiplier is derived FROM the confidence level, never a param of its own, so no draw can
// print a 95 percent label beside the 99 percent number — the same reason sample-size-for-margin
// derives its own.
const zOf = (par: { conf: number }) => (par.conf === 90 ? 1.645 : par.conf === 95 ? 1.96 : 2.576);

export const confidenceIntervalHalfWidth: ProblemTemplate = {
  id: "statistics/confidence-interval-half-width",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "akuna", weight: 0.2 }, { firm: "sig", weight: 0.2 }, { firm: "citadel-securities", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the half-width of a normal confidence interval for a mean" },
  params: {
    conf: { choices: [90, 95, 99] },
    sigma: { choices: [8, 12, 15, 20, 24, 30, 40, 50] },
    n: { choices: [16, 25, 36, 64, 100, 144, 225] },
    xbar: { choices: [100, 150, 200, 250, 300, 400] },
  },
  constraint: (p) => zOf(p as { conf: number }) * (p.sigma / Math.sqrt(p.n)) >= 0.3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const z = zOf(p as { conf: number });
    const root = round(Math.sqrt(p.n));
    const answer = round((z * p.sigma) / root);
    return {
      z,
      root,
      se: round(p.sigma / root),
      lower: round(p.xbar - answer),
      upper: round(p.xbar + answer),
      answer,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A sample of ${fmtNum(p.n)} independent measurements has a mean of ${fmtNum(p.xbar)}, and the population standard deviation is known to be ${fmtNum(p.sigma)}. A ${fmtNum(p.conf)} percent interval uses a multiplier of ${fmtNum(d.z)}. ` +
    `What is the half-width of the ${fmtNum(p.conf)} percent confidence interval for the mean?`,
  solution: (p, d) => [
    { title: "Half-width is a multiplier times a standard error", body: `A confidence interval is the estimate give or take some multiple of its own uncertainty: the half-width is $z\\,\\dfrac{\\sigma}{\\sqrt{n}}$. The multiplier sets how often the interval covers the truth; the standard error sets how wide that costs.` },
    { title: "The standard error", body: `With $\\sqrt{${fmtNum(p.n)}}=${fmtNum(d.root)}$, the mean's standard error is $${fmtNum(p.sigma)}/${fmtNum(d.root)}=${fmtNum(d.se)}$.` },
    { title: "Apply the multiplier", body: `At ${fmtNum(p.conf)} percent that is $${fmtNum(d.z)}\\times${fmtNum(p.sigma)}/${fmtNum(d.root)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The half-width is ${fmtNum(d.answer)}, so the interval runs from ${fmtNum(d.lower)} to ${fmtNum(d.upper)}.` },
    { title: "Sanity check", body: `The width is driven by the standard error ${fmtNum(d.se)}, not by the sample mean ${fmtNum(p.xbar)} — moving the estimate slides the interval without stretching it. And buying a higher confidence level only raises the multiplier, which is why a ${fmtNum(p.conf)} percent interval is wider than a less demanding one on identical data.` },
  ],
  keyInsight: "A confidence interval separates cleanly into where it sits and how wide it is: the estimate fixes the first, the standard error and the chosen multiplier fix the second, and neither influences the other. That is why widening the level never moves the centre.",
  commonTrap: "Using the population standard deviation as the half-width and forgetting to divide by the square root of the sample size, which describes a single observation rather than the mean. The other slip is treating a higher confidence level as a better estimate, when it only buys a wider interval on the same data.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [],
};
