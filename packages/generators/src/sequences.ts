import { pick, randInt, type Item, type Rng } from "@qp/engine";

export const SEQ_FAMILIES = [
  "arithmetic", "geometric", "quadratic", "interleaved",
  "recur-linear", "fiblike", "alt-ops", "squares-offset",
] as const;
export type SeqFamily = (typeof SEQ_FAMILIES)[number];

function build(rng: Rng, family: SeqFamily, difficulty: 1 | 2 | 3): { terms: number[]; answer: number; rule: string; extra?: Record<string, number> } {
  const n = difficulty === 1 ? 5 : 6; // shown terms
  // Per (family, difficulty) the number of rng draws is fixed — changing a family's draw count breaks seed replay.
  switch (family) {
    case "arithmetic": {
      const start = randInt(rng, -20, 60), d = randInt(rng, 2, difficulty * 9);
      const terms = Array.from({ length: n }, (_, i) => start + i * d);
      return { terms, answer: start + n * d, rule: `Arithmetic: +${d} each step` };
    }
    case "geometric": {
      const start = randInt(rng, 1, 6), r = randInt(rng, 2, difficulty === 3 ? 4 : 3);
      const terms = Array.from({ length: n }, (_, i) => start * r ** i);
      return { terms, answer: start * r ** n, rule: `Geometric: ×${r} each step` };
    }
    case "quadratic": {
      const a = randInt(rng, 1, difficulty), b = randInt(rng, -3, 6), c = randInt(rng, -5, 10);
      const f = (i: number) => a * i * i + b * i + c;
      const terms = Array.from({ length: n }, (_, i) => f(i + 1));
      return { terms, answer: f(n + 1), rule: `Second differences constant (+${2 * a})` };
    }
    case "interleaved": {
      const s1 = randInt(rng, 1, 30), d1 = randInt(rng, 2, 9);
      const s2 = randInt(rng, 40, 90), d2 = -randInt(rng, 2, 9);
      const terms = Array.from({ length: n }, (_, i) => (i % 2 === 0 ? s1 + (i / 2) * d1 : s2 + ((i - 1) / 2) * d2));
      const answer = n % 2 === 0 ? s1 + (n / 2) * d1 : s2 + ((n - 1) / 2) * d2;
      return { terms, answer, rule: `Two interleaved streams: +${d1} and ${d2}` };
    }
    case "recur-linear": {
      const a = randInt(rng, 2, 3), b = randInt(rng, 1, 9), len = 5;
      const terms = [randInt(rng, 1, 5)];
      for (let i = 1; i < len; i++) terms.push(a * terms[i - 1] + b);
      return { terms, answer: a * terms[len - 1] + b, rule: `Each term = ${a}×previous + ${b}` };
    }
    case "fiblike": {
      const terms = [randInt(rng, 1, 9), randInt(rng, 1, 9)];
      while (terms.length < n) terms.push(terms[terms.length - 1] + terms[terms.length - 2]);
      return { terms, answer: terms[n - 1] + terms[n - 2], rule: "Each term = sum of previous two" };
    }
    case "alt-ops": {
      const a = randInt(rng, 2, 9), b = randInt(rng, 2, 3), len = 5;
      const terms = [randInt(rng, 1, 6)];
      for (let i = 1; i < len; i++) terms.push(i % 2 === 1 ? terms[i - 1] + a : terms[i - 1] * b);
      const answer = len % 2 === 1 ? terms[len - 1] + a : terms[len - 1] * b;
      return { terms, answer, rule: `Alternating: +${a}, then ×${b}`, extra: { a, b } };
    }
    case "squares-offset": {
      const c = randInt(rng, -3, 12);
      const terms = Array.from({ length: n }, (_, i) => (i + 1) ** 2 + c);
      return { terms, answer: (n + 1) ** 2 + c, rule: c === 0 ? "Perfect squares" : `Squares ${c > 0 ? "+" : ""}${c}` };
    }
  }
}

export function sequenceItem(rng: Rng, difficulty: 1 | 2 | 3): Item {
  const family = pick(rng, SEQ_FAMILIES);
  const { terms, answer, rule, extra } = build(rng, family, difficulty);
  return {
    id: `seq-${family}-${terms.join("_")}`,
    topic: "sequences",
    prompt: terms.join(", ") + ", ?",
    answer,
    rule,
    meta: { family, terms: terms.join(","), ...(extra ?? {}) },
  };
}
