import { describe, expect, it } from "vitest";
import { EASE_MAX, EASE_MIN, EASE_START, INTERVAL_MAX_DAYS, enqueue, review, type ReviewRow } from "../src/srs";

const NOW = new Date("2026-08-22T12:00:00.000Z");
const days = (a: string, b: Date) => (Date.parse(a) - b.getTime()) / 86_400_000;
const row = (over: Partial<ReviewRow> = {}): ReviewRow =>
  ({ problemId: "bayes/two-coins", dueAt: NOW.toISOString(), intervalDays: 1, ease: EASE_START, ...over });

describe("enqueue", () => {
  it("makes a new problem due immediately at interval 1", () => {
    const r = enqueue("bayes/two-coins", NOW);
    expect(r).toEqual({ problemId: "bayes/two-coins", dueAt: NOW.toISOString(), intervalDays: 1, ease: EASE_START });
  });

  it("resets an existing row's schedule but keeps its earned ease", () => {
    const r = enqueue("bayes/two-coins", NOW, row({ intervalDays: 12, ease: 1.9, dueAt: "2026-09-30T00:00:00.000Z" }));
    expect(r.intervalDays).toBe(1);
    expect(r.dueAt).toBe(NOW.toISOString());
    expect(r.ease).toBe(1.9); // a miss in practice is not a review grade — ease only moves in review()
  });
});

describe("review", () => {
  it("lengthens the interval and raises ease when correct", () => {
    const r = review(row(), true, NOW);
    expect(r.intervalDays).toBe(3); // round(1 x 2.5)
    expect(r.ease).toBeCloseTo(2.55, 10);
    expect(days(r.dueAt, NOW)).toBe(3);
  });

  it("collapses the interval to 1 day and drops ease when wrong", () => {
    const r = review(row({ intervalDays: 21, ease: 2.5 }), false, NOW);
    expect(r.intervalDays).toBe(1);
    expect(r.ease).toBeCloseTo(2.3, 10);
    expect(days(r.dueAt, NOW)).toBe(1);
  });

  // Mutation guard: passes only if the correct/wrong branches are the right way round.
  // A swapped or sign-flipped implementation schedules the miss LATER than the hit and fails here.
  it("always schedules a miss sooner than a hit from the same state", () => {
    for (const start of [row(), row({ intervalDays: 9, ease: 1.4 }), row({ intervalDays: 40, ease: 2.8 })]) {
      const hit = review(start, true, NOW);
      const miss = review(start, false, NOW);
      expect(Date.parse(miss.dueAt)).toBeLessThan(Date.parse(hit.dueAt));
      expect(miss.intervalDays).toBeLessThan(hit.intervalDays);
      expect(miss.ease).toBeLessThan(hit.ease);
    }
  });

  it("grows the interval on every hit even at the ease floor, where rounding alone would stall", () => {
    // round(1 x 1.3) === 1: without the +1 guard a floored-ease problem is due daily forever.
    const r = review(row({ intervalDays: 1, ease: EASE_MIN }), true, NOW);
    expect(r.intervalDays).toBeGreaterThan(1);
  });

  it("clamps ease to its band under repeated grading", () => {
    let up = row();
    for (let i = 0; i < 40; i++) up = review(up, true, NOW);
    expect(up.ease).toBe(EASE_MAX);

    let down = row();
    for (let i = 0; i < 40; i++) down = review(down, false, NOW);
    expect(down.ease).toBe(EASE_MIN);
  });

  it("keeps the problem id untouched", () => {
    expect(review(row(), true, NOW).problemId).toBe("bayes/two-coins");
  });
});

describe("interval cap", () => {
  it("saturates rather than overflowing the date or the int4 column", () => {
    let r = row();
    for (let i = 0; i < 60; i++) r = review(r, true, NOW);
    expect(r.intervalDays).toBe(INTERVAL_MAX_DAYS);
    expect(Number.isFinite(Date.parse(r.dueAt))).toBe(true);
  });
});
