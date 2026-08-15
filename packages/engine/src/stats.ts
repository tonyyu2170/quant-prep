export interface AttemptLike { topic: string; correct: boolean; timeMs: number; createdAt: string }
export interface SessionLike { preset: string; score: number; createdAt: string }
export interface SeriesPoint { date: string; value: number; n: number }

const dateOf = (iso: string) => iso.slice(0, 10);
const round1 = (v: number) => Math.round(v * 10) / 10;

function bucketByDay(rows: AttemptLike[], value: (rs: AttemptLike[]) => number): SeriesPoint[] {
  const byDay = new Map<string, AttemptLike[]>();
  for (const r of rows) {
    const d = dateOf(r.createdAt);
    byDay.set(d, [...(byDay.get(d) ?? []), r]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rs]) => ({ date, value: value(rs), n: rs.length }));
}

export function accuracySeries(rows: AttemptLike[]): SeriesPoint[] {
  return bucketByDay(rows, (rs) => round1((100 * rs.filter((r) => r.correct).length) / rs.length));
}

export function paceSeries(rows: AttemptLike[]): SeriesPoint[] {
  return bucketByDay(rows, (rs) => round1(rs.reduce((s, r) => s + r.timeMs, 0) / rs.length / 1000));
}

export function topicAccuracy(rows: AttemptLike[]): Record<string, { pct: number; n: number }> {
  const out: Record<string, { pct: number; n: number }> = {};
  for (const topic of new Set(rows.map((r) => r.topic))) {
    const rs = rows.filter((r) => r.topic === topic);
    out[topic] = { pct: round1((100 * rs.filter((r) => r.correct).length) / rs.length), n: rs.length };
  }
  return out;
}

export function bestScoreSeries(sessions: SessionLike[], preset: string): { score: number; date: string }[] {
  return sessions
    .filter((s) => s.preset === preset)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((s) => ({ score: s.score, date: dateOf(s.createdAt) }));
}

export function currentStreak(activeDates: string[], today: string): number {
  const set = new Set(activeDates);
  let streak = 0;
  const cursor = new Date(today + "T00:00:00Z");
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
