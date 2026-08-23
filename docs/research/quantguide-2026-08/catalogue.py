#!/usr/bin/env python3
"""Parse scraped QuantGuide question pages into a catalogue TSV.

Each page renders, in order: the title, the difficulty, one or more topic tags, then the
prompt. Everything after "Notes" is chrome. The category totals in the footer are the
platform's own counts and are captured separately.
"""
import re
import sys
from pathlib import Path

SRC = Path(__file__).parent / "qg" / ".firecrawl"
DIFFS = {"Easy", "Medium", "Hard"}
CHROME_START = "Notes"

rows = []
totals = {}
for f in sorted(SRC.glob("quantguide.io-questions-*.md")):
    slug = f.name[len("quantguide.io-questions-"):-len(".md")]
    lines = [ln.strip() for ln in f.read_text().splitlines()]
    # The body starts after the "PromptSolution" marker the page uses to head the question.
    try:
        i = next(j for j, ln in enumerate(lines) if ln.startswith("PromptSolution"))
    except StopIteration:
        continue
    body = [ln for ln in lines[i + 1:] if ln and not ln.startswith("![")]
    if CHROME_START in body:
        prompt_block, foot = body[:body.index(CHROME_START)], body[body.index(CHROME_START):]
    else:
        prompt_block, foot = body, []
    if not prompt_block:
        continue
    title = prompt_block[0]
    diff = next((x for x in prompt_block[1:4] if x in DIFFS), "")
    tags = [x for x in prompt_block[1:6] if x not in DIFFS and x != title and len(x) < 40]
    # The prompt is the first long line after the tags — a real sentence, not a chip.
    prompt = next((x for x in prompt_block[1:] if len(x) > 60), "")
    rows.append((slug, title, diff, "|".join(tags), prompt))
    for m in re.finditer(r"(Probability|Brainteasers|Statistics|Pure Math|Finance)\n0/(\d+)", "\n".join(foot)):
        totals[m.group(1)] = int(m.group(2))

out = Path(__file__).parent / "quantguide-catalogue.tsv"
with out.open("w") as fh:
    fh.write("slug\ttitle\tdifficulty\ttags\tprompt\n")
    for r in rows:
        fh.write("\t".join(x.replace("\t", " ") for x in r) + "\n")
print(f"{len(rows)} questions -> {out}")
print("platform totals:", totals)
