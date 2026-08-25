import { fmtNum } from "@qp/engine";

export const pc = (v: number) => fmtNum(100 * v); // 0.95 -> "95" for percent prose
/** True when `x` renders at four significant figures with nothing lost — the test a value must
 *  pass before it may stand as an operand inside a printed chain (non-negotiable 3). Rounded at
 *  the ninth decimal first so float dirt cannot fail a value that is exact in real arithmetic. */
export const exact4 = (x: number) => fmtNum(Math.round(x * 1e9) / 1e9) === String(Math.round(x * 1e9) / 1e9);
export { fmtNum };
