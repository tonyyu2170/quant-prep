import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// Drawing without replacement: P(first was X | second is Y).
// The constraint cannot see `derived` (packages/engine/src/problem.ts:24), so the chain is
// hoisted here and both fields read this one function.
const derive = (p: Params) => {
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
};

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
  constraint: (p) => !complementGrades(derive(p).postFirstWin),
  derived: derive,
  statement: (p) =>
    `A raffle box holds ${p.W} winning tickets and ${p.L} losing tickets. Two tickets are drawn one after another, without putting the first back. ` +
    `The second ticket drawn is a loser. What is the probability the first ticket drawn was a winner?`,
  answerKey: "postFirstWin",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $F$ = first ticket wins, $S$ = second ticket loses. There are ${p.W}+${p.L}=${fmtNum(d.total)} tickets total, ${fmtNum(d.remaining)} remaining after the first draw.` },
    { title: "First-draw branches", body: `$P(F)=${p.W}/${fmtNum(d.total)}=${fmtNum(d.pFirstWin)}$ and $P(\\bar F)=${p.L}/${fmtNum(d.total)}=${fmtNum(d.pFirstLoss)}$.` },
    { title: "Second-draw conditionals", body: `If $F$ happened, all ${fmtNum(d.remainingLosersAfterWin)} losers remain: $P(S\\mid F)=${fmtNum(d.remainingLosersAfterWin)}/${fmtNum(d.remaining)}=${fmtNum(d.pSecondLossGivenFirstWin)}$. If $\\bar F$ happened, only ${fmtNum(d.remainingLosersAfterLoss)} losers remain: $P(S\\mid \\bar F)=${fmtNum(d.remainingLosersAfterLoss)}/${fmtNum(d.remaining)}=${fmtNum(d.pSecondLossGivenFirstLoss)}$.` },
    { title: "Joint branches and total", body: `$P(F,S)=\\frac{${p.W}}{${fmtNum(d.total)}}\\times\\frac{${fmtNum(d.remainingLosersAfterWin)}}{${fmtNum(d.remaining)}}=${fmtNum(d.jointWinThenLoss)}$ and $P(\\bar F,S)=\\frac{${p.L}}{${fmtNum(d.total)}}\\times\\frac{${fmtNum(d.remainingLosersAfterLoss)}}{${fmtNum(d.remaining)}}=${fmtNum(d.jointLossThenLoss)}$. Both branches sit over the same $${fmtNum(d.total)}\\times${fmtNum(d.remaining)}$ orderings, so $P(S)=\\dfrac{${p.W}\\times${fmtNum(d.remainingLosersAfterWin)}+${p.L}\\times${fmtNum(d.remainingLosersAfterLoss)}}{${fmtNum(d.total)}\\times${fmtNum(d.remaining)}}=${fmtNum(d.pSecondLoss)}$.` },
    { title: "Bayes", body: `That common denominator cancels again, leaving the two ordering counts against each other: $P(F\\mid S)=\\dfrac{${p.W}\\times${fmtNum(d.remainingLosersAfterWin)}}{${p.W}\\times${fmtNum(d.remainingLosersAfterWin)}+${p.L}\\times${fmtNum(d.remainingLosersAfterLoss)}}=${fmtNum(d.postFirstWin)}$.` },
    { title: "Sanity check", body: `By exchangeability, the second draw is unconditionally uniform over all ${fmtNum(d.total)} tickets, so $P(S)=${fmtNum(d.pSecondLoss)}$ exactly matches the raw loser share $${p.L}/${fmtNum(d.total)}$ — the same symmetry is why the answer collapses to $W/(T-1)=${p.W}/${fmtNum(d.remaining)}=${fmtNum(d.postFirstWin)}$.` },
  ],
  keyInsight: "Without replacement, the second draw's conditional probabilities depend on what the first draw removed — track both branches before combining. By exchangeability the second draw is unconditionally symmetric with the first, which is exactly why the marginal P(second is a loser) matches the raw prior even though the branch-level probabilities differ.",
  commonTrap: "Treating the two draws as independent (as if with replacement) and just using L/total for the conditional — ignoring that one ticket is already gone changes the remaining pool.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1],
};
