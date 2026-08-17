import { describe, expect, it } from "vitest";
import { drawParams, type ProblemTemplate } from "../src/problem";

const t: ProblemTemplate = {
  id: "test/t1", version: 1, topic: "probability/bayes", difficulty: 1,
  firms: [], source: { kind: "original", inspiration: "" },
  params: { a: { choices: [2, 3, 4] }, b: { range: { min: 10, max: 30, step: 5 } } },
  constraint: (p) => p.a !== 3,
  derived: (p) => ({ sum: p.a + p.b }),
  statement: () => "", answerKey: "sum",
  accepted: { tolerance: { rel: 0.005 } },
  solution: () => [], keyInsight: "", commonTrap: "", expectedPaceS: 60,
  verify: { method: "brute-force" },
};

describe("drawParams", () => {
  it("is deterministic per seed and respects choices/range/step", () => {
    const p1 = drawParams(t, 42), p2 = drawParams(t, 42);
    expect(p1).toEqual(p2);
    expect([2, 4]).toContain(p1.a); // constraint rejects 3
    expect(p1.b).toBeGreaterThanOrEqual(10);
    expect(p1.b).toBeLessThanOrEqual(30);
    expect((p1.b - 10) % 5).toBe(0);
  });
  it("varies across seeds", () => {
    const draws = new Set(Array.from({ length: 30 }, (_, i) => JSON.stringify(drawParams(t, i))));
    expect(draws.size).toBeGreaterThan(3);
  });
  it("throws when the constraint is unsatisfiable", () => {
    expect(() => drawParams({ ...t, constraint: () => false }, 1)).toThrow(/constraint/);
  });
  it("reaches the grid maximum on decimal steps", () => {
    const g: ProblemTemplate = { ...t, params: { x: { range: { min: 0.05, max: 0.95, step: 0.05 } } }, constraint: undefined, derived: (p) => ({ sum: p.x }), answerKey: "sum" };
    const seen = new Set<number>();
    for (let s = 0; s < 500; s++) seen.add(drawParams(g, s).x);
    expect(seen.has(0.95)).toBe(true);
    expect(seen.has(0.05)).toBe(true);
  });
  it("throws on degenerate param specs", () => {
    expect(() => drawParams({ ...t, params: { x: {} } }, 1)).toThrow(/invalid spec/);
    expect(() => drawParams({ ...t, params: { x: { choices: [] } } }, 1)).toThrow(/invalid spec/);
  });
  it("throws on non-divisible or zero-step grids", () => {
    expect(() => drawParams({ ...t, params: { x: { range: { min: 0.05, max: 0.98, step: 0.05 } } } }, 1)).toThrow(/invalid spec/);
    expect(() => drawParams({ ...t, params: { x: { range: { min: 1, max: 5, step: 0 } } } }, 1)).toThrow(/invalid spec/);
  });
});
