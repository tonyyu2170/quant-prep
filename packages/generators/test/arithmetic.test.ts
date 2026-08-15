import { describe, expect, it } from "vitest";
import { makeRng } from "@qp/engine";
import { arithmeticItem, ARITH_OPS } from "../src/arithmetic";

function recompute(meta: Record<string, number | string>): number {
  const a = Number(meta.a), b = Number(meta.b);
  switch (meta.op) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return a / b;
    case "pct": return (a * b) / 100;
    case "dec": return (Math.round(a * 10) * b) / 10;
    default: throw new Error("unknown op " + meta.op);
  }
}

describe("arithmeticItem", () => {
  it("is deterministic per seed", () => {
    const x = arithmeticItem(makeRng(9), 2), y = arithmeticItem(makeRng(9), 2);
    expect(x).toEqual(y);
  });
  it("answers verify against independent recomputation across 2000 draws and all difficulties", () => {
    const rng = makeRng(1234);
    for (let i = 0; i < 2000; i++) {
      const d = ((i % 3) + 1) as 1 | 2 | 3;
      const item = arithmeticItem(rng, d);
      expect(item.answer, item.prompt).toBe(recompute(item.meta));
      expect(Number.isInteger(item.answer * 10), item.prompt).toBe(true);
      if (item.meta.op === "sub") expect(item.answer).toBeGreaterThanOrEqual(0);
      expect(item.topic).toBe("arithmetic");
    }
  });
  it("division is always exact (integer quotient)", () => {
    const rng = makeRng(5);
    for (let i = 0; i < 500; i++) {
      const item = arithmeticItem(rng, 3);
      if (item.meta.op === "div") expect(Number.isInteger(item.answer)).toBe(true);
    }
  });
  it("uses every op over many draws", () => {
    const rng = makeRng(77);
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(String(arithmeticItem(rng, 2).meta.op));
    for (const op of ARITH_OPS) expect(seen.has(op)).toBe(true);
  });
});
