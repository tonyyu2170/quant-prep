/* Task 0 Step 2: all 16 B14 designs as stubs, probed. Deleted once the numbers are recorded. */
import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { probe } from "./probe";

const r9 = (x: number) => Math.round(x * 1e9) / 1e9;
const S = (o: Partial<ProblemTemplate> & Pick<ProblemTemplate, "id" | "params" | "derived">): ProblemTemplate => ({
  version: 1, topic: "pure-math/x", difficulty: 2, firms: [], accepted: { tolerance: { rel: 0.005 } },
  source: { kind: "textbook", inspiration: "" }, answerKey: "answer",
  statement: (p) => "Q " + Object.values(p).join(" "), solution: () => [{ title: "a", body: "b" }],
  keyInsight: "k", commonTrap: "c", expectedPaceS: 60, verify: { method: "brute-force" }, ...o,
} as ProblemTemplate);

const tail = (n: number, a: number) => {           // P(S_n >= a), symmetric +/-1 walk
  let s = 0;
  for (let ups = 0; ups <= n; ups++) {
    if (2 * ups - n < a) continue;
    let c = 1;
    for (let i = 0; i < Math.min(ups, n - ups); i++) c = (c * (n - i)) / (i + 1);
    s += c;
  }
  return s / Math.pow(2, n);
};

const R: ProblemTemplate[] = [
S({ id: "S1 expected-square-of-a-walk", params: {
    start: { choices: [4, 6, 9, 10, 12, 15, 20, 25] },
    steps: { choices: [3, 5, 8, 10, 12, 16, 20, 25] },
    tick:  { choices: [1, 2, 3, 4, 5, 6, 8, 10] } },
  constraint: (p) => p.steps * p.tick * p.tick <= 2000 && p.tick <= p.start,
  derived: (p) => ({ variance: p.steps * p.tick * p.tick, startSquared: p.start * p.start,
                     answer: p.start * p.start + p.steps * p.tick * p.tick }) }),

S({ id: "S2 martingale-missing-payoff", params: {
    pct1: { choices: [20, 25, 30, 35, 40, 45, 50] },
    pct2: { choices: [10, 15, 20, 25, 30, 40] },
    win:  { choices: [30, 40, 50, 60, 80, 100, 120, 150] },
    mid:  { choices: [8, 10, 12, 15, 18, 20, 24, 30] } },
  constraint: (p) => p.pct1 + p.pct2 <= 80 && p.win > p.mid
    && Math.abs(p.mid * 100 - p.pct1 * p.win) / (100 - p.pct1 - p.pct2) >= 1,
  derived: (p) => {
    const pct3 = 100 - p.pct1 - p.pct2;
    const numer = p.mid * 100 - p.pct1 * p.win;   // branch 2 pays nothing
    return { pct3, numer, answer: r9(numer / pct3) };
  } }),

S({ id: "S3 risk-neutral-up-probability", params: {
    spot: { choices: [40, 50, 60, 72, 80, 90, 100, 120] },
    up:   { choices: [4, 5, 6, 8, 10, 12, 15, 20, 25, 30] },
    down: { choices: [3, 4, 5, 6, 8, 10, 12, 16, 20] } },
  constraint: (p) => p.down < p.spot && p.up + p.down <= p.spot,
  derived: (p) => ({ span: p.up + p.down, answer: r9(p.down / (p.up + p.down)) }) }),

S({ id: "S4 reflection-principle-touch-level", params: {
    steps:   { choices: [10, 12, 14, 16, 18, 20, 22, 24] },
    start:   { choices: [0, 1, 2, 3, 4, 5, 6, 8] },
    barrier: { choices: [4, 5, 6, 7, 8, 9, 10, 12, 14, 16] } },
  constraint: (p) => p.barrier - p.start >= 2 && p.barrier - p.start <= p.steps,
  derived: (p) => { const a = p.barrier - p.start;
    return { gap: a, tailA: r9(tail(p.steps, a)), answer: r9(tail(p.steps, a) + tail(p.steps, a + 1)) }; } }),

S({ id: "S5 exponential-martingale-value", params: {
    winPct: { choices: [40, 44, 45, 48, 52, 55, 56, 60] },
    start:  { choices: [0, 1, 2, 3, 4, 5, 6, 8] },
    target: { choices: [4, 5, 6, 8, 10, 12, 14, 16] } },
  constraint: (p) => { const g = p.target - p.start; if (g < 2) return false;
    const v = Math.pow((100 - p.winPct) / p.winPct, g); return v >= 1e-4 && v <= 1e4; },
  derived: (p) => { const ratio = r9((100 - p.winPct) / p.winPct);
    return { gap: p.target - p.start, ratio, answer: r9(Math.pow(ratio, p.target - p.start)) }; } }),

S({ id: "S6 gbm-expected-price", params: {
    spot:    { choices: [40, 50, 60, 75, 80, 100, 120, 150] },
    growPct: { choices: [2, 3, 4, 5, 6, 8, 10, 12] },
    volPct:  { choices: [15, 20, 25, 30, 35, 40] },
    years:   { choices: [1, 2, 3, 4, 5] } },
  constraint: (p) => p.growPct * p.years <= 40,
  derived: (p) => { const g = p.growPct / 100, s = p.volPct / 100, t = p.years;
    return { logDrift: r9(g - s * s / 2), median: r9(p.spot * Math.exp((g - s * s / 2) * t)),
             answer: r9(p.spot * Math.exp(g * t)) }; } }),

S({ id: "S7 brownian-covariance-correlation", params: {
    early:  { choices: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12] },
    late:   { choices: [6, 8, 9, 10, 12, 15, 16, 18, 20, 24] },
    volPct: { choices: [12, 15, 20, 25, 30, 40] } },
  constraint: (p) => p.early < p.late,
  derived: (p) => ({ ratio: r9(p.early / p.late), answer: r9(Math.sqrt(p.early / p.late)) }) }),

S({ id: "S8 compound-sum-variance", params: {
    lots:  { choices: [4, 5, 6, 8, 10, 12] },
    units: { choices: [3, 4, 5, 6, 8, 10] },
    rate:  { choices: [2, 3, 4, 5, 6, 8, 10] } },
  constraint: (p) => p.lots * p.units * p.rate <= 600,
  derived: (p) => {
    const eN = (p.lots + 1) / 2, vN = (p.lots * p.lots - 1) / 12;
    const eX = (p.units + 1) / 2, vX = (p.units * p.units - 1) / 12;
    return { eN: r9(eN), vN: r9(vN), eX: r9(eX), vX: r9(vX),
             answer: r9(p.rate * p.rate * (eN * vX + vN * eX * eX)) };
  } }),

S({ id: "S9 gbm-probability-above-strike", params: {
    spot:    { choices: [50, 60, 75, 80, 100, 120] },
    strike:  { choices: [55, 66, 80, 90, 110, 130, 150] },
    growPct: { choices: [2, 4, 5, 6, 8, 10] },
    volPct:  { choices: [15, 20, 25, 30, 40] },
    years:   { choices: [1, 2, 3, 4] } },
  constraint: (p) => p.strike > p.spot && p.strike <= 2 * p.spot && p.growPct * p.years <= 32,
  derived: (p) => { const g = p.growPct / 100, s = p.volPct / 100, t = p.years;
    const sd = r9(s * Math.sqrt(t)), z = r9((Math.log(p.strike / p.spot) - (g - s * s / 2) * t) / sd);
    return { sd, z, answer: r9(1 - normalCdf(z)) }; } }),

S({ id: "S10 gbm-fit-then-below-mean", params: {
    median:  { choices: [40, 50, 60, 75, 80, 100, 120] },
    meanPct: { choices: [102, 104, 106, 108, 110, 115, 120, 125] },
    markPct: { choices: [85, 90, 95, 105, 110, 120, 130, 140] } },
  constraint: () => true,
  derived: (p) => { const ratio = p.meanPct / 100, sdT = r9(Math.sqrt(2 * Math.log(ratio)));
    const mark = r9(p.median * p.markPct / 100);
    return { mark, sdT, z: r9(Math.log(p.markPct / 100) / sdT), answer: r9(normalCdf(Math.log(p.markPct / 100) / sdT)) }; } }),

S({ id: "L1 two-by-two-eigenvalues", difficulty: 1, params: {
    lo:    { choices: [1, 2, 3, 4, 5, 6, 7, 8] },
    hi:    { choices: [9, 10, 11, 12, 13, 14, 15, 16, 18, 20] },
    shift: { choices: [-6, -4, -3, -2, 2, 3, 4, 5, 7, 10] } },
  constraint: (p) => p.hi > p.lo,
  derived: (p) => ({ trace: p.lo + p.hi + 2 * p.shift, det: (p.lo + p.shift) * (p.hi + p.shift),
                     disc: (p.hi - p.lo) * (p.hi - p.lo), answer: p.hi + p.shift }) }),

S({ id: "L2 trace-of-a-matrix-power", difficulty: 1, params: {
    trace: { choices: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    det:   { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 20, 24] },
    power: { choices: [2, 3, 4] } },
  constraint: (p) => p.trace * p.trace >= 4 * p.det,
  derived: (p) => { const t = p.trace, d = p.det;
    const t2 = t * t - 2 * d, t3 = t * t2 - d * t, t4 = t * t3 - d * t2;
    return { t2, answer: p.power === 2 ? t2 : p.power === 3 ? t3 : t4 }; } }),

S({ id: "L3 constant-plus-diagonal-determinant", params: {
    a: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    b: { choices: [1, 2, 3, 4, 5, 6, 9, 12] },
    n: { choices: [3, 4, 5, 6, 7] } },
  constraint: (p) => Math.pow(p.a, p.n - 1) * (p.a + p.b * p.n) < 1e12,
  derived: (p) => ({ diagEntry: p.a + p.b, offDiagCount: p.n - 1, shifted: p.a + p.b * p.n,
                     tail: Math.pow(p.a, p.n - 1), answer: Math.pow(p.a, p.n - 1) * (p.a + p.b * p.n) }) }),

S({ id: "L4 determinant-scaling-and-power", params: {
    n:     { choices: [3, 4, 5, 6] },
    scale: { choices: [2, 3, 4, 5] },
    det:   { choices: [2, 3, 4, 5, 6, 7, 8, 10, 12] },
    power: { choices: [2, 3] } },
  constraint: (p) => Math.pow(p.scale, p.n) * Math.pow(p.det, p.power) < 1e12,
  derived: (p) => ({ scaleFactor: Math.pow(p.scale, p.n), detPower: Math.pow(p.det, p.power),
                     answer: Math.pow(p.scale, p.n) * Math.pow(p.det, p.power) }) }),

S({ id: "L5 inverse-of-a-constant-plus-diagonal", params: {
    a: { choices: [2, 3, 4, 5, 6, 8, 10] },
    b: { choices: [1, 2, 3, 4, 5, 6, 9] },
    n: { choices: [3, 4, 5, 6, 7, 8] } },
  constraint: (p) => p.a + p.b * p.n > 0,
  derived: (p) => { const shifted = p.a + p.b * p.n;
    return { diagEntry: p.a + p.b, shifted, answer: r9((1 / p.a) * (1 - p.b / shifted)) }; } }),

S({ id: "L6 equicorrelation-fit-then-inverse", difficulty: 3, params: {
    a:   { choices: [2, 3, 4, 5, 6] },
    b:   { choices: [1, 2, 3, 4, 5, 6] },
    n:   { choices: [3, 4, 5] },
    off: { choices: [1, 2] } },
  constraint: (p) => Math.pow(p.a, p.n - 1) * (p.a + p.b * p.n) < 1e10,
  derived: (p) => { const shifted = p.a + p.b * p.n;
    const det = Math.pow(p.a, p.n - 1) * shifted;
    const offDiag = r9((-p.b / p.a) / shifted);
    return { det, shifted, diagEntry: p.a + p.b, invDiag: r9((1 / p.a) * (1 - p.b / shifted)),
             answer: p.off === 1 ? r9((1 / p.a) * (1 - p.b / shifted)) : offDiag }; } }),
];

for (const t of R) console.log(probe(t));
