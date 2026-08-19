import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (the box has to hold
// at least two plain tickets) and never asks the expectation, so a helper would be a second
// copy of the answer formula for nothing. Constraint 2's floor cannot bind — measured over the
// legal space |answer| runs [0.4444, 44.44], the floor sitting two orders of magnitude below.
// Sampling without replacement, whose mean is the one thing the dependence between draws does
// not touch. Everything is kept as an integer numerator over the pool so the rate can be
// folded into the same fraction. The Sanity check counts the plain tickets by the same route
// and reconciles the two counts against the number drawn, in integers.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const hypergeometricMean: ProblemTemplate = {
  id: "ev-variance/hypergeometric-mean",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "citadel-securities", weight: 0.3 }],
  source: { kind: "original", inspiration: "the mean of a hypergeometric count, where dependence between draws is a red herring" },
  params: {
    pool: { range: { min: 8, max: 18, step: 1 } },
    special: { range: { min: 2, max: 16, step: 1 } },
    draws: { range: { min: 2, max: 5, step: 1 } },
    rate: { range: { min: 2, max: 10, step: 1 } },
  },
  // At least two plain tickets, so the box is genuinely mixed and the plain count printed in
  // the Sanity check never lands on one. The draw count is capped at five in the param range
  // rather than here, which holds the Python counterpart's enumeration under 10^5 combinations.
  constraint: (p) => p.special <= p.pool - 2,
  derived: (p) => ({
    plain: p.pool - p.special,
    perDraw: p.special / p.pool,
    meanWin: (p.draws * p.special) / p.pool,
    meanPlain: (p.draws * (p.pool - p.special)) / p.pool,
    maxPay: p.rate * p.draws,
    ev: (p.rate * p.draws * p.special) / p.pool,
  }),
  statement: (p) =>
    `A sealed box holds ${fmtNum(p.pool)} tickets, of which ${fmtNum(p.special)} are winners and the rest are blanks. ` +
    `You reach in and pull out ${fmtNum(p.draws)} tickets together, so no ticket can be drawn twice. You are paid ` +
    `${fmtNum(p.rate)} dollars for every winner among the tickets you pulled. What is your expected payout, in dollars?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Look at one ticket", body: `Take any single one of the tickets you pulled. Before the box was opened it was equally likely to be any of the ${fmtNum(p.pool)} tickets inside, so on its own it is a winner with probability $\\frac{${fmtNum(p.special)}}{${fmtNum(p.pool)}}=${fmtNum(d.perDraw)}$. That is true of the last ticket pulled just as much as the first.` },
    { title: "Add the draws up", body: `Expectations add whether or not the pieces are independent, and that is the whole of the work here: the expected number of winners is that single-ticket chance counted once per ticket pulled, $\\frac{${fmtNum(p.draws)}\\times${fmtNum(p.special)}}{${fmtNum(p.pool)}}=${fmtNum(d.meanWin)}$. The draws being linked to one another changes how tightly the count clusters, not where it sits.` },
    // The rate is folded into the same integer numerator rather than multiplied onto the
    // printed count, which at four significant figures would drift off the answer.
    { title: "Price the handful", body: `At ${fmtNum(p.rate)} dollars a winner, the expected payout in dollars is $\\frac{${fmtNum(p.rate)}\\times${fmtNum(p.draws)}\\times${fmtNum(p.special)}}{${fmtNum(p.pool)}}=${fmtNum(d.ev)}$.` },
    { title: "Sanity check", body: `Count the blanks by the same argument: $\\frac{${fmtNum(p.draws)}\\times${fmtNum(d.plain)}}{${fmtNum(p.pool)}}=${fmtNum(d.meanPlain)}$ of them on average. Between them the two counts have to account for every ticket pulled, and in integer numerators over the pool they do: $\\frac{${fmtNum(p.draws)}\\times${fmtNum(p.special)}+${fmtNum(p.draws)}\\times${fmtNum(d.plain)}}{${fmtNum(p.pool)}}=${fmtNum(p.draws)}$. The payout is therefore short of the $${fmtNum(p.rate)}\\times${fmtNum(p.draws)}=${fmtNum(d.maxPay)}$ dollars that every ticket coming up a winner would pay, as it must be while the box holds any blanks at all.` },
  ],
  keyInsight: "Linearity of expectation does not ask whether the draws are independent. Each ticket pulled is equally likely to be any ticket in the box, so it carries the box's own proportion of winners, and the average count is nothing more than those chances added up. Drawing without replacement changes how tightly the count clusters around that average, never where the average sits.",
  commonTrap: "Quoting what a single ticket is worth and stopping there, as though only one had been pulled. The rate is paid on every ticket in the handful, so the answer carries a factor of the number drawn.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
};
