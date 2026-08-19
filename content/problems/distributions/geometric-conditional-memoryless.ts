import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

const answerOf = (par: Params) => (1 - par.succPct / 100) ** par.k;

export const geometricConditionalMemoryless: ProblemTemplate = {
  id: "distributions/geometric-conditional-memoryless",
  version: 1,
  topic: "probability/distributions",
  difficulty: 3,
  firms: [{ firm: "jump", weight: 0.35 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "original", inspiration: "the memoryless property of the geometric distribution, tested by making the elapsed wait irrelevant" },
  params: {
    succPct: { range: { min: 10, max: 60, step: 2 } },
    j: { range: { min: 1, max: 10, step: 1 } },
    k: { range: { min: 1, max: 15, step: 1 } },
  },
  constraint: (p) => answerOf(p) >= 0.01 && answerOf(p) <= 0.99,
  derived: (p) => {
    const prob = p.succPct / 100;
    const q = 1 - prob;
    // The already-elapsed wait j never appears in the formula below — that IS the memoryless
    // property. Unconditional tails at j and j+k are computed only as LOCAL intermediates
    // (never returned in derived): at j=10, k=15, succPct=60 the j+k-trial tail measures
    // ~1.1e-10, well under emit.ts's 1e-6 floor, even though their ratio (this answer) does not.
    const tailAfterJ = q ** p.j;
    const tailAfterJPlusK = tailAfterJ * q ** p.k;
    const answer = tailAfterJPlusK / tailAfterJ;
    return { prob, q, answer };
  },
  statement: (p) =>
    `A trader has watched ${fmtNum(p.j)} consecutive ticks pass with no favorable fill; each tick independently produces a fill with probability ${fmtNum(p.succPct)} percent. Given no fill yet, what is the probability that more than ${fmtNum(p.k)} further ticks are needed before the first fill?`,
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Write the fill rate as a probability: $\\frac{${fmtNum(p.succPct)}}{100}=${fmtNum(d.prob)}$, so a tick fails to fill with probability ${fmtNum(d.q)}.` },
    { title: "Recognize the memoryless property", body: `Each tick is independent of every earlier one, so the ${fmtNum(p.j)} ticks already observed carry no information about what comes next — conditioning on "no fill yet" leaves the distribution of the wait FROM THIS POINT identical to the distribution of a fresh wait.` },
    { title: "Apply the unconditional formula to the remaining wait", body: `"More than $k$ further ticks needed" is exactly the unconditional tail event restarted from now: $P(X>k\\mid X>j)=q^k$.` },
    { title: "Compute", body: `$P(\\text{more than }${fmtNum(p.k)}\\text{ further ticks})\\approx${fmtNum(d.q)}^{${fmtNum(p.k)}}\\approx${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `This matches the answer a fresh, unconditioned "more than ${fmtNum(p.k)} ticks" question would give at the same fill rate — the ${fmtNum(p.j)}-tick head start changes nothing about the forward-looking probability, which is the defining property being tested here, not an approximation of it.` },
  ],
  keyInsight: "The geometric distribution is memoryless: conditioning on an elapsed run of failures does not shift the distribution of the remaining wait — the answer depends only on how many further trials are asked about, never on how many already happened.",
  commonTrap: "Treating the already-elapsed wait as making a fill \"overdue\" and shrinking the further-wait probability below the unconditional value — the geometric distribution has no such memory.",
  expectedPaceS: 70,
  verify: { method: "brute-force" },
  constants: [100],
};
