import { describe, expect, it } from "vitest";
import { parseAnswer } from "../src/parse";

describe("parseAnswer", () => {
  it("parses integers, decimals, negatives, commas", () => {
    expect(parseAnswer("3901")).toBe(3901);
    expect(parseAnswer("-4")).toBe(-4);
    expect(parseAnswer("0.0098")).toBeCloseTo(0.0098);
    expect(parseAnswer("3,901")).toBe(3901);
    expect(parseAnswer("  12 ")).toBe(12);
  });
  it("parses simple fractions a/b", () => {
    expect(parseAnswer("1/102")).toBeCloseTo(1 / 102);
    expect(parseAnswer("-3/4")).toBeCloseTo(-0.75);
  });
  it("rejects garbage and division by zero", () => {
    expect(parseAnswer("abc")).toBeNull();
    expect(parseAnswer("")).toBeNull();
    expect(parseAnswer("1/0")).toBeNull();
    expect(parseAnswer("1/2/3")).toBeCloseTo(1 / 6, 12);
  });
  it("accepts hardened forms (leading/trailing dot, plus sign, unicode minus, spaced fraction)", () => {
    expect(parseAnswer(".5")).toBeCloseTo(0.5);
    expect(parseAnswer("-.5")).toBeCloseTo(-0.5);
    expect(parseAnswer("3.")).toBe(3);
    expect(parseAnswer("+5")).toBe(5);
    expect(parseAnswer("−4")).toBe(-4);
    expect(parseAnswer("–5")).toBe(-5);
    expect(parseAnswer("1 / 2")).toBeCloseTo(0.5);
  });
  it("still rejects malformed input", () => {
    expect(parseAnswer(".")).toBeNull();
    expect(parseAnswer("-")).toBeNull();
    expect(parseAnswer("1.2.3")).toBeNull();
    expect(parseAnswer("--4")).toBe(4);
    expect(parseAnswer("4-")).toBeNull();
    expect(parseAnswer("1 2")).toBeNull();
    expect(parseAnswer("1e3")).toBeNull();
    expect(parseAnswer("1//2")).toBeNull();
    expect(parseAnswer("/2")).toBeNull();
  });
  it("accepts percents", () => {
    expect(parseAnswer("12.5%")).toBeCloseTo(0.125, 12);
    expect(parseAnswer("(1/4)%")).toBeCloseTo(0.0025, 12);
  });
  it("accepts small arithmetic expressions", () => {
    expect(parseAnswer("1/6 + 1/3")).toBeCloseTo(0.5, 12);
    expect(parseAnswer("(3/8)*(1/2)")).toBeCloseTo(0.1875, 12);
    expect(parseAnswer("2^10")).toBe(1024);
    expect(parseAnswer("2^-2")).toBeCloseTo(0.25, 12);
    expect(parseAnswer("-(1/4)")).toBeCloseTo(-0.25, 12);
    expect(parseAnswer("1/6×3")).toBeCloseTo(0.5, 12);
  });
  it("rejects malformed expressions", () => {
    expect(parseAnswer("1/0")).toBeNull();
    expect(parseAnswer("((1)")).toBeNull();
    expect(parseAnswer("2^")).toBeNull();
    expect(parseAnswer("1e5")).toBeNull();
    expect(parseAnswer("a+b")).toBeNull();
    expect(parseAnswer("1".repeat(70))).toBeNull();
  });
});
