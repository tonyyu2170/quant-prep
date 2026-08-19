import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper, and no `constraint` at all: constraint 2 licenses a helper
// only where a floor has to be pinned against the answer, and this floor cannot bind — the
// smallest game on the board is a two dollar stake over four rounds: enumerated over the
// legal space |answer| runs [6, 255]. Every combination of cap and stake is a legal problem,
// so a rule here would reject nothing and read as a check that is not one.
// The truncated doubling game, valued a rung at a time. Every chain is an integer over an
// integer, or a value that lands on an exact half and so survives printing: the stake is whole
// and the ladder is a whole number of half-stakes. The cap is held at fifteen rounds so the
// all-heads branch's chance stays above the emitter's 1e-6 floor and its pot stays inside the
// decimal-safe window.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const truncatedDoublingGame: ProblemTemplate = {
  id: "ev-variance/truncated-doubling-game",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "the St. Petersburg game with the house capping the number of doublings" },
  params: {
    rounds: { range: { min: 4, max: 15, step: 1 } },
    stake: { range: { min: 2, max: 30, step: 1 } },
  },
  derived: (p) => {
    const potMult = Math.pow(2, p.rounds);
    return {
      potMult,
      maxPay: p.stake * potMult,
      pAll: 1 / potMult,
      half: p.stake / 2,
      ladder: (p.rounds * p.stake) / 2,
      evShorter: ((p.rounds + 1) * p.stake) / 2,
      ev: ((p.rounds + 2) * p.stake) / 2,
    };
  },
  statement: (p) =>
    `A pot starts at ${fmtNum(p.stake)} dollars and a fair coin is flipped. Every head doubles the pot and the game carries ` +
    `on; the first tail ends the game and hands you the pot as it stands. The house also caps the game at ${fmtNum(p.rounds)} ` +
    `flips: if the coin comes up heads on all of them, the game stops there and you take the pot anyway. What is the game ` +
    `worth to you, in dollars, before the first flip?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "One rung of the ladder", body: `Take the rounds one at a time. Reaching any particular round at all takes a run of heads, and each head that gets you there halves the chance while doubling the pot waiting for you. Those two moves cancel exactly, so every round contributes the same amount to the value — half the starting stake, $\\frac{${fmtNum(p.stake)}}{2}=${fmtNum(d.half)}$ ${d.half === 1 ? "dollar" : "dollars"} — no matter how far down the ladder it sits.` },
    { title: "Add the rungs", body: `There are ${fmtNum(p.rounds)} rounds in which a tail can arrive and end the game, each worth that same half stake, so together they carry $\\frac{${fmtNum(p.rounds)}\\times${fmtNum(p.stake)}}{2}=${fmtNum(d.ladder)}$ dollars.` },
    // The all-heads branch is priced from the integers rather than from the printed chance:
    // at fifteen rounds that chance prints as 0.00003052, and multiplying it by the pot misses
    // the printed contribution.
    { title: "The branch that runs the whole way", body: `One branch never meets a tail. It happens with probability $\\frac{1}{${fmtNum(d.potMult)}}=${fmtNum(d.pAll)}$ and pays the fully doubled pot of $${fmtNum(p.stake)}\\times${fmtNum(d.potMult)}=${fmtNum(d.maxPay)}$ dollars, so it contributes $\\frac{${fmtNum(d.maxPay)}}{${fmtNum(d.potMult)}}=${fmtNum(p.stake)}$ dollars — one whole stake, and the cap is what turns that branch from an unbounded tail into a single term.` },
    { title: "Total", body: `Add the ladder and that last branch: $\\frac{${fmtNum(p.rounds)}\\times${fmtNum(p.stake)}+2\\times${fmtNum(p.stake)}}{2}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Value the same game with the cap one round shorter and it comes to $\\frac{(${fmtNum(p.rounds)}-1)\\times${fmtNum(p.stake)}+2\\times${fmtNum(p.stake)}}{2}=${fmtNum(d.evShorter)}$ dollars, so buying the extra round adds $${fmtNum(d.evShorter)}+\\frac{${fmtNum(p.stake)}}{2}=${fmtNum(d.ev)}$ — exactly the half stake the ladder says a round is worth, which is the whole argument checked from the other end. And the size of the pot is no guide to the value: $${fmtNum(p.stake)}<${fmtNum(d.ev)}<${fmtNum(d.maxPay)}$ dollars puts the answer above the bare stake you collect half the time and far below the pot the lucky branch pays.` },
  ],
  keyInsight: "Doubling a prize while halving its chance leaves what that branch contributes untouched, so the rungs of this ladder are all the same height and the value grows by a fixed amount per round rather than by a factor. The branch where the coin never fails is worth exactly one stake however long the game is allowed to run, which is why lifting the cap moves the answer only in a straight line — and why the uncapped game has no finite value at all.",
  commonTrap: "Reading the doubling as compounding value, and quoting something near the biggest pot because the pot is what grows. What grows with it is how unlikely that pot is, in exactly the same proportion, so the enormous payout contributes no more to the answer than the very first round does.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  // 1 is the numerator of the all-heads chance and the round taken off in the Sanity check; 2
  // is the doubling, the halving, and the stake the last branch is worth.
  constants: [1, 2],
};
