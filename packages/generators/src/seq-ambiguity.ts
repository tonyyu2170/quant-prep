// Does a shown sequence pin its own next term?
//
// ONE module, two consumers, on purpose. The generation-time redraw loop in sequences.ts and
// the shipped-prompt gate in test/sequences.test.ts both call `alternativeNexts` — the same
// extraction draw-space.ts made for probe.ts and its gate, and for the same reason: two
// ambiguity checkers written to two slightly different rules is exactly the failure mode
// recorded in verification-gate-lessons, where one quantity got reported eleven times apart.
// A gate that disagrees with the loop that fed it proves nothing.
//
// Ported from docs/research/quantprof-2026-08/four-term-sweep.ts (SPACE C), generalized from
// that file's hardcoded four terms to the shown length, so `interleaved` at five terms is
// checked under the same instrument as everything else.
// Type-only: sequences.ts imports this module for its redraw loop, so a value import
// here would close a cycle. SPACE_C's own keys are the family list.
import type { SeqFamily } from "./sequences";

type W = Record<string, readonly number[]>;
const span = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const ok = (v: number) => Number.isInteger(v) && Math.abs(v) < 1e15;

// Generous windows — a candidate does not know our parameter ranges, so a rule they could
// state counts against us even when our own generator could not have drawn it. The one
// restriction: the multiplier keeps the sign our generator uses. Letting it run negative fits
// 1,2,4,8 with a multiplier stepping -2,-1,0,1, which nobody states; that is the same
// unconstrained-fitter defect `interleaved` is excluded for, in smaller doses.
const SPACE_C: Record<SeqFamily, W> = {
  arithmetic: {}, geometric: { r: span(2, 12) }, quadratic: {},
  interleaved: {}, "recur-linear": { a: span(2, 12) }, fiblike: {},
  "alt-ops": { b: span(2, 12) }, "squares-offset": {},
  "ratio-linear-offset": { p: span(1, 12), c: span(-60, 60), s: span(-12, 12) },
  "mult-plus-linear": { m: span(2, 12), c: span(-60, 60), s: span(-12, 12) },
  "ratio-arith": { r: span(2, 12) }, "divisor-arith": { d0: span(2, 20) },
  "diff-squares-offset": { k: span(1, 30) }, "diff-cubes-offset": { k: span(1, 15) },
  "cubes-offset": { k: span(1, 20), c: [] }, "power-offset": { b: span(2, 10), e: span(1, 8), c: [] },
};

// `interleaved` is excluded from the FIT SPACE, and this exclusion is a finding rather than a
// convenience: each of its two streams holds ceil(n/2) points, so at four terms a straight line
// through two points always exists and it matches EVERY prompt, predicting 2*t2 - t0 whatever
// the real rule was. That is the defect the solver-ambiguity gate already names for cubics —
// four points always admit one exactly, so a degree-3 fitter matches everything and proves
// nothing. Left in, it alone drove the ambiguity rate to 100% on thirteen of sixteen families.
//
// Excluding it from the fit space is NOT the same as refusing to ship it: an interleaved prompt
// still has to survive every OTHER family's fitter, which is why it ships at five terms.
const UNCONSTRAINED: ReadonlySet<SeqFamily> = new Set(["interleaved"]);

const inW = (w: W, key: string, v: number) => !w[key] || w[key].length === 0 || w[key].includes(v);

/** Forward build with n explicit. Mirrors `build` in sequences.ts; drift is caught by the
 *  reachability assert in test/sequences.test.ts. */
function forward(f: SeqFamily, p: Record<string, number>, n: number): number[] | null {
  const out: number[] = [];
  switch (f) {
    case "arithmetic": for (let i = 0; i <= n; i++) out.push(p.start + i * p.d); break;
    case "geometric": {
      const start = ((p.k - 1) % 6) + 1, desc = p.k > 6;
      const full = Array.from({ length: n + 1 }, (_, i) => start * p.r ** i);
      return desc ? [...full.slice(1).reverse(), full[0]] : full;
    }
    case "quadratic": for (let i = 0; i <= n; i++) out.push(p.a * (i + 1) ** 2 + p.b * (i + 1) + p.c); break;
    case "interleaved": for (let i = 0; i <= n; i++) out.push(i % 2 === 0 ? p.s1 + (i / 2) * p.d1 : p.s2 + ((i - 1) / 2) * p.d2); break;
    case "recur-linear": out.push(p.start); for (let i = 1; i <= n; i++) out.push(p.a * out[i - 1] + p.b); break;
    case "fiblike": out.push(p.t0, p.t1); while (out.length <= n) out.push(out[out.length - 1] + out[out.length - 2]); break;
    case "alt-ops": out.push(p.start); for (let i = 1; i <= n; i++) out.push(i % 2 === 1 ? out[i - 1] + p.a : out[i - 1] * p.b); break;
    case "squares-offset": for (let i = 0; i <= n; i++) out.push((i + 1) ** 2 + p.c); break;
    case "ratio-linear-offset": out.push(p.start); for (let i = 1; i <= n; i++) out.push(out[i - 1] * (p.p + i - 1) + (p.c + p.s * (i - 1))); break;
    case "mult-plus-linear": out.push(p.start); for (let i = 1; i <= n; i++) out.push(p.m * out[i - 1] + (p.c + p.s * (i - 1))); break;
    case "ratio-arith": out.push(p.start); for (let i = 1; i <= n; i++) out.push(out[i - 1] * (p.r + i - 1)); break;
    case "divisor-arith": {
      const t = new Array<number>(n + 1); t[n] = p.z;
      for (let i = n - 1; i >= 0; i--) t[i] = t[i + 1] * (p.d0 - i);
      return t;
    }
    case "diff-squares-offset": out.push(p.base); for (let i = 1; i <= n; i++) out.push(out[i - 1] + (p.k + i - 1) ** 2); break;
    case "diff-cubes-offset": out.push(p.base); for (let i = 1; i <= n; i++) out.push(out[i - 1] + (p.k + i - 1) ** 3); break;
    case "cubes-offset": for (let i = 0; i <= n; i++) out.push((p.k + i) ** 3 + p.c); break;
    case "power-offset": for (let i = 0; i <= n; i++) out.push(p.b ** (p.e + i) + p.c); break;
  }
  return out.length === n + 1 ? out : null;
}

/** Every next term this family's form predicts for `t`, under SPACE C. Axes the shown terms
 *  determine exactly are solved rather than enumerated, so a generous window costs nothing. */
export function nextsFittingFamily(f: SeqFamily, t: readonly number[]): number[] {
  return fit(f, t, SPACE_C[f]);
}

function fit(f: SeqFamily, t: readonly number[], w: W): number[] {
  const n = t.length;
  const nexts = new Set<number>();
  const keep = (params: Record<string, number>) => {
    // Every axis is window-checked, including ones solved from the terms rather than
    // enumerated — skipping that made the tight space behave like the generous one.
    for (const [k, v] of Object.entries(params)) if (!inW(w, k, v)) return;
    const built = forward(f, params, n);
    if (built && built.slice(0, n).every((v, i) => v === t[i]) && ok(built[n])) nexts.add(built[n]);
  };
  switch (f) {
    case "arithmetic": keep({ start: t[0], d: t[1] - t[0] }); break;
    case "geometric": for (const k of w.k ?? span(1, 12)) for (const r of w.r!) keep({ k, r }); break;
    case "quadratic": {
      const d1 = t.slice(1).map((v, i) => v - t[i]), dd = d1[1] - d1[0];
      if (dd % 2 === 0) { const a = dd / 2; keep({ a, b: d1[0] - 3 * a, c: t[0] - a - (d1[0] - 3 * a) }); }
      break;
    }
    case "interleaved": keep({ s1: t[0], d1: t[2] - t[0], s2: t[1], d2: t[3] - t[1] }); break;
    case "recur-linear": {
      if (t[1] === t[0]) break;
      for (const a of w.a ?? [2, 3]) keep({ a, b: t[1] - a * t[0], start: t[0] });
      break;
    }
    case "fiblike": keep({ t0: t[0], t1: t[1] }); break;
    case "alt-ops": if (t[1] !== 0 && ok(t[2] / t[1])) keep({ a: t[1] - t[0], b: t[2] / t[1], start: t[0] }); break;
    case "squares-offset": keep({ c: t[0] - 1 }); break;
    case "ratio-linear-offset":
      for (const p of w.p!) { const c = t[1] - t[0] * p, s = t[2] - t[1] * (p + 1) - c;
        if (ok(c) && ok(s) && inW(w, "c", c) && inW(w, "s", s)) keep({ start: t[0], p, c, s }); }
      break;
    case "mult-plus-linear":
      for (const m of w.m!) { const c = t[1] - m * t[0], s = t[2] - m * t[1] - c;
        if (ok(c) && ok(s) && inW(w, "c", c) && inW(w, "s", s)) keep({ start: t[0], m, c, s }); }
      break;
    case "ratio-arith": for (const r of w.r!) keep({ start: t[0], r }); break;
    // d0 - (n-1), not the sweep's literal 3: that file only ever ran at four terms.
    case "divisor-arith": for (const d0 of w.d0!) if (ok(t[n - 1] / (d0 - (n - 1)))) keep({ z: t[n - 1] / (d0 - (n - 1)), d0 }); break;
    case "diff-squares-offset": for (const k of w.k!) keep({ k, base: t[0] }); break;
    case "diff-cubes-offset": for (const k of w.k!) keep({ k, base: t[0] }); break;
    case "cubes-offset": for (const k of w.k ?? span(1, 9)) { const c = t[0] - k ** 3; if (inW(w, "c", c)) keep({ k, c }); } break;
    case "power-offset":
      for (const b of w.b!) for (const e of w.e!) { const c = t[0] - b ** e; if (inW(w, "c", c)) keep({ b, e, c }); }
      break;
  }
  return [...nexts];
}

// The rule classes a solver reaches for regardless of our family set — a plain arithmetic run,
// a constant second difference, a linear recurrence, a Fibonacci sum. These overlap the family
// fitters above but are not implied by them: they fire on prompts no family of ours generates.
// Cubics are deliberately absent — four points always admit one exactly, so a degree-3 fitter
// matches everything and proves nothing.
const SOLVER_RULES: ReadonlyArray<(t: readonly number[]) => number | null> = [
  (t) => { const d = t[1] - t[0]; return t.every((v, i) => i === 0 || v - t[i - 1] === d) ? t[t.length - 1] + d : null; },
  (t) => {
    const d1 = t.slice(1).map((v, i) => v - t[i]);
    const dd = d1[1] - d1[0];
    return d1.every((v, i) => i === 0 || v - d1[i - 1] === dd) ? t[t.length - 1] + d1[d1.length - 1] + dd : null;
  },
  (t) => {
    if (t[1] - t[0] === 0) return null;
    const a = (t[2] - t[1]) / (t[1] - t[0]);
    const b = t[1] - a * t[0];
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    for (let i = 3; i < t.length; i++) if (Math.abs(a * t[i - 1] + b - t[i]) > 1e-9) return null;
    return a * t[t.length - 1] + b;
  },
  (t) => {
    for (let i = 2; i < t.length; i++) if (t[i] !== t[i - 1] + t[i - 2]) return null;
    return t[t.length - 1] + t[t.length - 2];
  },
];

/**
 * Every next term OTHER than `answer` that the shown terms also justify.
 *
 * Empty means the prompt pins its own answer. Non-empty means a candidate could write down a
 * different number and be right, which is the whole reason four-term display was reverted once.
 */
export function alternativeNexts(t: readonly number[], answer: number): number[] {
  const all = new Set<number>();
  for (const f of Object.keys(SPACE_C) as SeqFamily[]) {
    if (UNCONSTRAINED.has(f)) continue;
    for (const v of fit(f, t, SPACE_C[f])) all.add(v);
  }
  for (const rule of SOLVER_RULES) {
    const v = rule(t);
    if (v !== null && Number.isFinite(v)) all.add(v);
  }
  all.delete(answer);
  return [...all].filter((v) => Math.abs(v - answer) > 1e-9);
}

export const isAmbiguous = (t: readonly number[], answer: number) => alternativeNexts(t, answer).length > 0;
