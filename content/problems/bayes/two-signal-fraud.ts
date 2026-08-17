import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Sequential Bayesian update with two conditionally independent alert signals
// (spec §6 source kind: textbook classic, new prose + new parameters + our own solution).
export const twoSignalFraud: ProblemTemplate = {
  id: "bayes/two-signal-fraud",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "citadel", weight: 0.6 }, { firm: "jane-street", weight: 0.4 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic: sequential Bayesian update with two conditionally independent signals" },
  params: {
    prior: { choices: [0.01, 0.02, 0.05] },
    sensA: { choices: [0.8, 0.85, 0.9] },
    fprA: { choices: [0.05, 0.1] },
    sensB: { choices: [0.75, 0.85, 0.9] },
    fprB: { choices: [0.05, 0.1] },
  },
  derived: (p) => {
    const legit = 1 - p.prior;
    const numA = p.prior * p.sensA;
    const fpA = legit * p.fprA;
    const denomA = numA + fpA;
    const post1 = numA / denomA;
    const legit1 = 1 - post1;
    const numB = post1 * p.sensB;
    const fpB = legit1 * p.fprB;
    const denomB = numB + fpB;
    const post2 = numB / denomB;
    return { legit, numA, fpA, denomA, post1, legit1, numB, fpB, denomB, post2 };
  },
  statement: (p) =>
    `A trading platform flags transactions using two alert systems. The prior probability that a transaction is fraudulent is ${pc(p.prior)}%. ` +
    `Alert A fires on ${pc(p.sensA)}% of fraudulent transactions and on ${pc(p.fprA)}% of legitimate ones. ` +
    `Alert B fires on ${pc(p.sensB)}% of fraudulent transactions and on ${pc(p.fprB)}% of legitimate ones, independently of Alert A given the transaction's true status. ` +
    `A transaction trips both Alert A and Alert B. What is the probability it is fraudulent?`,
  answerKey: "post2",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $F$ = fraudulent, $A$ = Alert A fires, $B$ = Alert B fires. Given $P(F)=${p.prior}$, $P(A\\mid F)=${p.sensA}$, $P(A\\mid \\bar F)=${p.fprA}$, $P(B\\mid F)=${p.sensB}$, $P(B\\mid \\bar F)=${p.fprB}$, with $A$ and $B$ independent given fraud status.` },
    { title: "Update on Alert A", body: `True-fire mass: $${p.prior}\\times${p.sensA}=${fmtNum(d.numA)}$. False-fire mass: the legitimate share is ${fmtNum(d.legit)}, giving $${fmtNum(d.legit)}\\times${p.fprA}=${fmtNum(d.fpA)}$. So $P(F\\mid A)=${fmtNum(d.numA)}/(${fmtNum(d.numA)}+${fmtNum(d.fpA)})=${fmtNum(d.post1)}$.` },
    { title: "Update on Alert B", body: `Treat $${fmtNum(d.post1)}$ as the new prior. True-fire mass: $${fmtNum(d.post1)}\\times${p.sensB}=${fmtNum(d.numB)}$. False-fire mass: the legitimate share is now ${fmtNum(d.legit1)}, giving $${fmtNum(d.legit1)}\\times${p.fprB}=${fmtNum(d.fpB)}$. So $P(F\\mid A,B)=${fmtNum(d.numB)}/(${fmtNum(d.numB)}+${fmtNum(d.fpB)})=${fmtNum(d.post2)}$.` },
    { title: "Sanity check", body: `Both alerts fire more often on fraud than on legitimate activity, so each update should only raise the posterior: $${p.prior}<${fmtNum(d.post1)}$ and $${fmtNum(d.post1)}<${fmtNum(d.post2)}$ both hold.` },
  ],
  keyInsight: "Independent evidence compounds sequentially: feeding each posterior back in as the next prior gives the same result as combining both signals' likelihoods in one joint update — sequential and one-shot are equivalent, just different bookkeeping.",
  commonTrap: "Averaging the two alerts' fire rates, or computing each posterior from the original prior instead of chaining — the second update must start from the first update's result.",
  expectedPaceS: 95,
  verify: { method: "brute-force" },
  constants: [],
};
