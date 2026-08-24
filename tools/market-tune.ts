/* CREDIT_CAP tuning rig — the experiment spec §10 says to run, in the form that can actually
 * be re-run. Answers the two questions a single played session cannot answer with confidence:
 *
 *   1. Does width choice matter, or is one extreme dominant?
 *   2. What centring skill is needed to clear zero?
 *
 * Model: the player's centre lands at truth + e, with e ~ Normal(0, sigma) in SCORING UNITS,
 * and they choose a half-width h (also units). Settlement, straight from settle():
 *   |e| <= h  ->  CREDIT_CAP - 2h      (no trade, credit shrinks with width)
 *   |e| >  h  ->  -(|e| - h)           (picked off by the distance outside)
 * sigma is the player's skill: small sigma = estimates land close to truth.
 *
 *   npx tsx tools/market-tune.ts [cap]        (default cap = CREDIT_CAP)
 */
import { CREDIT_CAP, makeRng } from "@qp/engine";

const cap = Number(process.argv[2] ?? CREDIT_CAP);
const N = 200_000;

// Fixed error sample per sigma, reused across every h, so curves are comparable and not noise.
const rng = makeRng(20260824);
const normals: number[] = [];
for (let i = 0; i < N; i++) {
  const u = Math.max(1e-12, rng()), v = rng();
  normals.push(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
}

const ev = (sigma: number, h: number) => {
  let sum = 0;
  for (const z of normals) {
    const e = Math.abs(z * sigma);
    sum += e <= h ? cap - 2 * h : -(e - h);
  }
  return sum / N;
};

const best = (sigma: number) => {
  let bh = 0, bv = -Infinity;
  for (let h = 0; h <= cap; h += 0.25) { const v = ev(sigma, h); if (v > bv) { bv = v; bh = h; } }
  return { h: bh, v: bv };
};

console.log(`CREDIT_CAP = ${cap}\n`);
console.log("sigma  | best h | width | E[pnl] @best | E[pnl] h=0 | E[pnl] widest-earning | pick-off @best");
console.log("-------+--------+-------+--------------+------------+-----------------------+---------------");
for (const sigma of [1, 2, 3, 5, 7.5, 10, 15, 20, 30]) {
  const b = best(sigma);
  // pick-off rate at the optimum: P(|e| > h)
  const rate = normals.filter((z) => Math.abs(z * sigma) > b.h).length / N;
  console.log(
    `${String(sigma).padStart(6)} | ${b.h.toFixed(2).padStart(6)} | ${(2 * b.h).toFixed(1).padStart(5)} |` +
    ` ${b.v.toFixed(2).padStart(12)} | ${ev(sigma, 0).toFixed(2).padStart(10)} |` +
    ` ${ev(sigma, cap / 2).toFixed(2).padStart(21)} | ${(rate * 100).toFixed(0).padStart(13)}%`);
}
console.log(`\nwidest-earning = h ${cap / 2} (width ${cap}), the point where credit reaches zero.`);
