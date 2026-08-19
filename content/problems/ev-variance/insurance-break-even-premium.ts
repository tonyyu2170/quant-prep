import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper: `constraint` is a structural rejection (a total loss has to
// cost materially more than a minor claim) and never asks the price, so a helper would be a
// second copy of the answer formula for nothing. Constraint 2's floor cannot bind — the
// cheapest legal premium is five dollars.
// A fair price rather than a fair game's expectation, per constraint 3. Percentages are
// multiples of five against payouts that are multiples of twenty, and the total-loss figure is
// a multiple of a hundred, so every weighted leg lands on a whole dollar and nothing printed
// here is ever a rounded operand. The Sanity check reads the same policy as a ledger over a
// hundred years, which is an integer identity and a genuinely different route to the price.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const insuranceBreakEvenPremium: ProblemTemplate = {
  id: "ev-variance/insurance-break-even-premium",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "jane-street", weight: 0.3 }],
  source: { kind: "original", inspiration: "pricing a policy at the premium that zeroes the insurer's expected profit" },
  params: {
    minorPct: { range: { min: 5, max: 40, step: 5 } },
    totalPct: { range: { min: 1, max: 10, step: 1 } },
    minor: { range: { min: 20, max: 200, step: 20 } },
    total: { range: { min: 200, max: 1000, step: 100 } },
    admin: { range: { min: 2, max: 20, step: 2 } },
  },
  // A total loss has to cost materially more than a minor claim, or the two branches are the
  // same event under two names. The gap of a hundred is the step the total-loss payout moves in.
  constraint: (p) => p.total >= p.minor + 100,
  derived: (p) => {
    const minorLeg = (p.minorPct * p.minor) / 100;
    const totalLeg = (p.totalPct * p.total) / 100;
    const premium = minorLeg + totalLeg + p.admin;
    return {
      noClaimPct: 100 - p.minorPct - p.totalPct,
      minorLeg,
      totalLeg,
      expPayout: minorLeg + totalLeg,
      collect100: 100 * premium,
      payOut100: p.minorPct * p.minor + p.totalPct * p.total + 100 * p.admin,
      premium,
    };
  },
  statement: (p, d) =>
    `An insurer is pricing a one-year policy. Over the year the holder files no claim at all with probability ` +
    `${fmtNum(d.noClaimPct)} percent, a minor claim costing the insurer ${fmtNum(p.minor)} dollars with probability ` +
    `${fmtNum(p.minorPct)} percent, or suffers a total loss costing the insurer ${fmtNum(p.total)} dollars with ` +
    `probability ${fmtNum(p.totalPct)} percent. Administering the policy costs the insurer ${fmtNum(p.admin)} dollars ` +
    `whatever the year brings. What premium, in dollars, leaves the insurer expecting to break even?`,
  answerKey: "premium",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Weight each claim by how often it arrives", body: `The quiet years cost the insurer nothing in claims, so only the other two branches carry payout. Measured in dollars per policy and averaged over the year, minor claims contribute $\\frac{${fmtNum(p.minorPct)}\\times${fmtNum(p.minor)}}{100}=${fmtNum(d.minorLeg)}$, and total losses, rare as they are, contribute $\\frac{${fmtNum(p.totalPct)}\\times${fmtNum(p.total)}}{100}=${fmtNum(d.totalLeg)}$.` },
    // Every leg lands on a whole dollar by construction, so these sums are exact operands
    // rather than four-significant-figure renderings of something else.
    { title: "Add the expected outgo", body: `Claims therefore cost $${fmtNum(d.minorLeg)}+${fmtNum(d.totalLeg)}=${fmtNum(d.expPayout)}$ dollars per policy on average.` },
    { title: "Solve for the price", body: `Profit per policy is the premium less the claims and less the paperwork, and break-even is where that difference is nothing at all. So the premium has to cover both: $${fmtNum(d.expPayout)}+${fmtNum(p.admin)}=${fmtNum(d.premium)}$ dollars.` },
    { title: "Sanity check", body: `Price it again as a ledger rather than as probabilities. Over a hundred such policies the insurer takes in $100\\times${fmtNum(d.premium)}=${fmtNum(d.collect100)}$ dollars, and pays out the minor claims, the total losses and the paperwork on every one of them: $${fmtNum(p.minorPct)}\\times${fmtNum(p.minor)}+${fmtNum(p.totalPct)}\\times${fmtNum(p.total)}+100\\times${fmtNum(p.admin)}=${fmtNum(d.payOut100)}$ dollars. The two sides match to the dollar. Note also where the price lands: far below the ${fmtNum(p.total)} dollars a single total loss costs, and above the ${fmtNum(p.admin)} dollars of paperwork that every policy incurs.` },
  ],
  keyInsight: "A break-even price is an average over many years, not a description of a typical one. Most policies never claim, and yet the premium has to carry the rare large payout in proportion to how rarely it arrives, which lands the fair price between what a quiet year costs and what a ruinous one does, and nowhere near either.",
  commonTrap: "Pricing off the outcome that happens most of the time — no claim at all — and charging only what the paperwork costs. The whole purpose of a premium is to average the rare payouts in, so leaving them out understates the price by exactly their weighted cost.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  // 100 is the percentage denominator and the size of the ledger the Sanity check reads.
  constants: [100],
};
