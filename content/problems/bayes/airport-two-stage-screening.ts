import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Rare-event two-stage independent screening chain. Prior is deliberately tiny (0.001-0.005)
// to make the rare-event lesson concrete; parameter ranges keep every derived value well
// clear of the fmtNum decimal-safe floor (1e-6). Solved via the one-shot joint method:
// multiply each hypothesis's full chain of stage likelihoods against its own prior and
// normalize once, rather than chaining stage-by-stage as two-signal-fraud does — the two
// are mathematically equivalent, this just never carries an intermediate posterior forward.
export const airportTwoStageScreening: ProblemTemplate = {
  id: "bayes/airport-two-stage-screening",
  version: 1,
  topic: "probability/bayes",
  difficulty: 2,
  firms: [{ firm: "citadel-securities", weight: 0.5 }, { firm: "optiver", weight: 0.4 }, { firm: "sig", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic: rare-event two-stage independent diagnostic screening" },
  params: {
    prior: { choices: [0.001, 0.002, 0.005] },
    sens1: { choices: [0.9, 0.95] },
    fpr1: { choices: [0.02, 0.05] },
    sens2: { choices: [0.85, 0.9, 0.95] },
    fpr2: { choices: [0.02, 0.05] },
  },
  derived: (p) => {
    const legit = 1 - p.prior;
    const hitProduct = p.sens1 * p.sens2;
    const fpProduct = p.fpr1 * p.fpr2;
    const threatMass = p.prior * hitProduct;
    const clearMass = legit * fpProduct;
    const denom = threatMass + clearMass;
    const post2 = threatMass / denom;
    return { legit, hitProduct, fpProduct, threatMass, clearMass, denom, post2 };
  },
  statement: (p) =>
    `An airport's passenger risk model assigns a prior probability of ${pc(p.prior)}% that any given passenger poses an actual threat. ` +
    `Stage-one screening flags ${pc(p.sens1)}% of actual threats and also flags ${pc(p.fpr1)}% of non-threats. ` +
    `Stage-two screening is a separate secondary check that flags ${pc(p.sens2)}% of actual threats and ${pc(p.fpr2)}% of non-threats, independently of the stage-one result given the passenger's true status. ` +
    `A passenger is flagged by both stages. What is the probability this passenger is an actual threat?`,
  answerKey: "post2",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $T$ = actual threat, $F_1,F_2$ = flagged at stage one, stage two, conditionally independent given threat status. The four relevant masses are the prior branches $P(T)=${p.prior}$ and $P(\\bar T)=${fmtNum(d.legit)}$, and the combined stage likelihoods $P(F_1,F_2\\mid T)=${p.sens1}\\times${p.sens2}=${fmtNum(d.hitProduct)}$ and $P(F_1,F_2\\mid \\bar T)=${p.fpr1}\\times${p.fpr2}=${fmtNum(d.fpProduct)}$.` },
    { title: "Combine into joint masses", body: `Multiply each branch's prior by its combined likelihood: threat-mass $=${p.prior}\\times${fmtNum(d.hitProduct)}=${fmtNum(d.threatMass)}$, clear-mass $=${fmtNum(d.legit)}\\times${fmtNum(d.fpProduct)}=${fmtNum(d.clearMass)}$.` },
    { title: "Posterior", body: `$P(T\\mid F_1,F_2)=\\dfrac{${p.prior}\\times${fmtNum(d.hitProduct)}}{${p.prior}\\times${fmtNum(d.hitProduct)}+${fmtNum(d.legit)}\\times${fmtNum(d.fpProduct)}}=${fmtNum(d.post2)}$. This one-shot computation lands on the same value as updating on each stage's result in turn, treating the first stage's posterior as the second stage's prior — the two orderings are mathematically identical, just different bookkeeping.` },
    { title: "Sanity check", body: `The combined stage likelihoods favor the threat branch over the clear branch in every case here ($${fmtNum(d.hitProduct)} > ${fmtNum(d.fpProduct)}$), so the posterior must clear the raw prior — and $${fmtNum(d.post2)} > ${p.prior}$ holds.` },
  ],
  keyInsight: "Multiplying each hypothesis's full chain of stage likelihoods against its own prior and normalizing once means no intermediate posterior ever has to be reported or rounded partway through the chain — with a prior this tiny, a rounding error in a reported intermediate could quietly distort the next stage's update in a way the one-shot computation never exposes.",
  commonTrap: "Multiplying the two sensitivities together and reporting that product as the answer — that's P(both flags | threat), not P(threat | both flags), and it skips the tiny prior entirely, which is exactly the quantity a rare-event problem can't afford to drop.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
