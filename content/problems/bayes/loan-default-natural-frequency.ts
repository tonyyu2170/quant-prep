import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Natural-frequencies technique: the statement gives POPULATION COUNTS directly (not rates),
// and the whole solution works in whole counts — the posterior is just a count ratio over the
// flagged pool. No probability notation is needed anywhere in the derivation.
export const loanDefaultNaturalFrequency: ProblemTemplate = {
  id: "bayes/loan-default-natural-frequency",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "flow", weight: 0.5 }, { firm: "drw", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: natural-frequency framing of the base-rate problem" },
  params: {
    N: { choices: [800, 1000, 1200, 1500] },
    D: { choices: [40, 60, 80, 100] },
    missedD: { choices: [5, 8, 10, 15] },
    fpFlags: { choices: [25, 35, 45, 55, 70] },
  },
  // fpFlags always exceeds missedD by choice range (min 25 > max 15), which alone guarantees
  // totalFlagged > D on every draw — the base-rate lesson (posterior < catch rate) below.
  constraint: (p) => p.missedD < p.D && p.fpFlags > p.missedD,
  derived: (p) => {
    const nonD = p.N - p.D;
    const correctFlags = p.D - p.missedD;
    const totalFlagged = correctFlags + p.fpFlags;
    const posterior = correctFlags / totalFlagged;
    const catchRate = correctFlags / p.D;
    return { nonD, correctFlags, totalFlagged, posterior, catchRate };
  },
  statement: (p, d) =>
    `A loan platform reviewed ${fmtNum(p.N)} applicants last quarter. ${fmtNum(p.D)} of them defaulted on their loan; the remaining ${fmtNum(d.nonD)} repaid in full. ` +
    `The platform's risk model flagged ${fmtNum(d.correctFlags)} of the ${fmtNum(p.D)} defaulters as high-risk, and separately flagged ${fmtNum(p.fpFlags)} of the ${fmtNum(d.nonD)} on-time repayers as high-risk too. ` +
    `One applicant is picked at random from everyone the model flagged as high-risk. What is the probability that applicant is one of the actual defaulters?`,
  answerKey: "posterior",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $D$ = defaulted, $F$ = flagged high-risk. Natural frequencies out of ${fmtNum(p.N)} applicants: ${fmtNum(p.D)} defaulted, ${fmtNum(d.nonD)} repaid on time — no probability notation needed yet.` },
    { title: "Count the flagged pool", body: `Among the ${fmtNum(p.D)} defaulters, ${fmtNum(d.correctFlags)} were flagged. Among the ${fmtNum(d.nonD)} on-time repayers, ${fmtNum(p.fpFlags)} were flagged too (false alarms). The flagged pool $F$ has $${fmtNum(d.correctFlags)}+${fmtNum(p.fpFlags)}=${fmtNum(d.totalFlagged)}$ people total.` },
    { title: "Posterior as a count ratio", body: `$P(D\\mid F)=${fmtNum(d.correctFlags)}/${fmtNum(d.totalFlagged)}=${fmtNum(d.posterior)}$ — just the defaulters' share of the flagged pool.` },
    { title: "Sanity check", body: `The model correctly catches ${fmtNum(d.correctFlags)} of ${fmtNum(p.D)} defaulters (a $${fmtNum(d.catchRate)}$ catch fraction), but the ${fmtNum(p.fpFlags)} false alarms push the flagged pool past $D$ itself, so the posterior must land below that catch fraction — and $${fmtNum(d.posterior)} < ${fmtNum(d.catchRate)}$ holds.` },
  ],
  keyInsight: "Natural frequencies let you skip probability notation entirely — track how many people actually land in each raw count, and the posterior is just the target group's share of the flagged pool, no formula needed.",
  commonTrap: "Reporting the model's catch rate among defaulters as the answer — that's the probability of being flagged given a default, not the probability of a default given a flag, and it ignores the false alarms swelling the flagged pool.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [],
};
