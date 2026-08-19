import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Linearity of expectation over dependent indicators: the coat-check problem restricted to a
// subgroup, with a payout riding on each match. The subgroup keeps the answer off the famous
// single match; the payout is what gives the space its size, since it multiplies the draw
// count without touching the permutation count brute() has to walk.
// The Sanity check reaches the per-guest chance by counting orderings rather than by symmetry.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const indicatorMatchCount: ProblemTemplate = {
  id: "ev-variance/indicator-match-count",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "the coat-check matching problem, asked about a subgroup of the guests with a payout on each match" },
  params: {
    guests: { range: { min: 4, max: 8, step: 1 } },
    friends: { range: { min: 2, max: 7, step: 1 } },
    bounty: { range: { min: 2, max: 30, step: 1 } }, // at least two so the prose never reads "1 dollars"
  },
  // friends <= guests - 1 keeps the group a strict part of the party, which is what keeps the
  // commonTrap — quoting the whole-party average of one match, and its one payout — wrong on
  // every draw. The group starts at two so the prose never reads "1 friends".
  // The party caps at eight because brute() enumerates every ordering: 8! = 40320 atoms,
  // inside the enumeration limit. The payout carries the draw space instead: 580 legal draws
  // and 123 distinct answers at the grading band, against 20 and 17 without it.
  // Constraint 2's floor cannot bind — |answer| runs [0.5, 26.25] over the legal space.
  constraint: (p) => p.friends <= p.guests - 1,
  derived: (p) => {
    const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
    return {
      perGuest: 1 / p.guests,
      others: p.guests - 1,
      waysFixed: fact(p.guests - 1),
      waysAll: fact(p.guests),
      ev: (p.bounty * p.friends) / p.guests,
    };
  },
  statement: (p) =>
    `A party of ${fmtNum(p.guests)} guests each check one coat. The attendant loses the tags and hands the ${fmtNum(p.guests)} coats ` +
    `back in a completely random order, one per guest. Among the guests is a group of ${fmtNum(p.friends)} friends who arrived together, ` +
    `and they have an arrangement with the host: for each of them who gets their own coat back, the host puts ${fmtNum(p.bounty)} dollars ` +
    `into the group's kitty. What is the expected amount, in dollars, that the kitty collects?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Every ordering of the coats is equally likely, so from any one guest's point of view the coat handed back is equally likely to be any of the ${fmtNum(p.guests)}. Exactly one of those is their own, so a given guest matches with probability $\\frac{1}{${fmtNum(p.guests)}}=${fmtNum(d.perGuest)}$.` },
    { title: "Turn the kitty into indicators", body: `Write the kitty as a sum of one contribution per friend, each worth ${fmtNum(p.bounty)} if that friend gets their own coat and nothing otherwise. The friends' outcomes are tangled together — one friend taking their own coat changes what is left for everyone else — but expectations add regardless, so none of that tangle has to be untangled.` },
    // The group's expected match count is shown as an unevaluated fraction on purpose. Printing
    // it as a decimal and then multiplying by the payout would put a rounded number into the
    // next step, and a reader reconciling the two printed decimals would not always land on the
    // printed answer — the same defect one level up from a single drifting chain.
    { title: "Add them up", body: `Each of the ${fmtNum(p.friends)} friends carries that same chance, so between them the group expects $\\frac{${fmtNum(p.friends)}}{${fmtNum(p.guests)}}$ of a match. Every match is worth ${fmtNum(p.bounty)}, so the expected kitty, in dollars, is $\\frac{${fmtNum(p.bounty)}\\times${fmtNum(p.friends)}}{${fmtNum(p.guests)}}=${fmtNum(d.ev)}$.` },
    { title: "Sanity check", body: `Get the per-guest chance a second way, by counting orderings rather than arguing from symmetry. Pin one friend's own coat on them and the remaining ${fmtNum(d.others)} coats can still be handed out in $${fmtNum(d.others)}!=${fmtNum(d.waysFixed)}$ ways, out of $${fmtNum(p.guests)}!=${fmtNum(d.waysAll)}$ orderings in all. Across the group, with each match worth ${fmtNum(p.bounty)}, that gives $\\frac{${fmtNum(p.bounty)}\\times${fmtNum(p.friends)}\\times${fmtNum(d.waysFixed)}}{${fmtNum(d.waysAll)}}=${fmtNum(d.ev)}$, the same figure. It also has to land below ${fmtNum(p.bounty)}, since the whole party averages a single match between them and this group is only part of the party.` },
  ],
  keyInsight: "Expectation adds straight across a sum of indicator payouts however tangled those indicators are, so a matching problem needs nothing beyond one person's chance of a match and the amount riding on it; that each person's outcome reshapes everyone else's never enters the expected total.",
  commonTrap: "Quoting the whole party's famous result — that handing everyone's coats back at random produces a single match on average — and reporting the single payout that goes with it, for a group that is only part of the party. The group's share of that average shrinks in proportion to its size, so the kitty expects strictly less.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1],
};
