// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import MarketRunner from "./MarketRunner";
import { CREDIT_CAP } from "@qp/engine";

describe("MarketRunner", () => {
  it("settles a submitted quote in place and shows the round P&L", () => {
    render(<MarketRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("bid"), { target: { value: "-99999" } });
    fireEvent.change(screen.getByLabelText("ask"), { target: { value: "99999" } });
    fireEvent.click(screen.getByRole("button", { name: /quote/i }));
    // An absurdly wide market is never picked off and floors at zero credit.
    expect(screen.getByTestId("round-pnl")).toHaveTextContent("0");
    expect(screen.getByTestId("settlement")).toHaveTextContent(/no trade/i);
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
    render(<MarketRunner seed={4242} />);
    for (let i = 0; i < 12; i++) {
      fireEvent.change(screen.getByLabelText("bid"), { target: { value: "-99999" } });
      fireEvent.change(screen.getByLabelText("ask"), { target: { value: "99999" } });
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
