# HYROX H3-11D Cohort 2 — BeeQuick Evidence and Production Data Candidate

## Status and boundary

`H3-11D — COHORT 2 PRODUCTION DATA CANDIDATE READY / HUMAN REVIEW REQUIRED`

This candidate applies the frozen H3-11A/H3-11B/R1/R2/R3 contracts to the exact six-facility BeeQuick cohort. It does not write Production, activate monitors, integrate main, derive station capability, or publish restrictions. Candidate acceptance will not authorize Production import.

Source authority is `origin/main` `973d7a71c01dc1b65a4b12c49bc484ad3cfd2e5f`. Production was inspected read-only at migration head `0015` and the Cohort 2 facilities had no equipment, capability, raw-fact, restriction, or review-cycle rows.

## Cohort and source review

The exact H3-11C cohort is:

| Facility | HGY ID | Equipment | Capability | Raw rows | Restriction rows | Complete / Partial units |
|---|---|---:|---:|---:|---:|---:|
| Beequick Fitness Fuji imaizumi | `HGY_KXsKkigAHxENjfO8pM4ocl6FF` | 5 | 0 | 2 | 2 | 7 / 30 |
| Beequick Kyotango | `HGY_VNYgC17BsAJ3cLgavQTUPCgay` | 6 | 1 | 2 | 1 | 17 / 20 |
| Beequick Fitness Iga Ninjyanosato | `HGY_YZfgVtrVZUDXC2kDU4ctStVOk` | 7 | 1 | 3 | 1 | 18 / 19 |
| Beequick Fitness Sanda | `HGY_e48JpyZiFH8V9aqp7zJ8ouQju` | 6 | 0 | 3 | 3 | 9 / 28 |
| Beequick Fitness Tateyama | `HGY_hh2gFINyLgIbu8P1uFb9ChYf1` | 6 | 1 | 2 | 2 | 15 / 22 |
| Beequick Fitness Kasugai Oshizawadai | `HGY_sbFQoJaYts6eUUShzWUC6e8sv` | 6 | 0 | 2 | 2 | 9 / 28 |

All six accepted BeeQuick facility pages were rechecked with at most four concurrent requests and two attempts. All returned HTTP 200, retained exact facility binding, and matched the recorded content hashes. Six existing Finder sources are reused; six facility pages are new source candidates; none are held.

Shared BeeQuick page structure supported one bounded reviewer, but each claim remains bound to the exact branch page. Brand membership was never used as cross-facility evidence.

## Review coverage

The packet contains 6 append-only review cycles, 222 canonical review units, and 228 unit/source relations. It records:

- 75 `COMPLETE / SUFFICIENT / POSITIVE_FOUND` units.
- 147 `PARTIAL / INSUFFICIENT / NOT_ASSESSED` units.
- 0 blocked units, invalidations, or `NO_POSITIVE_FOUND` outcomes.

Page silence was not converted to a negative conclusion. The packet neither claims overall facility completeness nor derives any of the eight station states.

## Positive and raw evidence

The 36 canonical equipment candidates are SkiErg 6, RowErg 6, weighted sled 5, farmers-carry implements 6, sandbag 6, treadmill 6, and running track 1. The 3 capability candidates are conservative `open-training` claims for Kyotango, Iga, and Tateyama only. There are no coaching or competition-simulation candidates.

The packet separately preserves 14 raw facts: 6 `general-training-floor`, 5 `wall-ball`, 1 `running-movement-space`, and 2 `appointment-use-confirmed`. Only the five wall-ball observations and one running-space observation receive dimension links. In particular, `general-training-floor` has no station link and no derivation meaning.

Eight restriction observations normalize to 11 internal rows: 6 membership eligibility, 3 plan-dependent access, and 2 trial-scoped reservation requirements. These rows do not authorize public restriction or negative semantics.

## Deferred non-blocking gap

Sanda has a facility-specific image that visibly shows a sled, rope, and marked turf lane. It could support `sled-pull-rope` and `multi-movement-training-space`, but the accepted R3 text monitor cannot deterministically validate those exact image semantics. The observation is preserved as `MONITOR_POLICY_GAP` and excluded from the import packet. No weaker HTML wording is substituted, and the rest of Cohort 2 remains safely releasable.

## Persistence, freshness, and monitoring

All included evidence fits existing live persistence. No schema or policy change is proposed. Raw facts use only the accepted R2 policies: `raw-physical-component-180-day`, `raw-space-90-day`, and `raw-usage-90-day`; restrictions use `raw-access-restriction-90-day`. Canonical equipment and open-use claims retain their existing 180/90-day policies.

The future monitor delta contains 39 canonical claim entries across 6 facility pages and 22 raw/restriction observations across the same 6 URLs. Every proposed current positive or internal raw/restriction observation has a deterministic monitor mapping. Source checks do not extend `reviewed_at`, and monitor activation is not part of this candidate.

## Projected state

| Concept | Before | After |
|---|---:|---:|
| Official HYROX facilities | 82 | 82 |
| Training sources | 124 | 130 |
| Equipment claims | 128 | 164 |
| Capability claims | 59 | 62 |
| Training evidence | 352 | 391 |
| Review cycles | 8 | 14 |
| Review units | 296 | 518 |
| Unit/source relations | 476 | 704 |
| Raw facts | 20 | 34 |
| Raw dimensions | 55 | 61 |
| Restrictions | 6 | 17 |
| Canonical monitored claims | 187 | 226 |
| Raw/restriction monitor entries | 23 | 45 |
| Equipment-positive facilities | 27 | 33 |
| Capability-positive facilities | 29 | 32 |
| Any-enriched facilities | 33 | 39 |

## Deterministic identities

- `COHORT_2_IDENTITY_SHA256`: `b8cae6c92d3bba76979270dbde5107a0f31d99aaf0eebdfd5726730f2913ded0`
- `SOURCE_DELTA_SHA256`: `86146a300fa6608833cfe43c1827a17f48d7231c0dd4410c29d4ff411d0ba113`
- `LEDGER_IMPORT_PACKET_SHA256`: `1b390447c7688bd69c43101e719dc907a7b76f5ab5ab963c20c449919a6cfa01`
- `CANONICAL_POSITIVE_IMPORT_SHA256`: `b0e18d3403b554dacdb32fa77f9a6affabbd0df69c5df071d319bd6bafbe0d15`
- `RAW_FACT_IMPORT_SHA256`: `c9e7efd119d9e38d8835cd15799f9c1fdeae8465878d0ff2b45cd0970031fddc`
- `RESTRICTION_IMPORT_SHA256`: `631f5f8337ab038d05ada4eabbf611d0307363f9e04596870ca18b471ea3cc9f`
- `CANONICAL_MONITOR_DELTA_SHA256`: `8df109cb2d709b982c4ad3dee865768fed4a4722deac7faee4086d7bb23eff45`
- `RAW_MONITOR_DELTA_SHA256`: `3e3372279d9260c6e2b0254282b1c2b6d5492eff8b480ee24b6c73d616f95da3`
- `DEFERRED_GAP_SHA256`: `054363858ffe423ab6164546958e035df218076087a39c828ad1d1a4e2aeddd3`
- `DB_IMPORT_PACKET_SHA256`: `8110a514eb2127f97be6c3c58e75da8638b99125b2a5c47e79bd1c55e7d8da1e`
- `COHORT2_RELEASE_COHERENCE_SHA256`: `6134051349fcfe14ca7e9f53cdad529d052c027264d8029b2ddda6f0b14955f0`
- Manifest identity: `c33cdd46b430d5f1023ebda78126595a38f2337ba6d632d010420d5f11ee998b`

The generated SQL is one transaction, reuses exact semantic duplicates only, fails closed on deterministic-ID and natural-key conflicts, and contains no broad `ON CONFLICT DO NOTHING`. Production execution requires a later exact authorization after main integration, fresh backup, restore rehearsal, and exact packet rehearsal.
