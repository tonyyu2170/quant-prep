/* The trap audit, run against the SHIPPED templates rather than against drafting stubs.
 *
 * B18 and B22 both found this the highest-yield check in a batch: a `commonTrap` naming a
 * computation that GRADES AS CORRECT somewhere in the legal space is a wrong method shown to a
 * student who then gets marked right, and no content gate can see it. B22 opened with eleven
 * templates and eleven such traps, the worst at 74% of draws.
 *
 * It lives in the tree rather than being deleted with the drafting roster because the fixes are
 * choice lists and constraint conjuncts — editing either silently reopens a trap, and a comment
 * saying "keep m away from one" is not a mechanism.
 *
 *   npx tsx tools/_b22-audit.ts
 *
 * Reading it: the CONTROL row must win 100%, or the harness is broken and every zero beneath it
 * is meaningless. minMiss is the closest LOSING draw in multiples of the grading tolerance — a
 * trap at 1.3x is a hit waiting for a wider draw.
 */
import { grade, type Params } from "@qp/engine";
import { byId } from "../content/problems";
import { forEachLegalDraw } from "../content/problems/draw-space";

type Row = (p: Params, d: Record<string, number>) => number;

let broken = 0;

function audit(id: string, rows: Record<string, Row>) {
  const t = byId.get(id)!;
  if (!t) throw new Error(`no such template: ${id}`);
  const names = Object.keys(rows);
  const wins = new Map(names.map((n) => [n, 0]));
  const near = new Map(names.map((n) => [n, Infinity]));
  let n = 0;
  forEachLegalDraw(t, (p) => {
    n++;
    const d = t.derived(p) as Record<string, number>;
    const truth = d[t.answerKey];
    const bound = Math.max(t.accepted.tolerance.abs ?? 0, (t.accepted.tolerance.rel ?? 0) * Math.abs(truth));
    for (const name of names) {
      const v = rows[name](p, d);
      if (grade(v, truth, t.accepted.tolerance)) wins.set(name, wins.get(name)! + 1);
      if (bound > 0) near.set(name, Math.min(near.get(name)!, Math.abs(v - truth) / bound));
    }
  });
  console.log(`\n${t.id}  (${n} legal draws)`);
  for (const name of names) {
    const w = wins.get(name)!;
    const bad = name.startsWith("CONTROL") ? w !== n : w !== 0;
    if (bad) broken++;
    console.log(`  ${bad ? "!!" : "  "} ${name.padEnd(36)} wins=${String(w).padStart(6)}  ${((100 * w) / n).toFixed(2)}%  minMiss=${near.get(name)!.toFixed(2)}x`);
  }
}

audit("linear-algebra/solve-two-by-two-system", {
  "CONTROL x": (p) => p.x,
  "trap: solved for y instead": (p) => p.y,
  "trap: Cramer upside down": (_p, d) => d.det / d.numer,
});
audit("linear-algebra/singular-matrix-missing-entry", {
  "CONTROL bc/a": (_p, d) => (d.b * 1) / 1 && d.answer,
  "trap: forgot to divide by a": (_p, d) => d.cross,
  "trap: divided the wrong way": (p, d) => (p.a * p.c) / d.b,
  "trap: read off the product ac": (p) => p.a * p.c,
});
audit("linear-algebra/projection-first-component", {
  "CONTROL c*a1": (_p, d) => d.answer,
  "trap: gave the coefficient": (_p, d) => d.ab / d.aa,
  "trap: gave b1 unprojected": (_p, d) => d.b1,
  "trap: divided by |a| not |a|^2": (_p, d) => d.ab / Math.sqrt(d.aa),
});
audit("linear-algebra/orthogonal-residual-squared", {
  "CONTROL s^2|r|^2": (_p, d) => d.answer,
  "trap: the length not squared": (_p, d) => Math.sqrt(d.answer),
  "trap: scaled linearly not squared": (p, d) => d.bb - p.c * d.aa,
  "trap: |r|^2 alone": (_p, d) => d.rr,
});
audit("linear-algebra/quadratic-through-three-points", {
  "CONTROL Newton forward": (_p, d) => d.answer,
  "trap: extrapolated linearly": (_p, d) => d.linearOnly,
  "trap: dropped the halving": (p, d) => p.y1 + d.steps * d.d1 + d.steps * d.stepsLess * d.d2,
});
audit("linear-algebra/block-triangular-determinant", {
  "CONTROL d1*d2": (p) => p.d1 * p.d2,
  "trap: traces multiplied in": (p) => p.t1 * p.t2 * p.d1 * p.d2,
  "trap: added the two dets": (p) => p.d1 + p.d2,
  "trap: whole trace times det": (p) => (p.t1 + p.t2) * p.d1 * p.d2,
});
audit("linear-algebra/eigenvector-component-ratio", {
  "CONTROL m": (p) => p.m,
  "trap: reciprocal ratio": (p) => 1 / p.m,
  "trap: read c/a off the matrix": (_p, d) => d.c / d.a,
});
audit("linear-algebra/determinant-after-row-operations", {
  "CONTROL sign*det*k": (_p, d) => d.answer,
  "trap: forgot the swap sign": (_p, d) => d.scaled,
  "trap: scaled by k^n not k": (p, d) => d.sign * p.det * Math.pow(p.k, p.n),
  "trap: no scaling at all": (p, d) => d.sign * p.det,
});
audit("linear-algebra/matrix-power-times-a-vector", {
  "CONTROL two modes": (_p, d) => d.answer,
  "trap: powered x0 as a lump": (p, d) => d.x0 * Math.pow(p.lam1, p.k),
  "trap: dropped the second mode": (_p, d) => d.firstMode,
  "trap: powered the summed lambdas": (p, d) => d.x0 * Math.pow(p.lam1 + p.lam2, p.k),
});
audit("linear-algebra/tridiagonal-determinant", {
  "CONTROL continuant": (_p, d) => d.answer,
  "trap: diagonal product only": (p) => Math.pow(p.d, p.n),
  "trap: forgot to square b": (p) => {
    let prev = 1, cur = p.d;
    for (let i = 2; i <= p.n; i++) { const nx = p.d * cur - p.b * prev; prev = cur; cur = nx; }
    return cur;
  },
});
audit("statistics/sprt-consecutive-wins", {
  "CONTROL ceil(lnA/ln step)": (_p, d) => d.answer,
  "trap: floored instead": (_p, d) => Math.floor(d.exact ?? Math.log(d.bound) / Math.log(d.step)),
  "trap: beta dropped from the bound": (_p, d) => Math.ceil(Math.log(1 / d.alphaRate) / Math.log(d.step)),
  "trap: used the lower bound B": (_p, d) => Math.ceil(Math.log(d.betaRate / (1 - d.alphaRate)) / Math.log(d.step)),
});

console.log(broken === 0
  ? "\nAll controls won outright and no trap won a single draw."
  : `\n${broken} ROW(S) WRONG — a control below 100% voids its block; a trap above zero grades a wrong method as correct.`);
if (broken) process.exit(1);
