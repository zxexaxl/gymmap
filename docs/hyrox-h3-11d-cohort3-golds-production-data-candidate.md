# HYROX H3-11D Cohort 3 — Gold's Shop Template Production Data Candidate

## Status and boundary

`H3-11D — COHORT 3 EVIDENCE COMPLETE / DEFERRED GAP PRESENT / HUMAN REVIEW REQUIRED`

This candidate applies the frozen H3-11A/H3-11B/R1/R2/R3 contracts to the exact three-member H3-11C Gold's shop-template cohort. It does not write Production, activate monitors, integrate main, derive station capability, or publish restrictions. Candidate acceptance does not authorize Production import.

Source authority is `origin/main` `5561cbdd5a2fb8a352a850e04b0fc6e690812a17`. Production was inspected read-only at migration head `0015`; all three facilities had zero equipment, capability, raw-fact, restriction, and review-cycle rows. MUSCLE GATE is excluded because H3-11C assigns it to a separate mixed/manual cohort.

## Source and legacy review

The exact facilities are Gold's Gym 千葉ニュータウン (`HGY_CckOFxMw5VG60QfRbUzlk3VMy`), ゴールドジム 橿原奈良 (`HGY_DnvhbwSSMXQWN6DL1AdCp966G`), and 幕張ベイパークアリーナ (`HGY_mkqpr1PrUO2WFjQgpVsFUSkMv`). All three have legacy H3-6 review information. It was reused only for source architecture and access lessons; no historical review state, freshness, positive fact, or no-positive outcome was promoted.

Six exact first-party surfaces were checked with at most four concurrent requests and two attempts: the three branch pages, two branch-specific Chiba HYROX notices, and one branch-specific Makuhari image notice. All were available and retained exact facility binding. Three existing Finder sources are reused and five text-authority pages are proposed as new `training_sources`; the visual-only Makuhari notice remains only in the deferred-gap inventory.

## Review coverage

The packet contains 3 append-only cycles, 111 review units, and 141 unit/source relations:

- 29 `COMPLETE / SUFFICIENT / POSITIVE_FOUND` units.
- 82 `PARTIAL / INSUFFICIENT / NOT_ASSESSED` units.
- 0 blocked, invalidated, or `NO_POSITIVE_FOUND` units.

The facility pages are not treated as exhaustive negative inventories. Source silence remains unknown, not absence.

| Facility | Canonical equipment | Capabilities | Raw facts | Complete / Partial |
|---|---:|---:|---:|---:|
| 千葉ニュータウン | 4 | 2 | 3 | 23 / 14 |
| ゴールドジム 橿原奈良 | 0 | 0 | 2 | 2 / 35 |
| 幕張ベイパークアリーナ | 2 | 1 | 0 | 4 / 33 |

## Safe positive and raw subset

The 6 canonical equipment candidates are: farmers-carry implements 2, functional-training lane 1, sandbag 1, treadmill 1, and weighted sled 1. The 3 capabilities are Chiba `discipline-coaching`, Chiba `open-training`, and Makuhari `outdoor-running-access`. Nine evidence relationships preserve one exact source-supported observation per claim.

The 5 internal raw facts are Chiba wall ball, Chiba official HYROX equipment-set assertion, Chiba non-exclusive program-use confirmation, and Kashihara multi-movement/running-space observations. They produce 16 dimension links. No restriction row is included in the safe release subset. The Chiba program states all eight disciplines but explicitly omits running; it is not a competition simulation and creates no station-derived row.

## Deferred visual gap

Makuhari's first-party facility poster visually lists SkiErg, Rowing, sled push/pull, sandbag lunges, wall balls, Burpee Broad Jump, and space/time caveats. Those visual-only semantics could support additional equipment/raw/restriction observations, but R3 has no deterministic visual monitor. They are classified `VISUAL_MONITOR_POLICY_GAP / DEFERRED_NON_BLOCKING` and excluded. The independently text-supported Farmers Carry, treadmill, and outdoor-running facts remain included. No OCR-derived substitute or station capability is created.

## Persistence, freshness, and monitoring

All included observations fit existing persistence. Canonical physical claims use 180 days; operational capabilities use 90 days. Raw rows use only `raw-physical-component-180-day`, `raw-equipment-set-assertion-90-day`, `raw-space-90-day`, and `raw-usage-90-day`. No new horizon or policy is introduced.

The candidate adds 9 canonical monitor entries and 5 raw monitor entries. Current-source matchers are exact facility/source/fact patterns. They do not reconfirm or extend timestamps. There is no monitor entry for deferred visual evidence.

## Projected state

| Concept | Before | After |
|---|---:|---:|
| Official facilities | 82 | 82 |
| Training sources | 130 | 135 |
| Equipment claims | 164 | 170 |
| Capability claims | 62 | 65 |
| Training evidence | 391 | 400 |
| Review cycles | 14 | 17 |
| Review units | 518 | 629 |
| Unit/source relations | 704 | 845 |
| Raw facts | 34 | 39 |
| Raw dimensions | 61 | 77 |
| Restrictions | 17 | 17 |
| Canonical monitored | 226 | 235 |
| Raw monitored | 45 | 50 |
| Equipment-positive facilities | 33 | 35 |
| Capability-positive facilities | 32 | 34 |
| Any canonical enrichment | 39 | 41 |

## Deterministic identities

- `COHORT_3_IDENTITY_SHA256`: `23a4fb25a8ecd4b0413a5a74c645065219e75a9e456e8fa799380304cfd15a2a`
- `SOURCE_DELTA_SHA256`: `8496f01c0b69ddb0527f7b096eb76f1b170f923fbb33e407f245fdb1e9566d9a`
- `LEDGER_IMPORT_PACKET_SHA256`: `0670cfc9a7076154defc75b051a9f77c034eb087b3aca17e7f2c3c6ec768a199`
- `CANONICAL_POSITIVE_IMPORT_SHA256`: `f5788776950be0cf7d23e2a65df3258263fefc18aa0523e10b81f8264e7a9ad1`
- `RAW_FACT_IMPORT_SHA256`: `1179883f5f52d3d278225a0af88da6cea3623096f55b77722039398b82c84d55`
- `RESTRICTION_IMPORT_SHA256`: `9b57c6f51358bc5d64a82ebc940bf39ff86609ebfe6292211bf783e7795326fb`
- `CANONICAL_MONITOR_DELTA_SHA256`: `cc278f187c82caa6e73ed7589437fc7cf5f305865de17da7284505ab244e2bbd`
- `RAW_MONITOR_DELTA_SHA256`: `c5d5f3898c231a3f93c9f7da01aa046778add8eeb7da12b69d73108c13c48d44`
- `DEFERRED_GAP_SHA256`: `f8d87b02e31f32a63448fe2179ac1eba78b8a8ca8c6e5b5f3662c63b93bd044f`
- `DB_IMPORT_PACKET_SHA256`: `8ca4ea82696b5fa6a5fff9e516abe33c3d0912ff5717acc5d32ef28c237d7020`
- `COHORT3_RELEASE_COHERENCE_SHA256`: `3db87da19adcae5899a9590f7a2d9ffb892844a97e95ffd2e070467f0c742f56`
- `MANIFEST_IDENTITY_SHA256`: `d8152362b34ec17233b4d33551d1a4e4ea7f85ce4b430f0990ef7ce8afa73965`
- `EXACT_SQL_SHA256`: `a041492f3aede65535fe1cb177a068eb62a8009a789e8bc51696d36b40a54d58`

The generated SQL is a single transaction, requires semantic equality before exact replay reuse, fails closed on deterministic-ID and natural-key conflicts, and contains no broad `ON CONFLICT DO NOTHING`. Production execution requires a later exact authorization after candidate acceptance, main integration, fresh backup, clean restore, and exact packet rehearsal.
