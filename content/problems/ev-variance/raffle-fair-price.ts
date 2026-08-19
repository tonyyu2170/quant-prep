import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the price would be typed
// twice — once to pin it away from zero, once to derive it.
const priceOf = (p: Params) => (p.grand + p.runners * p.voucher) / p.tickets;

// A fair game asked as a price rather than as an expectation, so the answer is never zero.
// The Sanity check brackets the price between two different quantities — the grand prize
// alone spread over the pool, and the average prize taken by a ticket that actually wins.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const raffleFairPrice: ProblemTemplate = {
  id: "ev-variance/raffle-fair-price",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "flow", weight: 0.3 }],
  source: { kind: "original", inspiration: "pricing a raffle ticket at its expected prize, with a headline prize and several small ones" },
  params: {
    tickets: { range: { min: 50, max: 300, step: 25 } },
    grand: { range: { min: 100, max: 500, step: 50 } },
    runners: { range: { min: 2, max: 6, step: 1 } },   // vouchers, at least two so the prose never reads "1 tickets"
    voucher: { range: { min: 5, max: 40, step: 5 } },
  },
  // Constraint 2's floor, stated as the requirement: a zero or near-zero price cannot be
  // graded. It never binds on this space (the smallest price is 0.3667) but a wider prize
  // fund or a longer ticket run would reach it, so the rule travels with the template.
  constraint: (p) => priceOf(p) >= 0.01,
  derived: (p) => ({
    prizeCount: p.runners + 1,
    runnersVoucher: p.runners * p.voucher,
    pool: p.grand + p.runners * p.voucher,
    legGrand: p.grand / p.tickets,
    perWinner: (p.grand + p.runners * p.voucher) / (p.runners + 1),
    price: priceOf(p),
  }),
  statement: (p) =>
    `A club sells ${fmtNum(p.tickets)} raffle tickets and every ticket has an equal chance in the draw. One ticket is drawn for ` +
    `a grand prize of ${fmtNum(p.grand)} dollars, and ${fmtNum(p.runners)} further tickets are drawn for vouchers worth ` +
    `${fmtNum(p.voucher)} dollars each; no ticket can win twice. What is a fair price for one ticket, in dollars — the price ` +
    `at which a buyer expects to break even?`,
  answerKey: "price",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Before the draw every ticket is interchangeable, so every ticket expects the same prize, and a fair price is exactly that expected prize. Since no ticket can win twice, the prizes land on ${fmtNum(d.prizeCount)} different tickets and the whole fund is shared out across the ${fmtNum(p.tickets)} sold.` },
    { title: "Total the prize fund", body: `The vouchers are worth $${fmtNum(p.runners)}\\times${fmtNum(p.voucher)}=${fmtNum(d.runnersVoucher)}$ between them, so the fund comes to $${fmtNum(p.grand)}+${fmtNum(d.runnersVoucher)}=${fmtNum(d.pool)}$ dollars.` },
    // Divide the exact fund once rather than adding rounded per-prize contributions.
    { title: "Spread it over the tickets", body: `Each ticket's expected prize is the fund divided by the number of tickets: $\\frac{${fmtNum(d.pool)}}{${fmtNum(p.tickets)}}=${fmtNum(d.price)}$. That is the fair price, in dollars.` },
    { title: "Sanity check", body: `Bracket the figure from two sides. A ticket that could only win the grand prize would be worth $\\frac{${fmtNum(p.grand)}}{${fmtNum(p.tickets)}}=${fmtNum(d.legGrand)}$, and the real ticket must be worth more than that because the vouchers add value on top. At the other extreme, the ${fmtNum(d.prizeCount)} tickets that do win something share the fund between them, averaging $\\frac{${fmtNum(d.pool)}}{${fmtNum(d.prizeCount)}}=${fmtNum(d.perWinner)}$ apiece, and the price must sit far below that because almost every ticket wins nothing. The answer lands between the two.` },
  ],
  keyInsight: "A fair price is the expected prize and nothing more, and because every ticket is interchangeable before the draw, the entire prize fund divided by the number of tickets sold prices any single one of them without a per-prize probability ever being written down.",
  commonTrap: "Pricing the ticket off the headline prize alone and forgetting the smaller ones, which understates what a ticket is worth by exactly the share of the fund those smaller prizes carry.",
  expectedPaceS: 35,
  verify: { method: "brute-force" },
  constants: [],
};
