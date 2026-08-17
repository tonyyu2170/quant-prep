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
    `A forensic database holds profiles for ${fmtNum(p.pop)} people who could plausibly have committed a crime; exactly one of them is guilty, and everyone else is innocent. ` +
    `The lab's match test always matches the true culprit's profile, but a randomly chosen innocent person's profile matches by pure chance with probability ${p.q} (a ${pc(p.q)}% random-match rate). ` +
    `A database search turns up exactly one match. Given only that the match occurred, what is the probability the matched person is actually innocent?`,
  answerKey: "postInnocent",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $G$ = matched person is guilty, $M$ = match occurs. Before any evidence, each of the ${fmtNum(p.pop)} people is equally likely to be the culprit, so $P(G)=1/${fmtNum(p.pop)}$ and there are ${fmtNum(d.others)} innocent candidates.` },
    { title: "Expected false matches", body: `Each of the ${fmtNum(d.others)} innocent candidates matches by chance with probability ${p.q}, so the expected count of innocent matches is $${fmtNum(d.others)}\\times${p.q}=${fmtNum(d.falseMatchMass)}$ — this is mass relative to the guilty person's guaranteed one match.` },
    { title: "Combine", body: `Weighting the guilty candidate's certain match ($1$) against the ${fmtNum(d.falseMatchMass)} expected innocent matches, $P(M)\\propto1+${fmtNum(d.falseMatchMass)}=${fmtNum(d.denom)}$ (in guilty-candidate units).` },
    { title: "Posterior", body: `$P(G\\mid M)=1/${fmtNum(d.denom)}=${fmtNum(d.postGuilty)}$, so $P(\\text{innocent}\\mid M)=${fmtNum(d.falseMatchMass)}/${fmtNum(d.denom)}=${fmtNum(d.postInnocent)}$.` },
    { title: "Sanity check", body: `The random-match rate ${p.q} only equals $P(\\text{innocent}\\mid M)$ when there's exactly one other candidate; with ${fmtNum(d.others)} innocent candidates in the pool, the expected-false-match count inflates the innocent posterior well above the raw per-person rate — and $${fmtNum(d.postInnocent)} > ${p.q}$ holds.` },
  ],
  keyInsight: "Population size doesn't just set the prior — it multiplies the per-person random-match rate into an expected count of innocent matches across every other candidate, and that pooled count is what the guilt evidence has to overcome, not the raw per-person rate alone.",
  commonTrap: "Reporting the random-match rate itself as the probability of innocence given a match — that number is P(match | innocent), the reverse conditional, and directly substituting it for P(innocent | match) ignores how many other candidates could have produced a chance match.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1],
};
