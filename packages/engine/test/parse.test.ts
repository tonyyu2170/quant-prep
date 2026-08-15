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
    expect(parseAnswer("1/2/3")).toBeNull();
  });
});
