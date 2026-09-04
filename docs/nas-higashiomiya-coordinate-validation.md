# NAS東大宮（新館） repair validation and release boundary

Authority: [coordinate resolution](nas-higashiomiya-coordinate-resolution.md).
Apply: [one-transaction SQL](../supabase/sql/repair_nas_higashiomiya_coordinates.sql).
Rollback: [receipt-guarded SQL](../supabase/sql/rollback_nas_higashiomiya_coordinates.sql).
Reproducible validator: [native PostgreSQL17 validation](../scripts/validate-nas-higashiomiya-coordinate-repair.mjs).

## Fresh state and fixture

Initial fetch and current Production deployment API both identified main
`4ba6b6b1405469c8909e2367d00f54fdd14b35f5`, deployment
`dpl_FT7pWibkWK8NuQ1jUtksukyig2hT`, global migration0015.
2026-09-04T07:18:06.521499Z read-only preflight: target active, coordinates NULL/NULL,
positive existing membership, 143 stored/latest schedules (August 2026; no claim
of September freshness). Census: 366 active positive members, 365 mappable, one gap.

No fresh broad Production export was performed. Automatic safety review rejected
a proposed five-table export. A materially narrower approved check read only
five aggregate SHA-256 values, census, target row, target membership and its
143 public schedules. All five hashes match the **user-supplied existing** local
`production-postsnapshot.jsonl` (2026-09-04T06:49:50.432321Z, file SHA-256
`db3b8f3c687db1eddb82c3c9d390d566870d1d4a059ab5c85fe34e98a3d42e70`).
No authentication/user tables or training facts were exported.

That supplied fixture has 444 locations, 369 memberships, 21,188 schedules,
58 brands and 2,324 programs. Restored hashes were independently recomputed
inside native PostgreSQL17, including timestamp/numeric normalization.

## Disposable database result

**PASS**, PostgreSQL17.11, 2026-09-04T07:27:06.193Z. Production is PostgreSQL17.6;
the same major version is used, not an assertion of the same patch/platform.
Migrations0001–0015 ran unmodified. Dedicated low-memory UNIX-socket-only cluster,
no Production connection credentials. No unrelated IPC/process cleanup.

| Gate | Result |
|---|---|
| Existing target ID, name, slug, address, brand, active | Preserved |
| Authored mutation | Latitude 35.947483; longitude139.641284 only |
| Existing updated_at trigger | Enabled; timestamp advances normally |
| Changed location rows | Exactly1; other443 unchanged |
| All memberships / all schedules | Byte-equivalent database JSON before/after |
| Target latest/stored schedules | 143/143 preserved |
| Positive members | 366→366 |
| Mappable / known gaps | 365→366 / 1→0 |
| Map-purpose index | Exact unchanged247 location entries |
| Map BODYCOMBAT / BODYPUMP | Target newly eligible; six own rows each |
| S1 structured NAS, 埼玉県/さいたま市 | IDs/order/count/update metadata unchanged |
| S1 target real results | Blank143; BODYCOMBAT6; BODYPUMP6 |
| Nearby / map-scope / URL selection / preview | PASS |
| Exact coordinate collision | None; BODY UP sibling remains53.54m away |
| Schema/functions/constraints/triggers | Unchanged |
| All31 public tables | Compared; non-Lesson tables schema-only, not Production HYROX restore |

The first S1 test used an over-specific ward string and matched the empty-result
sentinel; this was corrected to the established municipality authority
`さいたま市`, with explicit assertions that target schedule IDs are returned.
Only the corrected second rehearsal is the accepted validation result.

Nine preimage drift scenarios fail closed: either partial-coordinate case,
inactive target, identity drift, removed membership, schedule-content drift,
schedule ownership drift, unrelated location drift, and migration drift.
Apply replay rejects. Exact receipt rollback restores NULL/NULL with only normal
trigger timestamp advancement. Tampered receipt and rollback replay reject.

## Actual unmodified Map component

An isolated Next harness copied the current Map components/lib/CSS unchanged and
fed actual before/after DB outputs. No Production credentials, analytics tags,
application-source mutation, or runtime deployment.

- Global blank count365→366; NAS+埼玉県 blank list6→7 includes 新館 after repair.
- BODYCOMBAT NAS+埼玉県 list1→2; 新館's preview contains its own matching names.
  The UI's626 aggregate lesson total is existing global-purpose semantics, not
  a claim that this facility owns626 schedules. Its count is6 and stays6.
- BODYPUMP includes 新館, own count6.
- Selection uses `selected=sports-club-nas-higashiomiya-newbuild-index`, correct
  unchanged26-1 address and existing location-detail link.
- At building-area zoom, map scope retains one BODYCOMBAT result at the center:
  新館. Returning to nearby order and closing selection preserves filters,
  clears only the selected URL value, and keeps the existing behavior.
- In-app WebGL/vector loading fell back to the existing OSM raster path. This
  happened before and after; raster placement/scope were verified. No claim that
  the browser's unavailable vector/WebGL path was independently restored.

## Repository gates

Full authoritative suite311/311; focused Lesson eligibility/Map-purpose,
proximity, Map presentation/runtime, S1, HYROX UI suite55/55; typecheck; lint;
`git diff --check`: PASS. P1–P4 are covered by the unchanged Map tests/runtime.

Optimized `next build`: PASS with no Production credentials, using the existing
no-credentials data fallbacks. The initial `npm run build` wrapper stopped at its
Supabase-dependent sitemap prebuild because no credentials were configured.
**No Production-data-backed sitemap/static-generation claim is made.** This is
a coordinate-only data packet; no runtime build/deployment change is necessary.

## Exact future release conditions

SQL is deliberately fail-closed against the frozen hashes of all locations,
memberships and schedules. A freshness update or any unrelated data drift needs
a newly checked/rehearsed freeze; do not weaken/remove a predicate. Never run
the broad geocoder's `--apply` (it has unrelated closure writes).

After human Production authorization only: recheck main/source/migration and
target preimage, use the scoped SQL in one transaction, capture its receipt and
confirm successful commit. Only latitude/longitude are authored. Require exactly
one changed location and exact postimage, all IDs/memberships/schedules unchanged.
Capture returned target updated_at; do not suppress the trigger.

Rollback requires a separate authorization and the exact **committed** postimage
in psql variable `release_postimage`. The frozen preimage coordinates are NULL/NULL.
It does not rewrite updated_at back to an old time; the normal trigger advances it.

Post-apply: blank map includes 新館; census366 mappable/zero gaps if no drift;
BODYCOMBAT/BODYPUMP and purpose index pass; nearby/scope/selection, S1 and HYROX
smokes pass. Observe existing cache revalidation; if a stale cache remains,
use only the already-established scoped gym-locations cache procedure within
the future release's authority. No cache invalidation has occurred in this task.

Final integration SHA and fresh pre-Production snapshot belong in the frozen
release packet produced after non-force main integration. **This document is
not authorization to mutate Production.**
