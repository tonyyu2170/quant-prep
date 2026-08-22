import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { sequenceItem, sequenceItemOfFamily, SEQ_FAMILIES } from "../src/sequences";

// Independent verifiers: each re-derives the FULL series and the next term from the shown terms only.
const verify: Record<string, (terms: number[], answer: number) => boolean> = {
  arithmetic: (t, ans) => {
    const d = t[1] - t[0];
    return t.every((v, i) => v === t[0] + i * d) && ans === t[0] + t.length * d;
  },
  geometric: (t, ans) => {
    const r = t[1] / t[0];
    return t.every((v, i) => v === t[0] * r ** i) && ans === t[0] * r ** t.length;
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
  "squares-offset": (t, ans) => {
    const c = t[0] - 1; // first term is 1^2 + c
    for (let i = 0; i < t.length; i++) if (t[i] !== (i + 1) ** 2 + c) return false;
    return ans === (t.length + 1) ** 2 + c;
  },
};

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
  it("every family generates and passes its independent verifier over 1600 draws", () => {
    const rng = makeRng(2024);
    const seen = new Set<string>();
    for (let i = 0; i < 1600; i++) {
      const item = sequenceItem(rng, ((i % 3) + 1) as 1 | 2 | 3);
      const fam = String(item.meta.family);
      seen.add(fam);
      const terms = String(item.meta.terms).split(",").map(Number);
      expect(verify[fam], `no verifier for ${fam}`).toBeDefined();
      expect(verify[fam](terms, item.answer), `${fam}: ${item.prompt} → ${item.answer}`).toBe(true);
      expect(item.rule, "rule reveal must exist").toBeTruthy();
    }
    for (const f of SEQ_FAMILIES) expect(seen.has(f), `family ${f} never drawn`).toBe(true);
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

  // Draw order is load-bearing: seeded replay of a sim depends on it (see the note in the generator).
  // Golden ids captured from the generator BEFORE sequenceItemOfFamily was extracted — comparing two
  // fresh rngs would pass under any refactor and prove nothing.
  it("leaves sequenceItem's seeded output byte-identical", () => {
    const rng = makeRng(99);
    expect(Array.from({ length: 6 }, () => sequenceItem(rng, 2).id)).toEqual([
      "seq-quadratic-10_18_30_46_66_90",
      "seq-arithmetic-46_48_50_52_54_56",
      "seq-arithmetic-12_25_38_51_64_77",
      "seq-quadratic-7_10_15_22_31_42",
      "seq-quadratic-9_13_19_27_37_49",
      "seq-interleaved-9_78_15_73_21_68",
    ]);
  });
});
