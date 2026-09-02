# HYROX H3-11C Remaining Facilities Source Qualification

Status: **AUTHORITY CANDIDATE / HUMAN REVIEW REQUIRED**

Source main: `952085ab80434e51cbfc5f7da87993a8a3f7dc7e`

This document and `data/hyrox/h3-11c-source-qualification.json` freeze a source map for H3-11D. They do not record equipment or capability facts, create H3-11A review coverage, write the production review ledger, or authorize station derivation.

## Boundary

H3-11C answers only:

> Which official, facility-bound sources should H3-11D inspect, and with which bounded extraction strategy?

It does not answer what a facility has. Source discovery and source access are not `COMPLETE`, `SUFFICIENT`, `POSITIVE_FOUND`, or `NO_POSITIVE_FOUND`. Missing evidence remains unknown and never becomes public negative truth.

## Target authority

The target was derived read-only from current production authority on 2026-09-02:

- Official HYROX facilities: 82
- Facilities with any current published positive equipment or capability enrichment: 25
- Target facilities with no current positive enrichment: 57
- Unique HGY IDs: 57
- Unique GymMap location IDs: 57
- Target/non-target leakage: 0
- Target-set drift from the 57-facility reference: no

Canonical target order is code-point ascending `hgy_id`. `TARGET_SET_SHA256` covers the ordered array of `{hgy_id, location_id, slug}` using the canonicalization defined in the manifest.

## Qualification method

For each target, the qualification pass used this bounded order:

1. current HGY/Finder identity anchor;
2. current GymMap official URL;
3. H3-3/H3-6 source lessons where available;
4. the minimum obvious first-party facility, HYROX, program, schedule, or gallery links needed to prepare H3-11D.

The pass made one read-only request to each stored official entrypoint and only bounded requests to retained supplementary first-party entrypoints. It did not log in, submit a form, make a booking, bypass access controls, or crawl a site exhaustively. Page text was used to classify identity, access, and surface type only; station/equipment facts were not extracted into the candidate.

Three stored official entrypoints were generic rather than facility-bound: the Prova UBX overview, the ELEMENT brand root, and the BEYOND Chubu area page for Nagoya. Each remains context-only and is supplemented by an exact facility-specific first-party page. Hostname or redirect alone was never used as facility binding.

BEYOND 浜松店 preserves the H3-2 split: the Finder website-field degradation remains `UPSTREAM_SOURCE_DEGRADED`; the separate facility-specific BEYOND浜松 page remains a usable official source. Generic Hacomono home equivalence is not introduced.

## Legacy review split

- `LEGACY_REVIEW_AVAILABLE`: 11
- `NO_PRIOR_REVIEW_AUTHORITY`: 46

The exact historical inputs were:

- `7a90c9d:data/hyrox/h3-3-equipment-poc-sample.json`
- `7a90c9d:data/hyrox/h3-3-equipment-evidence-poc.json`
- `160b559:data/hyrox/h3-6-targeted-equipment-scaleout-cohort.json`
- `160b559:data/hyrox/h3-6-targeted-equipment-evidence.json`

Legacy artifacts contribute URLs, source-access lessons, template knowledge, and review economics only. They do not satisfy the H3-11A protocol and are not backfilled into the ledger.

The prior H3-6 Orangetheory and UFC GYM cohorts have no remaining target members. Four Gold's-associated targets remain: three share the Gold's shop template and the MUSCLE GATE HOTEL GYM BOUTIQUE requires mixed/manual review. Both prior Gym Field members remain targets and are carried forward as a facility-scoped multi-facility-source cohort.

## Source inventory

There are 156 facility-source records and 151 unique source URLs. Repeated URLs are retained per facility when a brand page explicitly binds multiple facilities.

| Source class | Records |
|---|---:|
| `GOVERNING_BODY_FINDER_DETAIL` | 57 |
| `FACILITY_SPECIFIC_OFFICIAL_PAGE` | 28 |
| `BRAND_OFFICIAL_FACILITY_PAGE` | 25 |
| `OFFICIAL_EQUIPMENT_PAGE` | 0 |
| `OFFICIAL_HYROX_TRAINING_PAGE` | 23 |
| `OFFICIAL_PROGRAM_SERVICE_PAGE` | 8 |
| `OFFICIAL_BOOKING_MEMBER_SYSTEM` | 1 |
| `OFFICIAL_SCHEDULE_PAGE` | 5 |
| `OFFICIAL_SOCIAL_MEDIA` | 0 |
| `OFFICIAL_IMAGE_GALLERY` | 9 |

| Facility binding | Records |
|---|---:|
| `FACILITY_SPECIFIC` | 132 |
| `BRAND_FACILITY_SPECIFIC` | 21 |
| `GENERIC_NON_FACILITY_BOUND` | 3 |
| `UNKNOWN_INSUFFICIENT` | 0 |

| Access observation | Records |
|---|---:|
| bounded H3-11C GET available | 99 |
| current monitor authority available (Finder) | 57 |
| blocked/error/timeout | 0 |

The 156 records include 84 text-HTML surfaces, 57 Finder text/JS identity surfaces, 9 visual/gallery surfaces, 5 text/document schedule surfaces, and 1 public booking/JS surface. Availability at qualification time is not a promise of future access and is not per-dimension source sufficiency.

## Operational strategies and economics

| Strategy | Facilities | Meaning |
|---|---:|---|
| `STRUCTURED_ADAPTER` | 16 | Repeated, facility-bound first-party structure worth a bounded adapter in H3-11D. No adapter is implemented here. |
| `GENERIC_FIRST_PARTY_TEXT` | 26 | Facility-specific text review; no common parser/template is assumed. |
| `MIXED_TEXT_VISUAL` | 12 | Text must be combined with facility-specific visual or mixed media review. |
| `MANUAL_VISUAL_REVIEW` | 3 | Sparse, dynamic, or image-led surface requiring careful human review. |
| `HOLD_SOURCE_INSUFFICIENT` | 0 | No current operational hold in this qualification pass. |
| `HOLD_ACCESS_BLOCKED` | 0 | No retained facility-specific source was access-blocked in this qualification pass. |

Operational effort is evidence-based rather than monetary:

- `LOW` (14): repeatable facility-bound template, expected two to four bounded pages, no manual identity resolution;
- `MEDIUM` (40): two to five pages, independent text interpretation, mixed surfaces, or multi-facility binding checks;
- `HIGH` (3): three to six pages with manual visual/dynamic review or sparse-source identity work.

Zero operational holds does not mean every dimension/aspect will be sufficient. H3-11D must still decide source sufficiency independently for each dimension × aspect × protocol cycle.

## H3-11D cohort plan

| Priority | Cohort | Facilities | Strategy | Architecture boundary |
|---:|---|---:|---|---|
| 1 | `h3-11d-c1-facility-hyrox-text-pilot` | 8 | text | Facility-bound HYROX/training text pilot; explicitly not a shared parser template. |
| 2 | `h3-11d-c2-beequick-location-template` | 6 | adapter | Repeatable `/location/{branch}/` pages. |
| 3 | `h3-11d-c3-golds-shop-template` | 3 | adapter | Repeatable `/shop/{branch}/` pages. |
| 4 | `h3-11d-c4-beyond-gym-template` | 3 | adapter | Repeatable `/gym/gym-{branch}/` pages, with H3-2 invariance. |
| 5 | `h3-11d-c5-anytime-branch-template` | 2 | adapter | Repeatable branch pages. |
| 6 | `h3-11d-c6-gym-field-multifacility` | 2 | adapter | Shared pages explicitly name both facilities; facility scoping remains mandatory. |
| 7 | `h3-11d-c7-independent-crossfit-hyrox-text` | 9 | text | Independent sites with HYROX text; no template equivalence. |
| 8 | `h3-11d-c8-independent-crossfit-mixed` | 7 | mixed | Independent text plus visual/program surfaces. |
| 9 | `h3-11d-c9-independent-first-party-text` | 9 | text | Independent facility-bound first-party text. |
| 10 | `h3-11d-c10-mixed-and-manual` | 8 | mixed/manual | Sparse, dynamic, gallery-heavy, or mixed surfaces. |

These cohorts form a complete, non-overlapping partition of all 57 targets. Brand/template grouping is used only where a shared structure was observed; strategy cohorts do not assert parser equivalence.

## Recommended Cohort 1

The first H3-11D cohort should contain eight facilities:

1. CLUB 360 — `HGY_4GF2DeDJoIzNRU4jn9scAv65V`
2. FITONE SHIBUYA — `HGY_6lR3pcwsQaSGSlsQTdrNrO1jc`
3. g-zone PARK — `HGY_C0V7CK7K15SLUrMhBvyyO0phM`
4. VAMOS — `HGY_CKpn4DHneWfrqTUVaA7D5Whop`
5. CrossFit Ashiya — `HGY_Cl8QF5olON4Y0D7mho4iGg34L`
6. Improve KYOTO — `HGY_gp7GcAxbIZtxk5KpvoDwAOOcr`
7. HTC CHIKUSA — `HGY_j1Szv4JmxytARCgfm48f0Z4xS`
8. NOTA GYM 西京極店 — `HGY_w8GnFtzgPzHOTZfWMBGzdEtoC`

Each has a facility-bound first-party HYROX/training entrypoint, and several add facility, program, class, or public booking surfaces. This is large enough to test the H3-11A packet across different first-party implementations while remaining small enough for deterministic human evidence review.

H3-11D must inspect, in one pass where the sources permit:

- facility identity and source binding;
- raw equipment facts;
- raw space facts;
- explicit station association;
- usage/access facts;
- coaching/program facts;
- auxiliary running facts;
- source/evidence provenance;
- dimension/aspect review coverage metadata.

The packet does not authorize a generic floor/turf inference, a station score, or a facility-level sufficiency boolean.

## Deterministic hashes

- `TARGET_SET_SHA256`: `34da40f11e0e80153849ffa66fae64d080d7a876d76d36690fa209d998b44e3d`
- `QUALIFICATION_MANIFEST_SHA256`: `4431486477e48b1efc0c15ad7284735eb5a753df55a6398243c013748c48e24a`
- `SOURCE_URL_SET_SHA256`: `9c84fef937e7b587bd549b63206f6c1235caf61ebe4b257ecba397daae1ea9c8`
- `COHORT_PLAN_SHA256`: `d273c5a2cfee8ef2a78f970b2395bea5e74c28298e4deec963b62f9684be50f5`

Canonicalization recursively sorts object keys lexicographically, preserves array order, serializes compact UTF-8 JSON, and appends LF. The manifest self-hash sets `qualification_manifest_sha256` to `null` before hashing. The source URL hash covers sorted unique retained source URLs. The cohort hash covers ordered `{id, priority, strategy, hgy_ids}` records.

## Production and public invariance

- Production migration head: `0014`
- Production review cycles/units/unit-source rows/invalidations: `0/0/0/0`
- Review-ledger production writes: none
- Equipment claims: 109, unchanged
- Capability claims: 41, unchanged
- Monitored positive claims: 150, unchanged
- Runtime/UI/RPC/schema/monitor behavior changes: none
- H3-11D evidence extraction: not started

The candidate is non-runtime data, documentation, and validation only. It must stop for Human Review.
