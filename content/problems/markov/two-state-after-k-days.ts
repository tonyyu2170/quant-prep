import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// The k-step transition, not the stationary one: P_k = pi + (1-pi)*lambda^k. Over integer
// percents the whole thing is (B*100^k + A*(100-A-B)^k) / ((A+B)*100^k).
// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
  // local, not module-level: `constraint` never needs it (registry.test.ts)
  const ipow = (b: number, e: number) => { let r = 1; for (let i = 0; i < e; i++) r *= b; return r; };
  const total = p.leavePct + p.returnPct;
  const persist = 100 - total;
  const pk = ipow(100, p.days);
  const lk = ipow(persist, p.days);
  const numer = p.returnPct * pk + p.leavePct * lk;
  const denom = total * pk;
  return { total, persist, pk, lk, numer, denom, answer: numer / denom, stationary: p.returnPct / total, decay: lk / pk, leaveRate: p.leavePct / 100, returnRate: p.returnPct / 100, persistRate: persist / 100 };
};

export const twoStateAfterKDays: ProblemTemplate = {
  id: "markov/two-state-after-k-days",
  version: 1,
  topic: "probability/markov",
  difficulty: 3,
  firms: [{ firm: "two-sigma", weight: 0.3 }, { firm: "hrt", weight: 0.3 }, { firm: "jump", weight: 0.2 }],
  source: { kind: "original", inspiration: "k-step transition as stationary plus a decaying memory term" },
  params: {
    leavePct: { range: { min: 10, max: 45, step: 5 } },
    returnPct: { range: { min: 10, max: 45, step: 5 } },
    days: { range: { min: 2, max: 4, step: 1 } },
  },
  // The last conjunct keeps the finite-horizon value a grading tolerance clear of the long-run
  // share. Without it the chain has already forgotten today by day 4 on the fastest-mixing
  // draws, and `commonTrap`'s "answering with the long-run share" is marked correct — 6 of
  // 161 draws (tools/trap-audit.ts).
  constraint: (p) => p.leavePct + p.returnPct <= 80 && p.leavePct !== p.returnPct && !complementGrades(derive(p).answer) && Math.abs(derive(p).answer - derive(p).stationary) > 0.005 * derive(p).answer,
  derived: derive,
  statement: (p, d) =>
    `A market is calm or choppy each day. A calm day is followed by a choppy one with probability ${fmtNum(d.leaveRate)}; a choppy day is followed by a calm one with probability ${fmtNum(d.returnRate)}. Today is calm. What is the probability that the day ${fmtNum(p.days)} days from now is also calm?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Long-run share first", body: `Balancing the two flows gives the long-run calm share $\\frac{${p.returnPct}}{${p.returnPct}+${p.leavePct}}=${fmtNum(d.stationary)}$. After enough days the chain forgets today entirely and settles there.` },
    { title: "Today still counts a little", body: `${fmtNum(p.days)} days is not 'enough days'. The answer is the long-run share plus a correction for starting calm, and that correction shrinks by the same factor every day.` },
    { title: "The shrink factor", body: `The factor is one minus the two switching rates: $\\frac{${d.persist}}{100}=${fmtNum(d.persistRate)}$. Raised to ${fmtNum(p.days)} it becomes $\\frac{${d.lk}}{${d.pk}}=${fmtNum(d.decay)}$, which is how much of today's advantage survives.` },
    { title: "Put it together", body: `Combining the share and the surviving advantage gives $\\frac{${d.numer}}{${d.denom}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Starting calm can only help, so the answer must sit above the long-run share — and $${fmtNum(d.answer)} > ${fmtNum(d.stationary)}$ holds. Push the horizon out and the gap closes.` },
  ],
  keyInsight: "A k-step probability splits into the long-run share plus a memory of the starting state that decays geometrically in the number of steps.",
  commonTrap: "Answering with the long-run share. That is the limit, not the value at a finite horizon, and over a few days the starting state still matters.",
  expectedPaceS: 170,
  constants: [100],
  verify: { method: "brute-force" },
};
