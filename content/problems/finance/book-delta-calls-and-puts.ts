import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Every operand is exact by construction — a two-decimal delta times a whole number of contracts
// — so nothing here needs licensing. What the draw needs is a floor on |answer|: a book can net
// to exactly zero delta ((n+m)·D = m), and zero is a fixed point of the relative perturbation
// verify.py's mutation check uses, so such a draw would ship a checker that cannot fail.
// The put's delta is negative and is printed through fmtNum with its own parentheses inside a
// chain; no minus sign is ever typed by hand, because emit's tokenizer is sign-blind.
export const bookDeltaCallsAndPuts: ProblemTemplate = {
  id: "finance/book-delta-calls-and-puts",
  version: 1,
  topic: "finance/options",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "the net delta of a mixed book, with the put's delta from parity" },
  params: {
    calls: { choices: [10, 20, 25, 30, 40, 50, 60, 80, 100] },
    puts: { choices: [10, 15, 20, 25, 30, 40, 50, 60, 80, 100] },
    delta: { range: { min: 0.25, max: 0.75, step: 0.05 } },
  },
  constraint: (p) => Math.abs((p.calls + p.puts) * p.delta - p.puts) >= 1,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    return {
      putDelta: round(p.delta - 1),
      callLeg: round(p.calls * p.delta),
      putLeg: round(p.puts * (p.delta - 1)),
      answer: round((p.calls + p.puts) * p.delta - p.puts),
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `Your book is long ${fmtNum(p.calls)} call options and long ${fmtNum(p.puts)} put options, each on one share, all at the same strike and expiry, on a stock that pays no dividend. The call's delta is ${fmtNum(p.delta)}. ` +
    `What is the net delta of the book, in shares? Give a negative number if the book is short delta.`,
  solution: (p, d) => [
    // Claim-free segments (non-negotiable 6): symbolic only, no printed operands.
    { title: "The put's delta comes from parity", body: `Parity says $C-P=S-K\\,\\text{DF}$, and the strike leg does not move with the share, so differentiating in the share price leaves, writing $D$ for a delta, $D_P=D_C-1$. A put's delta is the matching call's less one — always negative, and no model is needed to say so.` },
    { title: "Put the number in", body: `$${fmtNum(p.delta)}-1=${fmtNum(d.putDelta)}$ per put.` },
    { title: "The two legs", body: `The calls contribute $${fmtNum(p.calls)}\\times${fmtNum(p.delta)}=${fmtNum(d.callLeg)}$ and the puts $${fmtNum(p.puts)}\\times(${fmtNum(d.putDelta)})=${fmtNum(d.putLeg)}$ — the puts are long options but short delta.` },
    { title: "Answer", body: `Deltas add: $${fmtNum(p.calls)}\\times${fmtNum(p.delta)}+${fmtNum(p.puts)}\\times(${fmtNum(d.putDelta)})=${fmtNum(d.answer)}$ shares. The book is ${d.answer > 0 ? "long" : "short"} delta, and to flatten it you would ${d.answer > 0 ? "sell" : "buy"} ${fmtNum(Math.abs(d.answer))} shares.` },
    { title: "Sanity check", body: `The calls put ${fmtNum(d.callLeg)} deltas on the book and the puts take ${fmtNum(Math.abs(d.putLeg))} off it, so the sign is decided by which is larger — here the ${d.answer > 0 ? "calls" : "puts"}. The book would be exactly flat only if the call's delta happened to equal the puts' share of the position, and it does not.` },
  ],
  keyInsight: "Deltas add, and a put's delta is the matching call's less one — parity differentiated once. A book of long calls and long puts on one strike therefore nets long or short according to how the call's delta compares with the puts' share of the book, and it is flat exactly when the two balance.",
  commonTrap: "Treating a long put's delta as positive, or taking it to be minus the call's delta rather than the call's delta less one. The two slips push the answer in opposite directions, and both are common under time pressure.",
  expectedPaceS: 75,
  verify: { method: "brute-force" },
  constants: [1],
};
