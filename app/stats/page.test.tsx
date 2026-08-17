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
    await screen.findByText("probability/bayes"); // per-topic list loaded
    fireEvent.click(screen.getByRole("button", { name: "probability" }));
    expect(screen.getByText("probability/bayes")).toBeInTheDocument();
    expect(screen.getAllByText(/1q/)).toHaveLength(1); // only the probability row remains in the list
  });
});
