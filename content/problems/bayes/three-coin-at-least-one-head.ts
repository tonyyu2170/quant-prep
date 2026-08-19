import type { ProblemTemplate } from "@qp/engine";
import { fmtNum } from "../util";

// Conditioning on an "at least one" event: three flips of a (possibly biased) coin,
// P(exactly two heads | at least one head) — full enumeration, like dice-face-given-sum.
export const threeCoinAtLeastOneHead: ProblemTemplate = {
  id: "bayes/three-coin-at-least-one-head",
  version: 1,
  topic: "probability/bayes",
  difficulty: 1,
  firms: [{ firm: "imc", weight: 0.5 }, { firm: "akuna", weight: 0.4 }],
  source: { kind: "textbook", inspiration: "classic: conditioning on an at-least-one event in repeated Bernoulli trials" },
  params: {
    headProb: { choices: [0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8] },
  },
  derived: (p) => {
    const tailProb = 1 - p.headProb;
    const pAllTails = tailProb * tailProb * tailProb;
    const pAtLeastOne = 1 - pAllTails;
    const pOneTwoHeadSeq = p.headProb * p.headProb * tailProb;
    const pExactlyTwo = 3 * pOneTwoHeadSeq;
    const postExactlyTwo = pExactlyTwo / pAtLeastOne;
    return { tailProb, pAllTails, pAtLeastOne, pOneTwoHeadSeq, pExactlyTwo, postExactlyTwo };
  },
  statement: (p) =>
    `A coin lands heads with probability ${p.headProb} on each flip. It is flipped three times. Given that at least one flip came up heads, ` +
    `what is the probability that exactly two of the three flips came up heads?`,
  answerKey: "postExactlyTwo",
  accepted: { tolerance: { rel: 0.005 } },
  solution: (p, d) => {
    const seqs: { seq: string; heads: number }[] = [];
    for (const a of [1, 0]) for (const b of [1, 0]) for (const c of [1, 0]) {
      const flips = [a, b, c];
      const heads = flips.filter((x) => x === 1).length;
      seqs.push({ seq: flips.map((x) => (x === 1 ? "H" : "T")).join(""), heads });
    }
    const allList = seqs.map((s) => s.seq).join(", ");
    const atLeastOneList = seqs.filter((s) => s.heads >= 1).map((s) => s.seq).join(", ");
    const exactlyTwoList = seqs.filter((s) => s.heads === 2).map((s) => s.seq).join(", ");
    return [
      { title: "Setup", body: `Each flip lands heads independently with probability ${p.headProb}. The eight possible three-flip sequences are ${allList}, each with its own probability from multiplying per-flip odds.` },
      { title: "Condition on at least one head", body: `Excluding only the all-tails sequence, the sequences with at least one head are ${atLeastOneList}. Its probability is $1-P(\\text{TTT})=1-${fmtNum(d.tailProb)}^{3}=${fmtNum(d.pAtLeastOne)}$.` },
      { title: "Isolate exactly two heads", body: `The sequences with exactly two heads are ${exactlyTwoList} — three sequences, each with probability $${p.headProb}^{2}\\times${fmtNum(d.tailProb)}=${fmtNum(d.pOneTwoHeadSeq)}$, giving $P(\\text{exactly two})=3\\times${p.headProb}^{2}\\times${fmtNum(d.tailProb)}=${fmtNum(d.pExactlyTwo)}$.` },
      { title: "Conditional probability", body: `$P(\\text{exactly two}\\mid\\text{at least one})=\\dfrac{3\\times${p.headProb}^{2}\\times${fmtNum(d.tailProb)}}{1-${fmtNum(d.tailProb)}^{3}}=${fmtNum(d.postExactlyTwo)}$.` },
      { title: "Sanity check", body: `Exactly two heads already implies at least one head, so its raw (unconditional) probability $${fmtNum(d.pExactlyTwo)}$ must be less than the conditional probability, since dividing by $${fmtNum(d.pAtLeastOne)}<1$ can only increase it — and $${fmtNum(d.pExactlyTwo)} < ${fmtNum(d.postExactlyTwo)}$ holds.` },
    ];
  },
  keyInsight: "Conditioning on an 'at least one' event only removes the all-failure outcome from the sample space — every other outcome's raw probability carries over unchanged, so the conditional probability is just the target event's raw probability rescaled by the surviving mass.",
  commonTrap: "Computing the unconditional probability of exactly two heads and reporting that directly — forgetting that conditioning on 'at least one head' shrinks the sample space and must appear as the denominator, not just be dropped.",
  expectedPaceS: 55,
  verify: { method: "brute-force" },
  constants: [1, 2, 3],
};
