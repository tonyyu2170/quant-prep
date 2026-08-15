import { describe, expect, it } from "vitest";
import { makeRng, randInt, pick } from "../src/rng";

describe("seeded rng", () => {
  it("is deterministic for the same seed", () => {
    const a = makeRng(42), b = makeRng(42);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });
  it("differs across seeds", () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)());
  });
  it("randInt stays inclusive within bounds", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = randInt(rng, 3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
  it("pick returns an element", () => {
    const rng = makeRng(7);
    expect(["a", "b", "c"]).toContain(pick(rng, ["a", "b", "c"]));
  });
  it("produces frozen output values (do not change without a data migration)", () => {
    const r = makeRng(42);
    expect(Array.from({ length: 5 }, () => r())).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099,
      0.6697340414393693, 0.17481389874592423,
    ]);
  });
});
