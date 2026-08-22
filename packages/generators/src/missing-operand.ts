import { pick, randInt, type Item, type Rng } from "@qp/engine";

export const MO_OPS = ["add", "sub", "mul", "div"] as const;
export type MoOp = (typeof MO_OPS)[number];
/** Which slot is blanked. Measured mix over 24 harvested questions: result 11, left 7, right 6. */
export const MO_SLOTS = ["result", "left", "right"] as const;
export type MoSlot = (typeof MO_SLOTS)[number];

const SYMBOL: Record<MoOp, string> = { add: "+", sub: "−", mul: "×", div: "÷" };

// Op and slot mixes track docs/research/quantprof-2026-08/optiver-80.txt (n=24): ÷ 11, + 7, × 4, − 2.
const OP_BAG: readonly MoOp[] = ["div", "div", "div", "div", "add", "add", "add", "mul", "mul", "sub"];
const SLOT_BAG: readonly MoSlot[] = ["result", "result", "result", "result", "left", "left", "left", "right", "right", "right"];

const round2 = (x: number) => Math.round(x * 100) / 100;
/** Their answers never carry more than two decimals; options inherit the answer's precision. */
const isWhole = (x: number) => Number.isInteger(x);

/**
 * Distractors are absolute perturbations, not proportional ones: integer answers get whole
 * offsets, decimal answers get tenths. Negative options are legal — their `57 + ? = 58` set
 * contains -4. Offsets are re-drawn until all four options are distinct at display precision.
 */
function buildOptions(rng: Rng, answer: number): number[] {
  const whole = isWhole(answer);
  const opts = [answer];
  for (let guard = 0; opts.length < 4 && guard < 200; guard++) {
    const mag = whole ? randInt(rng, 1, 5) : randInt(rng, 2, 20) / 10;
    const off = randInt(rng, 0, 1) === 0 ? -mag : mag;
    const cand = round2(answer + off);
    if (!opts.some((o) => o === cand)) opts.push(cand);
  }
  // Fisher-Yates: every position equally likely. Their correct-answer index was 3/6/8/7 over 24 —
  // consistent with a uniform shuffle, so don't reproduce that exact skew.
  for (let i = opts.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

/**
 * Optiver-style "80 in 8": a four-way multiple choice with one slot of the equation blanked.
 * Operands are always drawn FORWARD and a slot blanked afterwards, so the hidden value is exact —
 * solving for a blank from shown values is what produces non-terminating answers like `? × 1.7 = 5`.
 */
export function missingOperandItem(rng: Rng, difficulty: 1 | 2 | 3): Item {
  const op = pick(rng, OP_BAG);
  const slot = pick(rng, SLOT_BAG);
  const dec = randInt(rng, 1, 10) <= (difficulty === 1 ? 3 : difficulty === 2 ? 6 : 8); // decimals get commoner
  let a: number, b: number, result: number;

  switch (op) {
    case "add":
    case "sub": {
      const hi = difficulty === 1 ? 60 : difficulty === 2 ? 200 : 900;
      a = dec ? randInt(rng, 20, hi * 10) / 10 : randInt(rng, 2, hi);
      b = dec ? randInt(rng, 10, Math.round(a * 10)) / 10 : randInt(rng, 1, a);
      result = round2(op === "add" ? a + b : a - b);
      break;
    }
    case "mul": {
      a = dec ? randInt(rng, 11, difficulty === 1 ? 60 : 99) / 10 : randInt(rng, 2, difficulty === 1 ? 12 : 40);
      b = dec ? randInt(rng, 11, difficulty === 1 ? 30 : 60) / 10 : randInt(rng, 2, difficulty === 1 ? 12 : 30);
      result = round2(a * b);
      break;
    }
    case "div": {
      // Build the dividend from the quotient so the division is always exact.
      b = dec ? randInt(rng, 11, difficulty === 1 ? 40 : 99) / 10 : randInt(rng, 3, difficulty === 1 ? 12 : 40);
      result = dec ? randInt(rng, 11, difficulty === 1 ? 90 : 400) / 10 : randInt(rng, 2, difficulty === 1 ? 30 : 99);
      a = round2(b * result);
      break;
    }
  }

  // `a op b = result` with one slot blanked. div is stored as a ÷ b = result, so the shown
  // equation reads left-to-right in every case.
  const answer = slot === "result" ? result : slot === "left" ? a : b;
  const cell = (v: number, blank: boolean) => (blank ? "?" : String(v));
  const prompt = `${cell(a, slot === "left")} ${SYMBOL[op]} ${cell(b, slot === "right")} = ${cell(result, slot === "result")}`;

  return {
    id: `mo-${op}-${slot}-${a}-${b}`,
    topic: "missing-operand",
    prompt,
    answer,
    options: buildOptions(rng, answer),
    meta: { op, slot, a, b, result },
  };
}
