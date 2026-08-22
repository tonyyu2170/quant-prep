import { describe, expect, it } from "vitest";
import { weave, type Benchmark, type LeaderboardRow } from "./leaderboard";

const row = (rank: number, score: number): LeaderboardRow => ({ rank, handle: `t${rank}`, score, played_on: "2026-01-01" });
const mark = (label: string, value: number): Benchmark => ({ label, value, source: "src", note: null });

describe("weave", () => {
  it("drops a threshold directly above the first score below it", () => {
    const items = weave([row(1, 60), row(2, 55), row(3, 40)], [mark("invite", 50)]);
    expect(items.map((i) => (i.kind === "row" ? i.row.score : `≤${i.benchmark.value}`)))
      .toEqual([60, 55, "≤50", 40]);
  });

  it("puts a threshold nobody cleared at the top", () => {
    const items = weave([row(1, 20)], [mark("invite", 55)]);
    expect(items[0].kind).toBe("benchmark");
  });

  it("puts a threshold everybody cleared at the bottom", () => {
    const items = weave([row(1, 60), row(2, 58)], [mark("invite", 55)]);
    expect(items.at(-1)).toEqual({ kind: "benchmark", benchmark: mark("invite", 55) });
  });

  it("orders several thresholds high to low regardless of input order", () => {
    const items = weave([row(1, 70), row(2, 45), row(3, 10)], [mark("low", 20), mark("high", 55)]);
    expect(items.map((i) => (i.kind === "row" ? i.row.score : i.benchmark.label)))
      .toEqual([70, "high", 45, "low", 10]);
  });

  // A benchmark rendered as a player row would be a fabricated competitor (parent spec §7).
  it("never gives a benchmark a handle or a rank", () => {
    for (const item of weave([row(1, 60)], [mark("invite", 55)])) {
      if (item.kind === "benchmark") expect(item).not.toHaveProperty("row");
    }
  });

  it("keeps every row exactly once", () => {
    const rows = [row(1, 60), row(1, 60), row(3, 12)];
    expect(weave(rows, [mark("a", 55), mark("b", 30)]).filter((i) => i.kind === "row")).toHaveLength(3);
  });
});
