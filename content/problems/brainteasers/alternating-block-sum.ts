import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// The term count is drawn ODD only. With an even count every term pairs off and the leftover
// term — which is the whole point of the question and the thing the trap forgets — never
// appears, so the two parities would need two different solutions printed from one template.
export const alternatingBlockSum: ProblemTemplate = {
  id: "brainteasers/alternating-block-sum",
  version: 1,
  topic: "brainteasers/logic",
  difficulty: 2,
  firms: [{ firm: "optiver", weight: 0.3 }, { firm: "imc", weight: 0.25 }, { firm: "drw", weight: 0.2 }],
  source: { kind: "textbook", inspiration: "alternating sum of an arithmetic run, collapsed by pairing adjacent terms" },
  params: {
    s: { range: { min: 1, max: 40, step: 1 } },
    d: { range: { min: 2, max: 15, step: 1 } },
    n: { range: { min: 7, max: 31, step: 2 } },
  },
  constraint: (p) => p.n % 2 === 1,
  derived: (p) => {
    const pairs = (p.n - 1) / 2;
    const last = p.s + (p.n - 1) * p.d;
    return {
      pairs, last,
      t2: p.s + p.d, t3: p.s + 2 * p.d, t4: p.s + 3 * p.d,
      pairTotal: -p.d * pairs,
      naive: -p.d * ((p.n + 1) / 2),
      answer: -p.d * pairs + last,
    };
  },
  answerKey: "answer",
  accepted: { tolerance: { abs: 0 } },
  statement: (p, d) =>
    `Write out ${fmtNum(p.n)} numbers, starting at ${fmtNum(p.s)} and going up by ${fmtNum(p.d)} each time, so the run reads ${fmtNum(p.s)}, ${fmtNum(d.t2)}, ${fmtNum(d.t3)}, ${fmtNum(d.t4)} and so on up to ${fmtNum(d.last)}. ` +
    `Now combine them with alternating signs — add the first, subtract the second, add the third, and continue that way to the end. What is the total?`,
  solution: (p, d) => [
    {
      title: "Do not add them one at a time",
      body: `Signed terms of a run like this collapse in pairs, because the run climbs by the same step every time. Group the terms from the front: the first with the second, the third with the fourth, and onwards.`,
    },
    {
      title: "Every pair is worth the same",
      body: `A pair is one term minus the next, and the next is always one step higher, so the pair comes to exactly minus the step: $-${fmtNum(p.d)}$. That is true of the first pair, ${fmtNum(p.s)}-${fmtNum(d.t2)}, and of every pair after it, whatever the numbers have grown to.`,
    },
    {
      title: "One term is left over, and it is added",
      body: `With ${fmtNum(p.n)} terms the pairing consumes an even number of them and leaves the last one alone. There are ${fmtNum(d.pairs)} complete pairs, worth $${fmtNum(d.pairs)}\\times(-${fmtNum(p.d)})=${fmtNum(d.pairTotal)}$ together. The stranded term is the largest, ${fmtNum(d.last)}, and since the signs start on a plus and there is an odd number of terms, it carries a plus.`,
    },
    {
      title: "Answer",
      body: `$${fmtNum(d.pairTotal)}+${fmtNum(d.last)}=${fmtNum(d.answer)}$.`,
    },
    {
      title: "Sanity check",
      body: `The answer has to be close to the largest term, because everything before it very nearly cancels — and ${fmtNum(d.answer)} sits within ${fmtNum(p.d)} times ${fmtNum(d.pairs)} of the top term ${fmtNum(d.last)}. Pairing from the back instead would strand the smallest term rather than the largest, which is the same total reached the other way round.`,
    },
  ],
  keyInsight: "An alternating sum over an arithmetic run telescopes: adjacent terms differ by a constant step, so every consecutive pair contributes exactly minus that step regardless of how large the terms have grown. The whole sum reduces to a count of pairs plus whatever single term the pairing cannot reach.",
  commonTrap: "Counting the terms as if they all paired off, which gives one pair too many and drops the leftover term entirely. With an odd number of terms the pairing always strands one, and it is the largest — leaving it out understates the total by the biggest number in the run.",
  expectedPaceS: 60,
  verify: { method: "brute-force" },
  constants: [1, 2, 3],
};
