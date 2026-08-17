import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Simple two-event conditional: P(A|B) from a joint count and a marginal count, no table.
export const surveyOverlapConditional: ProblemTemplate = {
  id: "bayes/survey-overlap-conditional",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "flow", weight: 0.4 }, { firm: "hrt", weight: 0.3 }],
  source: { kind: "free-resource", inspiration: "classic: conditional probability from a joint and a marginal count" },
  params: {
    countB: { choices: [40, 60, 80, 100] },
    countAB: { choices: [15, 20, 25, 30] },
    nonMorning: { choices: [40, 60, 80, 100] },
  },
  constraint: (p) => p.countAB < p.countB && p.countB + p.nonMorning >= p.countB,
  derived: (p) => {
    const total = p.countB + p.nonMorning;
    const pAgivenB = p.countAB / p.countB;
    return { total, pAgivenB };
  },
  statement: (p, d) =>
    `A survey of ${fmtNum(d.total)} respondents found that ${p.countB} identify as morning people. Of all respondents surveyed, ${p.countAB} are both morning people and daily coffee drinkers. ` +
    `Picking a morning-person respondent at random, what is the probability they are also a daily coffee drinker?`,
  answerKey: "pAgivenB",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $A$ = daily coffee drinker, $B$ = morning person, out of ${fmtNum(d.total)} respondents total. Given the joint count $${p.countAB}$ and the marginal count $${p.countB}$.` },
    { title: "Apply the definition", body: `$P(A\\mid B) = \\dfrac{\\text{count}(A\\cap B)}{\\text{count}(B)}$ — note the denominator is the marginal count of $B$, not the survey total.` },
    { title: "Compute", body: `$P(A\\mid B)=${p.countAB}/${p.countB}=${fmtNum(d.pAgivenB)}$.` },
    { title: "Sanity check", body: `The joint count can never exceed the marginal count it's drawn from, so the conditional probability must land strictly between $0$ and $1$ — and $${fmtNum(d.pAgivenB)}$ does.` },
  ],
  keyInsight: "Conditional probability just restricts attention to the outcomes where the condition already happened, then asks what fraction of those also satisfy the event of interest.",
  commonTrap: "Dividing by the total survey population instead of by the conditioning event's count — that gives the joint probability, not the conditional one.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [0, 1],
};
