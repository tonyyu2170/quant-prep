import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { fmtNum } from "../util";

export const gbmFitThenBelowMean: ProblemTemplate = {
  id: "stochastic/gbm-fit-then-below-mean",
  version: 1,
  topic: "pure-math/stochastic",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "millennium", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "recovering total volatility from the mean-to-median gap, then pricing a tail" },
  params: {
    // Widened after the first draft came in at maxRepeat=4, exactly on the cap. The repeats
    // were STATEMENT collisions, not answer collisions: the statement prints median times
    // meanPct, so distinct draws print the same mean. More values on both axes separate them.
    median: { choices: [40, 50, 60, 75, 80, 90, 100, 120, 150] },
    meanPct: { choices: [102, 103, 104, 106, 108, 110, 112, 115, 120, 125] },
    markPct: { choices: [80, 85, 88, 92, 95, 105, 110, 115, 125, 135, 145] },
  },
  // The two published prices must land on exact figures — they are printed in the STATEMENT,
  // and a reader cannot be asked to work from a rounded quote.
  constraint: (p) => p.markPct !== 100 && (p.median * p.meanPct) % 100 === 0 && (p.median * p.markPct) % 100 === 0,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    // The answer is computed from RAW values and rounded once, at the end. Chaining the
    // rounded intermediates instead makes it sensitive in the ninth decimal — which is exactly
    // the absolute tolerance verify.py holds an independent brute route to, so the checker
    // would be measuring a rounding convention rather than the formula. The rounded values
    // below exist to be PRINTED; only `answer` is load-bearing.
    const skewLogRaw = Math.log(p.meanPct / 100);
    const totalSdRaw = Math.sqrt(2 * skewLogRaw);
    const markLogRaw = Math.log(p.markPct / 100);
    const zRaw = markLogRaw / totalSdRaw;
    return {
      mean: round((p.median * p.meanPct) / 100),
      mark: round((p.median * p.markPct) / 100),
      skewLog: round(skewLogRaw),
      totalSd: round(totalSdRaw),
      markLog: round(markLogRaw),
      z: round(zRaw),
      answer: round(normalCdf(zRaw)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `At a fixed horizon a name's price is lognormal. The desk publishes two numbers: the MEDIAN outcome is ` +
    `${fmtNum(p.median)} and the MEAN outcome is ${fmtNum(d.mean)}. What is the probability the price finishes below ` +
    `${fmtNum(d.mark)}?`,
  solution: (p, d) => [
    { title: "The gap between mean and median IS the volatility", body: `Nothing here states a volatility, and nothing needs to. For a lognormal price the mean exceeds the median by a factor of the exponential of half the total log variance — so the ratio of the two published numbers carries the only unknown the tail needs.` },
    { title: "Back out the total log spread", body: `Write $g$ for the natural log of the mean over the median. Here $g=${fmtNum(d.skewLog)}$, and since $g$ is half the total log variance, the total log standard deviation is $\\sqrt{2\\times${fmtNum(d.skewLog)}}\\approx${fmtNum(d.totalSd)}$.` },
    { title: "Measure the mark against the median", body: `The median is the point the log is centred on, so distance is measured from THERE, not from the mean. Write $k$ for the natural log of the mark over the median: $k=${fmtNum(d.markLog)}$. In standard deviations that is $\\dfrac{${fmtNum(d.markLog)}}{${fmtNum(d.totalSd)}}\\approx${fmtNum(d.z)}$. Both steps here run through natural logs, which have no exact four-figure rendering, so both are written as approximations.` },
    { title: "Answer", body: `The probability of finishing below the mark is the standard normal area up to there: $P(Z<${fmtNum(d.z)})=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The mean is $\\dfrac{${fmtNum(p.median)}\\times${fmtNum(p.meanPct)}}{100}=${fmtNum(d.mean)}$ and the mark is $\\dfrac{${fmtNum(p.median)}\\times${fmtNum(p.markPct)}}{100}=${fmtNum(d.mark)}$, both exact. The mean of ${fmtNum(d.mean)} sits above the median of ${fmtNum(p.median)}, as a lognormal's must: $${fmtNum(d.mean)}>${fmtNum(p.median)}$. A consequence worth keeping — the probability of finishing below the MEAN is above one half, so "beating the average" is the less likely outcome for an asset like this even though the average is what gets quoted.` },
  ],
  keyInsight: "For a lognormal the mean, the median and the volatility are three views of two numbers, so any one of them can be recovered from the other two. The mean sitting above the median is not a forecast of gains — it is the arithmetic of compounding, and most paths finish below it.",
  commonTrap: "Centring the tail on the mean rather than the median, which shifts every answer by half the log standard deviation. The other slip is treating the mean-to-median ratio as the volatility itself rather than as the exponential of half its square.",
  expectedPaceS: 180,
  verify: { method: "brute-force" },
  constants: [2, 100],
};
