import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const equicorrelationFitThenInverse: ProblemTemplate = {
  id: "linear-algebra/equicorrelation-fit-then-inverse",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "millennium", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "recovering the off-diagonal from a determinant, then inverting" },
  params: {
    a: { choices: [2, 3, 4, 5, 6, 7, 8] },
    b: { choices: [1, 2, 3, 4, 5, 6, 7, 8] },
    n: { choices: [3, 4, 5, 6] },
    wanted: { choices: [1, 2] },
  },
  constraint: (p) => Math.pow(p.a, p.n - 1) * (p.a + p.b * p.n) < 1e10,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const shifted = p.a + p.b * p.n;
    const tail = Math.pow(p.a, p.n - 1);
    const invDiag = round((shifted - p.b) / (p.a * shifted));
    const invOff = round(-p.b / (p.a * shifted));
    return {
      diagEntry: p.a + p.b,
      // Printed as the exponent, so it has to be traceable: emit.ts audits every number token
      // in the text, and `p.n - 1` is in neither params nor derived until it is named here.
      tailCount: p.n - 1,
      det: tail * shifted,
      tail,
      shifted,
      recovered: p.b,
      invDiag,
      invOff,
      answer: p.wanted === 1 ? invDiag : invOff,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  // What is disclosed is the GAP between a diagonal and an off-diagonal entry, not the diagonal
  // entry itself. That matters: the gap IS the ordinary eigenvalue, so dividing the determinant
  // by its power isolates the special one in closed form. Disclosing the diagonal entry instead
  // leaves both a and b unknown and turns the fit into a degree n-1 polynomial in b — solvable
  // numerically, but not the clean division this template is built to teach.
  statement: (p, d) =>
    `A ${fmtNum(p.n)} by ${fmtNum(p.n)} matrix has one common value down its diagonal and another common value ` +
    `everywhere off it, with the diagonal exceeding the off-diagonal by exactly ${fmtNum(p.a)}. Neither value itself ` +
    `has been disclosed. The matrix has determinant ${fmtNum(d.det)}. ` +
    `What is ${p.wanted === 1 ? "a DIAGONAL" : "an OFF-DIAGONAL"} entry of its inverse?`,
  solution: (p, d) => [
    { title: "The disclosed gap IS an eigenvalue", body: `A matrix of this shape is $aI+bJ$, with $b$ the off-diagonal value and $a$ the amount by which the diagonal exceeds it. Its eigenvalues are $a$ on every direction orthogonal to the all-ones vector, and $a$ plus $b n$ along it. So the disclosed gap is already one of the two eigenvalues, known to multiplicity $n$ minus one — and the determinant then leaves exactly one unknown.` },
    { title: "Recover what was withheld", body: `That ordinary eigenvalue contributes $${fmtNum(p.a)}^{${fmtNum(d.tailCount)}}=${fmtNum(d.tail)}$ to the determinant, so dividing it out isolates the special one: $\\dfrac{${fmtNum(d.det)}}{${fmtNum(d.tail)}}=${fmtNum(d.shifted)}$. Since that special eigenvalue is $a$ plus $b n$, the withheld off-diagonal must be $\\dfrac{${fmtNum(d.shifted)}-${fmtNum(p.a)}}{${fmtNum(p.n)}}=${fmtNum(d.recovered)}$, which puts the diagonal at ${fmtNum(d.diagEntry)}.` },
    { title: "Now invert", body: `With both eigenvalues in hand — ${fmtNum(p.a)} on almost every direction and ${fmtNum(d.shifted)} on the all-ones direction — the inverse has the same shape with each of those turned upside down. Its diagonal entry is $\\dfrac{${fmtNum(d.shifted)}-${fmtNum(d.recovered)}}{${fmtNum(p.a)}\\times${fmtNum(d.shifted)}}=${fmtNum(d.invDiag)}$ and its off-diagonal entry is $\\dfrac{-${fmtNum(d.recovered)}}{${fmtNum(p.a)}\\times${fmtNum(d.shifted)}}=${fmtNum(d.invOff)}$.` },
    { title: "Answer", body: `The ${p.wanted === 1 ? "diagonal" : "off-diagonal"} entry of the inverse is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `Both eigenvalues came out positive, so the determinant ${fmtNum(d.det)} had to be positive too, and it is. The recovered off-diagonal ${fmtNum(d.recovered)} is strictly below the diagonal entry ${fmtNum(d.diagEntry)} by the disclosed gap: $${fmtNum(d.diagEntry)}-${fmtNum(d.recovered)}=${fmtNum(p.a)}$. Had the gap been zero the matrix would be singular and no determinant could have been quoted at all.` },
  ],
  keyInsight: "A determinant is a product of eigenvalues, so when the shape of a matrix is known the determinant is enough to recover a missing entry. Fitting a parameter from an aggregate and then using it is the whole workflow of calibration, and this is that workflow at a size you can check by hand.",
  commonTrap: "Dividing the determinant by the wrong eigenvalue's power, which recovers a plausible but wrong off-diagonal and then poisons the inverse. The other slip is inverting the recovered entries directly rather than inverting the eigenvalues.",
  expectedPaceS: 175,
  verify: { method: "brute-force" },
  constants: [],
};
