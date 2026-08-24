import { beforeEach, describe, expect, it } from "vitest";
import { CAL_KEY, appendAnswers, clearCalibration, readCalibration } from "./calibration";

describe("calibration history", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty and round-trips appended answers", () => {
    expect(readCalibration()).toEqual([]);
    appendAnswers([{ score: 2, hit: true, logWidth: 2, logCentreError: 0.1 }]);
    appendAnswers([{ score: 22, hit: false, logWidth: 2, logCentreError: 1.5 }]);
    const rows = readCalibration();
    expect(rows.length).toBe(2);
    expect(rows[0].hit).toBe(true);
    expect(rows[1].score).toBe(22);
  });

  it("survives corrupt storage rather than throwing on read", () => {
    localStorage.setItem(CAL_KEY, "{not json");
    expect(readCalibration()).toEqual([]);
  });

  it("clears", () => {
    appendAnswers([{ score: 1, hit: true, logWidth: 1, logCentreError: 0 }]);
    clearCalibration();
    expect(readCalibration()).toEqual([]);
  });
});
