import { describe, expect, it } from "vitest";
import { CREDIT_CAP, isValidQuote, settle, summarizeMarket } from "../src/market";

describe("settle", () => {
  // unit 1 throughout unless stated, so "units" and raw numbers coincide and the
  // arithmetic in these expectations is readable.
  it("pays credit that shrinks with width when truth lands inside", () => {
    expect(settle({ bid: 16, ask: 20 }, 18, 1).pnl).toBe(CREDIT_CAP - 4);
    expect(settle({ bid: 10, ask: 30 }, 18, 1).pnl).toBe(CREDIT_CAP - 20);
    expect(settle({ bid: 16, ask: 20 }, 18, 1).traded).toBe(false);
  });

  it("floors credit at zero rather than going negative on an absurdly wide market", () => {
    const r = settle({ bid: -1000, ask: 1000 }, 18, 1);
    expect(r.pnl).toBe(0);
    expect(r.traded).toBe(false);
  });

  it("loses the distance when the bot lifts the offer", () => {
    const r = settle({ bid: 16, ask: 20 }, 24, 1);
    expect(r.traded).toBe("lifted");
    expect(r.pnl).toBe(-4);
  });

  it("loses the distance when the bot hits the bid", () => {
    const r = settle({ bid: 16, ask: 20 }, 11, 1);
    expect(r.traded).toBe("hit");
    expect(r.pnl).toBe(-5);
  });

  it("charges the full credit cap for not quoting at all", () => {
    expect(settle(null, 18, 1).pnl).toBe(-CREDIT_CAP);
    expect(settle(null, 18, 1).quoted).toBe(false);
  });

  it("treats a zero-width quote as legal — full credit on an exact hit, picked off otherwise", () => {
    expect(settle({ bid: 18, ask: 18 }, 18, 1).pnl).toBe(CREDIT_CAP);
    expect(settle({ bid: 18, ask: 18 }, 19, 1).pnl).toBe(-1);
  });

  it("measures width, centre error and P&L in units, not raw values", () => {
    // unit 0.01: a probability quoted in percentage points.
    const r = settle({ bid: 0.38, ask: 0.46 }, 0.628, 0.01);
    expect(r.widthUnits).toBeCloseTo(8, 9);
    expect(r.pnl).toBeCloseTo(-16.8, 9);
    expect(r.centreErrorUnits).toBeCloseTo(20.8, 9);
  });

  it("rejects inverted quotes and non-finite ones", () => {
    expect(isValidQuote(20, 16)).toBe(false);
    expect(isValidQuote(16, 16)).toBe(true);
    expect(isValidQuote(16, 20)).toBe(true);
    expect(isValidQuote(NaN, 20)).toBe(false);
  });
});

describe("summarizeMarket", () => {
  const inside = () => settle({ bid: 17, ask: 19 }, 18, 1);        // tight, right
  const missed = () => settle({ bid: 17, ask: 19 }, 40, 1);        // tight, badly wrong

  it("totals P&L and counts pick-offs", () => {
    const s = summarizeMarket([inside(), inside(), missed()]);
    expect(s.rounds).toBe(3);
    expect(s.pickedOff).toBe(1);
    expect(s.totalPnl).toBeCloseTo(2 * (CREDIT_CAP - 2) - 21, 9);
  });

  it("names the failure when markets are too tight for the centring", () => {
    const s = summarizeMarket([missed(), missed(), missed(), inside()]);
    expect(s.diagnosis).toContain("too tight");
  });

  it("names the failure when markets are well centred but too wide to earn", () => {
    const wide = settle({ bid: -30, ask: 70 }, 18, 1);   // never picked off, zero credit
    const s = summarizeMarket([wide, wide, wide, wide]);
    expect(s.pickedOff).toBe(0);
    expect(s.diagnosis).toContain("too wide");
  });

  it("summarises an empty session without dividing by zero", () => {
    const s = summarizeMarket([]);
    expect(s.rounds).toBe(0);
    expect(s.totalPnl).toBe(0);
    expect(Number.isFinite(s.avgWidthUnits)).toBe(true);
  });
});
