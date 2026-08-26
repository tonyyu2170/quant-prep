import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const projectionFirstComponent: ProblemTemplate = {
  id: "linear-algebra/projection-first-component",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 1,
  firms: [{ firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.2 }, { firm: "citadel", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the orthogonal projection of one vector onto another" },
  // b is BUILT as c*a + s*r with r perpendicular to a, so the projection coefficient is the
  // drawn c exactly and every dot product on the page is an integer.
  params: {
    shape: { choices: [1, 2, 3, 4, 5, 6, 7, 8] },
    c: { choices: [-5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] },
    s: { choices: [-4, -3, -2, -1, 1, 2, 3, 4, 5, 6] },
  },
  constraint: (p) => p.c !== p.s,
  derived: (p) => {
    // Every shape has a first entry above one and a perpendicular whose first entry is not
    // zero. Both are trap constraints in table form: at a first entry of one the coefficient
    // IS the component asked for, and at a perpendicular starting from zero the answer is
    // readable straight off b without projecting at all.
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
    return {
      a1: a[0], a2: a[1], a3: a[2],
      b1: p.c * a[0] + p.s * r[0], b2: p.c * a[1] + p.s * r[1], b3: p.c * a[2] + p.s * r[2],
      aa,
      ab: p.c * aa,
      // The leftover's first component, printed in the sanity check: computing it inline in
      // the prose instead leaves a number the traceability audit cannot account for.
      residual1: p.s * r[0],
      answer: p.c * a[0],
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `One vector has components ${fmtNum(d.a1)}, ${fmtNum(d.a2)} and ${fmtNum(d.a3)}. A second has components ` +
    `${fmtNum(d.b1)}, ${fmtNum(d.b2)} and ${fmtNum(d.b3)}. The second is projected onto the first. ` +
    `What is the FIRST component of that projection?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "A projection is one number times the direction", body: `Projecting $b$ onto $a$ lands somewhere along $a$, so the whole answer is a single multiple of it: $\\dfrac{t}{u}\\,a$, with $t$ the dot product of the two vectors and $u$ the dot product of $a$ with itself. The direction never changes; only the length does.` },
      { title: "The two dot products", body: `Multiplying matching components and adding gives $${op(d.a1)}\\times${op(d.b1)}+${op(d.a2)}\\times${op(d.b2)}+${op(d.a3)}\\times${op(d.b3)}=${fmtNum(d.ab)}$ for the pair, and $${op(d.a1)}\\times${op(d.a1)}+${op(d.a2)}\\times${op(d.a2)}+${op(d.a3)}\\times${op(d.a3)}=${fmtNum(d.aa)}$ for the first vector against itself.` },
      { title: "The multiple, then the component", body: `The multiple is $\\dfrac{${fmtNum(d.ab)}}{${fmtNum(d.aa)}}=${fmtNum(p.c)}$. That is not the answer: the question asks for a COMPONENT of the projection, so it has to be carried back onto the direction, and the first component of ${fmtNum(d.a1)}, ${fmtNum(d.a2)}, ${fmtNum(d.a3)} scales to $${op(p.c)}\\times${op(d.a1)}=${fmtNum(d.answer)}$.` },
      { title: "Answer", body: `The first component of the projection is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `What is left over after the projection is removed should be perpendicular to the first vector. Its first component is $${op(d.b1)}-${op(d.answer)}=${fmtNum(d.residual1)}$, and dotting the whole leftover against ${fmtNum(d.a1)}, ${fmtNum(d.a2)}, ${fmtNum(d.a3)} gives nothing at all — which is the definition of having projected correctly.` },
    ];
  },
  keyInsight: "The projection coefficient is a ratio of two dot products, and the second of them — the vector against itself — is what makes it a length rather than a raw overlap. Skip that denominator and the answer scales with how long the direction happens to be written.",
  commonTrap: "Stopping at the coefficient and reporting it as the component. The coefficient says how many copies of the direction to take; the component is that number times the direction's own first entry, and the two agree only when the direction starts with a one.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [],
};
