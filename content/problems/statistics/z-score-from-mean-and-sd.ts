import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const zScoreFromMeanAndSd: ProblemTemplate = {
  id: "statistics/z-score-from-mean-and-sd",
  version: 1,
  topic: "statistics/moments",
  difficulty: 1,
  firms: [{ firm: "akuna", weight: 0.2 }, { firm: "flow", weight: 0.2 }, { firm: "citadel-securities", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "standardisation of a single observation" },
  params: {
    mu: { choices: [40, 50, 60, 75, 90, 100, 120, 150] },
    dev: { choices: [-60, -45, -30, -20, -12, 10, 16, 24, 36, 50] },
    sigma: { choices: [4, 5, 8, 10, 16, 20, 25, 40] },
  },
  constraint: (p) => Math.abs(p.dev) <= 3 * p.sigma && p.mu + p.dev > 0,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      obs: p.mu + p.dev,
      gap: p.dev,
      twoSigmaBand: round(2 * p.sigma),
      answer: round(p.dev / p.sigma),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Across a long history, the number of contracts printed in the closing auction has averaged ${fmtNum(p.mu)} thousand with a standard deviation of ${fmtNum(p.sigma)} thousand. Today's auction printed ${fmtNum(p.mu + p.dev)} thousand. ` +
    `What is today's z-score?`,
  solution: (p, d) => [
    { title: "A z-score counts standard deviations, not units", body: `Standardising subtracts the mean and then divides by the standard deviation: $z=\\dfrac{x-\\mu}{\\sigma}$. The subtraction says how far from typical today is; the division converts that distance into the only unit that is comparable across different quantities.` },
    { title: "Measure the gap from the mean", body: `Today came in at $${fmtNum(d.obs)}-${fmtNum(p.mu)}=${fmtNum(d.gap)}$ thousand contracts away from the long-run average.` },
    { title: "Express the gap in standard deviations", body: `One standard deviation is ${fmtNum(p.sigma)} thousand, so the gap is $\\dfrac{${fmtNum(d.gap)}}{${fmtNum(p.sigma)}}=${fmtNum(d.answer)}$ of them.` },
    { title: "Answer", body: `Today's z-score is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Two standard deviations either side of the mean spans ${fmtNum(d.twoSigmaBand)} thousand contracts in each direction, the band that holds roughly nineteen days in twenty for a bell-shaped quantity. Comparing today's gap of ${fmtNum(d.gap)} against that band says immediately whether the day was merely busy or genuinely unusual.` },
  ],
  keyInsight: "Standardising strips a measurement of its units and its origin, leaving only how unusual it is. That is what makes a latency, a P&L and an auction size comparable on one scale, and it is why the same table of tail probabilities serves all three.",
  commonTrap: "Dividing by the variance rather than the standard deviation, which leaves the answer in the wrong units and far too small. The other slip is dropping the sign, which discards the half of the answer that says which side of typical the reading fell on.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [2],
};
