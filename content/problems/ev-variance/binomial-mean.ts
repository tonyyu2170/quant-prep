import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), and the "never a whole number" rule below is a
// statement about the answer, so it has to be asked through the same helper.
const evOf = (p: Params) => (p.bids * p.fillPct) / 100;

// The binomial mean as a sum of indicators. The Sanity check bounds the answer against the
// symmetric half-rate case, which is an argument about the distribution rather than a
// rearrangement of n times p.
export const binomialMean: ProblemTemplate = {
  id: "ev-variance/binomial-mean",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "de-shaw", weight: 0.3 }],
  source: { kind: "original", inspiration: "expected count of successes over independent trials, read as a sum of indicators" },
  params: {
    bids: { range: { min: 5, max: 20, step: 1 } },
    fillPct: { range: { min: 5, max: 95, step: 5 } },
  },
  // Two rejections. A fill rate of exactly half makes the Sanity check's strict comparison
  // against bids/2 an equality, so the check would assert nothing. A whole-number answer
  // makes the commonTrap — rounding the expectation to a whole number — accidentally right,
  // which is the Task 1 failure mode this batch is guarding against.
  // Constraint 2's floor cannot bind: the smallest legal answer is 0.25 and the largest 18.05.
  constraint: (p) => p.fillPct !== 50 && !Number.isInteger(evOf(p)),
  derived: (p) => ({
    p: p.fillPct / 100,
    half: p.bids / 2,
    ev: evOf(p),
  }),
  statement: (p) =>
    `A desk works ${fmtNum(p.bids)} separate auctions, sending one bid into each. The auctions are unrelated to one another, and ` +
    `each bid is filled with probability ${fmtNum(p.fillPct)} percent. What is the expected number of bids that get filled?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the fill rate as a probability: $\\frac{${fmtNum(p.fillPct)}}{100}=${fmtNum(d.p)}$. Each of the ${fmtNum(p.bids)} bids fills with that probability.` },
    { title: "One auction at a time", body: `Count the fills as a sum of indicators, one per auction, each worth one if that bid fills and nothing if it does not. The average of such an indicator is just the chance it fires, so every auction contributes ${fmtNum(d.p)} to the expected count on its own.` },
    // The chain stays on exact integers over 100; multiplying the rounded probability by the
    // bid count instead would drift off the printed answer.
    { title: "Add them up", body: `Expectations add, so the ${fmtNum(p.bids)} contributions simply sum: $\\frac{${fmtNum(p.bids)}\\times${fmtNum(p.fillPct)}}{100}=${fmtNum(d.ev)}$. Note the answer is not a whole number — an expectation is a long-run average, not a count any single day can show.` },
    { title: "Sanity check", body: `Pin the answer against the balanced case. If every bid filled half the time, fills and misses would be mirror images and the answer would be $\\frac{${fmtNum(p.bids)}}{2}=${fmtNum(d.half)}$. The rate here is ${p.fillPct > 50 ? "above" : "below"} half, so the expected count has to come out ${p.fillPct > 50 ? "above" : "below"} ${fmtNum(d.half)} — and it does.` },
  ],
  keyInsight: "A count of successes is a sum of indicators, and the average of an indicator is nothing more than the chance it fires, so the expected count is the number of trials times that chance — an argument that never touches the distribution of the count itself.",
  commonTrap: "Rounding the answer to a whole number on the grounds that a count of fills always is one. The expectation averages over many runs and lands between whole numbers, so rounding reports a figure the average never equals.",
  expectedPaceS: 30,
  verify: { method: "brute-force" },
  constants: [100, 2],
};
