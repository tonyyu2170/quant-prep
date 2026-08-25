import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Decimal odds are drawn only from values whose reciprocals terminate, so the implied prices
// and the book they add up to are exact decimals and every printed chain reconciles. The
// arbitrage itself needs the book to come in under one; `constraint` therefore has to compute
// it, which is what licenses the module-level helper.
const bookOf = (par: { o1: number; o2: number; o3: number }) => 1 / par.o1 + 1 / par.o2 + 1 / par.o3;

export const bookOverroundArbitrage: ProblemTemplate = {
  id: "finance/book-overround-arbitrage",
  version: 1,
  topic: "finance/arbitrage",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.3 }, { firm: "optiver", weight: 0.25 }, { firm: "drw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "locking a profit out of a book whose implied probabilities sum below one" },
  params: {
    o1: { choices: [1.25, 1.6, 2, 2.5, 3.125, 4, 5, 6.25, 8, 10, 12.5, 16, 20] },
    o2: { choices: [1.25, 1.6, 2, 2.5, 3.125, 4, 5, 6.25, 8, 10, 12.5, 16, 20] },
    o3: { choices: [1.25, 1.6, 2, 2.5, 3.125, 4, 5, 6.25, 8, 10, 12.5, 16, 20] },
    bank: { choices: [100, 200, 400, 500, 1000] },
  },
  // Quoted shortest-first so the three horses read in order, and only where the book is
  // mispriced enough to be worth staking.
  constraint: (p) => p.o1 <= p.o2 && p.o2 <= p.o3 && bookOf(p as { o1: number; o2: number; o3: number }) <= 0.95,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const p1 = round(1 / p.o1), p2 = round(1 / p.o2), p3 = round(1 / p.o3);
    const book = round(p1 + p2 + p3);
    const payout = round(p.bank / book);
    return {
      p1, p2, p3, book, payout,
      stake1: round((p.bank * p1) / book),
      stake2: round((p.bank * p2) / book),
      stake3: round((p.bank * p3) / book),
      answer: round(payout - p.bank),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A bookmaker quotes three horses in a race at decimal odds of ${fmtNum(p.o1)}, ${fmtNum(p.o2)} and ${fmtNum(p.o3)}. Decimal odds of ${fmtNum(p.o1)} mean a winning stake of one dollar is returned as ${fmtNum(p.o1)} dollars, the stake included. ` +
    `Exactly one horse wins, and you may split a bank of ${fmtNum(p.bank)} dollars across all three in any proportion you like. ` +
    `What is the largest profit you can lock in, guaranteed whichever horse wins?`,
  solution: (p, d) => [
    { title: "Read each price as what a dollar of the winner costs", body: `A stake of $s$ on the first horse returns ${fmtNum(p.o1)} times $s$ if it wins, so buying one dollar of "first horse wins" costs $1/${fmtNum(p.o1)}=${fmtNum(d.p1)}$. The other two cost ${fmtNum(d.p2)} and ${fmtNum(d.p3)} the same way.` },
    { title: "Add the prices up", body: `Buying one dollar of every outcome costs $${fmtNum(d.p1)}+${fmtNum(d.p2)}+${fmtNum(d.p3)}=${fmtNum(d.book)}$. That total is the book. Since exactly one horse wins, that bundle pays exactly one dollar whatever happens — so a book under one is a dollar on sale for less than a dollar, and a book over one is the bookmaker's margin.` },
    { title: "Spend the whole bank on the bundle", body: `Scale the bundle up until it costs the full bank: the stakes go on in proportion to the prices, $\\text{stake}_i=\\text{bank}\\times\\dfrac{1/o_i}{\\text{book}}$, which here is ${fmtNum(d.stake1)}, ${fmtNum(d.stake2)} and ${fmtNum(d.stake3)}. Whichever horse wins, the return is $${fmtNum(p.bank)}/${fmtNum(d.book)}=${fmtNum(d.payout)}$ dollars.` },
    { title: "Answer", body: `The return of ${fmtNum(d.payout)} against a bank of ${fmtNum(p.bank)} locks in ${fmtNum(d.answer)} dollars of profit, and it is the same number on all three outcomes.` },
    { title: "Sanity check", body: `Test one branch: staking ${fmtNum(d.stake1)} on the first horse at odds of ${fmtNum(p.o1)} returns ${fmtNum(d.payout)}, which is the same figure the other two branches produce — the point of splitting in proportion to the prices rather than by hunch is that all three branches land on one number.` },
  ],
  keyInsight: "Decimal odds are prices, not opinions: one over the odds is what a dollar of that outcome costs. When the outcomes are exhaustive and mutually exclusive, their prices should sum to one, and any other sum is a bundle worth exactly a dollar trading away from a dollar.",
  commonTrap: "Backing the horse with the biggest apparent edge. The arbitrage does not care which quote is wrong — it only needs the total to miss one, and it needs every outcome covered in proportion to its price, since a single uncovered outcome turns a locked profit into a bet.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [1],
};
