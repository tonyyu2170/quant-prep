import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Correlation is not transitive but it is constrained, and the constraint is exactly the
// geometry: unit-variance series are unit vectors, correlation is the cosine of the angle
// between them, and two known angles bound the third by the triangle inequality on the sphere.
// `constraint` needs the answer — at rel 0.005 a bound of 1e-17 grades as exact equality and
// would fail the emitter's decimal-safe window besides — so the helper is licensed.
const boundOf = (par: { rhoXY: number; rhoYZ: number; want: number }) =>
  par.rhoXY * par.rhoYZ + (par.want === 1 ? 1 : -1) * Math.sqrt((1 - par.rhoXY ** 2) * (1 - par.rhoYZ ** 2));

export const correlationBoundThirdPair: ProblemTemplate = {
  id: "statistics/correlation-bound-third-pair",
  version: 1,
  topic: "statistics/moments",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "two-sigma", weight: 0.25 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "correlation is not transitive: the bound from projecting onto the shared series" },
  params: {
    rhoXY: { range: { min: -0.9, max: 0.9, step: 0.1 } },
    rhoYZ: { range: { min: -0.9, max: 0.9, step: 0.1 } },
    want: { choices: [0, 1] },   // 1 = the largest possible, 0 = the smallest
  },
  constraint: (p) => Math.abs(boundOf(p as { rhoXY: number; rhoYZ: number; want: number })) >= 0.15,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const sqXY = round(p.rhoXY ** 2);
    const sqYZ = round(p.rhoYZ ** 2);
    const residXY = round(1 - sqXY);
    const residYZ = round(1 - sqYZ);
    const prod = round(p.rhoXY * p.rhoYZ);
    const spread = round(Math.sqrt(residXY * residYZ));
    return {
      sqXY, sqYZ, residXY, residYZ, prod, spread,
      lower: round(prod - spread),
      upper: round(prod + spread),
      answer: round(p.want === 1 ? prod + spread : prod - spread),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Three return series X, Y and Z. The correlation between X and Y is ${fmtNum(p.rhoXY)}, and the correlation between Y and Z is ${fmtNum(p.rhoYZ)}. ` +
    `Nothing else is known about them. Correlation does not simply pass along a chain, but it is not free either. ` +
    `What is the ${p.want === 1 ? "largest" : "smallest"} value the correlation between X and Z could possibly take?`,
  solution: (p, d) => [
    { title: "Split X and Z along Y", body: `Standardise all three series. Each of X and Z can be written as its correlation with Y times Y, plus a leftover piece that is uncorrelated with Y. The leftover carries whatever variance the Y-part does not: for X that leftover has variance $1-${fmtNum(d.sqXY)}=${fmtNum(d.residXY)}$, and for Z it is $1-${fmtNum(d.sqYZ)}=${fmtNum(d.residYZ)}$.` },
    { title: "Correlate the two pieces", body: `In symbols, $\\text{corr}(X,Z)=\\text{corr}(X,Y)\\,\\text{corr}(Y,Z)+\\sqrt{\\text{Var}(u)\\,\\text{Var}(v)}\\,\\text{corr}(u,v)$ where u and v are the two leftovers: the correlation of X with Z is the correlation of their Y-parts plus the correlation of their leftovers. The first is fixed: $${fmtNum(p.rhoXY)}\\times${fmtNum(p.rhoYZ)}=${fmtNum(d.prod)}$. The second is scaled by the two leftover sizes and by the correlation between the leftovers, and nothing in the question pins that down — it may be anything from minus one to one.` },
    { title: "So the answer is an interval", body: `The half-width is the product of the two leftover sizes, $\\sqrt{${fmtNum(d.residXY)}\\times${fmtNum(d.residYZ)}}=${fmtNum(d.spread)}$. The correlation between X and Z can be anywhere from ${fmtNum(d.lower)} to ${fmtNum(d.upper)}, and every value in between is achievable.` },
    { title: "Answer", body: `Taking the ${p.want === 1 ? "top" : "bottom"} of that interval — the centre ${p.want === 1 ? "plus" : "minus"} the half-width — gives ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The interval never escapes the legal range: the widest it can be is when one of the two given correlations is zero, and then the centre sits at zero and the half-width at one, giving exactly the full range a correlation is allowed. Here the interval runs from ${fmtNum(d.lower)} to ${fmtNum(d.upper)}, comfortably inside it.` },
  ],
  keyInsight: "Correlation is the cosine of an angle between series treated as vectors, so two known correlations fix two angles and leave the third free only within what the triangle inequality permits. The unknown piece is the correlation between the two residuals, and it is the only degree of freedom in the problem.",
  commonTrap: "Multiplying the two correlations and calling that the answer. That is the centre of the interval, not the correlation itself — it is what you get only when the two leftovers happen to be uncorrelated, and the question asks for an extreme rather than a typical case.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
  constants: [1],
};
