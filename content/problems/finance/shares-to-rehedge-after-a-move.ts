import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The old hedge `n·D` and the new delta `D + Γx` are licensed exact by `constraint`, so both can
// stand inside a printed chain. The new TOTAL hedge `n(D + Γx)` is not exact in general (25
// contracts at a new delta of 0.4875 is 12.1875), so it is printed as a label only and never fed
// into arithmetic; the answer and the sanity chain are both built from the original literals.
export const sharesToRehedgeAfterAMove: ProblemTemplate = {
  id: "finance/shares-to-rehedge-after-a-move",
  version: 1,
  topic: "finance/pricing",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "akuna", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "re-hedging a long-gamma book after the underlying moves" },
  params: {
    n: { choices: [20, 25, 40, 50, 80, 100, 150, 200] },
    delta: { choices: [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6] },
    gamma: { choices: [0.01, 0.02, 0.025, 0.04, 0.05, 0.08, 0.1] },
    move: { choices: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5] },
  },
  constraint: (p) => p.delta + p.gamma * p.move <= 0.9 && p.n * p.gamma * p.move >= 1 && exact4(p.n * p.delta) && exact4(p.delta + p.gamma * p.move),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      oldHedge: round(p.n * p.delta),
      deltaChange: round(p.gamma * p.move),
      newDelta: round(p.delta + p.gamma * p.move),
      newHedge: round(p.n * (p.delta + p.gamma * p.move)),
      answer: round(p.n * p.gamma * p.move),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `You are long ${fmtNum(p.n)} call options, each on one share, with a delta of ${fmtNum(p.delta)} apiece, and you have sold ${fmtNum(d.oldHedge)} shares against them so that the position is delta-neutral. ` +
    `Each option has a gamma of ${fmtNum(p.gamma)}: its delta rises by ${fmtNum(p.gamma)} for every dollar the underlying rises. ` +
    `The underlying then rises ${fmtNum(p.move)} dollars. How many more shares must you sell to be delta-neutral again?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "What gamma does to a hedge", body: `Write $D$ for an option's delta today and $G$ for its gamma. Gamma is the rate at which delta moves, so after a rise of $x$ each option's delta is $D+Gx$. The hedge is the book's delta in shares: $h=nD$ short today, and $h=n(D+Gx)$ after the move.` },
    { title: "The new delta of one option", body: `$${fmtNum(p.delta)}+${fmtNum(p.gamma)}\\times${fmtNum(p.move)}=${fmtNum(d.newDelta)}$ — every option in the book has picked up ${fmtNum(d.deltaChange)} of delta.` },
    { title: "The new hedge", body: `Against ${fmtNum(p.n)} options at a delta of ${fmtNum(d.newDelta)} the book now wants ${fmtNum(d.newHedge)} shares short, and it has only ${fmtNum(d.oldHedge)}.` },
    { title: "Answer", body: `The shortfall is the change in delta across the whole book: $${fmtNum(p.n)}\\times${fmtNum(p.gamma)}\\times${fmtNum(p.move)}=${fmtNum(d.answer)}$ more shares to sell.` },
    { title: "Sanity check", body: `The same number falls out of the hedges directly: the old hedge was $${fmtNum(p.n)}\\times${fmtNum(p.delta)}=${fmtNum(d.oldHedge)}$ shares, and the change is $${fmtNum(p.n)}\\times(${fmtNum(d.newDelta)}-${fmtNum(p.delta)})=${fmtNum(d.answer)}$. Had the underlying fallen ${fmtNum(p.move)} instead, every delta would have dropped by ${fmtNum(d.deltaChange)} and you would be buying ${fmtNum(d.answer)} shares back — selling into the rally and buying into the dip is what a long-gamma hedger does all day.` },
  ],
  keyInsight: "Gamma is the rate at which a hedge goes stale: every dollar of move hands a long-gamma book more delta, and the hedger sells into rallies and buys into dips by exactly gamma times the move, per option. That mechanical sell-high, buy-low is where gamma's P&L is actually collected.",
  commonTrap: "Re-hedging to the new delta of a single option rather than the whole book, or selling the entire new hedge instead of the change. The shares already sold are still sold; only the increment trades.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
};
