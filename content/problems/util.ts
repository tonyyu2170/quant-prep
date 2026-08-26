import { fmtNum } from "@qp/engine";

export const pc = (v: number) => fmtNum(100 * v); // 0.95 -> "95" for percent prose
/** True when `x` renders at four significant figures with nothing lost — the test a value must
 *  pass before it may stand as an operand inside a printed chain (non-negotiable 3). Rounded at
 *  the ninth decimal first so float dirt cannot fail a value that is exact in real arithmetic. */
export const exact4 = (x: number) => fmtNum(Math.round(x * 1e9) / 1e9) === String(Math.round(x * 1e9) / 1e9);
export { fmtNum };

/**
 * True when a student who answered the COMPLEMENT would be graded correct.
 *
 * `1 - v` and `v` land inside the same tolerance band exactly when `|1 - 2v| <= rel*|v|`, which
 * is to say when the answer sits on or beside one half. Answering P(not A) for P(A) is the
 * commonest mistake in the subject, and on such a draw the bank cannot tell it from the right
 * answer — the wrong method is marked right. One half is a fixed point of the complement the
 * same way 1 is a fixed point of the square, and B22's rule applies: constrain the draw away
 * from the identity element rather than warning about it in prose.
 *
 * Use it as a conjunct on any template whose answer is a probability or a share:
 * `constraint: (p) => ... && !complementGrades(answerOf(p))`. `tools/fixed-point-scan.ts`
 * reports every template where it still returns true somewhere in the legal space.
 */
export const complementGrades = (v: number, rel = 0.005) => Math.abs(1 - 2 * v) <= rel * Math.abs(v);
