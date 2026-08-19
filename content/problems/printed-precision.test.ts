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
// Scope is every shipped topic, each audited on its own so a collapse to zero chains in one
// cannot hide under another's volume. The helpers are exported so the same checker can be
// pointed at a subset as a diagnostic without being reimplemented (a second implementation is
// a second thing to be wrong) — from another test file, since vitest is imported at module
// top level here.
const TOPICS = ["probability/bayes", "probability/counting", "probability/ev-variance"];
const SEEDS = 200;
const MIN_CHECKED_PER_TOPIC = 1000; // a silent drop to zero chains in ONE topic must not pass

const factorial = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const choose = (n: number, k: number) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
};

/** Arithmetic left after every recognised construct has been expanded to digits and operators. */
const ARITHMETIC_ONLY = /^[\d\s+\-*/().]*$/;

function evalArith(e: string): number | null {
  if (!ARITHMETIC_ONLY.test(e)) return null;
  try {
    const v = Function(`"use strict";return (${e});`)() as number;
    return Number.isFinite(v) ? v : null;
  } catch { return null; }
}

/** Evaluate one side of a printed chain from its printed literals. `null` = not evaluable. */
export function evalTex(expr: string): number | null {
  let e = expr.trim();
  // "1+2+\cdots+N" is one of two elided forms in the corpus: the Nth triangular number.
  const tri = e.match(/^1\+2\+\\cdots\+(\d+)$/);
  if (tri) { const n = Number(tri[1]); return (n * (n + 1)) / 2; }
  // "n x (n-1) x \\cdots x m" — a falling product, the other elided form. The middle factor is
  // required to be n-1 so a run that does not actually descend by one is left unreadable.
  const fall = e.match(/^(\d+)\\times(\d+)\\times\\cdots\\times(\d+)$/);
  if (fall) {
    const [n, mid, m] = fall.slice(1).map(Number);
    if (mid === n - 1 && m <= mid) { let r = 1; for (let i = m; i <= n; i++) r *= i; return r; }
    return null;
  }
  if (e.includes("\\cdots")) return null;
  // \frac, \binom, \sqrt and ^ are expanded in ONE interleaved loop, innermost-first. Running
  // them as sequential passes instead resolves a fraction under a root but NOT a root under a
  // fraction: the outer \frac's [^{}]* group cannot span the inner \sqrt's braces, so the
  // fraction is still unexpanded by the time the \sqrt pass ends and the segment reports
  // unevaluable. \sqrt and ^ are written as ** rather than Math.pow so the expression stays
  // inside ARITHMETIC_ONLY — letters are what mark an unrecognised form.
  let prev = "";
  while (e !== prev) {
    prev = e;
    e = e
      .replace(/\\(?:dfrac|frac)\{([^{}]*)\}\{([^{}]*)\}/g, "(($1)/($2))")
      .replace(/\\sqrt\{([^{}]*)\}/g, "(($1)**0.5)")
      // \binom is folded to its integer value rather than to an operator expression, so both
      // arguments must already be whole numbers; a symbolic \binom{n}{k} is left standing and
      // is then read as notation, not silently dropped.
      .replace(/\\binom\{([^{}]*)\}\{([^{}]*)\}/g, (m, a: string, b: string) => {
        const n = evalArith(a), k = evalArith(b);
        if (n === null || k === null || !Number.isInteger(n) || !Number.isInteger(k)) return m;
        return `(${choose(n, k)})`;
      })
      .replace(/\^\{([^{}]*)\}/g, "**($1)")
      .replace(/\^(\d)/g, "**($1)");
  }
  e = e.replace(/\\times/g, "*").replace(/\\left|\\right/g, "");
  e = e.replace(/(\d+)!/g, (_m, n: string) => String(factorial(Number(n))));
  return evalArith(e); // an unrecognised form is a coverage hole, not a pass
}

// The LaTeX commands this corpus uses, and only those. A side that still carries a command
// outside this set is reported unevaluable rather than assumed inert: an unfamiliar command
// could be wrapping arithmetic the reader never saw. Adding one here is a deliberate act.
const RECOGNISED_CMD = /\\(?:dfrac|frac|binom|sqrt|times|cdots|left|right|mid|text|bar|cap|max|geq|sigma|,)/g;

/**
 * True when a side names a quantity instead of printing one — "P(D\mid +)", "\text{odds}(S)",
 * "\dfrac{P(+\mid D)\,P(D)}{P(+)}". Such a side asserts no arithmetic over printed literals, so
 * there is nothing for a learner to recompute and nothing for this gate to reconcile.
 *
 * The test is a surviving letter, not an absence of digits: "\binom{52}{5}" reduces to braces
 * and digits and so is NOT a label (it is arithmetic the reader must actually read), while
 * "\binom{n}{k}" keeps its letters and is. Any unrecognised command disqualifies the side
 * outright, whatever letters it holds.
 */
export function isLabel(side: string): boolean {
  const rest = side.replace(RECOGNISED_CMD, " ");
  if (rest.includes("\\")) return false;
  return /[A-Za-z]/.test(rest);
}

/**
 * Split a segment at the relations that assert equality of value, ignoring any inside a brace
 * or paren group: the "=" in "P(\max=3\mid\ldots)" names an event, it does not join two
 * expressions, and splitting there tears the notation into two unreadable halves. `null`
 * means the delimiters do not balance, which is reported rather than guessed at.
 */
export function splitClaim(seg: string): string[] | null {
  const out: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < seg.length; i++) {
    const c = seg[i];
    if (c === "{" || c === "(") depth++;
    else if (c === "}" || c === ")") { depth--; if (depth < 0) return null; }
    else if (depth === 0 && c === "=") { out.push(seg.slice(start, i)); start = i + 1; }
    else if (depth === 0 && seg.startsWith("\\propto", i)) {
      // "\propto" relates the same two values up to a shared factor, so the arithmetic
      // printed on either side of it still has to reconcile.
      out.push(seg.slice(start, i)); i += "\\propto".length - 1; start = i + 1;
    }
  }
  if (depth !== 0) return null;
  out.push(seg.slice(start));
  return out;
}

export interface ChainAudit {
  /** a chain whose sides do not render to the same string — a false claim on the page */
  mismatches: string[];
  /** a chain the evaluator could not read: never counts as a pass, always reported */
  unevaluable: string[];
  /** segments asserting no arithmetic over printed literals, so there is nothing to reconcile */
  claimFree: number;
  checked: number;
  segments: number;
}

/** Every rendering a value could legitimately take, allowing for a rounding boundary. */
function atBoundaryEitherWay(v: number): Set<string> {
  // fmtNum prints an integer in full and everything else at four significant figures, so a
  // whole number has exactly one rendering and must never be nudged off it — perturbing
  // 2598960 would offer "2599000" as an alternative and let 2598961 pass against it.
  if (Number.isInteger(v)) return new Set([fmtNum(v)]);
  const eps = 1e-11;
  const out = new Set([fmtNum(v)]);
  for (const w of [v * (1 + eps), v * (1 - eps)]) if (!Number.isInteger(w)) out.add(fmtNum(w));
  return out;
}

const intersects = (sets: Set<string>[]) =>
  [...sets[0]].some((s) => sets.every((other) => other.has(s)));

export function auditChains(texts: string[], label: string): ChainAudit {
  const out: ChainAudit = { mismatches: [], unevaluable: [], claimFree: 0, checked: 0, segments: 0 };
  for (const text of texts) {
    const parts = text.split(/\$([^$]+)\$/g);
    for (let i = 1; i < parts.length; i += 2) {
      const seg = parts[i];
      out.segments++;
      const sides = splitClaim(seg);
      if (sides === null) { out.unevaluable.push(`${label}: $${seg}$ — unbalanced delimiters`); continue; }
      if (sides.length < 2) { out.claimFree++; continue; }
      const values: number[] = [];
      let unreadable = false;
      for (const side of sides) {
        if (side.trim() === "") continue; // a leading "=" prints no operand of its own
        const v = evalTex(side);
        if (v !== null) values.push(v);
        else if (!isLabel(side)) unreadable = true;
      }
      if (unreadable) { out.unevaluable.push(`${label}: $${seg}$`); continue; }
      // One value and some labels is a definition, not a chain: nothing was recomputed.
      if (values.length < 2) { out.claimFree++; continue; }
      out.checked++;
      const shown = values.map((v) => fmtNum(v));
      // A value sitting exactly on a 4-significant-figure boundary may render either way, and
      // which way it falls is decided by binary representation rather than by anything on the
      // page: 0.00216/0.00256 is exactly 0.84375, and IEEE754 puts the quotient one ulp under
      // that tie while the template's own float sits on it, so the two render 0.8437 and
      // 0.8438. Neither is wrong. Accepting both readings at a boundary cannot forgive the
      // defect this gate exists for — a 4-significant-figure operand fed into the next step
      // moves the result by about 1e-4 relative, seven orders of magnitude further out.
      if (!intersects(values.map(atBoundaryEitherWay)))
        out.mismatches.push(`${label}: $${seg}$ renders ${shown.join(" vs ")}`);
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

describe.each(TOPICS)("printed-precision gate (%s)", (topic) => {
  const audit = auditTopic(topic);

  it("every printed chain reconciles at displayed precision", () => {
    expect(audit.mismatches).toEqual([]);
    expect(audit.checked).toBeGreaterThan(MIN_CHECKED_PER_TOPIC);
  });

  it("no printed chain is unevaluable — an unreadable form is a coverage hole, not a pass", () => {
    expect(audit.unevaluable).toEqual([]);
  });

  it("accounts for every rendered segment exactly once", () => {
    // Claim-free segments assert no arithmetic over printed literals, so they are deliberately
    // not checked. Asserting the partition is what stops a parser bug from quietly shrinking
    // coverage.
    expect(audit.checked + audit.unevaluable.length + audit.claimFree).toBe(audit.segments);
    expect(audit.claimFree).toBeGreaterThan(0);
  });
});

// A checker that has never been seen to fail is not evidence that anything passed.
describe("the printed-precision checker fails when it should", () => {
  const cases: [string, boolean][] = [
    ["\\frac{16}{6}=2.667", false],   // correctly rounded
    ["\\frac{16}{6}=2.668", true],    // off by one in the last printed digit
    ["\\dfrac{16}{6}=2.667", false],  // \dfrac is the same fraction, not an unreadable form
    ["\\dfrac{16}{6}=2.668", true],
    ["3\\times8=24", false],
    ["3\\times8=25", true],
    ["7!=5040", false],
    ["7!=5041", true],
    ["1+2+\\cdots+5=15", false],      // the elided forms are evaluated, not skipped
    ["1+2+\\cdots+5=16", true],
    ["7\\times6\\times\\cdots\\times3=2520", false], // the falling product, the other elided form
    ["7\\times6\\times\\cdots\\times3=2521", true],
    ["\\frac{2\\times20-10\\times3}{10}=1", false],
    ["\\frac{2\\times20-10\\times3}{10}=1.1", true],
    ["\\sqrt{\\frac{25\\times(11\\times11-1)}{12}}=15.81", false], // a radicand over a fraction
    ["\\sqrt{\\frac{25\\times(11\\times11-1)}{12}}=15.82", true],
    ["\\frac{\\sqrt{144}}{4}=3", false],   // and a root INSIDE a fraction, the other nesting
    ["\\frac{\\sqrt{144}}{4}=3.1", true],
    ["5^3=125", false],               // a bare exponent
    ["5^3=126", true],
    ["0.6^{3}=0.216", false],         // and a braced one
    ["0.6^{3}=0.217", true],
    ["0.5\\times0.6^{3}=0.108", false], // precedence: the power binds before the product
    ["0.5\\times0.6^{3}=0.15", true],
    ["\\binom{52}{5}=2598960", false], // a binomial is folded to its integer value
    ["\\binom{52}{5}=2598961", true],
    ["\\binom{6}{2}\\times\\binom{5}{3}=150", false],
    ["\\binom{6}{2}\\times\\binom{5}{3}=151", true],
    // A decimal rounding tie: exactly 0.84375, which IEEE754 lands just under. Not a defect.
    ["0.00216/0.00256=0.8438", false],
    ["0.00216/0.00256=0.8437", false], // and the other reading of the same tie is equally fine
    ["0.00216/0.00256=0.8439", true],  // but a real last-digit error still flags
    ["0.5\\times0.65^{2}=0.2113", false], // exactly 0.21125 — a tie the other way round
    ["0.5\\times0.65^{2}=0.2112", false],
    ["0.5\\times0.65^{2}=0.2114", true],  // one digit past the boundary is still a defect
    ["0.2308/0.6923=0.3334", false],   // 0.33338..., not a tie, correctly rounded
    ["0.2308/0.6923=0.3333", true],    // the rounded-operand drift this gate exists for
    // A label on one side must not excuse the arithmetic on the other two.
    ["P(F\\mid A)=0.1391\\times0.85=0.1182", false],
    ["P(F\\mid A)=0.1391\\times0.85=0.1183", true],
    // An "=" inside a paren group names an event; splitting there would tear the notation.
    ["P(\\max=3\\mid\\text{at least one}\\geq2)=5/35=0.1429", false],
    ["P(\\max=3\\mid\\text{at least one}\\geq2)=5/35=0.143", true],
    // "\propto" asserts equality up to a shared factor, so it is a relation, not notation.
    ["P(\\bar G,M)\\propto1999\\times0.0001=0.1999", false],
    ["P(\\bar G,M)\\propto1999\\times0.0001=0.1998", true],
  ];
  // No literal "$" in the title: vitest reads $<digit> as a positional case reference.
  it.each(cases)("%s -> flags: %s", (seg, shouldFlag) => {
    const a = auditChains([`$${seg}$`], "mutation");
    expect(a.unevaluable).toEqual([]); // every case must be readable, or it proves nothing
    expect(a.mismatches.length > 0).toBe(shouldFlag);
  });

  // Recognising notation is what keeps the unevaluable count honest; it must not become a
  // catch-all that swallows arithmetic. These carry no reconcilable claim at all.
  const claimFree: string[] = [
    "P(D\\mid +)=0.9",                       // a labelled value: one number, nothing recomputed
    "\\text{odds}(S)=P(S)/P(\\bar S)",       // a formula over named quantities
    "\\binom{n}{k}=\\binom{n}{n-k}",         // symbolic, so the reader leaves it standing
    "P(\\text{shows }4\\mid \\text{sum}=5)", // the only "=" is inside the event description
  ];
  it.each(claimFree)("%s -> carries no claim", (seg) => {
    const a = auditChains([`$${seg}$`], "mutation");
    expect(a.unevaluable).toEqual([]);
    expect(a.mismatches).toEqual([]);
    expect([a.claimFree, a.checked]).toEqual([1, 0]);
  });

  // The property that makes the gate mean anything: a form the reader cannot read is reported,
  // never counted as a pass and never quietly reclassified as notation.
  const unreadable: string[] = [
    "\\sum_{i=1}^{3}=6",      // an unrecognised command, even though it has letters
    "\\log(100)=2",
    "2+3+\\cdots+9=44",       // an elided sum that is not the triangular form
    "7\\times5\\times\\cdots\\times3=105", // a run that does not descend by one
    "\\binom{4.5}{2}=6",      // a binomial the reader declines to fold
  ];
  it.each(unreadable)("%s -> is reported unreadable", (seg) => {
    const a = auditChains([`$${seg}$`], "mutation");
    expect(a.unevaluable.length).toBe(1);
    expect([a.checked, a.claimFree]).toEqual([0, 0]);
  });
});
