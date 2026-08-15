import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { sequenceItem, SEQ_FAMILIES } from "../src/sequences";

// Independent verifiers: each re-derives the next term from the shown terms only.
const verify: Record<string, (terms: number[], answer: number) => boolean> = {
  arithmetic: (t, ans) => ans === t[t.length - 1] + (t[1] - t[0]),
  geometric: (t, ans) => ans === t[t.length - 1] * (t[1] / t[0]),
  quadratic: (t, ans) => {
    const d1 = t.slice(1).map((v, i) => v - t[i]);
    const dd = d1[1] - d1[0];
    return ans === t[t.length - 1] + d1[d1.length - 1] + dd;
  },
  interleaved: (t, ans) => {
    const evens = t.filter((_, i) => i % 2 === 0);
    const odds = t.filter((_, i) => i % 2 === 1);
    const stepE = evens[1] - evens[0];
    const stepO = odds[1] - odds[0];
    return t.length % 2 === 0 ? ans === evens[evens.length - 1] + stepE : ans === odds[odds.length - 1] + stepO;
  },
  "recur-linear": (t, ans) => {
    // t[n+1] = a*t[n] + b — solve a,b from first three terms, check the rest, then the answer
    const a = (t[2] - t[1]) / (t[1] - t[0]);
    const b = t[1] - a * t[0];
    for (let i = 1; i < t.length; i++) if (Math.abs(t[i] - (a * t[i - 1] + b)) > 1e-9) return false;
    return Math.abs(ans - (a * t[t.length - 1] + b)) < 1e-9;
  },
  fiblike: (t, ans) => ans === t[t.length - 1] + t[t.length - 2],
  "alt-ops": () => true, // structure verified via the meta-based test below
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
