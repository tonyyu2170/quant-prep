import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Every candidate route is compared as a SQUARED length, which is an integer, and the square
// root is taken exactly once at the end. Comparing the roots instead would put three rounded
// irrationals into the chain and the printed-precision gate would be reconciling noise.
export const spiderAndFlyBox: ProblemTemplate = {
  id: "brainteasers/spider-and-fly-box",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "jane-street", weight: 0.3 }, { firm: "optiver", weight: 0.25 }, { firm: "sig", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "spider and fly on opposite corners of a room; the surface path found by unfolding" },
  params: {
    a: { range: { min: 2, max: 15, step: 1 } },
    b: { range: { min: 2, max: 15, step: 1 } },
    c: { range: { min: 2, max: 15, step: 1 } },
  },
  constraint: (p) => p.a <= p.b && p.b <= p.c,
  derived: (p) => {
    // The three ways to flatten a pair of adjacent faces into one plane. Each pairs one edge
    // against the sum of the other two; which one wins is NOT fixed by a <= b <= c.
    const sqAB = (p.a + p.b) ** 2 + p.c ** 2;
    const sqAC = (p.a + p.c) ** 2 + p.b ** 2;
    const sqBC = (p.b + p.c) ** 2 + p.a ** 2;
    const best = Math.min(sqAB, sqAC, sqBC);
    return {
      sqAB, sqAC, sqBC, best,
      sumAB: p.a + p.b, sumAC: p.a + p.c, sumBC: p.b + p.c,
      overTheTop: p.a + p.b + p.c,
      answer: Math.round(Math.sqrt(best) * 1e9) / 1e9,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p) =>
    `A room measures ${fmtNum(p.a)} by ${fmtNum(p.b)} by ${fmtNum(p.c)} metres. A spider sits in one corner and a fly rests in the corner diagonally opposite, ` +
    `as far from the spider as the room allows. The spider cannot fly or drop through the air — it can only walk, across the floor, the walls and the ceiling. ` +
    `How far must it walk, in metres, by the shortest route?`,
  solution: (p, d) => [
    {
      title: "The straight line through the air is not available",
      body: `The spider is confined to the surface, so the diagonal of the room is a lower bound it cannot reach. The route must cross from one face onto a neighbouring face, and the question is where to cross and which pair of faces to use.`,
    },
    {
      title: "Flatten the two faces and the path becomes straight",
      body: `Cut along the edge the spider crosses and fold the second face into the plane of the first. Walking distance is unchanged by the fold, and once both faces lie flat the shortest route between two points in a plane is the straight segment joining them. So each choice of face-pair gives one candidate, and its length is a plain hypotenuse: $\\sqrt{(x+y)^2+z^2}$, where $z$ is the edge crossed head-on and $x$ and $y$ are the two that lay end to end.`,
    },
    {
      title: "There are three ways to fold, so three candidates",
      body: `Pairing the ${fmtNum(p.a)} and ${fmtNum(p.b)} edges end to end against the ${fmtNum(p.c)} gives $(${fmtNum(p.a)}+${fmtNum(p.b)})^2+${fmtNum(p.c)}^2=${fmtNum(d.sqAB)}$. Pairing ${fmtNum(p.a)} with ${fmtNum(p.c)} against ${fmtNum(p.b)} gives $(${fmtNum(p.a)}+${fmtNum(p.c)})^2+${fmtNum(p.b)}^2=${fmtNum(d.sqAC)}$. Pairing ${fmtNum(p.b)} with ${fmtNum(p.c)} against ${fmtNum(p.a)} gives $(${fmtNum(p.b)}+${fmtNum(p.c)})^2+${fmtNum(p.a)}^2=${fmtNum(d.sqBC)}$.`,
    },
    {
      title: "Take the smallest, then the root",
      body: `Comparing squares settles the order without ever taking a root, and the smallest of the three is ${fmtNum(d.best)}. The distance is $\\sqrt{${fmtNum(d.best)}}=${fmtNum(d.answer)}$ metres.`,
    },
    {
      title: "Sanity check",
      body: `Going straight up and over — along one edge, then another, then the third — costs ${fmtNum(p.a)}+${fmtNum(p.b)}+${fmtNum(p.c)}=${fmtNum(d.overTheTop)} metres, and ${fmtNum(d.answer)} comes in under that, as any unfolded straight line must against the bent path with the same endpoints. It also exceeds the longest single edge, ${fmtNum(p.c)}, since the spider has to cover the other two directions as well.`,
    },
  ],
  keyInsight: "Unfolding converts a constrained walk on a bent surface into an unconstrained straight line in a plane, because folding preserves distance along the surface. Once flat, the shortest path is the hypotenuse of a right triangle whose legs are one edge and the sum of the other two.",
  commonTrap: "Assuming the shortest fold is always the one pairing the two smallest edges. Which candidate wins depends on the actual numbers, not on the ordering — the squared lengths sort differently as the box gets long and thin, so all three have to be computed and compared.",
  expectedPaceS: 90,
  verify: { method: "brute-force" },
  constants: [2],
};
