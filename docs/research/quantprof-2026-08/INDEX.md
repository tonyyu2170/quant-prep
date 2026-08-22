# QuantProf.org harvest — 2026-08-22

Everything below was collected through the site UI on a logged-in FREE account.
No paywall was bypassed; the Firestore backend was never queried directly.

## Files

| file | what it is | n |
|---|---|---|
| `problems-index.tsv` | Full problem catalogue: order, id, title, topic, difficulty(/10), company tags, FREE/PAID | 976 |
| `free-problems.jsonl` | Full statements of every free problem (id, title, statement) | 60 |
| `sequences.txt` | Every unique Sequences Pro question seen, tagged e/m/h | 685 |
| `seq.jsonl` | Same, as JSONL for the classifier | 685 |
| `sequence-families.txt` | Family classification per difficulty, with worked examples | — |
| `family-mix.txt` | Family x difficulty matrix vs. our own SEQ_FAMILIES | — |
| `zetamac.txt` | Every Arithmetic Zetamac question played, tagged e/m/h, with answer | 515 |
| `optiver-80.txt` | Optiver 80-in-8 questions with all four multiple-choice options | 24 |
| `classify.py` | Sequence-rule classifier (99.4% coverage on the corpus) | — |

## How the games were played

- Sequences Pro: 3-min rounds at each of easy/medium/hard. Answers were
  deliberately junk (a wrong answer just advances), so scores are meaningless;
  only the questions were being collected. Rules were recovered offline.
- Arithmetic Zetamac: played for real and solved correctly (169 hard / 150 easy
  / 196 medium, 100% accuracy) across all 4 operations.
- Optiver 80 in 8: played for real, 23/24 correct.

## Caveats

- Sequences Pro shows only 4 terms, so a handful of sequences admit more than
  one rule. 4 of 652 could not be pinned down from 4 terms alone; all 4 are
  interleaved arithmetic+geometric streams.
- Free problem statements were re-flowed from rendered KaTeX, so some inline
  math spacing differs from the source.
- Use this for coverage and gap analysis. Do not copy problem wording verbatim.
