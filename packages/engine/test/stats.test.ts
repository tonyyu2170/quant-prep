import { describe, expect, it } from "vitest";
import { accuracySeries, paceSeries, topicAccuracy, bestScoreSeries, currentStreak, type AttemptLike, type SessionLike } from "../src/stats";

const day = (d: string) => new Date(d + "T12:00:00Z").toISOString();
const attempts: AttemptLike[] = [
  { topic: "arithmetic", correct: true,  timeMs: 5000, createdAt: day("2026-08-01") },
  { topic: "arithmetic", correct: false, timeMs: 7000, createdAt: day("2026-08-01") },
  { topic: "sequences",  correct: true,  timeMs: 9000, createdAt: day("2026-08-02") },
  { topic: "arithmetic", correct: true,  timeMs: 4000, createdAt: day("2026-08-03") },
];

describe("stats aggregations", () => {
  it("accuracySeries buckets by day", () => {
    expect(accuracySeries(attempts)).toEqual([
      { date: "2026-08-01", value: 50, n: 2 },
      { date: "2026-08-02", value: 100, n: 1 },
      { date: "2026-08-03", value: 100, n: 1 },
    ]);
  });
  it("paceSeries averages seconds per question per day", () => {
    expect(paceSeries(attempts)[0]).toEqual({ date: "2026-08-01", value: 6, n: 2 });
  });
  it("topicAccuracy splits by topic", () => {
    expect(topicAccuracy(attempts)).toEqual({ arithmetic: { pct: 66.7, n: 3 }, sequences: { pct: 100, n: 1 } });
  });
  it("bestScoreSeries returns per-session scores for a preset in date order", () => {
    const sessions: SessionLike[] = [
      { preset: "optiver-80in8", score: 41, createdAt: day("2026-08-02") },
      { preset: "optiver-80in8", score: 47, createdAt: day("2026-08-05") },
      { preset: "sequences-sprint", score: 12, createdAt: day("2026-08-03") },
    ];
    expect(bestScoreSeries(sessions, "optiver-80in8").map((s) => s.score)).toEqual([41, 47]);
  });
  it("currentStreak counts consecutive active days ending today", () => {
    const today = "2026-08-15";
    expect(currentStreak(["2026-08-13", "2026-08-14", "2026-08-15"], today)).toBe(3);
    expect(currentStreak(["2026-08-12", "2026-08-14"], today)).toBe(0);
    expect(currentStreak([], today)).toBe(0);
  });
});
