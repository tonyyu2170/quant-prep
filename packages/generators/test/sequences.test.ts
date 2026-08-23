import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { sequenceItem, sequenceItemOfFamily, SEQ_FAMILIES, SEQ_WEIGHTS, type SeqFamily } from "../src/sequences";

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

describe("sequenceItemOfFamily", () => {
  it("builds the family it is asked for, at the difficulty it is asked for", () => {
    const rng = makeRng(11);
    for (const family of SEQ_FAMILIES) {
      const item = sequenceItemOfFamily(rng, family, 2);
      expect(item.meta.family).toBe(family);
      expect(item.id.startsWith(`seq-${family}-`)).toBe(true);
      expect(item.meta.difficulty).toBe(2);
    }
  });

  // Replaces a golden-id pin whose values were captured BEFORE sequenceItemOfFamily was extracted,
  // to prove the extraction changed nothing. That guard cannot be restated here: main has since
  // replaced the uniform family pick with the per-difficulty weighted one, so the pre-refactor ids
  // can never match again. What still matters is the pair of invariants below, and neither of them
  // has to be re-pinned when the weights are retuned.
  //
  // Burning exactly one draw and getting a byte-identical item proves both at once: sequenceItem
  // routes through sequenceItemOfFamily rather than being a divergent copy, AND choosing the family
  // costs exactly one draw. A two-draw selection would desync the rng and change every term.
  it("routes through sequenceItemOfFamily, spending exactly one draw on the family", () => {
    for (const difficulty of [1, 2, 3] as const) {
      const direct = makeRng(4242);
      const item = sequenceItem(direct, difficulty);

      const replayed = makeRng(4242);
      replayed(); // the family draw
      const rebuilt = sequenceItemOfFamily(replayed, item.meta.family as SeqFamily, difficulty);
      // whole item, not just the id: the id carries family and terms but not the difficulty, so an
      // id-only assertion misses a wrapper that forwards the wrong tier whenever the bounds coincide
      expect(rebuilt).toEqual(item);
    }
  });
});

// --- solver-ambiguity gate ------------------------------------------------------------
// The rule classes a solver actually reaches for, each over-determined by at least one
// constraint at the term counts we ship. Cubics are deliberately absent: four points always
// admit one exactly, so a degree-3 fitter matches everything and proves nothing.
//
// This exists because of a change that was tried and reverted — showing FOUR terms, which is
// what QuantProf does and what the research called the headline finding. It does not survive
// our family set. The gate below is the tripwire: it passes at 5-6 terms and fails the moment
// anyone shortens them, so the next person meets the evidence instead of the idea.
const SOLVER_RULES: ReadonlyArray<(t: readonly number[]) => number | null> = [
  (t) => { const d = t[1] - t[0]; return t.every((v, i) => i === 0 || v - t[i - 1] === d) ? t[t.length - 1] + d : null; },
  (t) => {
    const d1 = t.slice(1).map((v, i) => v - t[i]);
    const dd = d1[1] - d1[0];
    return d1.every((v, i) => i === 0 || v - d1[i - 1] === dd) ? t[t.length - 1] + d1[d1.length - 1] + dd : null;
  },
  (t) => {
    if (t[1] - t[0] === 0) return null;
    const a = (t[2] - t[1]) / (t[1] - t[0]);
    const b = t[1] - a * t[0];
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    for (let i = 3; i < t.length; i++) if (Math.abs(a * t[i - 1] + b - t[i]) > 1e-9) return null;
    return a * t[t.length - 1] + b;
  },
  (t) => {
    for (let i = 2; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2]) return null;
    return t[t.length - 1] + t[t.length - 2];
  },
];

const contradicted = (t: readonly number[], ans: number) =>
  SOLVER_RULES.some((f) => { const v = f(t); return v !== null && Math.abs(v - ans) > 1e-9; });

describe("no shipped sequence is contradicted by a rule a solver would try", () => {
  it("fires on the textbook four-term clashes", () => {
    // 2, 3, 5, 8 is fiblike's 13 and a quadratic's 12 with equal justice.
    expect(contradicted([2, 3, 5, 8], 13)).toBe(true);
    expect(contradicted([4, 6, 10, 16], 24)).toBe(true);
    expect(contradicted([3, 7, 11, 15], 19)).toBe(false);
  });

  it("no family at its shipped term count admits a contradicting simple rule", () => {
    for (const f of SEQ_FAMILIES) {
      for (const d of [1, 2, 3] as const) {
        const rng = makeRng(4242 + d);
        for (let i = 0; i < 400; i++) {
          const it = sequenceItemOfFamily(rng, f, d);
          const terms = String(it.meta.terms).split(",").map(Number);
          expect(contradicted(terms, it.answer),
            `${f} L${d}: ${terms.join(", ")}, ? -> ${it.answer} is contradicted by a simple rule`).toBe(false);
        }
      }
    }
  });
});
