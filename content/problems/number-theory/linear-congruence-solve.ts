import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` must reject multipliers sharing a factor with the
// modulus, for which no inverse exists. `constraint` never sees `derived`.
const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b));
// Hoisted for the last two conjuncts. BOTH slips this template's prose names were live before
// them (tools/trap-audit.ts): dividing the target by the multiplier landed on the answer for
// 150 of 711 draws, and reporting the inverse unapplied for 74 — every r = 1 draw, where
// (inverse * 1) mod m IS the inverse. `constraint` cannot see `derived`, so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
  let inverse = 1;
  while ((p.a * inverse) % p.m !== 1) inverse++;
  // No zero branch is needed and none is written: the modulus shares no factor with either
  // the inverse or r, and r is strictly between 0 and m, so the product is never a multiple
  // of m. A `x === 0 ? m : x` guard here would be dead code pretending to be care.
  return { inverse, product: p.a * inverse, raw: inverse * p.r, answer: (inverse * p.r) % p.m };
};

export const linearCongruenceSolve: ProblemTemplate = {
  id: "number-theory/linear-congruence-solve",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "citadel", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "inverting a multiplier modulo a prime" },
  params: {
    a: { choices: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12] },
    m: { choices: [7, 11, 13, 17, 19, 23, 29, 31] },
    r: { choices: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12] },
  },
  constraint: (p) => gcdOf(p.a, p.m) === 1 && p.r < p.m && p.a < p.m && derive(p).answer !== p.r / p.a && derive(p).answer !== derive(p).inverse,
  derived: derive,
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `Working with remainders after division by ${fmtNum(p.m)}, find the whole number $x$ between ` +
    `1 and ${fmtNum(p.m)} for which ${fmtNum(p.a)} times $x$ leaves a remainder of ${fmtNum(p.r)}.`,
  solution: (p, d) => [
    { title: "Undo the multiplication rather than search", body: `Multiplying by $a$ can be undone whenever $a$ and the divisor share no factor above one: there is then a number that multiplies $a$ back to a remainder of one, and applying it turns the problem into a single multiplication. That number is what does all the work.` },
    { title: "Find what undoes the multiplier", body: `Here $${fmtNum(p.a)}\\times${fmtNum(d.inverse)}=${fmtNum(d.product)}$, which is one more than a whole number of ${fmtNum(p.m)}s — so ${fmtNum(d.inverse)} is the multiplier that undoes ${fmtNum(p.a)}.` },
    { title: "Apply it to the target", body: `Multiplying the wanted remainder by it gives $${fmtNum(d.inverse)}\\times${fmtNum(p.r)}=${fmtNum(d.raw)}$, and reducing that by whole ${fmtNum(p.m)}s leaves ${fmtNum(d.answer)}.` },
    { title: "Answer", body: `The solution is $x=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The answer is a genuine remainder, so it must fall strictly below the divisor: $${fmtNum(d.answer)}<${fmtNum(p.m)}$. Multiplying back, ${fmtNum(p.a)} times ${fmtNum(d.answer)} does leave ${fmtNum(p.r)}. Note there is exactly ONE solution here — a multiplier sharing a factor with the divisor would give either none at all or several.` },
  ],
  keyInsight: "Multiplication modulo a number is reversible exactly when the multiplier shares no factor with it, and then the inverse is unique. Everything from RSA to a hash table's stride depends on that condition, and it fails silently the moment the two share a factor.",
  commonTrap: "Dividing the target by the multiplier as if these were ordinary numbers, which usually leaves no whole number at all. The other slip is stopping at the inverse and reporting it instead of applying it to the target.",
  expectedPaceS: 150,
  verify: { method: "brute-force" },
  constants: [1],
};
