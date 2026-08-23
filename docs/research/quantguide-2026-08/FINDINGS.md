# QuantGuide harvest — 2026-08-23

A second outside bank, read the same way `quantprof-2026-08/` was read: for coverage and
difficulty calibration, never for wording. **Their prompts are deliberately not in this
repo.** `catalogue.tsv` carries slug, title, difficulty and category only — facts about
what exists, not their text. The prompts were read locally to produce the gap list below
and left in the gitignored `.firecrawl/qg/.firecrawl/` scratch directory — re-scraping them
costs one Firecrawl credit per page, so check there before spending any.

## What was collected, and what it is a sample of

- 218 question pages scraped by slug (`.firecrawl/harvest.sh`), of which **177 are
  unlocked** and carry a difficulty, a category and a prompt; 41 are premium-locked and
  give only a title.
- The platform's own totals, printed in every page footer:

| category | theirs | ours before tonight | ours now |
|---|---|---|---|
| Probability | 733 | 180 | 180 |
| Brainteasers | 246 | 11 | 16 |
| Statistics | 76 | **0** | 5 |
| Pure Math | 60 | **0** | 0 |
| Finance | 96 | **0** | 0 |
| total | 1211 | 191 | 201 |

The slug list came from walking listing pages 8 through 25 of their question index
(`paginate.sh`, in the scratch directory) under a sort order that was never checked — the
captured hrefs are not alphabetical, so it is some other ordering. Call it an **uncontrolled
slice**, not a random sample. It does not flip the result below: the gap between 39% and
QuantProf's 16% is far too large for a sampling artefact of this size to explain, and the
locked-versus-unlocked test points the same way. But the headline should be read knowing the
slice was not drawn deliberately.

## The headline result: their easy tier is BIGGER than ours

Over the 177 unlocked questions:

| | Easy | Medium | Hard |
|---|---|---|---|
| **QuantGuide, unlocked sample (n=177)** | **39%** | **46%** | **15%** |
| ours, whole bank (n=201) | 30% | 45% | 25% |
| QuantProf, levels 1-3 / 4-6 / 7-10 (n=694) | 16% | 53% | 31% |

`COVERAGE.md` currently carries QuantProf's row as evidence that "our easy tier is roughly
2.5x overweight" and that closing the gap means **130 more L2/L3 templates**. A second
outside bank says the opposite: on a three-level scale that needs no mapping — QuantGuide
labels questions Easy/Medium/Hard exactly as we label them L1/L2/L3 — a live commercial
competitor puts *more* weight on the bottom tier than we do, and our bank is already the
harder of the two.

### The obvious objection, tested and rejected

Platforms unlock easy questions to advertise, so the unlocked sample should skew easy and
flatter us. **It skews the other way.** Their playlist pages (Top 50, Quant Trader 75)
render a difficulty on every card *including* the locked ones, which gives a controlled
comparison inside one curated list:

| within the playlists | n | Easy | Medium | Hard |
|---|---|---|---|---|
| unlocked | 68 | 37% | 41% | 22% |
| **locked** | 58 | **47%** | 41% | 12% |

The locked half is the easier half. So the 39% Easy measured on unlocked questions is, if
anything, an *under*estimate of their true bottom-tier share.

Two caveats stay on the record. The playlist rows are a curated "most asked" list, so their
absolute mix is not the platform's — only the locked-versus-unlocked *contrast* within them
is controlled. And Easy/Medium/Hard is their author's judgement against their bank, as L1/L2/L3
is ours against ours; the scales are named alike, not calibrated alike.

**Recommendation: retire the 130-template target.** COVERAGE.md already warned that treating
QuantProf's 16% as a number to hit was "false precision"; this is the measurement that
settles it. Author L2/L3 mass because a middle-tier problem is worth more to a candidate,
not to move a ratio that two outside banks disagree about by a factor of two.

## The real gaps are categories, not levels

Three of their five categories are ones we had nothing in at all. Read out of the unlocked
prompts, here is what each actually contains.

### Finance — 96 theirs, 0 ours. The largest hole.

Their 11 unlocked finance questions cluster into four techniques, all exactly computable and
all standard trading-interview material:

- **No-arbitrage on a book** — three horses quoted at decimal odds, or a set of contracts on
  the teams in a group; is the book beatable, and by how much. Also the forex version, a
  triangular loop through three exchange rates.
- **Option parity and Greek relations** — the put's gamma given the call's, which strike
  carries the most gamma, European against American bounds on the same strike.
- **Discounting** — a coupon bond's present value, and what a perpetual cash flow is worth at
  a target yield.
- **Payoff shape** — where a butterfly wants the underlying to finish.

Our home page has advertised a "market-making game" as coming next for weeks. This category
is the content half of that.

### Pure Math — 60 theirs, 0 ours

Linear algebra on structured matrices (eigenvalues of a rank-one update, of a
constant-plus-diagonal), linear Diophantine equations, solid geometry (the Steinmetz solid),
and a martingale/Brownian-motion strand — optional stopping, hitting-time transforms,
constructing a martingale from a process. The martingale strand is the one a quant interview
actually reaches for and we have nothing adjacent to it.

### Statistics — 76 theirs, 5 ours as of tonight

Their emphasis is squarely on OLS: R-squared from SSE and SSR, what duplicating every data
point does to R-squared and to the coefficient variance, the two regression slopes and how
they compose, and variance of sums with deliberately overlapping terms. Tonight's B9 batch
covers the two-regression relation and the moment arithmetic; the residual-sum-of-squares
identities and the overlapping-sums construction are still open.

## Method note

Both scripts are committed beside this file. `catalogue.py` parses the scraped pages;
`harvest.sh` does the scraping, paced to two URLs at
a time because that is the account's parallel-scrape limit and a larger burst fails the whole
batch with a per-minute rate-limit error rather than queuing. An unpaced first attempt looked
like it was working — it printed a batch line per iteration — while landing 10 files out of
170 URLs, because the errors went to `/dev/null`. Any future harvest should assert on files
landed rather than on the command returning.
