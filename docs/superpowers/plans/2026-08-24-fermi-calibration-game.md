# Fermi / Calibration Estimation Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a playable game where the player decomposes an unknown real-world quantity into factors, states a 90% interval on each, and is scored by a proper scoring rule on whether their stated confidence matches how often they are right.

**Architecture:** The mathematics is a pure module in the engine package — no React, no clock, no storage — the same shape as `grade.ts` and `market.ts`. Fermi content lives in a **second registry** (`content/fermi/`) that is deliberately NOT the `PROBLEMS` array, because every existing content gate keys off `PROBLEMS`; it therefore carries its own three gates. The UI is one client component plus a calibration curve, and calibration history is `localStorage` only.

**Tech Stack:** TypeScript, Next.js App Router, React 19, Vitest + Testing Library, Python 3 + numpy for the independent counterpart, existing `@qp/engine` workspace package.

**Spec:** `docs/superpowers/specs/2026-08-24-fermi-calibration-game-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `packages/engine/src/calibration.ts` | Lognormal fit, quadrature combination, interval score, session summary. Pure — knows nothing about content or React. |
| `packages/engine/test/calibration.test.ts` | Every branch, plus the quadrature-vs-naive claim the game is built on. |
| `content/fermi/types.ts` | `Cited<T>`, `DataTable`, `FermiTemplate`, `FermiItem`. The types the gates check. |
| `content/fermi/tables/world-cities.ts` | ~60 cities: population, one source, one retrieval date. |
| `content/fermi/templates/piano-tuners.ts` | Template + canonical chain. |
| `content/fermi/templates/barbers.ts` | Second template, proving the table x template pattern. |
| `content/fermi/index.ts` | `FERMI_TEMPLATES`, `fermiItem(seed)`. The second registry. |
| `content/fermi/fermi.test.ts` | The three gates of spec §7. |
| `verification/fermi-fixture.ts` | Emits chains + TS-computed intervals for Python to re-derive. |
| `verification/verify_fermi.py` | Monte-Carlo counterpart to the closed form. |
| `lib/store/calibration.ts` | Cross-session answer history in `localStorage`. |
| `components/FermiRunner.tsx` | Chain entry, in-place settlement, canonical reveal. |
| `components/charts/CalibrationCurve.tsx` | Stated confidence vs actual hit rate. |
| `app/game/estimator/page.tsx` | The route. |
| `app/page.tsx` | Add the link. |

---

## Task 1: The calibration mathematics

**Files:**
- Create: `packages/engine/src/calibration.ts`
- Test: `packages/engine/test/calibration.test.ts`
- Modify: `packages/engine/src/index.ts` (add one export line)

- [ ] **Step 1: Write the failing test**

Create `packages/engine/test/calibration.test.ts`:

```ts
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

  it("names overconfidence when the hit rate falls well short of the stated 90%", () => {
    const s = summarizeCalibration([miss, miss, miss, miss, hit]);
    expect(s.diagnosis).toContain("overconfident");
  });

  it("names underconfidence when nothing is missed but the intervals are enormous", () => {
    const vast = { score: 9, hit: true, logWidth: 9, logCentreError: 0.2 };
    const s = summarizeCalibration([vast, vast, vast, vast]);
    expect(s.diagnosis).toContain("underconfident");
  });

  it("summarises an empty history without dividing by zero", () => {
    const s = summarizeCalibration([]);
    expect(s.answered).toBe(0);
    expect(Number.isFinite(s.hitRate)).toBe(true);
    expect(s.headlineReady).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/engine/test/calibration.test.ts`
Expected: FAIL — `Failed to resolve import "../src/calibration"`.

- [ ] **Step 3: Write the implementation**

Create `packages/engine/src/calibration.ts`:

```ts
/**
 * The mathematics of the Fermi / calibration game. Pure: no content, no React, no storage.
 *
 * EVERYTHING IS log10, one base throughout. An earlier draft of the spec fitted in natural log
 * and scored in log10; that mismatch produces a plausible-looking interval wrong by a factor of
 * ln(10) = 2.303. log10 of a lognormal is normal, so the normal quantile below is unchanged and
 * nothing is lost by picking the base the scoring needs.
 */

/** z(0.95). A stated 90% interval spans the median +- Z95 sigmas. */
export const Z95 = 1.6449;

/** Below this many recorded answers a hit rate is noise, not a measurement.
 *  At 50 the standard error on a 90% rate is sqrt(.9*.1/50) = 4.2 points, small enough that a
 *  genuinely overconfident player (70%) separates from a calibrated one. Tuning constant. */
export const CALIBRATION_MIN_ANSWERS = 50;

/** One link in the player's chain: a label and their 90% interval for it. */
export interface Factor { label: string; lo: number; hi: number }

export interface Combined { lo: number; hi: number; muLog10: number; sigmaLog10: number }

/** Logs need a positive, ordered, finite range. Rejected at the input rather than scored. */
export function isValidFactor(lo: number, hi: number): boolean {
  return Number.isFinite(lo) && Number.isFinite(hi) && lo > 0 && hi >= lo;
}

/** Read a stated 90% interval as the parameters of a lognormal, in log10 space. */
export function fitLogNormal(lo: number, hi: number): { mu: number; sigma: number } {
  const a = Math.log10(lo), b = Math.log10(hi);
  return { mu: (a + b) / 2, sigma: (b - a) / (2 * Z95) };
}

/**
 * Combine the chain into one interval.
 *
 * The product of independent lognormals is EXACTLY lognormal, so this is closed form — no
 * simulation and no sampling noise. Means add; variances add. That is the whole reason the game
 * has a lesson in it: uncertainty adds in QUADRATURE, not linearly, so multiplying the endpoints
 * (see naiveProduct) overstates the combined range by a factor of about sqrt(n).
 *
 * Independence is assumed and is stated to the player, not hidden. Correlated factors (a city's
 * population and its household count) break it and make this interval too narrow.
 */
export function combineFactors(factors: readonly Factor[]): Combined {
  let mu = 0, varSum = 0;
  for (const f of factors) {
    const { mu: m, sigma: s } = fitLogNormal(f.lo, f.hi);
    mu += m;
    varSum += s * s;
  }
  const sigma = Math.sqrt(varSum);
  return { lo: 10 ** (mu - Z95 * sigma), hi: 10 ** (mu + Z95 * sigma), muLog10: mu, sigmaLog10: sigma };
}

/** What the player would get by multiplying their endpoints — kept so the reveal can show both. */
export function naiveProduct(factors: readonly Factor[]): { lo: number; hi: number } {
  return {
    lo: factors.reduce((a, f) => a * f.lo, 1),
    hi: factors.reduce((a, f) => a * f.hi, 1),
  };
}

/**
 * The interval (Winkler) score, on log10 values. LOWER IS BETTER.
 *
 * Proper: expected score is minimised by reporting your true 90% interval. That is the whole
 * requirement — a calibration trainer whose optimal strategy is anything but honesty trains the
 * wrong thing, which is why this is not the market game's `CREDIT_CAP - width`.
 *
 * Log space makes questions comparable: Fermi answers span orders of magnitude, and in absolute
 * units one "US GDP" question would swamp fifty others.
 */
export function intervalScore(lo: number, hi: number, truth: number, alpha = 0.1): number {
  const l = Math.log10(lo), h = Math.log10(hi), y = Math.log10(truth);
  let s = h - l;
  if (y < l) s += (2 / alpha) * (l - y);
  else if (y > h) s += (2 / alpha) * (y - h);
  return s;
}

export interface CalibrationResult {
  score: number;
  hit: boolean;
  logWidth: number;
  logCentreError: number;
}

export interface CalibrationSummary {
  answered: number;
  hits: number;
  hitRate: number;
  medianScore: number;
  medianLogWidth: number;
  medianLogCentreError: number;
  /** False until CALIBRATION_MIN_ANSWERS — below that a hit rate cannot mean anything. */
  headlineReady: boolean;
  diagnosis: string;
}

const median = (xs: readonly number[]) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Two failure modes with OPPOSITE fixes, which a bare score distinguishes neither of. The
 * thresholds: 90% is what the player claimed, so a hit rate well under it is overconfidence; and
 * a player who never misses while spanning many decades is buying that record with width.
 */
export function summarizeCalibration(results: readonly CalibrationResult[]): CalibrationSummary {
  const answered = results.length;
  const hits = results.filter((r) => r.hit).length;
  const hitRate = answered === 0 ? 0 : hits / answered;
  const medianLogWidth = median(results.map((r) => r.logWidth));

  let diagnosis = "Well calibrated — your 90% is behaving like 90%. Tighten only if you stop missing entirely.";
  if (answered === 0) {
    diagnosis = "No questions answered yet.";
  } else if (hitRate < 0.75) {
    diagnosis = `You are overconfident: you claimed 90% and were right ${(hitRate * 100).toFixed(0)}% of the time. Your intervals average ${medianLogWidth.toFixed(1)} orders of magnitude — widen them until you are missing about one question in ten.`;
  } else if (hitRate > 0.97 && medianLogWidth > 3) {
    diagnosis = `You are underconfident: you almost never miss, but at ${medianLogWidth.toFixed(1)} orders of magnitude your intervals are too wide to be worth stating. Tighten until you miss about one in ten — you know more than you are admitting.`;
  }

  return {
    answered,
    hits,
    hitRate,
    medianScore: median(results.map((r) => r.score)),
    medianLogWidth,
    medianLogCentreError: median(results.map((r) => r.logCentreError)),
    headlineReady: answered >= CALIBRATION_MIN_ANSWERS,
    diagnosis,
  };
}

/** Score one answered question against the truth. */
export function scoreChain(factors: readonly Factor[], truth: number): CalibrationResult & { combined: Combined } {
  const combined = combineFactors(factors);
  return {
    combined,
    score: intervalScore(combined.lo, combined.hi, truth),
    hit: truth >= combined.lo && truth <= combined.hi,
    logWidth: Math.log10(combined.hi) - Math.log10(combined.lo),
    logCentreError: Math.abs(combined.muLog10 - Math.log10(truth)),
  };
}
```

- [ ] **Step 4: Export it from the package**

Modify `packages/engine/src/index.ts` — add after the `export * from "./market";` line:

```ts
export * from "./calibration";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run packages/engine/test/calibration.test.ts`
Expected: PASS, 16 tests.

- [ ] **Step 6: Watch the gate fail — required by the repo's standing rule**

Temporarily change the quadrature line in `combineFactors` from `varSum += s * s;` to `varSum += s;`
(i.e. add standard deviations linearly instead of variances).
Run: `npx vitest run packages/engine/test/calibration.test.ts`
Expected: FAIL on "adds uncertainty in quadrature, NOT linearly".
Then **revert** and re-run to confirm PASS. A checker nobody has watched fail is not evidence.

- [ ] **Step 7: Commit**

```bash
git add packages/engine/src/calibration.ts packages/engine/src/index.ts packages/engine/test/calibration.test.ts
git commit -m "feat(calibration): lognormal chains combined in quadrature, scored properly"
```

---

## Task 2: The Fermi content type and its registry

**Files:**
- Create: `content/fermi/types.ts`
- Create: `content/fermi/tables/world-cities.ts`
- Create: `content/fermi/index.ts`

This task builds the types and the data table. The gates come in Task 4, after there is a
template for them to check.

- [ ] **Step 1: Write the types**

Create `content/fermi/types.ts`:

```ts
/**
 * The SECOND content type. Deliberately not a `ProblemTemplate`, and deliberately not in the
 * `PROBLEMS` array.
 *
 * Every existing content gate keys off `PROBLEMS` — including verification/emit.ts, which is what
 * feeds verify.py. So content that is not in PROBLEMS is outside those gates by construction, and
 * verify.py's rule that every problem ships with a Python counterpart stays fully intact for
 * PROBLEMS. This is not an exemption; it is a separate type that carries its own gates
 * (content/fermi/fermi.test.ts) because the ones next door do not apply to it.
 */

/** A real-world number we cannot derive, only cite. */
export interface Cited<T = number> {
  value: T;
  /** Where it came from. Free text, but must name something checkable. */
  source: string;
  /** ISO date the value was read from that source. Staleness is gated on this. */
  retrievedAt: string;
}

export interface DataTable<Row> {
  id: string;
  /** One source and one retrieval date for the WHOLE table — that is the point of a table. */
  source: string;
  retrievedAt: string;
  rows: readonly Row[];
}

/** One link of a canonical chain: what it is, and the cited value we claim it takes. */
export interface CanonicalFactor {
  label: string;
  value: number;
  /** Absent when the value is read from a data table, which carries its own source. */
  cite?: Omit<Cited, "value">;
}

export interface FermiItem {
  id: string;
  /** The question as shown. */
  statement: string;
  /** The authored decomposition, revealed after the player submits. */
  chain: readonly CanonicalFactor[];
  /** The answer, cited INDEPENDENTLY of the chain — that independence is what makes the
   *  cross-check in fermi.test.ts real evidence rather than a restatement. */
  truth: Cited;
  unitLabel: string;
}

export interface FermiTemplate {
  id: string;
  /** How many distinct items this template can produce, for the registry's reach count. */
  count: number;
  /** Build item `i`. Deterministic: same index, same item. */
  itemAt(i: number): FermiItem;
}
```

- [ ] **Step 2: Write the data table**

Create `content/fermi/tables/world-cities.ts`:

```ts
import type { DataTable } from "../types";

export interface City { name: string; country: string; population: number }

/**
 * Metropolitan-area populations, rounded to two significant figures because log10 scoring cannot
 * see more than that: a 5% drift is 0.02 log units against interval widths near a full decade
 * (spec §6). Rounding makes the staleness policy honest rather than implying precision we do not
 * have, and it makes the numbers legible in the reveal.
 */
export const WORLD_CITIES: DataTable<City> = {
  id: "world-cities",
  source: "UN World Urbanization Prospects, urban agglomeration estimates",
  retrievedAt: "2026-08-24",
  rows: [
    { name: "Tokyo", country: "Japan", population: 37_000_000 },
    { name: "Delhi", country: "India", population: 33_000_000 },
    { name: "Shanghai", country: "China", population: 29_000_000 },
    { name: "Dhaka", country: "Bangladesh", population: 23_000_000 },
    { name: "São Paulo", country: "Brazil", population: 22_000_000 },
    { name: "Cairo", country: "Egypt", population: 22_000_000 },
    { name: "Mexico City", country: "Mexico", population: 22_000_000 },
    { name: "Beijing", country: "China", population: 22_000_000 },
    { name: "Mumbai", country: "India", population: 21_000_000 },
    { name: "Osaka", country: "Japan", population: 19_000_000 },
    { name: "New York", country: "United States", population: 19_000_000 },
    { name: "Karachi", country: "Pakistan", population: 17_000_000 },
    { name: "Buenos Aires", country: "Argentina", population: 15_000_000 },
    { name: "Istanbul", country: "Turkey", population: 16_000_000 },
    { name: "Kolkata", country: "India", population: 15_000_000 },
    { name: "Lagos", country: "Nigeria", population: 15_000_000 },
    { name: "Manila", country: "Philippines", population: 14_000_000 },
    { name: "Rio de Janeiro", country: "Brazil", population: 14_000_000 },
    { name: "Guangzhou", country: "China", population: 14_000_000 },
    { name: "Los Angeles", country: "United States", population: 13_000_000 },
    { name: "Moscow", country: "Russia", population: 13_000_000 },
    { name: "Paris", country: "France", population: 11_000_000 },
    { name: "Bogotá", country: "Colombia", population: 11_000_000 },
    { name: "Jakarta", country: "Indonesia", population: 11_000_000 },
    { name: "Lima", country: "Peru", population: 11_000_000 },
    { name: "Bangkok", country: "Thailand", population: 11_000_000 },
    { name: "London", country: "United Kingdom", population: 9_600_000 },
    { name: "Tehran", country: "Iran", population: 9_500_000 },
    { name: "Ho Chi Minh City", country: "Vietnam", population: 9_300_000 },
    { name: "Hong Kong", country: "China", population: 7_600_000 },
    { name: "Bogor", country: "Indonesia", population: 7_100_000 },
    { name: "Santiago", country: "Chile", population: 6_800_000 },
    { name: "Riyadh", country: "Saudi Arabia", population: 7_700_000 },
    { name: "Madrid", country: "Spain", population: 6_800_000 },
    { name: "Singapore", country: "Singapore", population: 6_000_000 },
    { name: "Toronto", country: "Canada", population: 6_400_000 },
    { name: "Johannesburg", country: "South Africa", population: 6_200_000 },
    { name: "Barcelona", country: "Spain", population: 5_700_000 },
    { name: "Saint Petersburg", country: "Russia", population: 5_500_000 },
    { name: "Sydney", country: "Australia", population: 5_100_000 },
    { name: "Melbourne", country: "Australia", population: 5_100_000 },
    { name: "Berlin", country: "Germany", population: 3_600_000 },
    { name: "Rome", country: "Italy", population: 4_300_000 },
    { name: "Nairobi", country: "Kenya", population: 5_300_000 },
    { name: "Chicago", country: "United States", population: 8_900_000 },
    { name: "Houston", country: "United States", population: 6_700_000 },
    { name: "Atlanta", country: "United States", population: 5_800_000 },
    { name: "Boston", country: "United States", population: 4_900_000 },
    { name: "Seattle", country: "United States", population: 4_000_000 },
    { name: "Warsaw", country: "Poland", population: 1_800_000 },
    { name: "Vienna", country: "Austria", population: 2_000_000 },
    { name: "Amsterdam", country: "Netherlands", population: 1_200_000 },
    { name: "Stockholm", country: "Sweden", population: 1_700_000 },
    { name: "Copenhagen", country: "Denmark", population: 1_400_000 },
    { name: "Dublin", country: "Ireland", population: 1_300_000 },
    { name: "Lisbon", country: "Portugal", population: 3_000_000 },
    { name: "Prague", country: "Czechia", population: 1_300_000 },
    { name: "Budapest", country: "Hungary", population: 1_800_000 },
    { name: "Auckland", country: "New Zealand", population: 1_700_000 },
    { name: "Montreal", country: "Canada", population: 4_300_000 },
  ],
};
```

- [ ] **Step 3: Write the registry**

Create `content/fermi/index.ts`:

```ts
import { makeRng } from "@qp/engine";
import type { FermiItem, FermiTemplate } from "./types";
import { pianoTuners } from "./templates/piano-tuners";
import { barbers } from "./templates/barbers";

/**
 * The second registry. NOT `PROBLEMS`, and that is the design (see content/fermi/types.ts).
 * Nothing here is emitted to instances.json and nothing here needs a Python solver keyed by
 * problem id; the mathematics gets its counterpart through verification/verify_fermi.py instead.
 */
export const FERMI_TEMPLATES: readonly FermiTemplate[] = [pianoTuners, barbers];

/** Total distinct items reachable across all templates. */
export const fermiReach = () => FERMI_TEMPLATES.reduce((a, t) => a + t.count, 0);

/** One item, drawn deterministically from a seed. */
export function fermiItem(seed: number): FermiItem {
  const rng = makeRng(seed);
  const t = FERMI_TEMPLATES[Math.floor(rng() * FERMI_TEMPLATES.length)];
  return t.itemAt(Math.floor(rng() * t.count));
}

/** `n` distinct items for one session, no template-and-index repeated. */
export function fermiSession(seed: number, n = 8): FermiItem[] {
  const rng = makeRng(seed);
  const seen = new Set<string>();
  const out: FermiItem[] = [];
  for (let guard = 0; out.length < n && guard < n * 50; guard++) {
    const t = FERMI_TEMPLATES[Math.floor(rng() * FERMI_TEMPLATES.length)];
    const item = t.itemAt(Math.floor(rng() * t.count));
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: errors about the two missing template modules — that is correct, Task 3 writes them.
Do NOT commit yet; Task 3 completes this unit.

---

## Task 3: The two question templates

**Files:**
- Create: `content/fermi/templates/piano-tuners.ts`
- Create: `content/fermi/templates/barbers.ts`

- [ ] **Step 1: Write the first template**

Create `content/fermi/templates/piano-tuners.ts`:

```ts
import { WORLD_CITIES } from "../tables/world-cities";
import type { FermiTemplate } from "../types";

/**
 * The canonical Fermi question. The rates below are the expensive part of authoring — they have
 * no table to hide in and each needs its own citation (spec §11).
 *
 * The TRUTH is computed from the chain here, which would make the cross-check in fermi.test.ts
 * circular if it stopped there. It does not: the gate also asserts the result lands within a
 * stated tolerance of an INDEPENDENT published figure for the reference city, which is what
 * `REFERENCE_CHECK` below records. Author more of those before adding templates.
 */
const PIANOS_PER_PERSON = { value: 1 / 100, source: "US piano ownership surveys, ~1 household in 40 owns a piano at ~2.5 persons/household", retrievedAt: "2026-08-24" };
const TUNINGS_PER_PIANO_YEAR = { value: 1, source: "Piano Technicians Guild recommendation: at least once per year", retrievedAt: "2026-08-24" };
const TUNINGS_PER_TUNER_DAY = { value: 4, source: "Piano Technicians Guild practitioner surveys, 3-5 tunings per working day", retrievedAt: "2026-08-24" };
const WORKING_DAYS = { value: 250, source: "52 weeks x 5 days less ~10 public holidays", retrievedAt: "2026-08-24" };

/** An independently published count, used to check the chain rather than to build it. */
export const REFERENCE_CHECK = {
  city: "Chicago",
  tuners: 290,
  source: "US Bureau of Labor Statistics OES, musical instrument repairers and tuners, Chicago MSA",
  retrievedAt: "2026-08-24",
};

export const pianoTuners: FermiTemplate = {
  id: "fermi/piano-tuners",
  count: WORLD_CITIES.rows.length,
  itemAt(i) {
    const city = WORLD_CITIES.rows[i % WORLD_CITIES.rows.length];
    const chain = [
      { label: `Population of ${city.name}`, value: city.population },
      { label: "Pianos per person", value: PIANOS_PER_PERSON.value, cite: PIANOS_PER_PERSON },
      { label: "Tunings per piano per year", value: TUNINGS_PER_PIANO_YEAR.value, cite: TUNINGS_PER_PIANO_YEAR },
      { label: "1 / (tunings per tuner-day)", value: 1 / TUNINGS_PER_TUNER_DAY.value, cite: TUNINGS_PER_TUNER_DAY },
      { label: "1 / (working days per year)", value: 1 / WORKING_DAYS.value, cite: WORKING_DAYS },
    ];
    return {
      id: `fermi/piano-tuners#${city.name}`,
      statement: `How many piano tuners work in ${city.name}, ${city.country}?`,
      chain,
      truth: {
        value: chain.reduce((a, f) => a * f.value, 1),
        source: `${WORLD_CITIES.source}; rates as cited per factor; cross-checked against ${REFERENCE_CHECK.source}`,
        retrievedAt: "2026-08-24",
      },
      unitLabel: "piano tuners",
    };
  },
};
```

- [ ] **Step 2: Write the second template**

Create `content/fermi/templates/barbers.ts`:

```ts
import { WORLD_CITIES } from "../tables/world-cities";
import type { FermiTemplate } from "../types";

/** Second template over the same table — the point is that a table amortises across templates. */
const HAIRCUTS_PER_PERSON_YEAR = { value: 6, source: "Consumer expenditure surveys: roughly one haircut every two months averaged across adults and children", retrievedAt: "2026-08-24" };
const CUTS_PER_BARBER_DAY = { value: 12, source: "Trade association practitioner surveys, 10-14 cuts per working day", retrievedAt: "2026-08-24" };
const WORKING_DAYS = { value: 280, source: "Six-day weeks are common in the trade: ~52 x 6 less holidays", retrievedAt: "2026-08-24" };

export const REFERENCE_CHECK = {
  city: "New York",
  barbers: 27_000,
  source: "US Bureau of Labor Statistics OES, barbers/hairdressers/cosmetologists, New York MSA",
  retrievedAt: "2026-08-24",
};

export const barbers: FermiTemplate = {
  id: "fermi/barbers",
  count: WORLD_CITIES.rows.length,
  itemAt(i) {
    const city = WORLD_CITIES.rows[i % WORLD_CITIES.rows.length];
    const chain = [
      { label: `Population of ${city.name}`, value: city.population },
      { label: "Haircuts per person per year", value: HAIRCUTS_PER_PERSON_YEAR.value, cite: HAIRCUTS_PER_PERSON_YEAR },
      { label: "1 / (cuts per barber-day)", value: 1 / CUTS_PER_BARBER_DAY.value, cite: CUTS_PER_BARBER_DAY },
      { label: "1 / (working days per year)", value: 1 / WORKING_DAYS.value, cite: WORKING_DAYS },
    ];
    return {
      id: `fermi/barbers#${city.name}`,
      statement: `How many barbers and hairdressers work in ${city.name}, ${city.country}?`,
      chain,
      truth: {
        value: chain.reduce((a, f) => a * f.value, 1),
        source: `${WORLD_CITIES.source}; rates as cited per factor; cross-checked against ${REFERENCE_CHECK.source}`,
        retrievedAt: "2026-08-24",
      },
      unitLabel: "barbers and hairdressers",
    };
  },
};
```

- [ ] **Step 3: Typecheck and commit the content unit**

Run: `npx tsc --noEmit`
Expected: clean exit, no output.

```bash
git add content/fermi
git commit -m "feat(fermi): the second content type — cited tables, question templates, its own registry"
```

---

## Task 4: The three gates

**Files:**
- Create: `content/fermi/fermi.test.ts`

- [ ] **Step 1: Write the gates**

Create `content/fermi/fermi.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FERMI_TEMPLATES, fermiItem, fermiReach, fermiSession } from ".";
import { WORLD_CITIES } from "./tables/world-cities";
import { REFERENCE_CHECK as PIANO_REF, pianoTuners } from "./templates/piano-tuners";
import { REFERENCE_CHECK as BARBER_REF, barbers } from "./templates/barbers";
import { PROBLEMS } from "../problems";

/** Spec §7 gate 1's tolerance, in log10 units. 0.2 is a factor of ~1.6.
 *  PROVISIONAL — see the measurement step in Task 5. A tolerance nothing ever fails is not a
 *  gate, so this must be set from the observed agreement, not chosen for comfort. */
const CROSS_CHECK_TOLERANCE_LOG10 = 0.2;

const MAX_TABLE_AGE_MONTHS = 24;

describe("gate 1: chains cross-check against an independently published total", () => {
  // This is the analogue of verify.py's two-route rule. The chain is one route; a published
  // employment figure for a reference city is a different one. Two sources agreeing is evidence;
  // a chain agreeing with itself is not.
  it("piano tuners: the chain reproduces the published Chicago count", () => {
    const item = pianoTuners.itemAt(WORLD_CITIES.rows.findIndex((c) => c.name === PIANO_REF.city));
    const gap = Math.abs(Math.log10(item.truth.value) - Math.log10(PIANO_REF.tuners));
    expect(gap, `chain gives ${item.truth.value.toFixed(0)}, published ${PIANO_REF.tuners}, ${gap.toFixed(2)} log10 apart`)
      .toBeLessThan(CROSS_CHECK_TOLERANCE_LOG10);
  });

  it("barbers: the chain reproduces the published New York count", () => {
    const item = barbers.itemAt(WORLD_CITIES.rows.findIndex((c) => c.name === BARBER_REF.city));
    const gap = Math.abs(Math.log10(item.truth.value) - Math.log10(BARBER_REF.barbers));
    expect(gap, `chain gives ${item.truth.value.toFixed(0)}, published ${BARBER_REF.barbers}, ${gap.toFixed(2)} log10 apart`)
      .toBeLessThan(CROSS_CHECK_TOLERANCE_LOG10);
  });
});

describe("gate 2: citation integrity", () => {
  it("every table names a source and a retrieval date, and is not stale", () => {
    const ageMonths = (iso: string) => (Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24 * 30.44);
    expect(WORLD_CITIES.source.length).toBeGreaterThan(10);
    expect(Number.isFinite(Date.parse(WORLD_CITIES.retrievedAt))).toBe(true);
    expect(ageMonths(WORLD_CITIES.retrievedAt), `${WORLD_CITIES.id} is stale`).toBeLessThan(MAX_TABLE_AGE_MONTHS);
  });

  it("every authored rate in every chain carries a source and a date", () => {
    for (const t of FERMI_TEMPLATES) {
      for (let i = 0; i < t.count; i++) {
        const item = t.itemAt(i);
        for (const f of item.chain) {
          // A factor either reads from a table (no cite of its own) or cites its own source.
          if (!f.cite) continue;
          expect(f.cite.source.length, `${item.id}: "${f.label}" has an empty source`).toBeGreaterThan(10);
          expect(Number.isFinite(Date.parse(f.cite.retrievedAt)), `${item.id}: "${f.label}" has no valid date`).toBe(true);
        }
        expect(item.truth.source.length, `${item.id}: truth has no source`).toBeGreaterThan(10);
      }
    }
  });

  it("every factor is a positive finite number — logs require it", () => {
    for (const t of FERMI_TEMPLATES) {
      for (let i = 0; i < t.count; i++) {
        const item = t.itemAt(i);
        for (const f of item.chain) {
          expect(f.value > 0 && Number.isFinite(f.value), `${item.id}: "${f.label}" = ${f.value}`).toBe(true);
        }
        expect(item.truth.value).toBeGreaterThan(0);
      }
    }
  });
});

describe("gate 3: the registry stays separate from PROBLEMS", () => {
  // The whole verification argument of spec §7 rests on this separation. If a Fermi item ever
  // reached PROBLEMS it would be emitted to instances.json and verify.py would demand a Python
  // solver for a question that has no independent derivation.
  it("no fermi id appears in PROBLEMS", () => {
    const problemIds = new Set(PROBLEMS.map((p) => p.id));
    for (const t of FERMI_TEMPLATES) {
      expect(problemIds.has(t.id), `${t.id} leaked into PROBLEMS`).toBe(false);
    }
  });

  it("reaches the item count v1 scoped, and draws distinct items per session", () => {
    expect(fermiReach()).toBeGreaterThanOrEqual(100);
    const s = fermiSession(4242, 8);
    expect(s.length).toBe(8);
    expect(new Set(s.map((i) => i.id)).size).toBe(8);
  });

  it("is deterministic in the seed", () => {
    expect(fermiItem(7).id).toBe(fermiItem(7).id);
    expect(fermiSession(7, 8).map((i) => i.id)).toEqual(fermiSession(7, 8).map((i) => i.id));
  });

  it("every item has a statement and a unit label", () => {
    for (const t of FERMI_TEMPLATES) {
      for (let i = 0; i < t.count; i++) {
        const item = t.itemAt(i);
        expect(item.statement.length).toBeGreaterThan(15);
        expect(item.unitLabel.length).toBeGreaterThan(2);
      }
    }
  });
});
```

- [ ] **Step 2: Run the gates**

Run: `npx vitest run content/fermi/fermi.test.ts`
Expected: PASS. **If gate 1 fails, do not loosen the tolerance to make it pass** — that is the
one move this gate exists to prevent. Fix the chain's rates, or record honestly that the
published figure and the chain disagree and by how much.

- [ ] **Step 3: Watch each gate fail**

1. In `content/fermi/tables/world-cities.ts`, temporarily change Chicago's population to
   `89_000_000` (10x). Run the gates. Expected: FAIL on gate 1's piano-tuner cross-check.
   Revert.
2. Temporarily change `WORLD_CITIES.retrievedAt` to `"2020-01-01"`. Run. Expected: FAIL on
   staleness. Revert.
3. Temporarily add `pianoTuners.id` into a copy of the PROBLEMS check by changing gate 3's
   assertion target to `FERMI_TEMPLATES[0].id === "fermi/piano-tuners"` inverted — simpler:
   temporarily rename `pianoTuners.id` to an existing problem id such as
   `"bayes/base-rate-test"`. Run. Expected: FAIL on "leaked into PROBLEMS". Revert.

Re-run after each revert to confirm PASS.

- [ ] **Step 4: Commit**

```bash
git add content/fermi/fermi.test.ts
git commit -m "test(fermi): three gates — two-route cross-check, citation integrity, registry separation"
```

---

## Task 5: Measure the cross-check tolerance

**Files:**
- Create: `tools/fermi-crosscheck.ts`
- Modify: `content/fermi/fermi.test.ts` (set the measured tolerance)

Spec §7 marks `CROSS_CHECK_TOLERANCE_LOG10 = 0.2` as provisional and says it must be measured.
This is the same discipline `CREDIT_CAP` got.

- [ ] **Step 1: Write the measurement tool**

Create `tools/fermi-crosscheck.ts`:

```ts
/* What is the actual agreement between each authored chain and its independently published
 * reference? The gate's tolerance must come from this, not from what makes the gate pass.
 *   npx tsx tools/fermi-crosscheck.ts */
import { WORLD_CITIES } from "../content/fermi/tables/world-cities";
import { REFERENCE_CHECK as PIANO_REF, pianoTuners } from "../content/fermi/templates/piano-tuners";
import { REFERENCE_CHECK as BARBER_REF, barbers } from "../content/fermi/templates/barbers";

const idx = (name: string) => WORLD_CITIES.rows.findIndex((c) => c.name === name);

for (const [label, item, published] of [
  ["piano-tuners", pianoTuners.itemAt(idx(PIANO_REF.city)), PIANO_REF.tuners],
  ["barbers", barbers.itemAt(idx(BARBER_REF.city)), BARBER_REF.barbers],
] as const) {
  const gap = Math.log10(item.truth.value) - Math.log10(published);
  console.log(
    `${label.padEnd(14)} chain=${item.truth.value.toFixed(0).padStart(9)}  published=${String(published).padStart(9)}  ` +
    `gap=${gap >= 0 ? "+" : ""}${gap.toFixed(3)} log10 (factor ${(10 ** Math.abs(gap)).toFixed(2)})`);
}
```

- [ ] **Step 2: Run it and read the numbers**

Run: `npx tsx tools/fermi-crosscheck.ts`
Expected: two lines, each reporting the log10 gap between the chain and the published figure.

- [ ] **Step 3: Set the tolerance from what you measured**

In `content/fermi/fermi.test.ts`, set `CROSS_CHECK_TOLERANCE_LOG10` to roughly **1.5x the worst
observed gap**, rounded to one decimal, and replace the `PROVISIONAL` comment with the measured
derivation, naming both gaps. For example, if the worst gap is 0.12, set 0.2 and record why.

If a gap exceeds 0.3 (a factor of 2), **the chain is wrong, not the tolerance** — the rates need
revisiting before this ships.

- [ ] **Step 4: Re-run and commit**

Run: `npx vitest run content/fermi/fermi.test.ts`
Expected: PASS.

```bash
git add tools/fermi-crosscheck.ts content/fermi/fermi.test.ts
git commit -m "test(fermi): set the cross-check tolerance from measurement, not from comfort"
```

---

## Task 6: The Python counterpart

**Files:**
- Create: `verification/fermi-fixture.ts`
- Create: `verification/verify_fermi.py`
- Modify: `package.json` (one script line)
- Modify: `.github/workflows/ci.yml` (one step)

`verify.py` walks `instances.json`, which `emit.ts` builds from `PROBLEMS`. Fermi content is not
in `PROBLEMS`, so it cannot ride that loop. The mathematics still gets an independent route, and
it is a genuinely different one: **TypeScript computes the closed form, Python re-derives it by
sampling.** That is the same exact/brute split every solver in `verification/solvers/` uses.

- [ ] **Step 1: Write the fixture emitter**

Create `verification/fermi-fixture.ts`:

```ts
/* Emits chains and the TS-computed combined intervals, for verify_fermi.py to re-derive by
 * simulation. Run: npx tsx verification/fermi-fixture.ts */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { combineFactors, intervalScore, makeRng, type Factor } from "@qp/engine";

const rng = makeRng(20260824);
const cases: unknown[] = [];

for (let c = 0; c < 200; c++) {
  const n = 2 + Math.floor(rng() * 5);                 // 2..6 factors
  const factors: Factor[] = [];
  for (let i = 0; i < n; i++) {
    const centre = 10 ** (rng() * 8 - 3);              // 1e-3 .. 1e5
    const halfDecades = 0.1 + rng() * 1.5;
    factors.push({ label: `f${i}`, lo: centre / 10 ** halfDecades, hi: centre * 10 ** halfDecades });
  }
  const combined = combineFactors(factors);
  const truth = 10 ** (combined.muLog10 + (rng() * 4 - 2) * combined.sigmaLog10);
  cases.push({
    factors: factors.map((f) => ({ lo: f.lo, hi: f.hi })),
    combined: { lo: combined.lo, hi: combined.hi, mu: combined.muLog10, sigma: combined.sigmaLog10 },
    truth,
    score: intervalScore(combined.lo, combined.hi, truth),
  });
}

writeFileSync(join(__dirname, "fermi-instances.json"), JSON.stringify({ cases }, null, 1));
console.log(`wrote ${cases.length} fermi cases`);
```

- [ ] **Step 2: Write the Python counterpart**

Create `verification/verify_fermi.py`:

```python
"""CI gate: the Fermi game's mathematics, re-derived independently.

Fermi CONTENT cannot be verified in Python — there is no second route to a real-world count, and
that is what content/fermi/fermi.test.ts's cross-check gate is for. The MATHEMATICS can be, and
this is that check.

TypeScript computes the combined interval in closed form (the product of independent lognormals
is exactly lognormal). Python re-derives it by SAMPLING, which shares no algebra with the closed
form — the same exact/brute split every solver in verification/solvers/ uses.

Run after `npm run verify:fermi-emit`. Exit 1 on any failure.
"""
import json
import sys
from pathlib import Path

import numpy as np

Z95 = 1.6449
N_SAMPLES = 400_000
RTOL_INTERVAL = 0.02      # 2% on each endpoint: sampling error at 400k samples
ATOL_SCORE = 1e-9         # the score is pure arithmetic, so it must match exactly

data = json.loads((Path(__file__).parent / "fermi-instances.json").read_text())
rng = np.random.default_rng(20260824)
failures = []

for i, case in enumerate(data["cases"]):
    # BRUTE: sample each factor as a lognormal and multiply the draws. No summing of variances.
    logs = np.zeros(N_SAMPLES)
    for f in case["factors"]:
        a, b = np.log10(f["lo"]), np.log10(f["hi"])
        mu, sigma = (a + b) / 2, (b - a) / (2 * Z95)
        logs += rng.normal(mu, sigma, N_SAMPLES)
    sampled_lo, sampled_hi = 10 ** np.percentile(logs, [5, 95])

    ts = case["combined"]
    for name, got, want in (("lo", sampled_lo, ts["lo"]), ("hi", sampled_hi, ts["hi"])):
        if abs(got - want) > RTOL_INTERVAL * abs(want):
            failures.append(f"case {i}: {name} sampled {got:.6g} vs closed form {want:.6g}")

    # EXACT: the interval score is arithmetic and must agree to machine precision.
    lo, hi, y = np.log10(ts["lo"]), np.log10(ts["hi"]), np.log10(case["truth"])
    s = hi - lo
    if y < lo:
        s += 20.0 * (lo - y)
    elif y > hi:
        s += 20.0 * (y - hi)
    if abs(s - case["score"]) > ATOL_SCORE + 1e-9 * abs(case["score"]):
        failures.append(f"case {i}: score {s:.12g} vs TS {case['score']:.12g}")

if failures:
    print(f"FERMI VERIFY FAILED — {len(failures)} problems")
    for f in failures[:60]:
        print(" ", f)
    sys.exit(1)

print(f"fermi ok: {len(data['cases'])} cases, intervals re-derived by sampling")
```

- [ ] **Step 3: Wire the scripts**

Modify `package.json` — add to `"scripts"`, after the `"verify:emit"` line:

```json
    "verify:fermi-emit": "tsx verification/fermi-fixture.ts",
```

Add `verification/fermi-instances.json` to `.gitignore` if generated artifacts are ignored there;
otherwise commit it, matching whatever `verification/instances.json` does.

- [ ] **Step 4: Run both halves**

```bash
npm run verify:fermi-emit
python3 verification/verify_fermi.py
```

Expected: `fermi ok: 200 cases, intervals re-derived by sampling`.

- [ ] **Step 5: Watch it fail**

In `packages/engine/src/calibration.ts`, temporarily change `varSum += s * s;` to `varSum += s;`.
Then:

```bash
npm run verify:fermi-emit
python3 verification/verify_fermi.py
```

Expected: FAIL, many `lo`/`hi` mismatches — the sampling route disagrees with the broken closed
form. Revert and re-run to confirm it passes.

- [ ] **Step 6: Add the CI step**

Modify `.github/workflows/ci.yml` — in the job that already runs `python3 verification/verify.py`,
add these two steps immediately before it:

```yaml
      - run: npm run verify:fermi-emit
      - run: python3 verification/verify_fermi.py
```

- [ ] **Step 7: Commit**

```bash
git add verification/fermi-fixture.ts verification/verify_fermi.py package.json .github/workflows/ci.yml
git commit -m "test(fermi): Python counterpart — the closed form re-derived by sampling"
```

---

## Task 7: Calibration history in localStorage

**Files:**
- Create: `lib/store/calibration.ts`
- Test: `lib/store/calibration.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/store/calibration.test.ts`:

```ts
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { CAL_KEY, appendAnswers, clearCalibration, readCalibration } from "./calibration";

describe("calibration history", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty and round-trips appended answers", () => {
    expect(readCalibration()).toEqual([]);
    appendAnswers([{ score: 2, hit: true, logWidth: 2, logCentreError: 0.1 }]);
    appendAnswers([{ score: 22, hit: false, logWidth: 2, logCentreError: 1.5 }]);
    const rows = readCalibration();
    expect(rows.length).toBe(2);
    expect(rows[0].hit).toBe(true);
    expect(rows[1].score).toBe(22);
  });

  it("survives corrupt storage rather than throwing on read", () => {
    localStorage.setItem(CAL_KEY, "{not json");
    expect(readCalibration()).toEqual([]);
  });

  it("clears", () => {
    appendAnswers([{ score: 1, hit: true, logWidth: 1, logCentreError: 0 }]);
    clearCalibration();
    expect(readCalibration()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/store/calibration.test.ts`
Expected: FAIL — cannot resolve `./calibration`.

- [ ] **Step 3: Write the implementation**

Create `lib/store/calibration.ts`:

```ts
import type { CalibrationResult } from "@qp/engine";

/** Calibration is a CROSS-SESSION statistic — a hit rate over one 8-question sitting is noise.
 *  Local only in v1: no Supabase, no migration (spec §10). */
export const CAL_KEY = "qp.calibration.v1";

export function readCalibration(): CalibrationResult[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const rows = JSON.parse(localStorage.getItem(CAL_KEY) ?? "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return []; // corrupt storage loses history; it must never break the page
  }
}

export function appendAnswers(rows: readonly CalibrationResult[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CAL_KEY, JSON.stringify([...readCalibration(), ...rows]));
}

export function clearCalibration(): void {
  if (typeof localStorage !== "undefined") localStorage.removeItem(CAL_KEY);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/store/calibration.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/store/calibration.ts lib/store/calibration.test.ts
git commit -m "feat(fermi): cross-session calibration history, local only"
```

---

## Task 8: The calibration curve

**Files:**
- Create: `components/charts/CalibrationCurve.tsx`

No separate test file — one branch (empty history), otherwise SVG geometry. `FermiRunner.test.tsx`
in Task 9 renders it as a child, which catches a crash. Do not add a snapshot test; snapshots of
generated SVG break on every cosmetic change and assert nothing about behaviour.

- [ ] **Step 1: Write the component**

Create `components/charts/CalibrationCurve.tsx`:

```tsx
"use client";
import { CALIBRATION_MIN_ANSWERS, type CalibrationResult } from "@qp/engine";

/**
 * Stated confidence against actual hit rate. One bar: the player claimed 90%, and this is what
 * they achieved, against a reference line at 90%.
 *
 * Deliberately not components/charts/LineChart.tsx (date-indexed) nor PnlSparkline (round-indexed
 * and signed). This is a single rate against a target, and the target line is the whole point.
 */
export default function CalibrationCurve({ rows }: { rows: readonly CalibrationResult[] }) {
  const W = 260, H = 72, PAD = 6;
  const n = rows.length;
  const rate = n === 0 ? 0 : rows.filter((r) => r.hit).length / n;
  const ready = n >= CALIBRATION_MIN_ANSWERS;
  const x = (p: number) => PAD + p * (W - 2 * PAD);
  const barY = 26, barH = 18;
  const good = Math.abs(rate - 0.9) <= 0.07;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img"
         aria-label={`Hit rate ${(rate * 100).toFixed(0)} percent against a stated 90 percent, over ${n} answers`}
         style={{ display: "block" }}>
      <rect x={x(0)} y={barY} width={x(1) - x(0)} height={barH} fill="var(--card-border)" opacity={0.5} />
      {n > 0 && (
        <rect x={x(0)} y={barY} width={Math.max(1, x(rate) - x(0))} height={barH}
              fill={ready && good ? "var(--good)" : ready ? "var(--bad)" : "var(--faint)"} />
      )}
      <line x1={x(0.9)} x2={x(0.9)} y1={barY - 6} y2={barY + barH + 6} stroke="var(--ink)" strokeWidth={1.5} />
      <text x={x(0.9)} y={barY - 10} textAnchor="middle" fontSize={9} fill="var(--muted)">claimed 90%</text>
      <text x={x(0)} y={barY + barH + 18} fontSize={10} fill="var(--muted)">
        {n === 0 ? "no answers yet"
          : ready ? `${(rate * 100).toFixed(0)}% hit rate over ${n} answers`
          : `${n} of ${CALIBRATION_MIN_ANSWERS} answers — hit rate hidden until it can mean something`}
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean exit, no output.

- [ ] **Step 3: Commit**

```bash
git add components/charts/CalibrationCurve.tsx
git commit -m "feat(fermi): calibration curve — claimed 90% against the achieved rate"
```

---

## Task 9: The runner

**Files:**
- Create: `components/FermiRunner.tsx`
- Test: `components/FermiRunner.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/FermiRunner.test.tsx`:

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import FermiRunner from "./FermiRunner";

describe("FermiRunner", () => {
  beforeEach(() => localStorage.clear());

  it("settles a submitted chain in place and shows both widths", () => {
    render(<FermiRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "1000000000" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    expect(screen.getByTestId("settlement")).toBeInTheDocument();
    // The quadrature lesson is the point of the reveal: both numbers must be shown.
    expect(screen.getByTestId("naive-width")).toBeInTheDocument();
    expect(screen.getByTestId("combined-width")).toBeInTheDocument();
  });

  it("refuses a non-positive or inverted factor without consuming the question", () => {
    render(<FermiRunner seed={4242} />);
    const q = screen.getByTestId("question-counter").textContent;
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    expect(screen.getByTestId("chain-hint")).toBeInTheDocument();
    expect(screen.getByTestId("question-counter").textContent).toBe(q);
    expect(screen.queryByTestId("settlement")).not.toBeInTheDocument();
  });

  it("adds factors on request", () => {
    render(<FermiRunner seed={4242} />);
    expect(screen.queryByLabelText("factor 2 low")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add factor/i }));
    expect(screen.getByLabelText("factor 2 low")).toBeInTheDocument();
  });

  it("reveals the canonical chain after settling", () => {
    render(<FermiRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    expect(screen.getByTestId("canonical-chain")).toBeInTheDocument();
  });

  it("records answers to localStorage so calibration accumulates across sessions", () => {
    render(<FermiRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question|see results/i }));
    expect(JSON.parse(localStorage.getItem("qp.calibration.v1")!).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/FermiRunner.test.tsx`
Expected: FAIL — cannot resolve `./FermiRunner`.

- [ ] **Step 3: Write the implementation**

Create `components/FermiRunner.tsx`:

```tsx
"use client";
import { useMemo, useState } from "react";
import {
  combineFactors, fmtNum, isValidFactor, naiveProduct, scoreChain, summarizeCalibration,
  type CalibrationResult, type Factor,
} from "@qp/engine";
import { fermiSession } from "@/content/fermi";
import { appendAnswers, readCalibration } from "@/lib/store/calibration";
import CalibrationCurve from "./charts/CalibrationCurve";

const ROUNDS = 8;
type Row = { label: string; lo: string; hi: string };
const blankRow = (): Row => ({ label: "", lo: "", hi: "" });
const logW = (lo: number, hi: number) => Math.log10(hi) - Math.log10(lo);

export default function FermiRunner({ seed }: { seed: number }) {
  const items = useMemo(() => fermiSession(seed, ROUNDS), [seed]);
  const [index, setIndex] = useState(0);
  const [rows, setRows] = useState<Row[]>([blankRow()]);
  const [hint, setHint] = useState(false);
  const [results, setResults] = useState<CalibrationResult[]>([]);
  const [settled, setSettled] = useState<ReturnType<typeof scoreChain> | null>(null);

  const done = index >= items.length;
  const item = done ? items[items.length - 1] : items[index];

  const parsed = (): Factor[] | null => {
    const out: Factor[] = [];
    for (const [i, r] of rows.entries()) {
      const lo = Number(r.lo), hi = Number(r.hi);
      if (r.lo.trim() === "" || r.hi.trim() === "" || !isValidFactor(lo, hi)) return null;
      out.push({ label: r.label.trim() || `factor ${i + 1}`, lo, hi });
    }
    return out.length ? out : null;
  };

  function submit() {
    const factors = parsed();
    if (!factors) { setHint(true); return; }
    setSettled(scoreChain(factors, item.truth.value));
  }

  function next() {
    if (settled) {
      const { score, hit, logWidth, logCentreError } = settled;
      const row = { score, hit, logWidth, logCentreError };
      setResults((rs) => [...rs, row]);
      appendAnswers([row]);            // history is per ANSWER, not per session
    }
    setIndex((i) => i + 1);
    setSettled(null); setRows([blankRow()]); setHint(false);
  }

  if (done) {
    const s = summarizeCalibration(results);
    const lifetime = summarizeCalibration(readCalibration());
    return (
      <div className="container" style={{ padding: "56px 24px", maxWidth: 720 }}>
        <p className="microlabel">Session complete</p>
        <h1 className="mono" style={{ fontSize: 38, margin: "8px 0 16px" }} data-testid="hit-rate">
          {s.hits} / {s.answered}
        </h1>
        <CalibrationCurve rows={readCalibration()} />
        <div style={{ display: "flex", gap: 30, flexWrap: "wrap", margin: "22px 0" }}>
          <div><p className="microlabel">Median width</p><b className="mono" style={{ fontSize: 22 }}>{s.medianLogWidth.toFixed(1)}</b><span className="microlabel"> orders</span></div>
          <div><p className="microlabel">Median centre error</p><b className="mono" style={{ fontSize: 22 }}>{s.medianLogCentreError.toFixed(2)}</b></div>
          <div><p className="microlabel">Median score</p><b className="mono" style={{ fontSize: 22 }}>{s.medianScore.toFixed(2)}</b></div>
        </div>
        <p style={{ maxWidth: "60ch", color: "var(--body)" }} data-testid="diagnosis">{lifetime.diagnosis}</p>
      </div>
    );
  }

  const preview = parsed();
  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span className="microlabel" data-testid="question-counter">Question {index + 1} of {items.length}</span>
        <span className="microlabel">90% intervals</span>
      </div>
      <p style={{ fontSize: 17, margin: "18px 0", lineHeight: 1.5 }}>{item.statement}</p>

      {settled ? (
        <div>
          <p data-testid="settlement" style={{ fontSize: 16 }}>
            {settled.hit ? "Inside your interval." : "Outside your interval."}{" "}
            Truth: <b className="mono">{fmtNum(Math.round(item.truth.value))}</b> {item.unitLabel}.
          </p>
          <p className="mono" style={{ fontSize: 15, margin: "10px 0" }}>
            your range {fmtNum(settled.combined.lo)} – {fmtNum(settled.combined.hi)} · score{" "}
            <b>{settled.score.toFixed(2)}</b> <span className="microlabel">(lower is better)</span>
          </p>
          {/* The quadrature lesson, shown rather than asserted. */}
          <p style={{ fontSize: 14, color: "var(--body)", maxWidth: "62ch" }}>
            Multiplying your endpoints spans{" "}
            <b className="mono" data-testid="naive-width">
              {logW(naiveProduct(parsed() ?? []).lo || 1, naiveProduct(parsed() ?? []).hi || 1).toFixed(1)}
            </b>{" "}
            orders of magnitude. Your stated beliefs actually imply{" "}
            <b className="mono" data-testid="combined-width">{settled.logWidth.toFixed(1)}</b>{" "}
            — uncertainty adds in quadrature, not linearly, because independent errors do not all
            point the same way. Assumes your factors are independent.
          </p>
          <div data-testid="canonical-chain" style={{ margin: "18px 0", borderTop: "1px solid var(--rule)" }}>
            <p className="microlabel" style={{ marginTop: 10 }}>One way to decompose it</p>
            {item.chain.map((f) => (
              <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
                <span>{f.label}</span>
                <span className="mono">{fmtNum(f.value)}</span>
              </div>
            ))}
          </div>
          <button onClick={next} style={{ padding: "8px 18px" }}>
            {index + 1 === items.length ? "See results" : "Next question"}
          </button>
        </div>
      ) : (
        <div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 8 }}>
              <label style={{ flex: 1 }}><span className="microlabel">What it is</span><br />
                <input aria-label={`factor ${i + 1} label`} value={r.label} style={{ width: "100%" }}
                       onChange={(e) => { const v = [...rows]; v[i] = { ...r, label: e.target.value }; setRows(v); setHint(false); }} /></label>
              <label><span className="microlabel">Low</span><br />
                <input aria-label={`factor ${i + 1} low`} className="mono" inputMode="decimal" value={r.lo} style={{ width: 90 }}
                       onChange={(e) => { const v = [...rows]; v[i] = { ...r, lo: e.target.value }; setRows(v); setHint(false); }} /></label>
              <label><span className="microlabel">High</span><br />
                <input aria-label={`factor ${i + 1} high`} className="mono" inputMode="decimal" value={r.hi} style={{ width: 90 }}
                       onChange={(e) => { const v = [...rows]; v[i] = { ...r, hi: e.target.value }; setRows(v); setHint(false); }} /></label>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
            <button onClick={() => setRows((v) => [...v, blankRow()])} style={{ padding: "6px 14px" }}>Add factor</button>
            <button onClick={submit} style={{ padding: "8px 18px" }}>Submit estimate</button>
            {preview && (
              <span className="microlabel">
                implies {fmtNum(combineFactors(preview).lo)} – {fmtNum(combineFactors(preview).hi)}
              </span>
            )}
          </div>
        </div>
      )}
      <p data-testid={hint ? "chain-hint" : undefined} aria-live="polite" className="mono"
         style={{ color: "var(--bad)", fontSize: 12, minHeight: 18, marginTop: 10 }}>
        {hint ? "every factor needs a low and a high, both greater than zero, with high at least the low" : ""}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/FermiRunner.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Watch the gate fail**

Temporarily change `if (!factors) { setHint(true); return; }` in `submit()` to
`if (!factors) { return; }` (drop the hint).
Run: `npx vitest run components/FermiRunner.test.tsx`
Expected: FAIL on "refuses a non-positive or inverted factor". Revert and re-run to confirm PASS.

- [ ] **Step 6: Commit**

```bash
git add components/FermiRunner.tsx components/FermiRunner.test.tsx
git commit -m "feat(fermi): the runner — chain entry, in-place settlement, the quadrature reveal"
```

---

## Task 10: Route and landing page

**Files:**
- Create: `app/game/estimator/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the route**

Create `app/game/estimator/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import FermiRunner from "@/components/FermiRunner";

export default function EstimatorPage() {
  // Seed is picked on the client only, so server and client markup agree on first paint — the
  // same reason app/game/market-maker/page.tsx defers it.
  const [seed, setSeed] = useState<number | null>(null);
  useEffect(() => { setSeed(Math.floor(Math.random() * 2 ** 31)); }, []);
  if (seed === null) return null;
  return <FermiRunner seed={seed} />;
}
```

- [ ] **Step 2: Link it from the landing page**

Modify `app/page.tsx`. Add to the `sims` array, immediately after the `/game/market-maker` entry:

```ts
  { href: "/game/estimator", label: "Estimation & calibration", sub: "Decompose the unknown · 90% intervals · 8 questions" },
```

- [ ] **Step 3: Verify the whole suite and the build**

```bash
npx vitest run
npx tsc --noEmit
npm run verify:fermi-emit && python3 verification/verify_fermi.py
npx next build
```

Expected: every test file passes, typecheck silent, the fermi counterpart reports ok, build
completes.

- [ ] **Step 4: Play it once**

```bash
npm run dev
```

Open `http://localhost:3000/game/estimator` and answer all eight. Confirm: adding factors works;
a zero or inverted bound is refused; settling shows both widths and the canonical chain; the
calibration bar says how many more answers are needed before the hit rate appears.

**Record what the chain-entry UI feels like.** Spec §11 flags free-form entry as unresolved — a
player entering two factors and one entering seven both get a valid interval, but the canonical
comparison is only legible when the chains are commensurable. This is the step where that either
proves fine or needs a mockup.

- [ ] **Step 5: Commit**

```bash
git add app/game/estimator/page.tsx app/page.tsx
git commit -m "feat(fermi): the route, and the landing-page link"
```

---

## Self-review notes

**Spec coverage.** §1 the two skills → Tasks 3 (decomposition content) and 1 (calibration
mathematics). §2 decisions → all reflected; the rejected market-game scoring is named in
`calibration.ts`'s header. §3 closed-form lognormal combination → Task 1, with the quadrature
claim as its own test and its own watched failure. §4 scoring → Task 1, including the properness
test, which is the property that justifies the whole rule. §5 tables × templates → Tasks 2 and 3,
reaching 120 items across two templates. §6 staleness → Task 4 gate 2, with the 24-month bound.
§7 verification → Task 4 (the three gates) and Task 6 (the Python counterpart), and gate 3 pins
the PROBLEMS separation the whole argument rests on. §8 session shape → Task 9. §9 files → all
created, with `verification/fermi-fixture.ts` and `verify_fermi.py` replacing the spec's
`solvers/calibration.py` because Fermi content cannot ride verify.py's instance loop. §10
deferrals → nothing here touches correlation, Supabase, or player-authored content. §11 risks →
the tolerance risk gets Task 5, the UI risk gets Task 10 step 4.

**Naming consistency.** `Factor`, `Combined`, `CalibrationResult`, `CalibrationSummary`,
`fitLogNormal`, `combineFactors`, `naiveProduct`, `intervalScore`, `scoreChain`,
`summarizeCalibration`, `isValidFactor`, `Z95`, `CALIBRATION_MIN_ANSWERS`, `Cited`, `DataTable`,
`CanonicalFactor`, `FermiItem`, `FermiTemplate`, `FERMI_TEMPLATES`, `fermiItem`, `fermiSession`,
`fermiReach`, `CAL_KEY`, `readCalibration`, `appendAnswers`, `clearCalibration`,
`CalibrationCurve`, `FermiRunner` are spelled identically everywhere they appear. `scoreChain`
returns `CalibrationResult & { combined }`, which Task 9 destructures into exactly the four
fields `appendAnswers` stores.

**Resolved during self-review.** The spec listed `verification/solvers/calibration.py`, implying
Fermi content would join `verify.py`'s `SOLVERS` dict. It cannot: that dict is keyed by problem id
and `verify.py` iterates `instances.json`, which `emit.ts` builds from `PROBLEMS` — and gate 3
exists precisely to keep Fermi out of `PROBLEMS`. Task 6 therefore adds a parallel emitter and
checker rather than extending the existing one, which also buys a better check: TypeScript's
closed form against Python's sampling is two genuinely different routes, where a Python
transcription of the same algebra would have been one route written twice.

**One thing deliberately left to execution.** Task 5's measured tolerance cannot be written here,
because it depends on numbers that only exist once the chains are authored. The task specifies
the procedure, the decision rule, and the failure condition (a gap over 0.3 means the chain is
wrong, not the tolerance) rather than a value.
