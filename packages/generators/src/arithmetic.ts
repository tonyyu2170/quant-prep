import { pick, randInt, type Item, type Rng } from "@qp/engine";

export const ARITH_OPS = ["add", "sub", "mul", "div", "pct", "dec"] as const;
export type ArithOp = (typeof ARITH_OPS)[number];

// Difficulty tunes operand sizes, mirroring how the real tests ramp.
// div bounds come from 515 played QuantProf Zetamac questions (their divisors reach 98 at hard;
// ours used to stop at 19). docs/research/quantprof-2026-08/zetamac.txt
const RANGES: Record<1 | 2 | 3, { small: [number, number]; big: [number, number]; mul: [number, number]; div: [number, number] }> = {
  1: { small: [2, 30], big: [11, 99], mul: [2, 12], div: [3, 12] },
  2: { small: [11, 99], big: [101, 999], mul: [11, 29], div: [3, 49] },
  3: { small: [21, 99], big: [101, 999], mul: [31, 99], div: [12, 99] },
};

export function arithmeticItem(rng: Rng, difficulty: 1 | 2 | 3): Item {
  const r = RANGES[difficulty];
  const op = pick(rng, ARITH_OPS);
  let a: number, b: number, answer: number, prompt: string;
  // Every branch consumes exactly 3 rng draws (op pick + 2 operand draws) — keeps seed replay stream-aligned.
  switch (op) {
    case "add":
      a = randInt(rng, ...r.big); b = randInt(rng, ...r.big);
      answer = a + b; prompt = `${a} + ${b}`; break;
    case "sub":
      a = randInt(rng, ...r.big); b = randInt(rng, ...r.big);
      if (b > a) [a, b] = [b, a];
      answer = a - b; prompt = `${a} − ${b}`; break;
    case "mul":
      a = randInt(rng, ...r.mul); b = randInt(rng, ...r.mul);
      answer = a * b; prompt = `${a} × ${b}`; break;
    case "div": {
      b = randInt(rng, ...r.div);
      const q = randInt(rng, ...r.small);
      a = b * q; answer = q; prompt = `${a} ÷ ${b}`; break;
    }
    case "pct":
      a = pick(rng, difficulty === 1 ? [10, 25, 50] : [5, 15, 20, 35, 40, 60, 75, 85]);
      b = randInt(rng, 2, difficulty === 3 ? 96 : 40) * 10;
      answer = Math.round(a * b) / 100; prompt = `${a}% of ${b}`; break;
    case "dec":
      a = randInt(rng, 2, difficulty === 3 ? 99 : 40) / 10;
      b = randInt(rng, 2, 9);
      answer = Math.round(a * b * 100) / 100; prompt = `${a} × ${b}`; break;
  }
  return { id: `arith-${op}-${a}-${b}`, topic: "arithmetic", prompt, answer, meta: { op, a, b } };
}
