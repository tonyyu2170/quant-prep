// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

type TableResult = { data?: unknown; error?: { code?: string; message?: string } | null; single?: unknown };
let TABLES: Record<string, TableResult> = {};
let USER: { id: string } | null = null;

vi.mock("@/lib/supabase/client", () => ({
  supabaseBrowser: () => ({
    from: (table: string) => {
      const result = TABLES[table] ?? { data: [], error: null };
      const chain: Record<string, unknown> = {};
      for (const m of ["select", "eq", "order", "limit"]) chain[m] = () => chain;
      chain.maybeSingle = async () => ({
        data: "single" in result ? result.single : (Array.isArray(result.data) ? result.data[0] ?? null : result.data),
        error: result.error ?? null,
      });
      chain.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
        Promise.resolve({ data: result.data ?? [], error: result.error ?? null }).then(res, rej);
      return chain;
    },
    auth: { getUser: async () => ({ data: { user: USER } }) },
  }),
}));

const { default: LeaderboardPage } = await import("./page");

const row = (rank: number, handle: string, score: number) => ({ rank, handle, score, played_on: "2026-01-01" });
const invite = { label: "historical invite zone", value: 55, source: "Publicly reported candidate thresholds; unofficial", note: null };

describe("LeaderboardPage", () => {
  beforeEach(() => { TABLES = {}; USER = null; });

  it("says the board is not live when the view has not been migrated", async () => {
    TABLES = { leaderboard: { error: { code: "PGRST205", message: "Could not find the table in the schema cache" } } };
    render(<LeaderboardPage />);
    await screen.findByText(/isn't live yet/);
    expect(screen.getByText("0003_leaderboard.sql")).toBeInTheDocument();
  });

  // Mutation guard: if isMissingView were loosened to always-true, a genuine outage would
  // read to the user as "we haven't migrated yet" and hide a real failure indefinitely.
  it("reports a genuine query failure as an error, not as a missing migration", async () => {
    TABLES = { leaderboard: { error: { code: "57014", message: "canceling statement due to statement timeout" } } };
    render(<LeaderboardPage />);
    await screen.findByText(/couldn't load the board/);
    expect(screen.queryByText(/isn't live yet/)).not.toBeInTheDocument();
  });

  it("ranks players and weaves the benchmark in as a divider, never as a competitor", async () => {
    TABLES = { leaderboard: { data: [row(1, "trader_a", 60), row(2, "trader_b", 40)] }, benchmarks: { data: [invite] } };
    render(<LeaderboardPage />);
    await screen.findByText("trader_a");
    expect(screen.getAllByTestId("board-row")).toHaveLength(2);
    const mark = screen.getByTestId("benchmark");
    expect(mark).toHaveTextContent("55");
    expect(mark).toHaveTextContent("historical invite zone");
    expect(mark).toHaveTextContent("Publicly reported candidate thresholds"); // provenance cited
    expect(mark).not.toHaveTextContent("trader_"); // not a fabricated player
  });

  it("nudges an anonymous visitor that local scores don't rank", async () => {
    TABLES = { leaderboard: { data: [row(1, "trader_a", 60)] } };
    render(<LeaderboardPage />);
    await screen.findByText(/don't count/);
  });

  it("highlights the signed-in player's own row in place", async () => {
    USER = { id: "u1" };
    TABLES = {
      leaderboard: { data: [row(1, "trader_a", 60), row(2, "trader_me", 40)] },
      profiles: { single: { handle: "trader_me" } },
    };
    render(<LeaderboardPage />);
    await waitFor(() => expect(screen.getByTestId("my-row")).toHaveTextContent("trader_me"));
    expect(screen.getAllByTestId("board-row")).toHaveLength(1); // the other player
  });

  it("pins the signed-in player below the board when they rank outside it", async () => {
    USER = { id: "u1" };
    TABLES = {
      leaderboard: { data: [row(1, "trader_a", 60)], single: row(214, "trader_me", 3) },
      profiles: { single: { handle: "trader_me" } },
    };
    render(<LeaderboardPage />);
    await waitFor(() => expect(screen.getByTestId("my-row")).toHaveTextContent("trader_me"));
    expect(screen.getByTestId("my-row")).toHaveTextContent("214");
    expect(screen.getAllByTestId("board-row")).toHaveLength(1);
  });
});
