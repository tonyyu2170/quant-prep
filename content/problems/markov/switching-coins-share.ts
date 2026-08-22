import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// A chain whose states are WHICH COIN is in hand. Balance gives (1-b)/((1-a)+(1-b)); in integer
// percents that is (100-b)/(200-a-b), so every printed chain stays exact.
export const switchingCoinsShare: ProblemTemplate = {
  id: "markov/switching-coins-share",
  version: 1,
  topic: "probability/markov",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "two-sigma", weight: 0.25 }, { firm: "de-shaw", weight: 0.25 }],
  source: { kind: "original", inspiration: "state = which biased coin is in hand" },
  params: {
    headsAPct: { range: { min: 20, max: 80, step: 2 } },
    headsBPct: { range: { min: 15, max: 85, step: 2 } },
  },
  constraint: (p) => p.headsAPct !== p.headsBPct,
  derived: (p) => {
    const tailsA = 100 - p.headsAPct;
    const tailsB = 100 - p.headsBPct;
    const total = tailsA + tailsB;
    return { tailsA, tailsB, total, headsARate: p.headsAPct / 100, headsBRate: p.headsBPct / 100, tailsARate: tailsA / 100, tailsBRate: tailsB / 100, answer: tailsB / total, shareB: tailsA / total };
  },
  statement: (p, d) =>
    `You hold two coins. Coin A lands heads with probability ${fmtNum(d.headsARate)}; coin B lands heads with probability ${fmtNum(d.headsBRate)}. You flip whichever coin is in your hand: on heads you keep it, on tails you swap to the other. Over a very long run of flips, what fraction are made with coin A?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "The state is the coin", body: `Nothing about the flip history matters except which coin is in hand right now, so this is a two-state chain on the coins themselves.` },
    { title: "When does the state change", body: `A swap happens exactly on tails. Coin A is put down with probability $\\frac{${d.tailsA}}{100}=${fmtNum(d.tailsARate)}$ and coin B with probability $\\frac{${d.tailsB}}{100}=${fmtNum(d.tailsBRate)}$.` },
    { title: "Balance the swaps", body: `In the long run, swaps out of A must match swaps out of B. So the shares are inversely proportional to the tail probabilities: whichever coin is harder to put down is held more often.` },
    { title: "Solve", body: `Coin A's share is therefore $\\frac{${d.tailsB}}{${d.tailsA}+${d.tailsB}}=${fmtNum(d.answer)}$, and coin B takes the remaining $\\frac{${d.tailsA}}{${d.total}}=${fmtNum(d.shareB)}$.` },
    { title: "Sanity check", body: `The heads-heavier coin sticks in your hand longer. Coin ${p.headsAPct > p.headsBPct ? "A" : "B"} is the heads-heavier one here, and it is indeed the one holding the larger share.` },
  ],
  keyInsight: "Choose the state so the process is memoryless — here 'which coin is in hand' does it, and the long-run shares fall out of a single balance equation.",
  commonTrap: "Weighting the shares by the heads probabilities directly. It is the tails — the swap events — that move the chain, so the shares go inversely with them.",
  expectedPaceS: 140,
  constants: [100],
  verify: { method: "brute-force" },
};
