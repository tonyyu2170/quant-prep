// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import MarketRunner from "./MarketRunner";
import { marketRounds } from "@/content/problems/market";
import { CREDIT_CAP } from "@qp/engine";

describe("MarketRunner", () => {
  it("settles a submitted quote in place and shows the round P&L", () => {
    render(<MarketRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("bid"), { target: { value: "-1e12" } });
    fireEvent.change(screen.getByLabelText("ask"), { target: { value: "1e12" } });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));
    // An absurdly wide market is never picked off and floors at zero credit.
    expect(screen.getByTestId("round-pnl")).toHaveTextContent("0");
    expect(screen.getByTestId("settlement")).toHaveTextContent(/no trade/i);
  });

  it("takes the quote in the quantity's own scale, not in scoring units", () => {
    // Quoting the truth itself must settle inside for full credit. Under the rejected "type in
    // units" reading the same input meant truth x unit, orders of magnitude off, and would be
    // picked off. The seed is SEARCHED rather than pinned: a unit-1 round cannot tell the two
    // readings apart, and which template any given seed opens on moves every time the bank
    // grows — seed 1 opened on a probability at unit 0.001 until B22 added eleven templates.
    const seed = [...Array(50).keys()].find((s) => marketRounds(s)[0].unit !== 1);
    expect(seed, "no seed in 0..49 opens on a round carrying a scale").toBeDefined();
    const r = marketRounds(seed!)[0];
    render(<MarketRunner seed={seed!} />);
    fireEvent.change(screen.getByLabelText("bid"), { target: { value: String(r.truth) } });
    fireEvent.change(screen.getByLabelText("ask"), { target: { value: String(r.truth) } });
    fireEvent.click(screen.getByRole("button", { name: /^quote$/i }));
    expect(screen.getByTestId("settlement")).toHaveTextContent(/no trade/i);
    expect(screen.getByTestId("round-pnl")).toHaveTextContent(String(CREDIT_CAP));
  });

  it("refuses an inverted quote without consuming the round", () => {
    render(<MarketRunner seed={4242} />);
    const round = screen.getByTestId("round-counter").textContent;
    fireEvent.change(screen.getByLabelText("bid"), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText("ask"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));
    expect(screen.getByTestId("quote-hint")).toBeInTheDocument();
    expect(screen.getByTestId("round-counter").textContent).toBe(round);
    expect(screen.queryByTestId("settlement")).not.toBeInTheDocument();
  });

  it("plays through to the session summary and reports the diagnosis", () => {
    // The end screen is pure render over summarizeMarket, but nothing else renders it — a
    // crash there would only show up in a hand-played session. Quoting absurdly wide every
    // round is never picked off and floors at zero credit, so the total is deterministic.
    //
    // 1e12, not 1e5: now that the quote is taken in the quantity's own scale, "wide" is
    // scale-relative. A session drawing one of the two templates at unit 1e7 made +-99999 a
    // razor-thin market worth nearly full credit, and this assertion caught it.
    render(<MarketRunner seed={4242} />);
    for (let i = 0; i < 12; i++) {
      fireEvent.change(screen.getByLabelText("bid"), { target: { value: "-1e12" } });
      fireEvent.change(screen.getByLabelText("ask"), { target: { value: "1e12" } });
      fireEvent.click(screen.getByRole("button", { name: /^quote$/i }));
      fireEvent.click(screen.getByRole("button", { name: /next round|see results/i }));
    }
    expect(screen.getByTestId("total-pnl")).toHaveTextContent("+0.0");
    expect(screen.getByTestId("diagnosis")).toHaveTextContent(/too wide/i);
  });

  it("charges the full credit cap when the clock runs out with no quote", () => {
    vi.useFakeTimers();
    try {
      render(<MarketRunner seed={4242} />);
      act(() => { vi.advanceTimersByTime(26_000); });
      expect(screen.getByTestId("round-pnl")).toHaveTextContent(String(-CREDIT_CAP));
      expect(screen.getByTestId("settlement")).toHaveTextContent(/did not quote/i);
    } finally {
      vi.useRealTimers();
    }
  });
});
