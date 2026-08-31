# GymMap Map Polish P1-ARCH — Basemap Architecture Decision v1

Status: `CANDIDATE_FOR_HUMAN_ARCHITECTURE_REVIEW`

Decision date: 2026-09-01 (Asia/Tokyo)

Branch: `codex/map-polish-p1-basemap-architecture`

Production implementation: **not authorized**

## 1. Final verdict

```text
GYMMAP_MAP_POLISH_P1_ARCHITECTURE_REVIEW_COMPLETE
OSM_RASTER_FILTER_LIMIT_CONFIRMED
RAIL_STATION_PRIORITY_REQUIREMENT_FROZEN
BASEMAP_ARCHITECTURE_OPTIONS_EVALUATED
LESSON_HYROX_SHARED_BASEMAP_REQUIREMENT_PRESERVED
M0_M1_AUTHORITY_PRESERVED
H3_10C_AUTHORITY_PRESERVED
PRODUCTION_PROVIDER_AUTHORITY_EVALUATED
MIGRATION_RISK_EVALUATED
BASEMAP_ARCHITECTURE_RECOMMENDATION_READY
READY_FOR_HUMAN_ARCHITECTURE_REVIEW
NO_RUNTIME_MUTATION
NO_MAIN_MERGE
NO_PRODUCTION_MUTATION
LEAFLET_VECTOR_ARCHITECTURE_SELECTED
```

Recommended outcome: **OUTCOME C — `LEAFLET_VECTOR_ARCHITECTURE_SELECTED`**.

Use Leaflet as the outer interaction and M1 presentation architecture. Replace only the basemap layer with a non-interactive MapLibre GL vector layer through the maintained `@maplibre/maplibre-gl-leaflet` binding. Keep GymMap markers, current location, selection, focus, MapChrome, panel/sheet, domain data, and URL behavior in the current Leaflet/React ownership. A paid, browser-authorized vector provider and a GymMap-owned style are required for production; MapTiler Cloud is the leading verified production candidate, not an approved purchase or production switch in this phase.

This decision remains a candidate until Human Architecture Review. P1-v2 remains `HOLD` and must not be merged.

## 2. Current authority

Repository reconciliation performed after `git fetch origin --prune`:

- Repository root: `/Users/te/Documents/GymMap`
- Latest `origin/main`: `dee7e83bb725ae848ff14fcccad6313bab21af95` (`2026-09-01 07:06 JST`)
- Product/UI Refresh: `COMPLETE / CLOSED`, per [product-ui-refresh-closure-v1.md](product-ui-refresh-closure-v1.md)
- M0: `FROZEN`; M0-R1: `COMPLETE`, per [shared-map-behavior-authority-v1.md](shared-map-behavior-authority-v1.md)
- M1: `COMPLETE`; current shared presentation is on `main`
- H3-10C: `COMPLETE` and present on `main`
- P1 original candidate: `c3d394c09c42e5316f6325937e0dcf6d1b344a36`
- P1-v2 branch: `codex/map-polish-p1-basemap-readability`
- P1-v2 HEAD: `334fe79084609affa47b221e1209b7a7497a1cf2`
- P1-v2 human result: technical pass, rail/station priority insufficient, Human Visual Review `HOLD`, main merge `HOLD`
- Relevant active remote Map-polish branch: P1-v2 only. Historical M0/M1/H3 worktrees exist, but no parallel basemap-architecture authority collision was found.
- The primary checkout is dirty and its local `main` is not used as authority. This review uses a dedicated worktree based exactly on `origin/main`.
- Repository freeze: M0 behavior is frozen and Product/UI is closed. No broader repository-wide freeze blocking documentation-only architecture work was found.

### Current implementation inventory

| Concern | Current truth and exact owner |
| --- | --- |
| Map libraries | `react-leaflet ^5.0.0`, `leaflet ^1.9.4`; no vector renderer plugin in [package.json](../package.json) |
| Shared map | `LeafletGymMap` owns `MapContainer`, `TileLayer`, current-location circle, bounds, pan/fly, and M1 marker mounting in [leaflet-gym-map.tsx](../src/components/map/leaflet-gym-map.tsx) |
| Basemap | OSM Standard raster at `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`; visible OSM attribution; no main-branch CSS filter; warm beige loading canvas in [globals.css](../src/app/globals.css) |
| Zoom | selected/default initialization 13/12; `fitBounds` `maxZoom: 14`; no explicit retina option, so Leaflet defaults apply |
| M1 marker | `CircleMarker`, shared state resolver, tooltip, stable focus class, `tabindex=0`, `role=button`, `aria-label`, `aria-pressed`, Enter/Space in [leaflet-gym-map.tsx](../src/components/map/leaflet-gym-map.tsx), [map-marker-presentation.ts](../src/components/map/map-marker-presentation.ts), and [map-presentation.module.css](../src/components/map/map-presentation.module.css) |
| MapChrome / surfaces | `MapChrome`, current-location control, responsive `MapSelectionSurface`, close control, live regions in [map-presentation.tsx](../src/components/map/map-presentation.tsx) |
| Lesson | client-only Leaflet/optional Apple dynamic import, facility/query/filter/list composition, selected URL/history, panel/detail links in [location-map-section.tsx](../src/components/map/location-map-section.tsx) and [map-runtime-state.ts](../src/components/map/map-runtime-state.ts) |
| HYROX | same `LeafletGymMap`; prefecture filter, selected URL state, positive-only equipment content, panel/list/detail continuation in [hyrox-discovery.tsx](../src/components/training/hyrox-discovery.tsx), [hyrox-map-selection-content.tsx](../src/components/training/hyrox-map-selection-content.tsx), and [hyrox-discovery.ts](../src/lib/hyrox-discovery.ts) |
| Provider selection | shared configured Leaflet/Apple choice in [map-provider.ts](../src/lib/map-provider.ts); Apple path is outside this basemap recommendation |

Current map populations observed in accepted evidence are 433 Lesson facilities and 82 HYROX facilities. No domain loader, predicate, filter, ordering, URL, equipment, or detail-route change is authorized here.

The current OSM hostname on `main` includes `{s}`. The current OSMF Tile Usage Policy requires the exact `https://tile.openstreetmap.org/{z}/{x}/{y}.png` URL, visible attribution, cache-header compliance, and a valid browser Referer, and states that availability is best-effort with no SLA. P1-v2 normalized the URL, but P1-v2 is still held and not merged. Source: [OSMF Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/).

## 3. Product requirement

GymMap is a fitness-facility discovery map, not a general street atlas. Freeze the following hierarchy:

1. selected GymMap marker;
2. default GymMap markers and current location;
3. station and railway;
4. district/city/major place labels;
5. major roads;
6. minor roads, road shields/IC labels, and minor POI.

In Tokyo, the decisive usability questions are whether a user can identify the nearest station, tell which side of a major station a gym is on, see clusters around a station, and follow a rail corridor. Minor-street completeness is secondary.

## 4. Current raster limit

P1-v2 applies `saturate(0.1) contrast(0.98) brightness(1.18)` only to the OSM raster tile layer. It materially suppresses colored roads and improves marker separation without changing M0/M1/H3 behavior. It cannot independently change railway line width/color, station symbols, station label priority, road shields, POI, or label collision because those pixels are already composed by the upstream raster renderer.

| Reference | Evidence |
| --- | --- |
| Current `main` raster selected | [image](map-polish-p1-architecture-evidence/control-current-raster-lesson-selected.png) |
| P1-v2 Lesson selected | [image](map-polish-p1-architecture-evidence/control-p1-v2-lesson-selected.png) |
| P1-v2 HYROX selected | [image](map-polish-p1-architecture-evidence/control-p1-v2-hyrox-selected.png) |
| P1-v2 390 selected | [image](map-polish-p1-architecture-evidence/control-p1-v2-lesson-390-selected.png) |

Conclusion: P1-v2 is the best current raster-filter control. Further global filter iteration is not recommended.

## 5. Architecture options

### Option 0 — current OSM raster + P1-v2 filter

Preserves all Leaflet/M1 behavior and has almost no runtime cost. It suppresses roads but cannot independently promote stations/rail. It also retains a best-effort, no-SLA community tile endpoint. Control only; rejected as the final architecture.

### Option A — quiet pre-styled raster

Stadia Alidade Smooth is a credible production raster candidate: the official style is explicitly designed for marker-heavy maps, exposes Leaflet XYZ and `{r}` Retina URLs through zoom 20, and uses domain authentication for production websites. The matched PoC is visibly quiet and marker-friendly, but railway and station detail becomes even less useful. It fails the frozen orientation hierarchy.

### Option B — quiet raster + rail/station overlay

The PoC combines Stadia Alidade Smooth with a transparent OpenMapTiles-compatible vector rail layer while retaining Leaflet markers. It proves that rail can be made independent of roads. It also exposes the cost: two provider/source stacks, two cartographies, duplicate attribution, zoom/source-schema coupling, label collision, and extra requests/renderer JS. A first bounded extraction incorrectly included `transit` network classes and overpainted road-like geometry; the corrected extraction had to pin source-layer semantics. MLIT N02 would improve Japanese authority but adds ingestion, tiling, update, station-geometry normalization, and collision ownership. This is more operationally complex than using one vector basemap.

### Option C — Leaflet + vector basemap

The PoC keeps Leaflet as the outer map and adds a passive MapLibre vector layer through `@maplibre/maplibre-gl-leaflet`. Roads, rail, land, water, green, POI, and labels can be styled separately while the GymMap markers remain Leaflet objects above the canvas. This is the smallest architecture that meets the hierarchy and substantially preserves M1.

The binding repository is not archived, was pushed on 2026-08-16, has an ISC license, and explicitly describes itself as a MapLibre GL JS binding to the familiar Leaflet API. The npm package is `0.1.4` and declares Leaflet `^1.9.3` and MapLibre GL `^2.4 || ^3.3.1 || ^4.3.2 || ^5 || ^6` peers. The latest tagged GitHub release is `v0.1.3`, so production must pin and audit the npm/tag mismatch rather than assuming 1.0-level stability. Sources: [MapLibre GL Leaflet repository](https://github.com/maplibre/maplibre-gl-leaflet), [package metadata](https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/package.json).

### Option D — full MapLibre migration

Full MapLibre has equivalent basemap styling capability, but it would replace the outer interaction engine and force a deliberate rewrite/revalidation of M1 markers, keyboard focus, selection events, current location, bounds, MapChrome integration, panels/sheets, Lesson and HYROX parity, and tests. Option C obtains the required layer control without paying that migration cost. Architecture evaluated; no PoC or implementation performed.

## 6. Serious provider and data candidates

Authority was checked on 2026-09-01. Pricing is current-page pricing and may change.

| Candidate | Authority, key, cost, attribution, privacy/cache, production conclusion |
| --- | --- |
| OSMF Standard raster | Current source. No key; OSM attribution and ODbL link required. Tile endpoint is donation-funded, best-effort, no SLA, may block without notice; browser cache headers must be honored and bulk/offline fetch is prohibited. Requests go to OSMF infrastructure. Control only, not the recommended long-term production endpoint. [Policy](https://operations.osmfoundation.org/policies/tiles/) · [copyright](https://www.openstreetmap.org/copyright) |
| Stadia Maps Alidade Smooth | Quiet raster/vector style; global CDN, Leaflet `{r}` Retina tiles to z20. Production browser auth is domain-based with no exposed key. Free plan is non-commercial; Starter is USD 20/month, 1,000,000 credits/month plus USD 0.03/1k; raster/vector tile is one credit. Attribution: Stadia Maps, OpenMapTiles, OSM. Standard-plan SLA is not stated; bespoke SLA is enterprise/contact. Cache rights beyond ordinary temporary storage require terms confirmation. Suitable paid raster provider, but visual hierarchy fails. [style](https://docs.stadiamaps.com/map-styles/alidade-smooth/) · [auth](https://docs.stadiamaps.com/authentication/) · [pricing](https://stadiamaps.com/pricing/) |
| OpenFreeMap public instance | No registration/key/cookies, no stated request/view limits, commercial use allowed, weekly planet generation, OpenMapTiles schema, OSM data, required attribution. Public instance is free and `as-is`; no SLA or personalized support and it may discontinue without notice. Cloudflare may process requests; privacy policy normally omits IP logging but permits temporary incident logging. Excellent credentialless PoC/reference source; not selected as GymMap production authority. [overview](https://openfreemap.org/) · [quick start](https://openfreemap.org/quick_start/) · [terms](https://openfreemap.org/tos/) · [privacy](https://openfreemap.org/privacy/) |
| MapTiler Cloud / Planet vector | Leading production candidate for Option C. Browser API keys are explicitly supported and can be restricted by allowed HTTP origin. Map Designer/style JSON provides per-layer color, opacity, width, symbol, label and language control; Planet exposes railway classes/subclasses and local/Japanese naming. Free is non-commercial/R&D only. Current Flex is USD 30/month with 25k sessions and 500k API requests; overage USD 2.50/1k sessions and USD 0.15/1k requests. Custom advertises 99.9% SLA. Required MapTiler + OSM attribution; free also requires logo. Direct end-user requests and personal browser cache are allowed; server proxy/cache needs written agreement. Requests go to MapTiler/global CDN; EU endpoint is available. Production-suitable after traffic measurement, commercial plan approval, style QA, and key restriction. [pricing](https://www.maptiler.com/cloud/pricing/) · [terms](https://www.maptiler.com/terms/cloud/) · [key protection](https://docs.maptiler.com/guides/maps-apis/maps-platform/how-to-protect-your-map-key/) · [schema](https://docs.maptiler.com/schema/planet/) · [language](https://docs.maptiler.com/guides/map-design/change-language-in-a-map/) |
| MLIT National Land Numerical Information N02 | Latest page reports 2025-12-31 nationwide passenger railway/track and station data, railway/operator/route/station names, GeoJSON since 2016, and CC BY 4.0 for 2020 onward. Attribution and an explicit “based on/modified by” notice are required for processed output. It is downloadable source data, not a production tile/SLA service. GymMap would own normalization, tiling, hosting, freshness and collisions. Authoritative overlay candidate, but unjustified operational scope for P1. [N02 2025](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html) · [usage terms](https://nlftp.mlit.go.jp/ksj/other/agreement.html) |

API-key classification:

- Stadia production website: `NO KEY` in code via domain authentication.
- OpenFreeMap public instance: `NO KEY`.
- MapTiler browser: `PUBLIC CLIENT KEY`, acceptable only with allowed-origin restrictions and spend monitoring.
- MapTiler service token: `SERVER-ONLY SECRET`; it must never be exposed in the browser and is not needed for the recommended browser map.
- MLIT download/self-host: no runtime provider key; GymMap assumes data operations.

Known monthly GymMap map sessions/tile requests: `UNKNOWN / REQUIRES_MEASUREMENT`. No traffic volume is invented. Provider purchase and SLA tier remain Human/operations gates.

## 7. PoC evidence

The disposable PoC used no production credentials and made no repository runtime/dependency change. Three meaningful architectures were tested: quiet raster, quiet raster + rail overlay, and Leaflet + vector. OpenFreeMap was used only as a credentialless schema/style reference; Stadia local development permits keyless localhost access. All finalist desktop captures use a 1200×720 viewport, identical area fixtures, marker positions, and selected marker. The production/P1-v2 controls are accepted historical product evidence rather than pixel-identical standalone PoC frames.

### Tokyo / Ginza / Yurakucho selected

| Quiet raster | Transport overlay | Leaflet + vector |
| --- | --- | --- |
| [image](map-polish-p1-architecture-evidence/raster-tokyo-selected.png) | [image](map-polish-p1-architecture-evidence/overlay-tokyo-selected.png) | [image](map-polish-p1-architecture-evidence/vector-tokyo-selected.png) |

Observation: raster gives the strongest marker separation but loses useful station/rail priority. Overlay makes rail unmistakable but can over-emphasize trunk geometry and does not solve station-label authority by itself. Vector delivers the best controllable balance: rail is stronger than roads, water/green/place context remains, and markers stay primary.

### Dense Shinjuku

| Transport overlay | Leaflet + vector |
| --- | --- |
| [image](map-polish-p1-architecture-evidence/overlay-shinjuku-selected.png) | [image](map-polish-p1-architecture-evidence/vector-shinjuku-selected.png) |

Observation: both reveal the north/south rail corridor and cluster sides. Vector retains more coherent district/park context with one collision system. The reference dataset/style shows major-station labels but incomplete/local station label prominence; production style QA must explicitly validate Yurakucho, Ginza, Shinjuku sub-stations and subway entries.

### Regional HYROX / Takasaki selected

| Transport overlay | Leaflet + vector |
| --- | --- |
| [image](map-polish-p1-architecture-evidence/overlay-takasaki-selected.png) | [image](map-polish-p1-architecture-evidence/vector-takasaki-selected.png) |

Observation: both retain regional orientation. Vector keeps water, green, road hierarchy and rail legible without a second independent cartography.

### Nationwide Lesson view

| Transport overlay | Leaflet + vector |
| --- | --- |
| [image](map-polish-p1-architecture-evidence/overlay-japan-selected.png) | [image](map-polish-p1-architecture-evidence/vector-japan-selected.png) |

Observation: both preserve nationwide coverage and marker priority. Marker density remains a separate P2 concern; no clustering was implemented.

### 390px selected

| Transport overlay | Leaflet + vector |
| --- | --- |
| [image](map-polish-p1-architecture-evidence/overlay-tokyo-390-selected.png) | [image](map-polish-p1-architecture-evidence/vector-tokyo-390-selected.png) |

The selected marker remains primary at 390px. This standalone frame validates basemap/marker separation only; production panel/MapChrome geometry remains governed by existing M1 evidence and must be rechecked in a future integration phase.

Tokyo usability result for Option C:

- nearest major station: quickly identifiable;
- side of the station: rail corridor and district context make it materially clearer than raster;
- multiple gyms around the station: marker cluster is visually separable from the basemap;
- rail corridor: immediately traceable;
- local/subway station names: not yet sufficient in the credentialless reference style and a required production-style acceptance item.

## 8. Visual scores

Scores are 1 (poor) to 5 (strong). Option D values are architectural capability estimates, not PoC results.

| Option | Railway line | Station symbol | Station name | Road suppression | Marker separation | Geographic orientation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 P1-v2 raster control | 3 | 2 | 3 | 4 | 4 | 3 |
| A quiet raster PoC | 1 | 1 | 2 | 5 | 5 | 3 |
| B quiet + transport overlay PoC | 5 | 2 | 2 | 5 | 4 | 4 |
| C Leaflet + vector PoC | 5 | 3 | 3 | 5 | 5 | 5 |
| D full MapLibre capability | 5 | 5 | 5 | 5 | 4 | 5 |

Critical tradeoff: Option C wins even though the reference PoC only scores 3 for station symbols/names. Unlike raster, it provides the layer and collision controls needed to improve those scores with a production provider/style. Option B has similar raw control but splits basemap and transport ownership and did not prove a clean station-label source.

## 9. M1 compatibility

| Contract | Option C disposition |
| --- | --- |
| Marker presentation/selected state | Keep current Leaflet `CircleMarker` and M1 presentation resolver unchanged; render above passive vector canvas. |
| Keyboard/focus | Keep current SVG marker element, stable focus class, Enter/Space handler, `aria-label`, and `aria-pressed`. Do not convert markers to MapLibre symbols in P1. |
| MapChrome/current location | Keep React `MapChrome` and Leaflet current-position `CircleMarker`; basemap renderer does not own them. |
| Panel/sheet | Keep current responsive `MapSelectionSurface`; no basemap ownership. |
| Pan/fly/fitBounds | Leaflet remains the camera authority; binding synchronizes the passive GL layer. |
| URL/history | Keep `map-runtime-state.ts` and domain handlers unchanged. |
| SSR/client boundary | Existing shared map is already a client-only dynamic import. Import the GL renderer only inside that client boundary. |
| Event handling | Configure the GL layer non-interactive so Leaflet marker/map events remain canonical; validate background-click clearing and touch gestures. |

M1 can remain substantially intact. Production acceptance must prove it with existing map conformance/presentation tests plus browser keyboard and reduced-motion checks.

## 10. HYROX compatibility

Lesson and HYROX already share `LeafletGymMap`. Option C changes one internal basemap layer and does not require separate domain implementations. It must not change:

- the 82-facility HYROX loader or official-only checks;
- prefecture filtering or selected/outside-current-results semantics;
- positive/unknown equipment semantics or omission behavior;
- selected panel content, official-site link, or GymMap detail continuation;
- Lesson query/filter/list/URL behavior.

The regional Takasaki PoC shows that the same style remains useful outside dense Tokyo. This is visual feasibility, not H3 runtime mutation.

## 11. Performance

| Option | Expected impact |
| --- | --- |
| 0 current/P1-v2 | Existing raster request pattern; CSS filter only. Lowest JS/GPU cost. |
| A quiet raster | Similar Leaflet JS and raster request pattern; Retina may increase bytes. Lowest migration/performance risk. |
| B overlay | Raster requests plus vector style, glyph/sprite/tile requests and a GL canvas. Highest request/source duplication among Leaflet-preserving options. |
| C Leaflet vector | Removes raster tile images but adds MapLibre GL, style, glyph/sprite/vector tile requests and WebGL2/GPU work. More JS and startup complexity, but one cartography/source pipeline. |
| D full MapLibre | Similar GL basemap cost to C; may remove Leaflet eventually, but marker/interaction migration expands runtime risk. |

Indicative CDN compressed downloads observed during this review, not production bundle measurements: Leaflet JS about 42.5 KB, MapLibre GL `@5` distribution about 275 KB, and the Leaflet binding about 2.7 KB. Actual Next.js chunking, current MapLibre v6 choice, style/glyph/sprite/tile payload, cache hit rate, and low-end mobile GPU behavior require measurement. The official MapLibre docs state that GL JS uses WebGL to render vector tiles and provide an explicit WebGL support check. Sources: [MapLibre introduction](https://maplibre.org/maplibre-gl-js/docs/), [WebGL support example](https://maplibre.org/maplibre-gl-js/docs/examples/check-if-webgl-is-supported/).

PoC observations: all four areas and 390px rendered without console warnings/errors; pan/zoom was visually responsive on the review machine. These are feasibility observations, not a performance budget. A future implementation must record initial render, transferred bytes/request counts, WebGL failure rate, low-end Android/iPhone behavior, memory, and pan/zoom smoothness, and must define a raster fallback for unavailable WebGL.

## 12. Licensing and operations

- Renderer: MapLibre GL JS is open source; Leaflet binding is ISC. Pin exact versions and audit license notices.
- Map data/style/provider are independent from renderer choice. A renderer recommendation does not authorize OpenFreeMap production use or a MapTiler purchase.
- Preferred production authority path: paid MapTiler Cloud plan, origin-restricted public browser key, GymMap-owned style, visible MapTiler/OSM attribution, analytics/spend alerting, and no unauthorized proxy/cache.
- Commercial production on MapTiler Free or Stadia Free is not permitted by their current pricing/terms.
- Traffic scale, paid tier, data residency need, SLA target, and procurement owner are `REQUIRES_MEASUREMENT / HUMAN_DECISION`.
- OpenFreeMap remains a disposable PoC and fallback-development reference only because its public service has no SLA and is `as-is`.
- MLIT N02 is viable data authority but would create a new ingestion/tiling operations product; it is not justified for P1 unless commercial vector providers fail station completeness review.
- Attribution must remain visible and unobscured by MapChrome/panels at desktop and mobile sizes.

## 13. Decision matrix

Ratings: `GOOD`, `ACCEPTABLE`, `WEAK`, `HIGH_RISK`. Parenthetical text is the concise evidence.

| Criterion | 0 P1-v2 | A quiet raster | B overlay | C Leaflet vector | D full MapLibre |
| --- | --- | --- | --- | --- | --- |
| Road suppression quality | ACCEPTABLE (global filter) | GOOD (quiet style) | GOOD (quiet background) | GOOD (layer control) | GOOD (layer control) |
| Rail emphasis | WEAK (not independent) | WEAK (style-fixed) | GOOD (separate layer) | GOOD (single style) | GOOD |
| Station emphasis | WEAK | WEAK | ACCEPTABLE (source/collision burden) | GOOD capability; ACCEPTABLE PoC | GOOD capability |
| Japanese labels | GOOD existing OSM raster | ACCEPTABLE | GOOD with MLIT; source-dependent otherwise | GOOD with MapTiler local/JA style | GOOD with MapTiler local/JA style |
| Nationwide Japan | GOOD | GOOD | GOOD if OSM/MLIT | GOOD | GOOD |
| Lesson compatibility | GOOD | GOOD | ACCEPTABLE | GOOD | ACCEPTABLE |
| HYROX compatibility | GOOD | GOOD | ACCEPTABLE | GOOD | ACCEPTABLE |
| M1 preservation | GOOD | GOOD | GOOD markers, more layer coupling | GOOD | HIGH_RISK |
| Leaflet preservation | GOOD | GOOD | GOOD | GOOD | HIGH_RISK |
| Accessibility migration cost | GOOD | GOOD | ACCEPTABLE | ACCEPTABLE | HIGH_RISK |
| Implementation complexity | GOOD | GOOD | HIGH_RISK | ACCEPTABLE | HIGH_RISK |
| Bundle/performance | GOOD | GOOD | WEAK (two sources + GL) | ACCEPTABLE (GL/WebGL budget) | ACCEPTABLE (GL, larger migration) |
| Provider/license safety | HIGH_RISK (best-effort OSMF endpoint) | ACCEPTABLE paid Stadia | ACCEPTABLE only after source lock | GOOD paid MapTiler path | GOOD paid MapTiler path |
| Ongoing operations | WEAK provider continuity | ACCEPTABLE | HIGH_RISK (dual source/updates) | ACCEPTABLE (provider/style monitoring) | ACCEPTABLE |
| Cost | GOOD monetary / WEAK SLA | ACCEPTABLE (from $20/mo) | WEAK (dual pipeline) | ACCEPTABLE (from $30/mo; traffic unknown) | ACCEPTABLE plus migration cost |
| Long-term styling control | WEAK | WEAK | GOOD transport only | GOOD whole basemap | GOOD whole basemap |

## 14. Recommended architecture

Select **Option C: Leaflet outer map + passive vector basemap**.

Proposed boundary for a future implementation:

```text
Lesson / HYROX domain state
        ↓ existing props
LeafletGymMap (camera + events + bounds)
        ├── Leaflet M1 markers/current location (interactive, accessible)
        ├── MapLibre GL vector basemap binding (non-interactive)
        └── existing React MapChrome + selection surfaces
                 ↓
paid vector provider + GymMap-owned style + visible attribution
```

Style acceptance target:

- near-white/warm land, pale blue water, pale desaturated green;
- minor/major roads light neutral with shields and technical labels strongly reduced;
- rail neutral medium/dark gray and stronger than roads;
- station symbol/name readable below GymMap markers;
- Japanese/local labels primary; major place labels retained;
- minor POI omitted where safe;
- no basemap feature may exceed selected marker salience.

Production provider/style is not selected by this architecture commit. MapTiler Cloud is the verified leading candidate because it supplies paid commercial authority, origin-restricted browser keys, Japan/global vector schema, custom style control, Japanese/local labels, and an SLA path. Human review must approve visual completeness and operations before any account, key, dependency, or runtime change.

## 15. Why other options lost

- Option 0: proven raster pixel limit; further CSS tuning cannot promote station/rail independently.
- Option A: simplest and quietest, but the PoC suppresses the very rail/station orientation needed by the product.
- Option B: can emphasize rail, but duplicates basemap/transport sources, collision systems, requests, attribution, and freshness ownership. The bounded source-filter correction demonstrates schema coupling. MLIT would add a data pipeline beyond P1 scope.
- Option D: no material basemap advantage over Option C, while reopening M1 interaction/accessibility and both domain integrations.
- OpenFreeMap as production provider: useful PoC and open stack, but explicit no-SLA/as-is authority is weaker than GymMap needs.

## 16. Implementation phases — planning only

No phase is authorized by this document.

1. **P1-M0 — behavior equivalence contract:** freeze current M0/M1/H3 runtime tests, provider failure behavior, event ordering, attribution, and WebGL fallback requirements.
2. **P1-M1 — renderer/provider/style PoC:** pin exact MapLibre/binding versions; obtain a non-production, origin-restricted provider key through approved operations; build the GymMap style; define bundle/mobile budgets.
3. **P1-M2 — Lesson reference integration:** behind a reversible feature flag; verify 433-marker selected/default, URL, focus, MapChrome, current location, filters and nationwide view.
4. **P1-M3 — HYROX compatibility:** reuse exactly the same basemap component; verify 82 facilities, prefecture filters, selected surfaces, positive/unknown semantics and details.
5. **P1-M4 — Human Visual/accessibility/performance review:** Tokyo/Ginza, Shinjuku, Takasaki, nationwide, 390/430/desktop, keyboard, reduced motion, WebGL unavailable, low-end mobile.
6. **P1-M5 — staged production rollout:** explicit Human approval, traffic/spend alerts, staged percentage, error/latency observation, rollback drill.

## 17. Rollback strategy

Keep the current Leaflet raster layer as a separately selectable implementation until the vector candidate passes production verification. The future change should be a basemap-layer feature flag, not a big-bang map rewrite. On WebGL/provider/style failure, switch the layer back without changing M1 markers or domain state. Do not silently use the current noncompliant `{s}` OSM URL as a permanent fallback; any production fallback must use an authorized, policy-compliant endpoint and visible attribution.

## 18. P2 relationship

`P2 MARKER DENSITY: NOT STARTED`.

All options remain compatible with Leaflet clustering/spiderfy or an accessible member chooser because markers remain Leaflet objects under Option C. Vector basemap improves low-zoom background clarity but does not resolve nationwide 433-marker overlap. P2 must preserve M0 selection/focus and must not be bundled into basemap migration.

## 19. MapChrome follow-up

The current-location instruction surface remains `MAP_CHROME_POLISH_FOLLOWUP`. Option C keeps MapChrome outside the GL canvas and does not enlarge or redesign it. No MapChrome code or visual change belongs to P1-ARCH.

## 20. Documentation

- Architecture candidate: `docs/map-polish-p1-basemap-architecture-v1.md`
- Evidence: `docs/map-polish-p1-architecture-evidence/`
- Branch: `codex/map-polish-p1-basemap-architecture`
- Commit: recorded at delivery after validation
- Main merge: `NO`
- P1-v2 merge/deploy: `NO`

Disposable PoC runtime exists only under `/private/tmp/gymmap-p1-arch-poc` and is not part of the repository diff.

## 21. Mutation audit

| Scope | Mutation |
| --- | --- |
| Runtime/source | NO |
| CSS | NO |
| Tile/vector provider | NO |
| Dependencies/lockfiles | NO |
| M0/M1 | NO |
| H3/HYROX | NO |
| Lesson data/query/URL | NO |
| DB/schema/migrations | NO |
| Production/deploy | NO |
| Main merge | NO |
| Documentation/evidence | YES — this candidate only |

Required final checks: latest-main reconciliation, external link responses, authority/path reconciliation, no runtime/dependency/DB diff, disposable PoC absent, and `git diff --check`.

## 22. Next gate

`HUMAN ARCHITECTURE REVIEW`.

The reviewer should decide whether to authorize P1-M0/M1 planning and provider evaluation, with particular attention to:

1. station-name completeness at Ginza/Yurakucho/Shinjuku subway and regional stations;
2. railway weight versus selected/default markers;
3. MapTiler paid-plan/SLA/data-residency/attribution acceptance after traffic measurement;
4. WebGL fallback and low-end mobile budget;
5. 0.x Leaflet binding pin/audit risk.

Stop after review delivery. Do not implement the migration, merge P1-v2, start P2, redesign MapChrome, merge to `main`, or deploy.
