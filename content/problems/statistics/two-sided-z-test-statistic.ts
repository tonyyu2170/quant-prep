import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const twoSidedZTestStatistic: ProblemTemplate = {
  id: "statistics/two-sided-z-test-statistic",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "imc", weight: 0.2 }, { firm: "optiver", weight: 0.2 }, { firm: "flow", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the z-statistic for a sample mean against a null" },
  params: {
    mu0: { choices: [200, 250, 300, 400, 500, 600] },
    sigma: { choices: [10, 15, 20, 25, 40, 50] },
    n: { choices: [16, 25, 36, 64, 100, 144] },
    gap: { choices: [-12, -8, -5, -3, 3, 4, 6, 9] },
  },
  constraint: (p) => {
    const z = Math.abs((p.gap * Math.sqrt(p.n)) / p.sigma);
    return z >= 0.4 && z <= 4;
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const root = round(Math.sqrt(p.n));
    return {
      root,
      se: round(p.sigma / root),
      observed: p.mu0 + p.gap,
      gap: p.gap,
      answer: round((p.gap * root) / p.sigma),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A venue advertises a mean fill latency of ${fmtNum(p.mu0)} microseconds, with a known standard deviation of ${fmtNum(p.sigma)}. A desk measures ${fmtNum(p.n)} independent fills and finds a sample mean of ${fmtNum(p.mu0 + p.gap)} microseconds. ` +
    `Testing the advertised figure against a two-sided alternative, what is the z-statistic?`,
  solution: (p, d) => [
    { title: "A statistic is a gap measured in standard errors", body: `The test asks how surprising the observed mean is IF the advertised figure were true, so the yardstick is the standard error of the mean rather than the spread of one fill: $z=\\dfrac{\\bar{x}-\\mu_0}{\\sigma/\\sqrt{n}}$.` },
    { title: "The standard error", body: `With $\\sqrt{${fmtNum(p.n)}}=${fmtNum(d.root)}$, the sample mean's standard deviation is $${fmtNum(p.sigma)}/${fmtNum(d.root)}=${fmtNum(d.se)}$ microseconds.` },
    { title: "Divide the gap by it", body: `The observed mean sits $${fmtNum(d.observed)}-${fmtNum(p.mu0)}=${fmtNum(d.gap)}$ microseconds from the advertised value, which in standard errors is $(${fmtNum(d.gap)})\\times${fmtNum(d.root)}/${fmtNum(p.sigma)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The z-statistic is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `A gap of ${fmtNum(d.gap)} microseconds against a per-fill spread of ${fmtNum(p.sigma)} would be unremarkable in a single fill. Averaged over ${fmtNum(p.n)} of them the yardstick shrinks to ${fmtNum(d.se)}, and the same gap becomes ${fmtNum(d.answer)} standard errors. Two-sided means the sign is carried into the comparison but not into the verdict.` },
  ],
  keyInsight: "A test statistic is a distance divided by the uncertainty of that distance, and the uncertainty of a sample mean shrinks with the square root of the count. The same raw gap is therefore evidence of nothing or of a great deal, depending entirely on how much data stands behind it.",
  commonTrap: "Dividing by the population standard deviation instead of the standard error, which ignores the sample size and understates the statistic by a factor of the square root of n. The other slip is dropping the sign before the comparison rather than after.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [0],
};
