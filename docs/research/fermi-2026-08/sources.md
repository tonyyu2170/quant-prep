# Fermi game — Task 0 retrieval log

Retrieval date: **2026-08-24**. Everything below was fetched, not recalled.
Negative results are recorded on purpose: they are the expensive part of this task
and a future session should not have to re-walk them.

---

## Part 1: the rates the plan's two templates need

Plan Task 0 Step 3 rule: *"If you cannot find a citable figure for a rate, that
template does not ship."* Applying it honestly:

### piano-tuners

| Factor | Status | What was found |
|---|---|---|
| tunings per piano-year | **citable** | Steinway & Sons, Service & Maintenance: recreational use (1 hr/day) → "Tuning: 2–4 times per year"; heavy use (6+ hr/day) → "Tuning: 12 times per year". <https://www.steinway.com/news/features/utilty/service-and-maintenance> — Corroborated by PianoBuyer (Sally Phillips, pub. 2017-09-13): "two or three times a year" for home pianos. <https://www.pianobuyer.com/post/piano-tuning-an-introduction> |
| hours per tuning | **citable** | PianoBuyer, same article: "a skilled technician can do an excellent job in 1½ to 2½ hours, sometimes less". Tunings-per-tuner-day is a *derivation* from this plus travel, not a published figure. |
| working days per year | **citable** | Trivial / standard business-day count. |
| **pianos per person** | **NOT CITABLE — kills the template** | See below. |

**pianos per person — the failed search.** The figure quoted everywhere is "over 4.5
million U.S. households own a piano, per NAMM". Every instance found is a market-research
vendor page citing NAMM with no link, no report name, and no year. The one NAMM primary
source that survives a fetch is the Gallup *American Attitudes Toward Making Music* release
<https://www.namm.org/news/press-releases/gallup-organization-reveals-findings-american-attitudes-toward-making-music>,
which gives household ownership of *any* musical instrument ("51 percent owned a musical
instrument") and **no piano-specific number** — and is a **2003** survey, which would fail
the staleness gate (`MAX_DATA_AGE_YEARS = 10`) by 13 years regardless.
Music Trades' acoustic-piano census (<https://www.musictrades.com/number-of-pianos-sold-in-the-us.html>)
is the one plausible primary source and was not retrievable.

This is exactly the failure mode the plan was rewritten to prevent: a real-looking
attribution with nothing behind it. Not substituted with a plausible number.

### barbers

| Factor | Status | What was found |
|---|---|---|
| haircuts per person-year | **NOT CITABLE** | Only Statista's paywalled *Frequency of hair cuts in the U.S. 2011–2020* (re-publishing Simmons National Consumer Survey) and Unilever-owned content marketing (allthingshair.com: "Men … 5.84 times per year … women 3.81"). No retrievable primary. |
| cuts per barber-day | **NOT CITABLE** | Nothing published found at all. |

**Both of the plan's templates fail Task 0 Step 3 as written.** The plan's four-edit drop
procedure covers dropping `barbers`; it has no path for dropping both.

### Access note

`bls.gov` returns **HTTP 403** to every automated fetch (WebFetch and curl with a browser
UA both blocked). The Step 2 OES reference figures are therefore not reachable by the
tools used here without driving a real browser.

---

## Part 2: what IS retrievable (verified live, 2026-08-24)

Checked so the replacement direction is grounded in fetched data rather than proposed
from memory — the same mistake in a new place.

| Source | Verified how | Result |
|---|---|---|
| **Census Bureau**, Vintage 2025 metro/micro population estimates | `curl` of `https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/metro/totals/cbsa-est2025-alldata.csv` | **HTTP 200, 827 KB, 2,806 data rows.** Columns include `NAME`, `LSAD`, `POPESTIMATE2025`. `LSAD` separates "Metropolitan Statistical Area" from micropolitan areas and metro divisions, which enforces the plan's "one definition, all 60 rows" rule mechanically. Vintage = July 1 2025, final release 2026-06-25 → **~9 years of staleness runway**, vs ~16 months for the UN WUP 2018 column the plan assumed. |
| **EIA** | WebFetch of `https://www.eia.gov/tools/faqs/faq.php?id=97&t=3` | HTTP 200 (not blocked). "10,791 kilowatthours (kWh)" per residential customer, 2022; "about 899 kWh per month"; page last updated 2024-01-08. State-level per-customer figures published in Today in Energy #65244 (2024 data). |
| **World Bank Open Data API** | `curl` of `api.worldbank.org/v2/country/USA;IDN;NGA/indicator/EG.USE.ELEC.KH.PC?format=json` | HTTP 200, JSON, `lastupdated: 2026-07-13`, per-country per-capita values through 2023. Machine-readable and dated — usable for *global* per-capita rates if the city table stays global. |

---

## Status

Task 0 is **blocked on a content decision**, not on retrieval effort. Recorded above so
whichever direction is chosen starts from fetched facts.
