import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const biasCorrectedUniformEndpoint: ProblemTemplate = {
  id: "statistics/bias-corrected-uniform-endpoint",
  version: 1,
  topic: "statistics/estimation",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "optiver", weight: 0.15 }, { firm: "flow", weight: 0.1 }],
  source: { kind: "textbook", inspiration: "the maximum-likelihood estimator of a uniform upper endpoint and its bias correction" },
  params: {
    n: { choices: [5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 30, 32, 40, 50] },
    maxObs: { choices: [3.6, 4.2, 4.8, 5.5, 6.4, 7.2, 8.5, 9.6, 10.8, 12.5, 14.4, 16.2, 18.5, 21.6, 24.8] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const nPlusOne = p.n + 1;
    const factor = round(nPlusOne / p.n);
    // Scaled by the exact fraction rather than by the rounded factor printed beside it.
    const answer = round((p.maxObs * nPlusOne) / p.n);
    return { nPlusOne, factor, answer, bias: round(answer - p.maxObs), expectedMax: round(p.maxObs * p.n / nPlusOne) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A trader believes a counterparty's hidden order size is drawn uniformly between zero and some unknown ceiling. Across ${fmtNum(p.n)} independent observations the largest size seen was ${fmtNum(p.maxObs)} lots. ` +
    `What is the unbiased estimate of the ceiling that corrects the maximum-likelihood one?`,
  solution: (p, d) => [
    { title: "The likelihood is maximised at the edge, not at a turning point", body: `A uniform density on zero to the ceiling is the reciprocal of the ceiling for every sample it can produce, and zero for any ceiling below the largest observation. So the likelihood rises as the ceiling shrinks and then drops to nothing the instant the ceiling passes below the sample maximum. The maximiser is the sample maximum itself, ${fmtNum(p.maxObs)} lots, and no derivative was involved in finding it.` },
    { title: "That estimate is biased, and knowably so", body: `The largest of ${fmtNum(p.n)} uniform draws is always below the true ceiling — strictly, on every sample that can ever occur — so the estimator cannot be unbiased. The ${fmtNum(p.n)} observations cut the interval into ${fmtNum(d.nPlusOne)} gaps of equal expected width, and the maximum falls one gap short of the top, giving it an expected value of ${fmtNum(p.n)} parts in ${fmtNum(d.nPlusOne)} of the truth.` },
    { title: "Scale the shortfall away", body: `Multiplying by the reciprocal of that fraction removes the bias exactly: $\\dfrac{${fmtNum(d.nPlusOne)}}{${fmtNum(p.n)}}=${fmtNum(d.factor)}$, and $\\dfrac{${fmtNum(d.nPlusOne)}}{${fmtNum(p.n)}}\\times${fmtNum(p.maxObs)}=${fmtNum(d.answer)}$ lots.` },
    { title: "Answer", body: `The unbiased estimate of the ceiling is ${fmtNum(d.answer)} lots.` },
    { title: "Sanity check", body: `The correction adds ${fmtNum(d.bias)} lots, which is one expected gap, and it must push the estimate ABOVE the largest size ever seen — any estimate at or below ${fmtNum(p.maxObs)} would claim a ceiling the data has already exceeded. The correction shrinks as the sample grows, because more draws crowd the maximum closer to the true edge.` },
  ],
  keyInsight: "Maximum likelihood locates a boundary parameter at the edge of the observed data rather than where a derivative vanishes, and an estimator pinned to one side of the truth on every possible sample is biased by construction. The fix is a scale factor read straight off the expected shortfall, not a different estimator.",
  commonTrap: "Reporting the sample maximum itself, which is the maximum-likelihood answer but understates the ceiling on every sample that can occur — the question asks for the unbiased correction. The mirror-image slip is scaling DOWN, multiplying by the count over one more than the count, which moves the estimate the wrong way and can place the ceiling below a size that was actually traded.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [],
};
