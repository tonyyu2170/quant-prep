import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// No module-local answer helper, and no `constraint` at all: constraint 2 licenses a helper
// only where a floor has to be pinned against the answer, and this floor cannot bind —
// enumerated over the legal space |answer| runs [6.5, 288]. Every combination of sector count
// and rate is a legal problem, so a rule here would reject nothing and read as a check that is
// not one.
// Optimal stopping over three spins, valued backwards. Each stage's value is carried as an
// integer numerator over an explicit power of the sector count, so every chain divides one
// integer by another and no printed decimal is ever an operand — the first-spin value is a
// rational over twice the squared sector count and does not survive being rounded and then
// multiplied by a rate. The Sanity check brackets the answer between the two-spin game and
// the best-of-three that only a clairvoyant could take, both priced from different derived
// keys than the answer.
// Amounts are spelled "dollars" in words — a literal $ is a KaTeX delimiter.
export const twoRerollStoppingValue: ProblemTemplate = {
  id: "ev-variance/two-reroll-stopping-value",
  version: 1,
  topic: "probability/ev-variance",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.4 }, { firm: "citadel-securities", weight: 0.3 }],
  source: { kind: "original", inspiration: "the three-roll optimal stopping game, where each stage's threshold is the value of everything after it" },
  params: {
    sectors: { range: { min: 4, max: 20, step: 1 } },
    rate: { range: { min: 2, max: 20, step: 1 } },
  },
  derived: (p) => {
    const n = p.sectors;
    // The last spin has to be taken as it comes; the stages before it keep a spin only when it
    // beats what spinning again is worth, so each threshold is read off the NEXT stage's value.
    const lastMean = (n + 1) / 2;
    const midLow = Math.floor(lastMean);              // sectors worth rejecting on the second spin
    const midTopSum = (n * (n + 1) - midLow * (midLow + 1)) / 2;
    const midNumer = 2 * midTopSum + midLow * (n + 1); // midValue = midNumer / (2n)
    const midValue = midNumer / (2 * n);
    const topLow = Math.floor(midValue);              // sectors worth rejecting on the first spin
    const topTopSum = (n * (n + 1) - topLow * (topLow + 1)) / 2;
    const topNumer = 2 * n * topTopSum + topLow * midNumer; // topValue = topNumer / (2n^2)
    return {
      lastMean,
      midLow,
      midKeep: midLow + 1,
      midTopSum,
      midNumer,
      midValue,
      topLow,
      topKeep: topLow + 1,
      topTopSum,
      topNumer,
      topValue: topNumer / (2 * n * n),
      evMid: (p.rate * midNumer) / (2 * n),
      bestNumer: 4 * n * n - (n - 1) * (n - 1),
      evBest: (p.rate * (4 * n * n - (n - 1) * (n - 1))) / (4 * n),
      ev: (p.rate * topNumer) / (2 * n * n),
    };
  },
  statement: (p) =>
    `A spinner is divided into ${fmtNum(p.sectors)} equal sectors numbered 1 up to ${fmtNum(p.sectors)}. You spin it and may ` +
    `either stop on the number showing or throw it away and spin again, and you may throw a spin away at most twice, so you ` +
    `get up to three spins in all and the third one has to stand. You are paid ${fmtNum(p.rate)} dollars for each point on ` +
    `the spin you stop at. Playing to make your expected payout as large as possible, what is the game worth, in dollars, ` +
    `before the first spin?`,
  answerKey: "ev",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Start at the end", body: `The last spin cannot be refused, so with no throws left the game is just an untouched spin, worth $\\frac{${fmtNum(p.sectors)}+1}{2}=${fmtNum(d.lastMean)}$ points. Work backwards from there: at every earlier spin, what the remaining spins are worth is exactly the price of walking away, so it is the threshold that decides whether to keep what is showing.` },
    // Both stage values are carried as an integer numerator over an explicit denominator. The
    // second-spin value lands on halves and the first-spin value on sixteenths of a point, and
    // feeding either one back in as a printed decimal drifts off the printed answer.
    { title: "Value the second spin", body: `With one throw still in hand you keep the second spin when it beats ${fmtNum(d.lastMean)} points, so you throw away anything below ${fmtNum(d.midKeep)} — ${fmtNum(d.midLow)} of the sectors — and the rest you take at face value. The sectors you keep total ${fmtNum(d.midTopSum)} points between them, and the ones you throw away are worth the last spin instead, so the second spin is worth $\\frac{2\\times${fmtNum(d.midTopSum)}+${fmtNum(d.midLow)}\\times(${fmtNum(p.sectors)}+1)}{2\\times${fmtNum(p.sectors)}}=${fmtNum(d.midValue)}$ points.` },
    { title: "Value the first spin", body: `Now the bar is higher, because throwing the first spin away no longer buys a plain spin — it buys the second-spin game, which carries a throw of its own. So the first spin is kept only when it beats ${fmtNum(d.midValue)} points, and anything below ${fmtNum(d.topKeep)} goes back. Those ${fmtNum(d.topLow)} sectors are worth ${fmtNum(d.midValue)} points each and the ${fmtNum(d.topTopSum)} points on the sectors you keep stand as they are, giving $\\frac{2\\times${fmtNum(p.sectors)}\\times${fmtNum(d.topTopSum)}+${fmtNum(d.topLow)}\\times${fmtNum(d.midNumer)}}{2\\times${fmtNum(p.sectors)}\\times${fmtNum(p.sectors)}}=${fmtNum(d.topValue)}$ points.` },
    { title: "Price it", body: `At ${fmtNum(p.rate)} dollars a point the game is worth $\\frac{${fmtNum(p.rate)}\\times${fmtNum(d.topNumer)}}{2\\times${fmtNum(p.sectors)}\\times${fmtNum(p.sectors)}}=${fmtNum(d.ev)}$ dollars before the first spin.` },
    { title: "Sanity check", body: `Bracket it. Dropping one of the two throws leaves the second-spin game, which the same rate prices at $\\frac{${fmtNum(p.rate)}\\times${fmtNum(d.midNumer)}}{2\\times${fmtNum(p.sectors)}}=${fmtNum(d.evMid)}<${fmtNum(d.ev)}$ dollars — an option you are allowed to decline cannot make the game worse. At the other end, someone who could see all three spins in advance and take the best of them would collect $${fmtNum(d.ev)}<\\frac{${fmtNum(p.rate)}\\times(4\\times${fmtNum(p.sectors)}\\times${fmtNum(p.sectors)}-(${fmtNum(p.sectors)}-1)\\times(${fmtNum(p.sectors)}-1))}{4\\times${fmtNum(p.sectors)}}=${fmtNum(d.evBest)}$ dollars, and having to decide before seeing what comes next is exactly what the gap between those two figures costs.` },
  ],
  keyInsight: "Solve it from the last spin backwards. What everything after this spin is worth is precisely the price of throwing the current one away, so that value — not the spinner's average — is what the current spin has to beat. Because each stage is worth strictly more than the stage behind it, the figure being compared against climbs as spins are added, and the number in front of you is never measured against an ordinary spin except on the very last decision.",
  commonTrap: "Valuing the game as the average of the best of the three spins, as though all three could be seen before one was chosen. Every decision here is made blind to what comes next, and that is strictly worse than choosing with hindsight — the gap between the two figures is precisely what committing early costs, and it is never zero.",
  expectedPaceS: 120,
  verify: { method: "brute-force" },
  // 1 is the lowest sector and the offset in an untouched spin's average; 2 is the halving in
  // that average and the two spins the first-spin value is spread over; 4 is the divisor in
  // the best-of-three figure the Sanity check brackets against.
  constants: [1, 2, 4],
};
