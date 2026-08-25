import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The breakeven move is DRAWN and the day's theta is derived from it as half the book gamma
// times the move squared, so the root the learner takes is the root of an exact square — the
// only kind non-negotiable 3 allows. `constraint` licenses the book gamma, the theta and the
// squared move as four-figure exact values, which is why 1.25 is not in the move list: its
// square is 1.5625, five figures, and the chain that divides theta by gamma would then feed a
// rounded operand into the root.
export const thetaGammaBreakevenMove: ProblemTemplate = {
  id: "finance/theta-gamma-breakeven-move",
  version: 1,
  topic: "finance/options",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "akuna", weight: 0.25 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the daily move at which a long-gamma book's convexity pays for its time decay" },
  params: {
    n: { choices: [10, 20, 25, 40, 50, 100] },
    gamma: { choices: [0.01, 0.02, 0.025, 0.04, 0.05, 0.08, 0.1] },
    move: { choices: [0.5, 0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 12, 15] },
  },
  constraint: (p) => exact4(p.n * p.gamma) && exact4(p.move * p.move) && exact4(p.n * p.gamma * p.move * p.move / 2) && p.n * p.gamma * p.move * p.move / 2 >= 0.05,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      bookGamma: round(p.n * p.gamma),
      theta: round(p.n * p.gamma * p.move * p.move / 2),
      moveSq: round(p.move * p.move),
      answer: p.move,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `You run a long-gamma book: ${fmtNum(p.n)} options, each on one share, each with a gamma of ${fmtNum(p.gamma)}. Delta-hedged, the book loses ${fmtNum(d.theta)} dollars a day to time decay. ` +
    `How many dollars must the underlying move today — up or down — for the gamma to pay for the day's theta?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "Rent against convexity", body: `Write $G$ for the book's gamma, $T$ for the day's decay and $x$ for the move. A hedged long-gamma book earns $\\dfrac{1}{2}Gx^{2}$ on a move of $x$ in either direction — the area of the triangle the drifting delta sweeps out — so the day breaks even where $\\dfrac{1}{2}Gx^{2}=T$.` },
    { title: "The book's gamma", body: `Gamma adds across the position: $${fmtNum(p.n)}\\times${fmtNum(p.gamma)}=${fmtNum(d.bookGamma)}$ per dollar of move.` },
    { title: "Solve for the squared move", body: `Twice the decay over the book gamma: $\\dfrac{2\\times${fmtNum(d.theta)}}{${fmtNum(d.bookGamma)}}=${fmtNum(d.moveSq)}$.` },
    { title: "Answer", body: `$\\sqrt{${fmtNum(d.moveSq)}}=${fmtNum(d.answer)}$ dollars, up or down. Anything less and the day is a net loss; anything more and the book is ahead.` },
    { title: "Sanity check", body: `At that move the gamma earns $\\dfrac{1}{2}\\times${fmtNum(d.bookGamma)}\\times${fmtNum(d.moveSq)}=${fmtNum(d.theta)}$, exactly the theta. Because the P&L is quadratic in the move, a day of half that size covers only a quarter of the decay — a long-gamma book lives on its big days and bleeds through the quiet ones.` },
  ],
  keyInsight: "Theta is the rent a long-gamma book pays for its convexity, and the breakeven move is where a day's rent is covered: the square root of twice theta over gamma. The P&L is quadratic in the move, so the book needs the large days — a move of half the breakeven size pays only a quarter of the decay.",
  commonTrap: "Dividing theta by gamma and stopping, which drops both the factor of two and the square root and gives a number in the wrong units altogether. The move enters squared, so the answer is a root.",
  expectedPaceS: 80,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
