export interface LeaderboardRow { rank: number; handle: string; score: number; played_on: string }
export interface Benchmark { label: string; value: number; source: string; note: string | null }

export type BoardItem =
  | { kind: "row"; row: LeaderboardRow }
  | { kind: "benchmark"; benchmark: Benchmark };

/**
 * Weave benchmark thresholds into a ranked board as divider rows.
 *
 * A benchmark sits directly above the first score that falls below it, so the board reads
 * "these players cleared the invite zone, these did not". Benchmarks are never rendered as
 * player rows (parent spec §7) — they carry no handle and no rank.
 */
export function weave(rows: LeaderboardRow[], benchmarks: Benchmark[]): BoardItem[] {
  const pending = [...benchmarks].sort((a, b) => b.value - a.value);
  const out: BoardItem[] = [];
  for (const row of rows) {
    while (pending.length && row.score < pending[0].value) {
      out.push({ kind: "benchmark", benchmark: pending.shift()! });
    }
    out.push({ kind: "row", row });
  }
  for (const benchmark of pending) out.push({ kind: "benchmark", benchmark });
  return out;
}
