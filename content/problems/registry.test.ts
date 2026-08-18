import { describe, expect, it } from "vitest";
import { answerOf, drawParams, grade } from "@qp/engine";
import { PROBLEMS, byId, problemsFor } from "./index";

describe("problem registry invariants", () => {
  it("has unique ids and topic-prefixed ids", () => {
    expect(new Set(PROBLEMS.map((t) => t.id)).size).toBe(PROBLEMS.length);
    for (const t of PROBLEMS) expect(t.topic.startsWith("probability/")).toBe(true);
  });
  it("every problem draws, derives, and answers finitely across 50 seeds", () => {
    for (const t of PROBLEMS) {
      for (let seed = 0; seed < 50; seed++) {
        const p = drawParams(t, seed);
        const d = t.derived(p);
        expect(Object.keys(d)).toContain(t.answerKey);
        expect(Number.isFinite(answerOf(t, d))).toBe(true);
        expect(t.statement(p, d).length).toBeGreaterThan(20);
        expect(t.solution(p, d).length).toBeGreaterThanOrEqual(3);
        expect(t.expectedPaceS).toBeGreaterThan(0);
      }
    }
  });
  it("filters by topic and difficulty", () => {
    const bayes = problemsFor("probability/bayes").length;
    const counting = problemsFor("probability/counting").length;
    expect(bayes).toBe(30);
    expect(bayes + counting).toBe(PROBLEMS.length);
    expect(problemsFor("probability/bayes", 1).every((t) => t.difficulty === 1)).toBe(true);
    expect(problemsFor("probability/counting", 1).every((t) => t.difficulty === 1)).toBe(true);
    expect(byId.get("bayes/base-rate-test")).toBeDefined();
    expect(byId.get("counting/committee-selection")).toBeDefined();
  });
  it("counting batch hits the 10/10/5 difficulty distribution", () => {
    const counting = PROBLEMS.filter((t) => t.id.startsWith("counting/"));
    expect(counting.length).toBe(25);
    expect(counting.filter((t) => t.difficulty === 1).length).toBe(10);
    expect(counting.filter((t) => t.difficulty === 2).length).toBe(10);
    expect(counting.filter((t) => t.difficulty === 3).length).toBe(5);
  });
  it("exact-count problems grade strictly from their own tolerance object", () => {
    // {abs: 0} is the only strict-equality path in the corpus and it reaches grade()
    // straight off the template, so pin it against real templates rather than a
    // synthetic tolerance: one off the true count must fail.
    const exact = PROBLEMS.filter((t) => t.accepted.tolerance.abs === 0);
    expect(exact.length).toBe(15);
    for (const t of exact) {
      for (let seed = 0; seed < 5; seed++) {
        const answer = answerOf(t, t.derived(drawParams(t, seed)));
        expect(grade(answer, answer, t.accepted.tolerance)).toBe(true);
        expect(grade(answer + 1, answer, t.accepted.tolerance)).toBe(false);
        expect(grade(answer - 1, answer, t.accepted.tolerance)).toBe(false);
      }
    }
  });
  it("counting batch splits 15 exact counts / 10 probabilities", () => {
    const counting = PROBLEMS.filter((t) => t.id.startsWith("counting/"));
    expect(counting.filter((t) => t.accepted.tolerance.abs === 0).length).toBe(15);
    expect(counting.filter((t) => t.accepted.tolerance.rel === 0.005).length).toBe(10);
  });
  it("bayes batch hits the 12/12/6 difficulty distribution", () => {
    const bayes = PROBLEMS.filter((t) => t.id.startsWith("bayes/"));
    expect(bayes.length).toBe(30);
    expect(bayes.filter((t) => t.difficulty === 1).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 2).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 3).length).toBe(6);
  });
});
