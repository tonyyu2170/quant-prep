import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Drawing without replacement: P(first was X | second is Y).
export const raffleWithoutReplacement: ProblemTemplate = {
  id: "bayes/raffle-without-replacement",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "sig", weight: 0.5 }, { firm: "flow", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: sequential draws without replacement" },
  params: {
    W: { choices: [3, 4, 5, 6] },
    L: { choices: [7, 8, 9, 10] },
  },
  derived: (p) => {
    const total = p.W + p.L;
    const remaining = total - 1;
    const pFirstWin = p.W / total;
    const pFirstLoss = p.L / total;
    const remainingLosersAfterWin = p.L;
    const remainingLosersAfterLoss = p.L - 1;
    const pSecondLossGivenFirstWin = remainingLosersAfterWin / remaining;
    const pSecondLossGivenFirstLoss = remainingLosersAfterLoss / remaining;
    const jointWinThenLoss = pFirstWin * pSecondLossGivenFirstWin;
    const jointLossThenLoss = pFirstLoss * pSecondLossGivenFirstLoss;
    const pSecondLoss = jointWinThenLoss + jointLossThenLoss;
    const postFirstWin = jointWinThenLoss / pSecondLoss;
    return {
      total, remaining, pFirstWin, pFirstLoss, remainingLosersAfterWin, remainingLosersAfterLoss,
      pSecondLossGivenFirstWin, pSecondLossGivenFirstLoss, jointWinThenLoss, jointLossThenLoss,
      pSecondLoss, postFirstWin,
    };
  },
  statement: (p) =>
    `A raffle box holds ${p.W} winning tickets and ${p.L} losing tickets. Two tickets are drawn one after another, without putting the first back. ` +
    `The second ticket drawn is a loser. What is the probability the first ticket drawn was a winner?`,
  answerKey: "postFirstWin",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $F$ = first ticket wins, $S$ = second ticket loses. There are ${p.W}+${p.L}=${fmtNum(d.total)} tickets total, ${fmtNum(d.remaining)} remaining after the first draw.` },
    { title: "First-draw branches", body: `$P(F)=${p.W}/${fmtNum(d.total)}=${fmtNum(d.pFirstWin)}$ and $P(\\bar F)=${p.L}/${fmtNum(d.total)}=${fmtNum(d.pFirstLoss)}$.` },
    { title: "Second-draw conditionals", body: `If $F$ happened, all ${fmtNum(d.remainingLosersAfterWin)} losers remain: $P(S\\mid F)=${fmtNum(d.remainingLosersAfterWin)}/${fmtNum(d.remaining)}=${fmtNum(d.pSecondLossGivenFirstWin)}$. If $\\bar F$ happened, only ${fmtNum(d.remainingLosersAfterLoss)} losers remain: $P(S\\mid \\bar F)=${fmtNum(d.remainingLosersAfterLoss)}/${fmtNum(d.remaining)}=${fmtNum(d.pSecondLossGivenFirstLoss)}$.` },
    { title: "Total probability and Bayes", body: `$P(S)=${fmtNum(d.pFirstWin)}\\times${fmtNum(d.pSecondLossGivenFirstWin)}+${fmtNum(d.pFirstLoss)}\\times${fmtNum(d.pSecondLossGivenFirstLoss)}=${fmtNum(d.pSecondLoss)}$. So $P(F\\mid S)=${fmtNum(d.jointWinThenLoss)}/${fmtNum(d.pSecondLoss)}=${fmtNum(d.postFirstWin)}$.` },
    { title: "Sanity check", body: `The second draw is more likely to be a loser when the first was a winner (all $${fmtNum(d.remainingLosersAfterWin)}$ losers still in the pool) than when the first was itself a loser (only $${fmtNum(d.remainingLosersAfterLoss)}$ remain) — so seeing a loser second must push $P(F\\mid S)$ above the raw prior $P(F)=${fmtNum(d.pFirstWin)}$, and $${fmtNum(d.postFirstWin)} > ${fmtNum(d.pFirstWin)}$ holds.` },
  ],
  keyInsight: "Without replacement, the second draw's conditional probabilities depend on what the first draw removed — track both branches before combining.",
  commonTrap: "Treating the two draws as independent (as if with replacement) and just using L/total for the conditional — ignoring that one ticket is already gone changes the remaining pool.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [],
};
