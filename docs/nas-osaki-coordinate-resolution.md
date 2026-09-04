# NAS大崎 coordinate authority resolved — data repair candidate

`NAS_OSAKI_COORDINATE_AUTHORITY_RESOLVED`

`GYMMAP_NAS_OSAKI_PARENT_COORDINATE_REPAIR_CANDIDATE_READY`

Proposed facility coordinate: **latitude 35.618258, longitude 139.726683**. Precision is **building/site level**, not a surveyed doorway. This supersedes the ambiguous audit at `4d3176d4e132783096b1540255f55f11513d3bf3` with additional building and access evidence. No Production data has been changed. Candidate and SQL are for human review only.

## Coordinate evidence chain

1. [NAS大崎 official page](https://www.nas-club.co.jp/osaki/) identifies 大崎2-1-3, ダイワロイネットホテル, NAS reception at 2F, accessed from 大崎駅南改札・新西口. Its [map link](https://goo.gl/maps/3bkGsPW9vnz) redirects to an explicit coordinate destination with `!3d35.618258!4d139.726683`.
2. [Hotel official access](https://www.daiwaroynet.jp/osaki/access/) gives the same address and describes passing the right side of ThinkPark Tower and crossing a bridge-like passage to the hotel's second floor, where NAS is located. Hotel reception itself is on 4F. These are consistent, distinct reception floors.
3. The hotel page's [named hotel place link](https://goo.gl/maps/nTQhFnLgvARLdBQ38) resolves to `35.6181067,139.7266833`, place identifier `0x60188af389706285:0xc2e0a31507ee8b28`. It lies approximately 16.8 m south of the NAS coordinate. The iframe's viewport longitude is not used as the destination.
4. The [official hotel brochure](https://www.daiwaroynet.jp/osaki/assets/hotel_brochure.pdf), page 3, explicitly locates NAS across floors 1–3 and the NAS entrance on 2F. Its static access diagram places the hotel west/southwest of ThinkPark Tower and shows the station approach. The complete relevant page was visually inspected; the diagram is schematic and is not used for extracting decimal coordinates.
5. [GSI map centered on the NAS point](https://maps.gsi.go.jp/#18/35.618258/139.726683/&base=std&ls=std&disp=1) places its crosshair at the northern edge of the mapped low-rise building area west/southwest of the tower. This agrees with the independently identified hotel/NAS building complex and the second-floor approach. [Saved GSI view](nas-osaki-coordinate-evidence/gsi-nas-official-point.png).
6. [GSI map centered on the address-search point](https://maps.gsi.go.jp/#18/35.619083/139.726807/&base=std&ls=std&disp=1) places its crosshair north of that building, in the external street-edge/walkway/open-space area. It is not the NAS/hotel building centroid or verified NAS entrance. [Saved GSI view](nas-osaki-coordinate-evidence/gsi-address-point.png).

**Decision A/B:** The facility's own coordinate is corroborated at building level; the 92.42 m northward address-search point is outside that building. This is a resolved distinction between a facility location and an address-search location, not an unresolved conflict between two equally strong NAS building pins. No new point was interpolated, averaged, or inferred from child coordinates.

## Pin type and precision

| Source | Coordinate | Defensible classification |
| --- | --- | --- |
| NAS official link | 35.618258, 139.726683 | Explicit coordinate-target / dropped-coordinate link. Not a named NAS Place ID. How the publisher originally positioned it is unknown. Adopted only after independent building/access corroboration. |
| Hotel official link | 35.6181067, 139.7266833 | Named, facility-specific hotel place. Corroborates building identity; not substituted for the NAS point. |
| GSI address search | 35.619083, 139.726807 | Address result titled 東京都品川区大崎二丁目１番３号. API response does not identify a building centroid or entrance. Not used as an entrance claim. |
| Both 大崎 child records | 35.619083, 139.726807 | Historical GSI address-search provenance; corroborating only, not independent pin evidence. |

[GSI's description of residential-address data](https://www.gsi.go.jp/kihonjohochousa/jukyo_jusho.html) explains basis-number/frontage points and states that the data does not identify individual buildings. This supports distinguishing address points from building locations. The exact internal dataset/derivation for this API result is not exposed; it is not asserted to be a surveyed entrance or parcel centroid.

The raw NAS shortlink response retains six decimal places. The interactive Google Maps page reinterprets the displayed DMS title as `35.61825,139.7266944`, about 1.4 m from the raw destination. That is display/coordinate-format precision, not the 92 m dispute. The candidate preserves the original explicit numeric destination, without claiming sub-metre accuracy.

## Existing repository convention

Historical coordinate repair commit: `8c9be865aba5bd29aa1db6821eb924a1481108c5` (`fix: populate gym map coordinates`).

- `scripts/geocode-gym-locations.ts` first uses official-page structured/map coordinates, then falls back to GSI official-address geocoding if no coordinate is found.
- `scripts/data/location-coordinate-overrides.json` explicitly records NAS Fujisawa and NAS Totsuka official map-link corrections, and other NAS/JEXER GSI fallback entries.
- No Lesson policy requiring exact doorway coordinates, or preferring GSI over corroborated official facility coordinates, was found.
- HYROX's separate freshness-monitor displacement threshold is not imported into this Lesson repair.

The candidate adds exactly one official-page entry to the existing override JSON. It does not create a new coordinate system, schema, grouping convention or runtime correction path.

## Main / Production / migration authority

`git fetch origin --prune` completed before preparation. Source `origin/main` and successful latest Production deployment both identify **`86d0219812c24179319ecf69776a461b10b487b8`**.

- GitHub Production deployment: `6241868927`, successful at `2026-09-03T10:24:52Z`.
- Exact deployment URL: [Vercel Production deployment](https://gymmap-ojbzf2p4q-tes-projects-f349e739.vercel.app).
- Remote global migration head: **0015**, read via `supabase migration list --linked`; latest-main files also end at 0015.
- Immediately before override preparation, the target was re-read at `2026-09-04T01:10:01.642Z`: same ID/slug/address, active, coordinates NULL/NULL, 104 schedules.
- A subsequent Production **READ ONLY** transaction verified full-row SHA-256 fingerprints for just 大崎's three location rows, their three memberships and 104 schedules against the disposable baseline. UTC normalization is required; an initial timezone representation difference was resolved, with no actual row drift. See [fingerprints](nas-osaki-coordinate-evidence/production-fingerprints.json).

## Exact candidate and future mutation packet

- Branch: `codex/nas-osaki-coordinate-repair`.
- Data authority: [single override entry](../scripts/data/location-coordinate-overrides.json).
- Exact scoped packet: [repair_nas_osaki_coordinates.sql](../supabase/sql/repair_nas_osaki_coordinates.sql).
- Packet SHA-256: **`1786c7fec689f2dddecdc91c5b7b138f9e45cdf6f6038473b896a04f15ec2f89`**.

The repository already keeps explicit transactional data operations under `supabase/sql`, with reviewed scoped SQL packets also used by data-release candidates. This single-row packet accompanies the established override. Do **not** run the broad `geocode-gym-locations.ts --apply`: it processes unrelated closure overrides even when a slug filter is supplied.

The packet takes bounded write-conflicting locks for a short transaction; ordinary reads remain available. It checks migration head 0015 plus exact frozen 大崎 location/membership/schedule fingerprints, updates the existing ID only while both coordinates are NULL, checks exactly one updated row, and verifies parent identity, child rows, memberships and schedules after the update. A second execution or drift fails closed. No partial-coordinate overwrite or silent replay is allowed.

**Only latitude and longitude occur in the UPDATE payload. The existing `trg_gym_locations_updated_at` trigger also advances the target's `updated_at` audit timestamp.** It is not disabled or changed. This is the only additional observed cell change; all other parent fields and every child field are preserved.

Future command, **not executed and not authorized yet**:

```sh
psql "$GYMMAP_REVIEWED_PRODUCTION_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f supabase/sql/repair_nas_osaki_coordinates.sql
```

Release still requires human candidate acceptance, a separate Production release authorization and applicable repository integration/backup/rehearsal gates, fresh source/deployment/migration checks, and confirmation that these frozen fingerprints still match. A native Production-version rehearsal remains a release gate because this candidate's disposable engine was PostgreSQL 18.3/PGlite. Any schedule freshness or other drift requires a new reviewed packet; do not weaken the guard. Normal location-cache revalidation must also be observed after any future release; no cache or Production action occurred here.

## Before / after validation

Latest migrations 0001–0015 ran unmodified in disposable PGlite 0.5.8 / PostgreSQL 18.3. Only the nine previously scoped public NAS locations, their memberships, 272 schedules and necessary brand/program references were loaded. This is a targeted Production-shaped fixture, **not a full Production restore**.

| Property | Before | After candidate in disposable DB |
| --- | --- | --- |
| Location ID | ce0f6e5d-3455-4305-85b8-68a50dd5a57b | Same |
| Coordinates | NULL / NULL | 35.618258 / 139.726683 |
| Lesson membership | Existing positive row | Exact same row |
| NAS大崎 owned schedules | 104, current authority 2026-08 | Exact same 104 rows |
| BODYCOMBAT multiplicity | 8 own rows | Same 8 rows |
| Blank Map | NAS大崎 excluded by coordinate gate | NAS大崎 included |
| BODYCOMBAT list | NAS大崎 excluded by coordinate gate | NAS大崎 included |
| Purpose index | Existing own-schedule aggregation | Byte-equivalent structure |
| Child locations | Two independent rows, zero schedules | All fields unchanged; still independent |
| S1 structured BODYCOMBAT search | 8 rows in 品川区 | Exact IDs, order, count and update metadata unchanged |

The validator compared all **31 public tables** in the fixture. The only differences were the target's latitude, longitude and automatic updated_at. All seeded training/HYROX tables and all other data were unchanged; this is not a claim that full Production HYROX data was copied. Schedule IDs remain unique; no ownership or duplicate schedule creation occurred.

Fail-closed scenarios passed: changed migration head, already-filled latitude, missing parent membership, changed schedule, changed child coordinates, and replay after success. Each failure left the original data intact after rollback.

[Machine-readable validation](nas-osaki-coordinate-evidence/validation.json) and [reproducible validator](../scripts/validate-nas-osaki-coordinate-repair.mjs). Runtime dependency is installed only in `/private/tmp/nas-coordinate-disposable/runtime`; repository dependencies are unchanged. Reproduce with PGlite **0.5.8** and the retained scoped snapshot (SHA-256 `c09c9f3a0519821b7f3d25c26ee10888af2cd5c08654433fbce86192fe42f932`):

```sh
node --import tsx scripts/validate-nas-osaki-coordinate-repair.mjs \
  /private/tmp/nas-coordinate-evidence/candidate-baseline.json \
  /private/tmp/nas-coordinate-disposable/runtime \
  /private/tmp/nas-coordinate-evidence/validation
```

The originally proposed entire-public-schema export was rejected by automatic approval review as broader than this task. It was not performed. The targeted public fixture avoided that issue. Native local PostgreSQL startup failed due to host shared-memory exhaustion; no system limits or other tasks were changed. This is why validation used PGlite, with native-version rehearsal explicitly deferred to release.

## Actual Map component smoke

The unmodified `LocationMapSection`/Leaflet components and CSS were copied into a separate disposable Next app with before/after DB-result props, no Production credentials, and no analytics wrapper. No application code from this harness is included in the candidate. Turbopack was used after the experimental Webpack harness rejected an existing CSS global selector; the CSS was not modified.

- Blank search: six mappable fixture locations before, seven after; NAS大崎 marker and list row are newly present.
- BODYCOMBAT: zero matching mappable fixture locations before, one after (NAS大崎). The **fixture-wide purpose count remains 28**, since 篠崎 and 西葛西 own another 20 matching rows even while unmappable. NAS大崎's own count is **8**; the UI's 28 is not attributed to NAS大崎 and was not changed.
- Selecting NAS大崎 uses the existing slug and shows its own address and BODYCOMBAT preview; the two north-side child records remain independent markers.
- At 大崎 building zoom, the new marker occupies the selected building-level coordinate. Map-scope mode retains NAS大崎 near the map center; switching back to nearby order works normally.

Screenshots: [before blank](nas-osaki-coordinate-evidence/ui-before-blank.png), [before BODYCOMBAT](nas-osaki-coordinate-evidence/ui-before-bodycombat.png), [after blank](nas-osaki-coordinate-evidence/ui-after-blank.png), [after BODYCOMBAT/map scope](nas-osaki-coordinate-evidence/ui-after-bodycombat-map-scope.png), [building view](nas-osaki-coordinate-evidence/ui-after-building.png).

Existing targeted Map/purpose-index, proximity, membership, search and HYROX UI regression tests: **71/71 PASS**. Validator lint and `git diff --check`: PASS. No source changes under `src`, no migration change, and no P1–P4, S1 or HYROX runtime change.

## Narrow systemic note

| Parent | Coordinates still NULL/NULL? | Appears same defect class? |
| --- | --- | --- |
| NAS篠崎 | Yes | Yes |
| NAS西葛西 | Yes | Yes |

No batch fix, no September schedule refresh, and no parent/child schema inference was performed.

## Human review status

```text
NAS_OSAKI_COORDINATE_AUTHORITY_RESOLVED
GYMMAP_NAS_OSAKI_PARENT_COORDINATE_REPAIR_CANDIDATE_READY
EXISTING_LOCATION_ID_PRESERVED
LESSON_MEMBERSHIP_UNCHANGED
SCHEDULE_OWNERSHIP_UNCHANGED
MAP_PURPOSE_INDEX_AUTHORITY_PRESERVED
NAS_OSAKI_MAP_ELIGIBILITY_RESTORED
CHILD_LOCATIONS_UNCHANGED
MAP_PRESENTATION_UNCHANGED
S1_UNCHANGED
HYROX_UNCHANGED
NO_PARENT_CHILD_SCHEMA_CHANGE
NO_SCHEDULE_FRESHNESS_CHANGE
NO_PRODUCTION_DATA_MUTATION
READY_FOR_HUMAN_NAS_OSAKI_COORDINATE_REPAIR_REVIEW
```

Restored map eligibility refers to the disposable candidate, not the unchanged Production row. No push, main merge, deployment, Production update or release authorization occurred.
