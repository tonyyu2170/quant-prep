"use client";
import { useMemo, useState } from "react";
import DrillNav from "@/components/DrillNav";
import ProblemRunner from "@/components/ProblemRunner";
import { PROBLEMS, TOPIC_LABELS } from "@/content/problems";

export default function Page() {
  const topics = useMemo(() => [...new Set(PROBLEMS.map((t) => t.topic))], []);
  const [topic, setTopic] = useState<string | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | undefined>(undefined);
  const chip = (active: boolean) => ({
    background: "none", border: "none", marginRight: 14, paddingBottom: 1,
    color: active ? "var(--teal)" : "var(--faint)", fontWeight: active ? 700 : 400,
    borderBottom: active ? "2px solid var(--teal)" : "none",
  } as const);
  return (
    <div className="container" style={{ padding: "48px 24px", maxWidth: 760 }}>
      <DrillNav current="probability" />
      <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, flexWrap: "wrap", marginBottom: 26 }}>
        <span>
          <button type="button" style={chip(topic === undefined)} onClick={() => setTopic(undefined)}>all</button>
          {topics.map((t) => (
            <button key={t} type="button" style={chip(topic === t)} onClick={() => setTopic(t)}>{TOPIC_LABELS[t] ?? t}</button>
          ))}
        </span>
        <span>
          <button type="button" style={chip(difficulty === undefined)} onClick={() => setDifficulty(undefined)}>any</button>
          {([1, 2, 3] as const).map((dd) => (
            <button key={dd} type="button" aria-pressed={difficulty === dd} style={chip(difficulty === dd)} onClick={() => setDifficulty(dd)}>L{dd}</button>
          ))}
        </span>
      </div>
      <ProblemRunner topic={topic} difficulty={difficulty} />
    </div>
  );
}
