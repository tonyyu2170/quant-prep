import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Forward (non-Bayes-reversal) without-replacement conditional: P(second is X | first was X).
// Simpler than raffle-without-replacement's reverse-inference structure — appropriate for L1.
export const cardDrawWithoutReplacement: ProblemTemplate = {
  id: "bayes/card-draw-without-replacement",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.5 }, { firm: "flow", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: card draws without replacement, forward conditional" },
  params: {
    aces: { choices: [3, 4, 5, 6] },
    others: { choices: [8, 9, 10, 11, 12] },
  },
  derived: (p) => {
    const total = p.aces + p.others;
    const remaining = total - 1;
    const remainingAces = p.aces - 1;
    const pSecondAce = remainingAces / remaining;
    return { total, remaining, remainingAces, pSecondAce };
  },
  statement: (p) =>
    `A shuffled stack of cards contains ${p.aces} aces and ${p.others} other cards, all face down. Two cards are dealt one after another, without putting either back. ` +
    `The first card dealt is an ace. What is the probability the second card dealt is also an ace?`,
  answerKey: "pSecondAce",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The stack starts with ${p.aces}+${p.others}=${fmtNum(d.total)} cards. Once the first ace is dealt and set aside, ${fmtNum(d.remaining)} cards remain.` },
    { title: "Remaining aces", body: `The first ace is gone, so only ${fmtNum(d.remainingAces)} aces remain among the ${fmtNum(d.remaining)} cards left in the stack.` },
    { title: "Conditional probability", body: `$P(\\text{second ace}\\mid\\text{first ace})=${fmtNum(d.remainingAces)}/${fmtNum(d.remaining)}=${fmtNum(d.pSecondAce)}$.` },
    { title: "Sanity check", body: `Removing one ace from the stack always leaves a strictly smaller ace-share than the original, since ${p.others} non-ace cards are untouched while both the ace count and the total drop by one — so $P(\\text{second ace}\\mid\\text{first ace})=${fmtNum(d.pSecondAce)}$ must be less than the original share $${p.aces}/${fmtNum(d.total)}$, and it is.` },
  ],
  keyInsight: "A finite stack remembers what's already been dealt — after one target card leaves, both the numerator and the denominator shrink by exactly one card, so the next draw's fraction is never the same as the first draw's fraction unless the stack is effectively infinite.",
  commonTrap: "Forgetting to remove the already-dealt ace from both the ace count and the total before computing the second-draw fraction — using the original aces/total instead of (aces-1)/(total-1).",
  expectedPaceS: 50,
  verify: { method: "brute-force" },
  constants: [1],
};
