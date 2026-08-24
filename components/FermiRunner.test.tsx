import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import FermiRunner from "./FermiRunner";

describe("FermiRunner", () => {
  beforeEach(() => localStorage.clear());

  it("settles a submitted chain in place and shows both widths", () => {
    render(<FermiRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "1000000000" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    expect(screen.getByTestId("settlement")).toBeInTheDocument();
    // The quadrature lesson is the point of the reveal: both numbers must be shown.
    expect(screen.getByTestId("naive-width")).toBeInTheDocument();
    expect(screen.getByTestId("combined-width")).toBeInTheDocument();
  });

  it("refuses a non-positive or inverted factor without consuming the question", () => {
    render(<FermiRunner seed={4242} />);
    const q = screen.getByTestId("question-counter").textContent;
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    expect(screen.getByTestId("chain-hint")).toBeInTheDocument();
    expect(screen.getByTestId("question-counter").textContent).toBe(q);
    expect(screen.queryByTestId("settlement")).not.toBeInTheDocument();
  });

  it("adds factors on request", () => {
    render(<FermiRunner seed={4242} />);
    expect(screen.queryByLabelText("factor 2 low")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /add factor/i }));
    expect(screen.getByLabelText("factor 2 low")).toBeInTheDocument();
  });

  it("reveals the canonical chain after settling", () => {
    render(<FermiRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    expect(screen.getByTestId("canonical-chain")).toBeInTheDocument();
  });

  it("records answers to localStorage so calibration accumulates across sessions", () => {
    render(<FermiRunner seed={4242} />);
    fireEvent.change(screen.getByLabelText("factor 1 low"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("factor 1 high"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: /submit estimate/i }));
    fireEvent.click(screen.getByRole("button", { name: /next question|see results/i }));
    expect(JSON.parse(localStorage.getItem("qp.calibration.v1")!).length).toBe(1);
  });
});
