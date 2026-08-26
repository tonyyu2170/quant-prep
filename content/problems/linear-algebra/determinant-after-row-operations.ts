import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const determinantAfterRowOperations: ProblemTemplate = {
  id: "linear-algebra/determinant-after-row-operations",
  version: 1,
  topic: "pure-math/linear-algebra",
  difficulty: 2,
  firms: [{ firm: "jump", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "jane-street", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "how the three elementary row operations move a determinant" },
  params: {
    det:   { choices: [-9, -7, -6, -4, -3, 2, 3, 4, 5, 6, 8, 11, 13] },
    k:     { choices: [-4, -3, -2, 2, 3, 4, 5, 6] },
    n:     { choices: [3, 4, 5, 6] },
    // Odd only. At an even number of swaps the sign cancels, and "forgot the swap flips the
    // sign" then returns the right answer — 33% of draws before the axis was cut to odds.
    swaps: { choices: [1, 3, 5] },
  },
  constraint: (p) => p.det * p.k !== 0,
  derived: (p) => ({
    sign: -1,
    scaled: p.det * p.k,
    answer: -p.det * p.k,
  }),
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A ${fmtNum(p.n)} by ${fmtNum(p.n)} matrix has determinant ${fmtNum(p.det)}. Three things are then done to it, ` +
    `in order: ${fmtNum(p.swaps)} pairs of rows are exchanged, one row is multiplied through by ${fmtNum(p.k)}, and ` +
    `finally a multiple of one row is added to a different row. What is the determinant of the matrix that comes out?`,
  solution: (p, d) => {
    const op = (v: number) => (v < 0 ? `(${fmtNum(v)})` : fmtNum(v));
    return [
      { title: "Three operations, three different effects", body: `The elementary row operations each do something specific and none of them is a mystery: exchanging two rows flips the sign, multiplying a row through by a number multiplies the determinant by that same number, and adding a multiple of one row to another leaves it completely alone. In symbols, $E=sDk$.` },
      { title: "The exchanges", body: `Each exchange contributes a factor of minus one, so ${fmtNum(p.swaps)} of them contribute $(-1)^{${fmtNum(p.swaps)}}=${fmtNum(d.sign)}$. An odd count therefore flips the sign and an even count would have restored it — the parity is the whole content of this step.` },
      { title: "The scaling, and the one that does nothing", body: `Multiplying a single row through by ${fmtNum(p.k)} multiplies the determinant by ${fmtNum(p.k)} — once, not once per row: $${op(p.det)}\\times${op(p.k)}=${fmtNum(d.scaled)}$. The final operation, adding a multiple of one row to another, changes nothing at all, which is exactly why elimination can be run without tracking it.` },
      { title: "Answer", body: `Putting the sign onto the scaled determinant: $${op(d.sign)}\\times${op(d.scaled)}=${fmtNum(d.answer)}$.` },
      { title: "Sanity check", body: `The size of the matrix never entered the arithmetic. It would have, had every entry been multiplied by ${fmtNum(p.k)} rather than a single row — that scales the determinant by ${fmtNum(p.k)} raised to the power ${fmtNum(p.n)}. One row is one factor; the whole matrix is one factor per row.` },
    ];
  },
  keyInsight: "The row operation that does the work in elimination — adding a multiple of one row to another — is precisely the one that leaves the determinant untouched. That is why Gaussian elimination can compute a determinant at all: only the swaps and the scalings have to be tracked.",
  commonTrap: "Losing the sign from the exchanges, which is invisible whenever the number of them happens to be even. The other slip is raising the row scaling to the power of the matrix size — that is the rule for scaling EVERY entry, not one row.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [1],
};
