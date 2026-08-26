import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const eigenvectorComponentRatio: ProblemTemplate = {
  id: "linear-algebra/eigenvector-component-ratio",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "citadel", weight: 0.2 }, { firm: "hrt", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "reading an eigenvector off a two by two once its eigenvalue is known" },
  // The eigenvector ratio is DRAWN and the matrix built around it, so both rows of the
  // singular system agree on an exact integer answer. m is never one or minus one: those are
  // their own reciprocals, and the upside-down ratio would then grade as correct.
  params: {
    m:   { choices: [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] },
    lam: { choices: [-4, -2, 2, 3, 5, 6, 8, 10] },
    b:   { choices: [-5, -3, -2, 2, 3, 4] },
    d:   { choices: [-3, -1, 1, 2, 4, 7] },
  },
  constraint: (p) => p.lam !== p.d && p.lam - p.b * p.m !== 0 && p.m * (p.lam - p.d) !== p.m * (p.lam - p.b * p.m),
  derived: (p) => ({
    a: p.lam - p.b * p.m,
    c: p.m * (p.lam - p.d),
    gap: p.lam - (p.lam - p.b * p.m),
    lamLessD: p.lam - p.d,
    answer: p.m,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A two by two matrix has first column ${fmtNum(d.a)} and ${fmtNum(d.c)}, and second column ${fmtNum(p.b)} and ` +
    `${fmtNum(p.d)}. One of its eigenvalues is ${fmtNum(p.lam)}. For an eigenvector belonging to that eigenvalue, ` +
    `what is the ratio of the second component to the first?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "An eigenvector solves a system that has gone singular", body: `The defining equation is $Av=\\lambda v$, which rearranges to $Bv=z$ with $B$ the matrix less the eigenvalue down its diagonal and $z$ the zero vector. Subtracting an eigenvalue is exactly what makes $B$ singular, so its two rows say the SAME thing and either one alone determines the direction.` },
      { title: "Read the ratio off the first row", body: `The first row of that system says the top-left entry less the eigenvalue, times the first component, plus the top-right entry times the second, comes to nothing. Solving for the ratio gives $\\dfrac{${op(p.lam)}-${op(d.a)}}{${op(p.b)}}=${fmtNum(d.answer)}$.` },
      { title: "Answer", body: `The second component is ${fmtNum(d.answer)} times the first.` },
      { title: "The second row has to agree, and does", body: `Running the same argument on the bottom row gives $\\dfrac{${op(d.c)}}{${op(p.lam)}-${op(p.d)}}=${fmtNum(d.answer)}$. Two rows, one ratio — if they had disagreed, the number quoted as an eigenvalue would not have been one.` },
      { title: "Sanity check", body: `Only the ratio is determined, never the components themselves: any multiple of an eigenvector is another eigenvector, because scaling both sides of $Av=\\lambda v$ changes nothing. That is why the question asks for a ratio rather than for a vector.` },
    ];
  },
  keyInsight: "Subtracting an eigenvalue from the diagonal is what makes the system singular, and a singular two by two has two rows saying the same thing. So one row is enough to fix the eigenvector's direction, and the second row is a free check rather than new information.",
  commonTrap: "Reporting the ratio upside down — first component over second — which is a different number unless the ratio happens to be one. The other slip is reading the ratio off the matrix's own entries without first subtracting the eigenvalue from the diagonal.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [],
};
