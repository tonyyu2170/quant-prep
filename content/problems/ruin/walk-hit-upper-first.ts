import type { Params, ProblemTemplate } from "@qp/engine";
import { fmtNum, complementGrades } from "../util";

// A walk from 0 with barriers at -b and +a is the standard ruin chain shifted by b: capital
// starts at b out of a+b total, so P(touch +a first) = b/(a+b). `constraint` never sees
// `derived` (packages/engine/src/problem.ts:24), so the band is asked through this helper.
const upperFirstOf = (p: Params) => p.downBarrier / (p.upBarrier + p.downBarrier);

export const walkHitUpperFirst: ProblemTemplate = {
  id: "ruin/walk-hit-upper-first",
  version: 1,
  topic: "probability/ruin",
  difficulty: 1,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "jump", weight: 0.3 }],
  source: { kind: "original", inspiration: "symmetric random walk hitting which barrier first" },
  params: {
    upBarrier: { range: { min: 2, max: 14, step: 1 } },
    downBarrier: { range: { min: 2, max: 14, step: 1 } },
  },
  constraint: (p) => upperFirstOf(p) >= 0.01 && upperFirstOf(p) <= 0.99 && !complementGrades(upperFirstOf(p)),
  derived: (p) => {
    const total = p.upBarrier + p.downBarrier;
    const frac = p.downBarrier / total;
    const mirrorFrac = p.upBarrier / total;
    return { total, frac, mirrorFrac };
  },
  statement: (p) =>
    `A market maker's inventory in some name starts at zero and after every trade moves one unit up with probability exactly half or one unit down with probability exactly half. What is the probability that the inventory touches ${fmtNum(p.upBarrier)} units long before it ever touches ${fmtNum(p.downBarrier)} units short?`,
  answerKey: "frac",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => [
    { title: "Setup", body: `Let $g(m)$ be the chance of reaching +${fmtNum(p.upBarrier)} before $-${fmtNum(p.downBarrier)}$ from level $m$. Each move splits evenly, so $g(m)=\\frac{g(m-1)+g(m+1)}{2}$ — the same halfway recursion as any fair game.` },
    { title: "Shift to stacks", body: `Add ${fmtNum(p.downBarrier)} everywhere: define $f(k)=g(k-${fmtNum(p.downBarrier)})$, which turns the barriers into bust-at-$0$ and goal-at-$${fmtNum(d.total)}$ with starting stack $k=${fmtNum(p.downBarrier)}$. The recursion and boundaries carry over unchanged.` },
    { title: "Read off the fair-game line", body: `The straight-line solution gives $f(${fmtNum(p.downBarrier)})=\\frac{${fmtNum(p.downBarrier)}}{${fmtNum(d.total)}}=${fmtNum(d.frac)}$ — the starting distance below the top, divided by the whole corridor.` },
    { title: "Answer", body: `The probability of touching +${fmtNum(p.upBarrier)} first is $${fmtNum(d.frac)}$.` },
    { title: "Sanity check", body: `Touching $-${fmtNum(p.downBarrier)}$ first is the only other ending, with probability $\\frac{${fmtNum(p.upBarrier)}}{${fmtNum(d.total)}}=${fmtNum(d.mirrorFrac)}$, and $${fmtNum(d.frac)}+${fmtNum(d.mirrorFrac)}=${fmtNum(1)}$ — a symmetric walk must eventually leave the corridor through one side or the other.` },
  ],
  keyInsight: "Shifting a two-barrier random-walk question into gambler's-ruin coordinates makes it a fair-share ratio: your distance from the lower barrier over the full width of the corridor.",
  commonTrap: "Arguing about the order or timing of ticks — for a symmetric walk only the distances to the two barriers matter, never the path taken between them.",
  expectedPaceS: 45,
  verify: { method: "brute-force" },
  constants: [0, 1, 2],
};
