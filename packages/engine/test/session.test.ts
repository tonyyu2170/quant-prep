import { describe, expect, it } from "vitest";
import { startSession, answerCurrent, skipCurrent, summarize } from "../src/session";
import type { Item, Preset } from "../src/types";

const preset: Preset = {
  id: "t", title: "T", topic: "arithmetic", count: 3, durationS: 60,
  scoring: { correct: 1, wrong: -2, skip: 0 }, difficulty: () => 1,
};
const items: Item[] = [
  { id: "1", topic: "arithmetic", prompt: "2 + 2", answer: 4, meta: {} },
  { id: "2", topic: "arithmetic", prompt: "3 + 3", answer: 6, meta: {} },
  { id: "3", topic: "arithmetic", prompt: "5 + 5", answer: 10, meta: {} },
];

describe("timed session", () => {
  it("advances only forward and grades with +1/−2/0", () => {
    let s = startSession(preset, items, 42);
    s = answerCurrent(s, 4, 1200);     // correct
    s = answerCurrent(s, 99, 800);     // wrong
    s = skipCurrent(s, 300);           // skip
    expect(s.finished).toBe(true);
    const sum = summarize(s);
    expect(sum).toMatchObject({ preset: "t", score: -1, correct: 1, wrong: 1, skipped: 1, seed: 42 });
    expect(sum.timings).toEqual([1200, 800, 300]);
  });
  it("ignores input after finish", () => {
    let s = startSession(preset, items, 1);
    s = skipCurrent(s, 1); s = skipCurrent(s, 1); s = skipCurrent(s, 1);
    const done = s;
    expect(answerCurrent(done, 4, 1)).toBe(done);
  });
  it("records per-question grades in order", () => {
    let s = startSession(preset, items, 1);
    s = answerCurrent(s, 4, 10); s = answerCurrent(s, 6, 10); s = answerCurrent(s, 1, 10);
    expect(s.grades).toEqual([true, true, false]);
  });
});
