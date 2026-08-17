import { fmtNum } from "@qp/engine";

export const pc = (v: number) => fmtNum(100 * v); // 0.95 -> "95" for percent prose
export { fmtNum };
