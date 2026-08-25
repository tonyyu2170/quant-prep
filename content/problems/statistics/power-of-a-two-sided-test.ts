import type { ProblemTemplate } from "@qp/engine";
import { normalCdf } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// Two-sided critical values are derived from the level, so the two can never disagree on the
// page. The true effect in standard errors is licensed exact by `constraint`. The two rejection
// regions are evaluated as two CDFs and printed as LABELS, and their sum is stated in words —
// two four-figure renderings do not add back to the rendering of their sum. The far tail is kept
// above 1e-6 by constraint so that it prints in decimals inside fmtNum's window. The one-sided
// critical value used for the sanity comparison is an inline ternary: a module helper is licensed
// only if `constraint` reaches it, and this one is not needed there.
const critOf = (par: { alphaPct: number }) => (par.alphaPct === 10 ? 1.645 : par.alphaPct === 5 ? 1.96 : 2.576);

export const powerOfATwoSidedTest: ProblemTemplate = {
  id: "statistics/power-of-a-two-sided-test",
  version: 1,
  topic: "statistics/inference",
  difficulty: 2,
  firms: [{ firm: "de-shaw", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "two-sigma", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "the power of a two-sided z-test against a one-sided truth" },
  params: {
    alphaPct: { choices: [10, 5, 1] },
    sigma: { choices: [10, 15, 20, 25, 40] },
    n: { choices: [16, 25, 36, 64, 100] },
    gap: { choices: [3, 4, 5, 6, 8, 10, 12, 15] },
  },
  constraint: (p) => exact4((p.gap * Math.sqrt(p.n)) / p.sigma) && (p.gap * Math.sqrt(p.n)) / p.sigma - critOf(p as { alphaPct: number }) >= -2 && (p.gap * Math.sqrt(p.n)) / p.sigma - critOf(p as { alphaPct: number }) <= 2.5 && (p.gap * Math.sqrt(p.n)) / p.sigma + critOf(p as { alphaPct: number }) <= 4.75,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const root = Math.sqrt(p.n);
    const crit = critOf(p as { alphaPct: number });
    const delta = round((p.gap * root) / p.sigma);
    const shiftUp = round(delta - crit);
    const farDistance = round(delta + crit);
    const nearTail = round(normalCdf(shiftUp));
    const farTail = round(normalCdf(-farDistance));
    const oneSidedCrit = p.alphaPct === 10 ? 1.282 : p.alphaPct === 5 ? 1.645 : 2.326;
    return {
      root,
      crit,
      delta,
      shiftUp,
      farDistance,
      nearTail,
      farTail,
      oneSidedCrit,
      oneSidedPower: round(normalCdf(delta - oneSidedCrit)),
      beta: round(1 - nearTail - farTail),
      answer: round(nearTail + farTail),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A two-sided test at the ${fmtNum(p.alphaPct)} percent level rejects when the z-statistic is beyond ${fmtNum(d.crit)} in either direction. It is run on ${fmtNum(p.n)} observations with a known standard deviation of ${fmtNum(p.sigma)}, and suppose the truth is that the mean sits ${fmtNum(p.gap)} above the null value. ` +
    `What is the power of the test — the probability it rejects?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Two rejection regions, one truth", body: `A two-sided test rejects in either tail, so its power is the probability, computed under the TRUTH, of landing in either region. With $c$ the critical value and $e$ the true effect in standard errors, the statistic is a standard normal centred on $e$, and $\\text{power}=P(Z>c-e)+P(Z<-c-e)$.` },
    { title: "The effect in standard errors", body: `With $\\sqrt{${fmtNum(p.n)}}=${fmtNum(d.root)}$, a true gap of ${fmtNum(p.gap)} is $\\dfrac{${fmtNum(p.gap)}\\times${fmtNum(d.root)}}{${fmtNum(p.sigma)}}=${fmtNum(d.delta)}$ standard errors.` },
    { title: "The near region", body: `The upper threshold sits $${fmtNum(d.delta)}-${fmtNum(d.crit)}=${fmtNum(d.shiftUp)}$ below the truth's centre, so the chance of clearing it is the standard normal area below ${fmtNum(d.shiftUp)}, which is ${fmtNum(d.nearTail)}.` },
    { title: "The far region", body: `The lower threshold sits $${fmtNum(d.delta)}+${fmtNum(d.crit)}=${fmtNum(d.farDistance)}$ standard errors below the centre, on the wrong side of the truth. The area beyond minus ${fmtNum(d.farDistance)} is ${fmtNum(d.farTail)} — small whenever the effect is clearly on one side, but not zero.` },
    { title: "Answer", body: `Together the two regions carry ${fmtNum(d.answer)} of the probability under the truth: ${fmtNum(d.nearTail)} from the near side and ${fmtNum(d.farTail)} from the far one. That is the power; the type two error rate is the rest, ${fmtNum(d.beta)}.` },
    { title: "Sanity check", body: `A one-sided test at the same level would use the lower threshold ${fmtNum(d.oneSidedCrit)} and reach a power of ${fmtNum(d.oneSidedPower)}, more than ${fmtNum(d.answer)}: it spends its whole size on the side the effect is on, while the two-sided test holds half in reserve for a direction that never happens. That is the price of not committing to a direction in advance.` },
  ],
  keyInsight: "Power is computed under the alternative, and a two-sided test collects it from both tails — nearly all from the near one. The far tail is the honest reminder that the test would also reject on a large move the wrong way, and the comparison with the one-sided test is the cost of hedging the direction.",
  commonTrap: "Computing only the near tail, which understates the power by the far one, or computing the power against the null and recovering the level. The other slip is using the one-sided critical value with a two-sided alternative, which overstates the power.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [],
};
