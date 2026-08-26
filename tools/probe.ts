/* Drafting probe — reports the numbers the draw-space gate asserts on, for a template
 * that has not shipped yet. It IMPORTS those counters rather than copying them, so the gate
 * and the probe cannot drift apart; see the header of content/problems/draw-space.ts.
 *   npx tsx tools/probe.ts <template-id>...   (omit ids to probe the whole bank) */
import type { ProblemTemplate } from "@qp/engine";
import { acceptance, distinctAtBand, emittedSpread, forEachLegalDraw } from "../content/problems/draw-space";
import { PROBLEMS } from "../content/problems";

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
  const { rate, pThrow } = acceptance(t);
  parts.push(`distinctTexts=${texts.size}`, `accept=${(rate * 100).toFixed(1)}% pThrow=${pThrow.toExponential(1)} (floor 1e-9)`);
  return `${t.id.padEnd(46)} ${parts.join("  ")}`;
}

// CLI only when run directly, so a scratch script can `import { probe }` without this firing.
if (process.argv[1]?.endsWith("probe.ts")) {
  const want = process.argv.slice(2);
  const list = want.length ? PROBLEMS.filter((t) => want.some((w) => t.id.includes(w))) : PROBLEMS;
  if (!list.length) { console.error("no templates matched"); process.exit(1); }
  for (const t of list) console.log(probe(t));
}
