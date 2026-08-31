# GymMap Product/UI Refresh — U4 Reconciliation and Closure Review v1

Status: `GYMMAP_PRODUCT_UI_REFRESH_COMPLETE`

Initial audit: 2026-08-31 (JST)

Closure re-check: 2026-09-01 (JST)

Human Product/UI Closure Review acceptance: 2026-09-01 (JST)

This document preserves the initial U4 closure-blocked decision and records the subsequent U4-R1 remediation, main integration, production acceptance, focused closure re-check, and final Human Product/UI Closure Review acceptance. The authorized GymMap Product/UI Refresh scope is formally complete.

This artifact is documentation only. It does not authorize or contain runtime, UI, Map, data, analytics, deployment, or production changes.

## 1. Executive status

- Initial U4 decision: `CLOSURE_BLOCKED`
- Initial close blocker: `U4-01 — HYROX facility detail domain-context discontinuity`
- U4-R1 remediation: implemented, Human Visual Review accepted, integrated to main, exact-main verified, and production accepted
- Closure re-check decision: `READY_FOR_CLOSURE`
- Human Product/UI Closure Review: `ACCEPTED`
- Current close blocker count: **0**
- Product state: `GYMMAP_PRODUCT_UI_REFRESH_COMPLETE`
- Final Product/UI closure: **declared**

## 2. Current exact authority and production identity

- Repository authority: `origin/main` at `a4442da52f634edb350b5c1d919ac565e224bcc9`
- Previous U4 audited main: `9ec8a5f811752bb9713f02dea568fa627e95155a`
- U4-R1 accepted candidate: `f3cfb7cd4eccb2541abb576b0bac5af7ff056dd2`
- U4-R1 main integration: `a4442da52f634edb350b5c1d919ac565e224bcc9`
- Production domain: `https://gymmap.vercel.app`
- GitHub production deployment ID: `6182816159`
- Vercel deployment identifier: `FuyHxEFSokm1SXdubmtaE4wGKKvF`
- Deployment source SHA: `a4442da52f634edb350b5c1d919ac565e224bcc9`
- Deployment status: success (`Deployment has completed`)
- Deployment timestamp: 2026-08-31T14:13:57Z
- Production and current `origin/main`: exact match
- Re-check HTTP status: Home, Search, Lesson Detail, HYROX list, both HYROX detail evidence cases, Favorites, and Updates returned 200

Current phase authority:

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
- H3-10C — HYROX Map UI: complete and present in current production
- U4-R1 — HYROX Facility Detail Domain Context Reconciliation: production complete

The historical progress labels in `docs/product-ui-ownership-v1.json` remain useful for ownership boundaries but are not the sole current implementation-progress source of truth.

## 3. Production surface inventory

### Lesson Discovery

- Home: `/`
- Search: `/search`
- Facility detail: `/locations/[slug]`
- Program: `/programs/[slug]`
- Area × Program: `/areas/[area]/[program]`
- Favorites: `/favorites`
- Lesson Map: `/#map-section`, with selection state `/?selected=[slug]#map-section`

### HYROX Discovery

- Landing, filters, list, and map: `/training/hyrox`
- HYROX Map selection: `/training/hyrox?selected=[slug]`
- Domain-stable HYROX facility detail: `/training/hyrox/[slug]`
- Positive-evidence re-check route: `/training/hyrox/hyrox-training-club-3700001`
- No-positive omission re-check route: `/training/hyrox/hyrox-training-club-0630062`

### Transparency and global UI

- Public Updates: `/updates`
- Global Header: GymMap, レッスン, HYROX
- Lesson-local menu: Lesson-context routes only
- Utility/footer: includes Public Updates discovery
- Shared Map presentation: marker, selected state, focus treatment, MapChrome, panel/sheet shell, and responsive structure

## 4. Initial U4 closure-blocked history

The initial U4 audit at main `9ec8a5f811752bb9713f02dea568fa627e95155a` found one genuine close blocker:

`U4-01 — HYROX → facility detail domain-context discontinuity`

At that time, `GymMapで詳細を見る` from HYROX continued to `/locations/[slug]`. The destination presented Lesson as the active domain, exposed Lesson-local navigation and Lesson breadcrumbs, showed Lesson-specific zero schedule/program summaries for a HYROX-only context, and omitted confirmed-positive HYROX equipment. The initial audit therefore classified Flow E as `BLOCKER` and set the closure decision to `CLOSURE_BLOCKED`.

That historical decision remains part of the audit record and has not been rewritten as though the blocker never existed.

## 5. U4-R1 remediation history

U4-R1 provided a bounded domain-context reconciliation without changing M0/M1 shared Map presentation:

1. Added the domain-stable route `/training/hyrox/[slug]`.
2. Updated HYROX list and Map panel internal continuation to the dedicated HYROX detail route.
3. Kept HYROX active and suppressed Lesson-local navigation on HYROX detail.
4. Preserved positive-only equipment evidence and the rule that missing evidence is not a negative assertion.
5. Omitted the equipment section for the no-positive case rather than presenting absence.
6. Avoided Lesson-only zero schedule/program claims in HYROX detail context.
7. Preserved the public official-site continuation and M1 map shell/selection contracts.

Acceptance history:

- U4-R1 implementation candidate: `f3cfb7cd4eccb2541abb576b0bac5af7ff056dd2`
- Human Visual Review: accepted
- Main integration: `a4442da52f634edb350b5c1d919ac565e224bcc9`
- Exact-main verification: pass
- Production deployment: success, exact integration SHA
- Production acceptance: pass

## 6. Focused closure re-check

The re-check used the current exact production artifact. It was a focused cross-surface sanity check, not a new redesign review.

| Surface | Result | Evidence summary |
| --- | --- | --- |
| Home | `PASS` | Search-first hierarchy, dynamic counts, popular programs, Favorites, HYROX secondary entry, and Lesson Map anchor remained present. |
| Search | `PASS` | `q=ヨガ` hydrated, `#search-results` rendered, and Detail/Program/Area continuations were present. |
| Lesson Detail | `PASS` | Lesson domain context, Search/Brand/Program continuation, official/Google Maps links, and mobile overflow remained healthy. |
| Favorites | `PASS` | Existing saved state and weekly continuation rendered without contract change. |
| Public Updates | `PASS` | Three authorized records, semantic wording, and Lesson/HYROX continuations remained present. |
| HYROX list | `PASS` | 82 Official Training Clubs, positive-only disclosure, dedicated detail links, and HYROX-only Header context remained present. |
| HYROX positive detail | `PASS` | Dedicated HYROX route rendered confirmed-positive equipment and no Lesson-local controls. |
| HYROX no-positive detail | `PASS` | Dedicated HYROX route omitted the equipment section and made no negative assertion. |
| Lesson Map selected | `PASS` | Shared marker hook, `aria-pressed`, selected panel, accessible close control, and Lesson Detail CTA remained present. |
| HYROX Map selected | `PASS` | Selected query state, shared panel/close affordance, and dedicated HYROX Detail CTA remained present. |

Responsive evidence:

- 390px: audited priority Lesson and HYROX surfaces had no horizontal overflow
- 430px: selected Lesson and HYROX Map states had no horizontal overflow
- 1440px class: selected Lesson and HYROX Map states had no horizontal overflow
- Browser console errors/warnings captured during the final Map re-check: none

No production-only regression or stale pre-U4-R1 artifact was found.

## 7. User journey results after remediation

| Flow | Result | Evidence summary |
| --- | --- | --- |
| A — Home → Search → Facility Detail → related discovery | `PASS` | Accepted Lesson hierarchy and continuation remain healthy. |
| B — Home popular program → Program → Area/facility → timetable/detail | `PASS` | Existing public route architecture remains intact. |
| C — Search/Program → Favorite → Favorites → Detail/timetable | `PASS` | Existing Lesson-local saved-program contract remains intact. |
| D — Lesson Map → marker → panel/sheet → Detail | `MINOR_FRICTION` | Shared presentation and exact keyboard selection pass; nationwide pointer density remains non-blocking polish. |
| E — HYROX → list/map → HYROX Detail/official link | `PASS` | Dedicated HYROX detail preserves domain context and evidence semantics. |
| F — Footer/utility → Updates → relevant destination | `PASS` | Utility discovery and safe cross-domain continuation remain healthy. |

## 8. Product-wide reconciliation

### Lesson UI

- Home remains search-first and has not regressed to the previous photo-first experience.
- Search retains primary/advanced hierarchy, URL hydration, result hierarchy, Favorites, and Detail continuation.
- Facility Detail, Program, Area × Program, and Favorites remain in the accepted U3-L visual and route system.
- No material Lesson old-template island was found in the focused re-check.

### Shared Map presentation

- Lesson and HYROX retain the same marker presentation, selected state, focus treatment, MapChrome, panel/sheet geometry, close affordance, and responsive structure.
- Lesson production exposed stable marker focus-target classes, accessible names, and `aria-pressed` state.
- Both domains exposed accessible selected-panel close controls and domain-correct internal detail links.
- Shared presentation consistency: `PASS`
- Domain ownership separation: `PASS`

### HYROX list, detail, and map

- Official facility list: 82 in the current production evidence.
- Confirmed-positive equipment remains positive-only.
- Missing positive evidence remains unknown, not unavailable/unsupported/absent.
- No-positive detail omits the equipment section.
- Equipment filter: absent.
- Capability UI: absent.
- Lesson-local menu leakage on HYROX routes: absent.
- Dedicated detail, official link, Map selection, and back-to-list continuation: present.

### Public Updates

- `/updates` remains discoverable from utility/footer and absent from the top-level Header.
- The three accepted initial records remain in chronology order with semantic dates and category labels.
- HYROX wording preserves positive-only semantics.

## 9. Accessibility and responsive reconciliation

- Semantic headings and domain navigation: present
- Active domain state: present on Lesson and HYROX contexts
- Lesson-local controls on HYROX: absent
- Favorite state: accessible via `aria-pressed`
- Map markers: accessible names and selection state present
- Selected Map panel: accessible close label present
- Keyboard/focus-visible shared Map contract: preserved by M1 and current production hooks
- Color-independent positive/unknown meaning: preserved
- Touch-target and Header compression regressions: none observed in focused re-check
- Horizontal overflow: none observed at audited 390px, 430px, and desktop states

## 10. Findings and final classification

| ID | Surface | Final finding | Severity | Final disposition | Recommended owner |
| --- | --- | --- | --- | --- | --- |
| U4-01 | HYROX → facility detail | Original domain-context blocker was remediated by the dedicated HYROX detail route and confirmed in production. | Resolved | `RESOLVED` | None; retain regression coverage |
| U4-02 | Lesson Map nationwide view | Dense overlapping markers can make direct pointer selection ambiguous until zoom/filter/list use; keyboard selection remains exact. | Low | `TARGETED_POLISH / NON_BLOCKING` | Future shared Map UX follow-up, preserving M0/M1 |
| U4-03 | Home/Search data delivery | Lesson search index is 2,575,767 bytes (>2MB). One prior audit observed about 4.2 seconds to a Search result; this is not a CWV measurement. | Medium | `SEPARATE_PERFORMANCE_DEBT` | Performance/Data |
| U4-04 | Product analytics | Generic analytics providers exist, but primary product interactions lack a complete named-event contract. | Medium | `SEPARATE_ANALYTICS_DEBT` | Analytics/Product |

Open close blocker count: **0**

## 11. Targeted polish

Non-blocking, bounded candidate:

- Lesson Map nationwide marker-density/pointer ambiguity. Any follow-up must preserve M0 behavior and M1 shared presentation authority. This does not justify reopening M1 during closure.

## 12. Separate performance debt

Evidence-backed debt:

1. Lesson/Home search index: 2,575,767 bytes, pre-existing and not caused by U4/U4-R1.
2. A single fresh-browser Search observation in the original audit was approximately 4.2 seconds. It is directional evidence only, not Core Web Vitals or a statistically meaningful production measurement.

No material production runtime failure, deployment-only asset regression, or U4-R1-specific performance regression was found. Performance work remains a separately authorized phase.

## 13. Analytics readiness

| Measurement | Readiness | Current evidence |
| --- | --- | --- |
| Home → Search start | `PARTIAL` | Navigation/pageview inference is possible; no named product event was found. |
| Search submit | `PARTIAL` | Query URL/pageview inference is possible; no named submit event was found. |
| Result click | `PARTIAL` | Destination navigation can be inferred; source interaction is not explicit. |
| Detail click | `PARTIAL` | Detail route visit is measurable; originating interaction is not explicit. |
| Favorite add/remove | `NOT_INSTRUMENTED` | Local state action has no explicit product event. |
| Program visit | `MEASURABLE` | Route pageview is available through generic analytics. |
| HYROX entry | `PARTIAL` | Route visit is available; entry source is not explicit. |
| HYROX Map use | `NOT_INSTRUMENTED` | No named map-use event was found. |
| Lesson Map use | `NOT_INSTRUMENTED` | No named map-use event was found. |
| Updates view | `MEASURABLE` | Route pageview is available through generic analytics. |
| Mobile / desktop split | `EXTERNAL_ACCESS_REQUIRED` | Provider dashboard access is required for observed device reporting. |

## 14. Closure decision and next priority

Closure decision: `COMPLETE`

Reason: the only initial close blocker, U4-01, is resolved in the exact current production artifact; focused cross-surface reconciliation found no new close blocker.

Human gate: `ACCEPTED`

Priority decision: `ANALYTICS_FIRST`

The core Product/UI refresh now has healthy production journeys and no close blocker. The highest immediate product value is to measure whether the refreshed journeys improve Search starts, result/detail continuation, Favorites, and Map use. The known 2.58MB search-index debt remains important, but current evidence does not establish a material production failure; measurement should precede broad optimization. Performance should follow as an evidence-led, separately authorized phase, with U4-02 optional targeted polish after that unless new user evidence elevates it.

## 15. Product/UI Refresh completion scope

Human Product/UI Closure Review accepted this artifact. Formal closure means:

- the accepted Lesson, HYROX, shared Map, and Public Updates user journeys form one coherent production product;
- U0 through U4/U4-R1 authority and domain boundaries are reconciled;
- no known `CLOSE_BLOCKER` remains;
- non-blocking polish and separate performance/analytics debt are explicitly owned outside closure.

Closure does **not** mean:

- every pixel or copy choice is final;
- performance and analytics debt is complete;
- new product features, data work, Public Updates automation, or future Map polish is authorized;
- runtime, main, or production changes may proceed without separate authority.

## 16. Closure artifact and mutation audit

- Artifact: `docs/product-ui-refresh-closure-v1.md`
- Artifact type: documentation only
- Runtime changed by closure re-check: no
- UI changed by closure re-check: no
- Map changed by closure re-check: no
- HYROX runtime changed by closure re-check: no
- DB or migration changed by closure re-check: no
- Analytics changed by closure re-check: no
- Production changed by closure re-check: no
- Main merge by closure re-check: no

Formal declaration: `GYMMAP_PRODUCT_UI_REFRESH_COMPLETE`

Next separately authorized workstream recommendation: **GymMap Analytics / UX Measurement**

Do not automatically start Analytics, Performance, Targeted Polish, Map revision, or new Product/UI feature work from this document.
