// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Page from "./page";
import { FIRMS, problemsFor } from "@/content/problems";

// The picker draws pool[(nonce + i) % len], so pinning Math.random pins which problem
// each track shows: with the firm filter unwired every chip shows PROBLEMS[0] instead,
// which fails on the first firm that template is not tagged with.
const shownId = () => document.querySelector("p.microlabel")!.textContent!.split("·").pop()!.trim();

describe("problem bank firm tracks", () => {
  beforeEach(() => { vi.spyOn(Math, "random").mockReturnValue(0); localStorage.clear(); });
  afterEach(() => vi.restoreAllMocks());

  it("draws only from the selected firm's track", () => {
    render(<Page />);
    expect(FIRMS.length).toBeGreaterThan(1);
    for (const firm of FIRMS) {
      fireEvent.click(screen.getByRole("button", { name: firm }));
      const ids = new Set(problemsFor(undefined, undefined, firm).map((t) => t.id));
      const shown = shownId();
      expect(ids.size).toBeGreaterThan(0);
      expect(ids.has(shown), `${firm} track showed ${shown}`).toBe(true);
    }
  });

  it("intersects the track with the difficulty filter", () => {
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "L3" }));
    for (const firm of FIRMS) {
      fireEvent.click(screen.getByRole("button", { name: firm }));
      const ids = problemsFor(undefined, 3, firm).map((t) => t.id);
      if (ids.length === 0) continue; // an empty track renders the no-problems line, not an id
      const shown = shownId();
      expect(ids, `${firm} L3 track showed ${shown}`).toContain(shown);
    }
  });
});
