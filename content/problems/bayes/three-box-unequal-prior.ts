import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Monty-Hall-adjacent with an unequal, explicitly given prior over box contents. The host's
// procedure is stated unambiguously: never opens the contestant's box or the prize box, and
// ties (both other boxes empty) are broken with a fair coin flip.
export const threeBoxUnequalPrior: ProblemTemplate = {
  id: "bayes/three-box-unequal-prior",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.5 }, { firm: "citadel-securities", weight: 0.4 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic: Monty Hall problem generalized to unequal prior box probabilities" },
  params: {
    p1: { choices: [0.15, 0.2, 0.25, 0.3, 0.35, 0.4] },
    p2: { choices: [0.15, 0.2, 0.25, 0.3, 0.35, 0.4] },
  },
  // Keeps Box 3's prior strictly above half of Box 1's, so the sanity check's
  // direction (postBox3 > 0.5) is guaranteed for every draw.
  constraint: (p) => 1 - p.p1 - p.p2 > 0.5 * p.p1,
  derived: (p) => {
    const p3 = 1 - p.p1 - p.p2;
    const halfP1 = 0.5 * p.p1;
    const denom = halfP1 + p3;
    const postBox3 = p3 / denom;
    return { p3, halfP1, denom, postBox3 };
  },
  statement: (p) =>
    `A game show hides a prize behind one of three boxes: Box 1, Box 2, and Box 3. Based on historical placement data, the prize is in Box 1 with probability ${p.p1}, in Box 2 with probability ${p.p2}, ` +
    `and in Box 3 with the remaining probability. A contestant picks Box 1. The host, who always knows exactly which box holds the prize, then opens one of the OTHER two boxes to reveal it is empty: ` +
    `if both other boxes are empty, the host picks between them with a fair coin flip; if only one of them is empty, the host opens that one (never the contestant's box, never the prize box). ` +
    `The host opens Box 2, revealing it is empty. What is the probability the prize is in Box 3?`,
  answerKey: "postBox3",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $B_1,B_2,B_3$ = prize location, $O_2$ = host opens Box 2. Given $P(B_1)=${p.p1}$, $P(B_2)=${p.p2}$, $P(B_3)=1-${p.p1}-${p.p2}=${fmtNum(d.p3)}$.` },
    { title: "When would the host open Box 2?", body: `If the prize is in Box 1, both Box 2 and Box 3 are empty, so the host opens Box 2 with probability $0.5$: $P(O_2\\mid B_1)=0.5$. If the prize is in Box 2, the host can never open it: $P(O_2\\mid B_2)=0$. If the prize is in Box 3, Box 2 is the only empty non-chosen box, so the host is forced to open it: $P(O_2\\mid B_3)=1$.` },
    { title: "Combine", body: `$P(B_1,O_2)=${p.p1}\\times0.5=${fmtNum(d.halfP1)}$, $P(B_2,O_2)=${p.p2}\\times0=0$, $P(B_3,O_2)=${fmtNum(d.p3)}\\times1=${fmtNum(d.p3)}$. So $P(O_2)=${fmtNum(d.halfP1)}+0+${fmtNum(d.p3)}=${fmtNum(d.denom)}$.` },
    { title: "Posterior", body: `$P(B_3\\mid O_2)=${fmtNum(d.p3)}/${fmtNum(d.denom)}=${fmtNum(d.postBox3)}$.` },
    { title: "Sanity check", body: `The host was FORCED to open Box 2 when the prize is in Box 3, but only had a coin-flip chance of opening it when the prize is in Box 1. Box 3's prior is guaranteed to exceed half of Box 1's prior ($${fmtNum(d.p3)} > ${fmtNum(d.halfP1)}$), so the forced-reveal branch always outweighs the coin-flip branch — and $${fmtNum(d.postBox3)} > 0.5$ holds.` },
  ],
  keyInsight: "The host's revealed choice carries information only through how likely that specific choice was under each hypothesis — a box the host was forced to skip past is much stronger evidence for the box left unopened than a box the host merely happened to pick in a coin-flip tie.",
  commonTrap: "Answering with the classic uniform-prior switching probability of two-thirds by pattern-matching to the textbook Monty Hall setup — that ratio only holds when all three boxes start out equally likely, and here the priors are given explicitly and unequal.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [0, 0.5, 1, 2, 3],
};
