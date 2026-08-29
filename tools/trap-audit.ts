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
 *   npm run audit:traps
 *
 * Covered: linear-algebra 10, statistics/sprt 1 (B22); number-theory 8, markov 8,
 * solid-geometry 6 (B24) — 33 of 347.
 * Everything else in the bank has a `commonTrap` no row has ever been written for, and
 * tools/fixed-point-scan.ts is NOT a substitute: a generic corruption of the answer says
 * nothing about whether that template's OWN named trap grades as correct.
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
      // `near` counts LOSING draws only. Folding winners in would drive it to ~0 for exactly
      // the rows where it matters, and the reading below promises the closest losing draw.
      if (grade(v, truth, t.accepted.tolerance)) wins.set(name, wins.get(name)! + 1);
      else if (bound > 0 && Number.isFinite(v)) near.set(name, Math.min(near.get(name)!, Math.abs(v - truth) / bound));
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

/* ---- number-theory (B24) ----------------------------------------------------------------
 * All eight grade at `abs: 0`, so a hit is exact equality and `minMiss` prints Infinity
 * throughout — the `bound > 0` guard above skips it, which is why this family was audited
 * first: there is no tolerance-band judgement to get wrong.
 *
 * Every CONTROL below recomputes the answer by a route the template does not use — a brute
 * scan, the mirrored enumeration, an inverted formula. A control reading `d.answer` back is a
 * tautology that always wins, and would make this harness's own claim ("a control below 100%
 * voids its block") false.
 *
 * Traps the prose names that CANNOT be written as a row, recorded rather than invented:
 *   crt-two-congruences         "expecting a solution when the two row sizes share a factor" —
 *                               `constraint` excludes those draws, so there is no value to grade.
 *   frobenius-fit-then-count    "enumerating the gaps by hand" — a method, not a number.
 *   frobenius-largest-unpayable "hunting for a three-coin formula" — likewise.
 */
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const payable = (v: number, a: number, b: number) => {
  for (let y = 0; y * b <= v; y++) if ((v - y * b) % a === 0) return true;
  return false;
};

audit("number-theory/coprime-count-two-primes", {
  "CONTROL brute coprime count": (p) => {
    let n = 0;
    for (let k = 1; k <= p.pr * p.qr * p.mult; k++) if (gcd(k, p.pr * p.qr) === 1) n++;
    return n;
  },
  "trap: overlap never added back": (_p, d) => d.span - d.dropP - d.dropQ,
  "trap: product less one, not both reduced": (p) => p.mult * (p.pr * p.qr - 1),
});
audit("number-theory/crt-two-congruences", {
  "CONTROL brute scan of one period": (p) => {
    for (let n = 0; n < p.m1 * p.m2; n++) if (n % p.m1 === p.r1 && n % p.m2 === p.r2) return n;
    return NaN;
  },
  "trap: remainders added": (p) => p.r1 + p.r2,
  "trap: remainders multiplied": (p) => p.r1 * p.r2,
});
audit("number-theory/diophantine-count-solutions", {
  "CONTROL double scan over x and y": (p) => {
    let n = 0;
    for (let x = 0; x * p.a <= p.c; x++) for (let y = 0; y * p.b <= p.c; y++) if (x * p.a + y * p.b === p.c) n++;
    return n;
  },
  "trap: load over the summed sizes": (p) => Math.floor(p.c / (p.a + p.b)),
  "trap: using none of one size disallowed": (p) => {
    let n = 0;
    for (let x = 1; x * p.a <= p.c; x++) if ((p.c - x * p.a) % p.b === 0 && (p.c - x * p.a) / p.b >= 1) n++;
    return n;
  },
});
audit("number-theory/frobenius-fit-then-count", {
  "CONTROL gaps by scan, coin by inversion": (p, d) => {
    if (p.wanted === 2) return (d.largest + p.coinA) / (p.coinA - 1);
    let n = 0;
    for (let v = 0; v <= d.largest; v++) if (!payable(v, p.coinA, p.coinB)) n++;
    return n;
  },
  "trap: gap divided by the known coin": (p, d) => (p.wanted === 2 ? d.largest / p.coinA : NaN),
});
audit("number-theory/frobenius-largest-unpayable", {
  "CONTROL largest gap by downward scan": (p) => {
    for (let v = p.coinA * p.coinB; v >= 0; v--) if (!payable(v, p.coinA, p.coinB)) return v;
    return NaN;
  },
  "trap: only the smaller coin subtracted": (p) => p.coinA * p.coinB - p.coinA,
  "trap: only the larger coin subtracted": (p) => p.coinA * p.coinB - p.coinB,
});
audit("number-theory/gcd-lcm-product", {
  "CONTROL lcm from the two numbers themselves": (_p, d) => (d.first * d.second) / gcd(d.first, d.second),
  "trap: the plain product as the lcm": (_p, d) => d.first * d.second,
  "trap: the divisor taken out of both": (p) => p.m * p.n,
});
audit("number-theory/linear-congruence-solve", {
  "CONTROL brute scan of x": (p) => {
    for (let x = 0; x < p.m; x++) if ((p.a * x) % p.m === p.r) return x;
    return NaN;
  },
  "trap: target divided by the multiplier": (p) => p.r / p.a,
  "trap: the inverse reported unapplied": (_p, d) => d.inverse,
});
audit("number-theory/multiples-in-a-range", {
  "CONTROL enumerate the whole range": (p) => {
    let n = 0;
    for (let k = 1; k <= p.upto; k++) if (k % p.by === 0 && k % p.notBy !== 0) n++;
    return n;
  },
  "trap: second list struck out whole": (p) => Math.floor(p.upto / p.by) - Math.floor(p.upto / p.notBy),
  "trap: product used for the overlap": (p) => Math.floor(p.upto / p.by) - Math.floor(p.upto / (p.by * p.notBy)),
});

/* ---- markov (B24) -----------------------------------------------------------------------
 * All eight grade at `rel: 0.005`, so unlike number-theory above `minMiss` is real here: a
 * trap at 1.3x is a hit waiting for a wider draw, and two of these sit close.
 *
 * Every CONTROL solves the chain by FIXED-POINT ITERATION rather than by the closed form the
 * template derives. That is the honest independent route for a Markov template — it re-derives
 * the answer from the transition structure in the statement, so a wrong closed form would show
 * up as a control below 100% instead of being quietly confirmed.
 *
 * deuce-win-by-two gets a control and NO trap row, deliberately. Its `commonTrap` names summing
 * the split-then-split-then-win series, which the prose itself says "converges to the same
 * number" — a valid-but-slow route, not a wrong answer. A row for it would be a second control
 * dressed as a trap. It is written as the control instead, which is exactly what it is.
 */
const iterate = (n: number, step: () => void) => { for (let i = 0; i < n; i++) step(); };

audit("markov/consecutive-run-wait", {
  // e[i] = 1 + p*e[i+1] + q*e[0], solved as e[i] = A_i + B_i*e0 backwards from e[k] = 0.
  "CONTROL run-length state recursion": (p) => {
    const hit = p.hitsPer / p.outOf, miss = 1 - hit;
    let a = 0, b = 0;
    for (let i = p.runLength - 1; i >= 0; i--) { a = 1 + hit * a; b = hit * b + miss; }
    return a / (1 - b);
  },
  "trap: reciprocal of the run probability": (_p, d) => d.runFloor,
});
audit("markov/deuce-win-by-two", {
  // The infinite series the commonTrap names: p^2 * sum_n (2pq)^n. A genuinely different route
  // to the same number, which is the finding — see the block comment.
  "CONTROL the split-path series summed": (_p, d) => {
    const win = d.prob, lose = d.lossProb;
    let total = 0, term = win * win;
    for (let n = 0; n < 4000; n++) { total += term; term *= 2 * win * lose; }
    return total;
  },
});
audit("markov/machine-uptime-stationary", {
  "CONTROL chain iterated to stationarity": (p, d) => {
    let live = 0.5;
    iterate(20000, () => { live = live * (1 - d.failRate) + (1 - live) * d.fixRate; });
    return p.days * live;
  },
  "trap: repair rate read off alone": (p, d) => p.days * d.fixRate,
});
audit("markov/maze-food-before-trap", {
  "CONTROL two-room absorption iterated": (p) => {
    let inA = 0, inB = 0;
    iterate(20000, () => {
      const nextA = 1 / p.doorsA + ((p.doorsA - 1) / p.doorsA) * inB;
      const nextB = ((p.doorsB - 1) / p.doorsB) * inA;
      inA = nextA; inB = nextB;
    });
    return inA;
  },
  "trap: bare ratio of the door counts": (p) => p.doorsB / (p.doorsA + p.doorsB),
});
audit("markov/switching-coins-share", {
  "CONTROL chain iterated to stationarity": (_p, d) => {
    let inA = 0.5;
    iterate(20000, () => { inA = inA * (1 - d.tailsARate) + (1 - inA) * d.tailsBRate; });
    return inA;
  },
  "trap: shares weighted by heads directly": (p) => p.headsAPct / (p.headsAPct + p.headsBPct),
  "trap: heads weighted the other way round": (p) => p.headsBPct / (p.headsAPct + p.headsBPct),
});
audit("markov/system-days-to-failure", {
  "CONTROL three-state hitting time iterated": (_p, d) => {
    let fresh = 0, worn = 0;
    iterate(40000, () => {
      const nextFresh = 1 + (1 - d.wearRate) * fresh + d.wearRate * worn;
      const nextWorn = 1 + d.repairRate * fresh + (1 - d.breakRate - d.repairRate) * worn;
      fresh = nextFresh; worn = nextWorn;
    });
    return fresh;
  },
  "trap: mean time in each state added": (p) => 100 / p.wearPct + 100 / p.breakPct,
});
audit("markov/tunnel-doors-escape", {
  "CONTROL memoryless recursion iterated": (p) => {
    let hours = 0;
    iterate(20000, () => { hours = (p.exitHours + (p.loopOneHours + hours) + (p.loopTwoHours + hours)) / 3; });
    return hours;
  },
  // With memory the exit tunnel sits uniformly in a random permutation of the three, so each
  // loop is walked before it with probability one half.
  "trap: the miner remembers his tunnels": (p) => p.exitHours + (p.loopOneHours + p.loopTwoHours) / 2,
});
audit("markov/two-state-after-k-days", {
  "CONTROL transition applied k times": (p, d) => {
    let calm = 1;
    for (let i = 0; i < p.days; i++) calm = calm * (1 - d.leaveRate) + (1 - calm) * d.returnRate;
    return calm;
  },
  "trap: the long-run share at a finite horizon": (_p, d) => d.stationary,
});

/* ---- solid-geometry (B24) ---------------------------------------------------------------
 * Four of the six branch on a `wanted` param, and a row that ignores the branch is nonsense on
 * half the draws — it can score zero for the wrong reason and read as a clean pass. Every row
 * below therefore answers the question actually asked, and returns NaN where the slip does not
 * apply to that branch at all (grade() rejects a non-finite value, packages/engine/src/grade.ts).
 *
 * Three slips the prose names that CANNOT be written as a row:
 *   cone-frustum-fraction   "a cylinder of some average radius" — no definite radius is named,
 *                           so there is no one value to grade.
 *   volume-scaling          "cubing it for the surface too" — the question never asks for a
 *                           surface, so the slip cannot produce a wrong answer to it.
 *
 * displacement-water-rise USED to name a third: "dividing by the tank's VOLUME rather than its
 * floor area". The statement gives a floor and no height, so there is no tank volume on the page
 * and the slip was unreachable — a trap warning against a mistake nobody can make. Its prose now
 * names taking the rise to be the cube's own height, which is both a real intuition and a value
 * this file can grade.
 */
audit("solid-geometry/box-fit-then-diagonal", {
  // Math.hypot twice, which is the two-Pythagorean-steps route the solution describes in words,
  // rather than the one-shot sum of three squares the template computes.
  "CONTROL two hypot steps / volume over base": (p, d) =>
    p.wanted === 1 ? Math.hypot(Math.hypot(p.edgeA, p.edgeB), p.edgeC) : d.volume / d.faceArea,
  "trap: three edges added, not their squares": (p) => (p.wanted === 1 ? p.edgeA + p.edgeB + p.edgeC : NaN),
  "trap: stopped at the base diagonal": (p) => (p.wanted === 1 ? Math.hypot(p.edgeA, p.edgeB) : NaN),
});
audit("solid-geometry/cone-frustum-fraction", {
  // The frustum's own volume formula, (h/3)(R^2+Rr+r^2), against the full cone — a different
  // route from the difference of cubes, and the one a student who has memorised it would take.
  "CONTROL frustum formula over the full cone": (p) => {
    const h = p.bigR - p.smallR;
    const frustum = (h / 3) * (p.bigR * p.bigR + p.bigR * p.smallR + p.smallR * p.smallR);
    const whole = (p.bigR / 3) * p.bigR * p.bigR;
    return p.wanted === 1 ? frustum / whole : 1 - frustum / whole;
  },
  "trap: tip taken as the plain radius ratio": (p) => {
    const share = p.smallR / p.bigR;
    return p.wanted === 2 ? share : 1 - share;
  },
  "trap: tip taken as the squared ratio": (p) => {
    const share = (p.smallR / p.bigR) ** 2;
    return p.wanted === 2 ? share : 1 - share;
  },
});
audit("solid-geometry/displacement-water-level-rise", {
  // Inverts base * rise = displaced by bisection, so the control never performs the division
  // the template performs — a swapped numerator and denominator would not survive it.
  "CONTROL rise found by bisection": (_p, d) => {
    let lo = 0, hi = d.displaced + 1;
    for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (d.base * mid < d.displaced) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  },
  "trap: the cube's face area, not its volume": (p, d) => (p.cube * p.cube) / d.base,
  // Safe by construction rather than by a conjunct: `constraint` keeps the cube at or under half
  // the shorter tank side, so the floor is at least 4x the cube's own face and the rise can never
  // exceed a quarter of the cube's height. The miss is ~600x the tolerance at its closest.
  "trap: the rise taken as the cube's height": (p) => p.cube,
});
audit("solid-geometry/spherical-cap-fraction", {
  // Integrates the cap as a stack of discs, pi(r^2 - z^2) dz, instead of using h^2(3r-h)/4r^3.
  "CONTROL cap integrated as discs": (p) => {
    const n = 20000, lo = -p.radius, hi = -p.radius + p.depth, dz = (hi - lo) / n;
    let cap = 0;
    for (let i = 0; i < n; i++) { const z = lo + (i + 0.5) * dz; cap += (p.radius * p.radius - z * z) * dz; }
    const whole = (4 / 3) * Math.pow(p.radius, 3);
    return p.wanted === 1 ? cap / whole : 1 - cap / whole;
  },
  "trap: depth over the diameter": (p) => {
    const share = p.depth / (2 * p.radius);
    return p.wanted === 1 ? share : 1 - share;
  },
  "trap: radius used where the formula wants three": (p) => {
    const share = (p.depth * p.depth * (p.radius - p.depth)) / (4 * Math.pow(p.radius, 3));
    return p.wanted === 1 ? share : 1 - share;
  },
});
audit("solid-geometry/triangular-prism-volume", {
  // Pick's theorem on the lattice triangle: area = interior + boundary/2 - 1, counted rather
  // than halved. Exact integer arithmetic, which an abs: 0 control has to be.
  "CONTROL area by Pick's theorem": (p) => {
    let interior = 0;
    for (let x = 1; x < p.legA; x++) for (let y = 1; y < p.legB; y++) if (x * p.legB + y * p.legA < p.legA * p.legB) interior++;
    const boundary = p.legA + p.legB + gcd(p.legA, p.legB);
    return (interior + boundary / 2 - 1) * p.length;
  },
  "trap: the whole rectangle, never halved": (_p, d) => d.solidBar,
  "trap: the longer leg read as the hypotenuse": (p) =>
    (p.legA * Math.sqrt(p.legB * p.legB - p.legA * p.legA) * p.length) / 2,
});
audit("solid-geometry/volume-scaling-under-similarity", {
  // Weak by necessity — the template is one multiplication and there is no second route to it.
  // Scaling three times in sequence rather than by Math.pow at least fails on a wrong exponent.
  "CONTROL scaled three times in sequence": (p) => {
    let v = p.wanted === 1 ? p.vol : 1;
    for (let i = 0; i < 3; i++) v *= p.factor;
    return v;
  },
  "trap: capacity scaled by the length factor once": (p) => (p.wanted === 1 ? p.vol * p.factor : p.factor),
});

console.log(broken === 0
  ? "\nAll controls won outright and no trap won a single draw."
  : `\n${broken} ROW(S) WRONG — a control below 100% voids its block; a trap above zero grades a wrong method as correct.`);
if (broken) process.exit(1);
