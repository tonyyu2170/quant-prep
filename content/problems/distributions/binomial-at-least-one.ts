import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

const atLeastOneOf = (par: Params) => 1 - (1 - par.failPct / 100) ** par.n;

export const binomialAtLeastOne: ProblemTemplate = {
  id: "distributions/binomial-at-least-one",
  version: 1,
  topic: "probability/distributions",
  difficulty: 2,
  firms: [{ firm: "two-sigma", weight: 0.35 }, { firm: "susquehanna", weight: 0.3 }],
  source: { kind: "original", inspiration: "at-least-one as the complement of the zero-success event" },
  params: {
    n: { range: { min: 5, max: 20, step: 1 } },
    failPct: { range: { min: 2, max: 35, step: 1 } },
  },
  constraint: (p) => atLeastOneOf(p) >= 0.01 && atLeastOneOf(p) <= 0.9,
  derived: (p) => {
    const prob = p.failPct / 100;
    const q = 1 - prob;
    const zeroFails = q ** p.n;
    const atLeastOne = 1 - zeroFails;
    return { prob, q, zeroFails, atLeastOne };
  },
  statement: (p) =>
    `A distributed system sends a heartbeat ping to ${fmtNum(p.n)} replicas, each independently. A replica fails to respond with probability ${fmtNum(p.failPct)} percent. What is the probability that at least one of the ${fmtNum(p.n)} replicas fails to respond?`,
  answerKey: "atLeastOne",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the per-replica failure rate as a probability: $\\frac{${fmtNum(p.failPct)}}{100}=${fmtNum(d.prob)}$, so a replica responds with probability ${fmtNum(d.q)}.` },
    { title: "Take the complement", body: `"At least one fails" is everything except "none fail" — computing it directly would mean summing the PMF over every count from $1$ through $${fmtNum(p.n)}$, so it is far easier to compute the single complementary event instead.` },
    { title: "Compute the zero-failure probability", body: `All ${fmtNum(p.n)} replicas must respond independently: $P(\\text{none fail})=${fmtNum(d.q)}^{${fmtNum(p.n)}}=${fmtNum(d.zeroFails)}$.` },
    { title: "Sanity check", body: `The zero-failure event and the at-least-one event partition every outcome, so they must sum to ${fmtNum(1)}: $${fmtNum(d.zeroFails)}+${fmtNum(d.atLeastOne)}=${fmtNum(1)}$, giving $P(\\text{at least one fails})=${fmtNum(d.atLeastOne)}$.` },
  ],
  keyInsight: "\"At least one\" over many independent trials is almost always easier as one minus the all-succeed probability than as a direct sum over every qualifying count.",
  commonTrap: "Multiplying the per-trial failure rate by the trial count instead of taking the complement of the all-succeed probability — that product is not even a probability once the count is large enough.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1, 100],
};
