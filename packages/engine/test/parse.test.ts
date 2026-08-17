import { describe, expect, it } from "vitest";
import { parseAnswer, parseAnswerExpr } from "../src/parse";

describe("parseAnswer (plain mode: numbers and fractions only)", () => {
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
    expect(parseAnswer("--4")).toBeNull();
    expect(parseAnswer("4-")).toBeNull();
    expect(parseAnswer("1 2")).toBeNull();
    expect(parseAnswer("1e3")).toBeNull();
    expect(parseAnswer("1//2")).toBeNull();
    expect(parseAnswer("/2")).toBeNull();
  });
});

describe("parseAnswerExpr (expression mode)", () => {
  it("accepts percents", () => {
    expect(parseAnswerExpr("12.5%")).toBeCloseTo(0.125, 12);
    expect(parseAnswerExpr("(1/4)%")).toBeCloseTo(0.0025, 12);
  });
  it("accepts small arithmetic expressions", () => {
    expect(parseAnswerExpr("1/6 + 1/3")).toBeCloseTo(0.5, 12);
    expect(parseAnswerExpr("(3/8)*(1/2)")).toBeCloseTo(0.1875, 12);
    expect(parseAnswerExpr("2^10")).toBe(1024);
    expect(parseAnswerExpr("2^-2")).toBeCloseTo(0.25, 12);
    expect(parseAnswerExpr("-(1/4)")).toBeCloseTo(-0.25, 12);
    expect(parseAnswerExpr("1/6×3")).toBeCloseTo(0.5, 12);
    expect(parseAnswerExpr("( 1 + 2 )")).toBe(3);
    expect(parseAnswerExpr("2 ^ 10")).toBe(1024);
    expect(parseAnswerExpr("1 × 3")).toBe(3);
  });
  it("rejects malformed expressions", () => {
    expect(parseAnswerExpr("1/0")).toBeNull();
    expect(parseAnswerExpr("((1)")).toBeNull();
    expect(parseAnswerExpr("2^")).toBeNull();
    expect(parseAnswerExpr("1e5")).toBeNull();
    expect(parseAnswerExpr("a+b")).toBeNull();
    expect(parseAnswerExpr("1".repeat(70))).toBeNull();
    expect(parseAnswerExpr("1 2")).toBeNull();
  });
  it("pins expression evaluation conventions", () => {
    expect(parseAnswerExpr("-2^2")).toBe(4);        // unary binds tighter than ^ (Excel convention, deliberate)
    expect(parseAnswerExpr("2^3^2")).toBe(512);     // right-associative
    expect(parseAnswerExpr("100%")).toBe(1);
    expect(parseAnswerExpr("9^999")).toBeNull();    // overflow fails closed
    expect(parseAnswerExpr("12.5 %")).toBeCloseTo(0.125, 12);
    expect(parseAnswerExpr("1/3%")).toBeCloseTo(100 / 3, 9); // % binds to the base only
    expect(parseAnswerExpr("1/2/3")).toBeCloseTo(1 / 6, 12);
    expect(parseAnswerExpr("--4")).toBe(4);
  });
});
