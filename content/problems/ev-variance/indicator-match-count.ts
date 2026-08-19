import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Linearity of expectation over dependent indicators: the coat-check problem restricted to
// a subgroup, so the answer varies instead of collapsing to the famous single match. The
// Sanity check reaches the per-guest chance by counting orderings rather than by symmetry.
export const indicatorMatchCount: ProblemTemplate = {
  id: "ev-variance/indicator-match-count",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "two-sigma", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "the coat-check matching problem, asked about a subgroup of the guests rather than all of them" },
  params: {
    guests: { range: { min: 4, max: 8, step: 1 } },
    friends: { range: { min: 2, max: 7, step: 1 } },
  },
  // friends <= guests - 1 keeps the group a strict part of the party, which is what makes
  // the answer vary and keeps the commonTrap — quoting the whole-party average of one — wrong
  // on every draw. The group starts at two so the prose never reads "1 friends".
  // The party caps at eight because brute() enumerates every ordering: 8! = 40320 atoms,
  // inside the enumeration limit. Constraint 2's floor cannot bind — the answer is
  // friends/guests, which runs [0.25, 0.875] over the legal space.
  constraint: (p) => p.friends <= p.guests - 1,
  derived: (p) => {
    const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
    return {
      perGuest: 1 / p.guests,
      others: p.guests - 1,
      waysFixed: fact(p.guests - 1),
      waysAll: fact(p.guests),
      ev: p.friends / p.guests,
    };
  },
  statement: (p) =>
    `A party of ${fmtNum(p.guests)} guests each check one coat. The attendant loses the tags and hands the ${fmtNum(p.guests)} coats ` +
    `back in a completely random order, one per guest. Among the guests is a group of ${fmtNum(p.friends)} friends who arrived together. ` +
    `What is the expected number of that group who get their own coat back?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Every ordering of the coats is equally likely, so from any one guest's point of view the coat handed back is equally likely to be any of the ${fmtNum(p.guests)}. Exactly one of those is their own, so a given guest matches with probability $\\frac{1}{${fmtNum(p.guests)}}=${fmtNum(d.perGuest)}$.` },
    { title: "Turn the tally into indicators", body: `Write the group's tally as a sum of indicators, one per friend, each worth one if that friend gets their own coat. The friends' outcomes are tangled together — one friend taking their own coat changes what is left for everyone else — but expectations add regardless, so none of that tangle has to be untangled.` },
    { title: "Add them up", body: `Each of the ${fmtNum(p.friends)} friends carries the same chance, so the expected number of matches in the group is $\\frac{${fmtNum(p.friends)}}{${fmtNum(p.guests)}}=${fmtNum(d.ev)}$.` },
    // Printed as one fraction of exact integers: multiplying the rounded per-guest chance by
    // the group size drifts off the printed answer wherever guests does not divide cleanly.
    { title: "Sanity check", body: `Get the per-guest chance a second way, by counting orderings rather than arguing from symmetry. Pin one friend's own coat on them and the remaining ${fmtNum(d.others)} coats can still be handed out in $${fmtNum(d.others)}!=${fmtNum(d.waysFixed)}$ ways, out of $${fmtNum(p.guests)}!=${fmtNum(d.waysAll)}$ orderings in all. Across the group that gives $\\frac{${fmtNum(p.friends)}\\times${fmtNum(d.waysFixed)}}{${fmtNum(d.waysAll)}}=${fmtNum(d.ev)}$, the same figure. It also has to land below one, since the whole party averages a single match between them and this group is only part of the party.` },
  ],
  keyInsight: "Expectation adds over a sum of indicators no matter how tangled the pieces are, so a matching count needs only each individual's own chance of a match; the fact that one person's outcome reshapes everybody else's never enters the sum at all.",
  commonTrap: "Quoting the whole party's famous result — that returning everyone's coats at random produces a single match on average — for a group that is only part of the party. The group's share of that average scales with its size, so the true figure lands lower.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [1],
};
