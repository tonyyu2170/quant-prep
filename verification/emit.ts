import { writeFileSync } from "node:fs";
import { join } from "node:path";
import katex from "katex";
import { answerOf, drawParams, fmtNum, type ProblemTemplate } from "@qp/engine";
import { PROBLEMS } from "../content/problems";

const N = 100;
const fail: string[] = [];

const fnv = (s: string) => {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

function auditText(t: ProblemTemplate, text: string, allowed: Set<string>, seed: number) {
  for (const bad of ["NaN", "undefined", "Infinity", "{{"])
    if (text.includes(bad)) fail.push(`${t.id} seed ${seed}: forbidden "${bad}" in text`);
  if (((text.match(/\$/g) ?? []).length % 2) !== 0) fail.push(`${t.id} seed ${seed}: unpaired $ in text`);
  const mathSegs = text.split(/\$([^$]+)\$/g);
  for (let i = 1; i < mathSegs.length; i += 2) {
    try { katex.renderToString(mathSegs[i], { throwOnError: true }); }
    catch (e) { fail.push(`${t.id} seed ${seed}: KaTeX error in "$${mathSegs[i]}$": ${(e as Error).message}`); }
  }
  for (const tok of text.match(/\d+(?:\.\d+)?/g) ?? [])
    if (!allowed.has(tok)) fail.push(`${t.id} seed ${seed}: number "${tok}" not traceable to params/derived/constants`);
}

const out = { generatedAt: new Date().toISOString(), problems: [] as unknown[] };

for (const t of PROBLEMS) {
  const tol = t.accepted.tolerance;
  if (tol.rel === undefined && tol.abs === undefined) fail.push(`${t.id}: tolerance must be explicit`);
  if (tol.rel !== undefined && tol.rel > 0.02) fail.push(`${t.id}: rel tolerance ${tol.rel} too loose (max 0.02)`);
  const base = fnv(t.id);
  const instances = [];
  for (let i = 0; i < N; i++) {
    const seed = (base + i) >>> 0;
    const p = drawParams(t, seed);
    const d = t.derived(p);
    const answer = answerOf(t, d);
    if (!Number.isFinite(answer)) { fail.push(`${t.id} seed ${seed}: non-finite answer`); continue; }
    if (tol.abs !== undefined && tol.abs > Math.abs(answer) / 10)
      fail.push(`${t.id} seed ${seed}: abs tolerance ${tol.abs} loose vs answer ${answer}`);
    for (const v of [...Object.values(p), ...Object.values(d)])
      if (!Number.isFinite(v) || (v !== 0 && (Math.abs(v) < 1e-6 || Math.abs(v) >= 1e15)))
        fail.push(`${t.id} seed ${seed}: value ${v} outside fmtNum decimal-safe window`);
    const allowed = new Set<string>();
    for (const v of [...Object.values(p), ...Object.values(d), ...(t.constants ?? [])]) {
      const a = Math.abs(v);
      // The audit's tokenizer is sign-blind — a minus sign is never part of a token — so a
      // negative value has to be traceable by its magnitude. Sign errors in prose are caught
      // by the Python double-entry on derived values, not here; this audit only proves that
      // every number in the text came from the params.
      allowed.add(fmtNum(v));
      allowed.add(fmtNum(a));
      if (a > 0 && a < 1) allowed.add(fmtNum(Math.round(100 * a * 1e8) / 1e8)); // percent renderings
    }
    auditText(t, t.statement(p, d), allowed, seed);
    for (const step of t.solution(p, d)) auditText(t, `${step.title} ${step.body}`, allowed, seed);
    instances.push({ seed, params: p, derived: d, answer });
  }
  out.problems.push({ id: t.id, version: t.version, method: t.verify.method, tolerance: tol, answerKey: t.answerKey, instances });
}

if (fail.length) {
  console.error(`EMIT FAILED — ${fail.length} issue(s):`);
  for (const f of fail.slice(0, 50)) console.error("  " + f);
  process.exit(1);
}
writeFileSync(join(import.meta.dirname, "instances.json"), JSON.stringify(out));
console.log(`Emitted ${out.problems.length} problems × ${N} instances — all static gates green.`);
