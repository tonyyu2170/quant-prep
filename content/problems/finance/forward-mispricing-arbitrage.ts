import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// The rate is simple over the period, so the fair forward is the spot plus a carry that
// `constraint` licenses as a four-figure exact value, and the quoted forward is the spot plus a
// drawn premium that is printed only as the quote itself. The edge is the gap between the two,
// at least a quarter so the question is a mispricing and not rounding; the answer is its
// magnitude, and the direction of the trade is said in prose.
export const forwardMispricingArbitrage: ProblemTemplate = {
  id: "finance/forward-mispricing-arbitrage",
  version: 1,
  topic: "finance/arbitrage",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "optiver", weight: 0.2 }, { firm: "drw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "cash-and-carry against a forward quoted away from spot plus carry" },
  params: {
    spot: { choices: [20, 25, 40, 50, 60, 80, 100, 120, 150, 200] },
    ratePct: { choices: [2, 2.5, 3, 4, 5, 6, 8, 10] },
    premium: { choices: [-1, 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15] },
    n: { choices: [10, 20, 50, 100, 200, 500, 1000] },
  },
  constraint: (p) => Math.abs(p.premium - p.spot * p.ratePct / 100) >= 0.25 && exact4(p.spot * p.ratePct / 100) && exact4(p.spot + p.spot * p.ratePct / 100),
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const carry = round(p.spot * p.ratePct / 100);
    return {
      rate: round(p.ratePct / 100),
      growth: round(1 + p.ratePct / 100),
      carry,
      fair: round(p.spot + carry),
      quoted: round(p.spot + p.premium),
      edge: round(Math.abs(p.premium - carry)),
      answer: round(p.n * Math.abs(p.premium - carry)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A stock trades at ${fmtNum(p.spot)} today and pays no dividend. Over the period to a forward contract's delivery date, cash earns a simple ${fmtNum(p.ratePct)} percent: a dollar lent today returns ${fmtNum(d.growth)} at delivery, and a dollar borrowed costs the same. ` +
    `The forward for delivery on that date is quoted at ${fmtNum(d.quoted)}. You can trade ${fmtNum(p.n)} units. What riskless profit can you lock in?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "The forward that admits no free money", body: `Holding the stock until delivery ties up its price for the period, and that money could have earned the rate, so the forward consistent with the spot is the spot grown at the rate: $F=S(1+r)$. A quoted forward above it is sold against stock bought with borrowed money; one below is bought against stock sold short, the proceeds lent out.` },
    { title: "The carry", body: `Financing the stock for the period costs $${fmtNum(p.spot)}\\times${fmtNum(d.rate)}=${fmtNum(d.carry)}$ per share.` },
    { title: "The fair forward", body: `$${fmtNum(p.spot)}+${fmtNum(d.carry)}=${fmtNum(d.fair)}$, or the same thing as $${fmtNum(p.spot)}\\times${fmtNum(d.growth)}=${fmtNum(d.fair)}$.` },
    { title: "The trade", body: d.quoted > d.fair
        ? `The forward is rich by $${fmtNum(d.quoted)}-${fmtNum(d.fair)}=${fmtNum(d.edge)}$. Borrow ${fmtNum(p.spot)} per share, buy the stock, and sell the forward at ${fmtNum(d.quoted)}. At delivery, hand over the stock for ${fmtNum(d.quoted)} and repay the loan with interest, ${fmtNum(d.fair)}. The difference is yours whatever the stock has done.`
        : `The forward is cheap by $${fmtNum(d.fair)}-${fmtNum(d.quoted)}=${fmtNum(d.edge)}$. Sell the stock short at ${fmtNum(p.spot)}, lend the proceeds, and buy the forward at ${fmtNum(d.quoted)}. At delivery, collect ${fmtNum(d.fair)} from the loan, pay ${fmtNum(d.quoted)} for the stock through the forward, and return it. The difference is yours whatever the stock has done.` },
    { title: "Answer", body: `$${fmtNum(p.n)}\\times${fmtNum(d.edge)}=${fmtNum(d.answer)}$ dollars at delivery, locked in today.` },
    { title: "Sanity check", body: `Nothing about the stock's future price entered. Whether it finishes at half the spot or at double, the stock leg and the forward leg offset exactly at delivery, and only the financing and the quoted forward remain: an edge of ${fmtNum(d.edge)} per unit against a fair forward of ${fmtNum(d.fair)}. Note that the carry itself, ${fmtNum(d.carry)}, is not an edge — a forward is supposed to sit above the spot by exactly that much.` },
  ],
  keyInsight: "A forward is a spot trade with the financing attached: buying the stock now with borrowed money and delivering it later costs exactly the spot grown at the rate, so that is the only forward price that admits no free money. Any other quote is arbitraged by a cash-and-carry in one direction or the other, and the stock's future price never enters.",
  commonTrap: "Comparing the forward to the spot rather than to the spot grown at the rate, which reads the whole cost of carry as an edge. The other slip is running the trade the wrong way round — a rich forward is sold, against stock bought with borrowed money, not bought.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  // The 1 in $F=S(1+r)$ — a digit in a claim-free segment is still a number to the audit.
  constants: [1],
};
