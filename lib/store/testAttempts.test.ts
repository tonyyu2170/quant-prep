import { describe, expect, it } from "vitest";
import type { SessionState } from "@qp/engine";
import { attemptRowsFromSession } from "./testAttempts";

const preset = {
  id: "optiver-80in8", title: "t", topic: "arithmetic" as const, count: 3,
  durationS: 480, scoring: { correct: 1, wrong: -2, skip: 0 }, difficulty: () => 1 as const,
};
const item = (id: string) => ({ id, topic: "arithmetic" as const, prompt: id, answer: 7, meta: {} });

// 3 progressed questions: correct answer, wrong answer, skip.
const state: SessionState = {
  preset, seed: 42,
  items: [item("a:1"), item("a:2"), item("a:3")],
  index: 3,
  answers: [7, 5, null],
  grades: [true, false, false],
  timings: [1200, 3400, 900],
  finished: true,
};

describe("attemptRowsFromSession", () => {
  it("maps answered questions to AttemptRows and drops skips", () => {
    const rows = attemptRowsFromSession(state, "sess-1", "2026-08-16T12:00:00.000Z");
    expect(rows).toEqual([
      {
        problemId: "a:1", problemVersion: 1, seed: 42, mode: "test", topic: "arithmetic",
        answer: "7", correct: true, timeMs: 1200, sessionId: "sess-1",
        createdAt: "2026-08-16T12:00:00.000Z",
      },
      {
        problemId: "a:2", problemVersion: 1, seed: 42, mode: "test", topic: "arithmetic",
        answer: "5", correct: false, timeMs: 3400, sessionId: "sess-1",
        createdAt: "2026-08-16T12:00:00.000Z",
      },
    ]);
  });
  it("returns [] when every question was skipped", () => {
    const allSkipped: SessionState = { ...state, answers: [null, null, null], grades: [false, false, false] };
    expect(attemptRowsFromSession(allSkipped, "sess-1", "2026-08-16T12:00:00.000Z")).toEqual([]);
  });
});
