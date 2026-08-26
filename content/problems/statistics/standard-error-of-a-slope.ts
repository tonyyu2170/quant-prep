import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The residual variance is the PARAM and the residual sum of squares is derived back out of it
// as sVar*(n-2), rather than the other way round. Drawing `rss` directly and dividing would put
// a non-terminating quotient — 500/25 is kind, 500/40 is not — under a square root, and rooting
// a rounded label is the mistake this batch keeps finding. This way both roots are roots of
// exact literals: sVar is a drawn perfect square and sxx is a drawn perfect square, so the
// chain is exact end to end and only the final quotient rounds.
//
// No trap constraint is needed, which is unusual for this batch and was measured rather than
// assumed: over all 420 legal draws, dividing by n instead of n-2, skipping the n-2 divide
// altogether, forgetting either root, and reaching for sqrt(n) as in the standard error of a
// mean all grade WRONG on every draw. The grids do that on their own — no n is a perfect
// square, so the sqrt(n) confusion never lands on sqrt(Sxx).
//
// `exact4` is the guarantee, not the grid: every sVar is a perfect square today, so the
// residual standard deviation prints as an integer, and this fails loud if that changes.
export const standardErrorOfASlope: ProblemTemplate = {
  id: "statistics/standard-error-of-a-slope",
  version: 1,
  topic: "statistics/regression",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "sig", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the standard error of a least-squares slope, and what actually buys it" },
  params: {
    sVar: { choices: [4, 9, 16, 25, 36, 49] },
    n: { choices: [12, 17, 22, 27, 32, 42, 52] },
    sxx: { choices: [16, 25, 36, 64, 100, 144, 196, 225, 256, 400] },
  },
  constraint: (p) => exact4(Math.sqrt(p.sVar)),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      rss: p.sVar * (p.n - 2),
      sSD: Math.sqrt(p.sVar),
      answer: round(Math.sqrt(p.sVar) / Math.sqrt(p.sxx)),   // from the exact literals, not from `sSD`
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A credit desk regresses a corporate bond's daily spread change on the same day's change in a broad index spread, over ${fmtNum(p.n)} trading days, both measured in basis points. ` +
    `The fit leaves a residual sum of squares of ${fmtNum(d.rss)}, and the index's spread changes have a sum of squared deviations about their own mean, $S_{xx}$, of ${fmtNum(p.sxx)}. What is the standard error of the fitted slope?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Two roots, and what each of them is for", body: `The slope's standard error is $\\dfrac{s}{\\sqrt{S_{xx}}}$, where $s$ is the residual standard deviation and $S_{xx}$ is the predictor's sum of squared deviations about its own mean. The numerator is how much scatter the line failed to explain; the denominator is how much room the predictor gave the line to be pinned down in. The residual variance itself is the residual sum of squares spread over the degrees of freedom left after fitting, $s^{2}=\\dfrac{R}{n-2}$ — two observations have been spent, one on the intercept and one on the slope, and dividing by $n$ instead would quietly understate the noise.` },
    { title: "The residual variance", body: `Spreading the residual sum of squares over the degrees of freedom that survived the fit: $\\dfrac{${fmtNum(d.rss)}}{${fmtNum(p.n)}-2}=${fmtNum(p.sVar)}$ squared basis points.` },
    { title: "The residual standard deviation", body: `Its root is the typical size of a residual: $\\sqrt{${fmtNum(p.sVar)}}=${fmtNum(d.sSD)}$ basis points.` },
    { title: "Answer", body: `Dividing by the root of the predictor's spread gives $\\dfrac{${fmtNum(d.sSD)}}{\\sqrt{${fmtNum(p.sxx)}}}=${fmtNum(d.answer)}$. The slope is basis points of bond spread per basis point of index spread, so it carries no units, and neither does its standard error.` },
    { title: "Sanity check", body: `The ${fmtNum(p.n)} days enter this calculation only through the degrees of freedom, because the predictor's spread was handed over separately. What buys precision is that spread: at the same residual variance, doubling $S_{xx}$ divides this standard error by $\\sqrt{2}$. And $S_{xx}$ is a SUM, so it grows both with the number of days and with how far the index moved on each of them — which is why a violent fortnight can pin a hedge ratio down better than a quiet quarter.` },
  ],
  keyInsight: "A slope is pinned down by how far apart the predictor's values are, not by how many of them there are: the sample size enters the standard error only through the degrees of freedom in the residual variance, while the predictor's spread enters directly under the root. Data collected in a regime where nothing moved buys almost no information about a slope.",
  commonTrap: "Dividing the residual sum of squares by n rather than by n-2, which understates the residual variance and so overstates how precisely the slope is known. The other two slips are structural: dividing by the predictor's sum of squares instead of by its root, which is off by a whole factor of that root, and reaching for the root of the sample size out of habit with the standard error of a mean — that formula belongs to an average, not to a slope.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [2],
};
