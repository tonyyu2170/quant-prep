import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The two-state stationary distribution: balance says pi_up * fail = pi_down * fix, so the
// long-run up-share is fix/(fail+fix) — independent of where the machine started.
//
// The question asks for live days over a stretch rather than the bare share. The share alone
// runs from 0.5 to 0.94 as a near-continuum, and a near-continuum saturates distinctAtBand
// (draw-space.test.ts): 801 tuples scored 3. Scaling by a drawn horizon separates the answers
// (band 135) and is a real third dimension, not padding.
export const machineUptimeStationary: ProblemTemplate = {
  id: "markov/machine-uptime-stationary",
  version: 1,
  topic: "probability/markov",
  difficulty: 2,
  firms: [{ firm: "imc", weight: 0.3 }, { firm: "optiver", weight: 0.3 }, { firm: "drw", weight: 0.25 }],
  source: { kind: "original", inspiration: "two-state chain, long-run share by balance" },
  params: {
    failPct: { choices: [5, 10, 15, 20, 25, 30] },
    fixPct: { choices: [30, 40, 50, 60, 70, 80] },
    days: { choices: [10, 15, 20, 25, 30, 40, 50, 60, 75, 90] },
  },
  // The rates must not sum to 100. When they do, the long-run share IS the bare repair rate
  // and `commonTrap`'s "reading the answer off the repair rate alone" grades as correct —
  // live on 20 of 350 draws before this conjunct (tools/trap-audit.ts).
  constraint: (p) => p.fixPct > p.failPct && p.failPct + p.fixPct !== 100,
  derived: (p) => {
    const total = p.failPct + p.fixPct;
    const share = p.fixPct / total;
    return { total, share, failRate: p.failPct / 100, fixRate: p.fixPct / 100, halfHorizon: p.days / 2, answer: (p.days * p.fixPct) / total, stalledDays: (p.days * p.failPct) / total, oddsUp: p.fixPct / p.failPct };
  },
  statement: (p, d) =>
    `A pricing box is either live or stalled at the start of each day. A live box stalls by the next day with probability ${fmtNum(d.failRate)}; a stalled box is back live by the next day with probability ${fmtNum(d.fixRate)}. It has been running for years. Over the next ${fmtNum(p.days)} days, how many does it expect to start live?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Two states, two flows", body: `Call the long-run shares $\\text{up}$ and $\\text{down}$. Each day a share $\\text{up}\\times${fmtNum(d.failRate)}$ of days flows from live to stalled, and a share $\\text{down}\\times${fmtNum(d.fixRate)}$ flows back the other way.` },
    { title: "Balance the flows", body: `Over a long run those flows must be equal, or one state would drain into the other forever. Setting them equal gives the odds of live to stalled as $\\frac{${p.fixPct}}{${p.failPct}}=${fmtNum(d.oddsUp)}$.` },
    { title: "Turn odds into a share", body: `That makes the live share $\\frac{${p.fixPct}}{${p.fixPct}+${p.failPct}}=${fmtNum(d.share)}$. The box has run for years, so it is already at this long-run mix and today tells us nothing extra.` },
    { title: "Scale to the horizon", body: `Expectation adds across days whether or not they are independent, so the count is just the share times the horizon: $\\frac{${p.days}\\times${p.fixPct}}{${d.total}}=${fmtNum(d.answer)}$ live days, leaving $\\frac{${p.days}\\times${p.failPct}}{${d.total}}=${fmtNum(d.stalledDays)}$ stalled.` },
    { title: "Sanity check", body: `Repair is the faster rate here, so most days should be live — and $${fmtNum(d.answer)} > ${fmtNum(d.halfHorizon)}$ holds. The two counts add back to ${fmtNum(p.days)}.` },
  ],
  keyInsight: "A long-run share is a balance condition, not a simulation: the flow out of a state must equal the flow in. Counting over a horizon is then one multiplication, since expectation adds across dependent days.",
  commonTrap: "Reading the answer off the repair rate alone. The share depends on how the two rates compare, and the days are heavily dependent — only linearity of expectation lets you multiply through.",
  expectedPaceS: 110,
  constants: [1],
  verify: { method: "brute-force" },
};
