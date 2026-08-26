import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The variances are chosen so every precision 1/v is a short terminating decimal, which is what
// lets the weighted numerator and denominator both print exactly at four figures — the ratio of
// two rounded operands is the rounding trap this repo has hit repeatedly.
export const weightedLeastSquaresSingleMean: ProblemTemplate = {
  id: "statistics/weighted-least-squares-single-mean",
  version: 1,
  topic: "statistics/regression",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "jump", weight: 0.2 }, { firm: "jane-street", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "inverse-variance weighting of independent measurements" },
  params: {
    x1: { choices: [12, 40, 120, 360] },
    x2: { choices: [15, 48, 145, 430] },
    x3: { choices: [10, 34, 100, 300] },
    v1: { choices: [1, 4] },
    v2: { choices: [2, 10] },
    v3: { choices: [5, 20] },
  },
  // Identical readings make every weighting scheme agree and the question vacuous.
  constraint: (p) => !(p.x1 === p.x2 && p.x2 === p.x3),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const w1 = round(1 / p.v1), w2 = round(1 / p.v2), w3 = round(1 / p.v3);
    const numer = round(p.x1 * w1 + p.x2 * w2 + p.x3 * w3);
    const denom = round(w1 + w2 + w3);
    return {
      w1,
      w2,
      w3,
      numer,
      denom,
      plainMean: round((p.x1 + p.x2 + p.x3) / 3),
      combinedVar: round(1 / denom),
      answer: round(numer / denom),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Three independent models each price the same illiquid instrument. They report ${fmtNum(p.x1)}, ${fmtNum(p.x2)} and ${fmtNum(p.x3)} — they disagree, which is exactly why the variances matter — and their estimates have variances ${fmtNum(p.v1)}, ${fmtNum(p.v2)} and ${fmtNum(p.v3)} respectively. All three are unbiased. ` +
    `What is the minimum-variance unbiased combination of the three?`,
  solution: (p, d) => [
    { title: "Weight by precision, not by opinion", body: `Among all unbiased weighted averages, the one with the smallest variance weights each reading by its PRECISION — the reciprocal of its variance, $\\bar{x}$ being $\\dfrac{w_ax_a+w_bx_b+w_cx_c}{w_a+w_b+w_c}$ with $w_a=1/\\sigma_a^2$ for each source. A noisy model is not discarded, it is merely counted for less, in exact proportion to how little it knows.` },
    { title: "The three precisions", body: `They are $1/${fmtNum(p.v1)}=${fmtNum(d.w1)}$, $1/${fmtNum(p.v2)}=${fmtNum(d.w2)}$ and $1/${fmtNum(p.v3)}=${fmtNum(d.w3)}$, adding to $${fmtNum(d.w1)}+${fmtNum(d.w2)}+${fmtNum(d.w3)}=${fmtNum(d.denom)}$.` },
    { title: "The weighted total", body: `Multiplying each reading by its precision, $${fmtNum(p.x1)}\\times${fmtNum(d.w1)}+${fmtNum(p.x2)}\\times${fmtNum(d.w2)}+${fmtNum(p.x3)}\\times${fmtNum(d.w3)}=${fmtNum(d.numer)}$.` },
    { title: "Answer", body: `Dividing by the total precision, $${fmtNum(d.numer)}/${fmtNum(d.denom)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `A plain average of the three would have given ${fmtNum(d.plainMean)}, pulled toward the noisiest model for no reason. And the combination's own variance is one over the total precision, ${fmtNum(d.combinedVar)} — smaller than ${fmtNum(p.v1)}, the best single model, because even a poor reading adds information as long as it is unbiased and independent.` },
  ],
  keyInsight: "Precisions add when independent unbiased estimates are combined, which is the whole reason the optimal weights are inverse variances. It also means the combination always beats its best single input, so the case for discarding a noisy but unbiased source is weaker than it looks.",
  commonTrap: "Weighting by the variances rather than by their reciprocals, which hands the most influence to the least reliable model. The other slip is a plain average, which is the correct answer only when all three variances happen to be equal.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
