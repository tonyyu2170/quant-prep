import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Two pair on a reduced deck, checked against the full house counted independently.
// The pair ranks are chosen as a set while the full house's trip and pair ranks are
// chosen in order — the contrast is the lesson, and the ranking it implies (two pair
// strictly likelier) is what the Sanity check tests.
export const twoPairVsFullHouse: ProblemTemplate = {
  id: "counting/two-pair-vs-full-house",
  version: 1,
  topic: "probability/counting",
  difficulty: 3,
  firms: [{ firm: "sig", weight: 0.35 }, { firm: "jane-street", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "comparative hand counts on a variable reduced deck: two pair against a full house" },
  params: {
    ranks: { range: { min: 4, max: 9, step: 1 } },
    suits: { range: { min: 3, max: 6, step: 1 } },
  },
  // The deck cap keeps the Python deal enumeration under a hundred thousand hands;
  // three suits or more is what makes a full house possible at all, so the
  // comparison in the Sanity check has something to compare against.
  constraint: (p) => p.ranks * p.suits <= 28 && p.ranks * p.suits >= 12,
  derived: (p) => {
    const choose = (m: number, j: number) => {
      let num = 1;
      for (let i = 0; i < j; i++) num *= m - i;
      let den = 1;
      for (let i = 2; i <= j; i++) den *= i;
      return num / den;
    };
    const deck = p.ranks * p.suits;
    const hands = choose(deck, 5);
    const rankPairs = choose(p.ranks, 2);
    const pairSuits = choose(p.suits, 2);
    const oddRanks = p.ranks - 2;
    const twoPairCount = rankPairs * pairSuits * pairSuits * oddRanks * p.suits;
    const tripSuits = choose(p.suits, 3);
    const fullCount = p.ranks * tripSuits * (p.ranks - 1) * pairSuits;
    return {
      deck,
      hands,
      rankPairs,
      pairSuits,
      suitsSquared: pairSuits * pairSuits,
      oddRanks,
      oddCards: oddRanks * p.suits,
      twoPairCount,
      twoPairProb: twoPairCount / hands,
      tripSuits,
      ranksLess1: p.ranks - 1,
      fullCount,
      fullProb: fullCount / hands,
      ratio: twoPairCount / fullCount,
    };
  },
  statement: (p, d) =>
    `A card game uses a reduced deck: each of ${fmtNum(p.ranks)} ranks appears once in every one of ${fmtNum(p.suits)} suits, for ${fmtNum(d.deck)} cards. A player is dealt 5 cards at random. ` +
    `What is the probability of being dealt two pair — two cards of one rank, two of a second rank, and a fifth card of some third rank?`,
  answerKey: "twoPairProb",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Deals are unordered and equally likely, so the probability is a ratio of counts over $\\binom{${fmtNum(d.deck)}}{5}=${fmtNum(d.hands)}$ hands.` },
    { title: "Choose the two paired ranks together", body: `The two pairs play identical roles in the hand, so pick them as a set: $\\binom{${fmtNum(p.ranks)}}{2}=${fmtNum(d.rankPairs)}$ ways. Each pair then needs two of its ${fmtNum(p.suits)} suits, $\\binom{${fmtNum(p.suits)}}{2}=${fmtNum(d.pairSuits)}$ ways apiece, so ${fmtNum(d.suitsSquared)} suit choices between them.` },
    { title: "Add the odd card and divide", body: `The fifth card must miss both paired ranks: ${fmtNum(d.oddRanks)} ranks left, any of the ${fmtNum(p.suits)} suits, so ${fmtNum(d.oddCards)} cards qualify. Multiplying, $${fmtNum(d.rankPairs)}\\times${fmtNum(d.suitsSquared)}\\times${fmtNum(d.oddCards)}=${fmtNum(d.twoPairCount)}$ hands, and the probability is $${fmtNum(d.twoPairCount)}/${fmtNum(d.hands)}=${fmtNum(d.twoPairProb)}$.` },
    { title: "Sanity check", body: `Count a full house on the same deck, where the two ranks play different roles and are therefore chosen in order: the tripled rank in ${fmtNum(p.ranks)} ways with $\\binom{${fmtNum(p.suits)}}{3}=${fmtNum(d.tripSuits)}$ suit choices, then the paired rank in ${fmtNum(d.ranksLess1)} ways with ${fmtNum(d.pairSuits)} suit choices, giving ${fmtNum(d.fullCount)} hands and probability ${fmtNum(d.fullProb)}. A full house needs three cards of one rank where two pair needs only two, so it must be the rarer hand — and two pair comes out ${fmtNum(d.ratio)} times as likely.` },
  ],
  keyInsight: "Whether a choice is made as a set or in order is decided by the hand, not by taste: ranks that play interchangeable roles must be chosen together, while ranks whose roles differ are chosen one after another.",
  commonTrap: "Picking the first paired rank and then the second, which builds every two-pair hand twice — once for each order of its two ranks — and doubles the count.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [2, 3, 5],
};
