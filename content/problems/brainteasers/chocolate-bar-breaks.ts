import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// An invariant game rather than a position game: no player has a choice that matters, because
// every legal move changes the piece count by the same amount. The whole question is the
// parity of a number neither player can influence.
export const chocolateBarBreaks: ProblemTemplate = {
  id: "brainteasers/chocolate-bar-breaks",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "optiver", weight: 0.25 }, { firm: "imc", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "invariant-parity break game on a scored grid" },
  params: {
    rows: { range: { min: 3, max: 12, step: 1 } },
    cols: { range: { min: 3, max: 12, step: 1 } },
    pieces: { range: { min: 1, max: 6, step: 1 } },
  },
  derived: (p) => {
    const squares = p.rows * p.cols;
    const snaps = squares - p.pieces;   // every snap adds exactly one piece, so this is fixed
    return { squares, snaps, answer: snaps % 2 === 1 ? 1 : 2 };  // 1 = Alice (mover), 2 = Bob
  },
  choices: ["Alice", "Bob"],
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A chocolate bar is scored into ${fmtNum(p.rows)} rows and ${fmtNum(p.cols)} columns of squares. ` +
    (p.pieces === 1
      ? `It is still whole, all ${fmtNum(d.squares)} squares of it. `
      : `Careless handling has already snapped it into ${fmtNum(p.pieces)} pieces, together still holding all ${fmtNum(d.squares)} squares. `) +
    `Alice and Bob now alternate, Alice first: a turn picks up one piece and snaps it along a single scored line, straight across, into two pieces. ` +
    `A player who cannot move loses. With perfect play, who wins?`,
  solution: (p, d) => [
    { title: "Count the moves, not the positions", body: `A snap replaces one piece by two, so the number of pieces on the table goes up by exactly one — whichever piece is chosen, whichever line is used, however lopsided the split. Nothing either player does changes that.` },
    { title: "The game has a fixed length", body: `Play begins at ${p.pieces === 1 ? "a single piece" : `${fmtNum(p.pieces)} pieces`} and can only end when every piece is a single square, which is ${fmtNum(d.squares)} pieces. Going up by one each turn, that takes exactly ${fmtNum(d.squares)} minus ${fmtNum(p.pieces)}, or $${fmtNum(d.squares)}-${fmtNum(p.pieces)}=${fmtNum(d.snaps)}$ snaps — the same number on every line of play, so there is no strategy to find.` },
    { title: "Read off the parity", body: `Alice takes the odd-numbered snaps and Bob the even-numbered ones. Since the total is ${fmtNum(d.snaps)}, the player who makes the last snap is Alice when that total is odd and Bob when it is even, and the other player then faces a table of single squares with no move.` },
    { title: "Answer", body: d.snaps % 2 === 1
        ? `${fmtNum(d.snaps)} is odd, so Alice makes the final snap and Bob is left unable to move. Alice wins.`
        : `${fmtNum(d.snaps)} is even, so Bob makes the final snap and Alice is left unable to move. Bob wins.` },
    { title: "Sanity check", body: `Try the smallest bar of all, two squares in a single row and unbroken: exactly one snap exists, the mover takes it, and the opponent loses — matching the rule that an odd snap count hands the win to whoever moves first.` },
  ],
  keyInsight: "When every legal move changes the same quantity by the same amount, the length of the game is settled before anyone moves and the only question left is whose turn the last move falls on. Look for a count that no choice can influence before looking for a strategy.",
  commonTrap: "Hunting for a clever way to snap. The shape of the pieces, the sizes of the splits and the order of play are all irrelevant here — a player trying to leave a good position cannot, because every position after the same number of snaps is equally good.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [],
};
