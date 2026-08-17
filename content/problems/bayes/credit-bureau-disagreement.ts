import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Conflicting signals: two independent tests DISAGREE (A positive, B negative) — the posterior
// combines a hit with a miss, not two hits. Ranges are chosen so Bureau A's flag always
// dominates Bureau B's clearance, keeping the update direction constraint-guaranteed.
export const creditBureauDisagreement: ProblemTemplate = {
  id: "bayes/credit-bureau-disagreement",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "citadel-securities", weight: 0.5 }, { firm: "sig", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: Bayesian update with two conditionally independent signals that disagree" },
  params: {
    prior: { choices: [0.05, 0.1, 0.15, 0.2] },
    sensA: { choices: [0.85, 0.9, 0.95] },
    fprA: { choices: [0.05, 0.08, 0.1] },
    sensB: { choices: [0.7, 0.75, 0.8] },
    fprB: { choices: [0.05, 0.08, 0.1] },
  },
  // Bureau A's flag-given-risky always beats Bureau B's miss-given-safe: min(sensA)*min(1-sensB)
  // = 0.85*0.2 = 0.17 exceeds max(fprA)*max(1-fprB) = 0.1*0.95 = 0.095 for every draw, so the
  // combined likelihood ratio for (A fires, B doesn't) stays above 1 no matter which choices land.
  constraint: (p) => (p.sensA * (1 - p.sensB)) / (p.fprA * (1 - p.fprB)) > 1,
  derived: (p) => {
    const safe = 1 - p.prior;
    const missB = 1 - p.sensB;
    const specB = 1 - p.fprB;
    const riskyLikelihood = p.sensA * missB;
    const safeLikelihood = p.fprA * specB;
    const riskyMass = p.prior * riskyLikelihood;
    const safeMass = safe * safeLikelihood;
    const denom = riskyMass + safeMass;
    const posterior = riskyMass / denom;
    return { safe, missB, specB, riskyLikelihood, safeLikelihood, riskyMass, safeMass, denom, posterior };
  },
  statement: (p) =>
    `A lender checks an applicant's risk through two independent credit bureaus. Applicants are risky-to-default with prior probability ${pc(p.prior)}%. ` +
    `Bureau A flags ${pc(p.sensA)}% of risky applicants and ${pc(p.fprA)}% of safe applicants. Bureau B flags ${pc(p.sensB)}% of risky applicants and ${pc(p.fprB)}% of safe applicants, independently of Bureau A given the applicant's true risk. ` +
    `For this applicant, Bureau A flags them as risky but Bureau B does NOT flag them. What is the probability this applicant is actually risky?`,
  answerKey: "posterior",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $R$ = risky, $A$ = Bureau A flags, $B$ = Bureau B flags. Given $P(R)=${p.prior}$, $P(A\\mid R)=${p.sensA}$, $P(A\\mid \\bar R)=${p.fprA}$, $P(B\\mid R)=${p.sensB}$, $P(B\\mid \\bar R)=${p.fprB}$, with $A,B$ independent given the true risk.` },
    { title: "Likelihood of the disagreement", body: `Bureau B not firing means $P(\\bar B\\mid R)=1-${p.sensB}=${fmtNum(d.missB)}$ and $P(\\bar B\\mid \\bar R)=1-${p.fprB}=${fmtNum(d.specB)}$. So the risky branch's combined likelihood is $${p.sensA}\\times${fmtNum(d.missB)}=${fmtNum(d.riskyLikelihood)}$ and the safe branch's is $${p.fprA}\\times${fmtNum(d.specB)}=${fmtNum(d.safeLikelihood)}$.` },
    { title: "Combine", body: `Risky mass: $${p.prior}\\times${fmtNum(d.riskyLikelihood)}=${fmtNum(d.riskyMass)}$. Safe mass: $${fmtNum(d.safe)}\\times${fmtNum(d.safeLikelihood)}=${fmtNum(d.safeMass)}$. So $P(A,\\bar B)=${fmtNum(d.riskyMass)}+${fmtNum(d.safeMass)}=${fmtNum(d.denom)}$.` },
    { title: "Posterior", body: `$P(R\\mid A,\\bar B)=${fmtNum(d.riskyMass)}/${fmtNum(d.denom)}=${fmtNum(d.posterior)}$.` },
    { title: "Sanity check", body: `Bureau A's flag is more diagnostic than Bureau B's clearance is exculpatory here ($${fmtNum(d.riskyLikelihood)} > ${fmtNum(d.safeLikelihood)}$), so the disagreement should still pull the posterior above the ${p.prior} prior rather than cancel it out — and $${fmtNum(d.posterior)} > ${p.prior}$ holds.` },
  ],
  keyInsight: "Conflicting evidence doesn't cancel to the prior — each piece contributes its own likelihood ratio (a hit for A, a miss for B), and the two multiply together just as two matching signals would, only with one factor working against the hypothesis instead of for it.",
  commonTrap: "Assuming the two disagreeing bureaus cancel each other out and reporting the unadjusted prior as the answer — a hit and a miss still combine multiplicatively into a net likelihood ratio, and that ratio is rarely exactly one.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [1],
};
