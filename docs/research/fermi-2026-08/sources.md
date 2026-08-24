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

---

## Part 3: the retrieved figures (direction chosen 2026-08-24: US federal chains)

Every number below was pulled from the named file on **2026-08-24** and is reproduced with the
publisher's own precision. Nothing here is recalled.

### 3.1 Populations — U.S. Census Bureau, Vintage 2025 Population Estimates

- File: `https://www2.census.gov/programs-surveys/popest/datasets/2020-2025/state/totals/NST-EST2025-ALLDATA.csv`
- Also pulled (metro-level, currently unused): `.../2020-2025/metro/totals/cbsa-est2025-alldata.csv`
- Vintage: estimates dated **July 1, 2025**; `POPESTIMATE2024` column used, to match the 2024
  vintage of the FHWA and EIA rate data. Final Vintage 2025 release **2026-06-25**.
- U.S. total, 2024: **340,003,797**. U.S. total, 2025: 341,784,857.
- Staleness runway against `MAX_DATA_AGE_YEARS = 10`: **~8-9 years.**

### 3.2 Vehicle / fuel rates — FHWA Highway Statistics 2024, Table VM-1

- Page: `https://www.fhwa.dot.gov/policyinformation/statistics/2024/vm1.cfm`
- Data file: `https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/vm1.xlsx`
- Sheet `2024_VM-1`, "ANNUAL VEHICLE DISTANCE TRAVELED IN MILES AND RELATED DATA - 2024".
  Sheet header says **Updated: February 2026**. Vintage **2024**.
- Column used: `ALL LIGHT DUTY VEHICLES` (short + long wheelbase — cars, light trucks, vans, SUVs).

| Factor | Published value |
|---|---|
| Motor vehicles registered | **271,085,742** |
| Average miles traveled per vehicle | **10,786.6516** |
| Average miles per gallon of fuel consumed | **23.4307** |
| Average fuel consumption per vehicle (gallons) | 460.3646 |
| Fuel consumed (thousand gallons) | 124,798,268.8262 |

VM-1 is internally consistent: `10,786.6516 / 23.4307 = 460.36` gal/vehicle, and
`271,085,742 x 460.36 = 124,798,126` thousand gallons vs the published 124,798,269 (rounding).
**This means the chain cannot be validated against VM-1 itself — it is the same identity.**

### 3.3 Gasoline reference figures — FHWA Highway Statistics 2024, Table MF-21

- Data file: `https://www.fhwa.dot.gov/policyinformation/statistics/2024/xls/mf21.xlsx`
- "MOTOR-FUEL USE - 2024", sheet header **December 2025**. Vintage **2024**.
- Column used: HIGHWAY USE / TOTAL / **GASOLINE**, thousands of gallons, one row per state.
- This table is produced from **state-reported fuel tax receipts** — a different measurement
  process from VM-1's HPMS travel model, which is what makes it a real cross-check.
- Sum over the 50 states: **127,179,889** thousand gallons, vs VM-1 light-duty fuel of
  124,798,269 — the two independent federal tables agree to **1.9% (+0.008 log10)**.

### 3.4 Electricity rate and reference figures — EIA, 2024

- Page: `https://www.eia.gov/electricity/sales_revenue_price/`
- Data file: `https://www.eia.gov/electricity/sales_revenue_price/xls/table_5A.xlsx`
- "2024 Average Monthly Bill- Residential", from forms EIA-861 schedules 4A-D, EIA-861S and
  EIA-861U. Vintage **2024**. The EIA-861U component matters: it covers retail-choice customers,
  so this table is full coverage, unlike the "utility bundled" tables 6 and 10.
- U.S. total: **143,144,185** residential customers, **863.27502** kWh average monthly
  consumption -> **10,359 kWh per account-year**.
- Per-state customers and average monthly consumption are published in the same table and are
  used as the per-row reference figures.

**Definitional caveat, recorded because it is load-bearing.** An EIA "residential customer" is a
metered account, not a household. 143,144,185 accounts against a population of 340,003,797 gives
**2.38 people per account**, whereas the Census average household size is nearer 2.5. Master-metered
apartment buildings, vacant units with live meters and second homes all sit in that gap. The
factor is therefore labelled as *accounts*, not households.

Census average-household-size tables were **not** used: the ACS API requires a key
(`api.census.gov` returns "Missing Key") and the CPS household table paths probed all 404'd.
Rather than substitute a remembered figure, the chain uses EIA's own published account count.

### 3.5 Measured chain-vs-reference gaps

Computed 2026-08-24 by applying the **national** rate to each state's Census population and
comparing against that state's **independently published** figure. This is the Task 0 Step 5
sanity check, run across 50-51 rows rather than the two the plan asked for.

**Gasoline** (national VM-1 rate vs each state's MF-21 receipts):

```
n=50   median -0.037 log10   min -0.204 (Alabama)   max +0.178 (New York)
within 0.3 log10 (factor 2) of the published figure: 50/50
```

The signs are physically sensible, which is the check that the numbers are real and not
coincidence: New York is the largest positive (dense, transit-served, low miles per capita, so a
national-average chain over-predicts) and Alabama the largest negative (rural, high miles per
capita).

**Residential electricity** (national EIA rate vs each state's own EIA figure):

```
n=51   median -0.029 log10   min -0.187 (Louisiana)   max +0.373 (Hawaii)
within 0.3 log10 (factor 2): 49/51   -- California +0.301 and Hawaii +0.373 exceed it
```

The two exceedances are **not** a wrong rate. Residential electricity is dominated by space
heating and cooling, so it disperses far more than driving does: Hawaii and California are
mild-climate and gas-heated, Louisiana is hot and humid. This is a genuinely wider quantity, and
Task 4 pins the tolerance from this measurement rather than from comfort.

### 3.6 District of Columbia

Excluded from the gasoline table. DC's chain value is roughly **+0.42 log10** above its MF-21
figure because a large commuting population drives in and buys fuel in Maryland and Virginia.
That is a definitional artefact of using a state-shaped row for a city-shaped place, not an
error in the rate.

---

## Status

Retrieval is **complete** for two chains, both federal, both with per-row independently published
reference figures.
