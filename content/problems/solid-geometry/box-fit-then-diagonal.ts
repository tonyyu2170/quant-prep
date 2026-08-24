import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const boxFitThenDiagonal: ProblemTemplate = {
  id: "solid-geometry/box-fit-then-diagonal",
  version: 1,
  topic: "pure-math/solid-geometry",
  difficulty: 3,
  firms: [{ firm: "jane-street", weight: 0.25 }, { firm: "hrt", weight: 0.2 }, { firm: "de-shaw", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "recovering a missing edge from a volume, then the space diagonal" },
  params: {
    edgeA: { choices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20] },
    edgeB: { choices: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 21, 24] },
    edgeC: { choices: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20, 21, 24, 30, 36] },
    wanted: { choices: [1, 2] },
  },
  constraint: (p) => p.edgeA < p.edgeB && p.edgeB < p.edgeC && p.edgeA * p.edgeB * p.edgeC <= 4000,
  derived: (p) => {
    const round = (x: number) => Math.round(x * 1e9) / 1e9;
    const sumSquares = p.edgeA * p.edgeA + p.edgeB * p.edgeB + p.edgeC * p.edgeC;
    return {
      volume: p.edgeA * p.edgeB * p.edgeC,
      faceArea: p.edgeA * p.edgeB,
      squareA: p.edgeA * p.edgeA,
      squareB: p.edgeB * p.edgeB,
      squareC: p.edgeC * p.edgeC,
      sumSquares,
      diagonal: round(Math.sqrt(sumSquares)),
      answer: p.wanted === 1 ? round(Math.sqrt(sumSquares)) : p.edgeC,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { rel: 0.005 } },
  statement: (p, d) =>
    `A crate holds ${fmtNum(d.volume)} cubic centimetres. Its base measures ${fmtNum(p.edgeA)} by ` +
    `${fmtNum(p.edgeB)} centimetres. ` +
    `${p.wanted === 1 ? `What is the length of the longest straight rod that fits inside it, in centimetres? (The rod may pass through the air, corner to corner.)` : `How tall is it, in centimetres?`}`,
  solution: (p, d) => [
    { title: "Recover the missing edge first", body: `A box's capacity is its three edges multiplied together, so dividing the capacity by the base area leaves the height alone. Nothing about the diagonal can be attempted until that edge is known.` },
    { title: "The height", body: `The base covers $${fmtNum(p.edgeA)}\\times${fmtNum(p.edgeB)}=${fmtNum(d.faceArea)}$ square centimetres, so the height is $\\dfrac{${fmtNum(d.volume)}}{${fmtNum(d.faceArea)}}=${fmtNum(p.edgeC)}$ centimetres.` },
    { title: "Pythagoras, applied twice", body: `The longest rod runs corner to opposite corner through the air. Its length is found by taking the diagonal across the base and then combining that with the height — two right triangles, which collapse to adding all three squared edges: $${fmtNum(d.squareA)}+${fmtNum(d.squareB)}+${fmtNum(d.squareC)}=${fmtNum(d.sumSquares)}$.` },
    { title: "Answer", body: `${p.wanted === 1 ? `The rod measures $\\sqrt{${fmtNum(d.sumSquares)}}\\approx${fmtNum(d.diagonal)}$ centimetres. The root is irrational here, so the figure is an approximation — the sum of squares above it is exact.` : `The crate is ${fmtNum(p.edgeC)} centimetres tall.`}` },
    { title: "Sanity check", body: `The rod must be longer than any single edge and longer than the base's own diagonal, since it adds the height on top of that: $${fmtNum(d.diagonal)}>${fmtNum(p.edgeC)}$. It must also be shorter than the three edges laid end to end, which a straight line through the box always is.` },
  ],
  keyInsight: "The space diagonal adds the squares of all three edges, because the two Pythagorean steps compose into one. And a capacity plus a base area determines the third edge outright, which is what lets a single volume figure unlock a length.",
  commonTrap: "Adding the three edges rather than their squares, which describes a path along the box rather than through it. The other slip is stopping at the base diagonal and forgetting the height entirely.",
  expectedPaceS: 130,
  verify: { method: "brute-force" },
  constants: [],
};
