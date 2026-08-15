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
  it("summarize stays coherent when the timer expires mid-session", () => {
    let s = startSession(preset, items, 7);
    s = answerCurrent(s, 4, 100);
    const sum = summarize({ ...s, finished: true });
    expect(sum).toMatchObject({ score: 1, correct: 1, wrong: 0, skipped: 0, total: 1 });
    expect(sum.correct + sum.wrong + sum.skipped).toBe(sum.total);
  });
  it("terminates gracefully when items are fewer than preset.count", () => {
    let s = startSession(preset, items.slice(0, 2), 1);
    s = answerCurrent(s, 4, 10);
    s = answerCurrent(s, 6, 10);
    expect(s.finished).toBe(true);
    expect(answerCurrent(s, 1, 10)).toBe(s);
    expect(summarize(s).total).toBe(2);
  });
  it("starts finished when count is 0", () => {
    const s = startSession({ ...preset, count: 0 }, items, 1);
    expect(s.finished).toBe(true);
    expect(skipCurrent(s, 1)).toBe(s);
  });
  it("treats answer 0 as an answer, not a skip", () => {
    const zeroItems: Item[] = [{ id: "z", topic: "arithmetic", prompt: "5 − 5", answer: 0, meta: {} }];
    let s = startSession({ ...preset, count: 1 }, zeroItems, 1);
    s = answerCurrent(s, 0, 10);
    expect(summarize(s)).toMatchObject({ correct: 1, skipped: 0 });
  });
  it("applies a nonzero skip penalty via preset scoring", () => {
    const p: Preset = { ...preset, scoring: { correct: 1, wrong: -2, skip: -1 } };
    let s = startSession(p, items, 1);
    s = skipCurrent(s, 5); s = skipCurrent(s, 5); s = skipCurrent(s, 5);
    expect(summarize(s).score).toBe(-3);
  });
  it("skipCurrent after finish returns the identical reference", () => {
    let s = startSession(preset, items, 1);
    s = skipCurrent(s, 1); s = skipCurrent(s, 1); s = skipCurrent(s, 1);
    expect(skipCurrent(s, 1)).toBe(s);
  });
});
