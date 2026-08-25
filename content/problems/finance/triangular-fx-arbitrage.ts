import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The whole loop is printed as one product of the three quoted rates rather than as three
// successive balances: an intermediate balance is a rounded four-significant-figure decimal,
// and feeding one into the next multiplication is the chain the precision gate exists to
// catch. `constraint` needs the loop factor to be far enough from one that the round trip is
// worth doing, so the helper is licensed.
const factorOf = (par: { r1: number; r2: number; r3: number }) => par.r1 * par.r2 * par.r3;

export const triangularFxArbitrage: ProblemTemplate = {
  id: "finance/triangular-fx-arbitrage",
  version: 1,
  topic: "finance/arbitrage",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "flow", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "triangular arbitrage around three quoted exchange rates" },
  params: {
    r1: { choices: [0.75, 0.85, 0.88, 0.92, 1.25, 1.35] },
    r2: { choices: [138, 148, 155, 160, 172] },
    r3: { choices: [0.0059, 0.0068, 0.0072, 0.0081, 0.0091] },
    start: { choices: [1000, 2500, 5000, 10000] },
  },
  constraint: (p) => Math.abs(factorOf(p as { r1: number; r2: number; r3: number }) - 1) >= 0.02,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const factor = round(p.r1 * p.r2 * p.r3);
    return {
      factor,
      perDollar: round(factor - 1),
      answer: round(p.start * p.r1 * p.r2 * p.r3),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Three currency quotes are live and you can trade any size at any of them, with no fees and no spread: ${fmtNum(p.r1)} euros per dollar, ${fmtNum(p.r2)} yen per euro, and ${fmtNum(p.r3)} dollars per yen. ` +
    `You start with ${fmtNum(p.start)} dollars and go all the way round the loop — dollars into euros, euros into yen, yen back into dollars. ` +
    `How many dollars do you finish with?`,
  solution: (p, d) => [
    // Claim-free segment (non-negotiable 6): symbolic only, no printed operands. Added in B16's
    // per-template measurement, which found this template at claimFree = 0.
    { title: "The loop is one number", body: `Write $f$ for the loop factor: a balance $b$ sent round the circle comes back as $B=b\\,f$, and quotes that are consistent with one another have $f=1$ exactly. Each leg multiplies your holding by its quoted rate, and the units cancel round the circle: dollars to euros to yen and back to dollars. So the whole trip multiplies the starting balance by the product of the three rates, and nothing else about the path matters.` },
    { title: "Multiply the rates", body: `$${fmtNum(p.r1)}\\times${fmtNum(p.r2)}\\times${fmtNum(p.r3)}=${fmtNum(d.factor)}$ dollars come back for every dollar sent round.` },
    { title: "Answer", body: `Starting from ${fmtNum(p.start)} dollars, $${fmtNum(p.start)}\\times${fmtNum(p.r1)}\\times${fmtNum(p.r2)}\\times${fmtNum(p.r3)}=${fmtNum(d.answer)}$ dollars come back.` },
    { title: "Which way to go round", body: `The loop factor is ${d.factor > 1 ? "above" : "below"} one, at ${fmtNum(d.perDollar)} of profit per dollar sent ${d.factor > 1 ? "this way" : "this way — which is a loss, so the money is in running the circle in reverse, where every rate is replaced by its reciprocal and the factor inverts"}.` },
    { title: "Sanity check", body: `Consistent quotes would have the three rates multiply to exactly one, because the round trip would return you to where you began. The distance of ${fmtNum(d.factor)} from one is the whole mispricing, and it is independent of the size traded — which is why an arbitrage of this shape is limited only by the size the quotes are good for.` },
  ],
  keyInsight: "A closed loop of quotes is a single multiplication, and consistency means that product is exactly one. Anything else is a free lunch whose size scales linearly with the amount put through it, and the direction to trade is decided by which side of one the product falls.",
  commonTrap: "Inverting a leg. Each quote has to be read in the units the trade actually consumes, and a rate quoted per euro used as if it were per dollar produces a plausible-looking number that is wrong by a factor of the rate squared.",
  expectedPaceS: 65,
  verify: { method: "brute-force" },
  constants: [1],
};
