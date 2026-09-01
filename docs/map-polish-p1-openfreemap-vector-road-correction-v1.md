# GymMap Map Polish P1-M1 — OpenFreeMap Vector Road Correction v1

## 1 FINAL VERDICT

**PASS — human visual correction candidate accepted for delivery.** The road system now reads as supporting cartography rather than an orange foreground network. Selected marker, markers, rail/station, and major place labels retain priority. This is a correction candidate only: P1 is not declared complete and P2 has not started.

## 2 BASELINE

- Accepted candidate: `b3531cb3a261c82498cc445e14946e0ae39e1a9a`.
- Branch at correction start: `codex/map-polish-p1-openfreemap-vector-implementation`; local and remote candidate heads matched.
- `origin/main`: `dee7e83bb725ae848ff14fcccad6313bab21af95`; merge base matched `origin/main`.
- No competing accepted-candidate update or overlapping P1 implementation branch was found after fetch/reconciliation.

## 3 HUMAN REVIEW ISSUE

Matched BEFORE review reproduced the reported issue: the previous `#ded6c8`/`0.70` major roads, `#ebe7df`/`0.62` minor roads, and `0.38` casings formed a continuous warm beige/orange network. It was most visible around Tokyo arterials and at 390 px, where the basemap competed with the selected location marker.

## 4 STYLE LAYER INVENTORY

- Owned style source: `openmaptiles`; road geometry: `transportation`; road names: `transportation_name`.
- Correction touched 46 tunnel/road/bridge line layers and three `highway-name-*` symbol layers.
- Every `line-width`, min/max zoom, filter, dash array, source, source-layer, and layer order is unchanged.
- Highway shields, one-way arrows, and `road_area_pattern` remain absent. No separate owned IC/junction symbol layer exists to correct.
- Rail line layers, `poi_transit`, place labels, water, landcover, buildings, and attribution are unchanged.

## 5 CORRECTION

One palette was implemented; no second palette was left behind.

| Road role | Before | Final |
| --- | --- | --- |
| casing | `#d8d2c8 / 0.38` | `#d9d7d2 / 0.20` |
| motorway / motorway link | `#ded6c8 / 0.70` | `#ddd9d2 / 0.52` |
| trunk / primary | `#ded6c8 / 0.70` | `#e3e0da / 0.46` |
| secondary / tertiary / minor / service / path | `#ebe7df / 0.62` | `#edeae5 / 0.42` |
| major road name | `#77736d / implicit 1` | `#898680 / 0.68` |
| minor/path road name | `#77736d / implicit 1` | `#898680 / 0.54` |

The generator owns the palette, the generated style SHA-256 is `9128cbf4ee5ca74b626cf3669c104b4a41a0451c6269c512c28f7a2fb31d2577`, and the asset README records that hash.

## 6 ROAD REVIEW (Tokyo/Shinjuku/Regional/390/430)

- Tokyo/Ginza/Yurakucho, 1440×900: wide arterials remain traceable but no longer create a warm foreground mesh.
- Shinjuku, 1440×900: dense roads recede; place and station context remains readable.
- Regional HYROX example, CrossFit Kofu at z11, 1440×900: broad regional roads are subdued without disappearing.
- Lesson 390×844 and 430×932: selected GymMap marker is the first map object perceived; roads remain usable as context.
- HYROX 390×844 at z11: selected HYROX marker retains priority over the Kofu road network.
- Each BEFORE/AFTER pair uses the same fixture, selected location, viewport, zoom actions, marker set, and absent overlay-panel state.

## 7 RAIL / STATION REVIEW

Rail colors and opacity remain exactly `#8d969c`/`0.88` and hatching `#707980`/`0.88` (tunnel rail opacity `0.50`). `poi_transit` filter, Japanese-first text expression, placement, type, and styling are byte-equivalent to the baseline style layer. Visual review confirms rail and station context remain above roads.

## 8 M1 MARKERS

Marker source and presentation files have zero diff from the accepted candidate. Browser inspection on the HYROX 390 surface found two markers, exactly one selected; each retained `role="button"`, `tabindex="0"`, an accessible label, and `aria-pressed`. Enter and Space preserved selection semantics. No marker color, silhouette, halo, size, ordering, or behavior changed.

## 9 LESSON MAP PRESERVATION

`location-map-section.tsx` and the shared Leaflet/MapLibre bridge have zero diff. Lesson query/filter ownership, selection URL state, panel lifecycle, current-location lifecycle, and fallback behavior are unchanged. Matched 390/430 visual fixtures use the same M1 marker implementation and selected state.

## 10 HYROX MAP PRESERVATION

`hyrox-discovery.tsx` and HYROX domain data/presentation files have zero diff. The regional fixture uses the publicly listed HYROX Training Club CrossFit Kofu coordinates (`35.619074, 138.56081`); CrossFit Matsumoto is the second unchanged marker fixture. HYROX filtering, selection, list/detail ownership, and equipment semantics are unchanged.

## 11 PERFORMANCE

Only the fetched JSON style changed. Package files, JavaScript, CSS, workers, renderer, and lazy boundaries are unchanged, so dynamic JS/CSS delta is exactly zero from M1: two lazy JS chunks remain `1,088,387` raw / `288,365` gzip, and one lazy CSS chunk remains `82,869` raw / `10,533` gzip. The owned style is `39,272` raw / `3,771` gzip (19 gzip bytes smaller than baseline). Browser vector-ready observations were 656, 294, 138, 270, and 93 ms; no console errors were recorded.

## 12 FALLBACK / LAZY LOAD

`map-basemap.ts`, `openfreemap-vector-basemap.tsx`, `leaflet-gym-map.tsx`, worker files, and consumer lazy imports have zero diff. The full contract suite reconfirmed vector default, raster rollback on fatal state, provider threshold, load timeout, worker pair, and map-only lazy seam. Existing accepted provider-outage and WebGL-context-loss evidence therefore remains valid; this correction adds no fallback code path.

## 13 ACCESSIBILITY

The MapLibre canvas remains `tabindex="-1"`; Leaflet markers remain keyboard-owned controls. Browser checks confirmed marker role, focusability, accessible names, pressed state, and Enter/Space behavior. The correction uses lightness/chroma reduction only for background cartography and does not encode a new state by color.

## 14 VALIDATION

- `npm run test`: 165 passed, 0 failed.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `gl-style-validate public/map/gymmap-openfreemap-liberty-v1.json`: pass.
- Direct `next build`: compiled, typechecked, and generated 146 routes.
- Standard `npm run build`: prebuild remains blocked before Next by absent Supabase environment variables; this is the same environment-only limitation recorded for M1.
- `git diff --check`: pass.
- Focused style contract asserts the final road hierarchy, unchanged rail priority, and absent shields/one-way arrows.

## 15 HUMAN VISUAL MATERIAL

Twelve screenshots form six matched pairs in `docs/map-polish-p1/openfreemap-vector-road-correction-evidence/`:

- `before/after-tokyo-ginza-desktop-selected.jpg`
- `before/after-shinjuku-desktop-selected.jpg`
- `before/after-hyrox-kofu-desktop-selected-z11.jpg`
- `before/after-lesson-390-tokyo-selected.jpg`
- `before/after-lesson-430-tokyo-selected.jpg`
- `before/after-hyrox-390-kofu-selected-z11.jpg`

Desktop pairs are 1440×900; 390 pairs are 390×844; the 430 pair is 430×932. `measurement-v1.json` records palette, layer, runtime, interaction, and validation results.

## 16 P2 STATUS

P2 is **NOT STARTED**. No new control, search, data, icon, overlay, clustering, or interaction work was introduced. P1 is not marked complete by this correction.

## 17 MAPCHROME

Shared map presentation/MapChrome source and CSS have zero diff. Zoom controls, attribution, caption, overlay message, selection panel composition, responsive sheet behavior, and current-location treatment are unchanged.

## 18 MUTATION AUDIT

Product mutations are limited to the style generator, regenerated owned style, style hash documentation, and one focused style contract test. Evidence and this report are documentation-only. Package/dependency files, renderer, Leaflet bridge, workers, lazy seams, fallback, markers, Lesson consumer, HYROX consumer, rail/station layers, place labels, and MapChrome have zero diff. The temporary visual-review route was removed before validation and is not part of delivery.

## 19 DELIVERY

- Branch: `codex/map-polish-p1-openfreemap-vector-implementation`.
- Parent candidate: `b3531cb3a261c82498cc445e14946e0ae39e1a9a`.
- Commit subject: `style(map): de-emphasize vector road hierarchy`.
- Delivery SHA is the containing commit shown by `git log -1`/the final handoff; a commit cannot embed its own hash.
- Push target: the same remote branch. No merge to `main`, deployment, or P2 work is authorized or performed.

## 20 NEXT GATE

Human review should inspect the six matched pairs and either accept this road correction as the continuing P1-M1 candidate or request one specifically bounded cartographic adjustment. Do not declare P1 complete, start P2, merge `main`, or deploy from this handoff.
