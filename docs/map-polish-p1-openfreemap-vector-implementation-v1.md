# GymMap Map Polish P1-M1 — OpenFreeMap Vector Basemap Implementation Candidate

## 1. FINAL VERDICT

Technical candidate verdict: **READY FOR HUMAN VISUAL / PERFORMANCE / A11Y REVIEW**.

```text
GYMMAP_MAP_POLISH_P1_M1_IMPLEMENTATION_CANDIDATE_READY
OPENFREEMAP_VECTOR_BASEMAP_IMPLEMENTED
LEAFLET_OUTER_ARCHITECTURE_PRESERVED
PASSIVE_MAPLIBRE_BASEMAP_IMPLEMENTED
GYMMAP_VECTOR_CARTOGRAPHY_IMPLEMENTED
RAIL_STATION_PRIORITY_IMPLEMENTED
JAPANESE_STATION_LABEL_PRIORITY_IMPLEMENTED
MAJOR_ROADS_SUBDUED
M1_MARKER_SYSTEM_PRESERVED
M1_FOCUS_A11Y_PRESERVED
LESSON_MAP_DOMAIN_PRESERVED
HYROX_H3_10C_DOMAIN_PRESERVED
LESSON_HYROX_SHARED_BASEMAP_IMPLEMENTED
MAP_ROUTE_LAZY_LOADING_IMPLEMENTED
RASTER_FALLBACK_IMPLEMENTED
NO_PAID_PROVIDER_DEPENDENCY
OPENFREEMAP_ATTRIBUTION_PRESERVED
RESPONSIVE_MAP_ACCEPTANCE_PASS
ACCESSIBILITY_MAP_ACCEPTANCE_PASS
NO_MATERIAL_PERFORMANCE_REGRESSION
READY_FOR_HUMAN_VISUAL_PERFORMANCE_A11Y_REVIEW
NO_MAIN_MERGE
NO_PRODUCTION_PROMOTION
```

`GYMMAP_MAP_POLISH_P1_COMPLETE` is **not** declared. P1-M1 remains a candidate pending the Human Review gate.

## 2. BASELINE

- Starting and final observed `origin/main`: `dee7e83bb725ae848ff14fcccad6313bab21af95` (2026-09-01 07:06:27 JST).
- P1-M0 contract: `901a51441697f7de22ce0f635cfc41eebf940897`.
- Current production comparison remained the OSM raster product UI; browser observation found 433 real markers, 12 raster tiles, and no MapLibre canvas.
- Product/UI state, M0 URL/selection behavior, M1 markers/focus, and H3-10C semantics were treated as protected.
- Branch: `codex/map-polish-p1-openfreemap-vector-implementation`.
- Isolated worktree: `/private/tmp/gymmap-map-polish-p1-openfreemap-vector-implementation`; the dirty primary checkout was not mutated.
- P1-ARCH and P1-M0 parallel branches were docs/evidence only. P1 readability had runtime changes but was unmerged and was not imported. Final `origin/main` recheck found no parallel-map collision.

## 3. BRIDGE DECISION

- Evaluated adapter: `@maplibre/maplibre-gl-leaflet@0.1.4`, maintained in the MapLibre GitHub organization, ISC licensed, peer-compatible with Leaflet 1.9 and MapLibre 6, and recommended by OpenFreeMap's Leaflet quick start.
- Evaluated owned bridge: would need to own Leaflet camera synchronization, zoom animation, resize, attribution refresh, canvas placement, and teardown. This would materially increase lifecycle and private-API risk.
- Chosen: exact-pinned adapter behind the GymMap-owned `OpenFreeMapVectorBasemap` wrapper.
- Risk containment: passive/noninteractive MapLibre, Leaflet event authority, explicit worker URL, one-failure guard, load timeout, provider threshold, context-loss fallback, and deterministic cleanup.

## 4. OPENFREEMAP IMPLEMENTATION

- Runtime style URL: `/map/gymmap-openfreemap-liberty-v1.json` (GymMap owned and versioned).
- Upstream derivation: `https://tiles.openfreemap.org/styles/liberty`, pinned SHA-256 `601099…7b60`.
- Vector source: `https://tiles.openfreemap.org/planet`; glyph and sprite endpoints remain OpenFreeMap.
- Provider: OpenFreeMap only for the new vector layer. No key, registration, account, metered provider, or paid SDK was introduced.
- Current official authority review (2026-09-01): public instance is free, commercial use is allowed, no request/view limit or API key is stated, attribution is required, and no SLA is promised. Sources: [OpenFreeMap](https://openfreemap.org/), [Quick Start](https://openfreemap.org/quick_start/), and [Terms of Service](https://openfreemap.org/tos/).
- Rollback seam: `NEXT_PUBLIC_MAP_BASEMAP_MODE=raster`; default/unknown is the vector candidate. This is internal and not exposed in UI. Rollback needs only an environment change plus rebuild/redeploy, not a code change.

## 5. VECTOR STYLE

- Roads: warm neutral palette, casing opacity `0.38`, major road opacity `0.70`, minor road opacity `0.62`; shields, one-way arrows, road area pattern, and minor-road names below z15 are suppressed.
- Railway: rail line opacity `0.88`, differentiated hatching, and preserved tunnel treatment.
- Station: `poi_transit` is restricted to OpenMapTiles `railway` plus compatibility `rail`, moved ahead of place labels, with a strong dot-prefixed Japanese label treatment.
- Japanese labels: nonempty coalesce order `name:ja → name:nonlatin → name → name:latin → name_en` for station/place/road labels; no global Japanese-only expression that can produce blanks.
- Water: low-chroma `#dce9ed`; waterways softened.
- Green: park/landcover opacity reduced to remain contextual.
- POI: generic POI ranks removed; transit stations remain.
- Place labels: Japanese-first, neutral dark text, warm halo.
- Liberty regeneration is review-gated by its upstream SHA; style validation passed.

## 6. RAIL / STATION REVIEW

- Tokyo: rail lines read above subdued roads; Japanese ward/city labels and stations remain legible under real M1 markers.
- Shinjuku: dense rail/road crossing remains identifiable while the selected marker retains priority.
- Regional/Kanto: rail network survives zoom-out without motorway color dominating.
- Nationwide: place hierarchy and relief remain readable; marker selection remains visible.
- Final human completeness review is still required; no claim is made that every OpenStreetMap station is present in the source data.

## 7. REAL M1 MARKERS

- Real `LeafletGymMap` markers were used with public production coordinates, not MapLibre-native replacement markers.
- Default/de-emphasized, selected, preview/focus, `aria-label`, `aria-pressed`, Enter, and Space behavior passed browser checks.
- Selected count remained exactly one in Lesson, HYROX, provider-outage fallback, and WebGL-context-loss fallback.
- Marker implementation block SHA-256 is identical to `origin/main`: `ceeb2e0…10bd`.
- Marker code diff: **NO**.

## 8. LESSON MAP

- Loader, filters, list ordering, URL state, panel/detail ownership, and Lesson semantics were not edited.
- Lesson continues to lazy-load the shared `LeafletGymMap`; the basemap seam is internal to that component.
- Browser evidence used six publicly observed production coordinates and the actual M1 marker component.
- Screenshots: `lesson-vector-desktop-selected.jpg`, `lesson-vector-390-marker-focus.jpg`, `lesson-vector-kanto-selected.jpg`, and `vector-nationwide-selected.jpg`.

## 9. HYROX MAP

- HYROX loader, prefecture filter, positive/unknown semantics, panel, list, and detail links were not edited.
- H3-10C remains domain-owned; no basemap-specific domain fork exists.
- HYROX uses the same shared `LeafletGymMap` and vector layer as Lesson.
- Screenshots: `hyrox-vector-desktop-selected.jpg`, `hyrox-vector-430-selected.jpg`, and `hyrox-vector-390-regional-selected.jpg`.

## 10. LAZY LOAD

- Architecture: route/domain dynamically loads `LeafletGymMap`; that component uses `React.lazy` to load `openfreemap-vector-basemap`, which alone imports adapter, MapLibre, and MapLibre CSS.
- Global/non-map JS: `/updates` asset inspection found zero MapLibre/OpenFreeMap assets.
- Dynamic chunks: two JS chunks, `1,088,387` raw / `288,365` gzip total; one CSS chunk, `82,869` raw / `10,533` gzip.
- Worker and shared worker are map-triggered public module assets; MapLibre does not enter AppShell/Header/shared page initial bundles.

## 11. PERFORMANCE

- Raster baseline (P1-M0 frozen reference): median ready `~39 ms`, 12 requests, `461,030 B`.
- Vector reference (P1-M0): median ready `~439 ms`, 9 requests, `339,726 B`.
- P1-M1 actual final production-build observation: vector ready console event `~534 ms` after map initialization; marker SVG is mounted independently and does not wait for the vector load event.
- Candidate local runtime: JS `288,365` gzip, CSS `10,533`, owned style `3,790`, worker pair `141,790`; total `444,478` gzip across map-only assets.
- Browser page-asset observer saw 13 map-specific top-level assets; worker-internal tile fetches are not enumerated, so this count is not compared directly with P1-M0 requests.
- 390/430 showed no horizontal overflow. Pan, zoom, regional, nationwide, resize, and selected marker synchronization were visually accepted.
- No obvious multi-second stall or blank-map regression was observed. This is not a CWV claim.

## 12. WEBGL

- Desktop: one vector canvas; no duplicate canvas; visible attribution.
- 390 and 430: rendered successfully, no overflow, selection preserved.
- Resize: Leaflet's existing `ResizeObserver` invalidation plus adapter resize kept vector and marker alignment.
- Mount/unmount: `1 → 0 → 1` MapLibre canvases across map route, non-map route, and remount; Leaflet maps `1 → 0 → 1`; no console errors.
- Context loss: actual `WEBGL_lose_context` invocation changed vector canvas `1 → 0`, raster tiles `0 → 15`, while keeping 2 markers and 1 selected marker. Evidence: `fallback-webgl-context-loss-desktop.jpg`.

## 13. FALLBACK

- Triggers: synchronous initialization error, any pre-load MapLibre error, 10-second load timeout, three post-load provider errors, and WebGL context loss.
- Provider/style outage was simulated by withholding the local style. Result: vector canvas 0, raster tiles 15, six markers, one selection, OSM attribution, and a Japanese status notice without reload.
- Actual context loss produced the same renderer switch.
- Domain state preservation: markers and selected identity stayed in the Leaflet tree; list/filter/panel/detail components are outside the renderer seam and were unchanged.
- Evidence: `fallback-provider-outage-desktop.jpg` and `fallback-webgl-context-loss-desktop.jpg`.

## 14. M1 A11Y

- Keyboard traversal: marker became the active element with `data-marker-state=preview` and an accessible label.
- Enter selected JEXER 上野; Space selected JEXER 四ツ谷; each produced exactly one `aria-pressed=true` marker.
- Focus-visible uses the existing marker-shaped ring; no native rectangular focus outline was introduced.
- MapLibre canvas is passive with `tabIndex=-1`, so it adds no keyboard stop.
- Existing panel close, MapChrome controls, touch targets, and reduced-motion handling were not changed and remain covered by the existing M1 tests.

## 15. ATTRIBUTION / LICENSE

- Visible vector attribution: `OpenFreeMap © OpenMapTiles Data from OpenStreetMap`, in addition to Leaflet's own credit.
- Raster fallback restores OSM contributor attribution.
- Vendored worker pair is unmodified MapLibre GL JS 6.6.0 (BSD-3-Clause); adapter is ISC; OpenFreeMap project/style is MIT; OpenStreetMap data attribution/ODbL obligations remain visible.
- Provenance, hashes, and notices are recorded in `public/map/README.md`.
- Current OpenFreeMap terms are as-is and no-SLA; production approval must retain the raster fallback and operational monitoring.

## 16. VALIDATION

- Typecheck: PASS (`tsc --noEmit`; final `next build` TypeScript phase also passed).
- Total tests: PASS, 165/165.
- Focused P1-M1 tests: PASS, 4 new contract/style/lazy/boundary tests.
- Lint: PASS, zero warnings/errors after excluding only the unmodified vendored worker modules.
- Style spec: PASS (`gl-style-validate`).
- Production build: PASS via `next build`, compiled and generated 146 static pages.
- `npm run build` wrapper prebuild could not regenerate Supabase sitemaps because the isolated worktree intentionally had no environment credentials; direct production build completed with expected missing-data warnings.
- `git diff --check`: PASS.
- Audit: five pre-existing high advisories remain through Next/Supabase dependency paths; `npm explain` found none introduced by MapLibre packages.

## 17. P2 STATUS

**NOT STARTED.** Only After-P1 density assessment is allowed after Human Review.

## 18. MAPCHROME

**HOLD / separate follow-up.** No MapChrome component or CSS was edited.

## 19. VISUAL REVIEW MATERIAL

Evidence directory: `docs/map-polish-p1/openfreemap-vector-implementation-evidence/`.

- Current production raster: `control-current-production-raster-desktop.jpg` (433 markers, 12 tiles).
- Vector: desktop selected, 390 focus, 430 selected, Kanto selected, nationwide selected, Lesson/HYROX.
- Failure: provider outage and actual WebGL context loss.
- Measurement: `measurement-v1.json`.
- `lesson-vector-empty-production-build.jpg` records the no-secret isolated production build: vector cartography succeeds even while Supabase-backed data is intentionally absent.

## 20. MUTATION AUDIT

```text
marker changed: NO
M1 behavior changed: NO
MapChrome changed: NO
Lesson semantics changed: NO
HYROX semantics changed: NO
DB/migration: NO
paid provider: NO
production: NO
```

Changed runtime authority is limited to the basemap renderer inside `LeafletGymMap`; the marker function, controller, domain consumers, and MapChrome are preserved.

## 21. DELIVERY

- Branch: `codex/map-polish-p1-openfreemap-vector-implementation`.
- Commit(s): supplied in the final handoff after commit creation.
- Final candidate SHA: supplied in the final handoff (a commit cannot embed its own SHA).
- Push target: `origin/codex/map-polish-p1-openfreemap-vector-implementation`.
- Main merge: **NO**.
- Production deployment/promotion: **NO**.

## 22. NEXT GATE

```text
P1-M1:
AWAITING_HUMAN_VISUAL_PERFORMANCE_A11Y_REVIEW

P2:
NOT STARTED
```

After the Human Review evidence is returned, stop. Do not merge main, deploy, start P2, redesign markers/MapChrome, or start Analytics in this task.
