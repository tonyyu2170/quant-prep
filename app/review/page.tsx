"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isDue, parseSequenceReviewKey, review, type ReviewRow } from "@qp/engine";
import { getStore } from "@/lib/store/useStore";
import { SEQ_FAMILIES, type SeqFamily } from "@qp/generators";
import { byId, TOPIC_LABELS } from "@/content/problems";
import SequenceReview from "@/components/SequenceReview";
import { ProblemSession } from "@/components/ProblemRunner";

/** A queue row is reviewable if it names a live content template or a live sequence family. */
function resolve(problemId: string): { kind: "problem"; label: string } | { kind: "sequence"; label: string; family: SeqFamily; difficulty: 1 | 2 | 3 } | null {
  const t = byId.get(problemId);
  if (t) return { kind: "problem", label: `${TOPIC_LABELS[t.topic] ?? t.topic} · L${t.difficulty}` };
  const seq = parseSequenceReviewKey(problemId);
  if (seq && (SEQ_FAMILIES as readonly string[]).includes(seq.family)) {
    return { kind: "sequence", label: `sequences · ${seq.family} · L${seq.difficulty}`, family: seq.family as SeqFamily, difficulty: seq.difficulty };
  }
  return null;
}

const fmtDue = (iso: string, now: number) => {
  const d = Math.round((Date.parse(iso) - now) / 86_400_000);
  if (d <= 0) return "due now";
  return d === 1 ? "tomorrow" : `in ${d} days`;
};

export default function Page() {
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [running, setRunning] = useState<ReviewRow[] | null>(null);
  const [nonce, setNonce] = useState(0);

  const load = useCallback(() => { getStore().listReviews().then(setRows).catch(() => setRows([])); }, []);
  useEffect(() => { setNonce(Math.floor(Math.random() * 2 ** 31)); load(); }, [load]);

  const now = Date.now();
  const due = useMemo(() => (rows ?? []).filter((r) => resolve(r.problemId) && isDue(r, new Date(now))), [rows, now]);

  async function remove(problemId: string) {
    setRows((rs) => (rs ?? []).filter((r) => r.problemId !== problemId));
    await getStore().removeReview(problemId);
  }

  if (running) return <ReviewSession queue={running} nonce={nonce} onDone={() => { setRunning(null); load(); }} />;

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 760 }}>
      <p className="microlabel">review queue</p>
      {rows === null ? (
        <p className="mono" style={{ marginTop: 30, color: "var(--muted)", fontSize: 13 }}>loading…</p>
      ) : rows.length === 0 ? (
        <p style={{ marginTop: 30, color: "var(--body)", maxWidth: "58ch", lineHeight: 1.6 }}>
          Nothing queued yet. Miss a problem in <Link href="/drills/probability">a probability drill</Link> and it lands
          here automatically — or add one yourself from the walkthrough.
        </p>
      ) : (
        <>
          <p className="mono" style={{ margin: "18px 0 24px", fontSize: 14 }}>
            <b style={{ color: due.length ? "var(--teal)" : "var(--muted)", fontSize: 22 }}>{due.length}</b>
            <span style={{ color: "var(--muted)" }}> due now · {rows.length} queued</span>
            {due.length > 0 && (
              <button type="button" data-testid="start-review" onClick={() => setRunning(due)}
                      style={{ background: "none", border: "none", marginLeft: 20, color: "var(--teal)", fontWeight: 700, fontSize: 13 }}>
                Start review →
              </button>
            )}
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.map((r) => {
              const res = resolve(r.problemId);
              return (
                <li key={r.problemId} className="mono"
                    style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "9px 0", borderBottom: "1px solid var(--card-border)", fontSize: 13 }}>
                  <span style={{ color: res ? "var(--ink)" : "var(--muted)" }}>
                    {res ? res.label : "retired problem"}
                  </span>
                  <span style={{ flex: 1, color: "var(--faint)", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {" "}····································································································
                  </span>
                  <span style={{ color: isDue(r, new Date(now)) ? "var(--teal)" : "var(--muted)" }}>{fmtDue(r.dueAt, now)}</span>
                  <button type="button" onClick={() => remove(r.problemId)} aria-label={`remove ${r.problemId}`}
                          style={{ background: "none", border: "none", color: "var(--faint)", fontSize: 12 }}>
                    remove
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function ReviewSession({ queue, nonce, onDone }: { queue: ReviewRow[]; nonce: number; onDone: () => void }) {
  const [i, setI] = useState(0);
  const row = queue[i];
  const res = row ? resolve(row.problemId) : null;

  if (!row || !res) {
    return (
      <div className="container" style={{ padding: "48px 24px", maxWidth: 760 }}>
        <p className="microlabel">review complete</p>
        <p style={{ marginTop: 22, color: "var(--body)" }}>{queue.length} reviewed. Each one is rescheduled by how it went.</p>
        <p className="mono" style={{ marginTop: 18, fontSize: 13 }}>
          <button type="button" onClick={onDone} style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 700 }}>Back to the queue</button>
        </p>
      </div>
    );
  }

  const grade = (correct: boolean) => { getStore().saveReview(review(row, correct, new Date())).catch(() => {}); };

  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 760 }}>
      <p className="microlabel" style={{ marginBottom: 20 }}>review · {i + 1} of {queue.length}</p>
      {res.kind === "sequence" ? (
        <SequenceReview
          key={row.problemId}
          family={res.family}
          difficulty={res.difficulty}
          onGraded={grade}
          onNext={() => setI((v) => v + 1)}
        />
      ) : (
        <ProblemSession
          key={row.problemId}
          template={byId.get(row.problemId)!}
          // Fresh seed per review so the numbers are never the memorized ones (spec §6).
          seed={(nonce ^ Math.imul(i + 1, 2654435761)) >>> 0}
          mode="review"
          onGraded={grade}
          onNext={() => setI((v) => v + 1)}
          onHarder={null}
        />
      )}
    </div>
  );
}
