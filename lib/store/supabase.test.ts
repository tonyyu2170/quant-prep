// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { SupabaseStore } from "./supabase";

describe("SupabaseStore.listSessions", () => {
  it("maps DB total null -> undefined and a real total through unchanged", async () => {
    const rowA = {
      id: "a", preset: "optiver-80in8", score: 40, correct: 45, wrong: 2, skipped: 3,
      duration_s: 480, timings: [], created_at: "2026-01-01T00:00:00.000Z",
      total: null, merged_from_local: false,
    };
    const rowB = {
      id: "b", preset: "sequences-sprint", score: 6, correct: 6, wrong: 0, skipped: 1,
      duration_s: 480, timings: [], created_at: "2026-01-02T00:00:00.000Z",
      total: 7, merged_from_local: false,
    };
    const fakeClient = {
      from: () => ({
        select: () => ({
          order: async () => ({ data: [rowA, rowB], error: null }),
        }),
      }),
    };
    const store = new SupabaseStore(fakeClient as never, "user-1");
    const sessions = await store.listSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].total).toBeUndefined();
    expect(sessions[1].total).toBe(7);
  });
});
