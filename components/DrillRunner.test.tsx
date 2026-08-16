// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import DrillRunner from "./DrillRunner";

describe("DrillRunner", () => {
  beforeEach(() => localStorage.clear());
  it("answers a question, shows feedback with rule reveal for sequences, advances on Enter", async () => {
    render(<DrillRunner topic="sequences" />);
    // null-gated: rng arrives after mount
    const input = await screen.findByLabelText("answer");
    const q1 = screen.getByTestId("prompt").textContent!;
    fireEvent.change(input, { target: { value: "999999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    // wrong answer (astronomically unlikely to be correct): feedback shows answer + rule
    expect(screen.getByTestId("feedback")).toBeInTheDocument();
    expect(screen.getByText(/ANSWER:/)).toBeInTheDocument();
    expect(screen.getByTestId("rule")).toBeInTheDocument();
    // Enter advances to a new question
    fireEvent.keyDown(screen.getByTestId("feedback"), { key: "Enter" });
    expect(screen.getByTestId("prompt").textContent).not.toBe(q1);
    expect(screen.queryByTestId("feedback")).not.toBeInTheDocument();
  });
  it("keeps the question and hints on unparseable input", async () => {
    render(<DrillRunner topic="arithmetic" />);
    const input = await screen.findByLabelText("answer");
    const q1 = screen.getByTestId("prompt").textContent!;
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("prompt").textContent).toBe(q1);
    expect(screen.getByTestId("parse-hint")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "1" } });
    expect(screen.queryByTestId("parse-hint")).not.toBeInTheDocument();
  });
  it("persists an attempt row per answered question", async () => {
    render(<DrillRunner topic="arithmetic" />);
    const input = await screen.findByLabelText("answer");
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    // saveAttempts is fire-and-forget; flush microtasks
    await act(async () => { await Promise.resolve(); });
    const rows = JSON.parse(localStorage.getItem("qp.attempts.v1") ?? "[]");
    expect(rows).toHaveLength(1);
    expect(rows[0].mode).toBe("practice");
    expect(rows[0].topic).toBe("arithmetic");
  });
  it("keeps keyboard focus through the answer→feedback→next loop", async () => {
    render(<DrillRunner topic="arithmetic" />);
    const input = await screen.findByLabelText("answer");
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(document.activeElement).toBe(screen.getByTestId("feedback"));
    fireEvent.keyDown(screen.getByTestId("feedback"), { key: "Enter" });
    expect(document.activeElement).toBe(screen.getByLabelText("answer"));
  });
  it("applies a difficulty change from the next question onward", async () => {
    render(<DrillRunner topic="sequences" />);
    const input = await screen.findByLabelText("answer");
    const q1 = screen.getByTestId("prompt").textContent!;
    expect(q1.split(",").length).toBe(6); // L1 shows 5 terms + "?"
    fireEvent.click(screen.getByText("L2"));
    expect(screen.getByTestId("prompt").textContent).toBe(q1); // current question unchanged
    fireEvent.change(screen.getByLabelText("answer"), { target: { value: "1" } });
    fireEvent.keyDown(screen.getByLabelText("answer"), { key: "Enter" });
    fireEvent.keyDown(screen.getByTestId("feedback"), { key: "Enter" });
    expect(screen.getByTestId("prompt").textContent!.split(",").length).toBe(7); // L2 shows 6 terms + "?"
  });
  it("ignores auto-repeated Enter on the feedback panel", async () => {
    render(<DrillRunner topic="arithmetic" />);
    const input = await screen.findByLabelText("answer");
    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    const fb = screen.getByTestId("feedback");
    fireEvent.keyDown(fb, { key: "Enter", repeat: true });
    fireEvent.keyDown(fb, { key: "Enter", repeat: true });
    expect(screen.getByTestId("feedback")).toBeInTheDocument();
  });
});
