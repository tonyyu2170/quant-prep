/* Drafting probe — mirrors the gate helpers in content/problems/draw-space.test.ts so an
 * author can measure a template WITHOUT running vitest (that file imports vitest, so it
 * cannot be imported from a plain tsx script). Keep in step with the gate.
 *   npx tsx tools/probe.ts <template-id>...   (omit ids to probe the whole bank) */
import { drawParams, type Params, type ProblemTemplate } from "@qp/engine";
import { PROBLEMS } from "../content/problems";

export function forEachLegalDraw(t: ProblemTemplate, cb: (p: Params) => void): void {
  const keys = Object.keys(t.params).sort();
  const axes = keys.map((k) => {
    const spec = t.params[k];
    if (spec.choices) return [...spec.choices];
    const { min, max, step } = spec.range!;
    const out: number[] = [];
    for (let i = 0; i <= Math.round((max - min) / step); i++) out.push(Math.round((min + step * i) * 1e10) / 1e10);
    return out;
  });
  const acc: Params = {};
  const rec = (i: number) => {
    if (i === keys.length) { if (!t.constraint || t.constraint(acc)) cb({ ...acc }); return; }
    for (const v of axes[i]) { acc[keys[i]] = v; rec(i + 1); }
  };
  rec(0);
}

export function distinctAtBand(answers: number[], rel = 0.005): number {
  const s = [...answers].sort((a, b) => a - b);
  let runs = 0;
  for (let i = 0; i < s.length; i++) {
    if (i === 0) { runs++; continue; }
    if (!(s[i] - s[i - 1] <= rel * (Math.abs(s[i - 1]) + Math.abs(s[i])))) runs++;
  }
  return runs;
}

export function emittedSpread(t: ProblemTemplate, n = 100) {
  let h = 2166136261;
  for (const c of t.id) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const base = h >>> 0;
  const counts = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const p = drawParams(t, (base + i) >>> 0);
    counts.set(JSON.stringify(p), (counts.get(JSON.stringify(p)) ?? 0) + 1);
  }
  return { texts: counts.size, maxRepeat: Math.max(...counts.values()) };
}

/** One line per template: the four numbers the gates assert on. */
export function probe(t: ProblemTemplate): string {
  const answers: number[] = [];
  const texts = new Set<string>();
  forEachLegalDraw(t, (p) => { const d = t.derived(p); answers.push(d[t.answerKey]); texts.add(t.statement(p, d)); });
  const { texts: served, maxRepeat } = emittedSpread(t);
  const parts = [`tuples=${answers.length}`, `texts/100=${served}`, `maxRepeat=${maxRepeat}`];
  if (t.choices) {
    const shares = t.choices.map((_, i) => (answers.filter((a) => a === i + 1).length / answers.length));
    parts.push(`shares=[${shares.map((s) => s.toFixed(3)).join(", ")}]`, `minShare=${Math.min(...shares).toFixed(3)} (floor 0.15)`);
  } else {
    parts.push(`distinct@band=${distinctAtBand(answers)} (floor 12)`);
  }
  parts.push(`distinctTexts=${texts.size}`);
  return `${t.id.padEnd(46)} ${parts.join("  ")}`;
}

const want = process.argv.slice(2);
const list = want.length ? PROBLEMS.filter((t) => want.some((w) => t.id.includes(w))) : PROBLEMS;
if (!list.length) { console.error("no templates matched"); process.exit(1); }
for (const t of list) console.log(probe(t));
