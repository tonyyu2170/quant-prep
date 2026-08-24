/* Emits chains and the TS-computed combined intervals, for verify_fermi.py to re-derive by
 * simulation. Run: npx tsx verification/fermi-fixture.ts */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { combineFactors, intervalScore, makeRng, type Factor } from "@qp/engine";

const rng = makeRng(20260824);
const cases: unknown[] = [];

for (let c = 0; c < 200; c++) {
  const n = 2 + Math.floor(rng() * 5);                 // 2..6 factors
  const factors: Factor[] = [];
  for (let i = 0; i < n; i++) {
    const centre = 10 ** (rng() * 8 - 3);              // 1e-3 .. 1e5
    const halfDecades = 0.1 + rng() * 1.5;
    factors.push({ label: `f${i}`, lo: centre / 10 ** halfDecades, hi: centre * 10 ** halfDecades });
  }
  const combined = combineFactors(factors);
  const truth = 10 ** (combined.muLog10 + (rng() * 4 - 2) * combined.sigmaLog10);
  cases.push({
    factors: factors.map((f) => ({ lo: f.lo, hi: f.hi })),
    combined: { lo: combined.lo, hi: combined.hi, mu: combined.muLog10, sigma: combined.sigmaLog10 },
    truth,
    score: intervalScore(combined.lo, combined.hi, truth),
  });
}

writeFileSync(join(__dirname, "fermi-instances.json"), JSON.stringify({ cases }, null, 1));
console.log(`wrote ${cases.length} fermi cases`);
