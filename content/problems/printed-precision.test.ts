import { describe, expect, it } from "vitest";
import { drawParams, fmtNum } from "@qp/engine";
import { PROBLEMS } from "./index";

// Contract 6, enforced on the rendered page rather than on the template's floats.
//
// Every "$...=...$" a learner sees is an arithmetic claim. This gate re-evaluates each one
// USING ONLY THE PRINTED LITERALS and requires every side to render to the same fmtNum
// string. Checking the underlying floats instead is precisely what let a real defect ship
// during this batch: the floats reconciled exactly while the rendered decimals did not, on
// a quarter of that template's draws, and a float-based sweep reported all-green.
//
// Scope is deliberately ev-variance. The 55 bayes and counting problems predate this rule;
// widening the scope is a decision to take on its own evidence, not a side effect of this
// file. The helpers are exported so the same checker can be pointed at another topic as a
// diagnostic without being reimplemented (a second implementation is a second thing to be
// wrong).
const TOPIC = "probability/ev-variance";
const SEEDS = 200;

const factorial = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

/** Evaluate one side of a printed chain from its printed literals. `null` = not evaluable. */
export function evalTex(expr: string): number | null {
  let e = expr.trim();
  // "1+2+\cdots+N" is the only elided form in the corpus: the Nth triangular number.
  const tri = e.match(/^1\+2\+\\cdots\+(\d+)$/);
  if (tri) { const n = Number(tri[1]); return (n * (n + 1)) / 2; }
  if (e.includes("\\cdots")) return null;
  let prev = "";
  while (e !== prev) { prev = e; e = e.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "(($1)/($2))"); }
  e = e.replace(/\\times/g, "*").replace(/\\left|\\right/g, "");
  e = e.replace(/(\d+)!/g, (_m, n: string) => String(factorial(Number(n))));
  if (/[^\d\s+\-*/().]/.test(e)) return null; // an unrecognised form is a coverage hole, not a pass
  try {
    const v = Function(`"use strict";return (${e});`)() as number;
    return Number.isFinite(v) ? v : null;
  } catch { return null; }
}

export interface ChainAudit {
  /** a chain whose sides do not render to the same string — a false claim on the page */
  mismatches: string[];
  /** a chain the evaluator could not read: never counts as a pass, always reported */
  unevaluable: string[];
  /** segments carrying no "=" assert no arithmetic, so there is nothing to reconcile */
  claimFree: number;
  checked: number;
  segments: number;
}

export function auditChains(texts: string[], label: string): ChainAudit {
  const out: ChainAudit = { mismatches: [], unevaluable: [], claimFree: 0, checked: 0, segments: 0 };
  for (const text of texts) {
    const parts = text.split(/\$([^$]+)\$/g);
    for (let i = 1; i < parts.length; i += 2) {
      const seg = parts[i];
      out.segments++;
      if (!seg.includes("=")) { out.claimFree++; continue; }
      const sides = seg.split("=").map(evalTex);
      if (sides.some((v) => v === null)) { out.unevaluable.push(`${label}: $${seg}$`); continue; }
      out.checked++;
      const shown = sides.map((v) => fmtNum(v as number));
      if (new Set(shown).size !== 1) out.mismatches.push(`${label}: $${seg}$ renders ${shown.join(" vs ")}`);
    }
  }
  return out;
}

function auditTopic(topic: string): ChainAudit {
  const total: ChainAudit = { mismatches: [], unevaluable: [], claimFree: 0, checked: 0, segments: 0 };
  for (const t of PROBLEMS.filter((x) => x.topic === topic)) {
    for (let seed = 0; seed < SEEDS; seed++) {
      const p = drawParams(t, seed);
      const d = t.derived(p);
      const texts = [t.statement(p, d), ...t.solution(p, d).map((s) => s.body)];
      const a = auditChains(texts, `${t.id} seed ${seed}`);
      total.mismatches.push(...a.mismatches);
      total.unevaluable.push(...a.unevaluable);
      total.claimFree += a.claimFree;
      total.checked += a.checked;
      total.segments += a.segments;
    }
  }
  return total;
}

describe("printed-precision gate (ev-variance)", () => {
  const audit = auditTopic(TOPIC);

  it("every printed chain reconciles at displayed precision", () => {
    expect(audit.mismatches).toEqual([]);
    expect(audit.checked).toBeGreaterThan(1000); // a silent drop to zero chains must not pass
  });

  it("no printed chain is unevaluable — an unreadable form is a coverage hole, not a pass", () => {
    expect(audit.unevaluable).toEqual([]);
  });

  it("accounts for every rendered segment exactly once", () => {
    // Segments without "=" make no arithmetic claim, so they are deliberately not checked.
    // Asserting the partition is what stops a parser bug from quietly shrinking coverage.
    expect(audit.checked + audit.unevaluable.length + audit.claimFree).toBe(audit.segments);
    expect(audit.claimFree).toBeGreaterThan(0);
  });
});

// A checker that has never been seen to fail is not evidence that anything passed.
describe("the printed-precision checker fails when it should", () => {
  const cases: [string, boolean][] = [
    ["\\frac{16}{6}=2.667", false],   // correctly rounded
    ["\\frac{16}{6}=2.668", true],    // off by one in the last printed digit
    ["3\\times8=24", false],
    ["3\\times8=25", true],
    ["7!=5040", false],
    ["7!=5041", true],
    ["1+2+\\cdots+5=15", false],      // the elided form is evaluated, not skipped
    ["1+2+\\cdots+5=16", true],
    ["\\frac{2\\times20-10\\times3}{10}=1", false],
    ["\\frac{2\\times20-10\\times3}{10}=1.1", true],
  ];
  // No literal "$" in the title: vitest reads $<digit> as a positional case reference.
  it.each(cases)("%s -> flags: %s", (seg, shouldFlag) => {
    const a = auditChains([`$${seg}$`], "mutation");
    expect(a.unevaluable).toEqual([]); // every case must be readable, or it proves nothing
    expect(a.mismatches.length > 0).toBe(shouldFlag);
  });
});
