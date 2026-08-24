import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` must reject moduli sharing a factor, for which the
// pair of congruences may have no solution at all. `constraint` never sees `derived`.
const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b));

export const crtTwoCongruences: ProblemTemplate = {
  id: "number-theory/crt-two-congruences",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 2,
  firms: [{ firm: "hrt", weight: 0.25 }, { firm: "two-sigma", weight: 0.2 }, { firm: "jump", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the Chinese remainder theorem on two coprime moduli" },
  params: {
    m1: { choices: [3, 4, 5, 7, 8, 9, 11] },
    m2: { choices: [4, 5, 7, 8, 9, 11, 13, 16] },
    r1: { choices: [1, 2, 3, 4, 5, 6] },
    r2: { choices: [1, 2, 3, 4, 5, 6, 7] },
  },
  constraint: (p) => gcdOf(p.m1, p.m2) === 1 && p.r1 < p.m1 && p.r2 < p.m2 && p.m1 * p.m2 >= 20,
  derived: (p) => {
    let n = p.r1;
    while (n % p.m2 !== p.r2) n += p.m1;
    return {
      modulus: p.m1 * p.m2,
      steps: (n - p.r1) / p.m1,
      answer: n,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `A crate of parts is counted twice. Grouped into rows of ${fmtNum(p.m1)} it leaves ` +
    `${fmtNum(p.r1)} over; grouped into rows of ${fmtNum(p.m2)} it leaves ${fmtNum(p.r2)} over. ` +
    `What is the SMALLEST number of parts the crate could hold?`,
  solution: (p, d) => [
    { title: "Satisfy one condition, then walk", body: `Any count leaving ${fmtNum(p.r1)} over in rows of ${fmtNum(p.m1)} looks like ${fmtNum(p.r1)} plus some whole number of ${fmtNum(p.m1)}s. Stepping by ${fmtNum(p.m1)} preserves the first condition exactly, so the search only ever has to check the second.` },
    { title: "Why the walk must succeed", body: `The two row sizes share no factor above one. Stepping by ${fmtNum(p.m1)} therefore cycles through EVERY remainder against ${fmtNum(p.m2)} before repeating any, so the wanted remainder is certain to appear — and to appear exactly once within a stretch of ${fmtNum(d.modulus)}.` },
    { title: "Where it lands", body: `Taking ${fmtNum(d.steps)} steps from ${fmtNum(p.r1)} gives $${fmtNum(p.r1)}+${fmtNum(d.steps)}\\times${fmtNum(p.m1)}=${fmtNum(d.answer)}$.` },
    { title: "Answer", body: `The smallest possible count is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `The solution has to lie below the product of the two row sizes, since the pattern repeats every $${fmtNum(p.m1)}\\times${fmtNum(p.m2)}=${fmtNum(d.modulus)}$: and indeed $${fmtNum(d.answer)}<${fmtNum(d.modulus)}$. Every other valid count is this one plus a whole number of ${fmtNum(d.modulus)}s.` },
  ],
  keyInsight: "Two remainder conditions against sizes sharing no factor pin a count exactly once in every stretch as long as their product, never more often and never less. That is why a pair of independent checksums identifies a record uniquely while either alone does not.",
  commonTrap: "Adding the two remainders, or multiplying them, neither of which respects either condition. The other slip is expecting a solution when the two row sizes share a factor — then the conditions can simply contradict each other.",
  expectedPaceS: 115,
  verify: { method: "brute-force" },
  constants: [1],
};
