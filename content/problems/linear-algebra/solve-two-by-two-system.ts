import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const solveTwoByTwoSystem: ProblemTemplate = {
  id: "linear-algebra/solve-two-by-two-system",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 1,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "jump", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "a two by two linear system read through Cramer's rule" },
  // The solution is DRAWN and the two constants derived from it, rather than the reverse: that
  // keeps both equations over integers and puts the answer on a wide axis of its own.
  params: {
    x:  { choices: [-9, -8, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14] },
    y:  { choices: [-7, -4, -3, -2, 2, 3, 5, 6] },
    a1: { choices: [2, 3, 4, 5, 7] },
    b1: { choices: [-5, -3, -2, 2, 3, 6] },
    a2: { choices: [-4, 3, 5] },
    b2: { choices: [-6, 2, 7] },
  },
  // x !== y is not cosmetic: where the two unknowns coincide, solving for the WRONG one grades
  // as correct, and the full-space audit put that at 6.25% of draws before this conjunct.
  constraint: (p) => p.a1 * p.b2 - p.a2 * p.b1 !== 0 && p.x !== p.y,
  derived: (p) => ({
    c1: p.a1 * p.x + p.b1 * p.y,
    c2: p.a2 * p.x + p.b2 * p.y,
    det: p.a1 * p.b2 - p.a2 * p.b1,
    numer: (p.a1 * p.x + p.b1 * p.y) * p.b2 - (p.a2 * p.x + p.b2 * p.y) * p.b1,
    // Printed as a magnitude beside the word "minus", so it has to be traceable in its own right.
    b1Abs: Math.abs(p.b1),
    b2Abs: Math.abs(p.b2),
    answer: p.x,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) => {
    const eq = (a: number, b: number, c: number, bAbs: number) =>
      `${fmtNum(a)}x ${b < 0 ? "minus" : "plus"} ${fmtNum(bAbs)}y equals ${fmtNum(c)}`;
    return `A desk writes down two equations in the same two unknowns. The first says ${eq(p.a1, p.b1, d.c1, d.b1Abs)}. ` +
      `The second says ${eq(p.a2, p.b2, d.c2, d.b2Abs)}. What is x?`;
  },
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "One unknown is a ratio of two determinants", body: `Cramer's rule answers for a single unknown without touching the other. It says $x=\\dfrac{n}{D}$, where $D$ is the determinant of the coefficients and $n$ is that same determinant with the column belonging to $x$ replaced by the two constants.` },
      { title: "The determinant of the coefficients", body: `Down the coefficient side, the determinant is the leading diagonal less the other one: $${op(p.a1)}\\times${op(p.b2)}-${op(p.a2)}\\times${op(p.b1)}=${fmtNum(d.det)}$. It is not zero, so the two lines meet exactly once and there is a single answer to find.` },
      { title: "Swap the constants into the x column", body: `Replacing the $x$ column by the constants and taking the determinant again gives $${op(d.c1)}\\times${op(p.b2)}-${op(d.c2)}\\times${op(p.b1)}=${fmtNum(d.numer)}$. Every operand here is one of the six integers on the page, so nothing has been rounded on the way in.` },
      { title: "Answer", body: `Dividing one determinant by the other: $\\dfrac{${fmtNum(d.numer)}}{${fmtNum(d.det)}}=${fmtNum(d.answer)}$, so x is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `The other unknown never entered the arithmetic, but it is ${fmtNum(p.y)}, and putting both back into the first equation reproduces the constant the desk wrote down: $${op(p.a1)}\\times${op(d.answer)}+${op(p.b1)}\\times${op(p.y)}=${fmtNum(d.c1)}$.` },
    ];
  },
  keyInsight: "Cramer's rule buys one unknown at the price of two determinants, and it never asks what the other unknown is. That is why it is the fast route when a question asks for a single component of the solution rather than the whole vector.",
  commonTrap: "Answering with the other unknown — the rule replaces the column belonging to the variable you want, and swapping columns answers the wrong question. The other slip is inverting the ratio, dividing the coefficient determinant by the constant one.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [],
};
