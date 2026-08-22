// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ReviewPage from "./page";
import type { ReviewRow } from "@/lib/store/types";

const R_KEY = "qp.reviews.v1";
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();
const row = (problemId: string, dueAt: string): ReviewRow => ({ problemId, dueAt, intervalDays: 1, ease: 2.5 });

describe("ReviewPage", () => {
  beforeEach(() => localStorage.clear());

  it("invites intake when the queue is empty", async () => {
    render(<ReviewPage />);
    await screen.findByText(/Nothing queued yet/);
    expect(screen.queryByTestId("start-review")).not.toBeInTheDocument();
  });

  // Mutation guard: counting all rows as due (dropping the isDue filter) breaks this,
  // and so does counting none — the two obvious ways to get the filter wrong.
  it("counts only rows whose due date has arrived, while listing the whole queue", async () => {
    localStorage.setItem(R_KEY, JSON.stringify([
      row("bayes/two-urns", inDays(-1)),
      row("bayes/base-rate-test", inDays(-0.001)),
      row("bayes/dice-face-given-sum", inDays(6)),
    ]));
    render(<ReviewPage />);
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument());
    expect(screen.getByText(/3 queued/)).toBeInTheDocument();
    expect(screen.getAllByText("due now")).toHaveLength(2);
    expect(screen.getByText("in 6 days")).toBeInTheDocument();
  });

  it("offers no review run when everything is scheduled for later", async () => {
    localStorage.setItem(R_KEY, JSON.stringify([row("bayes/two-urns", inDays(4))]));
    render(<ReviewPage />);
    await screen.findByText("in 4 days");
    expect(screen.queryByTestId("start-review")).not.toBeInTheDocument();
  });

  it("drops a removed problem from both the list and storage", async () => {
    localStorage.setItem(R_KEY, JSON.stringify([row("bayes/two-urns", inDays(-1)), row("bayes/dice-face-given-sum", inDays(-1))]));
    render(<ReviewPage />);
    fireEvent.click(await screen.findByLabelText("remove bayes/two-urns"));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(R_KEY)!)).toHaveLength(1));
    expect(JSON.parse(localStorage.getItem(R_KEY)!)[0].problemId).toBe("bayes/dice-face-given-sum");
  });

  // A queue row for a problem no longer in the bank must stay removable and never reach the runner.
  it("shows a retired problem as removable but never counts it as due", async () => {
    localStorage.setItem(R_KEY, JSON.stringify([row("bayes/deleted-problem", inDays(-1))]));
    render(<ReviewPage />);
    await screen.findByText("retired problem");
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.queryByTestId("start-review")).not.toBeInTheDocument();
    expect(screen.getByLabelText("remove bayes/deleted-problem")).toBeInTheDocument();
  });

  it("runs the due problems and returns to the queue when finished", async () => {
    localStorage.setItem(R_KEY, JSON.stringify([row("bayes/two-urns", inDays(-1))]));
    render(<ReviewPage />);
    fireEvent.click(await screen.findByTestId("start-review"));
    expect(screen.getByText(/review · 1 of 1/)).toBeInTheDocument();

    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0.999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(screen.getByTestId("walkthrough"), { key: "Enter" }); // no re-roll in review; Enter advances

    await waitFor(() => {
      const stored: ReviewRow[] = JSON.parse(localStorage.getItem(R_KEY)!);
      expect(stored[0].ease).toBeCloseTo(2.3, 10); // graded wrong: ease dropped, not reset intake
    });
  });

  it("lists a sequence pattern family as reviewable and runs it with fresh terms", async () => {
    localStorage.setItem(R_KEY, JSON.stringify([row("seq-fiblike-d2", inDays(-1))]));
    render(<ReviewPage />);
    await screen.findByText("sequences · fiblike · L2");
    expect(screen.getByText("1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("start-review"));
    const prompt = screen.getByTestId("prompt").textContent!;
    expect(prompt).toMatch(/^[\d, ]+\?$/); // regenerated terms, not the memorized instance

    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "999999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("rule")).toBeInTheDocument();
    await waitFor(() => {
      const stored: ReviewRow[] = JSON.parse(localStorage.getItem(R_KEY)!);
      expect(stored[0].ease).toBeCloseTo(2.3, 10); // graded wrong, rescheduled
    });
  });

  // Guards the family allowlist: without it, any seq-<junk>-d<n> row would reach the generator.
  it("treats an unknown pattern family as retired rather than reviewable", async () => {
    localStorage.setItem(R_KEY, JSON.stringify([row("seq-not-a-family-d2", inDays(-1))]));
    render(<ReviewPage />);
    await screen.findByText("retired problem");
    expect(screen.queryByTestId("start-review")).not.toBeInTheDocument();
  });
});
