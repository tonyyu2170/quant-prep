import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Coin identification: fair vs biased coin, posterior after k heads in a row (k a param) — L3.
export const coinIdentificationStreak: ProblemTemplate = {
  id: "bayes/coin-identification-streak",
  version: 1,
  topic: "probability/bayes",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.6 }, { firm: "sig", weight: 0.5 }, { firm: "optiver", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: identifying a biased coin from a run of heads" },
  params: {
    pBiased: { choices: [0.6, 0.65, 0.7, 0.75] },
    k: { choices: [2, 3, 4, 5] },
  },
  derived: (p) => {
    const pFairK = Math.pow(0.5, p.k);
    const pBiasedK = Math.pow(p.pBiased, p.k);
    const numBiased = 0.5 * pBiasedK;
    const numFair = 0.5 * pFairK;
    const denom = numBiased + numFair;
    const postBiased = numBiased / denom;
    return { pFairK, pBiasedK, numBiased, numFair, denom, postBiased };
  },
  statement: (p) =>
    `A hat contains a fair coin and a biased coin that lands heads with probability ${p.pBiased}. ` +
    `You draw one coin at random and flip it ${p.k} times, getting heads every time. What is the probability you drew the biased coin?`,
  answerKey: "postBiased",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $B$ = biased coin drawn, $F$ = fair coin drawn, each with prior $0.5$ from the hat. Let $H_${p.k}$ = ${p.k} heads in a row.` },
    { title: "Likelihood under each hypothesis", body: `Flips are independent given the coin, so $P(H_${p.k}\\mid B)=${p.pBiased}^{${p.k}}=${fmtNum(d.pBiasedK)}$ and $P(H_${p.k}\\mid F)=0.5^{${p.k}}=${fmtNum(d.pFairK)}$.` },
    { title: "Joint masses", body: `$0.5\\times${fmtNum(d.pBiasedK)}=${fmtNum(d.numBiased)}$ for the biased branch, $0.5\\times${fmtNum(d.pFairK)}=${fmtNum(d.numFair)}$ for the fair branch.` },
    { title: "Normalize", body: `$P(H_${p.k})=${fmtNum(d.numBiased)}+${fmtNum(d.numFair)}=${fmtNum(d.denom)}$, so $P(B\\mid H_${p.k})=${fmtNum(d.numBiased)}/${fmtNum(d.denom)}=${fmtNum(d.postBiased)}$.` },
    { title: "Sanity check", body: `The biased coin favors heads more than a fair coin at every flip, so its streak likelihood exceeds the fair coin's at any streak length, pushing the posterior above the $0.5$ prior — and $${fmtNum(d.postBiased)} > 0.5$ holds.` },
  ],
  keyInsight: "A run of k identical outcomes is strong evidence precisely because the likelihood ratio compounds multiplicatively with each additional flip — longer streaks make the biased hypothesis dominate much faster than the streak length alone suggests.",
  commonTrap: "Treating a streak of heads as several independent pieces of weak evidence to be added — the per-flip likelihoods multiply, they don't add, so confidence grows far faster than linearly in the streak length.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [0.5],
};
