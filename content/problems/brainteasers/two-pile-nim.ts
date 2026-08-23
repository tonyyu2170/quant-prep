import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two-pile Nim: the mirroring argument in its cleanest form. Piles are drawn as a base and
// a signed offset rather than independently, so equal piles — the whole point — occur on a
// fifth of the legal space instead of vanishing into the corner of a product grid.
export const twoPileNim: ProblemTemplate = {
  id: "brainteasers/two-pile-nim",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "two-pile Nim decided by the mirroring strategy" },
  params: {
    base: { range: { min: 3, max: 40, step: 1 } },
    offset: { range: { min: -2, max: 2, step: 1 } },
  },
  derived: (p) => {
    const other = p.base + p.offset;
    const gap = Math.abs(p.base - other);
    const smaller = Math.min(p.base, other);
    const larger = Math.max(p.base, other);
    return {
      other,
      gap,
      smaller,
      larger,
      total: p.base + other,
      answer: gap === 0 ? 2 : 1,   // 1 = Alice (mover), 2 = Bob
    };
  },
  choices: ["Alice", "Bob"],
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `Two piles sit on a table, one of ${fmtNum(p.base)} stones and one of ${fmtNum(d.other)}. Alice and Bob take turns, Alice going first, and on a turn a player picks one pile and removes any number of stones from it — at least one, up to the whole pile. ` +
    `Whoever takes the last stone wins. If both play perfectly, who wins?`,
  solution: (p, d) => [
    { title: "Find the positions that lose", body: `A player facing two empty piles has lost. Ask which positions are dead for whoever must move: the answer is the balanced ones, where both piles hold the same number of stones.` },
    { title: "Why balanced positions are lost", body: `From equal piles any move unbalances them, because a turn touches only one pile. The opponent then copies that move in the other pile and restores equality. Each round strips stones while keeping the piles level, so the copier eventually takes the last stone and the player who first faced equal piles never escapes.` },
    { title: "Locate this position", body: d.gap === 0
        ? `Both piles hold ${fmtNum(d.smaller)} stones, so the position is already balanced.`
        : `The piles differ: ${fmtNum(d.larger)} against ${fmtNum(d.smaller)}, a gap of ${fmtNum(d.gap)} stones.` },
    { title: "Answer", body: d.gap === 0
        ? `Alice must move from a balanced position, so whatever she does Bob mirrors it and stays balanced until he takes the last stone. Bob wins.`
        : `Alice removes ${fmtNum(d.gap)} stones from the pile of ${fmtNum(d.larger)}, leaving ${fmtNum(d.smaller)} in each. Bob now faces the balanced position, and Alice mirrors him from there on. Alice wins.` },
    { title: "Sanity check", body: `Count parity as a cross-check on the balanced case. When the piles are equal the total ${fmtNum(d.total)} is even, and the mirroring strategy removes stones in matched pairs, so the stones are taken in an even number of moves — the second player takes the last one, which is what the argument claims.` },
  ],
  keyInsight: "A move that can touch only one pile can never preserve equality, so equal piles are exactly the positions that lose: the responder's copying strategy is available from them and unavailable to the player who has to break the balance first.",
  commonTrap: "Judging the position by how many stones are on the table rather than by the gap between the piles. Totals decide nothing here — a large even total is a win for the mover whenever the piles are unequal, and a loss whenever they are not.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [1],
};
