import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const constantPlusDiagonalDeterminant: ProblemTemplate = {
  id: "linear-algebra/constant-plus-diagonal-determinant",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "determinant of a constant-plus-diagonal matrix via its two eigenvalues" },
  params: {
    a: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    b: { choices: [1, 2, 3, 4, 5, 6, 9, 12] },
    n: { choices: [3, 4, 5, 6, 7] },
  },
  constraint: (p) => Math.pow(p.a, p.n - 1) * (p.a + p.b * p.n) < 1e12,
  derived: (p) => ({
    // diagEntry exists ONLY so the statement can print it: emit.ts audits every number token in
    // the text against params + derived + constants, and `a + b` is in none of them.
    diagEntry: p.a + p.b,
    offDiagCount: p.n - 1,
    shifted: p.a + p.b * p.n,
    tail: Math.pow(p.a, p.n - 1),
    answer: Math.pow(p.a, p.n - 1) * (p.a + p.b * p.n),
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A risk system builds a ${fmtNum(p.n)} by ${fmtNum(p.n)} matrix in which every diagonal entry is ` +
    `${fmtNum(d.diagEntry)} and every off-diagonal entry is ${fmtNum(p.b)}. What is its determinant?`,
  solution: (p, d) => [
    { title: "One special direction, and everything orthogonal to it", body: `Split the matrix as $aI+bJ$, with $J$ the all-ones matrix. $J$ has rank one, so its eigenvalues are $n$ once — along the all-ones vector, whose entries $J$ simply sums — and zero on every direction whose entries add to nothing.` },
    { title: "Read the eigenvalues off", body: `Adding $aI$ shifts every eigenvalue by the same $a$, so one eigenvalue is $${fmtNum(p.a)}+${fmtNum(p.b)}\\times${fmtNum(p.n)}=${fmtNum(d.shifted)}$ and the remaining ${fmtNum(d.offDiagCount)} are all ${fmtNum(p.a)}.` },
    { title: "Answer", body: `The determinant is the product of the eigenvalues: $${fmtNum(p.a)}^{${fmtNum(d.offDiagCount)}}\\times${fmtNum(d.shifted)}=${fmtNum(d.tail)}\\times${fmtNum(d.shifted)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Every eigenvalue here is positive, so the determinant must be too, and the matrix is positive definite: $${fmtNum(d.answer)}>${fmtNum(0)}$. Had the off-diagonal entry been negative enough to drive ${fmtNum(d.shifted)} below zero, the determinant would have flipped sign and the risk system would be quoting an impossible covariance.` },
  ],
  keyInsight: "A matrix built from a constant plus a rank-one block has only two distinct eigenvalues, and finding them needs no characteristic polynomial — just the one direction the rank-one part acts on, and the whole space orthogonal to it. Every equicorrelation covariance matrix in finance has exactly this shape.",
  commonTrap: "Expanding the determinant by cofactors, which is correct and hopeless at this size. The other slip is giving the special eigenvalue the multiplicity of the ordinary one, which inverts the exponent and lands orders of magnitude away.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [0],
};
