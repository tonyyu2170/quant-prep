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
});
