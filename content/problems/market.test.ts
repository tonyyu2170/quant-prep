import { describe, expect, it } from "vitest";
import { MARKET_TEMPLATES, marketRounds, unitOf } from "./market";
import { legalAnswers } from "./draw-space";
import { PROBLEMS } from ".";

const quantile = (sorted: readonly number[], p: number) =>
  sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];

describe("quote units", () => {
  it("excludes multiple-choice templates and keeps everything else", () => {
    expect(MARKET_TEMPLATES.length).toBe(PROBLEMS.filter((t) => !t.choices).length);
    expect(MARKET_TEMPLATES.some((t) => t.choices)).toBe(false);
  });

  it("gives every eligible template a finite, positive unit", () => {
    // The unit rule targets a p5-p95 spread near 100 units. Measured across the bank on
    // 2026-08-24 the real range was 31.8 to 315.0 units, median 75.1 — within a factor of
    // ~3.2 of the target either way, which is what rounding log10 can guarantee. A template
    // whose answers stop scaling like the rest is one where a single CREDIT_CAP has stopped
    // meaning the same thing — which is what this test exists to catch.
    for (const t of MARKET_TEMPLATES) {
      const u = unitOf(t);
      expect(Number.isFinite(u), `${t.id}: unit is not finite`).toBe(true);
      expect(u, `${t.id}: unit must be positive`).toBeGreaterThan(0);
    }
  });

  it("keeps every template's spread inside the band the credit cap assumes", () => {
    // The claim CREDIT_CAP rests on: every template is normalised onto a comparable scale.
    // Measured 2026-08-24 the extremes were 31.8 and 315.0; the bounds below are those with
    // room to breathe. This is the assertion that fires if a future template's answers drift
    // out of scale — the previous test only proves a unit exists, not that it worked.
    for (const t of MARKET_TEMPLATES) {
      const a = legalAnswers(t).sort((x, y) => x - y);
      const spread = (quantile(a, 0.95) - quantile(a, 0.05)) / unitOf(t);
      expect(spread, `${t.id}: p5-p95 spread ${spread.toFixed(1)} units is outside 20-500`).toBeGreaterThan(20);
      expect(spread, `${t.id}: p5-p95 spread ${spread.toFixed(1)} units is outside 20-500`).toBeLessThan(500);
    }
  });

  it("quotes a probability in percentage points", () => {
    // Any template whose answers all live in 0-1 must come out at 0.01.
    const p = MARKET_TEMPLATES.find((t) => t.id === "bayes/base-rate-test")!;
    expect(p, "expected bayes/base-rate-test to exist").toBeTruthy();
    expect(unitOf(p)).toBeCloseTo(0.01, 12);
  });
});

describe("marketRounds", () => {
  it("draws 12 rounds in a 3/6/3 difficulty mix with no repeated template", () => {
    const rounds = marketRounds(4242);
    expect(rounds.length).toBe(12);
    const byDiff = (d: 1 | 2 | 3) => rounds.filter((r) => r.template.difficulty === d).length;
    expect([byDiff(1), byDiff(2), byDiff(3)]).toEqual([3, 6, 3]);
    expect(new Set(rounds.map((r) => r.template.id)).size).toBe(12);
  });

  it("is deterministic in the seed, and different across seeds", () => {
    expect(marketRounds(7).map((r) => r.template.id)).toEqual(marketRounds(7).map((r) => r.template.id));
    expect(marketRounds(7).map((r) => r.template.id)).not.toEqual(marketRounds(8).map((r) => r.template.id));
  });

  it("carries a finite truth, a positive unit and a non-empty statement on every round", () => {
    for (const r of marketRounds(99)) {
      expect(Number.isFinite(r.truth), `${r.template.id}: truth not finite`).toBe(true);
      expect(r.unit).toBeGreaterThan(0);
      expect(r.statement.length).toBeGreaterThan(10);
    }
  });
});
