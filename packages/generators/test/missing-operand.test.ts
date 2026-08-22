import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { missingOperandItem, MO_OPS, MO_SLOTS } from "../src/missing-operand";

const near = (x: number, y: number) => Math.abs(x - y) < 1e-9;

/** Re-solve the equation from the PROMPT text alone, substituting the answer into the blank. */
function promptHolds(prompt: string, answer: number): boolean {
  const m = prompt.match(/^(\S+) ([+−×÷]) (\S+) = (\S+)$/);
  if (!m) return false;
  const [, rawA, sym, rawB, rawR] = m;
  const fill = (s: string) => (s === "?" ? answer : Number(s));
  const a = fill(rawA), b = fill(rawB), r = fill(rawR);
  if ([a, b, r].some((v) => !Number.isFinite(v))) return false;
  const lhs = sym === "+" ? a + b : sym === "−" ? a - b : sym === "×" ? a * b : a / b;
  return near(Math.round(lhs * 100) / 100, r);
}

describe("missingOperandItem", () => {
  it("is deterministic per seed", () => {
    expect(missingOperandItem(makeRng(5), 2)).toEqual(missingOperandItem(makeRng(5), 2));
  });

  it("holds every invariant over 3000 draws", () => {
    const rng = makeRng(4242);
    for (let i = 0; i < 3000; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3;
      const item = missingOperandItem(rng, d);
      const opts = item.options!;
      const where = `${item.prompt} → ${item.answer} [${opts.join("/")}]`;

      // the prompt, with the answer written into the blank, is a true equation
      expect(promptHolds(item.prompt, item.answer), where).toBe(true);
      // exactly one blank
      expect(item.prompt.split("?").length - 1, where).toBe(1);
      // four distinct options, containing the answer exactly once
      expect(opts.length, where).toBe(4);
      expect(new Set(opts).size, where).toBe(4);
      expect(opts.filter((o) => near(o, item.answer)).length, where).toBe(1);
      // Every displayed number must BE the canonical 2dp double, not merely close to one:
      // `near` would accept 4.730000000000001, which String() then puts on screen.
      for (const v of [...opts, item.answer, ...item.prompt.split(/[^-\d.]+/).filter(Boolean).map(Number)])
        expect(Math.round(v * 100) / 100 === v, `${where} — ${v} not 2dp-clean`).toBe(true);
      // their invariants: division exact, subtraction never negative
      if (item.meta.op === "div") expect(near(Number(item.meta.a) / Number(item.meta.b), Number(item.meta.result)), where).toBe(true);
      if (item.meta.op === "sub") expect(Number(item.meta.result), where).toBeGreaterThanOrEqual(0);
      expect(item.topic).toBe("missing-operand");
    }
  });

  it("uses every op and every blank position", () => {
    const rng = makeRng(77);
    const ops = new Set<string>(), slots = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const item = missingOperandItem(rng, 2);
      ops.add(String(item.meta.op));
      slots.add(String(item.meta.slot));
    }
    for (const o of MO_OPS) expect(ops.has(o), `op ${o} never drawn`).toBe(true);
    for (const s of MO_SLOTS) expect(slots.has(s), `slot ${s} never drawn`).toBe(true);
  });

  it("the correct answer lands in all four positions — no guessable bias", () => {
    const rng = makeRng(31);
    const idx = [0, 0, 0, 0];
    for (let i = 0; i < 2000; i++) {
      const item = missingOperandItem(rng, 2);
      idx[item.options!.findIndex((o) => near(o, item.answer))]++;
    }
    for (const c of idx) expect(c / 2000, `position mix ${idx.join("/")}`).toBeGreaterThan(0.2);
  });

  it("decimals get commoner as difficulty rises, matching their ramp", () => {
    const frac = (d: 1 | 2 | 3) => {
      const rng = makeRng(808);
      let n = 0;
      for (let i = 0; i < 2000; i++) if (!Number.isInteger(missingOperandItem(rng, d).answer)) n++;
      return n / 2000;
    };
    // A real ramp, not just an ordering noise could satisfy.
    expect(frac(3) - frac(1), `d1 ${frac(1)} vs d3 ${frac(3)}`).toBeGreaterThan(0.25);
  });
});
