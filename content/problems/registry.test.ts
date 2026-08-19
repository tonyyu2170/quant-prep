import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
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
    const ev = problemsFor("probability/ev-variance").length;
    const distributions = problemsFor("probability/distributions").length;
    expect(bayes).toBe(30);
    expect(counting).toBe(25);
    expect(ev).toBe(30);
    expect(bayes + counting + ev + distributions).toBe(PROBLEMS.length);
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
  it("ev-variance stays inside its 12/12/6 difficulty budget", () => {
    // An upper bound, not the equality — Task 5 adds the exact pins when the batch closes.
    // The budget has zero slack: L1 is already closed at 12, and Task 4's seven L2 plus
    // Task 5's one L2 and six L3 fit it exactly. Without this, a misassignment in Task 4
    // surfaces only at Task 5's pin, with fourteen problems already written.
    const ev = PROBLEMS.filter((t) => t.id.startsWith("ev-variance/"));
    expect(ev.filter((t) => t.difficulty === 1).length).toBeLessThanOrEqual(12);
    expect(ev.filter((t) => t.difficulty === 2).length).toBeLessThanOrEqual(12);
    expect(ev.filter((t) => t.difficulty === 3).length).toBeLessThanOrEqual(6);
    expect(ev.length).toBeLessThanOrEqual(30);
  });
  it("a module-level helper exists only if constraint reaches it", () => {
    // Constraint 2 licenses a module-local helper for exactly one reason: `constraint` never
    // sees `derived` (packages/engine/src/problem.ts:24), so pinning an answer floor would
    // otherwise mean typing the answer formula twice. Where `constraint` is a structural
    // rejection that never asks the answer, a helper is a second copy of the formula for
    // nothing — and Task 3 shipped two whose comments claimed a double use their code did not
    // have. Reachability is transitive: max-of-two-dice's `topNumerOf` is reached through
    // `evOf`, and sum-of-bets-variance's `varLeg` through `totalVarOf`.
    let checked = 0;
    for (const topic of readdirSync("content/problems", { withFileTypes: true }).filter((d) => d.isDirectory())) {
      for (const file of readdirSync(join("content/problems", topic.name)).filter((f) => f.endsWith(".ts"))) {
        const src = readFileSync(join("content/problems", topic.name, file), "utf8");
        const helpers = [...src.matchAll(/^const (\w+)\s*=/gm)].map((m) => m[1]);
        if (!helpers.length) continue;
        checked += helpers.length;
        const constraintSrc = (src.match(/^\s*constraint:.*$/m) ?? [""])[0];
        const bodyOf = (h: string) => (src.match(new RegExp(`^const ${h}\\s*=[\\s\\S]*?;$`, "m")) ?? [""])[0];
        const reached = new Set<string>();
        const walk = (text: string) => {
          for (const h of helpers)
            if (!reached.has(h) && new RegExp(`\\b${h}\\b`).test(text)) { reached.add(h); walk(bodyOf(h)); }
        };
        walk(constraintSrc);
        expect(helpers.filter((h) => !reached.has(h)), `${topic.name}/${file}: helper not reachable from constraint`).toEqual([]);
      }
    }
    expect(checked, "no helpers found at all — the check has gone vacuous").toBeGreaterThan(0);
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
  it("ev-variance batch hits the 12/12/6 difficulty distribution", () => {
    const ev = PROBLEMS.filter((t) => t.id.startsWith("ev-variance/"));
    expect(ev.length).toBe(30);
    expect(ev.filter((t) => t.difficulty === 1).length).toBe(12);
    expect(ev.filter((t) => t.difficulty === 2).length).toBe(12);
    expect(ev.filter((t) => t.difficulty === 3).length).toBe(6);
  });
  it("every ev-variance problem grades on rel 0.005 — never abs", () => {
    // An expectation is a decimal the solver rounds, so strict equality would be a
    // grading bug; and an abs tolerance would have to satisfy the smallest |answer|
    // across all 100 emitted draws (emit.ts:43), which no author can pick safely.
    const ev = PROBLEMS.filter((t) => t.id.startsWith("ev-variance/"));
    for (const t of ev) {
      expect(t.accepted.tolerance.rel).toBe(0.005);
      expect(t.accepted.tolerance.abs).toBeUndefined();
    }
  });
  it("bayes batch hits the 12/12/6 difficulty distribution", () => {
    const bayes = PROBLEMS.filter((t) => t.id.startsWith("bayes/"));
    expect(bayes.length).toBe(30);
    expect(bayes.filter((t) => t.difficulty === 1).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 2).length).toBe(12);
    expect(bayes.filter((t) => t.difficulty === 3).length).toBe(6);
  });
});
