# GymMap Map Polish P1 — Basemap Readability

## Candidate verdict

`GYMMAP_MAP_POLISH_P1_IMPLEMENTATION_CANDIDATE_READY`

The shared Leaflet/OpenStreetMap basemap is materially quieter while GymMap markers, selected state, focus presentation, MapChrome, Lesson behavior, and HYROX semantics remain unchanged. Human visual review is still required; this is not P1 completion.

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

## Options evaluated

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
- Apply low saturation, reduced contrast, and modest brightness to that layer only.
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

- Focused Map/HYROX tests: 32 passed
- Full authoritative tests: 164 passed
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
