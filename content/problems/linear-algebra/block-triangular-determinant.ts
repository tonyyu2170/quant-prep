import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const blockTriangularDeterminant: ProblemTemplate = {
  id: "linear-algebra/block-triangular-determinant",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "jane-street", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the determinant of a block triangular matrix" },
  params: {
    d1: { choices: [-8, -6, -5, -3, -2, 2, 3, 4, 5, 6, 7, 9, 10, 12] },
    d2: { choices: [-7, -5, -4, -2, 2, 3, 4, 6, 8, 9, 11] },
    t1: { choices: [-3, 1, 2, 4, 5, 7] },
    t2: { choices: [-2, 1, 3, 5, 6, 8] },
  },
  // The trace conditions keep both blocks real-eigenvalued so the quoted traces describe
  // matrices a reader could actually write down. The last two conjuncts are trap constraints:
  // where the traces multiply to one they fold away invisibly, and where the two determinants
  // happen to sum to their own product, adding the blocks grades as correct.
  constraint: (p) => p.t1 * p.t1 >= 4 * p.d1 && p.t2 * p.t2 >= 4 * p.d2 && p.t1 * p.t2 !== 1 && p.d1 * p.d2 !== p.d1 + p.d2,
  derived: (p) => ({
    traceAll: p.t1 + p.t2,
    answer: p.d1 * p.d2,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A four by four matrix is built out of two by two blocks. The top-left block has trace ${fmtNum(p.t1)} and ` +
    `determinant ${fmtNum(p.d1)}. The bottom-right block has trace ${fmtNum(p.t2)} and determinant ${fmtNum(p.d2)}. ` +
    `Every entry of the bottom-left block is zero, and the top-right block is not stated. ` +
    `What is the determinant of the whole four by four matrix?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "A zero block below the diagonal splits the determinant", body: `When the bottom-left block is entirely zero the matrix is block upper triangular, and its determinant factors into the determinants of the two diagonal blocks: $D=uv$. This is the block version of the rule that a triangular matrix's determinant is the product down its diagonal.` },
      { title: "The unstated block genuinely does not matter", body: `The top-right block is missing from the question because it cannot affect the answer. Expanding the determinant, every term that reaches into the top-right block must also pick an entry from the bottom-left block to stay in distinct rows and columns — and those entries are all zero, so every such term dies.` },
      { title: "Multiply the two block determinants", body: `That leaves one product: $${op(p.d1)}\\times${op(p.d2)}=${fmtNum(d.answer)}$. The two traces are on the page but do not enter it — they pin down what each block's eigenvalues are individually, not what the four of them multiply to.` },
      { title: "Answer", body: `The determinant of the whole matrix is ${fmtNum(d.answer)}.` },
      { title: "Sanity check", body: `The traces do combine, just for a different quantity: the whole matrix's trace is the sum down its diagonal, which is $${op(p.t1)}+${op(p.t2)}=${fmtNum(d.traceAll)}$. Determinants multiply across the blocks and traces add — reaching for the wrong one of those two rules is the whole trap.` },
    ];
  },
  keyInsight: "A zero block below the diagonal makes the determinant factor, because every permutation term that would use the top-right block is forced to pick up a zero. So a four by four question collapses to two two by two answers multiplied together.",
  commonTrap: "Letting the quoted traces into the arithmetic. Traces ADD across the blocks and determinants MULTIPLY, so multiplying the traces in is mixing two different rules — and the traces are stated only to fix each block as a real matrix.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [4],
};
