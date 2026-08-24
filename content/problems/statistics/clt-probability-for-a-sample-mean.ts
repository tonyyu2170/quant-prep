import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

// The tail is printed directly rather than as 1 minus the CDF: at these z values the CDF's
// fourth figure is the whole answer, and a chain built on its rendering loses it.
export const cltProbabilityForASampleMean: ProblemTemplate = {
  id: "statistics/clt-probability-for-a-sample-mean",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.2 }, { firm: "imc", weight: 0.2 }, { firm: "akuna", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the central limit theorem applied to a sample mean" },
  params: {
    mu: { choices: [50, 60, 80, 100, 120, 150] },
    sigma: { choices: [10, 15, 20, 25, 40, 50] },
    n: { choices: [16, 25, 36, 64, 100, 144] },
    gap: { choices: [1, 2, 3, 4, 5, 6, 8, 10] },
  },
  // Below 0.5 the normal approximation is not the point of the question, and above 3.2 the tail
  // falls under 1e-4 where a four-figure display stops carrying the answer's own precision.
  constraint: (p) => {
    const z = (p.gap * Math.sqrt(p.n)) / p.sigma;
    return z >= 0.5 && z <= 3.2;
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const root = round(Math.sqrt(p.n));
    const z = round((p.gap * root) / p.sigma);
    return {
      root,
      se: round(p.sigma / root),
      z,
      threshold: p.mu + p.gap,
      answer: round(1 - normalCdf(z)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Daily volume on a contract has mean ${fmtNum(p.mu)} thousand lots and standard deviation ${fmtNum(p.sigma)} thousand, with days independent. A desk averages the volume over ${fmtNum(p.n)} days. ` +
    `Using the central limit theorem, what is the probability that this ${fmtNum(p.n)}-day average exceeds ${fmtNum(p.mu + p.gap)} thousand lots?`,
  solution: (p, d) => [
    { title: "The average is far steadier than a single day", body: `The central limit theorem says the sample mean is approximately normal with the SAME centre but a standard deviation of $\\sigma/\\sqrt{n}$. So the question is not whether a day is unusual, but whether an average of ${fmtNum(p.n)} of them is.` },
    { title: "The standard error", body: `With $\\sqrt{${fmtNum(p.n)}}=${fmtNum(d.root)}$, the average's standard deviation is $${fmtNum(p.sigma)}/${fmtNum(d.root)}=${fmtNum(d.se)}$ thousand lots — much tighter than the ${fmtNum(p.sigma)} of a single day.` },
    { title: "Standardise the threshold", body: `The threshold sits ${fmtNum(p.gap)} thousand above the mean, which in standard errors is $${fmtNum(p.gap)}\\times${fmtNum(d.root)}/${fmtNum(p.sigma)}=${fmtNum(d.z)}$.` },
    { title: "Answer", body: `The area of the standard normal above ${fmtNum(d.z)} is ${fmtNum(d.answer)}, so that is the probability.` },
    { title: "Sanity check", body: `A single day exceeding ${fmtNum(p.mu + p.gap)} would be only ${fmtNum(p.gap)} thousand above a spread of ${fmtNum(p.sigma)} — barely remarkable. Averaging shrinks the spread to ${fmtNum(d.se)} and turns the very same threshold into a ${fmtNum(d.z)} standard error event. The threshold did not move; the yardstick did.` },
  ],
  keyInsight: "The central limit theorem leaves the centre alone and shrinks the spread by the square root of the count, so a fixed threshold becomes more extreme as the sample grows. Almost every surprising result about large samples is that one asymmetry restated.",
  commonTrap: "Standardising against the population standard deviation rather than the standard error, which treats the average as though it were a single observation and badly understates how unusual it is. The other slip is forgetting that the mean itself does not shift.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [],
};
