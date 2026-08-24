import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

export const triangularPrismVolume: ProblemTemplate = {
  id: "solid-geometry/triangular-prism-volume",
  version: 1,
  topic: "pure-math/solid-geometry",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.25 }, { firm: "akuna", weight: 0.2 }, { firm: "optiver", weight: 0.15 }],
  source: { kind: "textbook", inspiration: "volume as cross-section times length" },
  params: {
    legA: { choices: [3, 4, 5, 6, 8, 9, 10, 12] },
    legB: { choices: [4, 5, 6, 7, 8, 10, 12, 14] },
    length: { choices: [7, 9, 11, 12, 15, 18, 20, 25] },
  },
  // An even product keeps the half-base a whole number, so every printed step is exact.
  constraint: (p) => (p.legA * p.legB) % 2 === 0,
  derived: (p) => ({
    rectangle: p.legA * p.legB,
    crossSection: (p.legA * p.legB) / 2,
    // The solid bar the channel was cut from. It exists only so the sanity check can print it:
    // emit audits every number token in the text, and a value computed inline in the prose is
    // traceable to nothing.
    solidBar: p.legA * p.legB * p.length,
    answer: ((p.legA * p.legB) / 2) * p.length,
  }),
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p) =>
    `A steel channel is a prism ${fmtNum(p.length)} centimetres long. Its cross-section is a ` +
    `right triangle with the two shorter sides measuring ${fmtNum(p.legA)} and ${fmtNum(p.legB)} ` +
    `centimetres. What is its volume, in cubic centimetres?`,
  solution: (p, d) => [
    { title: "A prism is its cross-section, dragged", body: `Every slice across a prism is the same shape and the same size, so the volume is that one area multiplied by the length. No integration is needed precisely because nothing changes along the way — the moment the cross-section varies, this shortcut fails and a cone is the reminder.` },
    { title: "Halve the rectangle", body: `A right triangle is half the rectangle on its two shorter sides: $${fmtNum(p.legA)}\\times${fmtNum(p.legB)}=${fmtNum(d.rectangle)}$, so the cross-section is $\\dfrac{${fmtNum(d.rectangle)}}{2}=${fmtNum(d.crossSection)}$ square centimetres.` },
    { title: "Answer", body: `Dragging that along the channel gives $${fmtNum(d.crossSection)}\\times${fmtNum(p.length)}=${fmtNum(d.answer)}$ cubic centimetres.` },
    { title: "Sanity check", body: `The channel must hold less than the solid bar of rectangular section it was cut from, which would be $${fmtNum(d.rectangle)}\\times${fmtNum(p.length)}=${fmtNum(d.solidBar)}$ — exactly twice the answer, since the triangle is exactly half the rectangle. And $${fmtNum(d.answer)}<${fmtNum(d.solidBar)}$ confirms it.` },
  ],
  keyInsight: "Volume is a cross-section times a length whenever the cross-section does not change, which is what makes prisms and cylinders trivial and cones and pyramids not. Recognising which case you are in is the whole of elementary solid geometry.",
  commonTrap: "Using the full rectangle rather than half of it, which doubles the answer. The other slip is treating one of the short sides as the hypotenuse, which is a different triangle with a different area.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [2],
};
