import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

const answerOf = (par: Params) => Math.exp(-par.lam * par.t);

export const exponentialMemoryless: ProblemTemplate = {
  id: "distributions/exponential-memoryless",
  version: 1,
  topic: "probability/distributions",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "citadel", weight: 0.3 }],
  source: { kind: "original", inspiration: "the memoryless property of the exponential distribution, the continuous analogue of the geometric case" },
  params: {
    lam: { range: { min: 0.05, max: 2, step: 0.05 } },
    s: { range: { min: 0.5, max: 20, step: 0.5 } },
    t: { range: { min: 0.5, max: 20, step: 0.5 } },
  },
  // lam*s capped so rejection sampling (conditioning on X>s) stays practical — the Python
  // simulate() rejects every draw below s, and its surviving-sample count is what has to reach
  // the trial budget, not the raw draw count.
  // t=s is excluded: there the answer (e^{-lam*t}) and the elapsed-wait-alone commonTrap
  // (e^{-lam*s}) are algebraically identical, since t and s enter the same formula.
  constraint: (p) => p.t !== p.s && p.lam * p.s <= 3 && answerOf(p) >= 0.1 && answerOf(p) <= 0.9,
  derived: (p) => {
    const answer = answerOf(p);
    return { answer };
  },
  statement: (p) =>
    `The time between consecutive trades on an illiquid name follows an exponential distribution with rate $\\lambda$ equal to ${fmtNum(p.lam)} per second. Given that ${fmtNum(p.s)} seconds have already passed with no trade, what is the probability that more than ${fmtNum(p.t)} further seconds pass before the next trade?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Recognize the memoryless property", body: `The exponential distribution has no memory: how long you have already waited carries no information about how much longer you will wait — conditioning on surviving past ${fmtNum(p.s)} seconds leaves the distribution of the REMAINING wait identical to a fresh exponential wait.` },
    { title: "Apply the unconditional survival formula to the remaining wait", body: `"More than $t$ further seconds" is exactly the unconditional survival event restarted from now: $P(X>t\\mid X>s)=e^{-\\lambda t}$.` },
    { title: "Compute", body: `$P(\\text{more than }${fmtNum(p.t)}\\text{ further seconds})\\approx e^{-\\lambda\\times ${fmtNum(p.t)}}\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `This matches the answer a fresh, unconditioned "more than ${fmtNum(p.t)} seconds" question would give at the same rate — the ${fmtNum(p.s)}-second head start changes nothing about the forward-looking probability, which is the defining property being tested here, not an approximation of it.` },
  ],
  keyInsight: "The exponential distribution is memoryless: conditioning on an elapsed wait does not shift the distribution of the remaining wait — the answer depends only on how much further time is asked about, never on how much has already elapsed.",
  commonTrap: "Treating the already-elapsed wait as making an arrival \"overdue\" and shrinking the further-wait probability below the unconditional value — the exponential distribution has no such memory.",
  expectedPaceS: 65,
  verify: { method: "montecarlo" },
  constants: [],
};
