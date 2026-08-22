import { randInt, type Item, type Rng } from "@qp/engine";

export const SEQ_FAMILIES = [
  "arithmetic", "geometric", "quadratic", "interleaved",
  "recur-linear", "fiblike", "alt-ops", "squares-offset",
  "ratio-linear-offset", "mult-plus-linear", "divisor-arith", "ratio-arith",
  "diff-squares-offset", "diff-cubes-offset", "cubes-offset", "power-offset",
] as const;
export type SeqFamily = (typeof SEQ_FAMILIES)[number];

// Which family appears is itself the difficulty ladder — measured from 652 QuantProf
// Sequences Pro questions (docs/research/quantprof-2026-08/family-mix.txt). Weights track
// their mix but every family is floored above zero in at least one tier so nothing is
// unreachable. Columns sum to 100.
export const SEQ_WEIGHTS: Record<1 | 2 | 3, Record<SeqFamily, number>> = {
  1: {
    quadratic: 22, arithmetic: 20, geometric: 18, "squares-offset": 8, "recur-linear": 7,
    "mult-plus-linear": 6, "divisor-arith": 4, "diff-squares-offset": 3, "ratio-arith": 3,
    "cubes-offset": 3, "power-offset": 2, fiblike: 2, "alt-ops": 1, interleaved: 1,
    "ratio-linear-offset": 0, "diff-cubes-offset": 0,
  },
  2: {
    "ratio-linear-offset": 15, "mult-plus-linear": 15, quadratic: 12, "recur-linear": 12,
    "diff-squares-offset": 9, "divisor-arith": 8, geometric: 7, "ratio-arith": 6,
    arithmetic: 4, "diff-cubes-offset": 3, "cubes-offset": 2, "power-offset": 2,
    "squares-offset": 2, interleaved: 1, fiblike: 1, "alt-ops": 1,
  },
  3: {
    "ratio-linear-offset": 47, "diff-cubes-offset": 13, "mult-plus-linear": 7, "recur-linear": 6,
    arithmetic: 4, geometric: 4, quadratic: 4, "diff-squares-offset": 3, interleaved: 3,
    "ratio-arith": 2, "cubes-offset": 2, "divisor-arith": 2, "squares-offset": 1,
    fiblike: 1, "alt-ops": 1, "power-offset": 0,
  },
};

// Multiplicative families compound too fast to show six terms — one fewer keeps answers
// four to five digits, the same scale the rest of the bank already lands in.
const SHORT: ReadonlySet<string> = new Set([
  "ratio-linear-offset", "mult-plus-linear", "ratio-arith", "divisor-arith", "power-offset",
]);

function pickFamily(rng: Rng, difficulty: 1 | 2 | 3): SeqFamily {
  const w = SEQ_WEIGHTS[difficulty];
  let r = rng() * 100; // weights sum to 100; one draw, exactly like the uniform pick it replaced
  for (const f of SEQ_FAMILIES) {
    r -= w[f];
    if (r < 0) return f;
  }
  return "arithmetic";
}

function build(rng: Rng, family: SeqFamily, difficulty: 1 | 2 | 3): { terms: number[]; answer: number; rule: string; extra?: Record<string, number> } {
  // Shown terms: difficulty-driven, except the SHORT families above, which show 5 at every difficulty.
  const n = SHORT.has(family) ? 5 : difficulty === 1 ? 5 : 6;
  // Per (family, difficulty) the number of rng draws is fixed — changing a family's draw count breaks seed replay.
  switch (family) {
    case "arithmetic": {
      const start = randInt(rng, -20, 60), d = randInt(rng, 2, difficulty * 9);
      const terms = Array.from({ length: n }, (_, i) => start + i * d);
      return { terms, answer: start + n * d, rule: `Arithmetic: +${d} each step` };
    }
    case "geometric": {
      // k's upper half descends — folded into the start draw so the draw count is unchanged.
      const k = randInt(rng, 1, 12), r = randInt(rng, 2, difficulty === 3 ? 4 : 3);
      const start = ((k - 1) % 6) + 1, desc = k > 6;
      const full = Array.from({ length: n + 1 }, (_, i) => start * r ** i);
      const terms = desc ? full.slice(1).reverse() : full.slice(0, n);
      return { terms, answer: desc ? full[0] : full[n], rule: `Geometric: ${desc ? `÷${r}` : `×${r}`} each step` };
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
      const a = randInt(rng, 2, 3), b = randInt(rng, 1, 9);
      const terms = [randInt(rng, 1, 5)];
      for (let i = 1; i < n; i++) terms.push(a * terms[i - 1] + b);
      return { terms, answer: a * terms[n - 1] + b, rule: `Each term = ${a}×previous + ${b}` };
    }
    case "fiblike": {
      const terms = [randInt(rng, 1, 9), randInt(rng, 1, 9)];
      while (terms.length < n) terms.push(terms[terms.length - 1] + terms[terms.length - 2]);
      return { terms, answer: terms[n - 1] + terms[n - 2], rule: "Each term = sum of previous two" };
    }
    case "alt-ops": {
      const a = randInt(rng, 2, 9), b = randInt(rng, 2, 3);
      const terms = [randInt(rng, 1, 6)];
      for (let i = 1; i < n; i++) terms.push(i % 2 === 1 ? terms[i - 1] + a : terms[i - 1] * b);
      const answer = n % 2 === 1 ? terms[n - 1] + a : terms[n - 1] * b;
      return { terms, answer, rule: `Alternating: +${a}, then ×${b}`, extra: { a, b } };
    }
    case "squares-offset": {
      const c = randInt(rng, -3, 12);
      const terms = Array.from({ length: n }, (_, i) => (i + 1) ** 2 + c);
      return { terms, answer: (n + 1) ** 2 + c, rule: c === 0 ? "Perfect squares" : `Squares ${c > 0 ? "+" : ""}${c}` };
    }
    case "ratio-linear-offset": {
      // t[i+1] = t[i]×(p + i) + (c + s·i) — the multiplier itself climbs. 54% of their hard tier.
      const start = randInt(rng, 2, 6), p = randInt(rng, 1, difficulty === 3 ? 3 : 2);
      const c = randInt(rng, -4, 5), s = randInt(rng, 0, 1) === 0 ? -1 : 1;
      const step = (t: number, i: number) => t * (p + i) + (c + s * i);
      const terms = [start];
      for (let i = 1; i < n; i++) terms.push(step(terms[i - 1], i - 1));
      return {
        terms, answer: step(terms[n - 1], n - 1),
        rule: `×${p}, then ×${p + 1}, ×${p + 2}… and add ${c}, ${c + s}, ${c + 2 * s}…`,
        extra: { p, c, s },
      };
    }
    case "mult-plus-linear": {
      // t[i+1] = m×t[i] + (c + s·i) — fixed multiplier, marching offset. s ≠ 0 or it is recur-linear.
      const start = randInt(rng, 2, 14), m = randInt(rng, 2, difficulty === 1 ? 3 : 4);
      const c = randInt(rng, -6, 6), s = randInt(rng, 1, 4) * (randInt(rng, 0, 1) === 0 ? -1 : 1);
      const step = (t: number, i: number) => m * t + (c + s * i);
      const terms = [start];
      for (let i = 1; i < n; i++) terms.push(step(terms[i - 1], i - 1));
      return {
        terms, answer: step(terms[n - 1], n - 1),
        rule: `×${m} then add ${c}, ${c + s}, ${c + 2 * s}… (stepping ${s > 0 ? "+" : ""}${s})`,
        extra: { m, c, s },
      };
    }
    case "ratio-arith": {
      // t[i+1] = t[i]×(r + i) — ratios form an arithmetic run.
      const start = randInt(rng, 2, 6), r = randInt(rng, 2, difficulty === 1 ? 2 : difficulty === 3 ? 4 : 3);
      const terms = [start];
      for (let i = 1; i < n; i++) terms.push(terms[i - 1] * (r + i - 1));
      return { terms, answer: terms[n - 1] * (r + n - 1), rule: `Ratios climb: ×${r}, ×${r + 1}, ×${r + 2}…` };
    }
    case "divisor-arith": {
      // t[i]/t[i+1] = d0 − i, every division exact. Built from the answer upward.
      const z = randInt(rng, 2, 6), d0 = n + randInt(rng, 1, 2);
      const terms = new Array<number>(n + 1);
      terms[n] = z;
      for (let i = n - 1; i >= 0; i--) terms[i] = terms[i + 1] * (d0 - i);
      return { terms: terms.slice(0, n), answer: terms[n], rule: `Divide by ${d0}, then ${d0 - 1}, ${d0 - 2}…` };
    }
    case "diff-squares-offset": {
      // Gaps between terms are consecutive squares.
      const k = randInt(rng, 2, difficulty === 1 ? 4 : 6), base = randInt(rng, 1, 30);
      const terms = [base];
      for (let i = 1; i <= n; i++) terms.push(terms[i - 1] + (k + i - 1) ** 2);
      return { terms: terms.slice(0, n), answer: terms[n], rule: `Gaps are squares: +${k}², +${k + 1}², +${k + 2}²…` };
    }
    case "diff-cubes-offset": {
      // Gaps between terms are consecutive cubes. 13% of their hard tier.
      const k = randInt(rng, 2, difficulty === 3 ? 5 : 4), base = randInt(rng, 1, 30);
      const terms = [base];
      for (let i = 1; i <= n; i++) terms.push(terms[i - 1] + (k + i - 1) ** 3);
      return { terms: terms.slice(0, n), answer: terms[n], rule: `Gaps are cubes: +${k}³, +${k + 1}³, +${k + 2}³…` };
    }
    case "cubes-offset": {
      const k = randInt(rng, 1, difficulty === 1 ? 5 : 9), c = randInt(rng, -3, 6);
      const terms = Array.from({ length: n }, (_, i) => (k + i) ** 3 + c);
      return { terms, answer: (k + n) ** 3 + c, rule: c === 0 ? "Perfect cubes" : `Cubes ${c > 0 ? "+" : ""}${c}` };
    }
    case "power-offset": {
      const b = randInt(rng, 2, difficulty === 1 ? 2 : 3), e = randInt(rng, 1, 3), c = randInt(rng, -6, 4);
      const terms = Array.from({ length: n }, (_, i) => b ** (e + i) + c);
      return { terms, answer: b ** (e + n) + c, rule: `Powers of ${b}${c === 0 ? "" : `, ${c > 0 ? "+" : ""}${c}`}` };
    }
  }
}

export function sequenceItem(rng: Rng, difficulty: 1 | 2 | 3): Item {
  const family = pickFamily(rng, difficulty);
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
