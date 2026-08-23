import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The first choice-answer template: `answerKey` names a 1-based index into `choices`
// rather than a quantity. The game is the standard subtraction game under normal play,
// where the losing positions are exactly the multiples of maxTake+1.
export const subtractionGameLastWins: ProblemTemplate = {
  id: "brainteasers/subtraction-game-last-wins",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "impartial subtraction game under normal play" },
  params: {
    counters: { range: { min: 10, max: 80, step: 1 } },
    maxTake: { range: { min: 2, max: 4, step: 1 } },
  },
  derived: (p) => {
    const period = p.maxTake + 1;
    const rem = p.counters % period;
    return {
      period,
      rem,
      lastSafe: p.counters - rem,   // the largest multiple of `period` at or below the pile
      answer: rem === 0 ? 2 : 1,    // 1 = Alice (mover), 2 = Bob
    };
  },
  choices: ["Alice", "Bob"],
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `A pile holds ${fmtNum(p.counters)} counters. Alice and Bob take turns removing counters, Alice going first, and on a turn a player may take any number from 1 up to ${fmtNum(p.maxTake)}. ` +
    `Whoever takes the last counter wins. If both play perfectly, who wins?`,
  solution: (p, d) => [
    { title: "Work backwards from the end", body: `A player who faces an empty pile has already lost, so a position is losing for whoever must move from it exactly when every move leads to a position that is winning for the opponent. Start at zero counters — a loss for the player to move — and walk upward.` },
    { title: "The losing positions repeat", body: `From 1 up to ${fmtNum(p.maxTake)} counters the mover simply takes the pile and wins. From ${fmtNum(d.period)} counters every legal move leaves between 1 and ${fmtNum(p.maxTake)} counters, all of which the opponent then takes — so ${fmtNum(d.period)} is a loss for the mover. Whatever the mover takes, the opponent can always restore the total removed in the round to ${fmtNum(d.period)}, so the losing positions are precisely the multiples of ${fmtNum(d.period)}.` },
    { title: "Locate this pile", body: `Divide: ${fmtNum(p.counters)} leaves a remainder of ${fmtNum(d.rem)} above ${fmtNum(d.lastSafe)}, which is a multiple of ${fmtNum(d.period)}.` },
    { title: "Answer", body: d.rem === 0
        ? `The pile is already a multiple of ${fmtNum(d.period)}, so Alice moves from a losing position: whatever she takes, Bob completes the round to ${fmtNum(d.period)} and hands her the next multiple. Bob wins.`
        : `The remainder is not zero, so Alice takes ${fmtNum(d.rem)} counters, leaving ${fmtNum(d.lastSafe)} — a multiple of ${fmtNum(d.period)} — and then mirrors Bob to keep him on multiples. Alice wins.` },
    { title: "Sanity check", body: `Test the rule at the smallest interesting pile. With exactly ${fmtNum(d.period)} counters the mover must leave between 1 and ${fmtNum(p.maxTake)}, all of which lose immediately, so the mover loses — matching the claim that multiples of ${fmtNum(d.period)} are the losing positions.` },
  ],
  keyInsight: "In a take-away game the mover wants to hand over a position from which every reply is answerable, and when a turn removes between one and a fixed cap the two players' moves can always be paired to a constant total — so the losing positions sit one period apart and the whole game reduces to a remainder.",
  commonTrap: "Reading the cap as the period. The positions repeat every cap-plus-one counters, not every cap, because the responder answers a take of j with a take that completes the round rather than mirroring j.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [1],
};
