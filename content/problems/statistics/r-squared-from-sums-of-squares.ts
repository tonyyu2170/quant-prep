import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Both sums of squares are whole numbers, so the explained part is exact and the answer is an
// exact quotient of two integers. `constraint` keeps the residual share away from both ends —
// an R-squared pinned near 0 or near 1 would collapse the answer onto a level a student could
// guess without reading, and near 0 it would also grade at rel 0.005 of almost nothing.
// It also rejects the half-and-half split: at an R-squared of exactly 0.5 this template's own
// commonTrap — quoting the residual share instead of the explained one — grades as CORRECT,
// and 0.5 is the MODAL answer here rather than a corner case. Integer comparison, so no float
// guard is needed.
// The correlation in the sanity check is a root of the EXACT literals, evaluated once and
// labelled thereafter (non-negotiable 2): rooting the printed 4-figure answer instead would
// feed a rounded operand into the only step nothing else checks.
export const rSquaredFromSumsOfSquares: ProblemTemplate = {
  id: "statistics/r-squared-from-sums-of-squares",
  version: 1,
  topic: "statistics/regression",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "citadel", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "R-squared as the share of variation a fit explains" },
  params: {
    tss: { choices: [120, 150, 180, 200, 240, 250, 300, 320, 360, 400, 450, 500] },
    rss: { range: { min: 20, max: 420, step: 10 } },
  },
  constraint: (p) => p.rss >= 0.08 * p.tss && p.rss <= 0.92 * p.tss && 2 * p.rss !== p.tss,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const ess = round(p.tss - p.rss);
    return {
      ess,
      corr: round(Math.sqrt(ess / p.tss)),
      answer: round(1 - p.rss / p.tss),   // from the exact operands, not from a rounded ratio
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A desk regresses one of its books' daily P&L on a single risk factor over a long sample. Measured about its own mean that P&L has a total sum of squares of ${fmtNum(p.tss)}, and the fitted regression leaves a residual sum of squares of ${fmtNum(p.rss)}. ` +
    `What share of the P&L's variation does the fit explain?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "The total variation splits in two, and only two", body: `Write $T$ for the total sum of squares of the response about its own mean, $U$ for the part the fit leaves unexplained — the residual sum of squares — and $E$ for the part it explains. The split is exact — $T=E+U$, with nothing left over — because least squares leaves the residuals uncorrelated with the fitted values by construction, so squaring their sum produces no cross term to account for. The share of the variation the fit accounts for is therefore the explained part over the whole, $R^{2}=\\dfrac{E}{T}=1-\\dfrac{U}{T}$, and the two forms are the same number reached from opposite ends.` },
    { title: "The part the fit explains", body: `Taking the residual sum of squares out of the total leaves $${fmtNum(p.tss)}-${fmtNum(p.rss)}=${fmtNum(d.ess)}$ of explained variation.` },
    { title: "Answer", body: `As a share of the total that is $\\dfrac{${fmtNum(d.ess)}}{${fmtNum(p.tss)}}=${fmtNum(d.answer)}$ — the fit explains that fraction of the P&L's variation, and the residuals carry the rest.` },
    { title: "Sanity check", body: `With a single predictor R-squared is the squared correlation between the P&L and the factor, so this fit corresponds to a correlation of $\\sqrt{\\dfrac{${fmtNum(d.ess)}}{${fmtNum(p.tss)}}}=${fmtNum(d.corr)}$ in size. Note how much weaker that sounds than the share does: taking the square root pushes every middling R-squared back toward a respectable-looking correlation, which is exactly why the two are quoted by different people. The sign is not recoverable from R-squared at all — a fit this good is equally consistent with the factor pushing the P&L up or down.` },
  ],
  keyInsight: "R-squared is a ratio of sums of squares, not a measure of whether the fit is right: it says what share of the response's variation the fitted line accounts for in this sample, and nothing about whether the relationship is causal, stable, or even linear. Being a ratio of like quantities it is also unitless, where the slope of the same fit is not — which is why it travels between books and instruments that share no units at all, and why it says nothing whatever about how the fit will do out of sample.",
  commonTrap: "Reporting the residual share instead of the explained one, which answers the complement of the question. The other slip is quoting the ratio of the residual sum of squares to the explained part rather than to the total — the denominator is always the whole variation, never the piece that is left.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
