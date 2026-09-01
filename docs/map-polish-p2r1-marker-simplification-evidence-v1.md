# GymMap Map Polish P2-R1 — Candidate evidence

Date: 2026-09-01

Baseline: `origin/main` at `386f5405e4c56f123e9872f18e150ff4bcf59ee0`

Rejected candidate retained only as a reference: `778d00fa7ddd56f9e3e0fcfc5e67de060cf6c2c6`

## Candidate contract

The Lesson map represents all 433 facilities with valid coordinates. Below zoom 12, every non-selected facility is a pointer-inert, focus-inert micro-dot at its real coordinate and the selected facility is the existing selected M1 marker. At zoom 12 and above, all 433 facilities use the existing M1 markers. There is no cluster count, heatmap, centroid, grid, jitter, random thinning, or hidden member cohort.

| Zoom | Micro-dots | M1 markers with selection | Visible dot size | Interaction |
| ---: | ---: | ---: | ---: | --- |
| 7 | 432 | 1 | 4 px | dots presentation-only; selected M1 interactive |
| 9 | 432 | 1 | 6 px | dots presentation-only; selected M1 interactive |
| 11 | 432 | 1 | 8 px | dots presentation-only; selected M1 interactive |
| 12+ | 0 | 433 | M1 unchanged | accepted M1 pointer/keyboard model |

Without a selection, the same total is represented as 433 dots below zoom 12 and 433 M1 markers at zoom 12+.

## Visual study and screenshots

Evidence root:

`/Users/te/.codex/visualizations/2026/08/31/01a059e8-575e-7fd0-8eb5-da97eda1746c/p2r1-marker-simplification`

Study variants:

- `study-a-kanto-z9.png` — stronger muted coral; rejected because central density became too dominant.
- `study-b-kanto-z9.png` — warmer neutral with an outline; rejected because repeated outlines competed with rail/station detail.
- `study-c-kanto-z9.png` — selected: muted coral, restrained opacity, no material outline.

Candidate evidence:

- `study-c-east-japan-z7.png`
- `study-c-tokyo-z11-transition.png`
- `study-local-z12-m1.png`
- `candidate-390-z9-selected-vector.png`
- `candidate-430-z11-selected-vector.png`
- `final-kanto-z9-selected.png`

Comparison references retained from the preceding review:

- `p2-kanto-z9-before.png` — accepted P1 individual-marker baseline.
- `p2-kanto-z9-after.png` — rejected numbered-cluster candidate.

Human visual review observation: candidate C keeps the real distribution visible without count bubbles, preserves rail/station reading, and leaves the selected M1 marker immediate. The 390 px and 430 px sheets, map chrome, attribution, and list remain within their existing composition.

## Browser verification

Lesson, OpenFreeMap vector mode:

- z7: 432 micro-dots, one selected M1, zero cluster elements.
- z9: 432 micro-dots, one selected M1, zero cluster elements.
- z11: 432 micro-dots, one selected M1, zero cluster elements.
- z12: zero micro-dots, 433 M1 markers, one selected marker.
- Selected deep link remains `?selected=golds-gym-13200`; selected panel and detail continuation remain present.
- Enter and Space preserve the canonical selected URL and `aria-pressed=true`.
- Low/mid dots: all `aria-hidden=true`, zero dot tab stops.
- Local z12: 433 M1 tab stops and the existing focus-visible silhouette.
- JEXER filter continuity: summary remains `近い10店舗 / 24件中`; map authority remains 433 represented facilities and the existing selected URL is preserved.

Protected routes:

- HYROX: 82 existing M1 markers, zero micro-dots, zero clusters, `individual` presentation mode.
- Public Updates: zero Leaflet roots, canvases, micro-dots, and clusters.

## Performance

Pure presentation-contract benchmark, 10,000 evaluations over 433 records:

| Zoom | Mean compute time |
| ---: | ---: |
| 7 | 0.0070 ms |
| 9 | 0.0046 ms |
| 11 | 0.0027 ms |
| 12 | 0.0023 ms |

Browser pan, zoom through the 11→12 transition, resize to 390/430, and route remount showed no visible blocking or interaction jank. The Lesson micro-dot component is loaded behind a Lesson-only lazy boundary, so HYROX and non-map routes do not acquire it. This is an approximate implementation review, not a Core Web Vitals claim.

## Validation

- `npm run typecheck` — pass.
- `npm run lint` — pass.
- focused map/HYROX tests — 16/16 pass after lazy split.
- `npm test` — 174/174 pass.
- direct `next build` — pass, 146 static pages generated; expected missing-local-Supabase diagnostics only.
- `git diff --check` — pass.
- dependency manifest and lockfile — unchanged.

## Mutation audit

- P1 basemap/style/provider/fallback: no mutation.
- Existing M1 presentation helper and visual states: no mutation.
- MapChrome: no mutation.
- Lesson data, query, filter, ordering, list, URL selection authority: no mutation.
- HYROX implementation and behavior: no mutation.
- database/migrations: no mutation.
- production: no mutation.

Final delivery SHA and automatic Vercel Preview result are recorded after the candidate is committed and pushed. P2-R1 remains awaiting Human visual/UX/accessibility review.
