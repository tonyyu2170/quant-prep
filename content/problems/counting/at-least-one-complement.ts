import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// "At least one" by complement. The Sanity check computes the union bound —
// the naive sum of the per-roll chances — which must strictly exceed the answer,
// and which is exactly the number a careless solver would report.
export const atLeastOneComplement: ProblemTemplate = {
  id: "counting/at-least-one-complement",
  version: 1,
  topic: "probability/counting",
  difficulty: 1,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "hrt", weight: 0.35 }],
  source: { kind: "textbook", inspiration: "classic complement drill: chance of at least one success in a run of independent trials" },
  params: {
    faces: { choices: [4, 6, 8, 10, 12] },
    rolls: { range: { min: 2, max: 6, step: 1 } },
  },
  // Fewer rolls than faces keeps the union bound below certainty so it reads as a
  // real probability; the size cap keeps the Python enumeration of every roll
  // sequence under a hundred thousand outcomes.
  constraint: (p) => p.rolls < p.faces && Math.pow(p.faces, p.rolls) < 1e5,
  derived: (p) => {
    const missProb = (p.faces - 1) / p.faces;
    const allMiss = Math.pow(missProb, p.rolls);
    return {
      missFaces: p.faces - 1,
      missProb,
      allMiss,
      prob: 1 - allMiss,
      hitProb: 1 / p.faces,
      unionBound: p.rolls / p.faces,
      outcomes: Math.pow(p.faces, p.rolls),
    };
  },
  statement: (p) =>
    `A board game uses a fair ${fmtNum(p.faces)}-sided die with faces numbered 1 through ${fmtNum(p.faces)}. On her turn a player rolls it ${fmtNum(p.rolls)} times, and the rolls do not influence one another. ` +
    `What is the probability that at least one of those ${fmtNum(p.rolls)} rolls shows the top face, ${fmtNum(p.faces)}?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `The turn produces one of $${fmtNum(p.faces)}^{${fmtNum(p.rolls)}}=${fmtNum(d.outcomes)}$ equally likely sequences. "At least one top face" lumps together the turns that show a single top face and the turns that show several — a pile of cases to chase separately. Its opposite, "no roll shows the top face", is a single case, so chase that instead.` },
    { title: "One roll missing", body: `A single roll avoids the top face when it lands on any of the other ${fmtNum(d.missFaces)} faces, which happens with probability $${fmtNum(d.missFaces)}/${fmtNum(p.faces)}=${fmtNum(d.missProb)}$.` },
    { title: "Every roll missing", body: `The rolls are independent, so the chance that every one of the ${fmtNum(p.rolls)} rolls misses is that number multiplied by itself once per roll: $${fmtNum(d.missProb)}^{${fmtNum(p.rolls)}}=${fmtNum(d.allMiss)}$. Everything else is the event we want, so the answer is $1-${fmtNum(d.allMiss)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Bound it from above a different way. Any turn with at least one top face has a first roll that shows it, and each individual roll shows the top face with probability $1/${fmtNum(p.faces)}=${fmtNum(d.hitProb)}$, so simply adding across the ${fmtNum(p.rolls)} rolls gives ${fmtNum(d.unionBound)}. That sum counts a turn with several top faces more than once, so it can only overshoot: the answer has to sit strictly below it, and $${fmtNum(d.prob)} < ${fmtNum(d.unionBound)}$.` },
  ],
  keyInsight: "At least one is the complement of none, and none is a single intersection of independent events — so a sprawling union of cases collapses into one product subtracted from certainty.",
  commonTrap: "Adding the per-trial chances together, which counts every outcome with more than one success once per success and, with enough trials, would push the reported probability past certainty altogether.",
  expectedPaceS: 40,
  verify: { method: "brute-force" },
  constants: [1],
};
