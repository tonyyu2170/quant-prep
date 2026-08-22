// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { LocalStore } from "./local";
import { mergeReviews, planMerge } from "./merge";
import type { AttemptRow, ReviewRow, TestSessionRow } from "./types";

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
  it("treats non-array junk in storage as empty and does not corrupt subsequent saves", async () => {
    localStorage.setItem("qp.attempts.v1", '"hello"');
    const store = new LocalStore();
    expect(await store.listAttempts()).toEqual([]);
    await store.saveAttempts([attempt()]);
    const rows = await store.listAttempts();
    expect(rows).toHaveLength(1);
    expect(rows[0].problemId).toBe("arith-1");
  });
  it("clear removes both attempts and sessions", async () => {
    const store = new LocalStore();
    await store.saveAttempts([attempt()]);
    await store.saveSession({ id: "s9", preset: "optiver-80in8", score: 1, correct: 1, wrong: 0, skipped: 0, durationS: 480, timings: [], createdAt: new Date().toISOString() });
    await store.clear();
    expect(await store.listAttempts()).toEqual([]);
    expect(await store.listSessions()).toEqual([]);
  });
});

describe("planMerge", () => {
  it("flags every merged row as mergedFromLocal (never rankable, spec §7)", () => {
    const plan = planMerge([attempt()], [{ id: "s1", preset: "optiver-80in8", score: 41, correct: 45, wrong: 2, skipped: 33, durationS: 480, timings: [], createdAt: new Date().toISOString() }]);
    expect(plan.attempts.every((a) => a.mergedFromLocal)).toBe(true);
    expect(plan.sessions.every((s) => s.mergedFromLocal)).toBe(true);
  });
});

describe("LocalStore review queue", () => {
  beforeEach(() => localStorage.clear());

  it("upserts by problemId rather than appending duplicates", async () => {
    const store = new LocalStore();
    await store.saveReview({ problemId: "bayes/two-coins", dueAt: "2026-08-22T00:00:00.000Z", intervalDays: 1, ease: 2.5 });
    await store.saveReview({ problemId: "bayes/two-coins", dueAt: "2026-08-25T00:00:00.000Z", intervalDays: 3, ease: 2.55 });
    await store.saveReview({ problemId: "counting/handshakes", dueAt: "2026-08-23T00:00:00.000Z", intervalDays: 1, ease: 2.5 });
    const rows = await store.listReviews();
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.problemId === "bayes/two-coins")!.intervalDays).toBe(3);
  });

  it("removes a single problem and leaves the rest queued", async () => {
    const store = new LocalStore();
    await store.saveReview({ problemId: "a", dueAt: "2026-08-22T00:00:00.000Z", intervalDays: 1, ease: 2.5 });
    await store.saveReview({ problemId: "b", dueAt: "2026-08-22T00:00:00.000Z", intervalDays: 1, ease: 2.5 });
    await store.removeReview("a");
    expect((await store.listReviews()).map((r) => r.problemId)).toEqual(["b"]);
  });

  it("clear empties the queue along with attempts and sessions", async () => {
    const store = new LocalStore();
    await store.saveReview({ problemId: "a", dueAt: "2026-08-22T00:00:00.000Z", intervalDays: 1, ease: 2.5 });
    await store.clear();
    expect(await store.listReviews()).toEqual([]);
  });
});

describe("mergeReviews", () => {
  const r = (problemId: string, dueAt: string): ReviewRow => ({ problemId, dueAt, intervalDays: 1, ease: 2.5 });

  it("carries over queue entries the remote does not have", () => {
    expect(mergeReviews([r("a", "2026-08-22T00:00:00.000Z")], [])).toHaveLength(1);
  });

  it("keeps the earlier due date and writes nothing when the remote is already sooner", () => {
    const local = [r("a", "2026-08-20T00:00:00.000Z"), r("b", "2026-09-01T00:00:00.000Z")];
    const remote = [r("a", "2026-08-30T00:00:00.000Z"), r("b", "2026-08-25T00:00:00.000Z")];
    // "a": local is sooner, so it wins. "b": remote is already sooner, so it is left alone.
    expect(mergeReviews(local, remote).map((x) => x.problemId)).toEqual(["a"]);
  });

  // A grade parked locally by a failed remote write is deliberately due LATER than the stale
  // remote row it replaces. Reconciling it by "earlier due date wins" silently discards the
  // grade and local.clear() then deletes it — the problem stays due forever.
  it("keeps a grade parked by a failed remote write, though it is due later than the stale row", () => {
    const graded: ReviewRow = { problemId: "a", dueAt: "2026-08-25T00:00:00.000Z", intervalDays: 3, ease: 2.55, pending: true };
    expect(mergeReviews([graded], [r("a", "2026-08-22T00:00:00.000Z")])).toEqual([graded]);
  });

  it("never duplicates a problem already queued at the same instant", () => {
    const same = "2026-08-22T00:00:00.000Z";
    expect(mergeReviews([r("a", same)], [r("a", same)])).toEqual([]);
  });
});
