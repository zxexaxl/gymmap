# GymMap Product/UI Refresh — U4 Reconciliation and Closure Review v1

Status: `CLOSURE_BLOCKED`

Audit date: 2026-08-31 (JST)

This document records the read-only U4 repository, exact-main, and production audit. It does not authorize or contain runtime, UI, map, data, analytics, deployment, or production changes. Human Product/UI Closure Review is still required.

## 1. Exact authority and production identity

- Repository authority: `origin/main` at `9ec8a5f811752bb9713f02dea568fa627e95155a`
- Production domain: `https://gymmap.vercel.app`
- Production deployment: Vercel deployment `G6am7iRq1fM3ivEno9tZJhtmrBa2`
- GitHub deployment ID: `6180893858`
- Deployment source SHA: `9ec8a5f811752bb9713f02dea568fa627e95155a`
- Deployment status: success
- Deployment timestamp: 2026-08-31T12:18:48Z
- Production and current `origin/main`: exact match

The following phase history is present in current-main ancestry and/or its authoritative contracts and tests:

- U0A / U0B — Product/UI authority: complete
- U1 — Minimum Shared Design Foundation: complete
- U2-L — Home / Search: production complete
- U3-L — Detail / Program / Favorites: production complete
- U3-U — Public Updates: production complete
- M0 — Shared Map Behavior Contract: frozen
- M0-R1 — Frozen Runtime Conformance: complete
- M1 — Shared Map Presentation: complete
- H3-10A — Positive Evidence UX Contract: complete
- H3-10B — List / Detail UI: production complete
- H3-10C — HYROX Map UI: complete and deployed at current main

The historical progress labels in `product-ui-ownership-v1.json` predate H3-10C. They remain useful for ownership boundaries but are not the current implementation-progress source of truth.

## 2. Production surface inventory

### Lesson Discovery

- Home: `/`
- Search: `/search`
- Facility detail: `/locations/[slug]`
- Program: `/programs/[slug]`
- Area × Program: `/areas/[area]/[program]`
- Favorites: `/favorites`
- Lesson Map: `/#map-section`

### HYROX Discovery

- Landing, filters, list, and map: `/training/hyrox`
- HYROX map selection state: `/training/hyrox?selected=[slug]#hyrox-map-heading`
- Current facility continuation from HYROX: `/locations/[slug]`

### Transparency and global UI

- Public Updates: `/updates`
- Global Header: GymMap, レッスン, HYROX
- Lesson-local menu: Lesson-context routes only, except for the HYROX-detail context issue recorded below
- Utility/footer: includes Public Updates discovery
- Shared Map presentation: marker, selected state, focus treatment, MapChrome, panel/sheet shell, responsive structure

## 3. User journey results

| Flow | Result | Evidence summary |
| --- | --- | --- |
| A — Home → Search → Facility Detail → related discovery | `PASS` | Search-first Home, hydrated Search, readable Detail, and continuation routes were present and healthy. |
| B — Home popular program → Program → Area/facility → timetable/detail | `PASS` | Existing public route architecture and discovery continuation were preserved. |
| C — Search/Program → Favorite → Favorites → Detail/timetable | `PASS` | Existing saved program rendered with accessible state and weekly continuation; no storage contract mutation was made. |
| D — Lesson Map → marker → panel/sheet → Detail | `MINOR_FRICTION` | Shared presentation and keyboard selection passed. The initial all-Japan view is visually dense, so overlapping marker pointer selection can be ambiguous before zoom/filtering. |
| E — HYROX → list/map → facility → Detail/official link | `BLOCKER` | HYROX list/map/panel passed, but the internal facility continuation switches into Lesson-specific detail context and drops HYROX equipment context. |
| F — Footer/utility → Updates → relevant destination | `PASS` | Footer discovery, three semantic update records, safe HYROX wording, canonical route, and sitemap inclusion passed. |

## 4. Reconciliation summary

### Lesson UI

- Home remains search-first with dynamic counts, popular programs, favorites access, Lesson Map access, and HYROX as a secondary entry.
- Search retains primary/advanced hierarchy, direct URL hydration, result hierarchy, favorites, and mobile first-result reachability.
- Facility Detail, Program, Area × Program, and Favorites retain the accepted U3-L hierarchy and responsive presentation.
- No material old-template island was found in the audited Lesson-native journeys.

### Shared Map presentation

- Lesson and HYROX use the same marker presentation, selected state, focus treatment, MapChrome, panel/sheet geometry, close affordance, and responsive structure.
- Keyboard marker selection, `aria-pressed`, focus-visible treatment, accessible selection regions, and panel close controls were present.
- The stable M1 focus hook was present; native Leaflet rectangle markers were absent; the accepted focus ring was visible.
- Shared presentation consistency: `PASS`
- Domain ownership separation inside map surfaces: `PASS`

### HYROX list, detail continuation, and map

- Production displayed 82 official facilities.
- 22 facilities exposed confirmed-positive equipment, totaling 109 positive equipment chips.
- Negative assertions: 0.
- Capability UI: 0.
- Equipment filter: 0.
- Positive-only disclosure explicitly states that missing display does not mean unavailable or unsupported.
- HYROX map filters, marker selection, positive equipment content, mobile partial sheet, desktop panel, internal detail link, and official link operated.
- The internal detail link leads to a Lesson-context facility page. That discontinuity is the sole closure blocker.

### Public Updates

- `/updates` returned successfully and was discoverable from the footer/utility area.
- Updates was absent from top-level Header navigation and absent as a Home teaser.
- The three authorized initial records rendered in chronology order with semantic dates and category labels.
- HYROX update wording preserved positive-only semantics.
- Canonical and sitemap discovery were present.

## 5. Responsive and accessibility review

The audited priority surfaces were reviewed at 390px, 430px, and desktop class where applicable.

- Horizontal overflow: none observed
- Header compression: healthy
- Schedule readability: healthy
- Map visibility beneath mobile partial sheet: preserved
- Desktop map panel: healthy
- Touch targets: accepted shared controls remained usable
- Keyboard navigation and visible focus: present
- Active domain state: present on Lesson and HYROX surfaces, except the HYROX-to-detail blocker
- Favorite state: accessible via `aria-pressed`
- Map controls and markers: accessible names present
- Selected Map region and close control: accessible names present
- Color-independent meaning: preserved in audited primary interactions

## 6. Production runtime

Representative fresh production requests for Home, Search, Lesson Detail, Program, Area × Program, Favorites, HYROX, HYROX-linked facility detail, Updates, and sitemap returned HTTP 200.

No new React error overlay, hydration error, failed critical chunk, missing CSS, critical request failure, or material horizontal overflow was observed. The exact current-main production artifact was served.

The current exact-main authoritative test suite completed with 155 passing tests and 0 failures during U4 evidence collection.

## 7. Findings and classification

| ID | Surface | Finding | Severity | Class | Recommended owner |
| --- | --- | --- | --- | --- | --- |
| U4-01 | HYROX → facility detail | `GymMapで詳細を見る` opens `/locations/hyrox-training-club-3700001` in Lesson context: Lesson is active, Lesson-local navigation and breadcrumb appear, the page reports 0 weekly lessons / 0 programs, and confirmed-positive HYROX equipment is absent. | High | `CLOSE_BLOCKER` | HYROX/Product UI authority; bounded detail-context reconciliation, not M1 |
| U4-02 | Lesson Map initial nationwide view | Dense overlapping markers can make direct pointer selection ambiguous until the user zooms, filters, or uses the exact nearby list. Keyboard selection remains exact. | Low | `TARGETED_POLISH` | Future shared Map UX follow-up, preserving M0/M1 contracts |
| U4-03 | Home/Search data delivery | Lesson search index is 2,575,767 bytes (>2MB). A fresh-browser Search result render was observed within approximately 4.2 seconds in this audit; no runtime failure occurred. | Medium | `BACKLOG / SEPARATE_DEBT` | Performance/Data |
| U4-04 | Product analytics | Generic analytics providers are wired, but primary product interactions do not have a complete named-event measurement contract. | Medium | `BACKLOG / SEPARATE_DEBT` | Analytics/Product |

## 8. Close blocker and minimum remediation authority

Close blocker count: **1**

Recommended bounded phase:

`U4-R1 — HYROX Facility Detail Domain Context Reconciliation`

Minimum scope:

1. Define the authoritative HYROX facility-detail continuation model without changing M1.
2. Preserve the existing public slug/deep-link unless a separately reviewed URL authority requires otherwise.
3. Present HYROX as the active domain and suppress Lesson-local navigation for HYROX facility context.
4. Preserve positive-only equipment and unknown semantics on the detail continuation.
5. Avoid Lesson-specific 0 schedule/program claims for a HYROX-only facility unless real Lesson data exists.
6. Re-run focused mobile/desktop Human Visual Review for the HYROX list/map → detail flow.

No remediation is implemented by U4.

## 9. Analytics readiness

| Measurement | Readiness | Current evidence |
| --- | --- | --- |
| Home → Search start | `PARTIAL` | Page/navigation inference is possible; no named product event was found. |
| Search submit | `PARTIAL` | Query URL/pageview inference is possible; no named submit event was found. |
| Result click | `PARTIAL` | Destination navigation can be inferred; no named result-click event was found. |
| Detail click | `PARTIAL` | Detail route visit is measurable; source interaction is not explicit. |
| Favorite add/remove | `NOT_INSTRUMENTED` | Local state action has no explicit product event. |
| Program visit | `MEASURABLE` | Route pageview is available through generic analytics. |
| HYROX entry | `PARTIAL` | Route visit is available; entry source is not explicit. |
| HYROX Map use | `NOT_INSTRUMENTED` | No named map-use event was found. |
| Lesson Map use | `NOT_INSTRUMENTED` | No named map-use event was found. |
| Updates view | `MEASURABLE` | Route pageview is available through generic analytics. |
| Mobile / desktop split | `EXTERNAL_ACCESS_REQUIRED` | Provider dashboards are required for observed audience/device reporting. |

Exact production volumes and funnels require access to the configured external analytics dashboards.

## 10. Performance readiness

Evidence-backed debt:

1. Lesson/Home search index: 2,575,767 bytes, pre-existing and not caused by U4.
2. Fresh-browser Search result availability in this audit was approximately 4.2 seconds. This is a single observation, not a Core Web Vitals measurement, and should be measured before optimization.

No evidence of a material production runtime failure, duplicate map runtime on a single surface, or deployment-only asset regression was found.

## 11. Closure decision and next priorities

Decision: `CLOSURE_BLOCKED`

Reason: one material cross-domain continuity and semantics blocker remains in the HYROX facility-detail continuation.

Priority decision: `OTHER`

1. First: complete the bounded U4-R1 blocker remediation and Human review.
2. After closure: Analytics / UX Measurement should precede broad performance optimization because the redesign currently lacks complete interaction measurement, while the known 2.58MB debt did not produce a material runtime failure in this audit.
3. Next: evidence-led performance work.
4. Then: optional Lesson Map marker-density polish.
5. Public Updates automation and new product features remain separate authorizations.

## 12. Mutation audit

- Runtime changed by U4: no
- UI changed by U4: no
- Map changed by U4: no
- HYROX changed by U4: no
- DB or migration changed by U4: no
- Analytics changed by U4: no
- Production changed by U4: no
- Documentation changed by U4: this file only
