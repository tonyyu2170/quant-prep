import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Four two-decimal prices sum exactly, so every chain is over exact operands. `constraint`
// keeps the book mispriced by at least three cents and at most thirty per set — a fair book is
// not a question, and a book out by a dollar is not a market. The answer is the credit's
// magnitude; which way the trade runs is said in prose, chosen by the sign of the gap.
export const multiWinnerBookArbitrage: ProblemTemplate = {
  id: "finance/multi-winner-book-arbitrage",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "sig", weight: 0.25 }, { firm: "optiver", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "contracts on a group from which a fixed number advance, priced away from that number" },
  params: {
    p1: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    p2: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    p3: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    p4: { choices: [0.12, 0.18, 0.23, 0.27, 0.33, 0.41, 0.46, 0.52, 0.58, 0.64, 0.71, 0.79, 0.83, 0.88] },
    advance: { choices: [2, 3] },
    n: { choices: [100, 200, 500, 1000] },
  },
  constraint: (p) => Math.abs(p.p1 + p.p2 + p.p3 + p.p4 - p.advance) >= 0.03 && Math.abs(p.p1 + p.p2 + p.p3 + p.p4 - p.advance) <= 0.3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const sum = round(p.p1 + p.p2 + p.p3 + p.p4);
    const gap = round(Math.abs(sum - p.advance));
    return { sum, gap, answer: round(p.n * gap) };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Four teams are in a group and exactly ${fmtNum(p.advance)} of them will advance. For each team a contract trades that pays one dollar if that team advances and nothing otherwise; you may buy or sell any of them, and also a riskless bond paying one dollar at settlement, which trades at one dollar since interest rates are zero. ` +
    `The contracts are quoted at ${fmtNum(p.p1)}, ${fmtNum(p.p2)}, ${fmtNum(p.p3)} and ${fmtNum(p.p4)}. You trade ${fmtNum(p.n)} of each contract. What riskless credit can you lock in today?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "A set of contracts that always pays the same total is a bond", body: `Exactly $k$ of the four contracts pay, whichever teams go through, so a portfolio holding one of each pays exactly $k$ dollars in every state of the world — it IS $k$ bonds, and must cost what $k$ bonds cost. A fair book therefore has $p_1+p_2+p_3+p_4=k$; any other total misprices a riskless portfolio.` },
    { title: "Add up the book", body: `$${fmtNum(p.p1)}+${fmtNum(p.p2)}+${fmtNum(p.p3)}+${fmtNum(p.p4)}=${fmtNum(d.sum)}$ against the ${fmtNum(p.advance)} the set is certain to pay.` },
    { title: "Which way the trade runs", body: d.sum < p.advance
        ? `The set costs ${fmtNum(d.sum)} and is worth ${fmtNum(p.advance)} for certain. Buy one of each contract and sell ${fmtNum(p.advance)} bonds: you pocket $${fmtNum(p.advance)}-${fmtNum(d.sum)}=${fmtNum(d.gap)}$ per set today, and at settlement the contracts pay ${fmtNum(p.advance)}, exactly what the bonds owe.`
        : `The set sells for ${fmtNum(d.sum)} and is worth only ${fmtNum(p.advance)}. Sell one of each contract and buy ${fmtNum(p.advance)} bonds: you pocket $${fmtNum(d.sum)}-${fmtNum(p.advance)}=${fmtNum(d.gap)}$ per set today, and at settlement the bonds pay ${fmtNum(p.advance)}, exactly what the contracts owe.` },
    { title: "Answer", body: `Across ${fmtNum(p.n)} of each contract, $${fmtNum(p.n)}\\times${fmtNum(d.gap)}=${fmtNum(d.answer)}$ dollars today, with nothing owed in any outcome.` },
    { title: "Sanity check", body: `No view on the football is needed, and no combination of advancing teams changes the payoff: ${fmtNum(p.advance)} contracts pay and the rest do not, in every one of the ${p.advance === 2 ? "six" : "four"} ways the group can resolve, so the position settles flat every time. The credit is the whole edge, and it is ${fmtNum(d.gap)} per set exactly.` },
  ],
  keyInsight: "A set of contracts that always pays a known total is a bond in disguise, and the market has to price it as one. When a fixed number of the contracts must pay, the sum of their prices is pinned to that number, and a book that sums to anything else hands the gap to whoever trades every contract at once.",
  commonTrap: "Checking that the prices sum to one, as for a single winner, when here exactly two or three of the contracts will pay. The riskless total is the number that advance, and the arbitrage is measured against that number.",
  expectedPaceS: 85,
  verify: { method: "brute-force" },
  constants: [1, 2, 3, 4],
};
