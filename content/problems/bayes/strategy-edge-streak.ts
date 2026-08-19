import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Mixed evidence streak: h wins and t losses (both params exercised) update a 50/50 prior
// between a true-edge hypothesis and a null hypothesis. The binomial coefficient for arranging
// the wins and losses is identical under both hypotheses (it only counts orderings of the
// observed record, never touching the win probability), so it cancels out of the posterior —
// only the raw p^h(1-p)^t products need comparing.
export const strategyEdgeStreak: ProblemTemplate = {
  id: "bayes/strategy-edge-streak",
  version: 1,
  topic: "probability/bayes",
  difficulty: 3,
  firms: [{ firm: "hrt", weight: 0.5 }, { firm: "jane-street", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: Bayesian comparison of two binomial hypotheses from a mixed win/loss record" },
  params: {
    h: { choices: [3, 4, 5, 6] },
    t: { choices: [2, 3, 4] },
    p1: { choices: [0.55, 0.6, 0.65] },
    p0: { choices: [0.45, 0.5] },
  },
  // Restricts to draws where the observed record's likelihood is genuinely higher under the
  // true-edge hypothesis than the null — computed with the exact same formula used below, so
  // every accepted draw guarantees posterior > 0.5 without any separate argument. Also keeps
  // the posterior meaningfully clear of the raw win-rate trap (wins / total trades), which a
  // handful of (h,t,p1) combinations would otherwise land on almost exactly by coincidence.
  constraint: (p) => {
    const likeH1 = Math.pow(p.p1, p.h) * Math.pow(1 - p.p1, p.t);
    const likeH0 = Math.pow(p.p0, p.h) * Math.pow(1 - p.p0, p.t);
    if (likeH1 <= likeH0) return false;
    const posterior = likeH1 / (likeH1 + likeH0);
    const trapValue = p.h / (p.h + p.t);
    return Math.abs(posterior - trapValue) > 0.01;
  },
  derived: (p) => {
    const n = p.h + p.t;
    const q1 = 1 - p.p1;
    const q0 = 1 - p.p0;
    const likeH1 = Math.pow(p.p1, p.h) * Math.pow(q1, p.t);
    const likeH0 = Math.pow(p.p0, p.h) * Math.pow(q0, p.t);
    const massH1 = 0.5 * likeH1;
    const massH0 = 0.5 * likeH0;
    const denom = massH1 + massH0;
    const posterior = massH1 / denom;
    return { n, q1, q0, likeH1, likeH0, massH1, massH0, denom, posterior };
  },
  statement: (p) =>
    `A trading desk is evaluating a new strategy that has produced ${p.h} wins and ${p.t} losses so far. Before seeing this record, the desk thought it equally likely (a $0.5$ prior each way) that the strategy has a real edge, winning each trade independently with probability ${p.p1}, ` +
    `or has no real edge at all, winning each trade independently with probability ${p.p0}. Given the observed ${p.h}-win, ${p.t}-loss record, what is the probability the strategy has the real edge?`,
  answerKey: "posterior",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $E$ = true edge (win rate $p_1=${p.p1}$), $N$ = null (win rate $p_0=${p.p0}$), each with prior $0.5$. Observed: ${p.h} wins and ${p.t} losses out of $n=${d.n}$ trades.` },
    { title: "The ordering count cancels", body: `The number of ways to arrange ${p.h} wins and ${p.t} losses among ${d.n} trades is $\\binom{${d.n}}{${p.h}}$ — but that count only depends on the observed record, not on the win probability, so it's identical under $E$ and $N$. It multiplies both branches equally and cancels straight out of the posterior, leaving just $p^{${p.h}}(1-p)^{${p.t}}$ to compare.` },
    { title: "Likelihood of the record under each hypothesis", body: `$P(\\text{record}\\mid E)=${p.p1}^{${p.h}}\\times${fmtNum(d.q1)}^{${p.t}}=${fmtNum(d.likeH1)}$. $P(\\text{record}\\mid N)=${p.p0}^{${p.h}}\\times${fmtNum(d.q0)}^{${p.t}}=${fmtNum(d.likeH0)}$.` },
    { title: "Posterior", body: `Masses: $0.5\\times${p.p1}^{${p.h}}\\times${fmtNum(d.q1)}^{${p.t}}=${fmtNum(d.massH1)}$ and $0.5\\times${p.p0}^{${p.h}}\\times${fmtNum(d.q0)}^{${p.t}}=${fmtNum(d.massH0)}$. The $0.5$ prior sits on both and cancels, so $P(E\\mid\\text{record})=\\dfrac{${p.p1}^{${p.h}}\\times${fmtNum(d.q1)}^{${p.t}}}{${p.p1}^{${p.h}}\\times${fmtNum(d.q1)}^{${p.t}}+${p.p0}^{${p.h}}\\times${fmtNum(d.q0)}^{${p.t}}}=${fmtNum(d.posterior)}$.` },
    { title: "Sanity check", body: `This record's likelihood is higher under the edge hypothesis than the null ($${fmtNum(d.likeH1)} > ${fmtNum(d.likeH0)}$), so the posterior must clear the $0.5$ prior — and $${fmtNum(d.posterior)} > 0.5$ holds.` },
  ],
  keyInsight: "Comparing two point hypotheses against the same observed record only ever needs each hypothesis's own probability of producing that exact record — any factor common to both (like the count of orderings for a fixed win/loss tally) is dead weight that cancels before it ever reaches the posterior.",
  commonTrap: "Reporting the strategy's raw win rate — wins divided by total trades — as the posterior probability of having a real edge. That's a sample frequency, not a posterior belief about which hypothesis generated it, and the two numbers only coincide by accident.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
  constants: [0, 0.5, 1],
};
