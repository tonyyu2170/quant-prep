import { describe, expect, it } from "vitest";
import { answerOf, drawParams } from "@qp/engine";
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
  it("bayes batch hits the 12/12/6 difficulty distribution", () => {
    const bayes = PROBLEMS.filter((t) => t.id.startsWith("bayes/"));
    expect(bayes.length).toBe(30);
    expect(bayes.filter((t) => t.difficulty === 1).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 2).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 3).length).toBe(6);
  });
});
