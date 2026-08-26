import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const ar1LagCovariance: ProblemTemplate = {
  id: "statistics/ar1-lag-covariance",
  version: 1,
  topic: "statistics/time-series",
  difficulty: 1,
  firms: [{ firm: "jump", weight: 0.2 }, { firm: "hrt", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the autocovariance function of an AR(1) process decays geometrically in the lag" },
  params: {
    phi: { choices: [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75] },
    k: { choices: [2, 3, 4, 5] },
    sd: { choices: [2, 3, 4, 5, 6, 8] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      phiPow: round(Math.pow(p.phi, p.k)),
      variance: round(p.sd * p.sd),
      answer: round(Math.pow(p.phi, p.k) * p.sd * p.sd),
      nextLag: round(Math.pow(p.phi, p.k + 1) * p.sd * p.sd),
      kPlusOne: p.k + 1,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A stationary AR(1) inventory series carries ${fmtNum(p.phi)} of each day's level into the next, and in the long run its standard deviation is ${fmtNum(p.sd)} lots. ` +
    `What is the covariance between the level today and the level ${fmtNum(p.k)} days from now?`,
  solution: (p, d) => [
    { title: "Each extra day of separation costs one factor of the carry-over", body: `Pushing the series one day forward multiplies the part that is still correlated with today by ${fmtNum(p.phi)} and adds a shock that is independent of today, contributing nothing to the covariance. So the covariance falls by the same factor at every step, whatever the lag already is.` },
    { title: "Apply it across the whole gap", body: `Over ${fmtNum(p.k)} days that is $${fmtNum(p.phi)}^{${fmtNum(p.k)}}=${fmtNum(d.phiPow)}$ of the covariance at lag zero.` },
    { title: "Lag zero is the variance", body: `The covariance of the series with itself is its variance, $${fmtNum(p.sd)}\\times${fmtNum(p.sd)}=${fmtNum(d.variance)}$, so the answer is $${fmtNum(p.phi)}^{${fmtNum(p.k)}}\\times${fmtNum(d.variance)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The covariance ${fmtNum(p.k)} days apart is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `One more day out gives ${fmtNum(d.nextLag)}, smaller by the same factor again — the decay is geometric, so the series never becomes exactly uncorrelated with its past, it only becomes negligibly so. That is also why the correlation at lag ${fmtNum(p.k)} is ${fmtNum(d.phiPow)} regardless of how wide the series happens to be: the width cancels out of a correlation and does not cancel out of a covariance.` },
  ],
  keyInsight: "Every day of separation multiplies the covariance by the carry-over once more, because the shock arriving in between is independent of where the series started. The autocovariance is therefore geometric in the lag, and the autocorrelation is that same geometric factor with the variance divided out.",
  commonTrap: "Multiplying by the carry-over once rather than once per day of separation, which treats a five-day gap like a one-day gap. The other slip is answering with the correlation when the covariance was asked for — they differ by exactly the variance, so the two coincide only on a series whose standard deviation happens to be one.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [1],   // the order in the model's own name, "AR(1)"
};
