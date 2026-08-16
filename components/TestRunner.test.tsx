// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import TestRunner from "./TestRunner";
import { getPreset } from "@qp/engine";

describe("TestRunner", () => {
  beforeEach(() => localStorage.clear());
  it("advances on Enter, skips on empty Enter, finishes at count, shows score", () => {
    const preset = { ...getPreset("optiver-80in8")!, count: 2, durationS: 60 };
    render(<TestRunner preset={preset} seed={42} onDone={() => {}} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    const q1 = screen.getByTestId("prompt").textContent!;
    fireEvent.change(input, { target: { value: "0.5" } });
    fireEvent.keyDown(input, { key: "Enter" });               // wrong (generated answers are never 0.5)
    expect(screen.getByTestId("prompt").textContent).not.toBe(q1);
    fireEvent.keyDown(screen.getByLabelText("answer"), { key: "Enter" }); // empty = skip
    expect(screen.getByTestId("score")).toBeInTheDocument();  // results view
    expect(screen.getByTestId("score").textContent).toContain("-2"); // 1 wrong × −2, 1 skip × 0
  });
  it("does not consume the question on unparseable input", () => {
    const preset = { ...getPreset("optiver-80in8")!, count: 2, durationS: 60 };
    render(<TestRunner preset={preset} seed={7} onDone={() => {}} />);
    const input = screen.getByLabelText("answer") as HTMLInputElement;
    const q1 = screen.getByTestId("prompt").textContent!;
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("prompt").textContent).toBe(q1);        // question NOT consumed
    expect(screen.getByTestId("parse-hint")).toBeInTheDocument();     // hint shown
    fireEvent.change(input, { target: { value: "12" } });
    expect(screen.queryByTestId("parse-hint")).not.toBeInTheDocument(); // hint clears on edit
  });
  it("never repeats a question id within a session", () => {
    const preset = { ...getPreset("optiver-80in8")!, count: 40, durationS: 60 };
    render(<TestRunner preset={preset} seed={12} onDone={() => {}} />);
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const prompt = screen.getByTestId("prompt").textContent!;
      expect(seen.has(prompt), `duplicate prompt: ${prompt}`).toBe(false);
      seen.add(prompt);
      fireEvent.keyDown(screen.getByLabelText("answer"), { key: "Enter" }); // skip through
    }
    expect(screen.getByTestId("score")).toBeInTheDocument();
  });
  it("finishes when the timer expires and reports a partial run", () => {
    vi.useFakeTimers();
    try {
      const preset = { ...getPreset("optiver-80in8")!, count: 5, durationS: 60 };
      const onDone = vi.fn();
      render(<TestRunner preset={preset} seed={42} onDone={onDone} />);
      const input = screen.getByLabelText("answer") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "1" } });
      fireEvent.keyDown(input, { key: "Enter" });
      act(() => { vi.advanceTimersByTime(61_000); });
      expect(screen.getByTestId("score")).toBeInTheDocument();
      expect(onDone).toHaveBeenCalledTimes(1);
      expect(onDone.mock.calls[0][0].total).toBe(1);
      expect(screen.getByText(/answered 1\/5/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
