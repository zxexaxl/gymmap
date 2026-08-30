# GymMap Product / UI authority v1

Status: `FROZEN_FOR_HUMAN_REVIEW`

Repository baseline: `origin/main` at `17cb5a567bf4293afdf62642eb321bca07d92c26`

Freeze date: 2026-08-30 (Asia/Tokyo)

Machine-readable companion: [`product-ui-ownership-v1.json`](./product-ui-ownership-v1.json)

This document is the documentation-only output of U0A followed by U0B. It records the current repository contract before freezing the next product information architecture and ownership boundaries. It does not authorize or contain UI, runtime, database, migration, crawler, analytics, monitoring, or production changes.

## 1. U0A — current behavior, data, URL, and analytics contract freeze

### 1.1 Repository identity and evidence boundary

- Repository root used for the audit: `/private/tmp/gymmap-ui-u0-authority-freeze`.
- Dedicated branch: `codex/ui-u0-authority-freeze`, created from local `origin/main` at the baseline above.
- The primary checkout at `/Users/te/Documents/GymMap` was on `main`, nine commits behind `origin/main`, with extensive pre-existing tracked and untracked work. It was not stashed, cleaned, reverted, committed, or otherwise modified.
- Relevant existing HYROX branches through H3-8 were observed. No H3-9 or H3-10A branch was present in the local branch inventory at audit time; those authorities are nevertheless treated as parallel/external dependencies, not as missing work to execute here.
- Repository evidence is authoritative for behavior. A read-only observation of `https://gymmap.vercel.app/` and `/training/hyrox` on 2026-08-30 was used only to record dynamic counts and confirm that the deployed route matched the inspected implementation.

### 1.2 Current route and navigation inventory

| Route or URL state | Current contract | Index/canonical behavior |
| --- | --- | --- |
| `/` | Lesson-led Home. Loads Lesson search, favorite-program panel, program/brand discovery, and Lesson map. Header exposes HYROX. | Root metadata canonical `/`; revalidate 900 seconds. |
| `/search` | Lesson search results. Query string is the durable search state. | `noindex,follow`; canonical `/search`; filters are deliberately excluded from canonical. |
| `/search?q=&weekday=&timeRange=&durationRange=&brand=&area=&page=` | Recognized Lesson query parameters. First value wins for duplicate filter keys. Values are trimmed. Empty values mean no filter. Invalid enumerated values behave as no filter in application filtering; invalid/non-positive `page` becomes 1. `debug=1` enables repository debug output/banner and is not a product filter. | Pagination preserves non-empty incoming query values other than `page`, omits `page=1`, and appends `#search-results`. |
| `/programs/[slug]` | Program landing page with favorite-program action, location summaries, weekday/time links, and links back into `/search`. | Static params from the SEO program set; `dynamicParams=false`; unknown slug is 404; revalidate 86400 seconds; canonical is normalized program path. |
| `/areas/[area]/[program]` | Area + program landing page sourced from the prebuilt area sitemap and current Lesson data. | `force-static`, `dynamicParams=false`, revalidate 86400 seconds. Indexability is data-threshold based; canonical uses resolved area/program values. |
| `/locations/[slug]` | Shared facility URL. Currently renders generic facility facts plus Lesson schedules when present. HYROX cards link to this same URL, but no HYROX equipment/capability semantics are rendered here. | Static active location slugs; `dynamicParams=false`; unknown slug is 404; revalidate 86400 seconds; canonical `/locations/[slug]`. |
| `/favorites` | Lesson program favorites and their next-seven-day schedule view. | `noindex,follow`. No saved entity identifier is encoded in the route. |
| `/training/hyrox` | HYROX Official Training Club discovery: national count, prefecture filter, map, list, GymMap facility links, and facility-official links. | Indexable canonical `/training/hyrox`; revalidate 3600 seconds. Included in core sitemap. |
| `/api/favorites/schedules` | Read-only GET endpoint for saved Lesson program schedules. Accepts repeated UUID `programId` (maximum 8), `area`, and `startWeekday`. | Dynamic, private `no-store`; invalid/missing program IDs return an empty result rather than a client error. |
| `/admin/data?key=...` | Non-public, key-gated data inspection route. | Dynamic, `noindex,nofollow`; returns 404 unless `ADMIN_ACCESS_KEY` and query key are both non-empty and equal; `/admin/` is disallowed by robots. |

Current anchors/deep links:

- `/#search-section` — Lesson search on Home.
- `/#popular-programs` — Lesson program/brand discovery. The section is data-conditional, so the anchor target can be absent when no featured programs load.
- `/#map-section` — Lesson map on Home.
- `/search?...#search-results` — paginated Lesson result position.
- `/programs/[slug]#program-locations` — program landing location list.

There are no repository-configured rewrites or redirects in `next.config.ts`. Header brand navigation goes to `/`. The current header visually places `条件検索`, `ブランド`, `地図`, and `お気に入り` beside HYROX, but the first three are Lesson Home anchors and favorites is Lesson-program-only; their visual placement must not be interpreted as domain-independent ownership.

### 1.3 Current Lesson Discovery contract

#### Searchable fields and normalization

- `q` searches Lesson program text only: raw program name, normalized canonical program name, program brand, configured program aliases, and brand aliases.
- Query normalization uses Unicode NFKC, lower-case, slash/bracket normalization, whitespace collapse, and compact no-space comparison. Match priority is raw name, canonical name, program brand, alias, then brand alias; exact, prefix, and substring matches receive descending scores.
- `area` is a case-insensitive substring match across location name, slug, prefecture, city, address line, and the combined address.
- `brand` is a case-insensitive substring match on gym brand name. The UI provides a datalist but does not require exact selection.
- `weekday`, `timeRange`, and `durationRange` are the remaining filters. Defaults are all empty (`指定なし`).

#### Filter semantics

- Weekdays are Monday through Sunday.
- Morning is 06:00 inclusive to 12:00 exclusive; afternoon is 12:00 inclusive to 17:00 exclusive; evening is 17:00 inclusive to 23:00 exclusive.
- Duration `short` is at most 45 minutes, `medium` is 46–59, and `long` is at least 60. A null duration fails an active duration filter.
- Search reads only the latest applicable schedule period per location. The preferred path calls `search_class_schedule_page`; failures fall back to the cached Lesson index and joined schedule fetches.

#### Ordering, pagination, and result hierarchy

- Ordering is weekday Monday→Sunday, start time ascending, known shorter duration before longer/null duration, match score descending, then location name.
- Page size is 20. Requested pages are clamped to the available range.
- Each result presents: weekday/time, raw program name, optional canonical name, program favorite control, location, brand, address, program and area-program links, duration, schedule confirmation date, and facility detail link.
- Schedule confirmation shown per result is `extracted_at`, falling back to `updated_at`. A result-set warning appears when the latest schedule update is older than 45 days. A missing/invalid date does not itself trigger the warning.
- Zero results have distinct copy for an active-filter miss versus an empty underlying dataset. Loader/database failures are currently collapsed by data functions to empty arrays/results and may therefore present as an empty state rather than a distinct search error.

#### Brand, area, schedule, and duration behavior

- Home loads up to 48 popular programs, constructs brand-specific tabs and featured shortcuts, and exposes four standard genres when present.
- Program and area landing pages are discovery surfaces over the same current Lesson schedule contract, not separate saved entities or HYROX surfaces.
- Location detail pages show facility confirmation (`last_verified_at`) separately from the latest Lesson schedule confirmation.

### 1.4 Current HYROX contract

#### Route, source, loader, and count

- The sole public HYROX discovery route is `/training/hyrox`.
- The server-only loader in `src/lib/hyrox-discovery-server.ts` calls `search_training_locations` with discipline `hyrox` and `p_official_only=true`, paginates at 100 rows, verifies a stable `total_count`, rejects non-official leakage and incomplete/duplicate pagination, then separately supplements facility official URLs from `gym_locations` in batches of 100.
- This is a dedicated lightweight HYROX publication loader. It must not be merged into the general Lesson loader in `src/lib/data.ts`.
- The code contains no fixed public facility-count constant. The count is dynamic publication output. The read-only production observation on 2026-08-30 showed 82 Official Training Clubs; 82 is therefore the current observed cohort, not an invariant that may override the publication layer.

#### Publication and evidence semantics

- `Official Training Club` means an active, confirmed, non-stale official affiliation with accepted governing-body supporting evidence under the fail-closed publication views. The badge is not a generic GymMap endorsement.
- Discipline, equipment, and capability publication is positive-evidence-only: state must be available, verification confirmed, freshness current, accepted supporting evidence present, source publishable, and no accepted refuting evidence present.
- The HYROX search RPC can return `equipment_slugs`, `capability_slugs`, class availability, and open-training availability, but the current UI loader intentionally maps none of these fields into `HyroxDiscoveryLocation` and exposes no equipment/capability/class chip or filter.
- The current UI explicitly states that equipment and class data are being confirmed. Missing presentation is not negative evidence.
- Frozen semantic invariant: an empty equipment/capability list is neither unavailable, absent, nor negative evidence. `unknown != unavailable`. A source failure, missing support, 404, or stale claim is a review signal and not a negative equipment/capability fact.
- Freshness is domain policy. Published facts fail closed after `stale_at`. HYROX affiliation/discipline monitoring treats `FRESH`, `DUE_SOON`, `URGENT`, and `STALE` as review workflow states; a monitor observation does not extend confirmation timestamps. Equipment horizon is 180 days; open training, discipline coaching, and sled space are 90 days; competition simulation is 30 days.

#### Current presentation and linkage

- Prefecture is client-local state, defaults to nationwide, and is not represented in the URL. Options and counts are derived from the same fully loaded publication cohort.
- The list is ordered by Japanese prefecture order, city, facility name, then ID. Filtering preserves that order.
- The HYROX map and list share the filtered cohort and selected location ID. `地図で見る` selects the facility and scrolls to the map heading. Selection is not stored in the URL.
- Map selection and cards link to `/locations/[slug]`; when available, a separate external link opens the facility official site. Missing official URLs suppress that link and produce an aggregate notice.
- Successful zero publication and loader failure are distinct: zero shows a valid empty publication state; failure shows an error that explicitly says it does not mean zero facilities.

No repository evidence contradicts the supplied HYROX invariants. H3-9 and H3-10A were not executed, and no HYROX semantic, equipment/capability, or monitoring state was changed.

### 1.5 Current favorites / Saved contract

- The only saved entity is a Lesson `Program` (`id`, `slug`, `name`). It is not an individual class schedule, facility/location, brand, or HYROX facility.
- Storage is browser-local under `gymmap:favorite-programs:v1`; no account, server persistence, cross-device sync, or URL representation exists. Maximum saved programs: 8.
- Buttons appear on Lesson results, program cards, and program pages. `/favorites` fetches up to 120 schedule rows for the saved programs, starting from the current local weekday and covering the UI-described next seven days; it supports a client-local area/location substring filter.
- Lesson schedule rows shown from favorites are not themselves independently saved.
- There is no location favorite and no HYROX facility save. `Saved` is therefore not an implemented global GymMap concept and must remain Lesson-local until a separate product/domain contract expands it.

### 1.6 Current map contract

#### Shared presentation already in the repository

- `MapComponentProps`, Leaflet/OpenStreetMap presentation, and optional Apple MapKit presentation live under `src/components/map/`. Provider configuration is `NEXT_PUBLIC_MAP_PROVIDER`; Apple initialization failure falls back to OSM.
- Shared marker presentation accepts only generic location identity, label/brand, coordinates, selected ID, center/current position, selection callback, optional bounds callback, and optional provider-error/caption behavior.
- Markers are circle/marker annotations with selected/unselected styles and text tooltips. The shared map does not own Lesson or HYROX query semantics or domain popup/card content.

#### Lesson map

- Source: all `gym_locations` plus a cached, latest-period Lesson search index derived from all class schedule rows. Both are loaded by Home on the server and passed to the client map section.
- Query/filter state is client-local: Lesson program query, exact brand, exact prefecture, distance (1/3/5/10 km), nearby versus current map bounds, selected location, geolocation, and provider fallback. None is encoded in the URL.
- Geolocation is requested on mount. Success centers on the user and selects the nearest location. Failure/denial falls back to Tokyo Station and retains a retry control. Distances are straight-line haversine approximations.
- All mappable locations remain markers; filters reduce the accompanying candidate list, not the marker dataset. The sidebar shows the selected facility and at most the nearest 10 candidates. A Lesson query can deep-link to `/search` with `q` and the selected location name as `area`.
- At widths at or below 980px, map and sidebar become one column; at or below 640px, filters become one column, map height becomes 320px, and the sidebar remains a separate fixed-height scrolling region. There is no map/list mode route or bottom sheet.

#### HYROX map

- Source: the dedicated, fully validated Official Training Club publication cohort from the HYROX loader.
- Client-local state is prefecture and selected location. Prefecture filters both markers and list; a single result centers on that facility, otherwise center is Japan. No geolocation, bounds filtering, distance sorting, provider selection, or URL state is used.
- The shared Leaflet presentation renders markers/tooltips. HYROX-owned selection content below the map carries Official badge semantics and GymMap/facility links.
- At mobile width, the map uses a 68vh height capped at 540px, cards become one column, and selected content stacks vertically. There is no bottom sheet or URL-restored selection.

### 1.7 Analytics and UX baseline

Repository integrations:

- **AVAILABLE (integration):** Microsoft Clarity is loaded after interaction with project ID `weo79q5hg6`.
- **AVAILABLE when deployment token exists:** Cloudflare Web Analytics is conditionally loaded from `NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN`.
- **AVAILABLE (integration):** Vercel Speed Insights is mounted globally.
- **AVAILABLE but diagnostic, not product analytics:** targeted server console traces for a small Oimachi/BODYCOMBAT/BODYPUMP search-debug case and map initialization/tile errors.
- **EXTERNAL ACCESS REQUIRED:** dashboards, consent/filter settings, retention, traffic counts, funnels, session replays, Web Vitals values, and mobile/desktop breakdowns. No numeric baseline is inferred here.

Interaction coverage:

| Interaction | Current status |
| --- | --- |
| Home → search navigation and search page views | Potentially observable through generic page/session tooling; **no named product event**. External access required for actual data. |
| Search submit | **NOT CURRENTLY INSTRUMENTED** as a semantic event. Query-bearing page navigation is observable only through generic tooling/server requests. |
| Result click | **NOT CURRENTLY INSTRUMENTED** as a semantic event. |
| No-result | **NOT CURRENTLY INSTRUMENTED** as a semantic event. |
| Brand/program navigation | **NOT CURRENTLY INSTRUMENTED** as a semantic event. |
| Lesson map navigation/filter/marker selection/geolocation | **NOT CURRENTLY INSTRUMENTED** as semantic events; initialization and errors only have console diagnostics. |
| Favorite add/remove and favorite schedule use | **NOT CURRENTLY INSTRUMENTED** as semantic events. |
| HYROX navigation, prefecture, marker, detail, and official-site click | **NOT CURRENTLY INSTRUMENTED** as semantic events. |
| Mobile versus desktop | Generic analytics may derive device classes; **no repository-defined product breakpoint event/property**. External access required. |

No analytics events were added in this phase.

### 1.8 Performance and payload baseline

- Home awaits four server data operations in parallel: every brand, every location, the complete latest-period Lesson map search index, and up to 48 popular programs. Locations serve the count and map; the Lesson index serves map filtering. These are cached for one hour at the data layer; Home revalidates every 15 minutes.
- Home sends the location cohort and compact Lesson map index to the client `LocationMapSection`. This is the main repository-visible large-data boundary. It must not be accidentally expanded during a visual refresh.
- The current hero image is a local 93,195-byte PNG, rendered with `priority`. A large replacement hero asset is not required by authority v1.
- Leaflet and Apple map components are client-only dynamic imports. Leaflet CSS is globally imported. `react-leaflet`/Leaflet and, conditionally, Apple MapKit are the notable map-side dependencies.
- The HYROX page loads the complete current Official cohort through its own paginated server loader and passes the mapped cohort to a HYROX client component. Current production observation is 82 records. This loader is not called by Home.
- `/search` uses a 20-row RPC page plus ID join; the legacy fallback can load the full cached Lesson index but still returns one visible page.
- Favorites are client-loaded after local storage hydration through a private, no-store endpoint and are capped at eight programs / 120 rows.
- Exact route JS, RSC payload, image transfer, LCP, INP, CLS, and mobile bundle values are **UNKNOWN / MEASUREMENT REQUIRED**; no build or production analytics number is invented in this freeze.

Preservation requirements for later phases:

- Do not require all HYROX records for Home initial render merely to show the HYROX entry.
- Do not load all Lesson locations solely for a Home hero; any retained full set must have an owned discovery/map consumer and an explicit payload budget.
- Do not make a large hero image a requirement.
- Do not assume a new UI framework is needed.
- Monitor Home payload, mobile initial JS, layout shift, and map/client dependency regressions.
- Preserve the dedicated HYROX loader and the paginated Lesson search boundary.

### 1.9 U0A preservation requirements and explicit unknowns

Later work must preserve:

1. Public paths, query keys, anchors, canonical behavior, and static/dynamic route failure semantics unless a separately reviewed migration is authorized.
2. Lesson query normalization, filters, ordering, pagination, latest-period schedule semantics, confirmation-date distinction, and zero-state distinction.
3. Program-only browser-local favorites; no implied location/HYROX save.
4. HYROX positive-evidence publication, fail-closed freshness, official badge meaning, error-versus-zero distinction, and dedicated loader.
5. Domain-owned map data/query/selection semantics even when presentation primitives are shared.

Explicit unknowns that do not block U0A:

- Analytics dashboards and numeric before/after baselines require external access.
- Deployment presence of the optional Cloudflare Web Analytics token is not proven by repository code.
- Exact route bundle/payload/Web Vitals baselines require an explicit measurement run.
- A repository route does not expose an `Updates` destination; its content model, owner, and data source are undefined.
- The public HYROX count is dynamic. 82 was observed on 2026-08-30 and must not be converted into a hard-coded product invariant.

U0A verdict: `GYMMAP_UI_U0A_COMPLETE`.

## 2. U0B — product IA and domain ownership freeze

U0B follows only because U0A is complete.

### 2.1 Product and Home hierarchy

Frozen product hierarchy:

```text
GymMap
├── Lesson Discovery
└── HYROX Discovery
```

Frozen Home hierarchy:

- Primary: Lesson search and discovery.
- Strong secondary entry: HYROX Discovery, navigating to `/training/hyrox` without requiring the HYROX dataset on Home.
- Lesson and HYROX are formal GymMap domains but are not required to receive symmetrical Home space, search forms, filter density, cards, or result semantics.
- A future Home mode switch is not part of authority v1. It requires expanded HYROX search/schedule/saved capability and a new product decision.

### 2.2 Global versus domain-local navigation

Global product navigation is conceptually limited to:

- Lesson → `/` (Lesson-led Home/discovery entry).
- HYROX → `/training/hyrox`.

Lesson-local navigation/content:

- 条件検索 → `/#search-section` or `/search`.
- ブランド/program discovery → `/#popular-programs` and `/programs/[slug]`.
- 地図 → `/#map-section` (explicitly Lesson Map).
- お気に入り → `/favorites` (explicitly Lesson program favorites).
- Area/program and location Lesson schedule links.

HYROX-local navigation/content:

- Prefecture filtering, HYROX map/list, Official Training Club badge/content, facility detail linkage, and facility-official linkage.

The current header renders several Lesson-local links beside global HYROX. That is a presentation debt, not evidence that map or Saved is global. Authority v1 does not define a single global Map destination. `Updates` remains absent/deferred and must not enter global navigation until a content owner, data source, freshness policy, URL, and analytics contract are separately frozen.

### 2.3 Home ownership and loading boundary

- `U2-L` owns future Home visual implementation because Lesson is primary.
- Product IA authority owns hierarchy and destination semantics; U2-L may not demote/remove HYROX as a formal strong secondary entry.
- HYROX owns the destination and domain copy/claims contributed to that entry. The entry may use static/minimal metadata and must not require `loadHyroxDiscoveryData()` or the complete HYROX cohort on Home.
- Home must not embed a second full HYROX search form under this authority.
- Pixel design, exact placement, and copy treatment remain for the future implementation phase.

### 2.4 Shared foundation versus domain components

U1 Minimum Shared Design Foundation may own only:

- color/type/spacing/radius/shadow tokens;
- AppShell and AppHeader presentation;
- basic Button, Input, Chip, Badge, and base Card surfaces;
- focus, loading, disabled, error, responsive, and other accessibility presentation states.

Lesson-owned:

- Lesson search form and filter meanings;
- LessonResultCard and result hierarchy;
- Lesson program/brand/area discovery;
- Lesson favorites and schedule view;
- Lesson map data/query/list/popup-or-card semantics;
- Lesson freshness policy and its conversion into presentation status.

HYROX-owned:

- HyroxFacilityCard and HYROX filter meanings;
- OfficialTrainingClubBadge semantics;
- confirmed equipment/capability presentation;
- HYROX list/detail/map selection content;
- HYROX freshness/evidence policy and its conversion into presentation status.

A universal semantic `GymCard` is prohibited. A shared base Card surface is allowed only when it does not decide fields, hierarchy, freshness, official status, evidence, or actions.

### 2.5 Freshness ownership

The allowed flow is:

```text
domain freshness/evidence policy
        ↓
domain-produced presentation status
        ↓
shared FreshnessIndicator presentation
```

U1 may later provide a presentation-only FreshnessIndicator. It must not calculate age thresholds or interpret missing timestamps. Lesson and HYROX policies remain independent. H3 retains HYROX policy authority.

### 2.6 HYROX positive-evidence dependency

- Gate A: positive-evidence display.
- Gate B: positive-evidence search/filter.
- Gate A does not imply Gate B. Partial positive coverage can support a carefully governed display without proving that a public filter is complete or unbiased.
- Negative filtering is blocked without a completeness and explicit-negative authority contract.
- H3-10A owns the final semantic/release decision. This document records only the dependency and does not execute that authority.

### 2.7 Map ownership

- `M0` owns the future Shared Map Behavior Contract: marker/selection states, map/list switch behavior, popup versus bottom sheet, current location, mobile behavior, loading/empty/error, URL-state responsibilities, and domain popup ownership.
- `M1` owns Shared Map Presentation implementations and provider-level presentation.
- Lesson owns Lesson map data, query/filtering, candidate ordering, selected entity meaning, and Lesson selection content.
- HYROX owns HYROX map data, prefecture/query semantics, selected entity meaning, Official/evidence content, and HYROX actions.
- M0 and M1 do not own HYROX predicates or Lesson search semantics. U0B does not implement M0 or M1.

### 2.8 Saved ownership and facility detail

- Saved/favorites remains Lesson-local and program-only.
- A global Saved label, shared Saved route, location favorite, or HYROX facility save requires a new entity model, persistence contract, migration/compatibility plan, and analytics acceptance; none is authorized here.
- `/locations/[slug]` is a cross-domain facility destination with current Lesson-heavy content. Generic facility facts may be shared, but adding HYROX semantics requires H3/H3-10B review; changing Lesson schedule semantics requires U2-L review. This existing path collision must not be hidden by assigning the entire route to one domain.

### 2.9 Future phase acceptance policy

Responsive review targets: approximately 390px mobile, approximately 430px mobile, and desktop.

Accessibility acceptance: keyboard operation, visible focus, adequate touch target, contrast, disabled semantics, described errors, and `aria-label` for icon-only controls.

Performance acceptance: no unexplained Home payload regression, no unnecessary full-domain data load, no unnecessary UI framework, no mandatory large hero image, monitored CLS, and monitored mobile initial JS.

Analytics acceptance: before/after comparison must use real available data; named instrumentation gaps must remain explicit until separately authorized. U0B does not authorize event mutations.

U1 completion means Lesson and HYROX can implement their domain UI without changing the shared foundation contract. U1 does not own production LessonResultCard or HyroxFacilityCard; at most one reference fixture per domain may be used to validate the foundation.

U0B verdict: `GYMMAP_UI_U0B_COMPLETE`.

## 3. Known path collisions

The companion manifest is normative for orchestration. The highest-risk current collisions are:

- `src/app/page.tsx`: Lesson-led product Home; future HYROX secondary-entry contribution crosses product/domain ownership.
- `src/app/globals.css`: shared tokens/shell, Lesson styles, HYROX styles, map styles, and favorites styles are co-located. File-level ownership cannot be safely assigned; selector-scoped changes still require the owning authority.
- `src/components/map/leaflet-gym-map.tsx` and `map-types.ts`: shared presentation is consumed by both domains; domain query/content must stay outside.
- `src/app/locations/[slug]/page.tsx`: generic facility URL plus Lesson schedules, used as the HYROX facility-detail link.
- `src/components/layout/header.tsx`: global product links and currently Lesson-local anchors coexist.

These collisions are documented rather than silently assigned.

## 4. Final freeze statement

`PRODUCT_UI_AUTHORITY_V1_FROZEN`

`READY_FOR_HUMAN_REVIEW`

`NO_UI_IMPLEMENTATION`

`NO_PRODUCTION_MUTATION`
