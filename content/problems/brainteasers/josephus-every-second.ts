import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Josephus with every second person removed: the survivor is fixed by how far the count sits
// above the largest power of two below it. The doubling argument is the point — once the ring
// is down to a power of two and the person about to be skipped is at the front, that person
// survives, because each full lap halves a ring whose size stays a power of two.
export const josephusEverySecond: ProblemTemplate = {
  id: "brainteasers/josephus-every-second",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "sig", weight: 0.25 }, { firm: "hrt", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "Josephus problem at step two, via the power-of-two survivor rule" },
  params: {
    n: { range: { min: 12, max: 80, step: 1 } },
    first: { range: { min: 1, max: 12, step: 1 } },
  },
  derived: (p) => {
    const power = 2 ** Math.floor(Math.log2(p.n));   // largest power of two at or below the ring size
    const excess = p.n - power;
    const last = p.first + p.n - 1;
    const secondBadge = p.first + 1;   // the first badge removed — printed, so it must be derived
    return { power, excess, last, secondBadge, twiceExcess: 2 * excess, answer: p.first + 2 * excess };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `${fmtNum(p.n)} people stand in a circle, wearing badges numbered consecutively from ${fmtNum(p.first)} up to ${fmtNum(d.last)} as you go round. ` +
    `Starting at badge ${fmtNum(p.first)}, they count off around the ring and every second person is removed: badge ${fmtNum(d.secondBadge)} goes first, then the next person still standing after that, and so on, lap after lap, always skipping one survivor and removing the next. ` +
    `The circle closes up as people leave and the counting never pauses. Which badge number is the last one left standing?`,
  solution: (p, d) => [
    { title: "Find the power of two underneath the ring size", body: `Write the ring size as a power of two plus a remainder: $${fmtNum(d.power)}+${fmtNum(d.excess)}=${fmtNum(p.n)}$, where ${fmtNum(d.power)} is the largest power of two that does not exceed ${fmtNum(p.n)}.` },
    { title: "Why a power of two is the position to reach", body: `Suppose the ring holds exactly a power of two people and the count is about to skip the person at the front. One full lap removes every second person, halving the ring — and it leaves the count once again about to skip that same person, with a ring that is still a power of two. Repeating, the ring halves down to a single person, and that person is the one who was at the front. So whoever the count is about to skip when the ring first reaches a power of two is the survivor.` },
    { title: "Count the removals it takes to get there", body: d.excess === 0
        ? `Here the ring is already a power of two, so there is nothing to strip away first — the count begins with badge ${fmtNum(p.first)} about to be skipped, which is exactly the position the argument above says survives.`
        : `Reducing ${fmtNum(p.n)} people to ${fmtNum(d.power)} takes ${fmtNum(d.excess)} removals. Each removal consumes two badges of the original circle — one skipped, one removed — so those ${fmtNum(d.excess)} removals eat the first ${fmtNum(d.twiceExcess)} people in the starting order, and the count then arrives about to skip the very next one.` },
    { title: "Answer", body: d.excess === 0
        ? `The survivor is badge ${fmtNum(p.first)} itself, the badge the count was about to skip when it started.`
        : `Counting ${fmtNum(d.twiceExcess)} places on from badge ${fmtNum(p.first)} lands on $${fmtNum(p.first)}+${fmtNum(d.twiceExcess)}=${fmtNum(d.answer)}$, which is the badge still standing at the end.` },
    { title: "Sanity check", body: `The rule always names a badge an even number of places past the start, so with the ring beginning at badge ${fmtNum(p.first)} the survivor shares its parity — and it never runs past badge ${fmtNum(d.last)}, since ${fmtNum(d.twiceExcess)} is below ${fmtNum(p.n)} whenever the excess is under half the ring, which is what being above the largest power of two guarantees.` },
  ],
  keyInsight: "A process that shrinks a ring is easiest to solve at the size where it becomes self-similar. Halving is exact only when the size is a power of two, so the work is to count how many removals reach that size and then read where the pointer has got to.",
  commonTrap: "Assuming the survivor is roughly opposite the start, or scaling the answer with the ring size. It is governed by the distance above the nearest power of two, so one extra person in the circle moves the survivor two badges, while crossing a power of two throws it back to the start.",
  expectedPaceS: 110,
  verify: { method: "brute-force" },
  constants: [],
};
