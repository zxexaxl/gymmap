# GymMap Map Polish P2-R1 — Marker simplification decision

Date: 2026-09-01

Authority baseline: `origin/main` at `386f5405e4c56f123e9872f18e150ff4bcf59ee0`

Rejected reference only: numbered-cluster candidate `778d00fa7ddd56f9e3e0fcfc5e67de060cf6c2c6`

## Problem

Human Product Review rejected classic numbered clusters. Although the rejected candidate reduced DOM controls, count bubbles made GymMap read as a numeric distribution diagram. P2-R1 must retain every valid facility at its real coordinate and communicate density through the point field itself.

## Desired model

Use a Lesson-only progressive facility-presence layer:

| Zoom | Representation | Visible diameter | Interaction |
| ---: | --- | ---: | --- |
| 8 and below | quiet micro-dot | 4 px | presentation-only |
| 9–10 | small micro-dot | 6 px | presentation-only |
| 11 | transition micro-dot | 8 px | presentation-only |
| 12 and above | accepted M1 marker | unchanged | accepted M1 interaction |

The selected facility is excluded from the presence layer and rendered as the existing selected M1 marker at every zoom.

## Bounded visual study

At most three real-coordinate variants will be compared under matched P1 conditions:

- A — muted coral, 4/6/8 px, medium opacity.
- B — warmer neutral, 4/6/8 px, restrained opacity and a very light outline.
- C — muted coral, 4/6/8 px, lower opacity and no material outline.

Matched Kanto and Tokyo evidence selected candidate C. Candidate A recreated too much coral mass in central Tokyo, while candidate B's repeated outlines became stronger than nearby rail/station detail. Candidate C keeps real-point distribution legible with no material outline and lets the selected M1 marker remain immediate. The selected values are 0.34/0.42/0.50 fill opacity at 4/6/8 px.

## Interaction model

Model A is selected:

- Low/mid-zoom micro-dots communicate spatial distribution and do not become hundreds of tiny click targets.
- Existing Lesson list controls remain the precise accessible discovery surface.
- At local zoom, all facilities regain the exact accepted M1 marker interaction.
- A selected facility remains the exact interactive selected M1 marker at every zoom.

## M0 compatibility

PASS.

M0 separately names the domain marker set, canonical selection, and viewport-derived presentation, while M1 owns density threshold and visual presentation. The micro-dot layer does not remove an entity from the Lesson marker set, change its coordinate, create selection, or substitute the query/list cohort. It is a non-entity, non-interactive spatial-presence presentation below the local M1 threshold. Canonical selection remains zero-or-one and is always represented by the accepted M1 control. At zoom 12 and above, every entity is again an operable M1 marker.

This model intentionally avoids overlapping 44 px invisible hit areas. If Human Review requires direct low-zoom facility activation, that is a separate interaction tradeoff decision rather than an implicit M0 rewrite.

## Accessibility model

- Non-selected low/mid micro-dots: `aria-hidden`, non-focusable, pointer-inert.
- Selected low/mid facility: existing M1 button semantics, accessible label, `aria-pressed`, Enter, Space, and focus ring.
- Local facilities: exact existing M1 keyboard and pointer behavior.
- Page/list controls remain available at every zoom.

## Selected facility model

The existing selected M1 marker is used at every zoom, emitted above the micro-dot layer. URL identity, panel/sheet, list state, detail continuation, focus semantics, and clear/Escape behavior remain owned by the existing M0 runtime.

## Dependency and rendering

No new dependency. Leaflet remains the outer interaction/camera authority and MapLibre remains the passive P1 basemap. The simplified layer uses Leaflet `CircleMarker` paths at exact facility coordinates; no MapLibre symbol migration, grid snapping, centroid, heatmap, random thinning, jitter, spiderfy, or member chooser is introduced.

## Mutation plan

Intended product files:

- `src/components/map/map-types.ts` — optional presentation mode, defaulting to existing individual M1 behavior.
- `src/components/map/location-map-section.tsx` — Lesson-only opt-in.
- `src/components/map/leaflet-gym-map.tsx` — zoom reporting, lazy Lesson-layer boundary, and selected-M1 layering.
- `src/components/map/lesson-facility-micro-dot-layer.tsx` — Lesson-only non-interactive micro-dot rendering.
- `src/components/map/map-presentation.module.css` — pointer-inert micro-dot class only.
- `src/lib/map-marker-simplification.ts` — pure zoom/presentation contract.
- `src/lib/__tests__/map-marker-simplification.test.ts` — preservation and rejection guards.
- P2-R1 docs/evidence only.

Protected with no semantic mutation: P1 basemap/style/provider/lazy/fallback, M1 presentation helper, MapChrome, Lesson data/query/list, Apple provider implementation, HYROX consumer/domain behavior, detail routes, Public Updates, database, and migrations.
