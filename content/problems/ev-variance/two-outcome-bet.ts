import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The answer formula, written once. `constraint` only ever sees `params`
// (packages/engine/src/problem.ts:24), so without this helper the expectation would be
// typed twice — once to pin the answer away from zero, once to derive the answer.
const evOf = (p: Params) => ((7 - p.k) * p.w - (p.k - 1) * p.l) / 6;

// The house-edge opener, and the batch's first negative answer. `winFaces` and
// `loseFaces` exist so the prose can name the numerators of the two probabilities and
// keep the displayed arithmetic in exact sixths; `fairWin` exists so the Sanity check
// can price the bet independently of `ev`.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const twoOutcomeBet: ProblemTemplate = {
  id: "ev-variance/two-outcome-bet",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.4 }, { firm: "sig", weight: 0.35 }],
  source: { kind: "original", inspiration: "single-roll house-edge bet whose payout looks generous and whose expectation is not" },
  params: {
    k: { range: { min: 3, max: 6, step: 1 } }, // rolls below k lose
    w: { range: { min: 2, max: 12, step: 1 } },
    l: { range: { min: 2, max: 12, step: 1 } },
  },
  // Strictly a losing bet, held at or past the batch's answer floor of |answer| >= 0.01:
  // a fair game would make the answer 0, which grades as strict float equality and fails
  // the abs-tolerance gate. Every ev is a multiple of 1/6, so the floor actually binds at
  // -1/6 and no draw sits near it. k starts at 3 because k = 2 loses on one face in six
  // and is almost never a losing bet.
  constraint: (p) => evOf(p) <= -0.01,
  derived: (p) => {
    const winFaces = 7 - p.k;
    const loseFaces = p.k - 1;
    const pWin = winFaces / 6;
    const pLose = loseFaces / 6;
    const winLeg = pWin * p.w;
    const loseLeg = pLose * p.l;
    return { winFaces, loseFaces, pWin, pLose, winLeg, loseLeg, fairWin: loseFaces * p.l / winFaces, ev: evOf(p) };
  },
  statement: (p) =>
    `A fair six-sided die is rolled once. If the roll comes up below ${fmtNum(p.k)} you lose ${fmtNum(p.l)} dollars; ` +
    `otherwise you win ${fmtNum(p.w)} dollars. What is your expected profit, in dollars, on one roll?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Expected profit weights each outcome by its probability. A roll below ${fmtNum(p.k)} loses, which is ${fmtNum(d.loseFaces)} of the 6 faces, so the lose probability is $${fmtNum(d.loseFaces)}/6=${fmtNum(d.pLose)}$; that leaves ${fmtNum(d.winFaces)} of the 6 faces to win, a win probability of $${fmtNum(d.winFaces)}/6=${fmtNum(d.pWin)}$.` },
    // Every chain below keeps the sixths as exact fractions. Multiplying the rounded
    // decimals instead ($0.8333\times9$) drifts off the printed result.
    { title: "Weight each branch", body: `The winning branch contributes $\\frac{${fmtNum(d.winFaces)}}{6}\\times${fmtNum(p.w)}=${fmtNum(d.winLeg)}$ dollars, and the losing branch takes away $\\frac{${fmtNum(d.loseFaces)}}{6}\\times${fmtNum(p.l)}=${fmtNum(d.loseLeg)}$ dollars.` },
    { title: "Combine", body: `Expected profit is the winning contribution minus the losing one. Over a common denominator of 6 it stays exact: $\\frac{${fmtNum(d.winFaces)}\\times${fmtNum(p.w)}-${fmtNum(d.loseFaces)}\\times${fmtNum(p.l)}}{6}=${fmtNum(d.ev)}$ dollars per roll.` },
    { title: "Sanity check", body: `Price the bet the other way round, counting faces rather than probabilities. To break even, the winning faces would have to return exactly what the losing faces take, so a fair payout is $\\frac{${fmtNum(d.loseFaces)}\\times${fmtNum(p.l)}}{${fmtNum(d.winFaces)}}=${fmtNum(d.fairWin)}$ dollars per winning face. The game offers only ${fmtNum(p.w)}, short of that, so the expected profit must come out negative — and it does.` },
  ],
  keyInsight: "An expectation weights every outcome by how often it arrives, so a win and a loss only become comparable once each has been multiplied by its own probability — the raw sizes of the two payouts say nothing on their own about which way the bet leans.",
  commonTrap: "Subtracting the loss amount from the win amount and reporting that difference as the expected profit, which skips the step where each amount is scaled by the chance of actually landing on its branch.",
  expectedPaceS: 35,
  verify: { method: "brute-force" },
  constants: [6],
};
