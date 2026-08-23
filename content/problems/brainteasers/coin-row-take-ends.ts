import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The two-colour strategy: with an even row, the first player can decide at the outset to take
// only odd-position coins or only even-position coins, and force it. That bound is not merely
// a bound on this row shape — checked by exhaustive game-tree search against every legal draw,
// the optimal play value equals it exactly (see verification/solvers/brainteasers.py).
export const coinRowTakeEnds: ProblemTemplate = {
  id: "brainteasers/coin-row-take-ends",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "optiver", weight: 0.2 }, { firm: "drw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "take-from-either-end coin row under the odd/even pairing strategy" },
  params: {
    n: { range: { min: 6, max: 16, step: 2 } },
    v: { range: { min: 2, max: 20, step: 1 } },
    d: { range: { min: -6, max: 6, step: 1 } },
  },
  constraint: (p) => p.d !== 0 && p.v + (p.n - 1) * p.d > 0,
  derived: (p) => {
    let odd = 0, even = 0;
    for (let i = 0; i < p.n; i++) (i % 2 === 0 ? (odd += p.v + i * p.d) : (even += p.v + i * p.d));
    return {
      last: p.v + (p.n - 1) * p.d,
      second: p.v + p.d,
      half: p.n / 2,
      odd, even,
      total: odd + even,
      gap: Math.abs(even - odd),
      answer: Math.max(odd, even),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `${fmtNum(p.n)} coins lie in a row. Reading from the left, the first is worth ${fmtNum(p.v)}, the second ${fmtNum(d.second)}, and each coin after that is worth ${fmtNum(Math.abs(p.d))} ${p.d > 0 ? "more" : "less"} than the one before it, ending at ${fmtNum(d.last)} for the rightmost coin. ` +
    `Alice and Bob take turns removing a coin, Alice first, and on a turn a player must take whichever coin is currently at the left end or the right end of the row. Each keeps what they take. ` +
    `Both play to maximise their own total. How much does Alice end up with?`,
  solution: (p, d) => [
    { title: "Split the row by position, not by value", body: `Number the coins by where they sit, ${fmtNum(1)} through ${fmtNum(p.n)} from the left. The odd positions hold a total of ${fmtNum(d.odd)} and the even positions hold ${fmtNum(d.even)}; together $${fmtNum(d.odd)}+${fmtNum(d.even)}=${fmtNum(d.total)}$, the whole row.` },
    { title: "Alice can force either class she likes", body: `The row has an even length, so the two ends always sit at opposite positions — one odd, one even. Alice picks a class at the start and takes an end of that class; whatever Bob then takes from either end, the two new ends are again one of each class, so Alice can take her class again. Repeating this for all ${fmtNum(d.half)} of her turns, she collects every coin of the class she chose.` },
    { title: "So she chooses the heavier class", body: `Comparing the two totals, ${fmtNum(d.odd)} for the odd positions against ${fmtNum(d.even)} for the even ones, Alice takes the larger and leaves Bob the rest. Bob cannot do better than the remainder, since the two classes exhaust the row.` },
    { title: "Answer", body: `Alice secures ${fmtNum(d.answer)}, leaving Bob $${fmtNum(d.total)}-${fmtNum(d.answer)}=${fmtNum(d.total - d.answer)}$.` },
    { title: "Sanity check", body: `The gap between the classes is not an accident of these numbers: each even-position coin sits exactly one step of ${fmtNum(Math.abs(p.d))} from the odd-position coin on its left, and there are ${fmtNum(d.half)} such pairs, so the two classes are always ${fmtNum(d.gap)} apart — ${p.d > 0 ? "the even positions ahead when the row rises" : "the odd positions ahead when the row falls"}, and Alice takes the leader.` },
  ],
  keyInsight: "A game on a line with an even number of tokens has a hidden pairing: the two ends are always opposite members of an alternating split, so the first player can commit to one half of the split and be handed it. Look for a partition the opponent's moves cannot break rather than for the best immediate grab.",
  commonTrap: "Playing greedily and taking the larger end each turn. That hands the opponent the choice of which class stays available, and on a row that rises steadily towards one end it can cost the whole gap between the two classes.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  constants: [1],
};
