import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// R-squared from the sums of squares, then the degrees-of-freedom correction that makes adding
// a regressor cost something. Both printed chains are built from the ORIGINAL integers rather
// than from the ratios they produce: the unexplained share is 60/180 on some draws, which
// prints 0.3333, and multiplying that rounded third by the penalty no longer reconciles with
// the answer. \dfrac keeps the integers in the expression where the audit can re-evaluate them.
export const adjustedRSquaredFromSums: ProblemTemplate = {
  id: "statistics/adjusted-r-squared-from-sums",
  version: 1,
  topic: "statistics/regression",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.3 }, { firm: "de-shaw", weight: 0.25 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "R-squared from the ANOVA sums of squares, and the degrees-of-freedom adjustment" },
  params: {
    ssr: { choices: [120, 150, 180, 200, 240, 300, 360, 400, 480, 600] },
    sse: { choices: [40, 60, 80, 100, 120, 150, 200, 250] },
    n: { choices: [12, 16, 20, 25, 30, 40, 50, 80] },
    k: { choices: [1, 2, 3] },
  },
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const sst = p.ssr + p.sse;
    return {
      sst,
      r2: round(p.ssr / sst),
      unexplained: round(p.sse / sst),
      dfRes: p.n - p.k - 1,
      dfTot: p.n - 1,
      answer: round(1 - (p.sse / sst) * ((p.n - 1) / (p.n - p.k - 1))),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A linear regression is fitted on ${fmtNum(p.n)} observations with ${fmtNum(p.k)} explanatory variables plus an intercept. The fitted values account for ${fmtNum(p.ssr)} of squared variation, and the residuals leave ${fmtNum(p.sse)} unaccounted for. ` +
    `What is the adjusted R-squared of the fit?`,
  solution: (p, d) => [
    { title: "The two sums partition the total", body: `Total squared variation in the response splits exactly into the part the fit explains and the part it does not: $\\text{SST}=\\text{SSR}+\\text{SSE}$. Here that is $${fmtNum(p.ssr)}+${fmtNum(p.sse)}=${fmtNum(d.sst)}$.` },
    { title: "Plain R-squared is the explained share", body: `Dividing, the fit accounts for $\\dfrac{${fmtNum(p.ssr)}}{${fmtNum(d.sst)}}=${fmtNum(d.r2)}$ of the variation, leaving ${fmtNum(d.unexplained)} unexplained. That number can only rise when a variable is added, however useless the variable, because a coefficient of zero is always available to the fit.` },
    { title: "Charge for the degrees of freedom used", body: `The adjustment compares variances rather than sums, dividing the residual sum by its ${fmtNum(d.dfRes)} degrees of freedom and the total by its ${fmtNum(d.dfTot)}. What is left of the unexplained share is scaled by the ratio of those two counts.` },
    { title: "Answer", body: `$1-\\dfrac{${fmtNum(p.sse)}}{${fmtNum(d.sst)}}\\times\\dfrac{${fmtNum(d.dfTot)}}{${fmtNum(d.dfRes)}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The adjusted figure comes in below the plain ${fmtNum(d.r2)}, and it always does while any regressor is present: the penalty ratio exceeds one whenever ${fmtNum(p.k)} variables are fitted. The gap is what a useless variable would cost — add one and the plain figure cannot fall, while the adjusted one falls unless the new variable earns its degree of freedom back.` },
  ],
  keyInsight: "R-squared is a share of squared variation and can only go up as variables are added, so it cannot be used to choose between models of different size. The adjustment turns both sums into variances by dividing each by its own degrees of freedom, which is what makes an unhelpful regressor visibly costly.",
  commonTrap: "Reading a higher R-squared as a better model. Adding any variable at all, even noise, weakly raises it — the comparison only means something once both sums are put on a per-degree-of-freedom footing.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1],
};
