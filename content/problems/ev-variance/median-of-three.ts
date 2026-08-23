import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The map k -> s+1-k applied to every spin preserves the joint distribution and sends the
// middle value to s+1-middle, so the median is symmetric about (s+1)/2 — its mean IS that
// midpoint, no summation needed.
//
// The spin count is drawn, and drawing it is the point rather than the padding it looks like.
// The reflection argument never counts the spins: it works for any ODD number of them, and a
// student who has understood it answers a seven-spin draw as fast as a three-spin one. It also
// buys the draw space its third axis — sectors and rate alone give 111 tuples, which serve
// fewer than 70 distinct texts per 100.
export const medianOfThree: ProblemTemplate = {
  id: "ev-variance/median-of-three",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.45 }, { firm: "sig", weight: 0.35 }, { firm: "akuna", weight: 0.3 }],
  source: { kind: "free-resource", inspiration: "expected middle value of three spins, by reflection symmetry" },
  params: {
    sectors: { range: { min: 4, max: 40, step: 1 } },
    rate: { choices: [2, 3, 5] },
    spins: { choices: [3, 5, 7] },
  },
  derived: (p) => {
    const mid = (p.sectors + 1) / 2;
    return { mid, ev: p.rate * mid };
  },
  statement: (p) =>
    `A prize wheel has ${fmtNum(p.sectors)} equal sectors labelled ${fmtNum(1)} through ${fmtNum(p.sectors)}. You spin it ${fmtNum(p.spins)} times, and your ticket pays ${fmtNum(p.rate)} dollars per point showing on the MIDDLE of the ${fmtNum(p.spins)} results — the median, not the best or the worst. What is the ticket worth on average?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Reflect the wheel", body: `Pair every face with its mirror: $k$ pairs with $${fmtNum(p.sectors)}+1-k$. Because the sectors are equally likely and the labels run symmetrically, replacing all ${fmtNum(p.spins)} spin results by their mirrors leaves the joint distribution exactly as it was.` },
    { title: "Track the middle value", body: `Sorting a reflected set of spins just reverses the order, so the middle value $m$ becomes $${fmtNum(p.sectors)}+1-m$. The median's distribution is therefore its own mirror image about the midpoint $\\frac{${fmtNum(p.sectors)}+1}{2}=${fmtNum(d.mid)}$.` },
    { title: "Read off the mean", body: `A distribution balanced about a point has its mean at that point: the expected middle value is $\\frac{${fmtNum(p.sectors)}+1}{2}=${fmtNum(d.mid)}$ — no case table required, and note that the spin count never entered the argument. Any odd number of spins gives the same mean.` },
    { title: "Price the ticket", body: `At ${fmtNum(p.rate)} dollars per point the expected payout is $\\frac{${fmtNum(p.rate)}\\times(${fmtNum(p.sectors)}+1)}{2}=${fmtNum(d.ev)}$ dollars.` },
    { title: "Sanity check", body: `The midpoint sits strictly between the extreme faces ${fmtNum(1)} and ${fmtNum(p.sectors)} — and notice it equals the average of a SINGLE spin. Taking the middle of an odd number of spins leaves the mean untouched; what it shrinks is the spread, which is why best-of-three games pay through stopping rules rather than through the median.` },
  ],
  keyInsight: "Reflecting every spin through the wheel's centre is a distribution-preserving symmetry that turns the median into its own mirror image — so its mean is the centre of the wheel, obtained without summing any case probabilities.",
  commonTrap: "Building the median's full pmf from 'at least half the spins at or below m' and dropping a boundary case — or assuming the middle of three must average higher than one spin, which confuses the median's tighter spread with a shifted mean.",
  expectedPaceS: 105,
  constants: [1, 2],
  verify: { method: "brute-force" },
};
