import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Cov(X+Y, X-Y) = Var(X) - Var(Y) once the cross terms cancel by independence, so for two
// discrete uniforms it is ((a^2-1) - (b^2-1))/12 = (a^2 - b^2)/12. Sign follows a vs b.
export const covarianceSumDifference: ProblemTemplate = {
  id: "ev-variance/covariance-sum-difference",
  version: 1,
  firms: [{ firm: "de-shaw", weight: 0.4 }, { firm: "two-sigma", weight: 0.35 }, { firm: "imc", weight: 0.25 }],
  topic: "probability/ev-variance",
  difficulty: 2,
  source: { kind: "free-resource", inspiration: "covariance of the sum and difference of two independent uniform draws" },
  params: {
    facesA: { range: { min: 4, max: 24, step: 1 } },
    facesB: { range: { min: 2, max: 12, step: 1 } },
  },
  // Equal face counts would make the covariance exactly zero, which no relative tolerance can
  // grade and which would flatten every directional claim in the prose.
  constraint: (p) => p.facesA !== p.facesB,
  derived: (p) => {
    const aSq = p.facesA * p.facesA;
    const bSq = p.facesB * p.facesB;
    return {
      aSq,
      bSq,
      diffSq: aSq - bSq,
      varA: (aSq - 1) / 12,
      varB: (bSq - 1) / 12,
      cov: (aSq - bSq) / 12,
    };
  },
  statement: (p) =>
    `Two fair counters are spun independently: the first shows a whole number from ${fmtNum(1)} to ${fmtNum(p.facesA)}, the second from ${fmtNum(1)} to ${fmtNum(p.facesB)}, each value equally likely on its own counter. A desk records the total of the two and, separately, the first reading minus the second. What is the covariance between the total and that difference?`,
  answerKey: "cov",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Expand the covariance", body: `Covariance is bilinear, so the total against the difference expands into four terms: the variance of the first reading, minus the variance of the second, plus two cross terms pairing the first reading with the second.` },
    { title: "The cross terms vanish", body: `The two counters are independent, so each cross term is zero. They also carry opposite signs and would cancel each other even if they were not — either way, what survives is the first variance minus the second.` },
    { title: "Variance of one counter", body: `A whole number drawn uniformly from ${fmtNum(1)} to $m$ has variance $\\frac{m^{2}-${fmtNum(1)}}{12}$. That gives $${fmtNum(d.varA)}$ for the first counter and $${fmtNum(d.varB)}$ for the second.` },
    { title: "Subtract", body: `The difference of the two variances is $\\frac{${fmtNum(d.aSq)}-${fmtNum(d.bSq)}}{12}=${fmtNum(d.cov)}$.` },
    { title: "Sanity check", body: `The sign follows whichever counter has more faces, and the answer would be exactly zero if the two matched — at which point the total and the difference would be uncorrelated despite both depending on the very same two readings.` },
  ],
  keyInsight: "Independence kills the cross terms, so the covariance of a sum with a difference is just the gap between the two variances — which means two quantities built from the very same pair of readings can still be uncorrelated.",
  commonTrap: "Concluding that independent inputs force the total and the difference to be uncorrelated. They are uncorrelated only when the two variances match; otherwise the imbalance leaks straight through.",
  expectedPaceS: 90,
  // 2 is the exponent printed in the variance formula m^2-1 over 12.
  constants: [1, 2, 12],
  verify: { method: "brute-force" },
};
