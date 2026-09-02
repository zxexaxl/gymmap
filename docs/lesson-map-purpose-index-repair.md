# Lesson Map purpose-index repair evidence

## Authority and boundary

- Base: `origin/main` at `aa22ee68c18dae3e1f130804c25af939b03006db`
- Branch: `codex/lesson-map-purpose-index-repair`
- Migration head remains `0012`; no schema or database mutation is part of this candidate.
- S1 structured search, legacy free-text fallback, Map P1-P4 presentation, Lesson membership, and HYROX remain unchanged.

## Purpose data contract

The Home Map now reads a dedicated cache built directly from the minimum schedule projection:

- returned schedule fields: `location_id`, `raw_program_name`, `valid_from`
- query-only ordering authority: `class_schedules.id ASC`
- eligibility: active location plus positive `lesson_location_memberships` inner join
- latest-period authority: the existing `filterLatestSchedulePeriods`
- cache key: `lesson-map-program-aggregate-v1-membership`
- cache tags: `lesson-map-program-aggregate`, `lesson-location-memberships`, `class-schedules`, `gym-locations`
- revalidation: 3,600 seconds

The cached item is a compact tuple of raw program name, canonical program name, program brand, and schedule multiplicity. It does not contain schedule IDs, weekday, start/end time, duration, update timestamps, or location display metadata. The builder never calls the full Lesson search-index builder/cache.

## Production-shaped before/after

Read-only measurements used the current Supabase public Lesson data. Exact latest-period rows and location identity agreed on both paths: 21,188 source rows, 17,316 current schedules, and 247 locations.

| Metric | Before: full search index Map path | After: Map purpose path | Reduction |
| --- | ---: | ---: | ---: |
| Source response JSON | 10,565,120 B | 2,660,887 B | 74.8% |
| Source queries | 22 | 22 | 0% |
| Cached index raw JSON | 2,971,286 B | 496,447 B | 83.3% |
| Home Map DTO raw JSON | 1,727,710 B | 496,447 B | 71.3% |
| Home decoded HTML | 2,511,185 B | 1,149,899 B | 54.2% |
| Home gzip transfer | 197,522 B | 147,468 B | 25.3% |

The purpose result contains 10,148 aggregate program tuples whose multiplicities sum to the same 17,316 schedules. Exact-build Next cache evidence is a 529,981-byte envelope. A seven-run local fsync write proxy had a 3.935 ms median. The production build emitted no `items over 2MB can not be cached` warning; the purpose entry exists on disk, proving that the write completed.

Remote read timing varies with network/cache state, so it is not presented as a microbenchmark. Across observed cold construction runs:

- old source fetch: 13.77–54.22 s; aggregation: 3.51–3.55 s; serialization: 6.4–6.8 ms
- purpose source fetch: 6.94–15.13 s; aggregation: 0.77–0.79 s; serialization: 1.4–2.0 ms

The stable matched run measured old construction at 17.31 s and purpose construction at 8.37 s. The normal Home path no longer invokes or reconstructs the full search index.

All 21,188 lightweight source rows remain necessary without a new database primitive because latest-period selection is per location and must preserve all-null legacy locations. The repair reduces the projection rather than substituting a semantically different current-period view.

## Semantic equivalence

The production-shaped oracle compared location IDs/order, schedule totals and per-location multiplicity, raw-name preview order, canonical/alias matching, and brand matching.

| Query | Locations | Schedules | Result |
| --- | ---: | ---: | --- |
| blank | 247 | 17,316 | PASS |
| `ヨガ` (raw/canonical) | 244 | 2,682 | PASS |
| `BODYCOMBAT` (canonical) | 95 | 626 | PASS |
| `ボディコンバット` (canonical alias) | 95 | 626 | PASS |
| `Les Mills` (brand) | 95 | 1,231 | PASS |
| `レズミルズ` (brand alias) | 95 | 1,286 | PASS |
| `body` (prefix/partial) | 173 | 1,610 | PASS |
| `combat` (partial) | 95 | 626 | PASS |

The existing full index remains live only for the legacy free-text fallback. No legacy fallback helper was removed.

## Validation

- focused purpose-index/oracle tests: PASS
- full tests: 209/209 PASS
- typecheck: PASS
- lint: PASS
- production build: PASS
- `git diff --check`: PASS
- Map P1-P4 source conformance: PASS
- S1 structured/free-text regression tests: PASS
- Lesson membership and HYROX exclusion tests: PASS
- dependency delta: 0
- migration delta: 0

Preview URL and responsive smoke evidence are added after the exact candidate is pushed.
