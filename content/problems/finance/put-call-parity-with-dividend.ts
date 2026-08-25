import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The parity template's draw plus a dividend paid before expiry and a zero maturing on the
// dividend date, priced above the expiry zero by `constraint`. Every product is a whole strike
// or a one-decimal dividend times a two-decimal factor, so every operand is exact; the final
// chain is built from the original literals rather than from the two printed products, and the
// no-dividend put is constrained to be a real price so the sanity check never prints a
// negative option.
export const putCallParityWithDividend: ProblemTemplate = {
  id: "finance/put-call-parity-with-dividend",
  version: 1,
  topic: "finance/pricing",
  difficulty: 3,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "akuna", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "put-call parity with a known dividend before expiry" },
  params: {
    spot: { choices: [40, 45, 50, 55, 60, 75, 80, 100] },
    strike: { choices: [35, 40, 45, 50, 55, 60, 70, 80, 90, 105] },
    call: { range: { min: 1, max: 12, step: 0.5 } },
    df: { choices: [0.94, 0.95, 0.96, 0.97, 0.98] },
    div: { choices: [0.5, 1, 1.5, 2, 2.5, 3, 4] },
    dfDiv: { choices: [0.97, 0.98, 0.99] },
  },
  constraint: (p) => p.dfDiv > p.df && p.call - p.spot + p.strike * p.df >= 0.3,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      pvDiv: round(p.div * p.dfDiv),
      pvK: round(p.strike * p.df),
      noDivPut: round(p.call - p.spot + p.strike * p.df),
      answer: round(p.call - p.spot + p.div * p.dfDiv + p.strike * p.df),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A European call and a European put are written on the same stock, share a strike of ${fmtNum(p.strike)}, and expire on the same day. The stock trades at ${fmtNum(p.spot)} and will pay a dividend of ${fmtNum(p.div)} per share before expiry. ` +
    `A zero-coupon bond paying one dollar on the dividend date trades at ${fmtNum(p.dfDiv)}, and one paying one dollar on the expiry date trades at ${fmtNum(p.df)}. The call is quoted at ${fmtNum(p.call)}. ` +
    `What must the put be worth, if no riskless profit is available?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands.
    { title: "Replicate, but the share sheds a payout", body: `Hold a call plus bonds paying the strike at expiry, or hold a put plus a share: at expiry both are worth the larger of the share price and the strike. But the share-holder also pockets the dividend on the way, and the call-holder does not, so the two portfolios match only once the share is charged for it: $C-P=S-PV_D-K\\,\\text{DF}$, with $PV_D$ the dividend's value today.` },
    { title: "Price the dividend leg", body: `A dollar due on the dividend date is worth ${fmtNum(p.dfDiv)} now, so the payout is worth $${fmtNum(p.div)}\\times${fmtNum(p.dfDiv)}=${fmtNum(d.pvDiv)}$ today.` },
    { title: "Price the strike leg", body: `Paying the strike at expiry costs $${fmtNum(p.strike)}\\times${fmtNum(p.df)}=${fmtNum(d.pvK)}$ today.` },
    { title: "Answer", body: `Rearranging, the put is the call, less the share, plus the discounted dividend, plus the discounted strike: $${fmtNum(p.call)}-${fmtNum(p.spot)}+${fmtNum(p.div)}\\times${fmtNum(p.dfDiv)}+${fmtNum(p.strike)}\\times${fmtNum(p.df)}=${fmtNum(d.answer)}$.` },
    { title: "Sanity check", body: `Without the dividend, parity would put the option at $${fmtNum(p.call)}-${fmtNum(p.spot)}+${fmtNum(p.strike)}\\times${fmtNum(p.df)}=${fmtNum(d.noDivPut)}$. The dividend lifts it by exactly its present value — $${fmtNum(d.noDivPut)}+${fmtNum(p.div)}\\times${fmtNum(p.dfDiv)}=${fmtNum(d.answer)}$ — because a payout the shareholder pockets is a drop in the share price the put insures against, and it is known in advance. The dividend is discounted from its own date, not from expiry: the two zeros are quoted separately for that reason.` },
  ],
  keyInsight: "Parity is replication, and a dividend breaks the symmetry between holding the share and holding the call: the share-and-put portfolio collects the payout and the call-and-bond portfolio does not, so the share leg is worth the stock less the present value of the dividend. The put rises by exactly that amount, because a known payout is a known drop in the share it insures.",
  commonTrap: "Ignoring the dividend, or subtracting it at face value rather than its present value — it is paid on the dividend date, and the zero maturing on that date prices it. Adding it to the call's side instead of the put's gets the sign wrong: the dividend is a cost to the call-and-bond portfolio, not a benefit.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
};
