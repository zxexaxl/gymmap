# HYROX H2-2 — Reviewed Official Training Club Import Candidate

Observed/reviewed at: 2026-08-28T17:26:12.761Z

This package is a deterministic preview. It has no production write path and creates no locations, equipment, capabilities, programs, or schedules.

## Validation

- Confirmed H2-1 input: 6
- Included after revalidation: 6
- Excluded: 0
- Duplicate external IDs: 0
- Duplicate target locations: 0

## Import graph

| Table | Candidate count |
| --- | ---: |
| training_sources | 6 |
| location_external_identifiers | 6 |
| location_training_disciplines | 6 |
| training_affiliations | 6 |
| training_evidence | 12 |

## Reviewed facilities

| Official HYROX name | HGY external ID | GymMap location | GymMap ID | Source | Observed at | Stale at | Evidence | Conflict |
| --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| ゴールドジム千葉ニュータウン | HGY_CckOFxMw5VG60QfRbUzlk3VMy | 千葉ニュータウン (golds-gym-chiba-newtown) | 4d3bd3ba-cb00-44be-bdd6-d9b901f73195 | [finder](https://hyrox-training-finder.hyrox.com/gym/HGY_CckOFxMw5VG60QfRbUzlk3VMy) | 2026-08-28T17:26:12.761Z | 2026-11-26T17:26:12.761Z | 2 | clear |
| 株式会社THINKフィットネス ゴールドジム浜松町東京 | HGY_f2kvOaab0cCRi8pkmmU0AHBis | 浜松町東京 (golds-gym-13210) | 569aecf8-aa02-41da-b37a-7e2e20f160fb | [finder](https://hyrox-training-finder.hyrox.com/gym/HGY_f2kvOaab0cCRi8pkmmU0AHBis) | 2026-08-28T17:26:12.761Z | 2026-11-26T17:26:12.761Z | 2 | clear |
| ゴールドジム東陽町スーパーセンター | HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R | 東陽町スーパーセンター (golds-gym-71221) | d75c411f-2b58-476d-aa68-f7bde9000002 | [finder](https://hyrox-training-finder.hyrox.com/gym/HGY_HfEQpiP2Ha2HB3HYzCFuZJA7R) | 2026-08-28T17:26:12.761Z | 2026-11-26T17:26:12.761Z | 2 | clear |
| ゴールドジム原宿ANNEX | HGY_IyVQTdTdvlkUGVmcaAvVV5BHD | 原宿ANNEX (golds-gym-9999) | 7d7216d0-692e-45dd-ad3c-6c4980fdc50a | [finder](https://hyrox-training-finder.hyrox.com/gym/HGY_IyVQTdTdvlkUGVmcaAvVV5BHD) | 2026-08-28T17:26:12.761Z | 2026-11-26T17:26:12.761Z | 2 | clear |
| ゴールドジムハラジュクトウキョウ | HGY_QPyi483gAfTjVXv2QoNn5d55m | 原宿東京 (golds-gym-13150) | 1e1dc6eb-ec16-4850-978a-ac3c513f55ab | [finder](https://hyrox-training-finder.hyrox.com/gym/HGY_QPyi483gAfTjVXv2QoNn5d55m) | 2026-08-28T17:26:12.761Z | 2026-11-26T17:26:12.761Z | 2 | clear |
| ゴールドジム浦安千葉 | HGY_x72wxyNcqCoMCbZxzQkr7nHAk | 浦安千葉 (golds-gym-12160) | e84c2ea2-bc63-4788-b050-590cfefebe42 | [finder](https://hyrox-training-finder.hyrox.com/gym/HGY_x72wxyNcqCoMCbZxzQkr7nHAk) | 2026-08-28T17:26:12.761Z | 2026-11-26T17:26:12.761Z | 2 | clear |

## Frozen import policy

- Serialization: Acquire a transaction-scoped advisory lock before conflict checks and writes.
- Source reuse: Reuse one governing-body finder source by canonical_url; block duplicates or incompatible identity.
- Freshness: Update confirmation fields only when incoming observed_at is newer; older observations never regress state.
- Identity conflict: Block when namespace/external_identifier belongs to another location.
- Affiliation conflict: Block external-ID or canonical affiliation conflicts; never overwrite a different authority identity.
- Evidence dedupe: Insert only when the deterministic SHA-256 content_hash does not already exist for the resolved source and target.

The SQL companion is rollback-only and exists solely for local import rehearsal. Production import is deferred to H2-3.
