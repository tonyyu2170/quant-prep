import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// From deuce the game is a two-state loop: a won pair ends it, a lost pair ends it, a split
// returns to deuce. Conditioning on the deciding pair collapses the whole chain to p^2/(p^2+q^2),
// and with p = w/n that is w^2/(w^2+(n-w)^2) — printed over integers so the chain stays exact.
// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
  const lost = p.pointsPlayed - p.pointsWon;
  const prob = p.pointsWon / p.pointsPlayed;
  const winSq = p.pointsWon * p.pointsWon;
  const lostSq = lost * lost;
  const decided = winSq + lostSq;
  return { lost, prob, lossProb: 1 - prob, winSq, lostSq, decided, answer: winSq / decided, decidedProb: decided / (p.pointsPlayed * p.pointsPlayed), splitProb: (2 * p.pointsWon * lost) / (p.pointsPlayed * p.pointsPlayed) };
};

export const deuceWinByTwo: ProblemTemplate = {
  id: "markov/deuce-win-by-two",
  version: 1,
  topic: "probability/markov",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "original", inspiration: "deuce as a two-state absorbing chain" },
  params: {
    pointsWon: { range: { min: 24, max: 38, step: 1 } },
    pointsPlayed: { range: { min: 55, max: 75, step: 1 } },
  },
  constraint: (p) => p.pointsWon / p.pointsPlayed >= 0.35 && p.pointsWon / p.pointsPlayed <= 0.66 && !complementGrades(derive(p).answer),
  derived: derive,
  statement: (p) =>
    `Across a long practice set, Ana won ${fmtNum(p.pointsWon)} of ${fmtNum(p.pointsPlayed)} points against the same opponent, and points are independent. They reach deuce: the game now goes to whoever first leads by two points. What is the probability Ana takes the game?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Point probability", body: `Ana takes a point with $\\frac{${p.pointsWon}}{${p.pointsPlayed}}=${fmtNum(d.prob)}$, so the opponent takes one with $\\frac{${d.lost}}{${p.pointsPlayed}}=${fmtNum(d.lossProb)}$.` },
    { title: "Play the next two points", body: `From deuce exactly three things can happen over the next pair: Ana wins both and the game is over, the opponent wins both and the game is over, or they split one each and the score is deuce again — the identical position.` },
    { title: "The loop cancels", body: `Because a split returns to the same state, the whole chain collapses: condition on the pair that finally decides it. Splitting has probability $${fmtNum(d.splitProb)}$, and it changes nothing, so only the two deciding pairs matter and their relative weights settle the answer.` },
    { title: "Decide it", body: `The deciding pairs weigh $${p.pointsWon}\\times${p.pointsWon}=${fmtNum(d.winSq)}$ and $${d.lost}\\times${d.lost}=${fmtNum(d.lostSq)}$, so the answer is $\\frac{${d.winSq}}{${d.winSq}+${d.lostSq}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Winning by two rewards the stronger player: a per-point edge is amplified over a game. Here $${fmtNum(d.answer)}$ sits further from a coin flip than the single-point $${fmtNum(d.prob)}$ does.` },
  ],
  keyInsight: "A state that can return to itself contributes nothing to the outcome — condition on the transitions that actually decide it and the loop cancels.",
  commonTrap: "Summing an infinite series of split-then-split-then-win paths. It converges to the same number, but the return-to-self structure makes the series unnecessary.",
  expectedPaceS: 110,
  constants: [2],
  verify: { method: "brute-force" },
};
