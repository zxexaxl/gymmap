# Managed Lesson coordinate publication contract

Candidate only; no main merge, deployment, migration, or Production data mutation.

## Authority and scope

- Base / fetched origin/main: `b337d759a0bcb269d7603805f9e0a68a4a469c94`.
- Production deployment `6260033582`, same source SHA; deployment URL:
  https://gymmap-6gb0u2smu-tes-projects-f349e739.vercel.app
- Fresh READ ONLY transaction, 2026-09-04T08:12:10.420235Z: global migration head
  `0015`, active positive Lesson 366, valid complete coordinates 366, gaps 0.
- The new public-key SELECT-only preflight ran against Production at
  2026-09-04T08:19:42.670Z: **366 / 366 / 0**, shared TypeScript validator PASS.
- Historical NAS repairs are complete and are not modified by this candidate.
- Untracked developer workspace HEAD `5b00b0792142857312da5da4bfced2aabae3d1be`
  is NOT main authority. Its historical NAS registration/import code was not adopted.

The invariant is active physical location + positive Lesson publication requires
both coordinates to be numeric, finite, latitude [-90,90], longitude [-180,180].
Inclusive bounds and zero are valid. Strings, omitted fields, NULL, NaN, infinity,
and out-of-range values fail closed. No location_type-based exemption is present.
Unknown/special records get no nonphysical exception. Inactive closed members can
retain NULL/NULL. A future reactivation must validate the proposed active state.
There is no currently managed location reactivation writer.

## Writer classification and complete audit

A = TRACKED_CURRENTLY_MANAGED; B = TRACKED_LEGACY_BUT_REACHABLE;
C = UNTRACKED_HISTORICAL_FORENSIC; D = DEAD / UNREACHABLE as an ingestion entry point.

| Class | Path | Reachability / treatment |
| --- | --- | --- |
| A | `src/lib/lesson-membership-writer.ts` | Called by both tracked importers. Reads authoritative current coordinates before idempotent membership insertion. Invalid/missing location fails before membership mutation. Existing membership is not updated. |
| A | `scripts/experimental/import-central-extraction.ts` | `npm run import:central`; both dry-run and execution validate the complete resolved, non-excluded target batch before the first program/membership/schedule write. Membership writer rechecks each location. |
| A | `scripts/experimental/import-jexer-extraction.ts` | `npm run import:jexer`; equivalent whole-target preflight before writes, then guarded membership writer. |
| B | `supabase/sql/insert_central_tokyo_locations.sql` | Executable manual seed packet, referenced by repository writer tests. Transaction guard added. |
| B | `supabase/sql/insert_golds_kanto_locations.sql` | Same. |
| B | `supabase/sql/insert_jexer_kanagawa_saitama_chiba_locations.sql` | Same. |
| B | `supabase/sql/insert_jexer_tokyo_locations.sql` | Same. |
| B | `supabase/sql/insert_konami_kanto_locations.sql` | Same. |
| B | `supabase/sql/insert_megalos_kanto_locations.sql` | Same. |
| B | `supabase/sql/insert_nas_kanto_locations.sql` | Same; this tracked 43-location seed is distinct from the historical eight-parent registration. |
| B | `supabase/sql/insert_tipness_kanto_locations.sql` | Same. |
| A | `scripts/geocode-gym-locations.ts` | No membership creation or activation. Closure sets active=false. Coordinate UPDATE is conditional on existing NULL/NULL, so it cannot turn any valid baseline member into a coordinate gap. It is not a registration/publication path; unchanged and NOT executed. |
| A | `scripts/hyrox/apply-h3-11d-cohort{1,2-beequick,3-golds}-production-release.sql` | Training data only; existing facility identity checks. No Lesson membership or location activation. Unchanged. |
| A | `scripts/hyrox/*monitor*.ts`, activation and enrichment scripts | Training monitor/data authority only; no Lesson publication. Unchanged. |
| D | `scripts/hyrox/render-h3-11d-cohort1-release-sql.ts` and `build-h3-11d-cohort2-beequick-release.ts` fixture generators | Location INSERT text belongs to explicitly disposable fixtures, not live release writes. Generated apply packets were also audited. |
| D | `scripts/hyrox/setup-h3-11d-cohort1-release-validation.sql`, `setup-h3-11d-cohort2-beequick-validation.sql`, `setup-h3-11d-cohort3-golds-validation.sql`, `validate-h3-11b-review-ledger.sql`, `validate-h3-11d-r1-raw-fact-persistence.sql` | Disposable validation setup/rollback, not managed Lesson ingestion. |
| D | `scripts/validate-nas-osaki-coordinate-repair.mjs`, `scripts/validate-nas-higashiomiya-coordinate-repair.mjs` | Historical repair rehearsal fixtures; unchanged. |
| B | `supabase/sql/repair_nas_osaki_coordinates.sql`, `repair_nas_higashiomiya_coordinates.sql`, `rollback_nas_higashiomiya_coordinates.sql` | Explicit frozen historical repair/receipt-guarded reversal packets, not ingestion or membership publication. They remain outside this accepted task. In particular rollback deliberately restores a historical preimage; it is NOT claimed to satisfy this new-publication contract. |
| D | `supabase/migrations/0011_add_lesson_discovery_membership.sql` | Already-applied immutable migration, fixed audited 369-ID backfill. No newly supplied registration input; not changed/reapplied. |
| D | `supabase/seed.sql` | Comments only; directs users to actual scripts/SQL above. |
| B | `supabase/sql/delete_initial_sample_data.sql` | Deletes only; cannot create or activate membership. |
| C | developer-workspace `prepare-nas-kanto-location-registration.ts`, `register-nas-kanto-locations.ts`, `dry-run-import-nas-kanto.ts`, `import-nas-kanto.ts`, `insert_nas_kanto_schedule_locations.sql`, NAS discovery/extraction/review helpers | Main has no callers/package commands referencing these untracked historical files. Forensics only; no imports, edits or adoption. |
| C | developer-workspace Central/Gold's monthly registration and preparation scripts | Untracked evidence of other workflows; not main authority, untouched. |
| A | `scripts/validate-lesson-coordinate-publication.ts` (new) | Explicit SELECT-only operational preflight. No service-role key required, no application runtime hook. |
| D | `scripts/validate-lesson-coordinate-ingestion-sql.mjs` (new) | In-memory PGlite or explicitly named disposable local test database only. Not a Production writer. |

Repository-wide call/write audit covers `src`, `scripts`, `supabase`, package
entry points, SQL seed references and generated release SQL. `src/app` admin and
API paths are readers; no additional Lesson writer or active=true UPDATE was found.
The new inventory regression checks SQL/PostgREST write signatures against the
reviewed inventory so newly introduced writers demand review. It is an aid to
caller auditing, not a proof about arbitrary dynamically generated administrator SQL.

No supported tracked flow depends on the old untracked NAS implementation. The
tracked NAS seed is guarded; no NAS capability recreation is necessary for this task.
A future monthly NAS importer requires its own tracked-authority proposal.

## Mutation behavior and operational contract

`src/lib/lesson-coordinate-publication.ts` owns the validator and geographic bounds.
It also renders the equivalent SQL guard. Tests verify that all eight embedded
SQL guards match that authority, avoiding divergent per-brand rules.

Each legacy SQL packet now starts a transaction, locks location and membership
tables in a consistent order, performs its original inserts, then asserts the
active positive Lesson invariant before COMMIT. Any invalid active member aborts
all changes in that packet. The check deliberately also detects preexisting
baseline drift. Run the complete packet, with stop-on-error; do not extract its
interior INSERT statements. No persistent function, trigger, constraint, temp
schema contract, or migration is installed.

The eight original SQL inputs contain no coordinates. Consequently an attempted
new active Lesson registration remains HOLD via transaction failure. The candidate
does not invent coordinates or silently stage/publish incomplete records. For a
future data release, review explicit coordinates in its input AND persisted payload
and retain the transaction guard. Existing fully registered batches remain no-ops.

Importer preflight uses live location state, not trusted coordinate claims from a
schedule extraction file. It validates all matched targets, including existing
slugs and records whose schedules already exist; invalid last targets cannot
allow earlier writes. Missing/ambiguous target matching retains its existing skip
behavior and creates no publication. Normal dry-run likewise validates.

The TS/PostgREST importers are not newly converted into general-purpose database
transactions: arbitrary network failures or out-of-band concurrent administrator
changes are not given all-or-nothing guarantees. The promised mixed-coordinate
batch rejection occurs before its first write, with authoritative membership
rechecks. No managed writer can invalidate a complete baseline coordinate pair or
reactivate an inactive location. Arbitrary administrator SQL and historical repair
reversals remain explicitly outside this contract.

Before a managed data release, run:

```sh
npm run lesson:coordinates:preflight
```

Supply the target environment's public Supabase URL and anon key. The preflight
uses ordered pagination, exact counts, duplicate/short-page checks and the shared
validator. It reports HOLD/nonzero on failure; it does not fix or publish anything.
Do not continue a release after failure. Recheck after the release. Its pagination
checks are not a substitute for a transaction snapshot under arbitrary concurrent
writes. There is no request-time census and no new provider/geocoder.

## Regression and validation evidence

- Full authoritative suite: **319 tests PASS**, including membership, Map eligibility,
  structured Lesson/S1, HYROX and the new focused guard/inventory tests.
- Focused guard coverage: valid physical locations, both absent, each one-sided
  absence, undefined payload fields, NaN/infinity, out-of-range, valid geographic
  boundaries, existing-slug membership rejection with zero mutations, closed history,
  proposed reactivation failure, HYROX-only exclusion, mixed-target preflight and
  repaired NAS eight-facility coordinates.
- Actual SQL packet validation: all **8 packets PASS** for rejection/rollback;
  mixed batch with one valid and remaining invalid locations rolls back all rows;
  valid persisted coordinate control succeeds. Checks also cover PostgreSQL NaN,
  one-sided NULL, range, inactive preservation and reactivation rejection.
- SQL engine: **PGlite 0.5.8 / PostgreSQL 18.3**, entirely in memory, minimal relevant
  Production-shaped table schema. Not a full Production restore or native 17.6 claim.
  Native PostgreSQL 17 initialization failed because the host exhausted shared-memory
  IDs. No other task's processes, shared memory, or databases were cleaned up.
- `npm run typecheck`, `npm run lint`, `git diff --check`: PASS.
- `npm run build`: PASS, including prebuild, using an isolated local empty-data
  PostgREST fixture; no Production credentials. Generated sitemap files restored.
  This verifies optimized application compilation, not real-data sitemap completeness.
- The new shared validator passed the live 366-row SELECT-only Production preflight.
- Migration delta 0; lockfile/dependency delta 0. Only a package script was added.
- Map runtime/purpose, S1, HYROX, historical repair files, overrides, membership data,
  schedules and Production coordinates are unchanged.

Standalone SQL regression (requires existing local PostgreSQL/psql, no npm additions):

```sh
node --import tsx scripts/validate-lesson-coordinate-ingestion-sql.mjs \
  --local-url=postgresql://localhost:55479/lesson_guard_test
```

Use a fresh, disposable database; the script refuses remote hosts and other database
names and does not reset an existing schema. An already available PGlite runtime can
instead be passed as `--pglite-module=file:///absolute/path/to/pglite/dist/index.js`;
that mode always constructs a new in-memory database. No dependency was installed
or added for this option.

## Review gate

GYMMAP_LESSON_COORDINATE_INGESTION_GUARD_CANDIDATE_READY

Managed Lesson writer contract implemented; current 366 invariant PASS; historical
NAS repairs unchanged. Candidate commit/push only. Human review precedes any future
main merge or Production promotion; neither is authorized or performed here.
