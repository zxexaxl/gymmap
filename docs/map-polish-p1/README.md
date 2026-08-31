# GymMap Map Polish P1 — Basemap Readability

## Candidate verdict

`GYMMAP_MAP_POLISH_P1_V2_CANDIDATE_READY`

The shared Leaflet/OpenStreetMap basemap is now brighter and substantially lower-chroma. Road color competition is reduced without weakening the dark railway/station orientation layer as the earlier low-contrast P1 treatment did. GymMap markers, selected state, focus presentation, MapChrome, Lesson behavior, and HYROX semantics remain unchanged. Human visual review is still required; this is not P1 completion.

## P1 v2 Human Visual Review correction

The first P1 candidate used `saturate(0.32) contrast(0.82) brightness(1.08)`. Human review correctly found that this sank all basemap features together: roads remained visually competitive, while railway/station orientation also became weak.

OSM Standard raster tiles are pre-rendered. CSS cannot independently restyle roads, railways, stations, water, green space, labels, or POI. The v2 comparison therefore used the only safe raster-level lever available: progressively lower chroma, a brighter canvas, and restoration of neutral-detail contrast.

All variants were captured at the same 1440-class Lesson viewport, zoom, 433-marker set, filters, selected facility (`Gold's Gym / 銀座東京`), and panel state.

| Variant | Filter direction | Roads / shields | Station and railway orientation | Labels / geography | Marker contrast | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| Current P1 | low chroma, low contrast, modest brightness | colored expressway/arterial strokes still compete | muted with the rest of the raster | acceptable but dark/muddy | improved from pre-P1 | superseded |
| A | moderate chroma reduction, restored contrast, brighter | materially quieter, but burgundy arterial color remains | acceptable | clear | strong | useful but not enough road-color suppression |
| B | strong chroma reduction, near-neutral contrast, brighter | red/orange/yellow competition becomes neutral background | acceptable; dark rail corridors and station text remain useful | district labels, water, and green remain distinguishable | strongest balanced hierarchy | **selected** |
| C | near-monochrome, higher contrast, brightest | color competition is lowest | dark lines remain, but surrounding orientation loses useful differentiation | water/green and secondary geography become washed out | strongest foreground separation | rejected as gray-fog limit |

Selected v2 treatment: `saturate(0.1) contrast(0.98) brightness(1.18)`.

Explicit central-Tokyo review:

- Station names: `acceptable` — 東京 and nearby station context remain readable at the reviewed zoom.
- Railway lines: `acceptable` — the dark Tokyo / 有楽町 rail corridor remains one of the strongest basemap orientation features.
- Major roads: `background` — still present, but their colored emphasis is removed.
- Road shields / IC-style technical labels: `background` — visible when sought, no longer an initial focal point.
- District labels: `clear` — 千代田区, 中央区, 港区 and surrounding place context remain legible.
- Water / green: `acceptable` — still separable in B; materially weakened in rejected C.

This is close to the useful limit of global OSM raster filtering, but the limit has not been reached: B satisfies the GymMap hierarchy without the road-versus-rail failure that would require an architecture decision.

## Baseline and architecture

- Starting and final observed `origin/main`: `dee7e83bb725ae848ff14fcccad6313bab21af95`
- Product/UI Refresh: complete / closed
- M0: frozen; M0-R1: complete
- M1: complete
- H3-10C: complete
- Branch: `codex/map-polish-p1-basemap-readability`
- Runtime: React Leaflet 5 on Leaflet 1.9.4
- Basemap: pre-rendered OpenStreetMap Standard raster PNG tiles
- Attribution: visible `© OpenStreetMap contributors` link retained
- Shared consumers: Lesson Map and HYROX Map both consume `LeafletGymMap`; Apple MapKit remains an optional separate provider and is unchanged

The raster source cannot independently style roads, railway, water, green space, POI, labels, or road shields. Before P1 it had no tile filter or opacity treatment; the map loading canvas used a stronger beige background.

## Architecture options evaluated

### A — current raster plus CSS treatment (chosen)

- Quality: materially reduces red/orange/pink road competition while retaining geographic structure and labels.
- Risk: small, basemap-only change; no marker or runtime behavior changes.
- Licensing/provider: keeps the existing OSM data/provider and visible attribution.
- Performance: one CSS filter on the single Leaflet raster layer; request count and dependency graph are unchanged.

### B — quiet pre-styled raster provider (rejected)

- Quality: potentially stronger layer hierarchy, but introduces a new external authority.
- Provider evaluation: CARTO's current free basemap terms require a CARTO-issued API key, CARTO and OSM attribution, acceptance of provider terms, and impose a 5,000,000 tile-request monthly fair-use limit; free access may be rate-limited, suspended, or terminated.
- Decision: unnecessary account/key, privacy, availability, and provider dependency for P1. No provider switch was made.

### C — vector / MapLibre migration (evaluation only)

- Quality: best independent control of roads, rail, water, parks, POI, and labels.
- Risk: materially changes runtime architecture, marker integration, focus behavior, and interaction performance.
- Decision: prohibited for P1 and not needed for a material improvement.

## Chosen treatment

- Normalize the existing provider URL to the OSMF-required `https://tile.openstreetmap.org/{z}/{x}/{y}.png` form.
- Add a dedicated `gymmap-basemap-tiles` class to the Leaflet raster layer.
- Apply strong saturation reduction, near-neutral contrast, and higher brightness to that layer only.
- P1 v2 replaces the first candidate's low-contrast treatment with strong chroma suppression, restored neutral-detail contrast, and a brighter raster canvas.
- Use a near-white warm-neutral tile-loading canvas.
- Keep controls, attribution, markers, current location, tooltips, panels, and focus presentation outside the filter.

## Readability assessment

- Roads and road shields: red/pink/orange dominance is substantially reduced.
- Railway and stations: neutralized but remain readable for orientation.
- Water: pale blue-gray and clearly distinguishable.
- Green space: pale, desaturated, and still legible.
- POI and secondary labels: quieter; major district/station context remains usable.
- Markers: default coral markers separate more clearly from the background.
- Selected marker: remains the strongest map focal point.
- Map is lighter but not reduced to featureless gray.

P1 v2 clarification:

- Expressway and arterial color is materially quieter than current P1.
- Railway/station orientation is at least as useful because neutral contrast is restored.
- Default and selected GymMap markers are easier to locate without marker changes.
- Selected marker remains clearly primary on Lesson and HYROX maps.
- The map reads brighter rather than merely darker/muted.
- Current-location chrome remains visually strong: `MAP_CHROME_POLISH_FOLLOWUP`.
- Nationwide 433-marker density remains: `P2_FOLLOWUP_RECOMMENDED`; P2 is not started.

## Preservation audit

- Markers and selected presentation: unchanged
- Stable M1 focus hook and accepted focus ring: unchanged
- Native Leaflet focus rectangle: not introduced
- MapChrome and current-location behavior: unchanged
- Panel/sheet geometry and contents: unchanged
- Lesson data, query, filters, ordering, and URL state: unchanged
- HYROX loader, 82-facility dataset, filters, equipment semantics, selected state, panel, and details: unchanged
- DB/migrations and Product/UI pages: unchanged
- Dependencies: no delta
- Tile requests: no delta in count or endpoint family; deprecated OSM subdomains removed

The current-location instruction surface remains visually prominent. Classify any future redesign as `MAP_CHROME_POLISH_FOLLOWUP`, outside P1.

## Visual evidence

### P1 v2 matched comparison

| Treatment | Evidence |
| --- | --- |
| Original pre-P1 | [original](evidence/lesson-desktop-before-selected.png) |
| Current P1 | [current P1](evidence-v2/lesson-desktop-current-p1-selected.png) |
| Variant A | [variant A](evidence-v2/lesson-desktop-variant-a-selected.png) |
| Variant B / selected P1 v2 | [variant B](evidence-v2/lesson-desktop-variant-b-selected.png) |
| Variant C | [variant C](evidence-v2/lesson-desktop-variant-c-selected.png) |

### P1 v2 final surfaces

| Surface | Evidence |
| --- | --- |
| Lesson desktop default | [image](evidence-v2/lesson-desktop-v2-default.png) |
| Lesson desktop selected | [image](evidence-v2/lesson-desktop-v2-selected.png) |
| Lesson 390 selected | [image](evidence-v2/lesson-390-v2-selected.png) |
| Lesson 430 selected | [image](evidence-v2/lesson-430-v2-selected.png) |
| HYROX desktop selected | [image](evidence-v2/hyrox-desktop-v2-selected.png) |
| HYROX 390 selected | [image](evidence-v2/hyrox-390-v2-selected.png) |

### Lesson desktop

| State | Before | After |
| --- | --- | --- |
| Default | [before default](evidence/lesson-desktop-before-default.png) | [after default](evidence/lesson-desktop-after-default.png) |
| Selected | [before selected](evidence/lesson-desktop-before-selected.png) | [after selected](evidence/lesson-desktop-after-selected.png) |

### Lesson responsive

| Viewport/state | Before | After |
| --- | --- | --- |
| 390 default | [before](evidence/lesson-390-before-default.png) | [after](evidence/lesson-390-after-default.png) |
| 390 selected | [before](evidence/lesson-390-before-selected.png) | [after](evidence/lesson-390-after-selected.png) |
| 430 selected | [before](evidence/lesson-430-before-selected.png) | [after](evidence/lesson-430-after-selected.png) |
| 430 default | — | [after](evidence/lesson-430-after-default.png) |

### HYROX selected

| Viewport | Before | After |
| --- | --- | --- |
| Desktop | [before](evidence/hyrox-desktop-before-selected.png) | [after](evidence/hyrox-desktop-after-selected.png) |
| 390 | [before](evidence/hyrox-390-before-selected.png) | [after](evidence/hyrox-390-after-selected.png) |

## Performance and runtime observation

- A single Leaflet layer receives the CSS filter rather than individual GymMap foreground elements.
- The inspected mobile viewport loaded all six requested raster tiles successfully.
- Zoom interaction completed with the same six-tile visible set and no tile-request error.
- No obvious zoom/pan stutter was observed.
- The development server reports a pre-existing Next.js `unstable_cache` item-over-2MB warning while rendering the Lesson home page; it is unrelated to this P1 diff and the production build succeeds.

## Validation

- Focused Map/HYROX tests: 39 passed
- Full authoritative tests: 165 passed
- TypeScript: passed
- Lint: passed
- Production build: passed (723 static pages generated)
- `git diff --check`: passed
- Responsive browser review: desktop, 390, and 430 passed
- Attribution: visible and readable in inspected responsive states

## Remaining gates

- `MARKER_DENSITY_AFTER_P1`: `P2_FOLLOWUP_RECOMMENDED` — nationwide overlap remains, but P2 has not started.
- P1: `AWAITING_HUMAN_VISUAL_REVIEW`
- Main merge: no
- Production promotion: no
- Analytics: separate future workstream
