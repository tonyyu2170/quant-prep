import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Exponential lifetimes are memoryless, so swapping in a fresh unit restarts the clock with no
// penalty for however long the previous one ran. Total life is a sum of k iid exponentials —
// Erlang — whose mean is just k times the single-unit mean.
export const spareChainUptime: ProblemTemplate = {
  id: "distributions/spare-chain-uptime",
  version: 1,
  firms: [{ firm: "citadel", weight: 0.35 }, { firm: "drw", weight: 0.35 }, { firm: "millennium", weight: 0.25 }],
  topic: "probability/distributions",
  difficulty: 3,
  source: { kind: "free-resource", inspiration: "total running time of a machine backed by a chain of exponential spare parts" },
  params: {
    units: { choices: [2, 3, 4, 5, 6] },
    meanLife: { choices: [2, 4, 5, 8, 10, 12.5, 20, 25] },
    earnings: { choices: [10, 20, 25, 40, 50, 100] },
  },
  derived: (p) => ({
    uptime: p.units * p.meanLife,
    ev: p.earnings * p.units * p.meanLife,
  }),
  statement: (p) =>
    `A generator runs on one power cell at a time and the depot has ${fmtNum(p.units)} of them. Each cell's working life is exponentially distributed with a mean of ${fmtNum(p.meanLife)} hours, independently of the others, and a dead cell is swapped for a fresh one instantly. The generator earns ${fmtNum(p.earnings)} dollars per hour it runs, and shuts down for good when the last cell dies. What total earnings should the depot expect?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Chain the lifetimes", body: `The generator runs until every cell is spent, so the total running time is the sum of the ${fmtNum(p.units)} individual lifetimes. Nothing is lost at a swap, since the changeover is instant.` },
    { title: "Memorylessness makes the sum clean", body: `An exponential lifetime has no wear-in or wear-out: a cell that has already run for a while is exactly as good as a fresh one. So the cells contribute independent lifetimes with the same mean, and no partial life is wasted at a handover.` },
    { title: "Add the means", body: `Expectation adds over the chain, so the expected total running time is $${fmtNum(p.units)}\\times${fmtNum(p.meanLife)}=${fmtNum(d.uptime)}$ hours.` },
    { title: "Convert to money", body: `At ${fmtNum(p.earnings)} dollars an hour that is $${fmtNum(p.earnings)}\\times${fmtNum(d.uptime)}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `Doubling the number of cells doubles the expected earnings, and so does doubling the per-cell mean life — the two enter the answer the same way, even though the spread around it does not scale the same way at all.` },
  ],
  keyInsight: "The sum of the cell lifetimes is Erlang, but its mean needs none of that machinery: expectation is linear, and memorylessness guarantees a swap throws nothing away.",
  commonTrap: "Treating the chain as a single unit with a shortened mean, or trying to average the failure rates rather than the lifetimes. Rates add when parts run in parallel; here they run one after another, so it is the means that add.",
  expectedPaceS: 120,
  verify: { method: "montecarlo" },
};
