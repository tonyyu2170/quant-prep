/* What is the actual agreement between each authored chain and its independently published
 * reference? The gate's tolerance comes from this, not from what makes the gate pass.
 *   npx tsx tools/fermi-crosscheck.ts
 *
 * The plan this implements checked one reference row per template. Task 0 landed a published
 * figure for every row, so this measures all of them — 100 comparisons, not 2.
 */
import { FERMI_TEMPLATES } from "../content/fermi";

const q = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};

let worst = 0;

for (const t of FERMI_TEMPLATES) {
  const gaps: { gap: number; name: string }[] = [];
  for (let i = 0; i < t.count; i++) {
    const item = t.itemAt(i);
    const chain = item.chain.reduce((a, f) => a * f.value, 1);
    gaps.push({ gap: Math.log10(chain) - Math.log10(item.truth.value), name: item.id.split("#")[1] ?? item.id });
  }
  gaps.sort((a, b) => a.gap - b.gap);
  const vals = gaps.map((g) => g.gap);
  const abs = vals.map(Math.abs);
  const maxAbs = Math.max(...abs);
  worst = Math.max(worst, maxAbs);

  console.log(`\n${t.id}  (n=${gaps.length})`);
  console.log(`  median ${q(vals, 0.5) >= 0 ? "+" : ""}${q(vals, 0.5).toFixed(4)}   ` +
    `min ${gaps[0].gap.toFixed(4)} (${gaps[0].name})   ` +
    `max +${gaps[gaps.length - 1].gap.toFixed(4)} (${gaps[gaps.length - 1].name})`);
  console.log(`  worst |gap| ${maxAbs.toFixed(4)}  (factor ${(10 ** maxAbs).toFixed(2)})`);
  for (const thr of [0.15, 0.2, 0.25, 0.3]) {
    console.log(`     within ${thr.toFixed(2)}: ${abs.filter((a) => a < thr).length}/${abs.length}`);
  }
}

// Task 4 step 3: tolerance is roughly 1.5x the worst absolute gap, rounded to one decimal.
const suggested = Math.round(worst * 1.5 * 10) / 10;
console.log(`\nworst |gap| across all templates: ${worst.toFixed(4)}`);
console.log(`1.5x worst = ${(worst * 1.5).toFixed(4)}  ->  CROSS_CHECK_TOLERANCE_LOG10 = ${suggested.toFixed(1)}`);

/* The tolerance has to leave room for the data to be re-retrieved without CI going red, while
 * still failing on a wrong rate. Both directions are reported so the choice is made on numbers.
 * A rate wrong by a factor of 2 shifts EVERY row by exactly 0.301, so that is the catch to size
 * against; the gate trips if even one row exceeds the tolerance. */
for (const tol of [0.25, 0.3, 0.35, 0.4]) {
  const parts: string[] = [];
  for (const t of FERMI_TEMPLATES) {
    let broken = 0;
    for (let i = 0; i < t.count; i++) {
      const item = t.itemAt(i);
      const chain = item.chain.reduce((a, f) => a * f.value, 1);
      if (Math.abs(Math.log10(chain) - Math.log10(item.truth.value) + 0.301) >= tol) broken++;
    }
    parts.push(`${t.id.replace("fermi/", "")} ${broken}/${t.count}`);
  }
  console.log(`  tol ${tol.toFixed(2)}  headroom ${(tol / worst).toFixed(2)}x  ` +
    `rows failing on a 2x rate error: ${parts.join(", ")}${tol === suggested ? "   <- selected" : ""}`);
}
