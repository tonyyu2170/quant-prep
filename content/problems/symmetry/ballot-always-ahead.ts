import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Bertrand's ballot problem. The reflection argument pairs every bad path with a path that
// starts the other way, and the survivors are exactly the (a-b)/(a+b) share.
export const ballotAlwaysAhead: ProblemTemplate = {
  id: "symmetry/ballot-always-ahead",
  version: 1,
  topic: "probability/symmetry",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.3 }, { firm: "two-sigma", weight: 0.3 }, { firm: "de-shaw", weight: 0.25 }],
  source: { kind: "textbook", inspiration: "Bertrand's ballot problem via reflection" },
  params: {
    votesA: { range: { min: 12, max: 44, step: 1 } },
    votesB: { range: { min: 5, max: 38, step: 1 } },
  },
  constraint: (p) => p.votesA > p.votesB,
  derived: (p) => {
    const total = p.votesA + p.votesB;
    const margin = p.votesA - p.votesB;
    return { total, margin, answer: margin / total, tieAtSomePoint: 1 - margin / total, finalShare: p.votesA / total };
  },
  statement: (p) =>
    `Two candidates finish a count with ${fmtNum(p.votesA)} votes for Alba and ${fmtNum(p.votesB)} for Bruna. The ballots are counted one at a time in a uniformly random order. What is the probability that Alba is strictly ahead of Bruna at every single point of the count?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "What can go wrong", body: `Alba leads the whole way unless the running totals meet. Any count that is not always-ahead must touch a tie at some point, since the lead changes by one vote at a time and cannot jump over equality.` },
    { title: "Reflect at the first tie", body: `Take any count that hits a tie and flip every ballot before that first tie. This pairs up counts that begin with an Alba vote and counts that begin with a Bruna vote — a perfect matching between the two kinds of failure.` },
    { title: "Count what survives", body: `Every count starting with Bruna fails, and the matching says exactly as many Alba-starting counts fail too. So the failures are twice the ${fmtNum(p.votesB)} Bruna-starting share, and what survives is the margin over the total.` },
    { title: "Read it off", body: `The probability is $\\frac{${p.votesA}-${p.votesB}}{${p.votesA}+${p.votesB}}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `The complement — a tie occurring at some stage — is $\\frac{2\\times${p.votesB}}{${d.total}}=${fmtNum(d.tieAtSomePoint)}$, and the two add to 1. A narrower win makes an early tie more likely, which is the right direction.` },
  ],
  keyInsight: "Reflection turns a path-counting problem into a bijection: pair each bad path with one that starts the other way, and the survivors are read off directly.",
  commonTrap: "Answering with Alba's final vote share. That is the chance she leads at the END, which is certain here — the question asks about every prefix of the count.",
  expectedPaceS: 170,
  constants: [1, 2],
  verify: { method: "brute-force" },
};
