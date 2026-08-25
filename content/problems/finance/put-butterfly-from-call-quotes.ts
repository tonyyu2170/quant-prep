import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The spot and the discount factor are quoted and irrelevant: parity turns each call into the
// put at its strike, and a butterfly's weights sum to zero, so the share and bond terms cancel
// exactly. The solution prices the put fly the long way first — three parity conversions, each
// over exact operands (a two-decimal DF times a whole strike) — and only then shows the short
// way. `constraint` keeps the three quotes arbitrage-free enough that the lowest put is a real
// price, and the answer at least half a dollar. Spot is the middle strike plus a drawn offset.
export const putButterflyFromCallQuotes: ProblemTemplate = {
  id: "finance/put-butterfly-from-call-quotes",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "sig", weight: 0.25 }, { firm: "imc", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "a put butterfly priced off call quotes — the spot and the bond drop out" },
  params: {
    k1: { choices: [30, 35, 40, 45, 50, 55, 60, 80, 100] },
    width: { choices: [5, 10, 15, 20] },
    cLow: { choices: [8, 9, 10, 11, 12, 14, 16, 18] },
    cMid: { choices: [4, 4.5, 5, 6, 7, 8, 9, 10] },
    cHigh: { choices: [1, 1.5, 2, 2.5, 3, 4, 5] },
    spotOffset: { choices: [-3, -2, -1, 0, 1, 2, 3] },
    df: { choices: [0.96, 0.97, 0.98, 0.99] },
  },
  constraint: (p) => p.cLow > p.cMid && p.cMid > p.cHigh && p.cLow - 2 * p.cMid + p.cHigh >= 0.5 && p.cLow - p.cMid <= p.width && p.cMid - p.cHigh <= p.width && p.cLow - (p.k1 + p.width + p.spotOffset) + p.k1 * p.df >= 0.25 && p.cMid - (p.k1 + p.width + p.spotOffset) + (p.k1 + p.width) * p.df >= 0.25 && p.cHigh - (p.k1 + p.width + p.spotOffset) + (p.k1 + 2 * p.width) * p.df >= 0.25,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const k2 = p.k1 + p.width, k3 = p.k1 + 2 * p.width, spot = k2 + p.spotOffset;
    const pLow = round(p.cLow - spot + p.k1 * p.df);
    const pMid = round(p.cMid - spot + k2 * p.df);
    const pHigh = round(p.cHigh - spot + k3 * p.df);
    return {
      k2,
      k3,
      spot,
      pLow,
      pMid,
      pHigh,
      putFly: round(pLow - 2 * pMid + pHigh),
      answer: round(p.cLow - 2 * p.cMid + p.cHigh),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `On one underlying, with one expiry, calls are quoted at ${fmtNum(p.cLow)} for the ${fmtNum(p.k1)} strike, ${fmtNum(p.cMid)} for the ${fmtNum(d.k2)} strike and ${fmtNum(p.cHigh)} for the ${fmtNum(d.k3)} strike — three strikes evenly spaced ${fmtNum(p.width)} apart. ` +
    `The stock trades at ${fmtNum(d.spot)}, and a zero-coupon bond paying one dollar at expiry trades at ${fmtNum(p.df)}. ` +
    `A client asks for a price on the put butterfly on the same three strikes: long one ${fmtNum(p.k1)} put, short two ${fmtNum(d.k2)} puts, long one ${fmtNum(d.k3)} put. What should it cost?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "Every put is a call in disguise", body: `Parity converts a call into the put at its strike: $P=C-S+K\\,\\text{DF}$. The butterfly takes one of the low strike, minus two of the middle, plus one of the high, so whatever is added to every leg enters with weights that sum to $1-2+1=0$ — and because the strikes are evenly spaced, $K_1-2K_2+K_3=0$ as well.` },
    { title: "The long way: price each put", body: `$${fmtNum(p.cLow)}-${fmtNum(d.spot)}+${fmtNum(p.k1)}\\times${fmtNum(p.df)}=${fmtNum(d.pLow)}$ for the low strike, $${fmtNum(p.cMid)}-${fmtNum(d.spot)}+${fmtNum(d.k2)}\\times${fmtNum(p.df)}=${fmtNum(d.pMid)}$ for the middle, and $${fmtNum(p.cHigh)}-${fmtNum(d.spot)}+${fmtNum(d.k3)}\\times${fmtNum(p.df)}=${fmtNum(d.pHigh)}$ for the high.` },
    { title: "Assemble the put fly", body: `$${fmtNum(d.pLow)}-2\\times${fmtNum(d.pMid)}+${fmtNum(d.pHigh)}=${fmtNum(d.putFly)}$.` },
    { title: "Answer, the short way", body: `The same number falls straight out of the calls: $${fmtNum(p.cLow)}-2\\times${fmtNum(p.cMid)}+${fmtNum(p.cHigh)}=${fmtNum(d.answer)}$. The spot and the bond cancelled because the fly's weights sum to zero, and the strike terms cancelled because the spacing is even.` },
    { title: "Sanity check", body: `Neither ${fmtNum(d.spot)} nor ${fmtNum(p.df)} survives into the answer — move either and all three put prices change while the fly does not. And like the call fly, the put fly is worth at most the ${fmtNum(p.width)} spacing and never less than nothing: $${fmtNum(d.answer)}<${fmtNum(p.width)}$.` },
  ],
  keyInsight: "Parity is linear and a butterfly's weights sum to zero, so converting three calls into three puts adds a share term and a bond term that cancel exactly. The put fly and the call fly on the same strikes are the same trade at the same price — a market that quotes them apart is giving away a box.",
  commonTrap: "Converting each call to a put and slipping in one of the three parity steps, or assuming the put fly must be cheaper because puts are cheaper than calls here. The individual legs differ; the structure does not.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  // 0, 1, 2 for the fly's weights; 3 is the subscript in K_3, which the traceability audit
  // reads as a number like any other.
  constants: [0, 1, 2, 3],
};
