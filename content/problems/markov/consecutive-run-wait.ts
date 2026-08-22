import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Expected trials for k consecutive successes: (1-p^k)/(p^k * q). With p = w/n that is the
// integer ratio n*(n^k - w^k) / (w^k * (n-w)), which prints exactly.
export const consecutiveRunWait: ProblemTemplate = {
  id: "markov/consecutive-run-wait",
  version: 1,
  topic: "probability/markov",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "optiver", weight: 0.25 }, { firm: "akuna", weight: 0.25 }],
  source: { kind: "original", inspiration: "success-run chain: state = length of the current run" },
  params: {
    runLength: { range: { min: 2, max: 4, step: 1 } },
    hitsPer: { range: { min: 4, max: 14, step: 1 } },
    outOf: { range: { min: 16, max: 28, step: 1 } },
  },
  constraint: (p) => p.hitsPer / p.outOf >= 0.25 && p.hitsPer / p.outOf <= 0.7,
  derived: (p) => {
    // local, not module-level: `constraint` never needs it (registry.test.ts)
    const ipow = (b: number, e: number) => { let r = 1; for (let i = 0; i < e; i++) r *= b; return r; };
    const misses = p.outOf - p.hitsPer;
    const wk = ipow(p.hitsPer, p.runLength);
    const nk = ipow(p.outOf, p.runLength);
    const answer = (p.outOf * (nk - wk)) / (wk * misses);
    return { misses, wk, nk, gap: nk - wk, answer, prob: p.hitsPer / p.outOf, runProb: wk / nk, runFloor: nk / wk };
  },
  statement: (p) =>
    `A quoting engine wins each auction independently with probability $\\frac{${p.hitsPer}}{${p.outOf}}$. How many auctions does it expect to run before it first wins ${fmtNum(p.runLength)} in a row?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "State = how far into a run you are", body: `Track only the length of the current winning streak, from $0$ up to ${fmtNum(p.runLength)}. A win advances one step; a single loss sends the chain all the way back to $0$, discarding every win banked so far.` },
    { title: "Why a loss is expensive", body: `That total reset is what makes the answer grow so fast in the run length: the engine wins each auction with $\\frac{${p.hitsPer}}{${p.outOf}}=${fmtNum(d.prob)}$, and it must string ${fmtNum(p.runLength)} of those together with no interruption.` },
    { title: "Solve the ladder", body: `Writing the expected wait from each rung and telescoping the ladder gives $\\frac{${p.outOf}\\times(${d.nk}-${d.wk})}{${d.wk}\\times${d.misses}}=${fmtNum(d.answer)}$ auctions.` },
    { title: "Sanity check", body: `A run of ${fmtNum(p.runLength)} has probability $\\frac{${d.wk}}{${d.nk}}=${fmtNum(d.runProb)}$ from any fixed starting point, so the wait must be at least $\\frac{${d.nk}}{${d.wk}}=${fmtNum(d.runFloor)}$ — and $${fmtNum(d.answer)}$ clears that floor, because failed attempts also cost auctions.` },
  ],
  keyInsight: "For consecutive-run problems the state is the current run length, and the defining feature is that one failure returns you to zero rather than one step back.",
  commonTrap: "Treating the wait as the reciprocal of the run probability. That would be right if attempts were disjoint blocks, but they overlap, and the reset makes the true wait longer.",
  expectedPaceS: 170,
  constants: [0],
  verify: { method: "brute-force" },
};
