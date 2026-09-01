# GymMap Map Polish P2 — Marker Density candidate evidence

Date: 2026-09-01

Candidate branch: `codex/map-polish-p2-marker-density`

Authority baseline: `origin/main` at `386f5405e4c56f123e9872f18e150ff4bcf59ee0`

## Decision

Use a Lesson-only, deterministic Web Mercator grid/count presentation below zoom 12. Keep the selected facility outside aggregation and render it as the existing M1 individual marker. At zoom 12 and above, render the exact individual M1 marker set.

This is a bounded presentation change. It adds no package, changes no facility record or query, does not alter the P1 OpenFreeMap vector basemap, and leaves HYROX on the default individual-marker mode.

Options considered:

- Standard cluster package: rejected for this candidate because a new dependency and its accessibility/bundle contract were unnecessary.
- Deterministic grid/count aggregation: selected as the core mechanism.
- Zoom-threshold hybrid: selected with grid/count aggregation so local discovery returns to exact M1 markers.
- Random thinning or hiding: rejected because it would make facility representation incomplete and unstable.
- Changing the initial viewport: rejected because it would avoid rather than solve low-zoom overplotting.

## Presentation and interaction contract

- Individual threshold: zoom 12.
- Grid sizes: 64 CSS px at zoom 7 and below, 56 px at zoom 8–9, and 48 px at zoom 10–11.
- Cluster visual: fixed 44 px neutral light surface, navy border/text, numeric count only. Size does not encode count.
- Layering: clusters use a dedicated pane below the existing M1/current-location overlay; the selected facility is emitted last.
- Cluster activation: fit to member bounds, with a predictable maximum increase of three zoom levels capped at zoom 12. Same-coordinate members use a centered two-level increase capped at zoom 12.
- Accessible name: `この周辺にN店舗。選択すると拡大します`.
- Keyboard: Enter and Space activate; `:focus-visible` has a separate visible ring.
- Selected continuity: selection, detail panel, `aria-pressed`, URL, and the M1 marker appearance remain intact across the threshold.

## Density measurements

The matched baseline and candidate use the same 433 Lesson facilities and the same selected deep link (`golds-gym-13200`). Counts are DOM marker/cluster controls, not inferred visual estimates.

| Zoom | P1 markers | P1 clusters | Candidate individual markers | Candidate clusters | Largest candidate cluster | Candidate keyboard stops | Assessment |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 13 | 433 | 0 | 433 | 0 | 0 | 433 | Local detail unchanged |
| 11 | 433 | 0 | 137 | 94 | 12 | 231 | Tokyo overlap materially reduced |
| 9 | 433 | 0 | 29 | 34 | 71 | 63 | Kanto distribution and rail context readable |
| 7 | 433 | 0 | 16 | 10 | 308 | East Japan overview no longer covered by 433 controls |

Every candidate row represents all 433 facilities: individual count plus all cluster member counts equals 433. No random hiding or sampling is used.

## Data, filter, and same-coordinate audit

Lesson currently keeps the map dataset at all 433 facilities while filters narrow the companion list. For example, the JEXER filter produces 24 list candidates but the map continues to represent 433 facilities. This candidate preserves that existing list/map authority and URL/query behavior; it does not claim to introduce a new filter-to-map synchronization contract. The pure density helper aggregates exactly the dataset supplied by its caller, and a focused test covers a filtered subset for future callers.

Three exact-coordinate pairs were found after excluding Leaflet's offscreen placeholder path:

- NAS PILATES ON THE GO リバーシティ21 / フィットネス&スパNAS リバーシティ21
- Megalos ゼロプラス 恵比寿 / ルフレ 恵比寿
- NAS PILATES ON THE GO 大崎 / 美温 大崎

This is not material enough to require a member chooser or spiderfy scope expansion in P2. Existing individual-marker/list selection remains the high-zoom fallback.

## Responsive, accessibility, and domain evidence

- Desktop: matched Kanto, Tokyo mid-zoom, and central Tokyo local views captured before/after.
- 390 px: selected sheet, clusters, focus ring, attribution, and horizontal containment visually checked.
- 430 px: selected sheet, clusters, attribution, and horizontal containment visually checked.
- Cluster keyboard path: a focused 308-member control activated with Enter from zoom 7 to 9; a focused 71-member control activated with Space from zoom 9 to 12.
- Individual M1 path: fresh deep link retained one selected marker and one detail panel; Enter/Space retained `aria-pressed=true`; visible M1 focus ring remained and no native Leaflet rectangle appeared.
- HYROX: 82 individual markers, zero density clusters; filtered 群馬 result and selected 前橋インター equipment/details remained intact on desktop and 390 px.
- Non-map route: `/updates` loaded with zero map canvas, Leaflet container, or density cluster, preserving lazy map loading.

## Performance evidence

Synthetic computation over the 433-record input, 1,000 iterations per zoom:

| Input | Average computation |
| --- | ---: |
| zoom 7 | 0.0878 ms |
| zoom 9 | 0.0848 ms |
| zoom 11 | 0.0537 ms |
| zoom 12 | 0.0054 ms |
| filtered 24 records | 0.0044 ms |

In a warm browser session, the candidate map canvas appeared at approximately 706 ms versus approximately 722 ms on the P1 baseline. This is a bounded comparison, not a Core Web Vitals claim. Zoom, cluster activation, filter change, responsive views, and route unmount/remount showed no material interaction regression or duplicate canvas.

## Validation record

- TypeScript typecheck: pass.
- ESLint: pass.
- Full Node test suite: 172/172 pass.
- Focused map/density regression set: 26/26 pass.
- Direct Next.js 16 production build: pass, 146 routes. The repository `prebuild` sitemap task cannot run without Supabase environment variables in the isolated worktree; the direct framework build completed with the same expected missing-environment warnings. The automatic Vercel Preview is the environment-backed deployment build authority.
- `git diff --check`: pass.
- OpenFreeMap style validation: recorded in the final delivery verification.
- Browser console on candidate paths: zero application errors.
- Vector basemap: one MapLibre canvas, no raster tile layer.

## Scope and next gate

No P1 basemap, M0 behavior, M1 marker design, MapChrome, Lesson query/data, HYROX behavior, database, migration, main branch, or production mutation is part of this candidate.

The candidate is ready for Human Visual / UX / Accessibility review. P2 is not complete, MapChrome remains on hold, and analytics remains separate.
