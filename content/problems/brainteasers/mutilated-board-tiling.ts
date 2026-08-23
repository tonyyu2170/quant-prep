import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The colouring argument, with the converse supplied by Gomory's closed-tour construction:
// on an even square board a Hamiltonian cycle through every square alternates colours, so
// deleting two squares of OPPOSITE colour cuts it into arcs of even length, each of which a
// run of dominoes covers. So the colour count is not merely necessary here, it decides.
export const mutilatedBoardTiling: ProblemTemplate = {
  id: "brainteasers/mutilated-board-tiling",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "citadel", weight: 0.2 }, { firm: "two-sigma", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "mutilated chessboard colouring argument and its Gomory converse" },
  params: {
    side: { choices: [8, 10] },
    r1: { range: { min: 1, max: 10, step: 1 } },
    c1: { range: { min: 1, max: 10, step: 1 } },
    r2: { range: { min: 1, max: 10, step: 1 } },
    c2: { range: { min: 1, max: 10, step: 1 } },
  },
  // Both squares must lie on the board and they must be different squares. Nothing here asks
  // the answer, so no helper is licensed (see registry.test.ts).
  constraint: (p) => p.r1 <= p.side && p.c1 <= p.side && p.r2 <= p.side && p.c2 <= p.side && (p.r1 !== p.r2 || p.c1 !== p.c2),
  derived: (p) => {
    const squares = p.side * p.side;
    const half = squares / 2;
    // A square is dark when its coordinates sum to an even number — the ordinary chessboard
    // colouring, anchored so that the top-left corner is dark.
    const dark1 = (p.r1 + p.c1) % 2 === 0 ? 1 : 0;
    const dark2 = (p.r2 + p.c2) % 2 === 0 ? 1 : 0;
    const darkLeft = half - dark1 - dark2;
    const lightLeft = half - (1 - dark1) - (1 - dark2);
    return { squares, half, sum1: p.r1 + p.c1, sum2: p.r2 + p.c2, darkLeft, lightLeft, remaining: squares - 2, answer: darkLeft === lightLeft ? 1 : 2 };
  },
  choices: ["Yes", "No"],
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `Take a board of ${fmtNum(p.side)} rows and ${fmtNum(p.side)} columns, coloured like a chessboard so that a square is dark exactly when its row number and column number add to an even total, ` +
    `and the corner in row ${fmtNum(1)} column ${fmtNum(1)} is dark. Two squares are cut out: the one in row ${fmtNum(p.r1)} column ${fmtNum(p.c1)}, and the one in row ${fmtNum(p.r2)} column ${fmtNum(p.c2)}. ` +
    `You now have dominoes, each covering two squares that share an edge. Can the remaining ${fmtNum(d.remaining)} squares be covered exactly, with no overlaps and nothing left bare?`,
  solution: (p, d) => [
    { title: "Colour first, count second", body: `A domino always lies across an edge, and neighbouring squares never share a colour, so every domino covers one dark square and one light square. A covering of the whole region therefore needs exactly as many dark squares as light ones.` },
    { title: "Count what is left", body: `The full board splits evenly: $${fmtNum(d.squares)}/2=${fmtNum(d.half)}$ squares of each colour. The square in row ${fmtNum(p.r1)} column ${fmtNum(p.c1)} adds to ${fmtNum(d.sum1)} and the square in row ${fmtNum(p.r2)} column ${fmtNum(p.c2)} adds to ${fmtNum(d.sum2)}, so after the two cuts ${fmtNum(d.darkLeft)} dark squares and ${fmtNum(d.lightLeft)} light ones remain.` },
    { title: d.answer === 2 ? "The counts disagree" : "The counts agree — now build one", body: d.answer === 2
        ? `${fmtNum(d.darkLeft)} against ${fmtNum(d.lightLeft)} is a mismatch, and no arrangement of dominoes can repair it, because the shortfall is a property of the region rather than of any attempt. No covering exists.`
        : `${fmtNum(d.darkLeft)} against ${fmtNum(d.lightLeft)} is a match, which only says no counting obstruction exists — a covering still has to be produced. Walk a closed tour that steps between edge-sharing squares and visits every square of the board exactly once before returning to its start; on a board with an even number of rows such a tour exists. Along it the colours alternate.` },
    { title: "Answer", body: d.answer === 2
        ? `The two cut squares share a colour, so the remainder is unbalanced and the covering is impossible. The answer is no.`
        : `Cutting two squares of opposite colour off the tour leaves two arcs, and because the colours alternate each arc has an even length. Lay dominoes along each arc in pairs and every one of the ${fmtNum(d.remaining)} squares is covered. The answer is yes.` },
    { title: "Sanity check", body: `The parity test is exactly the classic case of two opposite corners: both corners of a diagonal add to an even total or both to an odd one, so both are the same colour, the counts come out ${fmtNum(d.half)} against a number two away from it, and the board cannot be covered however long you try.` },
  ],
  keyInsight: "An impossibility proof needs an invariant that every legal move respects, and a colouring supplies one: if each tile must take one square of each colour, then any imbalance in the region settles the question before a single tile is placed. Matching counts are only the start of the other direction — a construction still has to be shown.",
  commonTrap: "Treating equal colour counts as proof that a covering exists. Balance is necessary and, on this board, enough — but only because a closed tour through every square can be cut into even arcs. On regions with no such tour, balanced and untileable happily coexist.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
