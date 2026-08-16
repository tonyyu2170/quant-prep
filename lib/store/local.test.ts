// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStore } from "./local";
import { planMerge } from "./merge";
import type { AttemptRow, TestSessionRow } from "./types";

const attempt = (over: Partial<AttemptRow> = {}): AttemptRow => ({
  problemId: "arith-1", problemVersion: 1, seed: 42, mode: "test",
  topic: "arithmetic", answer: "12", correct: true, timeMs: 4000,
  sessionId: "s1", createdAt: new Date().toISOString(), ...over,
});

describe("LocalStore", () => {
  beforeEach(() => localStorage.clear());
  it("round-trips attempts and sessions", async () => {
    const store = new LocalStore();
    await store.saveAttempts([attempt(), attempt({ problemId: "arith-2" })]);
    expect(await store.listAttempts()).toHaveLength(2);
    const session: TestSessionRow = { id: "s1", preset: "optiver-80in8", score: 41, correct: 45, wrong: 2, skipped: 33, durationS: 480, timings: [1000], createdAt: new Date().toISOString() };
    await store.saveSession(session);
    expect(await store.listSessions()).toHaveLength(1);
  });
  it("caps stored attempts at 5000 most recent", async () => {
    const store = new LocalStore();
    await store.saveAttempts(Array.from({ length: 5100 }, (_, i) => attempt({ problemId: `p${i}` })));
    expect(await store.listAttempts()).toHaveLength(5000);
  });
});

describe("planMerge", () => {
  it("flags every merged row as mergedFromLocal (never rankable, spec §7)", () => {
    const plan = planMerge([attempt()], [{ id: "s1", preset: "optiver-80in8", score: 41, correct: 45, wrong: 2, skipped: 33, durationS: 480, timings: [], createdAt: new Date().toISOString() }]);
    expect(plan.attempts.every((a) => a.mergedFromLocal)).toBe(true);
    expect(plan.sessions.every((s) => s.mergedFromLocal)).toBe(true);
  });
});
