// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { SessionState, Summary } from "@qp/engine";
import { saveRun } from "./useStore";
import type { ReviewRow } from "./types";

const preset = {
  id: "sequences-sprint", title: "t", topic: "sequences" as const, count: 5,
  durationS: 480, scoring: { correct: 1, wrong: -2, skip: 0 }, difficulty: () => 2 as const,
};
const seq = (id: string, family: string, difficulty: number) =>
  ({ id, topic: "sequences" as const, prompt: id, answer: 7, meta: { family, difficulty } });

const summary: Summary = { preset: "sequences-sprint", seed: 42, score: 1, correct: 1, wrong: 3, skipped: 1, timings: [1, 1, 1, 1, 1], total: 5 };

const state: SessionState = {
  preset, seed: 42,
  items: [
    seq("seq-fiblike-1_2_3", "fiblike", 2),      // missed
    seq("seq-fiblike-4_5_9", "fiblike", 2),      // missed, same family
    seq("seq-alt-ops-2_5_10", "alt-ops", 2),     // missed
    seq("seq-geometric-3_9_27", "geometric", 2), // correct
    seq("seq-quadratic-2_5_10", "quadratic", 2), // skipped
  ],
  index: 5,
  answers: [1, 1, 1, 7, null],
  grades: [false, false, false, true, false],
  timings: [1, 1, 1, 1, 1],
  finished: true,
};

describe("sim review intake", () => {
  beforeEach(() => localStorage.clear());

  it("queues one row per missed FAMILY, ignoring hits and skips", async () => {
    await saveRun(preset, summary, state);
    const queue: ReviewRow[] = JSON.parse(localStorage.getItem("qp.reviews.v1") ?? "[]");
    // Two fiblike misses collapse to one row; the hit and the skip contribute none.
    expect(queue.map((r) => r.problemId).sort()).toEqual(["seq-alt-ops-d2", "seq-fiblike-d2"]);
    expect(queue.every((r) => r.intervalDays === 1)).toBe(true);
  });

  it("queues nothing from an arithmetic sim", async () => {
    const arith = { ...preset, topic: "arithmetic" as const };
    const arithState: SessionState = {
      ...state, preset: arith,
      items: state.items.map((i) => ({ ...i, topic: "arithmetic" as const, meta: { op: "mul" } })),
    };
    await saveRun(arith, summary, arithState);
    expect(localStorage.getItem("qp.reviews.v1")).toBeNull();
  });
});
