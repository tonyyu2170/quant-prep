import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` must reject draws where the two cofactors share a
// factor, and it never sees `derived`.
const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b));

export const gcdLcmProduct: ProblemTemplate = {
  id: "number-theory/gcd-lcm-product",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.25 }, { firm: "optiver", weight: 0.2 }, { firm: "flow", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the identity that gcd times lcm is the product" },
  params: {
    g: { choices: [2, 3, 4, 5, 6, 7, 8, 9, 12, 15] },
    m: { choices: [3, 4, 5, 7, 8, 9, 11, 13, 16, 25] },
    n: { choices: [2, 3, 5, 7, 9, 11, 13, 17, 19, 23] },
  },
  constraint: (p) => gcdOf(p.m, p.n) === 1 && p.m !== p.n && p.g * p.m * p.n <= 20000,
  derived: (p) => ({
    first: p.g * p.m,
    second: p.g * p.n,
    product: p.g * p.m * p.g * p.n,
    answer: p.g * p.m * p.n,
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `Two whole numbers are ${fmtNum(d.first)} and ${fmtNum(d.second)}. Their greatest common ` +
    `divisor is ${fmtNum(p.g)}. What is their least common multiple?`,
  solution: (p, d) => [
    { title: "Every prime is split between the two", body: `For any prime, one of the two numbers carries at least as many copies as the other. The greatest common divisor takes the smaller count each time and the least common multiple takes the larger — so between them they take every copy exactly once, which is to say their product is the product of the two numbers.` },
    { title: "Multiply the numbers together", body: `That gives $${fmtNum(d.first)}\\times${fmtNum(d.second)}=${fmtNum(d.product)}$.` },
    { title: "Divide out the part they share", body: `The common divisor is ${fmtNum(p.g)}, so the least common multiple is $\\dfrac{${fmtNum(d.product)}}{${fmtNum(p.g)}}=${fmtNum(d.answer)}$. Note this needs no factorisation of either number — the identity does all the work.` },
    { title: "Answer", body: `The least common multiple is ${fmtNum(d.answer)}.` },
    { title: "Sanity check", body: `A common multiple must be at least as large as either number, and this one is: $${fmtNum(d.answer)}>${fmtNum(d.second)}$. It also divides the product exactly, which it must, since the product is a common multiple too — just not the least one unless the two share nothing.` },
  ],
  keyInsight: "The greatest common divisor and the least common multiple take the smaller and the larger power of each prime, so their product is the product of the two numbers whatever those primes are. That identity turns a least common multiple into one division and never requires factoring anything.",
  commonTrap: "Reporting the product itself as the least common multiple, which is only correct when the two numbers share nothing. The other slip is dividing by the common divisor twice, once out of each number, which lands a factor too low.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [],
};
