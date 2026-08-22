import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Three states, one absorbing, with a repair edge that sends the chain BACKWARD. Expected days
// from new to failed is 100*(B+W+R)/(W*B) in integer percents — derived once, printed exactly.
export const systemDaysToFailure: ProblemTemplate = {
  id: "markov/system-days-to-failure",
  version: 1,
  topic: "probability/markov",
  difficulty: 3,
  firms: [{ firm: "citadel", weight: 0.3 }, { firm: "drw", weight: 0.3 }, { firm: "millennium", weight: 0.2 }],
  source: { kind: "original", inspiration: "three-state absorbing chain with a backward repair edge" },
  params: {
    wearPct: { range: { min: 5, max: 40, step: 1 } },
    breakPct: { range: { min: 6, max: 40, step: 2 } },
    repairPct: { range: { min: 10, max: 50, step: 5 } },
  },
  constraint: (p) => p.breakPct + p.repairPct <= 90 && p.wearPct < 45,
  derived: (p) => {
    const sum = p.breakPct + p.wearPct + p.repairPct;
    const answer = (100 * sum) / (p.wearPct * p.breakPct);
    const fromWorn = (100 * (p.wearPct + p.repairPct)) / (p.wearPct * p.breakPct);
    const daysToWear = 100 / p.wearPct;
    return { sum, answer, fromWorn, daysToWear, wearRate: p.wearPct / 100, breakRate: p.breakPct / 100, repairRate: p.repairPct / 100 };
  },
  statement: (p, d) =>
    `A server is new, worn, or failed. Each day a new server becomes worn with probability ${fmtNum(d.wearRate)}, otherwise staying new. Each day a worn server fails with probability ${fmtNum(d.breakRate)}, is refurbished back to new with probability ${fmtNum(d.repairRate)}, and otherwise stays worn. Starting new, what is the expected number of days until it fails?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Two unknowns, one absorbing state", body: `Failure ends the process, so only 'new' and 'worn' carry unknown waits. Write them as $E_{new}$ and $E_{worn}$ and take one step from each.` },
    { title: "Leaving 'new'", body: `From new, the only exit is to worn, and it arrives after $\\frac{100}{${p.wearPct}}=${fmtNum(d.daysToWear)}$ days on average. So $E_{new}$ is that wait plus $E_{worn}$.` },
    { title: "Leaving 'worn'", body: `From worn there are three moves: fail and stop, refurbish back to new, or stay worn another day. The refurbish edge is what makes this more than a straight line — it feeds the chain backward, so $E_{worn}$ depends on $E_{new}$, which depends on $E_{worn}$.` },
    { title: "Solve the pair", body: `Substituting one into the other cancels the circular term and leaves $\\frac{100\\times(${p.breakPct}+${p.wearPct}+${p.repairPct})}{${p.wearPct}\\times${p.breakPct}}=${fmtNum(d.answer)}$ days.` },
    { title: "Sanity check", body: `Starting from worn instead gives $\\frac{100\\times(${p.wearPct}+${p.repairPct})}{${p.wearPct}\\times${p.breakPct}}=${fmtNum(d.fromWorn)}$ days, which is shorter than $${fmtNum(d.answer)}$ — as it must be, since a worn server has already spent the wait to get there.` },
  ],
  keyInsight: "An edge that runs backward does not break first-step analysis: it just makes the equations simultaneous rather than sequential.",
  commonTrap: "Adding the mean time in each state as if the chain marched forward once. Refurbishment returns it to 'new' repeatedly, and those revisits are already inside the solved expressions.",
  expectedPaceS: 165,
  constants: [100],
  verify: { method: "brute-force" },
};
