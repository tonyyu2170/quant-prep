import type { ProblemTemplate } from "@qp/engine";
import { exact4, fmtNum } from "../util";

// Rates are zero, as in stochastic/risk-neutral-up-probability: a discount factor makes the
// fair weight a repeating decimal on almost every draw. The strike is the spot plus a drawn
// offset (printed as the strike; the offset itself never appears), kept strictly between the
// two outcomes so that only the up node pays. `constraint` licenses the weight as a four-figure
// exact value, so it can stand as an operand in the pricing chain; the replicating share count
// is printed as a label only, since payoff/span is not exact in general.
export const oneStepBinomialCallPrice: ProblemTemplate = {
  id: "finance/one-step-binomial-call-price",
  version: 1,
  topic: "finance/pricing",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "citadel-securities", weight: 0.2 }, { firm: "optiver", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "pricing a call on a one-period binomial tree" },
  params: {
    spot: { choices: [40, 50, 60, 80, 100, 120, 150, 200] },
    up: { choices: [5, 6, 8, 10, 12, 15, 16, 20, 24, 25, 30] },
    down: { choices: [4, 5, 6, 8, 10, 12, 15, 16, 20] },
    strikeOffset: { choices: [-4, -2, 0, 2, 3, 4, 5, 6, 8, 10, 12] },
  },
  constraint: (p) => p.strikeOffset > -p.down && p.strikeOffset < p.up && exact4(p.down / (p.up + p.down)) && p.down / (p.up + p.down) * (p.up - p.strikeOffset) >= 0.5,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const q = round(p.down / (p.up + p.down));
    return {
      upPrice: p.spot + p.up,
      downPrice: p.spot - p.down,
      strike: p.spot + p.strikeOffset,
      span: p.up + p.down,
      q,
      qDown: round(1 - q),
      payoffUp: p.up - p.strikeOffset,
      intrinsic: Math.max(-p.strikeOffset, 0),
      shares: round((p.up - p.strikeOffset) / (p.up + p.down)),
      answer: round(q * (p.up - p.strikeOffset)),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A stock trades at ${fmtNum(p.spot)} today. Over the next period it will either rise to ${fmtNum(d.upPrice)} or fall to ${fmtNum(d.downPrice)}, and nothing else can happen. Interest rates are zero. ` +
    `What is a call option struck at ${fmtNum(d.strike)}, expiring at the end of the period, worth today?`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "Price with the fair weight, not a forecast", body: `Write $q$ for the weight on the up move that makes the stock itself a fair bet: $qS_u+(1-q)S_d=S$. A call can be built from the stock and cash, so priced with those same weights it is fair too: $C=qC_u+(1-q)C_d$. Nobody's view of which way the stock will go enters.` },
    { title: "The fair weight", body: `The stock can rise ${fmtNum(p.up)} or fall ${fmtNum(p.down)}, a span of $${fmtNum(p.up)}+${fmtNum(p.down)}=${fmtNum(d.span)}$. The weight on the up move is the DOWN move over the span — the far branch needs the weight: $\\dfrac{${fmtNum(p.down)}}{${fmtNum(d.span)}}=${fmtNum(d.q)}$.` },
    { title: "What the call pays", body: `If the stock rises the call is worth $${fmtNum(d.upPrice)}-${fmtNum(d.strike)}=${fmtNum(d.payoffUp)}$; if it falls to ${fmtNum(d.downPrice)}, below the strike, it expires worthless.` },
    { title: "Answer", body: `$${fmtNum(d.q)}\\times${fmtNum(d.payoffUp)}=${fmtNum(d.answer)}$ today, with rates at zero.` },
    { title: "Sanity check", body: `Replication gives the same number: holding ${fmtNum(d.shares)} shares — the payoff over the span — and borrowing the rest reproduces the call in both states. The price also sits where it must, above today's intrinsic value and below the up-state payoff: $${fmtNum(d.answer)}>${fmtNum(d.intrinsic)}$ and $${fmtNum(d.answer)}<${fmtNum(d.payoffUp)}$.` },
  ],
  keyInsight: "In a two-outcome world the call is priced by replication, and the weights that do it are the ones that make the stock itself a fair bet — the down move over the span. The real probability of the rise never appears, which is why two desks who disagree completely about direction still agree on the price.",
  commonTrap: "Weighting the up payoff by a forecast probability instead of the fair weight, or pairing the up move with the up weight — the weight on an outcome is the distance to the OTHER outcome. Either way the price can be arbitraged.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [1],
};
