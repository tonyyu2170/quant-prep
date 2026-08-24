import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// MODS, gcdOf and orderOf are all reached from `constraint`, which needs every one of them:
// the cycle argument only holds when the base is coprime to the modulus, and the draw is
// rejected when the exponent lands exactly on the end of a cycle — that case answers 1 through
// a different sentence and would need a second solution printed from this one template.
const MODS = [7, 9, 11, 13, 17, 19, 21, 23];
const gcdOf = (x: number, y: number): number => (y === 0 ? x : gcdOf(y, x % y));
const orderOf = (a: number, m: number): number => { let k = 1, v = a % m; while (v !== 1) { v = (v * a) % m; k++; } return k; };

export const modularPowerRemainder: ProblemTemplate = {
  id: "brainteasers/modular-power-remainder",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "hrt", weight: 0.25 }, { firm: "citadel", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "last-digit and remainder questions answered by the cycle length of the powers" },
  params: {
    a: { range: { min: 2, max: 12, step: 1 } },
    e: { range: { min: 20, max: 400, step: 1 } },
    mi: { range: { min: 0, max: 7, step: 1 } },
  },
  constraint: (p) => gcdOf(p.a, MODS[p.mi]) === 1 && p.a % MODS[p.mi] !== 1 && p.e % orderOf(p.a, MODS[p.mi]) !== 0,
  derived: (p) => {
    const m = MODS[p.mi];
    const powMod = (base: number, exp: number) => { let r = 1, b = base % m; for (let i = 0; i < exp; i++) r = (r * b) % m; return r; };
    const k = orderOf(p.a, m);
    const r = p.e % k;
    return {
      m, k, r,
      quotient: (p.e - r) / k,
      firstPower: p.a % m,
      secondPower: powMod(p.a, 2),
      answer: powMod(p.a, r),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `What is the remainder when ${fmtNum(p.a)} raised to the power ${fmtNum(p.e)} is divided by ${fmtNum(d.m)}?`,
  solution: (p, d) => [
    {
      title: "The powers cannot keep producing new remainders",
      body: `There are only ${fmtNum(d.m)} possible remainders, so walking up the powers of ${fmtNum(p.a)} must eventually revisit one. Because ${fmtNum(p.a)} shares no factor with ${fmtNum(d.m)}, each step can be undone, so the first remainder to repeat is the one the sequence started from — the powers cycle from the very beginning rather than running into a loop further along.`,
    },
    {
      title: "Find the length of the cycle",
      body: `Multiply by ${fmtNum(p.a)} and reduce, over and over, until the remainder comes back to one. That first happens after ${fmtNum(d.k)} steps, so the pattern of remainders repeats with period ${fmtNum(d.k)}. The first two entries are ${fmtNum(d.firstPower)} and ${fmtNum(d.secondPower)}.`,
    },
    {
      title: "Only the exponent's remainder matters",
      body: `Since the cycle closes every ${fmtNum(d.k)} steps, a block of ${fmtNum(d.k)} multiplications returns the running remainder to where it was and can be discarded whole. Divide the exponent by the period: $${fmtNum(p.e)}=${fmtNum(d.quotient)}\\times${fmtNum(d.k)}+${fmtNum(d.r)}$. The ${fmtNum(d.quotient)} whole cycles change nothing, leaving ${fmtNum(d.r)} steps to walk.`,
    },
    {
      title: "Answer",
      body: `The remainder is the ${fmtNum(d.r)}th entry of the cycle, which is ${fmtNum(d.answer)}. So ${fmtNum(p.a)} to the power ${fmtNum(p.e)} leaves remainder ${fmtNum(d.answer)} on division by ${fmtNum(d.m)}.`,
    },
    {
      title: "Sanity check",
      body: `The period ${fmtNum(d.k)} must divide the count of remainders coprime to ${fmtNum(d.m)}, which is what forces these cycles to be short rather than arbitrary — and it is why ${fmtNum(d.k)} came out well below ${fmtNum(d.m)}. The answer also lies strictly between zero and ${fmtNum(d.m)}, and is never zero, since no power of a number coprime to ${fmtNum(d.m)} can be divisible by it.`,
    },
  ],
  keyInsight: "Powers modulo a fixed number are eventually periodic, and when the base is coprime to the modulus the periodicity reaches all the way back to the first power. That turns an astronomically large exponent into its remainder on division by the cycle length — the only part of the exponent that survives.",
  commonTrap: "Reducing the exponent modulo the modulus itself rather than modulo the cycle length. The two are different numbers and only coincide by accident; the modulus bounds how many remainders exist, while the cycle length says how quickly the powers come back round, and it is usually much smaller.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
