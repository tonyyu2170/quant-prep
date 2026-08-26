import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const singularMatrixMissingEntry: ProblemTemplate = {
  id: "linear-algebra/singular-matrix-missing-entry",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "solving for the entry that makes a two by two determinant vanish" },
  // The top-left entry and a multiplier are drawn and the top-right derived as their product,
  // so the answer b*c/a is a whole number by construction rather than by a rejection filter.
  params: {
    a: { choices: [2, 3, 4, 5, 6, 8] },
    k: { choices: [-4, -3, -2, 2, 3, 4, 5, 6] },
    c: { choices: [-7, -5, -4, -3, 3, 4, 5, 6, 7, 9] },
  },
  // k !== a keeps the product of the two OTHER entries away from the answer: where they agree,
  // reading "a times c" straight off the page grades as correct, on 10% of draws before this.
  constraint: (p) => p.a * p.k !== p.c && p.k !== p.a,
  derived: (p) => ({
    b: p.a * p.k,
    // The determinant's two products, printed side by side in the final chain.
    cross: p.a * p.k * p.c,
    answer: p.k * p.c,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A two by two matrix has top row ${fmtNum(p.a)} and ${fmtNum(d.b)}, and its bottom-left entry is ${fmtNum(p.c)}. ` +
    `The bottom-right entry has been rubbed out. For what value of it is the matrix singular?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "Singular means the determinant is zero", body: `A square matrix is singular exactly when its determinant vanishes, and for a two by two that determinant is one diagonal product less the other: $ad-bc=D$. Setting $D$ to nothing leaves $ad=bc$, one equation in the one entry still missing.` },
      { title: "The known diagonal product", body: `The two entries that are both present sit on the anti-diagonal, and their product is $${op(d.b)}\\times${op(p.c)}=${fmtNum(d.cross)}$. Whatever the missing entry turns out to be, the leading diagonal has to match that number exactly.` },
      { title: "Divide out the entry you already have", body: `The leading diagonal is ${fmtNum(p.a)} times the missing entry, so the missing entry is $\\dfrac{${fmtNum(d.cross)}}{${fmtNum(p.a)}}=${fmtNum(d.answer)}$. It comes out whole, which is the hint that the row was built as a multiple in the first place.` },
      { title: "Answer", body: `The bottom-right entry is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `With it in place the two diagonal products agree: $${op(p.a)}\\times${op(d.answer)}=${fmtNum(d.cross)}$ against $${op(d.b)}\\times${op(p.c)}=${fmtNum(d.cross)}$. Equal products, zero determinant, and the second row is now ${fmtNum(p.c)} over ${fmtNum(p.a)} times the first — which is what singular means for a matrix this small: one row is a multiple of the other.` },
    ];
  },
  keyInsight: "For a two by two, singular is not an abstract condition — it is the single equation ad = bc, and one unknown entry falls straight out of it. Geometrically the two rows have become parallel, so the matrix flattens the plane onto a line.",
  commonTrap: "Reporting the anti-diagonal product itself and forgetting to divide by the entry already sitting on the leading diagonal. The other slip is dividing the wrong way round, which inverts the multiplier that relates the two rows.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [],
};
