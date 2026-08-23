import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The misere twin of subtraction-game-last-wins. Same moves, opposite terminal rule, and
// the losing positions shift from the multiples of maxTake+1 to one MORE than a multiple —
// which is the whole lesson, and the reason both templates ship rather than one.
export const subtractionGameLastLoses: ProblemTemplate = {
  id: "brainteasers/subtraction-game-last-loses",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "optiver", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "impartial subtraction game under misere play" },
  params: {
    counters: { range: { min: 10, max: 80, step: 1 } },
    maxTake: { range: { min: 2, max: 4, step: 1 } },
  },
  derived: (p) => {
    const period = p.maxTake + 1;
    const rem = p.counters % period;
    const lastSafe = p.counters - rem;
    return {
      period,
      rem,
      lastSafe,
      // Misere: leave the opponent exactly one counter, so the losing positions are the
      // multiples of `period` shifted up by one.
      target: rem === 1 ? lastSafe + 1 : (rem === 0 ? lastSafe - period + 1 : lastSafe + 1),
      answer: rem === 1 ? 2 : 1,   // 1 = Alice (mover), 2 = Bob
    };
  },
  choices: ["Alice", "Bob"],
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `A pile holds ${fmtNum(p.counters)} counters. Alice and Bob take turns removing counters, Alice going first, and on a turn a player may take any number from 1 up to ${fmtNum(p.maxTake)}. ` +
    `Whoever is forced to take the last counter loses. If both play perfectly, who wins?`,
  solution: (p, d) => [
    { title: "Fix what losing means here", body: `The player who takes the last counter loses, so the position to hand your opponent is one counter, not none: from a single counter they must take it and lose. Work backwards from there rather than from an empty pile.` },
    { title: "The losing positions shift by one", body: `A player facing exactly one counter loses. From 2 up to ${fmtNum(d.period)} counters the mover can leave exactly one and win. From ${fmtNum(d.period)} plus one counters every move leaves between 2 and ${fmtNum(d.period)}, each of which lets the opponent leave one — so that position loses. As before the two players' takes pair to ${fmtNum(d.period)} per round, so the losing positions are the multiples of ${fmtNum(d.period)} plus one.` },
    { title: "Locate this pile", body: `Dividing ${fmtNum(p.counters)} by ${fmtNum(d.period)} leaves a remainder of ${fmtNum(d.rem)}.` },
    { title: "Answer", body: d.rem === 1
        ? `A remainder of one is exactly the losing shape, so Alice moves from a lost position: every take lets Bob restore the round to ${fmtNum(d.period)} and hand back another multiple plus one. Bob wins.`
        : `The remainder is not one, so Alice can move to ${fmtNum(d.target)} — a multiple of ${fmtNum(d.period)} plus one — and then answer every take of Bob's by completing the round to ${fmtNum(d.period)}. Alice wins.` },
    { title: "Sanity check", body: `Compare with the normal-play version, where taking the last counter wins and the losing positions are the multiples of ${fmtNum(d.period)} themselves. Flipping the terminal rule shifts the whole ladder up by exactly one counter and nothing else about the game changes, which is why the two answers differ precisely on the piles whose remainder is zero or one.` },
  ],
  keyInsight: "Misere play changes the target and nothing else: you still hand your opponent the periodic dead positions, but the ladder is anchored at one counter instead of none, so every losing position moves up by exactly one.",
  commonTrap: "Carrying the normal-play answer over unchanged and calling multiples of the period losing. Under the last-counter-loses rule those are winning for the mover, and the genuinely lost piles are the ones sitting one above a multiple.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
