import { describe, expect, it } from "vitest";
import { FERMI_TEMPLATES, fermiReach, fermiSession } from ".";
import { MF21_GASOLINE, US_STATES, VM2_VEHICLE_MILES } from "./tables/us-states";
import { PROBLEMS } from "../problems";
import type { DataTable } from "./types";

/**
 * MEASURED, not chosen for comfort. `npx tsx tools/fermi-crosscheck.ts` over all 100 items
 * (2 templates x 50 states) gives worst |gap| 0.2005 for gasoline (Alabama) and 0.2306 for
 * vehicle-miles (Wyoming); 50/50 of each are within 0.25. Task 4's rule is 1.5x the worst gap
 * rounded to one decimal: 1.5 x 0.2306 = 0.3458 -> 0.30.
 *
 * Sized against the catch it has to make. A rate wrong by a factor of 2 shifts every row by
 * exactly 0.301, and at this tolerance that fails 20/50 gasoline rows and 19/50 vehicle-miles
 * rows — a landslide, not a squeaker. The alternatives were measured too: 0.25 leaves only 8%
 * headroom over the worst observed gap, so a routine data refresh would turn CI red; 0.40 thins
 * the catch to 3/50 and 6/50. Full table in docs/research/fermi-2026-08/sources.md §5.
 *
 * The residual gaps are real geography, not error: New York is the largest positive on both
 * templates (dense, transit-served, fewer miles per head than the national average) and Alabama
 * and Wyoming the largest negatives (rural, high miles per head).
 */
const CROSS_CHECK_TOLERANCE_LOG10 = 0.3;

/** Gated on the data's VINTAGE, not on when we last opened the page — re-reading a 2018 table in
 *  2026 does not make it fresh. 10 years: a state growing at a fast 2.5%/yr drifts 28% over a
 *  decade = 0.107 log10, about a third of the cross-check tolerance, which is where the drift
 *  starts to matter. This WILL turn CI red one day with no code change; that is the point of a
 *  staleness gate. The failure message says what to do about it. */
const MAX_DATA_AGE_YEARS = 10;

const TABLES: DataTable<unknown>[] = [US_STATES, MF21_GASOLINE, VM2_VEHICLE_MILES];

describe("gate 1: chains cross-check against an independently published total", () => {
  // The analogue of verify.py's two-route rule. The chain is one route — registration counts and
  // travel-model rates from FHWA Table VM-1. The truth is a different one — fuel-TAX RECEIPTS in
  // MF-21, traffic COUNTS in VM-2. Two measurement processes agreeing is evidence; a chain
  // agreeing with itself is not, which is why `truth` is never computed from `chain`.
  //
  // DO NOT WIDEN THIS TOLERANCE TO MAKE A FAILURE GO AWAY. That is the single move this gate
  // exists to prevent. Re-run tools/fermi-crosscheck.ts, fix the chain, or record honestly that
  // the two sources disagree and by how much.
  for (const t of FERMI_TEMPLATES) {
    it(`${t.id}: every row's chain reproduces its published figure`, () => {
      for (let i = 0; i < t.count; i++) {
        const item = t.itemAt(i);
        const chain = item.chain.reduce((a, f) => a * f.value, 1);
        const gap = Math.abs(Math.log10(chain) - Math.log10(item.truth.value));
        expect(
          gap,
          `${item.id}: chain gives ${chain.toPrecision(4)}, published ${item.truth.value.toPrecision(4)}, ${gap.toFixed(3)} log10 apart`,
        ).toBeLessThan(CROSS_CHECK_TOLERANCE_LOG10);
      }
    });
  }
});

describe("gate 2: citation PRESENCE (not truth — see Task 0)", () => {
  // This gate cannot tell a real source from an invented one. It catches the empty field, the
  // unparseable date, the stale vintage and the hand-edited row. Whether the numbers are true
  // is established once, by retrieval, in docs/research/fermi-2026-08/sources.md.
  const ageYears = (iso: string) => (Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24 * 365.25);

  for (const table of TABLES) {
    it(`${table.id} names a source, a retrieval date and a vintage, and the vintage is not stale`, () => {
      expect(table.source.length).toBeGreaterThan(10);
      expect(Number.isFinite(Date.parse(table.retrievedAt))).toBe(true);
      expect(Number.isFinite(Date.parse(table.vintage))).toBe(true);
      expect(
        ageYears(table.vintage),
        `${table.id} data is over ${MAX_DATA_AGE_YEARS} years old — re-retrieve from ${table.source}, ` +
        `update the rows and the vintage, then re-run tools/fermi-crosscheck.ts and re-measure the tolerance`,
      ).toBeLessThan(MAX_DATA_AGE_YEARS);
    });
  }

  it("the state table is ordered by population descending — an out-of-order row means a hand edit", () => {
    // Cheapest available signal that a value was changed in isolation rather than taken from one
    // pass of one source. The draft this design replaces had 11 such rows.
    for (let i = 1; i < US_STATES.rows.length; i++) {
      const prev = US_STATES.rows[i - 1], cur = US_STATES.rows[i];
      expect(cur.population, `${cur.name} (${cur.population}) sorts above ${prev.name} (${prev.population})`)
        .toBeLessThanOrEqual(prev.population);
    }
  });

  it("the three tables cover exactly the same states — a join that drops a row is silent", () => {
    // Tennessee is written "Tennessee (2)" in VM-2. The un-normalised join produced a 49-row
    // table that still called itself 50, and nothing downstream noticed.
    const names = US_STATES.rows.map((r) => r.name);
    expect(names.length).toBe(50);
    expect(new Set(names).size).toBe(50);
    expect(MF21_GASOLINE.rows.map((r) => r.state).sort()).toEqual([...names].sort());
    expect(VM2_VEHICLE_MILES.rows.map((r) => r.state).sort()).toEqual([...names].sort());
  });

  it("every authored rate in every chain carries a source, a date and a vintage", () => {
    for (const t of FERMI_TEMPLATES) {
      for (let i = 0; i < t.count; i++) {
        const item = t.itemAt(i);
        for (const f of item.chain) {
          // A factor either reads from a table (no cite of its own) or cites its own source.
          if (!f.cite) continue;
          expect(f.cite.source.length, `${item.id}: "${f.label}" has an empty source`).toBeGreaterThan(10);
          expect(Number.isFinite(Date.parse(f.cite.retrievedAt)), `${item.id}: "${f.label}" has no valid date`).toBe(true);
          // DELIBERATE: rate vintages are parsed for validity but NOT age-gated, unlike the
          // tables'. A rate may have no fresher edition, and failing CI over a figure that
          // nothing can replace would just teach people to bump the date. The tables are the
          // numbers that move and are replaceable, so they are the ones on a clock.
          expect(Number.isFinite(Date.parse(f.cite.vintage)), `${item.id}: "${f.label}" has no valid vintage`).toBe(true);
        }
        expect(item.truth.source.length, `${item.id}: truth has no source`).toBeGreaterThan(10);
      }
    }
  });

  it("every factor is a positive finite number — logs require it, and a placeholder 0 is not one", () => {
    // Also the gate that catches a placeholder literal surviving into a commit.
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
    // 50 states x 2 templates = 100. The plan's floor was 60 for two templates.
    expect(fermiReach()).toBeGreaterThanOrEqual(60);
    const s = fermiSession(4242, 8);
    expect(s.length).toBe(8);
    expect(new Set(s.map((i) => i.id)).size).toBe(8);
  });

  it("is deterministic in the seed", () => {
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
