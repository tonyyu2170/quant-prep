#!/bin/zsh
# Scrape every known QuantGuide question page into .firecrawl/qg/.firecrawl/ (where the CLI
# insists on writing). Paced: the API caps requests per minute and a burst fails the whole
# batch silently, so batches are small and a batch that lands nothing is retried after a wait.
ROOT=/Users/turdy/coding_fun/projects/quant-prep
cd $ROOT/.firecrawl/qg
OUT=$ROOT/.firecrawl/qg/.firecrawl
mkdir -p $OUT
SLUGS=(${(f)"$(cat $ROOT/.firecrawl/all-slugs.txt)"})
todo=()
for s in $SLUGS; do
  [[ -f "$OUT/quantguide.io-questions-$s.md" ]] || todo+=("https://www.quantguide.io/questions/$s")
done
echo "to scrape: ${#todo}"
i=1
while (( i <= ${#todo} )); do
  batch=(${todo[i,i+1]})
  before=$(ls $OUT/*.md 2>/dev/null | wc -l | tr -d ' ')
  for attempt in 1 2 3; do
    firecrawl scrape $batch --wait-for 2500 >/dev/null 2>&1
    after=$(ls $OUT/*.md 2>/dev/null | wc -l | tr -d ' ')
    (( after > before )) && break
    echo "  batch $i attempt $attempt landed nothing — backing off"
    sleep 20
  done
  echo "at $i: $(ls $OUT/*.md 2>/dev/null | wc -l | tr -d ' ') files"
  i=$((i+2))
  sleep 4
done
echo "HARVEST DONE: $(ls $OUT/*.md 2>/dev/null | wc -l | tr -d ' ') files"
