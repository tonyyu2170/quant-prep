import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Required adjacency by the block method: glue the series into one item, arrange,
// then restore its internal orders. The Sanity check reprices the event by asking
// only which shelf positions the series occupies — a route with no factorials in it
// at all, so a mishandled internal ordering shows up as a mismatch.
export const adjacencyRequiredBlock: ProblemTemplate = {
  id: "counting/adjacency-required-block",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "hrt", weight: 0.35 }, { firm: "imc", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic block-method adjacency, asked as a probability over random arrangements" },
  params: {
    books: { range: { min: 6, max: 12, step: 1 } },
    series: { range: { min: 2, max: 4, step: 1 } },
  },
  // At least two books outside the series, so the block has somewhere to sit other
  // than the whole shelf; that also keeps the number of block positions above one,
  // which would make the probability a single fixed fraction.
  constraint: (p) => p.series <= p.books - 2,
  derived: (p) => {
    const fact = (m: number) => { let f = 1; for (let i = 2; i <= m; i++) f *= i; return f; };
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      return num / fact(j);
    };
    const items = p.books - p.series + 1;
    const itemArr = fact(items);
    const seriesArr = fact(p.series);
    const totalArr = fact(p.books);
    const favourable = itemArr * seriesArr;
    const positions = choose(p.books, p.series);
    return {
      items,
      loose: p.books - p.series,
      itemArr,
      seriesArr,
      favourable,
      totalArr,
      prob: favourable / totalArr,
      positions,
      runs: items,
      probAlt: items / positions,
    };
  },
  statement: (p) =>
    `A librarian reshelves ${fmtNum(p.books)} books onto an empty shelf in a random order — every order of the ${fmtNum(p.books)} books is equally likely. ` +
    `Of those, ${fmtNum(p.series)} are the volumes of one series, and a reader wants those volumes to end up in one unbroken run, with no other book between them (their order within the run does not matter). ` +
    `What is the probability the shelf comes out that way?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `All $${fmtNum(p.books)}!=${fmtNum(d.totalArr)}$ orders are equally likely, so the probability is the share of orders in which the series lands in one run.` },
    { title: "Glue the series into one block", body: `An order with the volumes together is exactly an order of ${fmtNum(d.items)} items: the block plus the ${fmtNum(d.loose)} books outside the series. There are $${fmtNum(d.items)}!=${fmtNum(d.itemArr)}$ such orders.` },
    { title: "Restore the orders inside the block", body: `Each of those leaves the ${fmtNum(p.series)} volumes free to sit in any order inside the run: $${fmtNum(p.series)}!=${fmtNum(d.seriesArr)}$ ways. So $${fmtNum(d.itemArr)}\\times${fmtNum(d.seriesArr)}=${fmtNum(d.favourable)}$ shelvings work, and the probability is $${fmtNum(d.favourable)}/${fmtNum(d.totalArr)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Ask a smaller question: which ${fmtNum(p.series)} of the ${fmtNum(p.books)} shelf positions do the volumes occupy? By symmetry each of the $\\binom{${fmtNum(p.books)}}{${fmtNum(p.series)}}=${fmtNum(d.positions)}$ position sets is equally likely, and the ones that form a run are those starting at the first position, the second, and so on up to the ${fmtNum(d.runs)}th — the orders within the run and among the other books cancel from both sides of the ratio. That gives $${fmtNum(d.runs)}/${fmtNum(d.positions)}=${fmtNum(d.probAlt)}$, matching the answer with no factorial anywhere.` },
  ],
  keyInsight: "Requiring a group to stay together is a relabelling: the group behaves as one item while it is together, so the arrangement count is the shorter arrangement times the group's internal orders, and any factor shared by the favourable and total counts cancels out of the probability.",
  commonTrap: "Gluing the group into a block and forgetting that the block can be read in several internal orders, which undercounts the favourable arrangements by exactly the number of ways the group can be arranged within itself.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [],
};
