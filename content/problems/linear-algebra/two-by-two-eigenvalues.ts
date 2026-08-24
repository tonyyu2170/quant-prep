import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const twoByTwoEigenvalues: ProblemTemplate = {
  id: "linear-algebra/two-by-two-eigenvalues",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 1,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "eigenvalues of a 2x2 read off its trace and determinant" },
  // Drawn as two eigenvalues plus a shift rather than as (trace, determinant): that keeps the
  // discriminant a perfect square AND supplies the third axis a two-parameter space lacks.
  params: {
    lo: { choices: [1, 2, 3, 4, 5, 6, 7, 8] },
    hi: { choices: [9, 10, 11, 12, 13, 14, 15, 16, 18, 20] },
    shift: { choices: [-6, -4, -3, -2, 2, 3, 4, 5, 7, 10] },
  },
  constraint: (p) => p.hi > p.lo,
  derived: (p) => ({
    trace: p.lo + p.hi + 2 * p.shift,
    det: (p.lo + p.shift) * (p.hi + p.shift),
    disc: (p.hi - p.lo) * (p.hi - p.lo),
    gap: p.hi - p.lo,
    smaller: p.lo + p.shift,
    answer: p.hi + p.shift,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A two by two matrix has trace ${fmtNum(d.trace)} and determinant ${fmtNum(d.det)}. ` +
    `What is its larger eigenvalue?`,
  solution: (p, d) => [
    { title: "Two numbers pin both eigenvalues", body: `For any square matrix the eigenvalues sum to the trace and multiply to the determinant. Calling the two of them $a$ and $b$, that is $\\text{trace}=a+b$ and $\\text{det}=ab$ — two equations in two unknowns, so no characteristic polynomial needs writing down.` },
    { title: "Build the discriminant", body: `Two numbers with a known sum and product are the roots of a quadratic, and the quantity that separates them is the trace squared less four times the determinant: $${fmtNum(d.trace)}\\times${fmtNum(d.trace)}-4\\times${fmtNum(d.det)}=${fmtNum(d.disc)}$.` },
    { title: "Take the root and split the pair", body: `The square root of ${fmtNum(d.disc)} is ${fmtNum(d.gap)}, which is the GAP between the two eigenvalues. Half the trace is where they are centred, so the larger one sits half the gap above that centre: $\\dfrac{${fmtNum(d.trace)}+${fmtNum(d.gap)}}{2}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The larger eigenvalue is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The other root must be $${fmtNum(d.trace)}-${fmtNum(d.answer)}=${fmtNum(d.smaller)}$, and the two should multiply back to the determinant: $${fmtNum(d.answer)}\\times${fmtNum(d.smaller)}=${fmtNum(d.det)}$. Both checks land, which is the point of carrying the trace and the determinant rather than one of them.` },
  ],
  keyInsight: "Trace and determinant are the sum and product of the eigenvalues at every size, so at size two they determine the spectrum outright. That is why so many two-by-two questions are answered without ever writing the matrix down.",
  commonTrap: "Reading the square root of the discriminant as an eigenvalue rather than as the gap between the two. The other slip is forgetting to halve, which doubles the distance from the centre.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [4, 2],
};
