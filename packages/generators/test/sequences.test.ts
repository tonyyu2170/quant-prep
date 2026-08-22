import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { sequenceItem, SEQ_FAMILIES, SEQ_WEIGHTS, type SeqFamily } from "../src/sequences";

type Verifier = (terms: number[], answer: number) => boolean;

// terms[i] = (k+i)^p + c, for some integer base index k and offset c
const offsetPower = (p: number): Verifier => (t, ans) => {
  for (let k = 1; k <= 40; k++) {
    const c = t[0] - k ** p;
    if (t.every((v, i) => v === (k + i) ** p + c)) return ans === (k + t.length) ** p + c;
  }
  return false;
};

// first differences are consecutive p-th powers
const diffPower = (p: number): Verifier => (t, ans) => {
  const d = t.slice(1).map((v, i) => v - t[i]);
  const k = Math.round(d[0] ** (1 / p));
  if (k ** p !== d[0]) return false;
  if (!d.every((v, i) => v === (k + i) ** p)) return false;
  return ans === t[t.length - 1] + (k + d.length) ** p;
};

// t[i+1] = mult(i)·t[i] + (c + s·i). Collects EVERY (p, c, s) consistent with the shown terms and
// requires them all to predict the same next term — so this also proves the rule is not ambiguous.
const linearOffset = (
  mult: (p: number, i: number) => number,
  pLo: number,
  pHi: number,
  movingOffset = false, // reject s === 0: a fixed multiplier with a frozen offset is just recur-linear
): Verifier => (t, ans) => {
  const n = t.length;
  const predictions: number[] = [];
  for (let p = pLo; p <= pHi; p++) {
    const res = t.slice(1).map((v, i) => v - mult(p, i) * t[i]);
    const s = res[1] - res[0];
    if (movingOffset && s === 0) continue;
    if (!res.every((v, i) => v === res[0] + i * s)) continue;
    predictions.push(mult(p, n - 1) * t[n - 1] + res[0] + s * (n - 1));
  }
  return predictions.length > 0 && predictions.every((x) => x === ans);
};

// Independent verifiers: each re-derives the FULL series and the next term from the shown terms only.
const verify: Record<SeqFamily, Verifier> = {
  arithmetic: (t, ans) => {
    const d = t[1] - t[0];
    return t.every((v, i) => v === t[0] + i * d) && ans === t[0] + t.length * d;
  },
  // constant ratio in either direction, checked by integer cross-multiplication (t[i]² = t[i-1]·t[i+1])
  geometric: (t, ans) => {
    for (let i = 1; i < t.length - 1; i++) if (t[i] * t[i] !== t[i - 1] * t[i + 1]) return false;
    return ans * t[t.length - 2] === t[t.length - 1] * t[t.length - 1];
  },
  quadratic: (t, ans) => {
    const d1 = t.slice(1).map((v, i) => v - t[i]);
    const dd = d1[1] - d1[0];
    for (let i = 2; i < d1.length; i++) if (d1[i] - d1[i - 1] !== dd) return false;
    return ans === t[t.length - 1] + d1[d1.length - 1] + dd;
  },
  interleaved: (t, ans) => {
    const evens = t.filter((_, i) => i % 2 === 0);
    const odds = t.filter((_, i) => i % 2 === 1);
    const stepE = evens[1] - evens[0];
    const stepO = odds[1] - odds[0];
    if (!evens.every((v, i) => v === evens[0] + i * stepE)) return false;
    if (!odds.every((v, i) => v === odds[0] + i * stepO)) return false;
    return t.length % 2 === 0 ? ans === evens[evens.length - 1] + stepE : ans === odds[odds.length - 1] + stepO;
  },
  "recur-linear": (t, ans) => {
    // t[n+1] = a*t[n] + b — solve a,b from first three terms, check the rest, then the answer
    const a = (t[2] - t[1]) / (t[1] - t[0]);
    const b = t[1] - a * t[0];
    for (let i = 1; i < t.length; i++) if (Math.abs(t[i] - (a * t[i - 1] + b)) > 1e-9) return false;
    return Math.abs(ans - (a * t[t.length - 1] + b)) < 1e-9;
  },
  fiblike: (t, ans) => {
    for (let i = 2; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2]) return false;
    return ans === t[t.length - 1] + t[t.length - 2];
  },
  "alt-ops": (t, ans) => {
    const a = t[1] - t[0], b = t[2] / t[1];
    for (let k = 1; k < t.length; k++) if (t[k] !== (k % 2 === 1 ? t[k - 1] + a : t[k - 1] * b)) return false;
    const n = t.length;
    return ans === (n % 2 === 1 ? t[n - 1] + a : t[n - 1] * b);
  },
  "squares-offset": offsetPower(2),
  "cubes-offset": offsetPower(3),
  "diff-squares-offset": diffPower(2),
  "diff-cubes-offset": diffPower(3),
  "power-offset": (t, ans) => {
    for (let b = 2; b <= 12; b++) {
      for (let e = 0; e <= 14; e++) {
        const c = t[0] - b ** e;
        if (t.every((v, i) => v === b ** (e + i) + c)) return ans === b ** (e + t.length) + c;
      }
    }
    return false;
  },
  "ratio-arith": (t, ans) => {
    const rs = t.slice(1).map((v, i) => v / t[i]);
    if (!rs.every((r) => Number.isInteger(r))) return false;
    if (!rs.every((r, i) => r === rs[0] + i)) return false;
    return ans === t[t.length - 1] * (rs[0] + rs.length);
  },
  "divisor-arith": (t, ans) => {
    const ds = t.slice(1).map((v, i) => t[i] / v);
    if (!ds.every((d) => Number.isInteger(d))) return false;
    if (!ds.every((d, i) => d === ds[0] - i)) return false;
    const next = ds[0] - ds.length;
    return next >= 2 && Number.isInteger(t[t.length - 1] / next) && ans === t[t.length - 1] / next;
  },
  "mult-plus-linear": linearOffset((m) => m, 2, 12, true),
  "ratio-linear-offset": linearOffset((p, i) => p + i, -6, 12),
};

const families = (d: 1 | 2 | 3) => SEQ_FAMILIES.filter((f) => SEQ_WEIGHTS[d][f] > 0);

describe("sequenceItem", () => {
  it("is deterministic per seed", () => {
    const x = sequenceItem(makeRng(3), 2), y = sequenceItem(makeRng(3), 2);
    expect(x).toEqual(y);
    const run = () => {
      const r = makeRng(7);
      return Array.from({ length: 20 }, (_, i) => sequenceItem(r, ((i % 3) + 1) as 1 | 2 | 3));
    };
    expect(run()).toEqual(run());
  });

  it("weight columns sum to 100 — pickFamily's one draw scales by that total", () => {
    for (const d of [1, 2, 3] as const) {
      expect(Object.values(SEQ_WEIGHTS[d]).reduce((a, b) => a + b, 0), `difficulty ${d}`).toBe(100);
    }
    for (const f of SEQ_FAMILIES) {
      expect(([1, 2, 3] as const).some((d) => SEQ_WEIGHTS[d][f] > 0), `${f} unreachable at every difficulty`).toBe(true);
    }
  });

  it("every family passes its independent verifier over 2400 draws", () => {
    const rng = makeRng(2024);
    for (let i = 0; i < 2400; i++) {
      const item = sequenceItem(rng, ((i % 3) + 1) as 1 | 2 | 3);
      const fam = item.meta.family as SeqFamily;
      const terms = String(item.meta.terms).split(",").map(Number);
      expect(verify[fam], `no verifier for ${fam}`).toBeDefined();
      expect(verify[fam](terms, item.answer), `${fam}: ${item.prompt} → ${item.answer}`).toBe(true);
      expect(item.rule, "rule reveal must exist").toBeTruthy();
      expect(Number.isSafeInteger(item.answer), `${fam}: non-integer answer ${item.answer}`).toBe(true);
    }
  });

  it("id determines the answer — three families slice the answer off the shown terms", () => {
    // id is written as problemId on every attempt row, so two items sharing an id with different
    // answers would silently corrupt stats. divisor-arith / diff-squares / diff-cubes build n+1
    // terms and show n, so their id carries strictly less than the generator drew.
    const byId = new Map<string, number>();
    for (const d of [1, 2, 3] as const) {
      const rng = makeRng(8080 + d);
      for (let i = 0; i < 8000; i++) {
        const item = sequenceItem(rng, d);
        const prev = byId.get(item.id);
        if (prev !== undefined) expect(prev, `${item.id} maps to two answers`).toBe(item.answer);
        byId.set(item.id, item.answer);
      }
    }
  });

  it("difficulty selects the family mix: every weighted family appears, zero-weight ones never do", () => {
    for (const d of [1, 2, 3] as const) {
      const rng = makeRng(500 + d);
      const seen = new Set<string>();
      for (let i = 0; i < 4000; i++) seen.add(String(sequenceItem(rng, d).meta.family));
      for (const f of families(d)) expect(seen.has(f), `d${d}: ${f} never drawn`).toBe(true);
      for (const f of SEQ_FAMILIES) {
        if (SEQ_WEIGHTS[d][f] === 0) expect(seen.has(f), `d${d}: ${f} has weight 0 but was drawn`).toBe(false);
      }
    }
  });

  it("hard mode leans on ratio-linear-offset the way QuantProf's does (~50%)", () => {
    const rng = makeRng(99);
    let hits = 0;
    for (let i = 0; i < 4000; i++) if (sequenceItem(rng, 3).meta.family === "ratio-linear-offset") hits++;
    expect(hits / 4000).toBeGreaterThan(0.4);
    expect(hits / 4000).toBeLessThan(0.55);
  });

  it("ratio-linear-offset matches the harvested example 18, 33, 95, 375", () => {
    // docs/research/quantprof-2026-08/sequence-families.txt — "x(2+1i) then -3 stepping -1"
    const step = (t: number, i: number) => t * (2 + i) + (-3 + -1 * i);
    const terms = [18];
    for (let i = 1; i < 4; i++) terms.push(step(terms[i - 1], i - 1));
    expect(terms).toEqual([18, 33, 95, 375]);
    expect(verify["ratio-linear-offset"](terms, step(375, 3))).toBe(true);
  });

  it("geometric runs both directions", () => {
    const rng = makeRng(4242);
    let up = 0, down = 0;
    for (let i = 0; i < 3000; i++) {
      const item = sequenceItem(rng, 1);
      if (item.meta.family !== "geometric") continue;
      const t = String(item.meta.terms).split(",").map(Number);
      if (t[1] > t[0]) up++; else down++;
    }
    expect(up).toBeGreaterThan(0);
    expect(down).toBeGreaterThan(0);
  });

  it("alt-ops meta reconstructs: terms alternate +a then ×b", () => {
    const rng = makeRng(11);
    for (let i = 0; i < 300; i++) {
      const item = sequenceItem(rng, 2);
      if (item.meta.family !== "alt-ops") continue;
      const terms = String(item.meta.terms).split(",").map(Number);
      const a = Number(item.meta.a), b = Number(item.meta.b);
      for (let k = 1; k < terms.length; k++) {
        const expected = k % 2 === 1 ? terms[k - 1] + a : terms[k - 1] * b;
        expect(terms[k]).toBe(expected);
      }
      const n = terms.length;
      expect(item.answer).toBe(n % 2 === 1 ? terms[n - 1] + a : terms[n - 1] * b);
    }
  });
});
