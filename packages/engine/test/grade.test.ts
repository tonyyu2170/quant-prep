import { describe, expect, it } from "vitest";
import { grade } from "../src/grade";

describe("grade", () => {
  it("defaults to exact equality when no tolerance", () => {
    expect(grade(3901, 3901)).toBe(true);
    expect(grade(3900, 3901)).toBe(false);
  });
  it("applies relative tolerance", () => {
    expect(grade(0.0098, 1 / 102, { rel: 0.005 })).toBe(true);
    expect(grade(0.012, 1 / 102, { rel: 0.005 })).toBe(false);
  });
  it("applies absolute tolerance", () => {
    expect(grade(10.004, 10, { abs: 0.005 })).toBe(true);
    expect(grade(10.006, 10, { abs: 0.005 })).toBe(false);
  });
  it("uses the max of rel and abs when both given", () => {
    expect(grade(100.4, 100, { rel: 0.005, abs: 0.1 })).toBe(true); // rel bound 0.5 dominates
  });
  it("rejects NaN", () => {
    expect(grade(Number.NaN, 5, { rel: 0.1 })).toBe(false);
  });
  it("handles negative expected values with relative tolerance", () => {
    expect(grade(-9.95, -10, { rel: 0.01 })).toBe(true);
    expect(grade(-10.2, -10, { rel: 0.01 })).toBe(false);
  });
  it("abs dominates when larger than the rel bound", () => {
    expect(grade(10.4, 10, { rel: 0.005, abs: 0.5 })).toBe(true);
    expect(grade(10.6, 10, { rel: 0.005, abs: 0.5 })).toBe(false);
  });
  it("expected 0 with rel-only means exact", () => {
    expect(grade(0, 0, { rel: 0.05 })).toBe(true);
    expect(grade(0.001, 0, { rel: 0.05 })).toBe(false);
  });
  it("rejects Infinity", () => {
    expect(grade(Number.POSITIVE_INFINITY, 5)).toBe(false);
  });
});
