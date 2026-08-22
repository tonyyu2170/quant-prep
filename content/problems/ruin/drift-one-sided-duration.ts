import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Expected time until insolvency for a walk with adverse (downward) drift starting at b
// above the cliff: b/(q-p). The event is certain under adverse drift, which is what makes
// the mean finite. `constraint` cannot see `derived` (packages/engine/src/problem.ts:24),
// so the practical Monte Carlo cap is asked through this same helper.
const yearsOf = (p: Params) => p.reserve / ((100 - p.winPct) / 100 - p.winPct / 100);

export const driftOneSidedDuration: ProblemTemplate = {
  id: "ruin/drift-one-sided-duration",
  version: 1,
  topic: "probability/ruin",
  difficulty: 2,
  firms: [{ firm: "flow-traders", weight: 0.35 }, { firm: "citadel", weight: 0.3 }],
  source: { kind: "original", inspiration: "expected time to a certain downside under adverse drift" },
  params: {
    winPct: { range: { min: 30, max: 42, step: 1 } },
    reserve: { range: { min: 2, max: 20, step: 1 } },
  },
  constraint: (p) => Math.abs(p.winPct - 50) >= 2 && yearsOf(p) >= 1 && yearsOf(p) <= 600,
  derived: (p) => {
    const prob = p.winPct / 100;
    const q = 1 - prob;
    const edge = q - prob;
    const duration = p.reserve / edge;
    const doubleReserve = (2 * p.reserve) / edge;
    return { prob, q, edge, duration, doubleReserve, doubleReserveUnits: 2 * p.reserve };
  },
  statement: (p) =>
    `An insurer's surplus stands ${fmtNum(p.reserve)} units above its ruin line and moves one unit per period — up when premiums beat claims, down otherwise. Premiums are losing the battle: each period is good with probability only ${fmtNum(p.winPct)} percent. Insolvency is therefore inevitable; on average, how many periods away does it sit?`,
  answerKey: "duration",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $e(k)$ be the expected number of periods until the surplus first touches the ruin line from level $k$, with $e(0)=0$. Adverse drift makes the touch certain, so these expectations are honest finite numbers.` },
    { title: "Drift sets the pace", body: `Each period the surplus loses on average $q-p=${fmtNum(d.q)}-${fmtNum(d.prob)}=${fmtNum(d.edge)}$ units. Covering ${fmtNum(p.reserve)} units at a drain of ${fmtNum(d.edge)} per period takes $\\frac{${fmtNum(p.reserve)}}{${fmtNum(d.edge)}}=${fmtNum(d.duration)}$ periods.` },
    { title: "Answer", body: `Insolvency arrives in about ${fmtNum(d.duration)} periods.` },
    { title: "Sanity check", body: `Twice the cushion takes twice as long — ${fmtNum(d.doubleReserve)} periods for a ${fmtNum(d.doubleReserveUnits)}-unit reserve — because the drain rate never changes; only the distance to fall does.` },
  ],
  keyInsight: "Under adverse drift the walk's average slope is the edge itself, so the expected time to fall a fixed distance is that distance divided by the edge.",
  commonTrap: "Treating the random ups as reason to stretch the estimate beyond the ratio — fluctuations cancel around the drift line over long horizons, leaving distance over speed.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
