import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Prosecutor's fallacy: forensic match evidence against a population of candidates.
// The trap is conflating P(match|innocent) with P(innocent|match).
export const prosecutorsFallacyMatch: ProblemTemplate = {
  id: "bayes/prosecutors-fallacy-match",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.5 }, { firm: "hrt", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: prosecutor's fallacy in forensic match evidence" },
  params: {
    pop: { choices: [1000, 2000, 5000, 10000] },
    q: { choices: [0.0001, 0.0002, 0.0005, 0.001] },
  },
  derived: (p) => {
    const others = p.pop - 1;
    const falseMatchMass = p.q * others;
    const denom = 1 + falseMatchMass;
    const postGuilty = 1 / denom;
    const postInnocent = falseMatchMass / denom;
    return { others, falseMatchMass, denom, postGuilty, postInnocent };
  },
  statement: (p, d) =>
    `A pool of ${fmtNum(p.pop)} people could plausibly have committed a crime; exactly one of them is guilty, and everyone else is innocent. ` +
    `Investigators identify one person from this pool for a reason unrelated to guilt — as likely to land on the true culprit as on any of the others — and compare that person's profile against the crime-scene sample. ` +
    `The lab's match test always matches the true culprit's profile, and matches an innocent person's profile by pure chance with probability ${p.q} (a ${pc(p.q)}% random-match rate). ` +
    `The comparison comes back a match. What is the probability the matched person is actually innocent?`,
  answerKey: "postInnocent",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $G$ = matched person is guilty, $M$ = match occurs. Since the person was picked for a reason unrelated to guilt, each of the ${fmtNum(p.pop)} people is equally likely to be the one selected, so $P(G)=1/${fmtNum(p.pop)}$, leaving ${fmtNum(d.others)} equally likely innocent candidates.` },
    { title: "Branch likelihoods", body: `If the selected person is guilty, the test matches with certainty: $P(M\\mid G)=1$. If innocent, it matches only by chance: $P(M\\mid \\bar G)=${p.q}$.` },
    { title: "Combine", body: `Both branches share the common factor $1/${fmtNum(p.pop)}$, so in relative units $P(G,M)\\propto1$ and $P(\\bar G,M)\\propto${fmtNum(d.others)}\\times${p.q}=${fmtNum(d.falseMatchMass)}$ — giving $P(M)\\propto1+${fmtNum(d.falseMatchMass)}=${fmtNum(d.denom)}$.` },
    { title: "Posterior", body: `$P(G\\mid M)=1/(1+${fmtNum(d.falseMatchMass)})=${fmtNum(d.postGuilty)}$, so $P(\\text{innocent}\\mid M)=${fmtNum(d.falseMatchMass)}/(1+${fmtNum(d.falseMatchMass)})=${fmtNum(d.postInnocent)}$.` },
    { title: "Sanity check", body: `The innocent branch's weight grows with pool size — each additional innocent candidate who could have been the one selected adds another ${p.q}-weighted chance of a false match — so with ${fmtNum(d.others)} such candidates the posterior must clear the raw per-person rate ${p.q} by a wide margin, and $${fmtNum(d.postInnocent)} > ${p.q}$ holds.` },
  ],
  keyInsight: "Population size doesn't just set the prior — every other candidate who could equally have been the one selected adds their own chance of producing the same match, and that pooled weight across the whole innocent pool is what the guilt evidence has to overcome, not the raw per-person rate alone.",
  commonTrap: "Reporting the random-match rate itself as the probability of innocence given a match — that number is P(match | innocent), the reverse conditional, and directly substituting it for P(innocent | match) ignores how many other candidates could have produced a chance match.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1],
};
