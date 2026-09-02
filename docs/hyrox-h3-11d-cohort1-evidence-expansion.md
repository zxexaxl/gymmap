# HYROX H3-11D Cohort 1 Evidence Expansion Pilot

Status: **EVIDENCE CANDIDATE / HUMAN REVIEW REQUIRED**

Persistence verdict: **RAW FACT PERSISTENCE GATE REQUIRED**

Source authority: `45182f0804c07adcde20150e5d5fccc3fd312586` (`origin/main`)

Protocol: `hyrox-review-coverage` / `h3-11a-v1`

This pilot applies the accepted H3-11A collection contract to the eight accepted H3-11C Cohort 1 facilities. It preserves official-source assertions as positive raw facts, evaluates review coverage by dimension and aspect, and prepares but does not apply review-ledger or positive-publication candidates. It performs no station derivation and makes no negative facility inference.

## Boundary and outcome

- Production writes: **none**.
- Review-ledger candidate: 8 cycles, 296 units, 476 source relations, 0 invalidations.
- Evidence records: 61, comprising 57 positive raw observations and 4 separately classified access-restriction observations.
- Legacy-compatible publication candidates: 19 equipment and 18 capability rows. All remain unpublished.
- Derived station rows: 0.
- `NO_POSITIVE_FOUND`: 0. Every unclosed unit remains `PARTIAL` and either `UNKNOWN` or `INSUFFICIENT`; absence remains unknown.
- Schema migration authorization: none. The observed component, space, typed usage, restriction, and freshness gaps require a separate decision.

## Cohort identity

| Facility | Location ID | HGY ID | Official | Existing enrichment |
|---|---|---|---:|---:|
| CLUB 360 | `33bc8540-aca5-4aca-9921-c3f14dd8d067` | `HGY_4GF2DeDJoIzNRU4jn9scAv65V` | yes | 0 |
| FITONE SHIBUYA | `53fb0bd7-5dde-4936-99e5-812fef6928de` | `HGY_6lR3pcwsQaSGSlsQTdrNrO1jc` | yes | 0 |
| g-zone PARK | `6a648255-f646-4b01-b602-5898ef28ea5f` | `HGY_C0V7CK7K15SLUrMhBvyyO0phM` | yes | 0 |
| VAMOS | `53b51872-63cb-4bfd-aa25-861df7cf203b` | `HGY_CKpn4DHneWfrqTUVaA7D5Whop` | yes | 0 |
| CrossFit Ashiya | `9d7ac2ff-be49-4219-bcde-75e3745df6a4` | `HGY_Cl8QF5olON4Y0D7mho4iGg34L` | yes | 0 |
| Improve KYOTO | `e24cedfb-5333-4cd0-9164-1d764c3f6d73` | `HGY_gp7GcAxbIZtxk5KpvoDwAOOcr` | yes | 0 |
| HTC CHIKUSA | `4a07f1c3-3666-4648-bedd-35c283912e26` | `HGY_j1Szv4JmxytARCgfm48f0Z4xS` | yes | 0 |
| NOTA GYM 西京極店 | `0470dd2d-e6db-4c77-aa29-5cd72b597a4c` | `HGY_w8GnFtzgPzHOTZfWMBGzdEtoC` | yes | 0 |

`COHORT_1_IDENTITY_SHA256`: `1c53bd0698c0d1998f25e227409ee35c788c274994a22711e1dec1a323ce8fda`

## Fresh source recheck

The bounded recheck revisited exactly the 24 accepted H3-11C entrypoints. All 24 were available and remained facility-bound. Ten normal redirects were observed: all eight legacy Finder `/gym/HGY…` entrypoints now resolve to canonical `/gyms/...` pages, and the two CrossFit Ashiya paths add trailing slashes. These are recorded as redirect observations, not silent source rewrites.

| Facility | Reviewed first-party entrypoints | Result |
|---|---|---|
| CLUB 360 | Finder; `club360.jp/hyrox` | 2/2 available; exact facility/HYROX identity |
| FITONE SHIBUYA | `fitone-club.com`; Finder | 2/2 available; exact facility identity |
| g-zone PARK | `g-zone.co.jp/park`; `/park/hyrox`; Finder | 3/3 available; exact address and facility identity |
| VAMOS | Finder; `vamos-training.com/ja`; `/ja/classes` | 3/3 available; exact Ebisu facility and current schedule |
| CrossFit Ashiya | root; `/facility`; `/hyrox`; Finder | 4/4 available; exact Ashiya facility identity |
| Improve KYOTO | Finder; `improve-hyrox.com`; facility Hacomono schedule | 3/3 available; Improve and SOLERA boundaries kept separate |
| HTC CHIKUSA | root; `/facility.html`; `/program.html`; Finder | 4/4 available; exact Nagoya facility identity |
| NOTA GYM 西京極店 | Finder; root; `/hyrox/` | 3/3 available; exact 西京極 facility identity |

The eight Finder records resolve to existing `training_sources`. The other 16 URLs are explicitly marked `NEW_TRAINING_SOURCE_CANDIDATE`; none has been inserted.

## Review coverage

Each facility has one identity unit plus four aspects for each of the eight stations and the separate running environment: 37 units per facility, 296 total.

| Axis | State | Count |
|---|---|---:|
| progress | `COMPLETE` | 99 |
| progress | `PARTIAL` | 197 |
| sufficiency | `SUFFICIENT` | 99 |
| sufficiency | `UNKNOWN` | 12 |
| sufficiency | `INSUFFICIENT` | 185 |
| sufficiency | `BLOCKED` | 0 |
| outcome | `POSITIVE_FOUND` | 111 |
| outcome | `NOT_ASSESSED` | 185 |
| outcome | `NO_POSITIVE_FOUND` | 0 |

`COMPLETE` means positive closure for only that dimension/aspect under the reviewed source set. It does not mean full station capability, open use, or facility completeness. Twelve partial units preserve positive facts whose reviewed surface was not exhaustive. The remaining 185 units are not eligible for a no-positive conclusion.

## Facility review summary

| Facility | Sources | Complete / partial | Raw positive facts | No-positive | Gap facts | Review note |
|---|---:|---:|---:|---:|---:|---|
| CLUB 360 | 2 | 17 / 20 | 8 | 0 | 1 | Four named equipment facts plus open gym, coaching, and simulation; no lane/rope inference. |
| FITONE SHIBUYA | 2 | 1 / 36 | 6 | 0 | 4 | Sled, rope and movement-floor observations are positive but not a station derivation; membership eligibility is separate restriction evidence. |
| g-zone PARK | 3 | 1 / 36 | 4 | 0 | 3 | Large floor, official-tool assertion, free use and coaching are facility-level; tools are not itemized and program-hour exclusion is separate. |
| VAMOS | 3 | 1 / 36 | 3 | 0 | 2 | Official-equipment-set assertion, current HYROX classes and open gym; booking conditions remain separate. |
| CrossFit Ashiya | 4 | 25 / 12 | 10 | 0 | 3 | Strong enumerative equipment and sled-turf evidence; wall-ball target remains unknown. |
| Improve KYOTO | 3 | 19 / 18 | 3 | 0 | 1 | All-station class and current simulation; SOLERA running facts are not rebound to Improve. |
| HTC CHIKUSA | 4 | 32 / 5 | 20 | 0 | 9 | Most complete equipment/space/program surface; raw wall-ball, rope and non-sled space still need typed persistence, while plan-limited open gym is separate restriction evidence. |
| NOTA GYM 西京極店 | 3 | 3 / 34 | 3 | 0 | 0 | Direct SkiErg and rowing facts plus facility-level HYROX coaching; other stations remain open. |

## Positive raw evidence

- Equipment: 24 direct raw facts. Examples include CLUB 360 SkiErg/row/sled/sandbag, CrossFit Ashiya's enumerated station implements, HTC CHIKUSA's equipment and wall-ball target, and NOTA's SkiErg/row. Equipment presence never becomes a derived station state.
- Space: 11 raw facts. These include FITONE movement-floor statements, CrossFit Ashiya sled turf, and HTC's station-specific floor/ceiling zones. Generic gym floor is never converted to Burpee Broad Jump capability.
- Usage/access: 9 raw facts. Open gym, reserved free use, booked program use, and rental use remain separate positive assertions. `PROGRAM_USE_CONFIRMED` is non-exclusive; restriction observations are separate and unpublished.
- Coaching/program: 11 raw facts. These include coach-led HYROX programs and current simulations. A high-level legacy coaching fact is not retyped as station capability.
- Running auxiliary: positive facts occur only where the source directly supports a running floor, all-station-plus-running class, or treadmill/indoor-running environment. Running remains outside the eight stations.
- Non-itemized source assertions: 2. “Official HYROX tools/equipment set” statements at g-zone and VAMOS are retained without inventing individual equipment facts.

## Persistence fit and publication candidate

Of the 57 positive raw observations, 38 map to existing claim families at source-assertion level: 19 equipment facts and 19 legacy-capability-supporting observations. The other 19 positive observations require raw-fact persistence, and four additional access-restriction observations remain in a separate unpublished evidence family. Capability deduplication produces 18 candidate rows because HTC's two station-space facts support one legacy `sled-push-pull-space` candidate.

The candidate packet contains 19 equipment and 18 capability rows plus 38 deduplicated evidence relationships. Existing production overlap for these eight locations is zero. All 37 are positive candidates with source/fact references; none is published, and no station-state row exists. Access remains `unknown` on equipment candidates rather than being inferred from a facility-level service modality.

## Raw-fact persistence gate

| Gap | Observations | Why current schema is insufficient | Minimum future requirement |
|---|---:|---|---|
| Raw component | 7 | No typed place for sled rope, wall ball object, or non-itemized set assertions without misusing equipment/capability semantics. | Internal positive raw-component fact with dimension/aspect and evidence links. |
| Raw space | 8 | Non-sled lanes, movement areas, ceiling/target conditions and running areas do not fit existing equipment or high-level capabilities. | Internal positive raw-space fact with facility/dimension, source evidence, and freshness. |
| Raw usage | 4 | Station-scoped non-exclusive program/appointment use cannot be preserved by the legacy facility-level capability rows alone. | Typed positive usage fact supporting `OPEN_USE_CONFIRMED`, `COACHED_USE_CONFIRMED`, and `PROGRAM_USE_CONFIRMED`. |
| Explicit restriction | 4 | Eligibility, reservation, and excluded-hour observations must not be collapsed into a positive claim or public negative. | Separate internal restriction-evidence family; publication remains unauthorized. |
| Freshness policy | 19 affected new raw facts | Existing 180/90/30-day policies can be reused only when semantics match; new raw types lack frozen keys. | Freeze raw-fact policy mapping without inventing new horizons. |
| Derivation-only future | 0 | Derived station state is intentionally absent from this packet. | H3-11E only, after accepted raw persistence and rule/version authority. |

The review ledger can represent the review event and coverage axes, so these gaps do not block the 8-cycle/296-unit candidate. They do block lossless import of all raw facts and therefore block H3-11E derivation and any publication that depends on those facts.

## Protocol effectiveness

The one-pass packet successfully captured equipment, space, usage, coaching/program, running, binding, provenance and coverage metadata without repeating discovery. The protocol correctly prevented three common over-inferences: generic “official equipment” did not become eight equipment claims; program use did not become open use; and installed equipment did not become station feasibility.

No H3-11A correction is required. The repeated issue is persistence, not evidence semantics. Later cohorts can use the same packet, but Cohort 2 should not start until Human Review decides whether to establish the narrow raw-fact persistence layer.

## Deterministic authority

Hashes canonicalize object keys, preserve array order, and replace execution timestamps (`observed_at`, `reviewed_at`, confirmation/stale/expiry timestamps) with a fixed sentinel before semantic hashing.

- `COHORT_1_IDENTITY_SHA256`: `1c53bd0698c0d1998f25e227409ee35c788c274994a22711e1dec1a323ce8fda`
- `REVIEW_PACKET_SHA256`: `e86585713574c03663b27cfdbb2b9c3a1ab0b5940a491a9d5b78bf73a6983172`
- `LEDGER_CANDIDATE_SHA256`: `fce0ff185ddc571c59d12c96cab80b56b574544b4de8b7a4c717d1c8c9ecd536`
- `POSITIVE_CANDIDATE_SHA256`: `fe820952c155b43ff3249ec5c686f32c92484816293c5296494abd39916a3804`
- `PERSISTENCE_GAP_SHA256`: `9cc5248c71cd941af327d79a96b91ef33cbe4041dcd58df1f3d4df61f0f1d89c`

## Human decision boundary

Human Evidence Review must decide `ACCEPT` or `NEEDS_CORRECTION` for source interpretation, coverage closure, the ledger packet, and the legacy-compatible positive claim packet. Because material raw-fact gaps are present, acceptance should separately authorize or hold a narrow Raw Fact Persistence phase. This candidate does not authorize a production data gate, H3-11E, Cohort 2, schema change, or public UI change.
