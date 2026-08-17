// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { answerOf, drawParams } from "@qp/engine";
import { ProblemSession } from "./ProblemRunner";
import { byId } from "@/content/problems";

const template = byId.get("bayes/two-urns")!;

describe("ProblemSession", () => {
  beforeEach(() => localStorage.clear());
  it("grades a wrong answer and unfolds the walkthrough", () => {
    render(<ProblemSession template={template} seed={7} onNext={() => {}} onHarder={null} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0.999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("walkthrough")).toBeInTheDocument();
    expect(screen.getByTestId("verdict").textContent).toMatch(/✗/);
    expect(screen.getByText(/Key insight/)).toBeInTheDocument();
    expect(screen.getByText(/Common trap/)).toBeInTheDocument();
    expect(screen.getByText(/Report issue/)).toBeInTheDocument();
  });
  it("accepts a correct answer within tolerance", () => {
    const d = template.derived(drawParams(template, 7));
    const exact = answerOf(template, d);
    render(<ProblemSession template={template} seed={7} onNext={() => {}} onHarder={null} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: String(exact) } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("verdict").textContent).toMatch(/✓/);
  });
  it("records a practice attempt with the template id and seed", async () => {
    render(<ProblemSession template={template} seed={7} onNext={() => {}} onHarder={null} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0.999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await new Promise((r) => setTimeout(r, 50)); // store save is fire-and-forget
    const rows = JSON.parse(localStorage.getItem("qp.attempts.v1") ?? "[]");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ problemId: "bayes/two-urns", seed: 7, mode: "practice", topic: "probability/bayes", correct: false });
  });
  it("accepts an expression form of the correct answer", () => {
    const d = template.derived(drawParams(template, 7));
    const exact = answerOf(template, d);
    render(<ProblemSession template={template} seed={7} onNext={() => {}} onHarder={null} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: `(${exact}) * (2/2)` } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("verdict").textContent).toMatch(/✓/);
  });
  it("shows the parse hint on garbage and records no attempt", () => {
    render(<ProblemSession template={template} seed={7} onNext={() => {}} onHarder={null} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("parse-hint")).toBeInTheDocument();
    expect(screen.queryByTestId("walkthrough")).not.toBeInTheDocument();
    expect(localStorage.getItem("qp.attempts.v1")).toBeNull();
  });
  it("does not bubble Enter from the Re-roll button to onNext", () => {
    const onNext = vi.fn();
    render(<ProblemSession template={template} seed={7} onNext={onNext} onHarder={null} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "0.999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("button", { name: "Re-roll numbers" }), { key: "Enter" });
    expect(onNext).not.toHaveBeenCalled();
  });
});
