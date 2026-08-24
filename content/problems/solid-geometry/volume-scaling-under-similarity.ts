import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const volumeScalingUnderSimilarity: ProblemTemplate = {
  id: "solid-geometry/volume-scaling-under-similarity",
  version: 1,
  topic: "pure-math/solid-geometry",
  difficulty: 1,
  firms: [{ firm: "optiver", weight: 0.25 }, { firm: "akuna", weight: 0.2 }, { firm: "flow", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "how volume and surface scale under a similarity" },
  params: {
    vol: { choices: [12, 18, 24, 30, 40, 45, 54, 60, 72, 96, 120, 135, 150, 200, 250, 320, 375, 450] },
    factor: { choices: [2, 3, 4, 5, 6, 7, 8, 10] },
    wanted: { choices: [1, 2] },
  },
  constraint: (p) => Math.pow(p.factor, 3) * p.vol <= 1e6,
  derived: (p) => ({
    areaFactor: p.factor * p.factor,
    volFactor: Math.pow(p.factor, 3),
    scaledVol: Math.pow(p.factor, 3) * p.vol,
    answer: p.wanted === 1 ? Math.pow(p.factor, 3) * p.vol : Math.pow(p.factor, 3),
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `A scale model of a tank holds ${fmtNum(p.vol)} litres. The real tank is the same shape ` +
    `throughout, with every length ${fmtNum(p.factor)} times the model's. ` +
    `${p.wanted === 1 ? `How many litres does the real tank hold?` : `By what factor does its capacity exceed the model's?`}`,
  solution: (p, d) => [
    { title: "A capacity is three lengths multiplied together", body: `Scaling every length by $k$ scales each of the three independent directions by $k$, so a volume picks up $k$ three times over. A surface, spanning only two directions, picks it up twice — which is why a scaled-up object gains capacity far faster than it gains skin.` },
    { title: "Cube the length factor", body: `Here that factor is $${fmtNum(p.factor)}\\times${fmtNum(p.factor)}\\times${fmtNum(p.factor)}=${fmtNum(d.volFactor)}$, against only $${fmtNum(p.factor)}\\times${fmtNum(p.factor)}=${fmtNum(d.areaFactor)}$ for the surface.` },
    { title: "Apply it to the model", body: `The real tank holds $${fmtNum(p.vol)}\\times${fmtNum(d.volFactor)}=${fmtNum(d.scaledVol)}$ litres.` },
    { title: "Answer", body: `${p.wanted === 1 ? `The real tank holds ${fmtNum(d.scaledVol)} litres.` : `Its capacity is ${fmtNum(d.volFactor)} times the model's.`}` },
    { title: "Sanity check", body: `Capacity grows faster than surface, so the volume factor must beat the area factor: $${fmtNum(d.volFactor)}>${fmtNum(d.areaFactor)}$. That gap is why a large tank needs proportionally less material per litre, and why a large animal has more trouble shedding heat than a small one.` },
  ],
  keyInsight: "Under a similarity, lengths scale once, areas twice and volumes three times over, and nothing about the shape enters it. That single ratio explains why big containers are cheap per litre and why doubling a creature's size roughly octuples its weight while only quadrupling its bone cross-section.",
  commonTrap: "Scaling the capacity by the length factor once, which answers a question about lengths rather than volumes. The other slip is cubing it for the surface too, when a surface only spans two directions.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [],
};
