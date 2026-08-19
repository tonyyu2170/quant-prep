import { describe, expect, it } from "vitest";
import { erf, normalCdf, normalQuantile } from "../src/erf";

describe("erf / normalCdf / normalQuantile", () => {
  it("pins known standard-normal CDF values", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 10);
    expect(normalCdf(1)).toBeCloseTo(0.8413447460685429, 10);
    expect(normalCdf(1.96)).toBeCloseTo(0.9750021048517795, 8);
    expect(normalCdf(-2)).toBeCloseTo(0.022750131948179195, 10);
  });
  it("erf matches the textbook identity erf(x) = 2*normalCdf(x*sqrt2) - 1", () => {
    for (const x of [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3]) {
      expect(erf(x)).toBeCloseTo(2 * normalCdf(x * Math.SQRT2) - 1, 12);
    }
  });
  it("round-trips normalQuantile(normalCdf(x)) to 1e-8 across a wide range", () => {
    for (let x = -4; x <= 4; x += 0.137) {
      expect(normalQuantile(normalCdf(x))).toBeCloseTo(x, 8);
    }
  });
  it("respects mu/sigma", () => {
    expect(normalCdf(110, 100, 10)).toBeCloseTo(normalCdf(1), 10);
    expect(normalQuantile(0.975, 100, 10)).toBeCloseTo(100 + 10 * 1.959963985, 5);
  });
});
