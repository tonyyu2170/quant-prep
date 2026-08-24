import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const inverseOfAConstantPlusDiagonal: ProblemTemplate = {
  id: "linear-algebra/inverse-of-a-constant-plus-diagonal",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "millennium", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "inverting a constant-plus-diagonal matrix on its two eigenspaces" },
  params: {
    a: { choices: [2, 3, 4, 5, 6, 8, 10] },
    b: { choices: [1, 2, 3, 4, 5, 6, 9] },
    n: { choices: [3, 4, 5, 6, 7, 8] },
  },
  constraint: (p) => p.a + p.b * p.n > 0,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const shifted = p.a + p.b * p.n;
    return {
      diagEntry: p.a + p.b,
      shifted,
      offDiagEntry: round(-p.b / (p.a * shifted)),
      answer: round((shifted - p.b) / (p.a * shifted)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A ${fmtNum(p.n)} by ${fmtNum(p.n)} matrix has every diagonal entry equal to ${fmtNum(d.diagEntry)} and every ` +
    `off-diagonal entry equal to ${fmtNum(p.b)}. What is a DIAGONAL entry of its inverse?`,
  solution: (p, d) => [
    { title: "Invert on each eigenspace separately", body: `The matrix is $aI+bJ$, which acts as one number on the all-ones direction and as another number on everything orthogonal to it. An inverse does the same thing with each of those numbers turned upside down, so the inverse must itself have the form $cI+dJ$ — the same shape, with new constants.` },
    { title: "The two numbers it acts by", body: `On the all-ones direction the matrix multiplies by $${fmtNum(p.a)}+${fmtNum(p.b)}\\times${fmtNum(p.n)}=${fmtNum(d.shifted)}$. On every other direction it multiplies by just ${fmtNum(p.a)}. Those are the two numbers the inverse has to undo.` },
    { title: "Assemble a diagonal entry", body: `Undoing them gives an inverse whose diagonal entry is the shared part less the correction the all-ones direction needs: $\\dfrac{${fmtNum(d.shifted)}-${fmtNum(p.b)}}{${fmtNum(p.a)}\\times${fmtNum(d.shifted)}}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `Each diagonal entry of the inverse is ${fmtNum(d.answer)}, and each off-diagonal entry is ${fmtNum(d.offDiagEntry)}.` },
    { title: "Sanity check", body: `A row of the original times a column of the inverse must give one. Note the sign: the off-diagonal entry ${fmtNum(d.offDiagEntry)} is NEGATIVE whenever the original's off-diagonal is positive, which is the inverse undoing the shared component the all-ones direction carries. An inverse of a positively correlated matrix is where partial correlations come from, and they routinely flip sign.` },
  ],
  keyInsight: "A matrix with only two eigenvalues inverts to a matrix of the same shape, because inverting acts on the eigenvalues and leaves the eigenspaces untouched. Recognising the shape is what turns an n-cubed computation into two divisions.",
  commonTrap: "Inverting the entries one by one, which is not what a matrix inverse does at any size. The other slip is forgetting that the all-ones direction is the only one carrying the off-diagonal weight, and correcting every direction by it.",
  expectedPaceS: 105,
  verify: { method: "brute-force" },
  constants: [],
};
