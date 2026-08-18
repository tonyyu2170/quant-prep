import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Hand probability on a reduced deck: build the pair, then the three off-ranks.
// The Sanity check prices the disjoint no-repeat hand and adds the two — hands with
// two pair or better keep the sum strictly under certainty, so an overcounted
// numerator (the classic ordered-pair slip) breaks the inequality.
export const onePairReducedDeck: ProblemTemplate = {
  id: "counting/one-pair-reduced-deck",
  version: 1,
  topic: "probability/counting",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.35 }, { firm: "citadel-securities", weight: 0.3 }],
  source: { kind: "textbook", inspiration: "classic exactly-one-pair poker count, moved onto a variable reduced deck" },
  params: {
    ranks: { range: { min: 5, max: 14, step: 1 } },
    suits: { range: { min: 2, max: 6, step: 1 } },
  },
  // The deck cap keeps the Python enumeration of every hand under a hundred
  // thousand; the floor keeps the deck comfortably larger than the hand, so the
  // off-ranks are a real choice rather than a forced one.
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
    const pairSuits = choose(p.suits, 2);
    const otherRanks = choose(p.ranks - 1, 3);
    const suitChoices = Math.pow(p.suits, 3);
    const favourable = p.ranks * pairSuits * otherRanks * suitChoices;
    const rankSets = choose(p.ranks, 5);
    const suitFive = Math.pow(p.suits, 5);
    const noRepeat = rankSets * suitFive;
    const prob = favourable / hands;
    const allDistinct = noRepeat / hands;
    return {
      deck,
      hands,
      pairSuits,
      ranksLess1: p.ranks - 1,
      otherRanks,
      suitChoices,
      favourable,
      prob,
      rankSets,
      suitFive,
      noRepeat,
      allDistinct,
      pairOrDistinct: prob + allDistinct,
    };
  },
  statement: (p, d) =>
    `A card game uses a reduced deck: every one of ${fmtNum(p.ranks)} ranks appears once in each of ${fmtNum(p.suits)} suits, so the deck holds ${fmtNum(d.deck)} cards. ` +
    `A player is dealt 5 of them at random. What is the probability the hand holds exactly one pair — two cards sharing a rank, and three further cards whose ranks are all different from each other and from the pair?`,
  answerKey: "prob",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `A deal is an unordered set of 5 cards and every set is equally likely, so the probability is a ratio of counts: $\\binom{${fmtNum(d.deck)}}{5}=${fmtNum(d.hands)}$ hands in all.` },
    { title: "Build the pair", body: `Pick the rank that repeats, ${fmtNum(p.ranks)} ways, then which two of its ${fmtNum(p.suits)} suits are in the hand, $\\binom{${fmtNum(p.suits)}}{2}=${fmtNum(d.pairSuits)}$ ways.` },
    { title: "Build the three off cards", body: `Their ranks must be three different ranks, none of them the paired rank: $\\binom{${fmtNum(d.ranksLess1)}}{3}=${fmtNum(d.otherRanks)}$ ways to choose the set of three, and each of the three then takes any of the ${fmtNum(p.suits)} suits, $${fmtNum(p.suits)}^3=${fmtNum(d.suitChoices)}$ ways. Choosing the ranks as a set, not in order, is what stops the same hand being built several times.` },
    { title: "Multiply and divide", body: `Favourable hands: $${fmtNum(p.ranks)}\\times${fmtNum(d.pairSuits)}\\times${fmtNum(d.otherRanks)}\\times${fmtNum(d.suitChoices)}=${fmtNum(d.favourable)}$, so the probability is $${fmtNum(d.favourable)}/${fmtNum(d.hands)}=${fmtNum(d.prob)}$.` },
    { title: "Sanity check", body: `Price a hand with no repeated rank at all: choose which five ranks show up, $\\binom{${fmtNum(p.ranks)}}{5}=${fmtNum(d.rankSets)}$, and a suit for each, $${fmtNum(p.suits)}^5=${fmtNum(d.suitFive)}$, giving ${fmtNum(d.noRepeat)} hands and probability ${fmtNum(d.allDistinct)}. That event and exactly one pair cannot both happen, and they do not exhaust the deal — two pair, trips and better are still out there — so the two probabilities must add to strictly less than 1: $${fmtNum(d.prob)}+${fmtNum(d.allDistinct)}=${fmtNum(d.pairOrDistinct)}$.` },
  ],
  keyInsight: "Hand counts are built feature by feature — first which rank repeats, then which suits realise it, then the ranks and suits of the rest — and each feature is chosen as an unordered set exactly when the hand cannot tell its members apart.",
  commonTrap: "Choosing the three off cards one rank at a time and multiplying, which orders three interchangeable cards and inflates the count by the number of ways to arrange them.",
  expectedPaceS: 100,
  verify: { method: "brute-force" },
  constants: [1, 2, 3, 5],
};
