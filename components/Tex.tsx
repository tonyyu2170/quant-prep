"use client";
import { useMemo } from "react";
import katex from "katex";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Renders a string whose $...$ segments are KaTeX inline math; prose is escaped.
export default function Tex({ text }: { text: string }) {
  const html = useMemo(
    () => text.split(/\$([^$]+)\$/g)
      .map((seg, i) => (i % 2 === 1 ? katex.renderToString(seg, { throwOnError: false }) : esc(seg)))
      .join(""),
    [text],
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
