import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Bulb k is toggled once per divisor of k, so it ends on exactly when k has an odd number of
// divisors — that is, exactly when k is a perfect square. The count is floor(sqrt(n)).
export const lightSwitchesLeftOn: ProblemTemplate = {
  id: "brainteasers/light-switches-left-on",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "sig", weight: 0.3 }, { firm: "hrt", weight: 0.25 }],
  source: { kind: "textbook", inspiration: "the locker/bulb toggling problem" },
  params: {
    bulbs: { range: { min: 100, max: 5000, step: 10 } },
  },
  derived: (p) => {
    const root = Math.floor(Math.sqrt(p.bulbs));
    return { root, answer: root, square: root * root, nextSquare: (root + 1) * (root + 1), nextRoot: root + 1 };
  },
  statement: (p) =>
    `${fmtNum(p.bulbs)} bulbs stand in a row, all switched off, numbered 1 to ${fmtNum(p.bulbs)}. You make ${fmtNum(p.bulbs)} passes along the row. On pass $k$ you flip the switch of every bulb whose number is a multiple of $k$. After the final pass, how many bulbs are lit?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Count the flips per bulb", body: `Bulb number $k$ is flipped on pass $j$ exactly when $j$ divides $k$. So a bulb is flipped once for each of its divisors, and nothing else about the ordering matters.` },
    { title: "Odd flips leave it on", body: `Every bulb starts off, so a bulb finishes lit precisely when its divisor count is odd.` },
    { title: "Which numbers have an odd divisor count", body: `Divisors normally pair up — $j$ with $k/j$ — leaving an even count. The pairing fails only when $j$ equals $k/j$, which happens exactly for perfect squares.` },
    { title: "Count the squares", body: `So the lit bulbs are the perfect squares up to ${fmtNum(p.bulbs)}. Since $${d.root}\\times${d.root}=${fmtNum(d.square)}$ and $${d.nextRoot}\\times${d.nextRoot}=${fmtNum(d.nextSquare)}$, the count is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The answer grows like a square root, not like the row: ten times the bulbs gives only about three times the lit ones.` },
  ],
  keyInsight: "Recast a process question as a counting question about each item: the answer is 'how many numbers have an odd divisor count', and divisor pairing settles that immediately.",
  commonTrap: "Simulating the passes and losing the structure. The pairing argument gives the answer without a single flip being traced.",
  expectedPaceS: 140,
  constants: [1],
  verify: { method: "brute-force" },
};
