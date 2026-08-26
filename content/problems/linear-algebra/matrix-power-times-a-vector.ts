import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const matrixPowerTimesAVector: ProblemTemplate = {
  id: "linear-algebra/matrix-power-times-a-vector",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 3,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "citadel", weight: 0.2 }, { firm: "millennium", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "a two-state linear recurrence run through its eigen-decomposition" },
  // Built backwards from the answer: two eigenvalues, two eigenvector ratios one apart, and
  // the start vector's coordinates IN THAT BASIS are what get drawn. The one-apart ratios keep
  // the inverse basis matrix integral, so every entry the reader is shown is a whole number.
  params: {
    shape: { choices: [1, 2, 3, 4, 5] },
    lam1:  { choices: [-3, -2, 2, 3, 4] },
    lam2:  { choices: [-2, 1, 3, 5, 6] },
    alpha: { choices: [-3, -2, 2, 3, 5] },
    beta:  { choices: [-4, -1, 1, 2, 4] },
    k:     { choices: [2, 3, 4] },
  },
  // The last two conjuncts are trap constraints. Equal powers let the whole start vector be
  // raised as one lump and still land right; a second mode too small to see lets it be dropped
  // outright, and that one was winning within a sixth of the grading band before the floor.
  constraint: (p) => p.lam1 !== p.lam2 && Math.abs(p.alpha) * Math.pow(Math.abs(p.lam1), p.k) < 1e6 && Math.pow(p.lam1, p.k) !== Math.pow(p.lam2, p.k) && Math.abs(p.beta * Math.pow(p.lam2, p.k)) > 0.05 * Math.abs(p.alpha * Math.pow(p.lam1, p.k) + p.beta * Math.pow(p.lam2, p.k)),
  derived: (p) => {
    // Eigenvector ratios one apart, so the change-of-basis determinant is one.
    const MPAIR: Record<number, [number, number]> = { 1: [1, 2], 2: [2, 3], 3: [3, 4], 4: [-2, -1], 5: [-3, -2] };
    const [m1, m2] = MPAIR[p.shape];
    return {
      m1, m2,
      a: p.lam1 * m2 - p.lam2 * m1,
      b: p.lam2 - p.lam1,
      c: m1 * m2 * (p.lam1 - p.lam2),
      d: p.lam2 * m2 - p.lam1 * m1,
      trace: p.lam1 + p.lam2,
      det: p.lam1 * p.lam2,
      x0: p.alpha + p.beta,
      y0: p.alpha * m1 + p.beta * m2,
      firstMode: p.alpha * Math.pow(p.lam1, p.k),
      secondMode: p.beta * Math.pow(p.lam2, p.k),
      answer: p.alpha * Math.pow(p.lam1, p.k) + p.beta * Math.pow(p.lam2, p.k),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) => {
    const term = (co: number, v: string) => `${co < 0 ? "minus" : "plus"} ${fmtNum(Math.abs(co))} times the old ${v}`;
    return `Two quantities are updated together, once per period. The new x is ${fmtNum(d.a)} times the old x ${term(d.b, "y")}. ` +
      `The new y is ${fmtNum(d.c)} times the old x ${term(d.d, "y")}. They start at x equal to ${fmtNum(d.x0)} and ` +
      `y equal to ${fmtNum(d.y0)}. What is x after ${fmtNum(p.k)} periods?`;
  },
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "Powers are easy in the right basis", body: `Applying the update ${fmtNum(p.k)} times means raising its matrix to that power, and multiplying the matrix out repeatedly is the slow road. Along an eigen-direction the matrix acts as a single number, so a start vector split across the two directions evolves as $x_k=pu^k+qv^k$ — each piece simply scaled by its own eigenvalue raised to the power.` },
      { title: "Find the two eigenvalues", body: `They sum to the trace and multiply to the determinant. Here the trace is $${op(d.a)}+${op(d.d)}=${fmtNum(d.trace)}$ and the determinant is $${op(d.a)}\\times${op(d.d)}-${op(d.b)}\\times${op(d.c)}=${fmtNum(d.det)}$, and the two numbers that do both are ${fmtNum(p.lam1)} and ${fmtNum(p.lam2)} — check: $${op(p.lam1)}+${op(p.lam2)}=${fmtNum(d.trace)}$ and $${op(p.lam1)}\\times${op(p.lam2)}=${fmtNum(d.det)}$.` },
      { title: "Split the start across the two directions", body: `The eigenvector for the first eigenvalue has its second component ${fmtNum(d.m1)} times its first, and for the second it is ${fmtNum(d.m2)} times. Writing the start as so many of the first plus so many of the second and matching both components gives ${fmtNum(p.alpha)} and ${fmtNum(p.beta)}: $${op(p.alpha)}+${op(p.beta)}=${fmtNum(d.x0)}$ across the top, and $${op(p.alpha)}\\times${op(d.m1)}+${op(p.beta)}\\times${op(d.m2)}=${fmtNum(d.y0)}$ down the bottom.` },
      { title: "Answer", body: `Each piece is scaled by its own eigenvalue to the power ${fmtNum(p.k)}: $${op(p.alpha)}\\times${op(p.lam1)}^{${fmtNum(p.k)}}+${op(p.beta)}\\times${op(p.lam2)}^{${fmtNum(p.k)}}=${fmtNum(d.answer)}$. So x is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `The two pieces are ${fmtNum(d.firstMode)} and ${fmtNum(d.secondMode)}, and neither is negligible — over a long enough horizon the larger eigenvalue would swamp the other and the whole path would look like a single growth rate, but ${fmtNum(p.k)} periods is not long enough for that. Both modes still have to be carried.` },
    ];
  },
  keyInsight: "A matrix power acting on a vector is not a matrix computation at all once the vector is written in the eigenbasis: each coordinate is scaled by its own eigenvalue raised to the power. The work is entirely in the change of basis, and it is done once however large the power gets.",
  commonTrap: "Raising the start vector's components to the power, or scaling the whole start by one eigenvalue — both treat a mixture as if it were a single mode. The split has to happen BEFORE the power is applied, because the two directions grow at different rates.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
  constants: [],
};
