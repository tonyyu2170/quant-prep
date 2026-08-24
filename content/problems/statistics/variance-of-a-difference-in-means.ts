import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const varianceOfADifferenceInMeans: ProblemTemplate = {
  id: "statistics/variance-of-a-difference-in-means",
  version: 1,
  topic: "statistics/moments",
  difficulty: 2,
  firms: [{ firm: "millennium", weight: 0.2 }, { firm: "citadel-securities", weight: 0.2 }, { firm: "optiver", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the standard error of a difference between two independent sample means" },
  params: {
    varA: { choices: [64, 100, 144, 196, 225, 256, 400] },
    nA: { choices: [4, 8, 10, 16, 20, 25] },
    varB: { choices: [36, 81, 121, 169, 225, 289, 324] },
    nB: { choices: [4, 5, 8, 10, 20, 25] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const termA = round(p.varA / p.nA);
    const termB = round(p.varB / p.nB);
    return {
      termA,
      termB,
      answer: round(termA + termB),
      sd: round(Math.sqrt(termA + termB)),
      wrongPooled: round((p.varA + p.varB) / (p.nA + p.nB)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Two independent venues are compared on fill latency. Venue A is sampled ${fmtNum(p.nA)} times and its latency has variance ${fmtNum(p.varA)}; venue B is sampled ${fmtNum(p.nB)} times and its latency has variance ${fmtNum(p.varB)}. The two samples share no orders. ` +
    `What is the variance of the difference between the two sample means?`,
  solution: (p, d) => [
    { title: "Independent means subtract, their variances add", body: `Each sample mean has variance $\\sigma^2/n$, and for independent quantities $\\text{Var}(X-Y)=\\text{Var}(X)+\\text{Var}(Y)$ — the minus sign squares away. Uncertainty accumulates whichever way the two are combined.` },
    { title: "Each mean's own variance", body: `Venue A's sample mean has variance $${fmtNum(p.varA)}/${fmtNum(p.nA)}=${fmtNum(d.termA)}$, and venue B's has $${fmtNum(p.varB)}/${fmtNum(p.nB)}=${fmtNum(d.termB)}$.` },
    { title: "Add them", body: `The difference therefore has variance $${fmtNum(p.varA)}/${fmtNum(p.nA)}+${fmtNum(p.varB)}/${fmtNum(p.nB)}=${fmtNum(d.answer)}$ — added from the original figures, since each term alone is a rounded display.` },
    { title: "Answer", body: `The variance of the difference is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `In the same units as the latencies, the standard error of the difference is ${fmtNum(d.sd)}, the square root of that variance. Note that the smaller sample dominates the total: adding orders at the venue that already has plenty barely moves it, which is the argument for balancing the two sample sizes rather than the total.` },
  ],
  keyInsight: "Subtracting two independent estimates adds their uncertainties rather than cancelling them, so a difference is always less precisely known than either side. The term with the fewest observations dominates the sum, which is why unbalanced samples waste data.",
  commonTrap: "Subtracting the two variances because the means are subtracted, which can even produce a negative answer. The other slip is pooling into a single variance over the combined count, which is only valid when the two spreads are genuinely equal.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [2],
};
