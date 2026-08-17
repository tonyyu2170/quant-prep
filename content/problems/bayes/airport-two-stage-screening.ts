import type { ProblemTemplate } from "@qp/engine";
import { fmtNum, pc } from "../util";

// Rare-event two-stage independent screening chain. Prior is deliberately tiny (0.001-0.005)
// to make the rare-event lesson concrete; parameter ranges keep every derived value well
// clear of the fmtNum decimal-safe floor (1e-6).
export const airportTwoStageScreening: ProblemTemplate = {
  id: "bayes/airport-two-stage-screening",
  version: 1,
  topic: "probability/bayes",
  difficulty: 3,
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
    const numA = p.prior * p.sens1;
    const fpA = legit * p.fpr1;
    const denomA = numA + fpA;
    const post1 = numA / denomA;
    const legit1 = 1 - post1;
    const numB = post1 * p.sens2;
    const fpB = legit1 * p.fpr2;
    const denomB = numB + fpB;
    const post2 = numB / denomB;
    return { legit, numA, fpA, denomA, post1, legit1, numB, fpB, denomB, post2 };
  },
  statement: (p) =>
    `An airport's passenger risk model assigns a prior probability of ${pc(p.prior)}% that any given passenger poses an actual threat. ` +
    `Stage-one screening flags ${pc(p.sens1)}% of actual threats and also flags ${pc(p.fpr1)}% of non-threats. ` +
    `Stage-two screening is a separate secondary check that flags ${pc(p.sens2)}% of actual threats and ${pc(p.fpr2)}% of non-threats, independently of the stage-one result given the passenger's true status. ` +
    `A passenger is flagged by both stages. What is the probability this passenger is an actual threat?`,
  answerKey: "post2",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $T$ = actual threat, $F_1,F_2$ = flagged at stage one, stage two. Given $P(T)=${p.prior}$, $P(F_1\\mid T)=${p.sens1}$, $P(F_1\\mid \\bar T)=${p.fpr1}$, $P(F_2\\mid T)=${p.sens2}$, $P(F_2\\mid \\bar T)=${p.fpr2}$, with the two stages independent given threat status.` },
    { title: "Update on stage one", body: `True-flag mass: $${p.prior}\\times${p.sens1}=${fmtNum(d.numA)}$. False-flag mass: the non-threat share is ${fmtNum(d.legit)}, giving $${fmtNum(d.legit)}\\times${p.fpr1}=${fmtNum(d.fpA)}$. So $P(T\\mid F_1)=${fmtNum(d.numA)}/(${fmtNum(d.numA)}+${fmtNum(d.fpA)})=${fmtNum(d.post1)}$.` },
    { title: "Update on stage two", body: `Treat $${fmtNum(d.post1)}$ as the new prior. True-flag mass: $${fmtNum(d.post1)}\\times${p.sens2}=${fmtNum(d.numB)}$. False-flag mass: the non-threat share is now ${fmtNum(d.legit1)}, giving $${fmtNum(d.legit1)}\\times${p.fpr2}=${fmtNum(d.fpB)}$. So $P(T\\mid F_1,F_2)=${fmtNum(d.numB)}/(${fmtNum(d.numB)}+${fmtNum(d.fpB)})=${fmtNum(d.post2)}$.` },
    { title: "Sanity check", body: `Both stages are more likely to fire on an actual threat than on a non-threat, so each additional positive flag can only raise the posterior, never lower it: $${p.prior}<${fmtNum(d.post1)}$ and $${fmtNum(d.post1)}<${fmtNum(d.post2)}$ both hold.` },
  ],
  keyInsight: "When the prior is extremely small, a single positive screen typically leaves the posterior still far from certainty even if the screen is fairly accurate — it takes several independent positive results, each compounding the odds further, before a rare event becomes more plausible than not.",
  commonTrap: "Multiplying the two sensitivities together and reporting that product as the answer — that's P(both flags | threat), not P(threat | both flags), and it skips the tiny prior entirely, which is exactly the quantity a rare-event problem can't afford to drop.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
