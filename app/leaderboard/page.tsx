"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PRESETS } from "@qp/engine";
import { supabaseBrowser } from "@/lib/supabase/client";
import { weave, type Benchmark, type LeaderboardRow } from "@/lib/leaderboard";

const PRESET_IDS = Object.keys(PRESETS);
const TOP_N = 50;

// PostgREST's answers when the 0003 migration has not been run yet.
const isMissingView = (code?: string, message?: string) =>
  code === "42P01" || code === "PGRST205" || /schema cache/i.test(message ?? "");

type Board =
  | { kind: "loading" }
  | { kind: "not-live" }
  | { kind: "error" }
  | { kind: "ready"; rows: LeaderboardRow[]; benchmarks: Benchmark[]; me: LeaderboardRow | null; signedIn: boolean };

export default function Page() {
  const [preset, setPreset] = useState(PRESET_IDS[0]);
  const [board, setBoard] = useState<Board>({ kind: "loading" });

  const load = useCallback(async (presetId: string) => {
    setBoard({ kind: "loading" });
    try {
      const supa = supabaseBrowser();
      const [{ data: rows, error }, { data: marks }, { data: auth }] = await Promise.all([
        supa.from("leaderboard").select("rank,handle,score,played_on").eq("preset", presetId).order("rank").limit(TOP_N),
        supa.from("benchmarks").select("label,value,source,note").eq("preset", presetId),
        supa.auth.getUser(),
      ]);
      if (error) return setBoard(isMissingView(error.code, error.message) ? { kind: "not-live" } : { kind: "error" });

      const board = (rows ?? []) as LeaderboardRow[];
      const benchmarks = ((marks ?? []) as Benchmark[]).map((b) => ({ ...b, value: Number(b.value) }));
      let me: LeaderboardRow | null = null;
      if (auth.user) {
        const { data: profile } = await supa.from("profiles").select("handle").eq("id", auth.user.id).maybeSingle();
        const handle = profile?.handle as string | undefined;
        if (handle) {
          me = board.find((r) => r.handle === handle) ?? null;
          if (!me) {
            // Outside the top N: fetch just their row so it can be pinned below the board.
            const { data: own } = await supa.from("leaderboard").select("rank,handle,score,played_on")
              .eq("preset", presetId).eq("handle", handle).maybeSingle();
            me = (own as LeaderboardRow | null) ?? null;
          }
        }
      }
      setBoard({ kind: "ready", rows: board, benchmarks, me, signedIn: !!auth.user });
    } catch { setBoard({ kind: "error" }); }
  }, []);

  useEffect(() => { load(preset); }, [preset, load]);

  const chip = (active: boolean) => ({
    background: "none", border: "none", marginRight: 16, paddingBottom: 1,
    color: active ? "var(--teal)" : "var(--faint)", fontWeight: active ? 700 : 400,
    borderBottom: active ? "2px solid var(--teal)" : "none",
  } as const);

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 760 }}>
      <p className="microlabel">leaderboard · all-time best per player</p>
      <div className="mono" style={{ fontSize: 12, margin: "18px 0 26px" }}>
        {PRESET_IDS.map((id) => (
          <button key={id} type="button" style={chip(preset === id)} onClick={() => setPreset(id)}>{PRESETS[id].title}</button>
        ))}
      </div>
      <Body board={board} />
    </div>
  );
}

function Body({ board }: { board: Board }) {
  if (board.kind === "loading") return <p className="mono" style={{ color: "var(--muted)", fontSize: 13 }}>loading…</p>;
  if (board.kind === "not-live") {
    return (
      <p style={{ color: "var(--body)", maxWidth: "58ch", lineHeight: 1.6 }}>
        The leaderboard isn&apos;t live yet — its database view ships in migration{" "}
        <span className="mono">0003_leaderboard.sql</span>, which hasn&apos;t been applied to this project.
      </p>
    );
  }
  if (board.kind === "error") return <p className="mono" style={{ color: "var(--bad)", fontSize: 13 }}>couldn&apos;t load the board just now.</p>;
  if (board.rows.length === 0) {
    return <p style={{ color: "var(--body)", maxWidth: "58ch", lineHeight: 1.6 }}>No ranked runs yet. Finish a full timed sim while signed in and you&apos;ll be first on the board.</p>;
  }

  return (
    <>
      <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {weave(board.rows, board.benchmarks).map((item, i) =>
          item.kind === "benchmark" ? (
            <li key={`b${i}`} className="mono" data-testid="benchmark"
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", color: "var(--teal)", fontSize: 11.5 }}>
              <span style={{ flex: 1, borderTop: "1px dashed var(--teal)", opacity: 0.5 }} />
              <span title={item.benchmark.source}>
                {item.benchmark.value} · {item.benchmark.label} · {item.benchmark.source.split(";")[0]}
              </span>
              <span style={{ flex: 1, borderTop: "1px dashed var(--teal)", opacity: 0.5 }} />
            </li>
          ) : (
            <Row key={item.row.handle} row={item.row} isMe={board.me?.handle === item.row.handle} />
          ),
        )}
      </ol>
      {board.me && !board.rows.some((r) => r.handle === board.me!.handle) && (
        <ol style={{ listStyle: "none", padding: 0, margin: "6px 0 0", borderTop: "2px solid var(--card-border)" }}>
          <Row row={board.me} isMe />
        </ol>
      )}
      {!board.signedIn && (
        <p className="mono" style={{ marginTop: 22, fontSize: 12, color: "var(--muted)" }}>
          <Link href="/login">Sign in</Link> to rank — scores kept only on this device don&apos;t count.
        </p>
      )}
    </>
  );
}

function Row({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) {
  return (
    <li className="mono" data-testid={isMe ? "my-row" : "board-row"}
        style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "9px 0",
                 borderBottom: "1px solid var(--card-border)", fontSize: 13,
                 color: isMe ? "var(--ink)" : "var(--body)", fontWeight: isMe ? 700 : 400 }}>
      <span style={{ width: 34, color: "var(--muted)" }}>{row.rank}</span>
      <span>{row.handle}{isMe && <span style={{ color: "var(--teal)" }}> · you</span>}</span>
      <span style={{ flex: 1, color: "var(--faint)", overflow: "hidden", whiteSpace: "nowrap" }}>
        {" "}····································································································
      </span>
      <span style={{ color: "var(--muted)" }}>{row.played_on}</span>
      <span style={{ width: 42, textAlign: "right", fontWeight: 700 }}>{row.score}</span>
    </li>
  );
}
