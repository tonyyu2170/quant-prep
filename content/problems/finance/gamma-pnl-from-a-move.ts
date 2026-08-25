import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// Every printed chain runs over exact operands: `constraint` licenses the book gamma, the move
// squared and the end-of-move delta as four-significant-figure exact values, so any of them can
// stand inside a later chain. The half is written \dfrac{1}{2}, which the evaluator reads and
// the traceability audit needs declared (constants 1 and 2). The answer floor keeps the P&L
// off the pennies.
export const gammaPnlFromAMove: ProblemTemplate = {
  id: "finance/gamma-pnl-from-a-move",
  version: 1,
  topic: "finance/pricing",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "sig", weight: 0.25 }, { firm: "imc", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the gamma P&L of a delta-hedged option book over one move" },
  params: {
    n: { choices: [10, 20, 25, 40, 50, 80, 100, 200] },
    gamma: { choices: [0.01, 0.02, 0.025, 0.04, 0.05, 0.08, 0.1] },
    move: { choices: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8] },
  },
  constraint: (p) => exact4(p.n * p.gamma) && exact4(p.n * p.gamma * p.move) && p.n * p.gamma * p.move * p.move / 2 >= 0.1,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      bookGamma: round(p.n * p.gamma),
      moveSq: round(p.move * p.move),
      endDelta: round(p.n * p.gamma * p.move),
      answer: round(p.n * p.gamma * p.move * p.move / 2),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `You are long ${fmtNum(p.n)} call options, each on one share, and the book is delta-hedged: the shares you are short cancel the options' delta exactly at today's price. ` +
    `Each option has a gamma of ${fmtNum(p.gamma)}, so its delta rises by ${fmtNum(p.gamma)} for every dollar the underlying rises and falls by the same for every dollar it falls. ` +
    `Before you can touch the hedge, the underlying moves ${fmtNum(p.move)} dollars — which way will turn out not to matter. Approximately how much does the hedged book make, in dollars?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Where the money comes from", body: `Write $G$ for the whole book's gamma and $x$ for the move. The hedge cancels the delta at the starting price only; after the underlying has travelled $s$ dollars the book carries a delta of $Gs$ that nothing offsets. The P&L is that stray delta accumulated over the move — the area of a triangle with base $x$ and height $Gx$ — so $P=\\dfrac{1}{2}\\,G\\,x^{2}$.` },
    { title: "The book's gamma", body: `Gamma adds across a position: $${fmtNum(p.n)}\\times${fmtNum(p.gamma)}=${fmtNum(d.bookGamma)}$ per dollar of move.` },
    { title: "Square the move", body: `The sign of the move is about to disappear: $${fmtNum(p.move)}\\times${fmtNum(p.move)}=${fmtNum(d.moveSq)}$.` },
    { title: "Answer", body: `Half the book gamma times the move squared: $\\dfrac{1}{2}\\times${fmtNum(p.n)}\\times${fmtNum(p.gamma)}\\times${fmtNum(d.moveSq)}=${fmtNum(d.answer)}$ dollars.` },
    { title: "Sanity check", body: `By the end of the move the book has picked up $${fmtNum(p.n)}\\times${fmtNum(p.gamma)}\\times${fmtNum(p.move)}=${fmtNum(d.endDelta)}$ deltas it did not have at the start, and none of them at the start. The average delta over the move is half of that, and half of ${fmtNum(d.endDelta)} share-equivalents riding a ${fmtNum(p.move)}-dollar move is $\\dfrac{1}{2}\\times${fmtNum(d.endDelta)}\\times${fmtNum(p.move)}=${fmtNum(d.answer)}$ again. A move down of the same size builds a short delta into a falling market and earns exactly the same.` },
  ],
  keyInsight: "A hedged option book makes money from the square of the move, not from its direction: the hedge is exact at one price only, and the further the underlying travels the more delta the book has quietly picked up. Half of gamma times the move squared is the whole of that convexity, and it is what theta is paying for.",
  commonTrap: "Multiplying gamma by the move and stopping, as if the delta had jumped all at once. It grows through the move, so the P&L is the area of a triangle rather than a rectangle, and the missing half is the commonest slip on the floor. The other is charging the P&L to the direction of the move, when a fall of the same size pays exactly the same.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
