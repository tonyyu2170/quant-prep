import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The house-edge opener, and the batch's first negative answer. `winFaces` and
// `loseFaces` exist so the prose can name the numerators of the two probabilities;
// `fairWin` exists so the Sanity check can price the bet independently of `ev`.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const twoOutcomeBet: ProblemTemplate = {
  id: "ev-variance/two-outcome-bet",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.4 }, { firm: "sig", weight: 0.35 }],
  source: { kind: "original", inspiration: "single-roll house-edge bet whose payout looks generous and whose expectation is not" },
  params: {
    k: { range: { min: 3, max: 6, step: 1 } }, // win on a roll of k or higher
    w: { range: { min: 2, max: 12, step: 1 } },
    l: { range: { min: 2, max: 12, step: 1 } },
  },
  // Strictly a losing bet, bounded well away from zero: a fair game would make the
  // answer 0, which grades as strict float equality and fails the abs-tolerance gate.
  // k starts at 3 because k = 2 wins five faces in six and is almost never a loss.
  constraint: (p) => ((7 - p.k) * p.w - (p.k - 1) * p.l) / 6 <= -0.05,
  derived: (p) => {
    const winFaces = 7 - p.k;
    const loseFaces = p.k - 1;
    const pWin = winFaces / 6;
    const pLose = loseFaces / 6;
    const winLeg = pWin * p.w;
    const loseLeg = pLose * p.l;
    return { winFaces, loseFaces, pWin, pLose, winLeg, loseLeg, fairWin: loseLeg / pWin, ev: winLeg - loseLeg };
  },
  statement: (p) =>
    `A fair six-sided die is rolled once. If it shows ${fmtNum(p.k)} or higher you win ${fmtNum(p.w)} dollars; ` +
    `otherwise you lose ${fmtNum(p.l)} dollars. What is your expected profit, in dollars, on one roll?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Expected profit weights each outcome by its probability. Faces ${fmtNum(p.k)} and above win, which is ${fmtNum(d.winFaces)} of the 6 faces, so the win probability is $${fmtNum(d.winFaces)}/6=${fmtNum(d.pWin)}$ and the lose probability is $${fmtNum(d.loseFaces)}/6=${fmtNum(d.pLose)}$.` },
    { title: "Weight each branch", body: `The winning branch contributes $${fmtNum(d.pWin)}\\times${fmtNum(p.w)}=${fmtNum(d.winLeg)}$ dollars, and the losing branch takes away $${fmtNum(d.pLose)}\\times${fmtNum(p.l)}=${fmtNum(d.loseLeg)}$ dollars.` },
    { title: "Combine", body: `Expected profit is the winning contribution minus the losing one: $${fmtNum(d.winLeg)}-${fmtNum(d.loseLeg)}=${fmtNum(d.ev)}$ dollars per roll.` },
    { title: "Sanity check", body: `Price the bet the other way round. The payout that would make it fair has to cover the losing branch exactly: $${fmtNum(d.loseLeg)}/${fmtNum(d.pWin)}=${fmtNum(d.fairWin)}$ dollars. The game offers only ${fmtNum(p.w)}, short of that, so the expected profit must come out negative — and it does.` },
  ],
  keyInsight: "An expectation multiplies every outcome by how often it arrives, so the size of a payout means nothing on its own: a generous win on a rare branch loses to a modest loss on a common one.",
  commonTrap: "Comparing the win amount against the loss amount and judging the bet by which is larger, which silently assumes the two branches are equally likely.",
  expectedPaceS: 35,
  verify: { method: "brute-force" },
  constants: [6],
};
