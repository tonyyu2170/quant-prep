// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StatsPage from "./page";
import type { TestSessionRow } from "@/lib/store/types";

const S_KEY = "qp.sessions.v1";

const session = (over: Partial<TestSessionRow> = {}): TestSessionRow => ({
  id: "s1", preset: "optiver-80in8", score: 40, correct: 45, wrong: 2, skipped: 3,
  durationS: 480, timings: [], createdAt: new Date().toISOString(), ...over,
});

describe("StatsPage score chart", () => {
  beforeEach(() => localStorage.clear());

  it("includes pre-1.5 sessions without total", async () => {
    localStorage.setItem(S_KEY, JSON.stringify([session()])); // no `total` field
    render(<StatsPage />);
    await waitFor(() => expect(screen.queryByText("No timed sims yet.")).not.toBeInTheDocument());
  });

  it("excludes non-standard count runs", async () => {
    localStorage.setItem(S_KEY, JSON.stringify([session({ total: 5 })]));
    render(<StatsPage />);
    // Wait for the load to actually land (the "Recent sims" list shows every session,
    // unfiltered by count) before asserting the score chart excluded this one -- otherwise
    // this assertion is satisfied by the pre-load empty state too and proves nothing.
    await screen.findByText("optiver-80in8");
    expect(screen.getByText("No timed sims yet.")).toBeInTheDocument();
  });

  it("filters attempts by probability topic prefix", async () => {
    localStorage.setItem("qp.attempts.v1", JSON.stringify([
      { problemId: "a:1", problemVersion: 1, seed: 1, mode: "practice", topic: "arithmetic", answer: "1", correct: true, timeMs: 1000, sessionId: null, createdAt: new Date().toISOString() },
      { problemId: "bayes/two-urns", problemVersion: 1, seed: 2, mode: "practice", topic: "probability/bayes", answer: "0.4", correct: true, timeMs: 2000, sessionId: null, createdAt: new Date().toISOString() },
    ]));
    render(<StatsPage />);
    await screen.findByText("bayes"); // per-topic list loaded, under the label the drills use
    fireEvent.click(screen.getByRole("button", { name: "probability" }));
    expect(screen.getByText("bayes")).toBeInTheDocument();
    expect(screen.getAllByText(/1q/)).toHaveLength(1); // only the probability row remains in the list
  });

  // The row is the only affordance next to "you are weakest here", so it has to lead somewhere
  // useful. It used to sit beside a link hardcoded to the arithmetic drill.
  it("links each topic row into that topic's own slice of the bank", async () => {
    localStorage.setItem("qp.attempts.v1", JSON.stringify([
      { problemId: "bayes/two-urns", problemVersion: 1, seed: 2, mode: "practice", topic: "probability/bayes", answer: "0.4", correct: true, timeMs: 2000, sessionId: null, createdAt: new Date().toISOString() },
    ]));
    render(<StatsPage />);
    const row = await screen.findByText("bayes");
    expect(row.closest("a")).toHaveAttribute("href", "/drills/probability?topic=probability%2Fbayes");
  });

  // finance/pricing was split into options/arbitrage/fixed-income in B16 and ships nowhere, but
  // it survives in attempt rows written before that. The history is real and stays visible; what
  // it must NOT do is offer a drill for a topic the bank cannot serve.
  it("marks a topic the bank no longer ships and offers no drill for it", async () => {
    localStorage.setItem("qp.attempts.v1", JSON.stringify([
      { problemId: "pricing/old", problemVersion: 1, seed: 3, mode: "practice", topic: "finance/pricing", answer: "1", correct: true, timeMs: 1000, sessionId: null, createdAt: new Date().toISOString() },
    ]));
    render(<StatsPage />);
    const row = await screen.findByText(/finance\/pricing/);
    expect(row).toHaveTextContent("retired");
    expect(row.closest("a")).toBeNull();
  });
});
