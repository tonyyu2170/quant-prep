import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Additive moves — up by `up`, down by `down`, the same at every node — so the fair weight is
// one number for the whole tree. `constraint` forces it to at most two decimals, which makes
// q², 2q(1−q) and every node value exact; the strike sits strictly between the bottom and top
// endings so the top always pays and the bottom never does. The solution prices the tree both
// ways — weighting the three endings, and stepping back node by node — and the two chains
// reconcile to the same printed answer.
export const twoStepBinomialCallPrice: ProblemTemplate = {
  id: "finance/two-step-binomial-call-price",
  version: 1,
  topic: "finance/options",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "citadel-securities", weight: 0.2 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "pricing a call on a two-period binomial tree, by path weights and by backward induction" },
  params: {
    spot: { choices: [40, 50, 60, 80, 100, 120] },
    up: { choices: [4, 5, 6, 8, 10, 12, 15, 16, 20] },
    down: { choices: [4, 5, 6, 8, 10, 12, 15, 16, 20] },
    strikeOffset: { choices: [-6, -4, -2, 0, 2, 3, 4, 5, 6, 8, 10] },
  },
  constraint: (p) => Math.abs(100 * p.down / (p.up + p.down) - Math.round(100 * p.down / (p.up + p.down))) < 1e-9 && p.strikeOffset < 2 * p.up && p.strikeOffset > -2 * p.down && (p.down / (p.up + p.down)) ** 2 * (2 * p.up - p.strikeOffset) + 2 * (p.down / (p.up + p.down)) * (p.up / (p.up + p.down)) * Math.max(p.up - p.down - p.strikeOffset, 0) >= 0.5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const q = round(p.down / (p.up + p.down));
    const qDown = round(1 - q);
    const payTop = 2 * p.up - p.strikeOffset;
    const payMid = Math.max(p.up - p.down - p.strikeOffset, 0);
    const vUp = round(q * payTop + qDown * payMid);
    const vDown = round(q * payMid);
    return {
      strike: p.spot + p.strikeOffset,
      top: p.spot + 2 * p.up,
      mid: p.spot + p.up - p.down,
      bottom: p.spot - 2 * p.down,
      q,
      qDown,
      qTop: round(q * q),
      qMid: round(2 * q * qDown),
      qBottom: round(qDown * qDown),
      payTop,
      payMid,
      vUp,
      vDown,
      answer: round(q * q * payTop + 2 * q * qDown * payMid),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A stock trades at ${fmtNum(p.spot)}. Over each of the next two periods it moves either up by ${fmtNum(p.up)} or down by ${fmtNum(p.down)}, and nothing else can happen. Interest rates are zero. ` +
    `What is a call struck at ${fmtNum(d.strike)}, expiring at the end of the second period, worth today?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "One weight, three endings", body: `Write $q$ for the fair weight on an up move — the one that makes each period a fair bet for the stock — and it is the same at every node, because the moves are the same size at every node. Two periods leave three endings: up-up with weight $q^{2}$, one of each with weight $2q(1-q)$ since two paths lead there, and down-down with weight $(1-q)^{2}$. So $V=q^{2}V_{uu}+2q(1-q)V_{ud}+(1-q)^{2}V_{dd}$.` },
    { title: "The fair weight and the path weights", body: `The weight on the up move is the down move over the span: $\\dfrac{${fmtNum(p.down)}}{${fmtNum(p.up)}+${fmtNum(p.down)}}=${fmtNum(d.q)}$. Then $${fmtNum(d.q)}\\times${fmtNum(d.q)}=${fmtNum(d.qTop)}$ for up-up and $2\\times${fmtNum(d.q)}\\times${fmtNum(d.qDown)}=${fmtNum(d.qMid)}$ for one of each.` },
    { title: "Where the stock can finish, and what the call pays", body: `Up-up ends at $${fmtNum(p.spot)}+2\\times${fmtNum(p.up)}=${fmtNum(d.top)}$, one of each at $${fmtNum(p.spot)}+${fmtNum(p.up)}-${fmtNum(p.down)}=${fmtNum(d.mid)}$, and down-down at $${fmtNum(p.spot)}-2\\times${fmtNum(p.down)}=${fmtNum(d.bottom)}$. Against the ${fmtNum(d.strike)} strike the top ending pays $${fmtNum(d.top)}-${fmtNum(d.strike)}=${fmtNum(d.payTop)}$, the middle pays ${d.payMid > 0 ? `$${fmtNum(d.mid)}-${fmtNum(d.strike)}=${fmtNum(d.payMid)}$` : `nothing — ${fmtNum(d.mid)} is not above the strike`}, and the bottom pays nothing.` },
    { title: "Answer", body: `$${fmtNum(d.qTop)}\\times${fmtNum(d.payTop)}+${fmtNum(d.qMid)}\\times${fmtNum(d.payMid)}=${fmtNum(d.answer)}$ today, with rates at zero.` },
    { title: "Sanity check: step back through the tree instead", body: `Price each node from the two after it with the same weight. After an up move the call is worth $${fmtNum(d.q)}\\times${fmtNum(d.payTop)}+${fmtNum(d.qDown)}\\times${fmtNum(d.payMid)}=${fmtNum(d.vUp)}$; after a down move it is worth $${fmtNum(d.q)}\\times${fmtNum(d.payMid)}=${fmtNum(d.vDown)}$, the down-down ending paying nothing. Stepping back once more, $${fmtNum(d.q)}\\times${fmtNum(d.vUp)}+${fmtNum(d.qDown)}\\times${fmtNum(d.vDown)}=${fmtNum(d.answer)}$ — the same number, because both routes weight every path identically.` },
  ],
  keyInsight: "A two-period tree is the one-period rule applied twice: price every node from the two after it with the same fair weight, or weight the three endings by the number of paths that reach each. Both routes give one number, and neither uses anyone's forecast of the stock.",
  commonTrap: "Forgetting that the middle ending is reached by two paths — up-then-down and down-then-up — and weighting it by q(1−q) instead of twice that. The other slip is changing the weight between periods; the moves are the same size at every node, so the weight is the same.",
  expectedPaceS: 140,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
