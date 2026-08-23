import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The weight that minimises a two-asset variance. `constraint` needs the answer itself — an
// exterior optimum is a short position and a different question, and a weight near zero would
// grade at rel 0.005 of almost nothing — so a module-level helper is licensed here.
const weightOf = (par: { varA: number; varB: number; cov: number }) =>
  (par.varB - par.cov) / (par.varA + par.varB - 2 * par.cov);

export const minVarianceWeight: ProblemTemplate = {
  id: "statistics/min-variance-weight",
  version: 1,
  topic: "statistics/moments",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.3 }, { firm: "citadel", weight: 0.25 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "minimum-variance weight of a two-asset portfolio" },
  params: {
    varA: { choices: [100, 225, 400, 625, 900, 1225, 1600, 2025, 2500] },
    varB: { choices: [100, 225, 400, 625, 900, 1225, 1600, 2025, 2500] },
    cov: { choices: Array.from({ length: 36 }, (_, i) => (i < 18 ? -900 + 50 * i : 50 + 50 * (i - 18))) },
  },
  constraint: (p) => p.cov * p.cov < p.varA * p.varB && weightOf(p as { varA: number; varB: number; cov: number }) >= 0.1 && weightOf(p as { varA: number; varB: number; cov: number }) <= 0.9,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const num = p.varB - p.cov;
    const twoCov = 2 * p.cov;
    const den = p.varA + p.varB - twoCov;
    const w = num / den;
    return {
      num, twoCov, den,
      other: round(1 - w),
      minVar: round((p.varA * p.varB - p.cov * p.cov) / den),
      answer: round(w),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Two strategies have daily P&L variances of ${fmtNum(p.varA)} for A and ${fmtNum(p.varB)} for B, with a covariance of ${fmtNum(p.cov)}, all in squared basis points. ` +
    `You will run a blend of the two: a fraction of the book in A and the rest in B, both long, with the fractions adding to one. ` +
    `Which fraction in A makes the variance of the combined book as small as possible?`,
  solution: (p, d) => [
    { title: "Write the variance as a function of the weight", body: `Putting a weight on A and the complement on B, the book's variance is the weighted own-variance terms plus twice the weighted covariance. As a function of the weight that is a quadratic, and its leading coefficient is ${fmtNum(p.varA)} plus ${fmtNum(p.varB)} less twice the covariance, which is positive for any covariance matrix that can exist — so the parabola opens upward and has a genuine minimum.` },
    { title: "Differentiate and set to zero", body: `The derivative is linear in the weight, and solving it gives $a=\\dfrac{\\text{Var}(Y)-\\text{Cov}(X,Y)}{\\text{Var}(X)+\\text{Var}(Y)-2\\,\\text{Cov}(X,Y)}$ — the ratio of two quantities built from the same three numbers: B's variance less the covariance on top, and the same leading coefficient underneath.` },
    { title: "Put the numbers in", body: `Top: $${fmtNum(p.varB)}${p.cov < 0 ? `+${fmtNum(Math.abs(p.cov))}` : `-${fmtNum(p.cov)}`}=${fmtNum(d.num)}$. Bottom: $${fmtNum(p.varA)}+${fmtNum(p.varB)}${d.twoCov < 0 ? `+${fmtNum(Math.abs(d.twoCov))}` : `-${fmtNum(d.twoCov)}`}=${fmtNum(d.den)}$.` },
    { title: "Answer", body: `The minimising fraction in A is $${fmtNum(d.num)}/${fmtNum(d.den)}=${fmtNum(d.answer)}$, leaving ${fmtNum(d.other)} in B.` },
    { title: "Sanity check", body: `At that split the book's variance is ${fmtNum(d.minVar)}, which is below both ${fmtNum(p.varA)} and ${fmtNum(p.varB)} — as it must be, since the all-A and all-B books are themselves available splits and the minimum can only improve on them.` },
  ],
  keyInsight: "Minimising a quadratic in one weight is a one-line derivative, and the answer leans away from the noisier leg and away from whichever leg the other one tracks. The covariance moves the optimum even when both variances are unchanged, which is why a hedge ratio is not a volatility ratio.",
  commonTrap: "Splitting inversely to the variances. That is right only when the covariance is zero; a positive covariance pushes weight toward the leg with less shared movement, and a negative one pushes toward whichever leg buys more offset.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [2],
};
