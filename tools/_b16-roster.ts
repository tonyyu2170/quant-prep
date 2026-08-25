/* B16 Task 0: all 16 finance designs as stubs, probed. Deleted once the numbers are recorded. */
import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "@qp/engine";
import { forEachLegalDraw } from "../content/problems/draw-space";
import { probe } from "./probe";

const r9 = (x: number) => Math.round(x * 1e9) / 1e9;
/** Displays at four significant figures with nothing lost — safe as a printed chain operand. */
const exact4 = (x: number) => fmtNum(r9(x)) === String(r9(x));
const S = (o: Partial<ProblemTemplate> & Pick<ProblemTemplate, "id" | "params" | "derived">): ProblemTemplate => ({
  version: 1, topic: "finance/x", difficulty: 2, firms: [], accepted: { tolerance: { rel: 0.005 } },
  source: { kind: "textbook", inspiration: "" }, answerKey: "answer",
  statement: (p) => "Q " + Object.values(p).join(" "), solution: () => [{ title: "a", body: "b" }],
  keyInsight: "k", commonTrap: "c", expectedPaceS: 60, verify: { method: "brute-force" }, ...o,
} as ProblemTemplate);

const R: ProblemTemplate[] = [
// ---------------------------------------------------------------- options / greeks
S({ id: "G1 gamma-pnl-from-a-move", difficulty: 1, params: {
    n:     { choices: [10, 20, 25, 40, 50, 80, 100, 200] },
    gamma: { choices: [0.01, 0.02, 0.025, 0.04, 0.05, 0.08, 0.1] },
    move:  { choices: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8] } },
  constraint: (p) => exact4(p.n * p.gamma) && p.n * p.gamma * p.move * p.move / 2 >= 0.1,
  derived: (p) => ({ bookGamma: r9(p.n * p.gamma), moveSq: r9(p.move * p.move),
                     answer: r9(p.n * p.gamma * p.move * p.move / 2) }) }),

S({ id: "G2 shares-to-rehedge-after-a-move", difficulty: 1, params: {
    n:     { choices: [20, 25, 40, 50, 80, 100, 150, 200] },
    delta: { choices: [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6] },
    gamma: { choices: [0.01, 0.02, 0.025, 0.04, 0.05, 0.08, 0.1] },
    move:  { choices: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5] } },
  constraint: (p) => p.delta + p.gamma * p.move <= 0.9 && p.n * p.gamma * p.move >= 1
    && exact4(p.n * p.delta) && exact4(p.delta + p.gamma * p.move),
  derived: (p) => ({ oldHedge: r9(p.n * p.delta), newDelta: r9(p.delta + p.gamma * p.move),
                     newHedge: r9(p.n * (p.delta + p.gamma * p.move)), answer: r9(p.n * p.gamma * p.move) }) }),

S({ id: "P5 straddle-implied-move", difficulty: 1, params: {
    spot: { choices: [20, 25, 40, 50, 80, 100, 125, 200, 250, 400, 500] },
    call: { range: { min: 0.25, max: 15, step: 0.25 } },
    put:  { range: { min: 0.25, max: 15, step: 0.25 } } },
  constraint: (p) => (p.call + p.put) / p.spot >= 0.02 && (p.call + p.put) / p.spot <= 0.15 && exact4(100 * (p.call + p.put) / p.spot),
  derived: (p) => ({ premium: r9(p.call + p.put), fraction: r9((p.call + p.put) / p.spot),
                     answer: r9(100 * (p.call + p.put) / p.spot) }) }),

S({ id: "G3 book-delta-calls-and-puts", params: {
    calls: { choices: [10, 20, 25, 30, 40, 50, 60, 80, 100] },
    puts:  { choices: [10, 15, 20, 25, 30, 40, 50, 60, 80, 100] },
    delta: { range: { min: 0.25, max: 0.75, step: 0.05 } } },
  constraint: (p) => Math.abs((p.calls + p.puts) * p.delta - p.puts) >= 1,
  derived: (p) => ({ putDelta: r9(p.delta - 1), callLeg: r9(p.calls * p.delta), putLeg: r9(p.puts * (p.delta - 1)),
                     answer: r9((p.calls + p.puts) * p.delta - p.puts) }) }),

S({ id: "G4 theta-gamma-breakeven-move", params: {
    n:     { choices: [10, 20, 25, 40, 50, 100] },
    gamma: { choices: [0.01, 0.02, 0.025, 0.04, 0.05, 0.08, 0.1] },
    move:  { choices: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10, 12, 15] } },
  constraint: (p) => exact4(p.n * p.gamma) && exact4(p.n * p.gamma * p.move * p.move / 2) && p.n * p.gamma * p.move * p.move / 2 >= 0.05,
  derived: (p) => ({ bookGamma: r9(p.n * p.gamma), theta: r9(p.n * p.gamma * p.move * p.move / 2),
                     moveSq: r9(p.move * p.move), answer: p.move }) }),

S({ id: "P1 one-step-binomial-call-price", params: {
    spot:         { choices: [40, 50, 60, 80, 100, 120, 150, 200] },
    up:           { choices: [5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 30] },
    down:         { choices: [4, 5, 6, 8, 10, 12, 15, 16, 20] },
    strikeOffset: { choices: [-4, -2, 0, 2, 3, 4, 5, 6, 8, 10, 12] } },
  constraint: (p) => p.strikeOffset > -p.down && p.strikeOffset < p.up && exact4(p.down / (p.up + p.down))
    && p.down / (p.up + p.down) * (p.up - p.strikeOffset) >= 0.5,
  derived: (p) => { const q = r9(p.down / (p.up + p.down));
    return { upPrice: p.spot + p.up, downPrice: p.spot - p.down, strike: p.spot + p.strikeOffset, span: p.up + p.down,
             q, qDown: r9(1 - q), payoffUp: p.up - p.strikeOffset, answer: r9(q * (p.up - p.strikeOffset)) }; } }),

S({ id: "P3 atm-straddle-from-dollar-vol", params: {
    spot:   { choices: [20, 25, 40, 50, 80, 100, 125, 200] },
    volPct: { choices: [16, 20, 25, 30, 32, 40, 50, 60, 80] },
    days:   { choices: [4, 9, 16, 25, 36, 49, 64, 100, 144, 196, 256] } },
  constraint: (p) => exact4(p.spot * p.volPct / 100 * Math.sqrt(p.days) / 16) && p.spot * p.volPct / 100 * Math.sqrt(p.days) / 16 >= 0.2,
  derived: (p) => { const rootT = Math.sqrt(p.days) / 16; const s = r9(p.spot * p.volPct / 100 * rootT);
    return { vol: r9(p.volPct / 100), rootT: r9(rootT), dollarVol: s, factor: r9(Math.sqrt(2 / Math.PI)),
             ruleOfThumb: r9(0.8 * s), answer: r9(s * Math.sqrt(2 / Math.PI)) }; } }),

S({ id: "P4 put-butterfly-from-call-quotes", params: {
    k1:         { choices: [30, 35, 40, 45, 50, 55, 60, 80, 100] },
    width:      { choices: [5, 10, 15, 20] },
    cLow:       { choices: [8, 9, 10, 11, 12, 14, 16, 18] },
    cMid:       { choices: [4, 4.5, 5, 6, 7, 8, 9, 10] },
    cHigh:      { choices: [1, 1.5, 2, 2.5, 3, 4, 5] },
    spotOffset: { choices: [-3, -2, -1, 0, 1, 2, 3] },
    df:         { choices: [0.96, 0.97, 0.98, 0.99] } },
  constraint: (p) => p.cLow > p.cMid && p.cMid > p.cHigh && p.cLow - 2 * p.cMid + p.cHigh >= 0.5
    && p.cLow - p.cMid <= p.width && p.cMid - p.cHigh <= p.width
    && p.cLow - (p.k1 + p.width + p.spotOffset) + p.k1 * p.df >= 0.25,
  derived: (p) => { const k2 = p.k1 + p.width, k3 = p.k1 + 2 * p.width, spot = k2 + p.spotOffset;
    const pLow = r9(p.cLow - spot + p.k1 * p.df), pMid = r9(p.cMid - spot + k2 * p.df), pHigh = r9(p.cHigh - spot + k3 * p.df);
    return { k2, k3, spot, pLow, pMid, pHigh, putFly: r9(pLow - 2 * pMid + pHigh), answer: r9(p.cLow - 2 * p.cMid + p.cHigh) }; } }),

S({ id: "P2 two-step-binomial-call-price", difficulty: 3, params: {
    spot:         { choices: [40, 50, 60, 80, 100, 120] },
    up:           { choices: [4, 5, 6, 8, 10, 12, 15, 16, 20] },
    down:         { choices: [4, 5, 6, 8, 10, 12, 15, 16, 20] },
    strikeOffset: { choices: [-6, -4, -2, 0, 2, 3, 4, 5, 6, 8, 10] } },
  constraint: (p) => Math.abs(100 * p.down / (p.up + p.down) - Math.round(100 * p.down / (p.up + p.down))) < 1e-9
    && p.strikeOffset < 2 * p.up && p.strikeOffset > -2 * p.down
    && (p.down / (p.up + p.down)) ** 2 * (2 * p.up - p.strikeOffset) + 2 * (p.down / (p.up + p.down)) * (p.up / (p.up + p.down)) * Math.max(p.up - p.down - p.strikeOffset, 0) >= 0.5,
  derived: (p) => { const q = r9(p.down / (p.up + p.down)); const qq = r9(q * q), qm = r9(2 * q * (1 - q));
    const payTop = 2 * p.up - p.strikeOffset, payMid = Math.max(p.up - p.down - p.strikeOffset, 0);
    return { strike: p.spot + p.strikeOffset, top: p.spot + 2 * p.up, mid: p.spot + p.up - p.down, bottom: p.spot - 2 * p.down,
             q, qTop: qq, qMid: qm, qBottom: r9((1 - q) * (1 - q)), payTop, payMid, answer: r9(qq * payTop + qm * payMid) }; } }),

S({ id: "A5 put-call-parity-with-dividend", difficulty: 3, params: {
    spot:   { choices: [40, 45, 50, 55, 60, 75, 80, 100] },
    strike: { choices: [35, 40, 45, 50, 55, 60, 70, 80, 90, 105] },
    call:   { range: { min: 1, max: 12, step: 0.5 } },
    df:     { choices: [0.94, 0.95, 0.96, 0.97, 0.98] },
    div:    { choices: [0.5, 1, 1.5, 2, 2.5, 3, 4] },
    dfDiv:  { choices: [0.97, 0.98, 0.99] } },
  constraint: (p) => p.dfDiv > p.df && p.call - p.spot + p.div * p.dfDiv + p.strike * p.df >= 0.3,
  derived: (p) => ({ pvDiv: r9(p.div * p.dfDiv), pvK: r9(p.strike * p.df),
                     noDivPut: r9(p.call - p.spot + p.strike * p.df),
                     answer: r9(p.call - p.spot + p.div * p.dfDiv + p.strike * p.df) }) }),

// ---------------------------------------------------------------- arbitrage
S({ id: "A2 american-vs-european-call-credit", difficulty: 1, params: {
    spot:   { choices: [40, 50, 60, 80, 100] },
    strike: { choices: [35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 110] },
    euro:   { range: { min: 2, max: 12, step: 0.25 } },
    gap:    { choices: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75, 1] },
    n:      { choices: [10, 20, 25, 40, 50, 100, 200] } },
  constraint: (p) => Math.abs(p.spot - p.strike) <= 10 && p.euro >= p.spot - p.strike + 0.25,
  derived: (p) => ({ american: r9(p.euro - p.gap), answer: r9(p.n * p.gap) }) }),

S({ id: "A1 multi-winner-book-arbitrage", params: {
    p1: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    p2: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    p3: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    p4: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    advance: { choices: [2, 3] },
    n: { choices: [100, 200, 500, 1000] } },
  constraint: (p) => Math.abs(p.p1 + p.p2 + p.p3 + p.p4 - p.advance) >= 0.03 && Math.abs(p.p1 + p.p2 + p.p3 + p.p4 - p.advance) <= 0.3,
  derived: (p) => { const sum = r9(p.p1 + p.p2 + p.p3 + p.p4); const gap = r9(Math.abs(sum - p.advance));
    return { sum, gap, answer: r9(p.n * gap) }; } }),

S({ id: "A3 forward-mispricing-arbitrage", params: {
    spot:    { choices: [20, 25, 40, 50, 60, 80, 100, 120, 150, 200] },
    ratePct: { choices: [2, 2.5, 3, 4, 5, 6, 8, 10] },
    premium: { choices: [-1, 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15] },
    n:       { choices: [10, 20, 50, 100, 200, 500, 1000] } },
  constraint: (p) => Math.abs(p.premium - p.spot * p.ratePct / 100) >= 0.25 && exact4(p.spot * p.ratePct / 100),
  derived: (p) => { const carry = r9(p.spot * p.ratePct / 100);
    return { carry, fair: r9(p.spot + carry), quoted: r9(p.spot + p.premium), edge: r9(Math.abs(p.premium - carry)),
             answer: r9(p.n * Math.abs(p.premium - carry)) }; } }),

// ---------------------------------------------------------------- fixed income
S({ id: "F1 duration-price-change", difficulty: 1, params: {
    price:  { choices: [90, 92, 94, 95, 96, 98, 100, 102, 104, 105, 108, 110] },
    modDur: { choices: [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 7.5, 8, 10] },
    bp:     { choices: [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100] },
    faceM:  { choices: [1, 2, 5, 10, 25] } },
  constraint: (p) => exact4(p.faceM * p.price * p.modDur * p.bp),
  derived: (p) => ({ dy: r9(p.bp / 10000), face: p.faceM * 1e6, marketValue: r9(p.faceM * 1e6 * p.price / 100),
                     pctChange: r9(p.modDur * p.bp / 100), answer: r9(p.faceM * p.price * p.modDur * p.bp) }) }),

S({ id: "F2 bond-premium-from-zeros", params: {
    couponPct: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    df1:       { range: { min: 0.9, max: 0.99, step: 0.01 } },
    drop:      { choices: [0.02, 0.03, 0.04, 0.05, 0.06] },
    n:         { choices: [2, 3] } },
  constraint: (p) => Math.abs(p.couponPct * (p.n === 2 ? 2 * p.df1 - p.drop : 3 * p.df1 - 3 * p.drop) + 100 * (p.df1 - (p.n - 1) * p.drop) - 100) >= 0.25,
  derived: (p) => { const df2 = r9(p.df1 - p.drop), df3 = r9(p.df1 - 2 * p.drop);
    const sum = r9(p.n === 2 ? p.df1 + df2 : p.df1 + df2 + df3), last = p.n === 2 ? df2 : df3;
    const price = r9(p.couponPct * sum + 100 * last);
    return { df2, df3, dfLast: last, sumDf: sum, couponLeg: r9(p.couponPct * sum), redemptionLeg: r9(100 * last), price, answer: r9(price - 100) }; } }),

S({ id: "F3 par-coupon-from-zeros", difficulty: 3, params: {
    face: { choices: [100, 1000] },
    df1:  { range: { min: 0.9, max: 0.99, step: 0.01 } },
    drop: { choices: [0.02, 0.03, 0.04, 0.05, 0.06] },
    n:    { choices: [2, 3, 4] } },
  constraint: (p) => p.df1 - (p.n - 1) * p.drop >= 0.7,
  derived: (p) => { const dfs = Array.from({ length: p.n }, (_, i) => r9(p.df1 - i * p.drop));
    const sum = r9(dfs.reduce((a, b) => a + b, 0)), last = dfs[p.n - 1];
    return { dfLast: last, sumDf: sum, shortfall: r9(p.face * (1 - last)), ratePct: r9(100 * (1 - last) / sum),
             answer: r9(p.face * (1 - last) / sum) }; } }),

// ---------------------------------------------------------------- at-risk alternatives, measured for the record
S({ id: "F2alt coupon-bond-price-from-zeros", params: {
    couponPct: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    df1:       { range: { min: 0.9, max: 0.99, step: 0.01 } },
    drop:      { choices: [0.02, 0.03, 0.04, 0.05, 0.06] },
    n:         { choices: [2, 3] } },
  constraint: () => true,
  derived: (p) => { const df2 = r9(p.df1 - p.drop), df3 = r9(p.df1 - 2 * p.drop);
    const sum = r9(p.n === 2 ? p.df1 + df2 : p.df1 + df2 + df3), last = p.n === 2 ? df2 : df3;
    return { answer: r9(p.couponPct * sum + 100 * last) }; } }),

S({ id: "F3alt macaulay-duration-from-zeros", difficulty: 3, params: {
    couponPct: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    df1:       { range: { min: 0.9, max: 0.99, step: 0.01 } },
    drop:      { choices: [0.02, 0.03, 0.04, 0.05, 0.06] },
    n:         { choices: [2, 3, 4] } },
  constraint: (p) => p.df1 - (p.n - 1) * p.drop >= 0.7,
  derived: (p) => { const dfs = Array.from({ length: p.n }, (_, i) => r9(p.df1 - i * p.drop));
    let price = 0, weighted = 0;
    dfs.forEach((df, i) => { const cf = p.couponPct + (i === p.n - 1 ? 100 : 0); price += cf * df; weighted += (i + 1) * cf * df; });
    return { price: r9(price), weighted: r9(weighted), answer: r9(weighted / price) }; } }),
];

for (const t of R) console.log(probe(t));

// Zero / decimal-safe-window audit over every legal draw, mirroring verification/emit.ts:43-46.
console.log("\nzero / window audit");
for (const t of R) {
  let zeros = 0, outOfWindow = 0, lo = Infinity, hi = 0, n = 0;
  forEachLegalDraw(t, (p) => {
    const d = t.derived(p); n++;
    const a = d[t.answerKey];
    if (a === 0) zeros++;
    lo = Math.min(lo, Math.abs(a)); hi = Math.max(hi, Math.abs(a));
    for (const v of [...Object.values(p), ...Object.values(d)])
      if (!Number.isFinite(v) || (v !== 0 && (Math.abs(v) < 1e-6 || Math.abs(v) >= 1e15))) outOfWindow++;
  });
  console.log(`${t.id.padEnd(46)} legal=${n} zeros=${zeros} outOfWindow=${outOfWindow} |answer| in [${lo.toExponential(2)}, ${hi.toExponential(2)}]`);
}
