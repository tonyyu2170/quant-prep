/* The fixed-point scan: which templates let a generic wrong operation grade as correct.
 *
 * B22's lesson, stated in one line, was "a trap is a fixed point of the wrong operation" —
 * 1 is its own square and its own reciprocal, an even number of sign flips is no flip, 0
 * survives doubling. `trap-audit.ts` proves that per template, but each row there is a
 * hand-written wrong method, so it only ever covers the templates someone sat down and wrote
 * rows for. Everything before B18 has never had its `commonTrap` machine-checked at all.
 *
 * This scan is the part that needs no authoring. It ignores what the template is about and
 * asks only: over the full legal space, does the ANSWER ever land where a generic corruption
 * of it still grades as correct?
 *
 *   npx tsx tools/fixed-point-scan.ts
 *
 * WHAT IT DOES NOT TELL YOU. A hit says a GENERIC corruption is invisible on that draw. It
 * does NOT say the template's own `commonTrap` is live — `standard-error-of-a-slope` lands on
 * 0.5 while its named trap is n versus n-2, which no corruption of the answer expresses. Only
 * a row in `trap-audit.ts` can make that claim. Read a hit as a place to look, never as a
 * defect count, and never as coverage: any wrong method that recomputes the chain rather than
 * corrupting its result is invisible here.
 *
 * WHY THE TWO SECTIONS. An EXACT hit is a real fixed point: the answer IS 0.5, so `1 - v` is
 * arithmetically the same number and no tolerance anywhere would separate them. A PROXIMATE
 * hit is a different animal wearing the same clothes — the answer is 0.9926, `v*v` is 0.9852,
 * and the two are only indistinguishable because a relative tolerance near 1 is wide enough to
 * swallow the gap. That is tolerance width, which `trap-audit.ts` already reports as minMiss,
 * and mixing the two makes every rate column meaningless. They are counted apart for that
 * reason; the exact section is the one that carries a finding.
 */
import { grade } from "@qp/engine";
import { PROBLEMS } from "../content/problems";
import { forEachLegalDraw } from "../content/problems/draw-space";

/** Each corruption with the answer values at which it becomes arithmetically invisible. */
const CORRUPTIONS: [string, (v: number) => number][] = [
  ["negated            (fixed at 0)", (v) => -v],
  ["reciprocal         (fixed at +/-1)", (v) => 1 / v],
  ["squared            (fixed at 0, 1)", (v) => v * v],
  ["square-rooted      (fixed at 0, 1)", (v) => Math.sqrt(v)],
  ["complemented 1-v   (fixed at 0.5)", (v) => 1 - v],
  ["doubled            (fixed at 0)", (v) => 2 * v],
  ["halved             (fixed at 0)", (v) => v / 2],
];

/** The union of the fixed points above: an answer here is invisible to some corruption at any
 *  tolerance, including an exact one. Anything else that grades equal did so on band width. */
const FIXED = [0, 1, -1, 0.5];

type Hit = { id: string; n: number; trap: string; exact: number; near: number; at: number[]; rows: [string, number][] };
const hits: Hit[] = [];
let scanned = 0;

for (const t of PROBLEMS) {
  // A choice answer is a 1-based index into labels, not a quantity: halving it or taking its
  // reciprocal is not a mistake a student can make, so every row here would be noise.
  if (t.choices) continue;
  scanned++;
  const wins = CORRUPTIONS.map(() => 0);
  const at = new Set<number>();
  let n = 0, exact = 0, near = 0;
  forEachLegalDraw(t, (p) => {
    n++;
    const v = t.derived(p)[t.answerKey] as number;
    let any = false;
    CORRUPTIONS.forEach(([, f], i) => {
      if (grade(f(v), v, t.accepted.tolerance)) { wins[i]++; any = true; }
    });
    if (!any) return;
    if (FIXED.includes(v)) { exact++; at.add(v); } else near++;
  });
  const rows = CORRUPTIONS.map(([name], i) => [name, wins[i]] as [string, number]).filter(([, w]) => w > 0);
  if (rows.length) hits.push({ id: t.id, n, trap: t.commonTrap, exact, near, at: [...at].sort((a, b) => a - b), rows });
}

function show(h: Hit, count: number) {
  const where = h.at.length ? `  lands on ${h.at.join(", ")}` : "";
  console.log(`\n${((100 * count) / h.n).toFixed(2).padStart(6)}%  ${h.id}  (${count} of ${h.n} legal draws)${where}`);
  for (const [name, w] of h.rows) console.log(`          ${name.padEnd(38)} wins=${String(w).padStart(7)}`);
  console.log(`          trap: ${h.trap}`);
}

const exactHits = hits.filter((h) => h.exact > 0).sort((a, b) => b.exact / b.n - a.exact / a.n);
const nearOnly = hits.filter((h) => h.exact === 0);

console.log("=".repeat(100));
console.log("EXACT — the answer IS the fixed point, and no tolerance would ever separate the two");
console.log("=".repeat(100));
for (const h of exactHits) show(h, h.exact);

console.log(`\n${"=".repeat(100)}`);
console.log("PROXIMATE ONLY — the answer never lands on a fixed point; these grade equal on band width alone,");
console.log("which is tolerance width already reported as minMiss by trap-audit.ts, not a fixed point");
console.log("=".repeat(100));
for (const h of nearOnly) console.log(`  ${((100 * h.near) / h.n).toFixed(2).padStart(6)}%  ${h.id}  (${h.near} of ${h.n})`);

console.log(`\n${exactHits.length} templates land on a fixed point exactly; ${nearOnly.length} grade equal on band width only; ${scanned} non-choice templates scanned.`);
