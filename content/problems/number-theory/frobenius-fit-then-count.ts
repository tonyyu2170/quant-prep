import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Licensed module-level helper: `constraint` must reject coin pairs sharing a factor, for which
// no largest unpayable amount exists to quote in the statement. It never sees `derived`.
const gcdOf = (a: number, b: number): number => (b === 0 ? a : gcdOf(b, a % b));

export const frobeniusFitThenCount: ProblemTemplate = {
  id: "number-theory/frobenius-fit-then-count",
  version: 1,
  topic: "pure-math/number-theory",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "sig", weight: 0.2 }, { firm: "drw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "recovering a denomination from the Frobenius number, then counting the gaps" },
  params: {
    coinA: { choices: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
    coinB: { choices: [5, 7, 8, 9, 10, 11, 13, 14, 17, 19, 21, 23, 25, 27, 29] },
    wanted: { choices: [1, 2] },
  },
  constraint: (p) => p.coinA < p.coinB && gcdOf(p.coinA, p.coinB) === 1 && p.coinA * p.coinB - p.coinA - p.coinB >= 10,
  derived: (p) => ({
    largest: p.coinA * p.coinB - p.coinA - p.coinB,
    shifted: p.coinA * p.coinB - p.coinB,
    recovered: p.coinB,
    unpayable: ((p.coinA - 1) * (p.coinB - 1)) / 2,
    answer: p.wanted === 1 ? ((p.coinA - 1) * (p.coinB - 1)) / 2 : p.coinB,
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `A machine takes tokens of exactly two values and gives no change. One value is ` +
    `${fmtNum(p.coinA)}; the other has not been disclosed. The largest total that cannot be ` +
    `assembled from them is ${fmtNum(d.largest)}. ` +
    `${p.wanted === 1 ? "HOW MANY totals in all cannot be assembled?" : "What is the OTHER token's value?"}`,
  solution: (p, d) => [
    { title: "The largest gap names the missing value", body: `For two values sharing no factor above one, the largest unreachable total is their product less each of them. With one value known, that is a single linear equation in the other — so the disclosed gap determines it outright.` },
    { title: "Solve for the missing value", body: `Adding the known value back gives $${fmtNum(d.largest)}+${fmtNum(p.coinA)}=${fmtNum(d.shifted)}$, and that equals the unknown value multiplied by one less than the known one. So the unknown is $\\dfrac{${fmtNum(d.shifted)}}{${fmtNum(p.coinA)}-1}=${fmtNum(d.recovered)}$.` },
    { title: "Count the gaps, do not list them", body: `Below the largest gap the reachable and unreachable totals interleave in a way that pairs each with the other: for every total that cannot be assembled, the largest gap minus it CAN be, and vice versa. That pairing is exact and has no fixed point, so precisely half of the totals from nothing up to the largest gap are unreachable.` },
    { title: "Answer", body: `That half is $\\dfrac{(${fmtNum(p.coinA)}-1)\\times(${fmtNum(d.recovered)}-1)}{2}=${fmtNum(d.unpayable)}$ unreachable totals in all${p.wanted === 1 ? "" : `, and the missing token is worth ${fmtNum(d.recovered)}`}.` },
    { title: "Sanity check", body: `The number of gaps must be below the largest gap itself, since they all fit beneath it: $${fmtNum(d.unpayable)}<${fmtNum(d.largest)}$. The pairing also says it is close to half of it, which it is — the gaps thin out as totals grow, but only just.` },
  ],
  keyInsight: "The unreachable totals pair off exactly with the reachable ones below the largest gap, so counting them needs no enumeration at all. A structure that pairs a set with its complement is the cheapest counting argument there is, and it appears far outside this problem.",
  commonTrap: "Recovering the missing value by dividing the largest gap by the known one, which forgets that each value was subtracted once. The other slip is enumerating the gaps by hand and missing that they thin out unevenly.",
  expectedPaceS: 175,
  verify: { method: "brute-force" },
  constants: [1, 2],
};
