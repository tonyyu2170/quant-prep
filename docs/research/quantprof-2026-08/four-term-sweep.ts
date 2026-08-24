// Four-term sequence sweep — the measurement the handoff has been asking for.
//
// The question: if every sequence prompt showed FOUR terms instead of five or six,
// how many prompts would admit more than one defensible next term?
//
// One instrument, two fit spaces, two populations.
//
//   SPACE A  our generator's own parameter windows (packages/generators/src/sequences.ts),
//            unioned over the three difficulties. Answers "does our rule set pin a unique
//            fifth term" — a self-consistency check.
//   SPACE B  the same family FORMS with generous integer windows, stated below. Answers the
//            question that actually decides shipping: a candidate does not know our windows,
//            so any rule of the right shape is a defensible answer.
//
//   POP ours   every 4-term prefix SPACE A can reach, enumerated exhaustively (not sampled).
//   POP theirs QuantProf's 652 harvested prompts, seq.jsonl. Same instrument, so the only
//              difference between the two rows is the parameter ranges behind the prompts —
//              which is exactly the hypothesis in [[quantprep-four-term-sequences]].
//
// Run: npx tsx docs/research/quantprof-2026-08/four-term-sweep.ts
import { readFileSync } from "node:fs";
import { makeRng } from "../../../packages/engine/src/rng";
import { sequenceItemOfFamily, SEQ_FAMILIES, type SeqFamily } from "../../../packages/generators/src/sequences";

const N = 4; // the term count under test. divisor-arith and geometric-descending are coupled to it.

// --- windows ---------------------------------------------------------------------------
// SPACE A mirrors the generator's randInt bounds, widest difficulty per axis.
type W = Record<string, readonly number[]>;
const rng2 = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

const A: Record<SeqFamily, W> = {
  arithmetic: { start: rng2(-20, 60), d: rng2(2, 27) },
  geometric: { k: rng2(1, 12), r: rng2(2, 4) },
  quadratic: { a: rng2(1, 3), b: rng2(-3, 6), c: rng2(-5, 10) },
  interleaved: { s1: rng2(1, 30), d1: rng2(2, 9), s2: rng2(40, 90), d2: rng2(-9, -2) },
  "recur-linear": { a: rng2(2, 3), b: rng2(1, 9), start: rng2(1, 5) },
  fiblike: { t0: rng2(1, 9), t1: rng2(1, 9) },
  "alt-ops": { a: rng2(2, 9), b: rng2(2, 3), start: rng2(1, 6) },
  "squares-offset": { c: rng2(-3, 12) },
  "ratio-linear-offset": { start: rng2(2, 6), p: rng2(1, 3), c: rng2(-4, 5), s: [-1, 1] },
  "mult-plus-linear": { start: rng2(2, 14), m: rng2(2, 4), c: rng2(-6, 6), s: [-4, -3, -2, -1, 1, 2, 3, 4] },
  "ratio-arith": { start: rng2(2, 6), r: rng2(2, 4) },
  "divisor-arith": { z: rng2(2, 6), d0: [N + 1, N + 2] },
  "diff-squares-offset": { k: rng2(2, 6), base: rng2(1, 30) },
  "diff-cubes-offset": { k: rng2(2, 5), base: rng2(1, 30) },
  "cubes-offset": { k: rng2(1, 9), c: rng2(-3, 6) },
  "power-offset": { b: rng2(2, 3), e: rng2(1, 3), c: rng2(-6, 4) },
};

// SPACE B: same forms, generous windows. Axes the four shown terms determine exactly
// (an arithmetic step, a squares offset) are solved rather than enumerated, so widening
// them is free and they carry no window here.
const B: Record<SeqFamily, W> = {
  arithmetic: {}, geometric: { r: rng2(2, 12) }, quadratic: {},
  interleaved: {}, "recur-linear": { a: rng2(-12, 12) }, fiblike: {},
  "alt-ops": { b: rng2(2, 12) }, "squares-offset": {},
  "ratio-linear-offset": { p: rng2(-12, 12), c: rng2(-60, 60), s: rng2(-12, 12) },
  "mult-plus-linear": { m: rng2(-12, 12), c: rng2(-60, 60), s: rng2(-12, 12) },
  "ratio-arith": { r: rng2(2, 12) }, "divisor-arith": { d0: rng2(2, 20) },
  "diff-squares-offset": { k: rng2(1, 30) }, "diff-cubes-offset": { k: rng2(1, 15) },
  "cubes-offset": { k: rng2(1, 20), c: [] }, "power-offset": { b: rng2(2, 10), e: rng2(1, 8), c: [] },
};

const inW = (w: W, key: string, v: number) => !w[key] || w[key].length === 0 || w[key].includes(v);

// --- forward build, n explicit ----------------------------------------------------------
// Mirrors `build` in the generator with n as a parameter instead of derived. Verified against
// the real generator at its own term counts by checkMirror() below — that assert is the only
// thing standing between this file and silent drift.
function terms(f: SeqFamily, p: Record<string, number>, n: number): number[] | null {
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

// --- fitters: given four terms and a window spec, every next term of that family's form ----
// Each solves the axes the terms determine and enumerates only the rest, so SPACE B costs
// no more than SPACE A.
const ok = (v: number) => Number.isInteger(v) && Math.abs(v) < 1e15;

function fit(f: SeqFamily, t: readonly number[], w: W): number[] {
  const nexts = new Set<number>();
  const keep = (params: Record<string, number>) => {
    // Every axis is window-checked, including the ones solved from the terms rather than
    // enumerated. Skipping that is what made SPACE A behave like SPACE B on the first run.
    for (const [k, v] of Object.entries(params)) if (!inW(w, k, v)) return;
    const built = terms(f, params, N);
    if (built && built.slice(0, N).every((v, i) => v === t[i]) && ok(built[N])) nexts.add(built[N]);
  };
  switch (f) {
    case "arithmetic": keep({ start: t[0], d: t[1] - t[0] }); break;
    case "geometric": for (const k of w.k ?? rng2(1, 12)) for (const r of w.r!) keep({ k, r }); break;
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
    case "divisor-arith": for (const d0 of w.d0!) if (ok(t[3] / (d0 - 3))) keep({ z: t[3] / (d0 - 3), d0 }); break;
    case "diff-squares-offset": for (const k of w.k!) keep({ k, base: t[0] }); break;
    case "diff-cubes-offset": for (const k of w.k!) keep({ k, base: t[0] }); break;
    case "cubes-offset": for (const k of w.k ?? rng2(1, 9)) { const c = t[0] - k ** 3; if (inW(w, "c", c)) keep({ k, c }); } break;
    case "power-offset":
      for (const b of w.b!) for (const e of w.e!) { const c = t[0] - b ** e; if (inW(w, "c", c)) keep({ b, e, c }); }
      break;
  }
  return [...nexts];
}

// `interleaved` is excluded from every fit space, and it is the one exclusion that is a
// structural fact rather than a judgement. At four terms each of its two streams holds two
// points, so a straight line through each always exists: it matches EVERY four-term prompt
// and predicts 2*t2 - t0 regardless. That is the same defect the existing solver-ambiguity
// gate names for cubics — "four points always admit one exactly, so a degree-3 fitter matches
// everything and proves nothing". Left in, it alone drove SPACE B to 100% ambiguity on
// thirteen of sixteen families. Its consequence for shipping is separate and real: interleaved
// is the one family that cannot be SHOWN at four terms, because four terms do not determine
// its rule.
const UNCONSTRAINED_AT_4: ReadonlySet<SeqFamily> = new Set(["interleaved"]);

const fitAll = (t: readonly number[], space: Record<SeqFamily, W>) => {
  const all = new Set<number>();
  const fams: SeqFamily[] = [];
  for (const f of SEQ_FAMILIES) {
    if (UNCONSTRAINED_AT_4.has(f)) continue;
    const n = fit(f, t, space[f]); if (n.length) fams.push(f); n.forEach((v) => all.add(v));
  }
  return { nexts: [...all], fams };
};

// --- the mirror check -------------------------------------------------------------------
// Every real generator draw must be reachable by this file's enumeration at the same term
// count. Without it, a drifted recurrence would quietly report a clean sweep.
function checkMirror() {
  let checked = 0;
  for (const f of SEQ_FAMILIES) for (const d of [1, 2, 3] as const) {
    const rng = makeRng(99 + d);
    for (let i = 0; i < 60; i++) {
      const it = sequenceItemOfFamily(rng, f, d);
      const real = String(it.meta.terms).split(",").map(Number);
      const n = real.length;
      const found = enumerate(f, A[f], n).some(
        (e) => e.t.length >= n && e.t.slice(0, n).every((v, j) => v === real[j]) && e.t[n] === it.answer);
      if (!found) throw new Error(`MIRROR DRIFT: ${f} L${d} ${real.join(",")} -> ${it.answer} not reachable`);
      checked++;
    }
  }
  return checked;
}

function enumerate(f: SeqFamily, w: W, n: number): { t: number[]; params: Record<string, number> }[] {
  const keys = Object.keys(w).filter((k) => w[k].length);
  const out: { t: number[]; params: Record<string, number> }[] = [];
  const rec = (i: number, acc: Record<string, number>) => {
    if (i === keys.length) {
      const built = terms(f, f === "divisor-arith" ? { ...acc, d0: n + (acc.d0 - N) } : acc, n);
      if (built && built.every(ok)) out.push({ t: built, params: { ...acc } });
      return;
    }
    for (const v of w[keys[i]]) rec(i + 1, { ...acc, [keys[i]]: v });
  };
  rec(0, {});
  return out;
}

// --- run ---------------------------------------------------------------------------------
console.log(`mirror check: ${checkMirror()} real draws all reachable by this file's enumeration\n`);

type Row = { zero: number; one: number; many: number; total: number };
const blank = (): Row => ({ zero: 0, one: 0, many: 0, total: 0 });
const bump = (r: Row, k: number) => { r.total++; r[k === 0 ? "zero" : k === 1 ? "one" : "many"]++; };
const pct = (a: number, b: number) => b ? `${((100 * a) / b).toFixed(1)}%` : "—";

// POP ours: every 4-term prefix SPACE A can reach.
// interleaved leaves the POPULATION as well as the fit space, and for the same reason: a
// prompt we could not ship at four terms is not a prompt to measure. It is 97,920 of the
// 105,558 tuples SPACE A can reach, so leaving it in would have buried every other family.
const ours = new Map<string, { next: number; fams: Set<SeqFamily> }>();
for (const f of SEQ_FAMILIES) { if (UNCONSTRAINED_AT_4.has(f)) continue;
  for (const e of enumerate(f, A[f], N)) {
  const key = e.t.slice(0, N).join(",");
  const hit = ours.get(key);
  if (hit) hit.fams.add(f); else ours.set(key, { next: e.t[N], fams: new Set([f]) });
} }
console.log(`POP ours: ${ours.size} distinct 4-term prompts reachable in SPACE A (interleaved excluded)\n`);

for (const [label, space] of [["SPACE A (our windows)", A], ["SPACE B (generalized)", B]] as const) {
  const byFam = new Map<SeqFamily, Row>();
  const all = blank();
  for (const [key, { fams }] of ours) {
    const t = key.split(",").map(Number);
    const n = fitAll(t, space).nexts.length;
    bump(all, n);
    for (const f of fams) { if (!byFam.has(f)) byFam.set(f, blank()); bump(byFam.get(f)!, n); }
  }
  console.log(`=== POP ours x ${label} ===`);
  console.log(`  overall: ${all.total} prompts | unique ${pct(all.one, all.total)} | AMBIGUOUS ${all.many} (${pct(all.many, all.total)})`);
  const rows = [...byFam].sort((a, b) => b[1].many / b[1].total - a[1].many / a[1].total);
  for (const [f, r] of rows) if (r.many) console.log(`    ${f.padEnd(22)} ${String(r.many).padStart(6)}/${String(r.total).padEnd(7)} ambiguous ${pct(r.many, r.total)}`);
  console.log(`    (${rows.filter(([, r]) => !r.many).length} families with zero ambiguous prompts)\n`);
}

// POP theirs: the 652 harvested prompts, same instrument.
const theirs = readFileSync(new URL("seq.jsonl", import.meta.url), "utf8").trim().split("\n")
  .map((l) => JSON.parse(l) as { t: string; s: string })
  .map((r) => ({ tier: r.t, t: r.s.split(",").map((x) => Number(x.trim())) }))
  .filter((r) => r.t.length === 4 && r.t.every(Number.isFinite));
const seen = new Set<string>();
const uniq = theirs.filter((r) => { const k = r.t.join(","); if (seen.has(k)) return false; seen.add(k); return true; });

for (const [label, space] of [["SPACE A (our windows)", A], ["SPACE B (generalized)", B]] as const) {
  const byTier = new Map<string, Row>();
  const all = blank();
  for (const { tier, t } of uniq) {
    const n = fitAll(t, space).nexts.length;
    bump(all, n);
    if (!byTier.has(tier)) byTier.set(tier, blank());
    bump(byTier.get(tier)!, n);
  }
  console.log(`=== POP theirs (${uniq.length} unique QuantProf prompts) x ${label} ===`);
  console.log(`  unreachable-by-us ${all.zero} (${pct(all.zero, all.total)}) | unique ${all.one} (${pct(all.one, all.total)}) | AMBIGUOUS ${all.many} (${pct(all.many, all.total)})`);
  const reach = all.one + all.many;
  console.log(`  of the ${reach} our forms can reproduce: ambiguous ${pct(all.many, reach)}`);
  for (const [tier, r] of byTier) console.log(`    ${tier.padEnd(8)} n=${String(r.total).padStart(3)}  unreachable ${pct(r.zero, r.total)}  unique ${pct(r.one, r.total)}  ambiguous ${pct(r.many, r.total)}`);
  console.log();
}

// --- diagnostic: what actually competes, on concrete prompts -----------------------------
// SPACE B is only meaningful if its extra fits are ones a candidate would defend. These
// print the competitors so that can be judged rather than assumed.
if (process.argv.includes("--show")) {
  console.log("=== who competes under SPACE B ===");
  const samples = [...ours].filter(([, v]) => v.fams.has("ratio-linear-offset")).slice(0, 3)
    .concat([...ours].filter(([, v]) => v.fams.has("quadratic")).slice(0, 2))
    .concat([...ours].filter(([, v]) => v.fams.has("geometric")).slice(0, 2));
  for (const [key, { next }] of samples) {
    const t = key.split(",").map(Number);
    console.log(`\n  ${key}, ?   true next = ${next}`);
    for (const f of SEQ_FAMILIES) {
      const n = fit(f, t, B[f]);
      if (n.length) console.log(`     ${f.padEnd(22)} -> ${n.join(", ")}`);
    }
  }
}

// --- the SPACE A stragglers, printed in full ---------------------------------------------
// Fourteen prompts out of 7,638. Small enough to read, and reading them is what shows a
// rejection loop would clear them rather than a redesign.
if (process.argv.includes("--stragglers")) {
  console.log("=== the SPACE A ambiguous prompts, all of them ===");
  for (const [key, { next, fams }] of ours) {
    const t = key.split(",").map(Number);
    const r = fitAll(t, A);
    if (r.nexts.length > 1)
      console.log(`  ${key}, ?  true ${next}  |  admits ${r.nexts.sort((a,b)=>a-b).join(" / ")}  via ${r.fams.join("+")}  [drawn as ${[...fams].join("+")}]`);
  }
}
