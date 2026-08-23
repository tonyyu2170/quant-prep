import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Three-pile Nim, asked as "what is the move" rather than "who wins" — the two-pile template
// already covers the winner, and a numeric answer is where the XOR rule earns its keep.
//
// The binary renderings live in `derived` as ordinary numbers whose decimal digits happen to
// be the binary ones. That is deliberate: verification/emit.ts requires every digit run in the
// prose to trace to a param, a derived value or a declared constant, and a binary string
// printed inline is a digit run like any other. Putting them in `derived` also puts them under
// the Python double-entry check rather than outside it.
//
// The parameter ranges make the position well-posed structurally, with no constraint needed:
// the two small piles are at most 15 so their XOR is at most 15, while the large pile is at
// least 16. So the large pile is the unique largest, the XOR of the other two is strictly
// below it (hence the reducing move is legal), and the total XOR is never zero (hence Alice
// really does have a winning move).
export const nimThreePileMove: ProblemTemplate = {
  id: "brainteasers/nim-three-pile-move",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "sig", weight: 0.25 }, { firm: "citadel-securities", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "Bouton's theorem for three-pile Nim under normal play" },
  params: {
    big: { range: { min: 16, max: 40, step: 1 } },
    mid: { range: { min: 1, max: 15, step: 1 } },
    small: { range: { min: 1, max: 15, step: 1 } },
  },
  derived: (p) => {
    // Local rather than module-level: registry.test.ts licenses a module-level helper only
    // where `constraint` reaches it, and this template needs no constraint.
    const bin = (n: number) => Number(n.toString(2));
    const balance = p.mid ^ p.small;          // what the big pile must be cut down to
    return {
      balance,
      binBig: bin(p.big), binMid: bin(p.mid), binSmall: bin(p.small), binBalance: bin(balance),
      total: p.big + p.mid + p.small,
      answer: p.big - balance,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `Three piles of counters sit on a table, holding ${fmtNum(p.big)}, ${fmtNum(p.mid)} and ${fmtNum(p.small)} counters, ${fmtNum(d.total)} in all. ` +
    `Alice and Bob take turns, Alice first, and a turn removes any number of counters — at least one, at most the whole pile — from a single pile of the player's choosing. Whoever takes the last counter on the table wins. ` +
    `Alice can force a win, and she does it by removing counters from the largest pile. How many counters does she remove?`,
  solution: (p, d) => [
    { title: "Line the piles up in binary", body: `Write each pile in base two: ${fmtNum(p.big)} is ${fmtNum(d.binBig)}, ${fmtNum(p.mid)} is ${fmtNum(d.binMid)}, and ${fmtNum(p.small)} is ${fmtNum(d.binSmall)}. Stack them so the columns line up by place value, and count the ones in each column.` },
    { title: "The losing positions are the balanced ones", body: `Call a position balanced when every column holds an even number of ones. From a balanced position any move must change some pile, which flips at least one of that pile's columns and leaves the position unbalanced. From an unbalanced position the mover can always restore balance, by working on the pile that carries a one in the highest odd column and rewriting the rest of it to match. So the player handed a balanced position keeps being handed one and eventually is handed all-empty, which is balanced and has no move left — that player loses.` },
    { title: "Find the balance point for the largest pile", body: `Alice wants to leave the two smaller piles as they are and cut the largest down until the position balances. Column by column, the largest pile must end up holding a one exactly where ${fmtNum(p.mid)} and ${fmtNum(p.small)} disagree, which is ${fmtNum(d.binBalance)} in binary, or ${fmtNum(d.balance)} counters.` },
    { title: "Answer", body: `Cutting the pile of ${fmtNum(p.big)} down to ${fmtNum(d.balance)} means removing $${fmtNum(p.big)}-${fmtNum(d.balance)}=${fmtNum(d.answer)}$ counters, and it is a legal move because ${fmtNum(d.balance)} is below ${fmtNum(p.big)}.` },
    { title: "Sanity check", body: `Verify the target is balanced: the two smaller piles together already cover each column an even number of times wherever they agree, and the leftover columns — the ones where they disagree — are exactly the ones the new largest pile of ${fmtNum(d.balance)} now covers, taking every column back to even.` },
  ],
  keyInsight: "A game that splits into independent parts is governed by a single number that combines them, and for Nim that number is the column-by-column parity of the piles written in binary. Balanced positions are the ones you want to hand over, so every winning move is the arithmetic of restoring balance rather than a search.",
  commonTrap: "Reaching for the largest pile and emptying it, or evening up the two biggest piles by eye. Either is right only by accident: the target size is fixed by the parity of the other piles' binary columns, and matching sizes matters only in the two-pile case where that parity test happens to reduce to equality.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [],
};
