# NAS大崎 coordinate authority review — historical stop

Superseded by [the coordinate authority resolution and candidate](nas-osaki-coordinate-resolution.md). The text below preserves the earlier fail-closed investigation; it is not the current verdict.

`NAS_OSAKI_COORDINATE_AUTHORITY_AMBIGUOUS`

The requested fail-closed authority gate was triggered. No coordinate repair candidate, override entry, migration, executable release packet, or Production data update was created. Neither coordinate below is approved for mutation. This is an audit-only branch, not a ready repair candidate.

## Authority evidence

Observed at `2026-09-04T00:48:33.443Z`. Latest fetched `origin/main`: `86d0219812c24179319ecf69776a461b10b487b8`. `git fetch origin --prune` succeeded. Production remote migration history was read with `supabase migration list --linked` and ends at `0015`, matching this latest-main worktree. The command ran from the linked original checkout, whose local files end at `0007`; that local column is not migration authority. The current Vercel Production deployment SHA was not resolved before the coordinate-authority stop; it must be resolved before a future candidate. No deployed-code equivalence is asserted.

| Evidence | Latitude | Longitude | Interpretation |
| --- | ---: | ---: | --- |
| [Official NAS大崎 page](https://www.nas-club.co.jp/osaki/) → [official map link](https://goo.gl/maps/3bkGsPW9vnz) | 35.618258 | 139.726683 | Explicit destination `!3d35.618258!4d139.726683`; six decimal digits; entrance accuracy unverified |
| [GSI address search](https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E6%9D%B1%E4%BA%AC%E9%83%BD%E5%93%81%E5%B7%9D%E5%8C%BA%E5%A4%A7%E5%B4%8E2-1-3) | 35.619083 | 139.726807 | Exact returned address title: 東京都品川区大崎二丁目１番３号; address representative point, not verified entrance |
| Existing NAS PILATES ON THE GO 大崎 | 35.619083 | 139.726807 | Corroboration only; historical cache attributes this to GSI |
| Existing ホットヨガスタジオ美温 大崎 | 35.619083 | 139.726807 | Corroboration only; same GSI source, not independent evidence |

The two authority points differ by **92.42 m** (haversine, radius 6,371,000 m). For a city building/entrance marker, this remains a material unresolved positional discrepancy. Decimal resolution does not establish real-world accuracy. The official map URL's `@35.618258,139.724489,17z` is viewport positioning; its longitude must not replace the explicit destination longitude.

The official NAS address agrees with the stored target address: 品川区大崎2-1-3, ダイワロイネットホテル（フロント2F）. The [hotel official access page](https://www.daiwaroynet.jp/osaki/access/) was also read. Its Google embed viewport is not independent entrance coordinate evidence. No documented building-footprint/entrance reconciliation was established. Official NAS takes first evidence priority, but the request explicitly requires stopping on material authority conflict; precedence alone was not used to waive that gate.

The existing child-cache entries were checked read-only at `/Users/te/Documents/GymMap/output/geocoding/location-geocoding-cache.json`. Both say `gsi_address_search` and were checked 2026-08-07. They explain why the child coordinates agree with GSI; copying either child would not resolve authority.

## Current data and Map proof

Production was accessed only using GET queries for the nine NAS locations around the three requested examples, their memberships and schedules. Actual schema uses `address_line`, not `address`. A first query for `address` returned a schema error and was corrected without writes.

NAS大崎 retains ID `ce0f6e5d-3455-4305-85b8-68a50dd5a57b`, slug `sports-club-nas-osaki-index`, active status, positive Lesson membership and **104** schedule rows. All 104 have `valid_from=2026-08-01`; schedule freshness was not changed. Coordinates remain **NULL / NULL**.

A disposable, offline calculation used the current-main production functions `buildMapLessonPurposeIndex` and `getMapLessonQueryMatches`, against the read-only snapshot, honoring active-location and positive-membership eligibility and schedule-ID order. NAS大崎 is present in the purpose index; `bodycombat` matches **8** own schedule rows. The existing `apple-gym-map.tsx` coordinate gate excludes it while either coordinate is NULL. This verifies the current defect, not a successful after-candidate map render. No synthetic aggregation was used.

The two 大崎 child records retain their distinct IDs and existing coordinates, memberships and zero schedule rows; neither has a purpose-index entry. No schedules were reassigned or duplicated. No data writes were issued, so this task has no before/after data mutation; map eligibility remains unrestored.

## Repository mechanism and release boundary

Existing coordinate authority is `scripts/data/location-coordinate-overrides.json`, consumed by `scripts/geocode-gym-locations.ts`. NAS Fujisawa and Totsuka entries establish the precedent for official NAS map-link coordinates; other entries establish GSI address search as accepted provenance.

The current `--apply` command first processes all `closed-location-overrides.json` entries, before applying its location slug filter. Consequently even a slug-filtered invocation does not by itself prove the task's single-location/no-child-mutation boundary. It was not executed. No new correction mechanism was invented. A later exact single-row Production packet remains **not prepared**, pending resolution of coordinate authority and review of the existing SQL/data-release conventions and guarded execution scope.

No main merge, push, deployment, data mutation, Map/UI/runtime edit, purpose-index logic edit, schema edit, membership edit, child edit, or schedule edit occurred. P1–P4, S1 and HYROX source/data were not modified. Post-candidate disposable database, map rendering, scope/ranking and regression validation were not run because there is no approved coordinate or candidate to validate. Their success statuses must not be emitted.

## Narrow systemic note

| Parent | Coordinates still NULL/NULL? | Appears same defect class? |
| --- | --- | --- |
| NAS篠崎 | Yes | Yes |
| NAS西葛西 | Yes | Yes |

No repair of these examples was attempted.

## Resume gate

Resolve the approximately 92 m discrepancy using authoritative evidence that identifies the NAS大崎 physical building/entrance, with documented precision. Then repeat latest-main/Production/deployment/migration and immediate pre-candidate NULL/NULL checks, prepare the existing-mechanism candidate, and run the requested disposable validation. Human coordinate-authority resolution is needed before a repair candidate can be marked ready.

Branch: `codex/nas-osaki-coordinate-repair`. Repair candidate SHA: **none**. The commit containing this document is audit evidence only.
