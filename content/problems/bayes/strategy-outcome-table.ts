import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Conditional read directly off a two-way joint table: P(row | column).
export const strategyOutcomeTable: ProblemTemplate = {
  id: "bayes/strategy-outcome-table",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "jump", weight: 0.5 }, { firm: "akuna", weight: 0.4 }],
  source: { kind: "free-resource", inspiration: "classic: conditional probability from a contingency table" },
  params: {
    momWin: { choices: [30, 40, 50] },
    momLoss: { choices: [20, 25, 30] },
    mrWin: { choices: [15, 20, 25] },
    mrLoss: { choices: [25, 30, 35] },
  },
  derived: (p) => {
    const totalWin = p.momWin + p.mrWin;
    const pMomGivenWin = p.momWin / totalWin;
    return { totalWin, pMomGivenWin };
  },
  statement: (p) =>
    `A trading desk's log of closed trades breaks down by strategy and outcome: momentum trades produced ${p.momWin} wins and ${p.momLoss} losses; ` +
    `mean-reversion trades produced ${p.mrWin} wins and ${p.mrLoss} losses. A trade is picked at random from the winners. ` +
    `What is the probability it used the momentum strategy?`,
  answerKey: "pMomGivenWin",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $M$ = momentum strategy, $W$ = trade won. The table gives momentum-and-win $=${p.momWin}$, mean-reversion-and-win $=${p.mrWin}$ (the loss cells don't matter here).` },
    { title: "Column total", body: `$P(W)$'s cell count: $${p.momWin}+${p.mrWin}=${fmtNum(d.totalWin)}$ total winning trades.` },
    { title: "Conditional probability", body: `$P(M\\mid W)=${p.momWin}/${fmtNum(d.totalWin)}=${fmtNum(d.pMomGivenWin)}$.` },
    { title: "Sanity check", body: `Momentum contributed more winning trades than mean-reversion ($${p.momWin}>${p.mrWin}$), so $P(M\\mid W)$ must exceed $0.5$ — and $${fmtNum(d.pMomGivenWin)} > 0.5$ holds.` },
  ],
  keyInsight: "Reading a conditional probability off a table means isolating the column you're told happened and comparing counts within just that column.",
  commonTrap: "Dividing by the grand total of all trades instead of just the winning column — that computes P(momentum AND win), not the conditional P(momentum | win).",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [0.5],
};
