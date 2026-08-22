import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The aces cut the remaining cards into a+1 gaps, and by symmetry every gap has the same
// expected size. So the first ace sits at (n+1)/(a+1) — no summation required.
export const firstAcePosition: ProblemTemplate = {
  id: "symmetry/first-ace-position",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "sig", weight: 0.3 }, { firm: "citadel-securities", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "expected position of the first ace, by gap symmetry" },
  params: {
    cards: { range: { min: 28, max: 64, step: 1 } },
    aces: { range: { min: 2, max: 10, step: 1 } },
  },
  derived: (p) => {
    const gaps = p.aces + 1;
    const others = p.cards - p.aces;
    return { gaps, others, answer: (p.cards + 1) / gaps, gapSize: (p.cards - p.aces) / gaps, lastAce: (p.aces * (p.cards + 1)) / gaps };
  },
  statement: (p) =>
    `A deck of ${fmtNum(p.cards)} cards contains ${fmtNum(p.aces)} aces and is shuffled uniformly at random. You turn cards over one at a time. What is the expected position of the first ace?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Look at the gaps, not the aces", body: `The ${fmtNum(p.aces)} aces split the other ${fmtNum(d.others)} cards into ${fmtNum(d.gaps)} gaps: the cards before the first ace, between consecutive aces, and after the last.` },
    { title: "Symmetry across the gaps", body: `No gap is special — relabelling the aces permutes the gaps without changing the distribution. So all ${fmtNum(d.gaps)} gaps have the same expected size, and together they hold every non-ace card.` },
    { title: "Size one gap", body: `That makes each gap $\\frac{${d.others}}{${d.gaps}}=${fmtNum(d.gapSize)}$ cards on average. The first ace sits one place past the first gap.` },
    { title: "Add the ace", body: `So the expected position is $\\frac{${p.cards}+1}{${d.gaps}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The same argument puts the LAST ace at $\\frac{${p.aces}\\times(${p.cards}+1)}{${d.gaps}}=${fmtNum(d.lastAce)}$, which is as far from the end of the deck as the first ace is from the start.` },
  ],
  keyInsight: "Turn a question about one item into a question about the gaps it creates — symmetry makes every gap identical in expectation, and summing them is one division.",
  commonTrap: "Summing the probability that the first ace lands at each position. It gives the same number after heavy algebra; the gap argument gets there in one line.",
  expectedPaceS: 150,
  constants: [1],
  verify: { method: "brute-force" },
};
