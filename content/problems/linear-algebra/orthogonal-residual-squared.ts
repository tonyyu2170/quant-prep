import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const orthogonalResidualSquared: ProblemTemplate = {
  id: "linear-algebra/orthogonal-residual-squared",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "Pythagoras on the projection and the residual" },
  // Same construction as projection-first-component: b = c*a + s*r with r perpendicular to a.
  // Asking for the SQUARED length keeps the answer an integer — the length itself is a root
  // that has no exact four-figure rendering and cannot carry a printed chain.
  params: {
    shape: { choices: [1, 2, 3, 4, 5, 6, 7, 8] },
    c: { choices: [-4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    s: { choices: [-5, -4, -3, -2, 2, 3, 4, 5, 6, 7] },
  },
  constraint: (p) => p.c !== p.s,
  derived: (p) => {
    const PAIR: Record<number, [number[], number[]]> = {
      1: [[2, 1, 1], [1, -1, -1]],
      2: [[2, 1, 2], [1, -2, 0]],
      3: [[2, 1, 0], [-1, 2, 0]],
      4: [[3, 2, 2], [2, -3, 0]],
      5: [[3, 1, 1], [-1, 3, 0]],
      6: [[2, 2, 1], [1, -1, 0]],
      7: [[4, 1, 2], [1, -2, -1]],
      8: [[2, 3, 1], [3, -2, 0]],
    };
    const [a, r] = PAIR[p.shape];
    const aa = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    const rr = r[0] * r[0] + r[1] * r[1] + r[2] * r[2];
    const b = [p.c * a[0] + p.s * r[0], p.c * a[1] + p.s * r[1], p.c * a[2] + p.s * r[2]];
    return {
      a1: a[0], a2: a[1], a3: a[2],
      b1: b[0], b2: b[1], b3: b[2],
      aa, rr,
      ab: p.c * aa,
      bb: b[0] * b[0] + b[1] * b[1] + b[2] * b[2],
      projSq: p.c * p.c * aa,
      answer: p.s * p.s * rr,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `One vector has components ${fmtNum(d.a1)}, ${fmtNum(d.a2)} and ${fmtNum(d.a3)}. A second has components ` +
    `${fmtNum(d.b1)}, ${fmtNum(d.b2)} and ${fmtNum(d.b3)}. The second is split into the part lying along the first ` +
    `and the part perpendicular to it. What is the SQUARED length of the perpendicular part?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "The split is a right angle, so Pythagoras applies", body: `Writing $b$ as its projection plus what is left over, the two pieces meet at a right angle by construction. Squared lengths then simply add: $u=v+w$, with $u$ the squared length of $b$, $v$ that of the projection and $w$ the perpendicular piece the question wants.` },
      { title: "The squared length of the whole vector", body: `Dotting the second vector into itself gives $${op(d.b1)}\\times${op(d.b1)}+${op(d.b2)}\\times${op(d.b2)}+${op(d.b3)}\\times${op(d.b3)}=${fmtNum(d.bb)}$. That is the hypotenuse of the right triangle, before anything has been taken away.` },
      { title: "The squared length of the projection", body: `The projection is $\\dfrac{${fmtNum(d.ab)}}{${fmtNum(d.aa)}}=${fmtNum(p.c)}$ copies of the first vector, whose own squared length is ${fmtNum(d.aa)}. Scaling a vector by a number multiplies its squared length by the SQUARE of that number, so the projection's squared length is $${op(p.c)}\\times${op(p.c)}\\times${fmtNum(d.aa)}=${fmtNum(d.projSq)}$.` },
      { title: "Answer", body: `Subtracting one from the other: $${fmtNum(d.bb)}-${fmtNum(d.projSq)}=${fmtNum(d.answer)}$, so the perpendicular part has squared length ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `The leftover can also be built directly, and it comes to ${fmtNum(p.s)} copies of a direction of squared length ${fmtNum(d.rr)} — giving $${op(p.s)}\\times${op(p.s)}\\times${fmtNum(d.rr)}=${fmtNum(d.answer)}$ by a route that never touched the hypotenuse. Two ways in, one number out.` },
    ];
  },
  keyInsight: "Splitting a vector along a direction and perpendicular to it builds a right triangle, so the squared lengths add exactly. That is the whole content of least squares: the residual sum of squares is what is left after the projection has taken its share.",
  commonTrap: "Scaling the squared length by the coefficient rather than by its square — doubling a vector quadruples its squared length. The other slip is answering with the length instead of the squared length, which the question deliberately does not ask for.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [],
};
