import { describe, expect, it } from "vitest";
import {
  CALIBRATION_MIN_ANSWERS, Z95, combineFactors, fitLogNormal, intervalScore,
  isValidFactor, naiveProduct, summarizeCalibration, type Factor,
} from "../src/calibration";

const f = (lo: number, hi: number, label = "x"): Factor => ({ label, lo, hi });

describe("fitLogNormal", () => {
  it("centres a symmetric-in-log interval and recovers its own endpoints", () => {
    const { mu, sigma } = fitLogNormal(100, 10_000);
    expect(mu).toBeCloseTo(3, 9);                    // log10 midpoint of 2 and 4
    expect(sigma).toBeCloseTo(1 / Z95, 9);           // half-width 1 decade = Z95 sigmas
    expect(10 ** (mu - Z95 * sigma)).toBeCloseTo(100, 6);
    expect(10 ** (mu + Z95 * sigma)).toBeCloseTo(10_000, 6);
  });

  it("gives a point estimate zero width", () => {
    expect(fitLogNormal(50, 50).sigma).toBe(0);
  });
});

describe("combineFactors", () => {
  it("adds uncertainty in quadrature, NOT linearly — the claim the game is built on", () => {
    // Four identical factors, each one decade wide.
    const four = [f(10, 100), f(10, 100), f(10, 100), f(10, 100)];
    const c = combineFactors(four);
    const naive = naiveProduct(four);

    const logWidth = (lo: number, hi: number) => Math.log10(hi) - Math.log10(lo);
    // Naive multiplies endpoints: 4 decades. Correct is sqrt(4) = 2 decades.
    expect(logWidth(naive.lo, naive.hi)).toBeCloseTo(4, 9);
    expect(logWidth(c.lo, c.hi)).toBeCloseTo(2, 9);
    // So the naive interval is too wide by exactly sqrt(n).
    expect(logWidth(naive.lo, naive.hi) / logWidth(c.lo, c.hi)).toBeCloseTo(2, 9);
  });

  it("puts the combined median at the product of the factor medians", () => {
    const c = combineFactors([f(10, 1000), f(2, 8)]);   // medians 100 and 4
    expect(10 ** c.muLog10).toBeCloseTo(400, 6);
  });

  it("reduces to the single factor when there is only one", () => {
    const c = combineFactors([f(3, 300)]);
    expect(c.lo).toBeCloseTo(3, 6);
    expect(c.hi).toBeCloseTo(300, 6);
  });

  it("returns a degenerate interval for an empty chain rather than NaN", () => {
    const c = combineFactors([]);
    expect(Number.isFinite(c.lo)).toBe(true);
    expect(c.lo).toBe(1);
    expect(c.hi).toBe(1);
  });
});

describe("isValidFactor", () => {
  it("rejects non-positive, inverted and non-finite bounds — logs need lo > 0", () => {
    expect(isValidFactor(0, 10)).toBe(false);
    expect(isValidFactor(-1, 10)).toBe(false);
    expect(isValidFactor(10, 1)).toBe(false);
    expect(isValidFactor(NaN, 10)).toBe(false);
    expect(isValidFactor(5, 5)).toBe(true);
    expect(isValidFactor(1, 1e9)).toBe(true);
  });
});

describe("intervalScore", () => {
  // Lower is better. Width is always paid; a miss adds (2/alpha) x the log distance outside.
  it("charges only width when the truth is inside", () => {
    expect(intervalScore(100, 10_000, 1000)).toBeCloseTo(2, 9);   // 2 decades wide
  });

  it("adds a miss penalty proportional to the log distance outside, low and high alike", () => {
    // 2 decades wide, truth one decade below lo: 2 + (2/0.1)*1 = 22
    expect(intervalScore(100, 10_000, 10)).toBeCloseTo(22, 9);
    // symmetric on the high side
    expect(intervalScore(100, 10_000, 100_000)).toBeCloseTo(22, 9);
  });

  it("is never negative and rewards a tighter interval that still contains the truth", () => {
    expect(intervalScore(500, 2000, 1000)).toBeGreaterThanOrEqual(0);
    expect(intervalScore(500, 2000, 1000)).toBeLessThan(intervalScore(100, 10_000, 1000));
  });

  it("is a PROPER rule: honest 90% beats both over- and under-confidence in expectation", () => {
    // Truth drawn from a known lognormal; the honest 90% interval must win on average.
    // MEASURED: honest 2.07, tooTight 5.64, tooWide 4.00, and the generated sample's own
    // empirical coverage of the honest interval is 90.0% — the margins are wide, so this
    // does not become flaky if the deterministic generator below is ever changed.
    const mu = 3, sigma = 0.5;                            // log10 space
    const truths: number[] = [];
    for (let i = 0; i < 4000; i++) {
      // Box-Muller with a fixed LCG so the test is deterministic.
      const u = ((i * 9301 + 49297) % 233280) / 233280 || 1e-9;
      const v = ((i * 4111 + 12345) % 65536) / 65536;
      truths.push(10 ** (mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
    }
    const mean = (lo: number, hi: number) =>
      truths.reduce((a, t) => a + intervalScore(lo, hi, t), 0) / truths.length;

    const honest = mean(10 ** (mu - Z95 * sigma), 10 ** (mu + Z95 * sigma));
    const tooTight = mean(10 ** (mu - 0.3 * sigma), 10 ** (mu + 0.3 * sigma));
    const tooWide = mean(10 ** (mu - 4 * sigma), 10 ** (mu + 4 * sigma));
    expect(honest).toBeLessThan(tooTight);
    expect(honest).toBeLessThan(tooWide);
  });
});

describe("summarizeCalibration", () => {
  const hit = { score: 2, hit: true, logWidth: 2, logCentreError: 0.1 };
  const miss = { score: 22, hit: false, logWidth: 2, logCentreError: 1.5 };

  it("counts hits and averages the diagnostics", () => {
    const s = summarizeCalibration([hit, hit, hit, miss]);
    expect(s.answered).toBe(4);
    expect(s.hits).toBe(3);
    expect(s.hitRate).toBeCloseTo(0.75, 9);
    expect(s.medianLogWidth).toBeCloseTo(2, 9);
  });

  it("withholds the headline hit rate until enough answers have accumulated", () => {
    expect(summarizeCalibration([hit, hit]).headlineReady).toBe(false);
    const many = Array.from({ length: CALIBRATION_MIN_ANSWERS }, () => hit);
    expect(summarizeCalibration(many).headlineReady).toBe(true);
  });

  // These three deliberately depart from the plan, which asserted "overconfident" off FIVE
  // results. That is the very claim CALIBRATION_MIN_ANSWERS exists to suppress: 1 hit in 5 has a
  // 95% interval spanning most of the unit line. The verdict is now gated on headlineReady, so
  // these build a history past the floor, and the third test pins the silence below it.
  const many = (r: typeof hit, n: number) => Array.from({ length: n }, () => r);

  it("names overconfidence when the hit rate falls well short of the stated 90%", () => {
    const s = summarizeCalibration([...many(miss, 40), ...many(hit, 10)]);
    expect(s.answered).toBe(CALIBRATION_MIN_ANSWERS);
    expect(s.diagnosis).toContain("overconfident");
  });

  it("names underconfidence when nothing is missed but the intervals are enormous", () => {
    const vast = { score: 9, hit: true, logWidth: 9, logCentreError: 0.2 };
    const s = summarizeCalibration(many(vast, CALIBRATION_MIN_ANSWERS));
    expect(s.diagnosis).toContain("underconfident");
  });

  it("passes NO verdict below the floor — not even a reassuring one", () => {
    // The bug this pins: the curve withheld the hit rate while the prose below it announced
    // "well calibrated — your 90% is behaving like 90%" off eight answers.
    const s = summarizeCalibration([...many(miss, 4), ...many(hit, 4)]);
    expect(s.headlineReady).toBe(false);
    expect(s.diagnosis).not.toContain("calibrated");
    expect(s.diagnosis).not.toContain("overconfident");
    expect(s.diagnosis).not.toContain("underconfident");
    expect(s.diagnosis).toContain(`${CALIBRATION_MIN_ANSWERS - 8} more answers`);
  });

  it("summarises an empty history without dividing by zero", () => {
    const s = summarizeCalibration([]);
    expect(s.answered).toBe(0);
    expect(Number.isFinite(s.hitRate)).toBe(true);
    expect(s.headlineReady).toBe(false);
  });
});
