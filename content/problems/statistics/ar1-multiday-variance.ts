import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const ar1MultidayVariance: ProblemTemplate = {
  id: "statistics/ar1-multiday-variance",
  version: 1,
  topic: "statistics/time-series",
  difficulty: 3,
  firms: [{ firm: "citadel-securities", weight: 0.2 }, { firm: "optiver", weight: 0.15 }, { firm: "imc", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the variance of a multi-period sum of a correlated series, cross terms included" },
  params: {
    phi: { choices: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9] },
    sd: { choices: [2, 3, 4, 5, 6, 8, 10, 12] },
    q: { choices: [2, 3] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const variance = round(p.sd * p.sd);
    const inflation = round(p.q === 2 ? 2 + 2 * p.phi : 3 + 4 * p.phi + 2 * p.phi * p.phi);
    return {
      variance, inflation,
      independent: round(p.q * variance),
      answer: round(p.sd * p.sd * (p.q === 2 ? 2 + 2 * p.phi : 3 + 4 * p.phi + 2 * p.phi * p.phi)),
      phiSq: round(p.phi * p.phi),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A stationary AR(1) order-flow imbalance has a daily standard deviation of ${fmtNum(p.sd)} and carries ${fmtNum(p.phi)} of each day into the next. A desk cares about the TOTAL imbalance accumulated over ${fmtNum(p.q)} consecutive days. ` +
    `What is the variance of that ${fmtNum(p.q)}-day total?`,
  solution: (p, d) => [
    { title: "A sum of correlated terms carries cross terms", body: `The variance of a sum is the sum of the variances plus twice every pairwise covariance. Independence is what kills the cross terms, and this series is not independent — so they have to be counted, and they are all positive here.` },
    { title: "Count the pairs at each separation", body: `${p.q === 2 ? `Two days give two variances and one pair one day apart, and that pair contributes twice its covariance.` : `Three days give three variances, two pairs one day apart and one pair two days apart, each pair counted twice.`} A pair ${fmtNum(1)} day apart has covariance ${fmtNum(p.phi)} times the daily variance${p.q === 3 ? `, and a pair 2 days apart has ${fmtNum(d.phiSq)} times it` : ``}.` },
    { title: "Collect the multiplier", body: `That makes the total variance $${p.q === 2 ? `2+2\\times${fmtNum(p.phi)}` : `3+4\\times${fmtNum(p.phi)}+2\\times${fmtNum(p.phi)}\\times${fmtNum(p.phi)}`}=${fmtNum(d.inflation)}$ daily variances. With a daily variance of $${fmtNum(p.sd)}\\times${fmtNum(p.sd)}=${fmtNum(d.variance)}$, the answer is $${fmtNum(d.variance)}\\times${fmtNum(d.inflation)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The ${fmtNum(p.q)}-day total has variance ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Had the days been independent the answer would be ${fmtNum(d.independent)}, exactly ${fmtNum(p.q)} daily variances. Positive persistence makes the true figure larger, because the days push in the same direction more often than not — scaling risk by the square root of time understates it on any series that trends, and would overstate it on one that alternates.` },
  ],
  keyInsight: "Variance adds across periods only when the periods are independent, and the correction is the doubled sum of every pairwise covariance. Positive persistence therefore makes a multi-day total riskier than the square-root-of-time rule claims, and the gap widens with the horizon rather than staying fixed.",
  commonTrap: "Multiplying the daily variance by the number of days, the square-root-of-time rule, which silently assumes the very independence the model denies. The subtler error is counting each pair once instead of twice — the covariance of a with b and of b with a are both in the expansion, and dropping one halves the entire correction.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1, 2, 3, 4],
};
