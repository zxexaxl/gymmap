# GymMap Map Polish P1-M0 — OpenFreeMap Vector Basemap Contract v1

## 1. FINAL VERDICT

**OPENFREEMAP_VECTOR_REFERENCE_POC_READY**

The reference PoC materially meets the visual and architectural target after one mandatory, now-frozen source-schema correction: OpenFreeMap planet tiles currently classify station POIs as `railway`, while the hosted Liberty style still filters `poi_transit` as `rail`. The candidate style must match `railway` with `rail` retained only as a compatibility value. Unmodified hosted Liberty is not an acceptable GymMap style.

Success verdicts:

```text
GYMMAP_MAP_POLISH_P1_M0_CONTRACT_CANDIDATE_READY
OPENFREEMAP_FREE_PROVIDER_POLICY_VERIFIED
OPENFREEMAP_VECTOR_REFERENCE_POC_READY
LEAFLET_OUTER_ARCHITECTURE_PRESERVED
PASSIVE_VECTOR_BASEMAP_CONTRACT_DEFINED
M1_MARKER_SYSTEM_REFERENCE_PASS
RAIL_STATION_PRIORITY_REFERENCE_PASS
JAPANESE_LABEL_REFERENCE_PASS
LESSON_HYROX_SHARED_BASEMAP_REFERENCE_PASS
WEBGL_REFERENCE_PASS
RASTER_FALLBACK_CONTRACT_DEFINED
NO_PAID_PROVIDER_DEPENDENCY
NO_PRODUCT_RUNTIME_MUTATION
NO_MAIN_MERGE
NO_PRODUCTION_MUTATION
READY_FOR_HUMAN_VISUAL_AND_ARCHITECTURE_REVIEW
```

This verdict does **not** declare `GYMMAP_MAP_POLISH_P1_COMPLETE`.

## 2. CURRENT BASELINE

- Authority fetched before work: `origin/main` at `dee7e83bb725ae848ff14fcccad6313bab21af95` (`2026-09-01T07:06:27+09:00`).
- Product/UI state: the closed Product/UI refresh on `origin/main` remains authority.
- M0/M1: existing map behavior and the accepted M1 marker presentation remain authority; no replacement marker system was created.
- H3-10C: unchanged.
- P1/P1-v2: P1-v2 remains a non-production visual comparison branch (`334fe79` observed); it was not merged or deployed.
- P1-ARCH: the Leaflet-outer/passive-vector renderer direction is retained. Its paid-provider option is superseded by this task's free-only policy.
- Primary checkout was dirty and was not touched. Work ran in an isolated worktree created from exact `origin/main`.

## 3. OPENFREEMAP AUTHORITY

Verified on 2026-09-01 against current official material:

- Hosted service: use the [OpenFreeMap public instance](https://openfreemap.org/) first; tile self-hosting is out of scope.
- Price/key: the public instance is described as completely free, with no registration, API key, user database, cookies, map-view limit, or request limit.
- Commercial use: no commercial-use prohibition was found in the hosted-service terms; underlying data/style licenses and attribution still apply.
- SLA: none. The service is provided as-is, without warranty, and may be changed or discontinued. This is an explicit operational risk, not a hidden assumption.
- Terms/privacy: [Terms](https://openfreemap.org/tos/) and [Privacy](https://openfreemap.org/privacy/) were reviewed. Cloudflare may process requests; temporary IP logging may be enabled during security incidents.
- Attribution: OpenFreeMap, OpenMapTiles, and OpenStreetMap data attribution is mandatory and was rendered in the PoC.
- Style/source: start from current Liberty, whose upstream remains active. Do not use abandoned Positron/Bright variants as the maintenance authority.
- References: [Quick start](https://openfreemap.org/quick_start/), [style repository](https://github.com/hyperknot/openfreemap-styles), [style license](https://github.com/hyperknot/openfreemap-styles/blob/master/LICENSE.md), and the public `planet` TileJSON.

Hard stop token if the policy changes: `OPENFREEMAP_FREE_POLICY_NO_LONGER_VALID`. No paid provider may silently replace it.

## 4. RENDERER ARCHITECTURE

- Leaflet remains the sole outer map, camera, pan/zoom, event, marker, control, selection, bounds, and resize authority.
- MapLibre GL JS is a passive basemap renderer only: `interactive: false`, no pitch, no bearing, no duplicate controls, and no product-domain awareness.
- Integration candidate: exact-pinned `@maplibre/maplibre-gl-leaflet@0.1.4`, behind a GymMap-owned narrow adapter.
- The adapter may call only the package's public `maplibreGL()` and `getMaplibreMap()` APIs. It must own setup, resize synchronization, error translation, attribution, context-loss handling, and teardown.
- MapLibre v6 worker artifacts must be explicitly served/configured. The PoC found that omitting the shared worker module leaves vector tiles permanently pending even though style, sprite, and TileJSON requests succeed.
- Preserve the existing `dynamic(..., { ssr: false })` Leaflet loading boundary. A route must not import the Leaflet renderer directly into server evaluation.
- Lesson and HYROX must invoke the same basemap adapter. The adapter must not know which domain is active.

## 5. STYLE CONTRACT

- Base: a repository-owned, versioned derivative of active OpenFreeMap Liberty. Runtime mutation of a remote style is PoC-only; implementation must check in a reviewed style JSON/build recipe with required notices.
- Roads: keep hierarchy and orientation, reduce secondary-road opacity, remove motorway/road shields, one-way arrows, and house numbers from the default GymMap view.
- Rail: keep `transportation.class` values `rail` and `transit`, including tunnel/bridge variants, in a visible neutral gray with hatching retained where it improves orientation.
- Stations: retain `poi_transit`, but match `poi.class` in `['railway', 'rail']`; prefer station symbols/text over minor POI.
- Japanese text: select the first non-empty value in `name:ja`, `name:nonlatin`, `name`, `name_en`, `name:latin`. A plain `coalesce` is insufficient because present-but-empty values can suppress later fallbacks.
- Water/green: pale water and low-saturation green; neither may overpower markers.
- POI: remove minor `poi_*` layers; keep rail stations. Airports and bus POI are outside the P1 default emphasis.
- Place labels: preserve national, prefectural, ward/city, and neighborhood orientation in Japanese-first order.
- Every weekly planet update must run the station-source regression set before promotion. A source-schema mismatch is a release blocker.

## 6. STATION / RAIL COMPLETENESS

Tokyo source check at the matched urban viewport found all four critical names: `東京=true`, `有楽町=true`, `銀座=true`, `新宿=true`; 25 station symbols were rendered in the checked Ginza viewport after the `railway` correction.

Shinjuku source/render check found `新宿`, `新宿三丁目`, `新宿西口`, `新線新宿`, `東新宿`, `南新宿`, `新大久保駅`, and surrounding rail context.

Regional Takasaki/Maebashi check found `前橋`, `中央前橋`, `新前橋`, `高崎`, `北高崎`, `南高崎`, and `高崎問屋町` with regional road/rail orientation intact.

The official hosted Liberty style without the correction fails this gate. The corrected derivative passes. If any critical source name or visible station label disappears on a future dataset/style update, stop with `OPENFREEMAP_STATION_COMPLETENESS_INSUFFICIENT`.

## 7. M1 MARKER REFERENCE

- Real M1 implementation used: **YES**. The PoC imported the existing `LeafletGymMap`, `AccessibleLocationMarker`, `resolveMapMarkerState`, `getMapMarkerPresentation`, and accepted focus CSS; it did not draw fake pins.
- Default: nationwide HYROX produced four `data-marker-state="default"` markers.
- Selected: actual GymMap facilities produced `data-marker-state="selected"` and `aria-pressed="true"`; non-selected markers remained de-emphasized.
- Focus: the second real M1 marker reported `role="button"`, `tabindex="0"`, `data-marker-state="preview"`, `aria-pressed="false"`, and the accepted focus-visible ring.
- Keyboard handlers remain Enter/Space from M1; basemap replacement owns no marker input.
- Marker contrast remained stronger than roads, rails, labels, water, and green in all checked views.

## 8. LESSON REFERENCE

Lesson used actual published GymMap facility records for Gold's Gym 銀座中央/銀座東京, JEXER 新宿, Tipness 東新宿, and Megalos 西新宿. Existing selection cards, location control, toolbar, list, marker states, caption, and Leaflet camera behavior remained above the passive vector canvas. Ginza and Shinjuku selected-state references passed.

## 9. HYROX REFERENCE

HYROX used actual published GymMap facility records including ゴールドジム 前橋インター, A Plus CrossFit Takatsuki, BEYOND 名古屋駅前店, and BeeQuick Fitness 館山. The same basemap component passed selected regional and unselected nationwide views. Domain switching changed product data/UI only; it did not instantiate a different basemap contract.

## 10. MOBILE / WEBGL

- Desktop WebGL: PASS.
- 390 × 844 Lesson WebGL: PASS; no horizontal overflow (`scrollWidth=innerWidth=390`), selected marker/card remained usable.
- 390 × 844 HYROX WebGL: PASS; selected regional marker/card remained usable.
- Resize 1280 → 390: PASS; Leaflet resize observer and MapLibre resize synchronization retained a loaded canvas.
- Pan/zoom: PASS. A Leaflet drag changed the MapLibre center from `35.65688,139.76532` to `35.65688,140.05302`; zoom-in/out returned to zoom 12 with canvas and all five M1 markers intact.
- WebGL context loss: PASS. The vector canvas was removed, four raster tiles loaded, the selected marker retained `aria-pressed=true`, and the fallback notice was exposed.

## 11. PERFORMANCE

Matched 1280px local PoC, three runs, median ready signal:

| Metric | Current raster reference | OpenFreeMap vector reference |
| --- | ---: | ---: |
| Ready runs | 122 / 36 / 39 ms | 439 / 655 / 430 ms |
| Median ready | 39 ms | 439 ms |
| Map requests | 12 | 9 |
| Map payload | 461,030 B | 339,726 B |

The raster payload was read from the twelve actual loaded PNG responses in-browser (`blocked=false`). The vector figure includes style/TileJSON/sprite/glyph/tile/worker map resources observed by Resource Timing through the PoC same-origin read-through path. These are local comparative signals, not production latency claims.

Proposed source artifacts add approximately 287,450 gzip bytes of JavaScript plus 10,619 gzip bytes of CSS before production bundling/tree-shaking. Therefore P1-M1 must lazy-load the vector renderer only with the map, keep it out of non-map routes, record real production chunks, and reject a materially larger unexplained delta. Pan, zoom, resize, and marker interaction showed no persistent blanking or camera divergence.

## 12. FALLBACK / ROLLBACK

- Capability gate: if WebGL creation fails, render the existing free raster path before exposing the map.
- Runtime gate: on `webglcontextlost`, fatal style fetch failure, repeated tile/source failure beyond a bounded timeout, or bridge initialization failure, remove the vector layer and activate raster without remounting markers/controls/panels.
- User state must survive: center, zoom, bounds, selected ID, focus, `aria-pressed`, Lesson/HYROX state, and URL selection.
- Provider outage: show a concise retryable map notice, avoid request storms, and use the current OSM raster only as a limited emergency/capability fallback under its usage policy. It is not a new scalable primary-provider commitment.
- No paid fallback is permitted.
- Rollback: one feature flag/config switch returns the basemap to current raster; remove the vector adapter/style/packages in one revert. No DB migration or data rollback is involved.
- If OpenFreeMap ceases the free hosted policy, stop and reopen provider architecture; do not auto-select a paid vendor.

## 13. DEPENDENCIES

Future proposed packages only; neither remains in this branch's final runtime diff:

| Package | Exact candidate | License | Observed current publication | Source artifact size |
| --- | --- | --- | --- | ---: |
| `maplibre-gl` | `6.6.0` | BSD-3-Clause | npm modified 2026-08-24 | 19,483,810 B unpacked |
| `@maplibre/maplibre-gl-leaflet` | `0.1.4` | ISC | npm modified 2026-08-16 | 281,620 B unpacked |

The bridge is active but pre-1.0. Exact pinning, a narrow adapter, public-API-only use, peer-range CI, teardown tests, Leaflet resize tests, and context-loss tests are mandatory. A small private bridge was rejected because it would transfer more camera-sync and lifecycle risk into GymMap. Stop if the official bridge becomes unmaintained or incompatible; do not silently fork it.

## 14. ATTRIBUTION

The reference rendered this visible Leaflet attribution string with three working links:

`OpenFreeMap © OpenMapTiles Data from OpenStreetMap`

The implementation must preserve OpenFreeMap/OpenMapTiles/OpenStreetMap attribution, the OpenFreeMap style repository MIT notice, Liberty's BSD-3-Clause code lineage, CC BY 4.0 design attribution, font/icon notices (including SIL OFL where applicable), and the MapLibre/binding licenses. Attribution must remain visible on desktop and mobile and must not be covered by the selection sheet.

## 15. HUMAN VISUAL SCORES

Scores are the author/reviewer reference assessment on a five-point scale, not analytics:

| Dimension | Score | Finding |
| --- | ---: | --- |
| Rail | 4.3 | Visible and useful without dominating facilities |
| Station | 4.5 | Critical stations pass after mandatory `railway` correction |
| Japanese label | 4.4 | Japanese-first, good urban/regional orientation |
| Roads | 4.1 | Still informative; substantially quieter than current raster |
| Markers | 4.7 | M1 selected/default/focus remain unmistakable |
| Orientation | 4.4 | Tokyo, Shinjuku, regional, and nationwide views remain legible |

Human visual and architecture review is still required before P1-M1 implementation.

## 16. POC SCREENSHOTS

Matched controls and key references:

- [Current raster / Ginza Lesson](map-polish-p1/openfreemap-vector-evidence/control-raster-ginza-lesson-desktop.jpg)
- [P1-v2 / Lesson selected](map-polish-p1/openfreemap-vector-evidence/control-p1-v2-lesson-selected.jpg)
- [P1-v2 / HYROX 390px selected](map-polish-p1/openfreemap-vector-evidence/control-p1-v2-hyrox-390-selected.jpg)
- [OpenFreeMap vector / Ginza Lesson](map-polish-p1/openfreemap-vector-evidence/vector-ginza-lesson-desktop.jpg)
- [OpenFreeMap vector / Shinjuku Lesson](map-polish-p1/openfreemap-vector-evidence/vector-shinjuku-lesson-desktop.jpg)
- [OpenFreeMap vector / Takasaki-Maebashi HYROX](map-polish-p1/openfreemap-vector-evidence/vector-takasaki-maebashi-hyrox-desktop.jpg)
- [OpenFreeMap vector / nationwide HYROX](map-polish-p1/openfreemap-vector-evidence/vector-nationwide-hyrox-desktop.jpg)
- [OpenFreeMap vector / 390px Lesson](map-polish-p1/openfreemap-vector-evidence/vector-lesson-390-selected.jpg)
- [OpenFreeMap vector / 390px HYROX](map-polish-p1/openfreemap-vector-evidence/vector-hyrox-390-selected.jpg)
- [M1 marker focus / mobile](map-polish-p1/openfreemap-vector-evidence/vector-lesson-mobile-marker-focus.jpg)
- [WebGL context-loss fallback / mobile](map-polish-p1/openfreemap-vector-evidence/fallback-webgl-context-loss-mobile.jpg)
- [Measurement record](map-polish-p1/openfreemap-vector-evidence/measurement-v1.json)

## 17. IMPLEMENTATION CONTRACT

Artifact: this document plus the evidence directory above.

Frozen rules for P1-M1:

1. OpenFreeMap public hosted planet source only; no recurring paid provider and no tile-infrastructure self-hosting.
2. Leaflet remains outer authority; MapLibre is passive and non-interactive.
3. Use one shared adapter/style for Lesson and HYROX.
4. Use existing M1 markers and product UI unchanged.
5. Use a versioned Liberty derivative with `poi.class = railway|rail` station compatibility and non-empty Japanese fallback.
6. Ship/configure the MapLibre worker and shared worker artifact deliberately.
7. Lazy-load renderer/style, render full attribution, and instrument readiness/source errors/context loss.
8. Keep raster capability/emergency fallback and a one-switch rollback; never add a paid fallback.
9. Gate every planet/style update on Tokyo, Yurakucho, Ginza, Shinjuku, Takasaki/Maebashi, nationwide, Lesson/HYROX, mobile, M1, and fallback checks.
10. P1-M1 requires a new implementation task and human approval; this branch authorizes no production migration.

## 18. MUTATION AUDIT

| Surface | Final mutation |
| --- | --- |
| Runtime | NO |
| CSS | NO |
| Provider production config | NO |
| Production dependencies | NO |
| M1 | NO |
| H3 | NO |
| DB | NO |
| Production/deploy | NO |

The temporary route, style transformer, worker files, proxy, package additions, and runtime switch used for evidence were removed before delivery. Final branch content is docs/evidence only. `git diff --check` and repository tests must pass on the cleaned branch.

## 19. DELIVERY

- Branch: `codex/map-polish-p1-openfreemap-vector-contract`
- Commit: exact pushed HEAD is reported in the task handoff.
- Push: required to `origin`.
- Main merge: **NO**.
- Deploy/production mutation: **NO**.

## 20. NEXT GATE

If human visual and architecture review accepts this contract, the next task is:

`P1-M1 — OpenFreeMap Vector Basemap Implementation Candidate`

P1-M1 must implement the frozen adapter/style/fallback contract and remeasure the real production bundle and public network path. P2 is **NOT STARTED**. MapChrome polish remains **HOLD**. Analytics remains separate.
