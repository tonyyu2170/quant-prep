import { describe, expect, it } from "vitest";
import { fmtNum } from "../src/format";

describe("fmtNum", () => {
  it("keeps integers exact", () => { expect(fmtNum(1024)).toBe("1024"); expect(fmtNum(0)).toBe("0"); });
  it("trims to 4 significant digits", () => {
    expect(fmtNum(1 / 6)).toBe("0.1667");
    expect(fmtNum(0.5)).toBe("0.5");
    expect(fmtNum(0.28571428)).toBe("0.2857");
  });
  it("handles negatives", () => { expect(fmtNum(-0.125)).toBe("-0.125"); });
});
