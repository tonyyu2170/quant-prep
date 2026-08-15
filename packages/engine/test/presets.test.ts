import { describe, expect, it } from "vitest";
import { PRESETS, getPreset } from "../src/presets";

describe("presets", () => {
  it("optiver-80in8 matches the documented format", () => {
    const p = getPreset("optiver-80in8");
    expect(p).toMatchObject({ count: 80, durationS: 480, topic: "arithmetic", scoring: { correct: 1, wrong: -2, skip: 0 } });
  });
  it("difficulty curves are monotonically non-decreasing", () => {
    for (const p of Object.values(PRESETS)) {
      let prev = 0;
      for (let i = 0; i < p.count; i++) {
        const d = p.difficulty(i);
        expect(d).toBeGreaterThanOrEqual(prev);
        prev = d;
      }
    }
  });
  it("unknown preset returns null", () => {
    expect(getPreset("nope")).toBeNull();
  });
  it("sequences-sprint matches the documented format", () => {
    expect(getPreset("sequences-sprint")).toMatchObject({ count: 20, durationS: 480, topic: "sequences", scoring: { correct: 1, wrong: 0, skip: 0 } });
  });
  it("difficulty boundaries are exact", () => {
    const o = getPreset("optiver-80in8")!;
    expect([o.difficulty(0), o.difficulty(19), o.difficulty(20), o.difficulty(54), o.difficulty(55), o.difficulty(79)]).toEqual([1, 1, 2, 2, 3, 3]);
    const s = getPreset("sequences-sprint")!;
    expect([s.difficulty(0), s.difficulty(6), s.difficulty(7), s.difficulty(13), s.difficulty(14), s.difficulty(19)]).toEqual([1, 1, 2, 2, 3, 3]);
  });
  it("rejects prototype-chain keys", () => {
    expect(getPreset("toString")).toBeNull();
    expect(getPreset("__proto__")).toBeNull();
    expect(getPreset("constructor")).toBeNull();
  });
});
