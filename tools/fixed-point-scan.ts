/* The fixed-point scan: which templates let a generic wrong operation grade as correct.
 *
 * B22's lesson, stated in one line, was "a trap is a fixed point of the wrong operation" —
 * 1 is its own square and its own reciprocal, an even number of sign flips is no flip, 0
 * survives doubling. `trap-audit.ts` proves that per template, but each row there is a
 * hand-written wrong method, so it only ever covers the templates someone sat down and wrote
 * rows for. Everything before B18 has never had its `commonTrap` machine-checked at all.
 *
 * This scan is the part that needs no authoring. It ignores what the template is about and
 * asks only: over the full legal space, does the ANSWER ever land on a value where a generic
 * corruption of it still grades as correct? Those are the draws on which a student who
 * negated, inverted, squared or complemented their result gets marked right.
 *
 *   npx tsx tools/fixed-point-scan.ts
 *
 * It is a diagnostic, not a gate, and it does not set an exit code — a hit is not automatically
 * a defect. An answer that is legitimately 0.5 makes the complement invisible whether or not
 * the template teaches anything about complements. Read a hit against that template's
 * `commonTrap`: the hit matters when the named trap is the corruption listed here, and the fix
 * is a constraint that keeps the answer off the fixed point, never softened prose.
 *
 * What it CANNOT see, so do not read a clean run as coverage: any wrong method that recomputes
 * the chain rather than corrupting its result — "forgot to square the off-diagonal", "dropped
 * beta from the bound", "powered the start vector as a lump". Those need a row in
 * `trap-audit.ts`.
 */
import { grade } from "@qp/engine";
import { PROBLEMS } from "../content/problems";
import { forEachLegalDraw } from "../content/problems/draw-space";

/** Each corruption with the answer values at which it becomes invisible. */
const CORRUPTIONS: [string, (v: number) => number][] = [
  ["negated            (fixed at 0)", (v) => -v],
  ["reciprocal         (fixed at +/-1)", (v) => 1 / v],
  ["squared            (fixed at 0, 1)", (v) => v * v],
  ["square-rooted      (fixed at 0, 1)", (v) => Math.sqrt(v)],
  ["complemented 1-v   (fixed at 0.5)", (v) => 1 - v],
  ["doubled            (fixed at 0)", (v) => 2 * v],
  ["halved             (fixed at 0)", (v) => v / 2],
];

type Hit = { id: string; n: number; trap: string; rows: [string, number][]; at: number[] };
const hits: Hit[] = [];
let scanned = 0;

for (const t of PROBLEMS) {
  // A choice answer is a 1-based index into labels, not a quantity: halving it or taking its
  // reciprocal is not a mistake a student can make, so every row here would be noise.
  if (t.choices) continue;
  scanned++;
  const wins = CORRUPTIONS.map(() => 0);
  // The answers a hit actually landed on: 0 and 1 read as a degenerate instance, 0.5 as a
  // coin flip the complement cannot be told apart from. Without them every row is a rate
  // with nothing to check it against.
  const at = new Set<number>();
  let n = 0;
  forEachLegalDraw(t, (p) => {
    n++;
    const v = t.derived(p)[t.answerKey] as number;
    CORRUPTIONS.forEach(([, f], i) => {
      if (grade(f(v), v, t.accepted.tolerance)) { wins[i]++; at.add(v); }
    });
  });
  const rows = CORRUPTIONS.map(([name], i) => [name, wins[i]] as [string, number]).filter(([, w]) => w > 0);
  if (rows.length) hits.push({ id: t.id, n, trap: t.commonTrap, rows, at: [...at].sort((a, b) => a - b) });
}

hits.sort((a, b) => Math.max(...b.rows.map(([, w]) => w / b.n)) - Math.max(...a.rows.map(([, w]) => w / a.n)));
for (const h of hits) {
  console.log(`\n${h.id}  (${h.n} legal draws)`);
  console.log(`  lands on: ${h.at.slice(0, 6).map((v) => v.toFixed(4)).join(", ")}${h.at.length > 6 ? ` (+${h.at.length - 6} more)` : ""}`);
  console.log(`  trap: ${h.trap}`);
  for (const [name, w] of h.rows) {
    console.log(`  ${name.padEnd(38)} wins=${String(w).padStart(7)}  ${((100 * w) / h.n).toFixed(2)}%`);
  }
}
console.log(`\n${hits.length} of ${scanned} non-choice templates have an answer that lands on a fixed point.`);
