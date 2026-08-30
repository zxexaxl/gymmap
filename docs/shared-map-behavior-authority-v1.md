# GymMap Shared Map Behavior Authority v1

Status: `M0_FROZEN`

Authority ID: `SHARED_MAP_BEHAVIOR_AUTHORITY_V1`

Task: `M0 — Shared Map Behavior Contract`

Repository start baseline: `HEAD` and `origin/main` at `07bd0715839bf88f2b136ca5bdec83d0687247df` on 2026-08-31 (Asia/Tokyo); checkout was detached and clean.

Depends on: [`GymMap Product / UI authority v1`](./product-ui-authority-v1.md) and its [machine-readable ownership companion](./product-ui-ownership-v1.json).

This is a documentation-only authority. It authorizes no runtime UI, map-provider, database, schema, RPC, ingestion, production-data, deployment, U1, M1, Lesson, or HYROX implementation change.

## 1. Purpose

Freeze one domain-neutral behavior contract for Lesson Map and HYROX Map. Separate engineers must be able to implement the same user-visible interaction model without making shared map code interpret Lesson or HYROX data.

The boundary is:

> Shared owns how map discovery behaves. A domain owns what its information means, which entities qualify, their ordering, and the content and actions shown for them.

M0 is independent of U1 tokens, AppShell, Header, generic primitives, final colors, and final marker visuals. M1 may choose presentation only within this behavior contract. Lesson and HYROX may supply different content without changing these semantics.

## 2. Authority and research record

Authority was applied in this order:

1. Reviewed/frozen authority: Product / UI authority v1, ownership v1, and the ingested H3-10A handoff.
2. Intentionally retained production behavior: public route, search, detail-link, provider-fallback, result ordering, publication, and error-versus-zero contracts recorded by authority v1.
3. Tests: especially `hyrox-discovery.test.ts` and the publication tests that fail closed and distinguish successful zero from failure.
4. Current implementation: shared Leaflet/Apple components, Lesson `LocationMapSection`, HYROX `HyroxDiscovery`, route loading/error behavior, and responsive CSS.
5. Historical/superseded material: map commits `3b0f476`, `7b94db9`, and `6173a8c`; HYROX freshness, scale-out, and release documents.

Relevant repository facts:

- The existing shared map prop shape already separates generic identity/coordinates from domain content, but does not implement this complete contract.
- Lesson currently keeps all mappable facilities as markers while filters reduce its candidate list, can derive a viewport-scoped list, auto-requests geolocation on mount, auto-selects a nearest/first facility, and keeps all map state out of the URL.
- HYROX currently filters map and list from one prefecture cohort, starts with no selection, keeps prefecture and selection out of the URL, has no geolocation, and places selected content below the map.
- Both domains currently use one selected location ID when selected, and both link to `/locations/[slug]`.
- Neither implementation currently provides clustering, a normative background-clear action, an exclusive map/list mode, a mobile bottom sheet, or URL-restored selection.
- The shared provider currently recenters a selected entity and reports settled bounds. Historical fixes intentionally suppress duplicate bounds updates, preserve resize stability, and recenter after a user-location result.

### 2.1 Resolved contradictions and migration debt

The following conflicts are reported rather than silently treated as authority:

| Conflict | Resolution |
| --- | --- |
| Lesson requests location permission on mount; HYROX never requests it. | M0 supersedes the Lesson behavior: no first-load permission request. Location access requires an explicit user gesture in both domains. |
| Lesson location success selects the nearest facility; HYROX location is absent. | M0 supersedes auto-selection: locating changes the viewport and location state, never entity selection. |
| Lesson selects its first mappable facility without user intent; HYROX starts unselected. | M0 freezes no implicit initial entity selection. Only valid restored URL state or an explicit user selection selects an entity. |
| Existing map selections and HYROX prefecture are client-local. | M0 adds a deliberate shared URL/history contract for selected entity and exclusive map/list mode. Domain filters remain under existing route/domain URL authority. |
| Lesson markers are not reduced by Lesson filters while its list is; HYROX map and list share the filtered cohort. | M0 requires separate named query, marker, and viewport sets. A domain may intentionally supply supplemental markers, but shared code may not conflate those sets or silently alter a domain query. |
| Current marker tooltips and Apple marker colors do not provide the complete keyboard/programmatic/non-color state contract. | M0 freezes the accessible behavior; implementation is M1 work. |
| Current HYROX route/test includes a broad `未確認` notice. | H3-10A is higher authority: per-facility no-positive sections are omitted, and M0 never generates unknown/negative/loading copy from evidence-shaped fields. The legacy notice/test is implementation debt, not shared-map authority. |

No contradiction prevents this contract.

## 3. Scope, terminology, and state model

### 3.1 In scope

- canonical entity selection and marker interaction;
- coordination among map, list, selection surface, detail navigation, and URL;
- responsive desktop/tablet/mobile responsibilities;
- current-location lifecycle;
- shared loading, empty, partial, and error behavior;
- accessible interaction and focus continuity;
- ownership and deterministic transitions.

### 3.2 Terminology

- **Domain**: Lesson or HYROX.
- **Entity**: a domain-supplied selectable facility/location represented by one stable identity. M0 does not assume anything about its domain payload.
- **Entity key**: `{ domain, entityKind, publicKey }`. For current Lesson and HYROX facility maps, `entityKind` is `location` and `publicKey` is the stable public location slug used by `/locations/[slug]`. Internal database IDs may be used for lookup but are not the public URL identity.
- **Canonical selection**: zero or one entity key, shared by marker, list item, selection surface, detail link, and URL.
- **Domain payload**: domain-owned fields and semantics associated with an entity key. Payload is replaceable and is not selection identity.
- **Query result set**: the domain-owned, ordered result set produced by search/filter/publication rules.
- **Marker set**: the domain-supplied mappable entities. It normally equals the mappable query result set; any intentional supplemental markers must be explicit domain input.
- **Viewport-visible set**: the derived intersection of the marker set and current settled bounds. It is not a query result and not selection.
- **Selection surface**: the responsive container for selected domain content: desktop popover/side panel, tablet panel, or mobile bottom sheet. M0 freezes behavior, not final visual form.
- **Preview**: pointer hover or keyboard focus disclosure. Preview is ephemeral and never selection.
- **Detail**: navigation to the canonical entity detail destination, currently `/locations/[slug]`. Expanded sheet content is not a detail route.

### 3.3 Core invariants

1. There is at most one canonical selection.
2. Marker, list item, selection surface, detail link, and URL read the same entity key; none holds a competing selected ID.
3. Selection identity is separate from domain payload. Payload refresh, partial failure, or omission does not manufacture a different identity.
4. Viewport is not selection. Pan, zoom, resize, orientation, clustering, bounds calculation, and location acquisition do not select an entity.
5. Query result set, marker set, and viewport-visible set are separately named and never implicitly substituted for one another.
6. Shared behavior never interprets domain meaning, truth, freshness, completeness, `null`, `false`, missing fields, or empty arrays.
7. Mobile is a first-class behavior target, not a collapsed desktop fallback.
8. URL ownership and history transitions are deliberate and deterministic.
9. No positive evidence is not negative evidence.
10. A provider change or fallback must preserve canonical selection, domain query state, mode, and accessible focus target where that target still exists.

## 4. Marker, preview, selection, cluster, and offscreen behavior

### 4.1 Marker states

Every rendered entity marker has exactly one base interaction state and may have the indicated overlays:

| State | Meaning and behavior |
| --- | --- |
| `default` | Entity is in the marker set, rendered, and not selected or previewed. |
| `preview` | Pointer hover or keyboard focus temporarily identifies an entity. It may expose the domain-supplied accessible label/short preview. It does not update canonical selection, panel content, URL, or history. |
| `selected` | Marker entity key equals canonical selection. It is programmatically exposed as selected and remains interactive. |
| `de-emphasized` | When a selection exists, other entity markers may be visually reduced but remain discoverable, operable, and semantically unchanged. De-emphasis must not imply unavailable, lower quality, stale, or negative. |
| `clustered` | Multiple marker-set entities are represented by an aggregate with a count. A cluster is not an entity and cannot become canonical selection. |
| `offscreen/not rendered` | Entity is outside settled bounds, virtualized, suppressed by provider density, or lacks renderable coordinates. Its identity, list presence, and selection may remain valid. Offscreen is not filtered-out or unavailable. |

Preview is used only where the input modality supports it. Touch has no required hover emulation. Focus preview and selected state can coexist; selected state wins programmatic `selected` semantics.

M1 owns marker shape, color, size, motion, density threshold, and exact cluster visual. Domain code may supply a category/status token only if its domain authority defines the meaning. Shared code must not map evidence fields to marker state.

### 4.2 Single-selection transitions

- Marker activation selects that entity, opens/reveals the responsive selection surface, and ensures the selected marker is not obscured by fixed chrome or the mobile sheet.
- List-item activation selects the same entity, brings its marker into a comfortable visible region without changing query order, and reveals the selection surface.
- Activating another marker/list entity atomically replaces selection; there is never an intermediate two-selected state.
- Re-activating the selected entity creates no URL/history entry. It reveals the selection surface or returns an expanded/hidden surface to the standard selected presentation; it never toggles the entity off.
- Activating bare map background clears preview and canonical selection. It does not alter the query, filters, mode, or current-location fix.
- Panning or zooming clears pointer preview but preserves canonical selection and selection-surface state.
- A selected entity outside the viewport remains selected. The selection surface/list state remains available; no invisible surrogate marker is invented.
- Closing an expanded selection surface returns to the compact selected surface and preserves selection. Closing/dismissing the compact selected surface clears canonical selection.
- `Escape` follows the same two-level order: close expanded content first; otherwise clear selection. If neither exists, it performs no map-domain action.

### 4.3 Cluster behavior

- Activating a cluster fits/zooms toward its members and preserves any existing selection.
- At maximum practical zoom, overlapping members must become individually choosable through provider expansion, spatial separation, or an accessible member chooser. M1 chooses the presentation.
- A cluster containing the selected entity may communicate “contains selected” but is not itself selected.
- Cluster count and accessible name describe quantity only; they do not summarize domain evidence.
- Keyboard activation matches pointer/touch activation.

## 5. Canonical selected identity

The shared state store has one `selectedEntityKey: EntityKey | null`. Adapters resolve domain payload by this key. Marker/list/surface/detail code must not derive selection from array position, nearest distance, first result, current viewport, current location, or payload presence.

For current maps:

```text
EntityKey = {
  domain: "lesson" | "hyrox",
  entityKind: "location",
  publicKey: <stable location slug>
}
```

The route supplies the domain. The shared `selected` query parameter carries `publicKey`; it must not contain a database UUID, coordinates, user position, or serialized payload. The matching detail URL is derived from the resolved entity's canonical public path, not by copying domain payload into the URL.

If payload refresh temporarily fails for a still-valid key, selection remains while the surface shows a shared payload-error boundary containing domain-provided recovery actions. If the domain resolver definitively reports the key invalid, apply the stale-URL transition in section 9.

## 6. Map/list coordination

### 6.1 Sets and ordering

The domain adapter supplies:

1. an ordered query result set;
2. a marker set (normally its mappable subset);
3. optional explicit supplemental markers;
4. entity-key-to-payload resolution;
5. domain result/list content and actions.

Shared behavior derives settled bounds and viewport visibility. It must not decide domain eligibility, ordering, search match, filter meaning, publication, distance policy, or which unlocated results remain in the list.

- Panning/zooming updates only viewport-derived visibility and any “search this area” affordance.
- It does not automatically mutate the query result set, filters, list order, result count, or canonical selection.
- If a domain offers “search this area,” activating it is a domain query action using the settled bounds. Only that explicit action may change the query result set based on bounds.
- A viewport-scoped list mode may show the viewport-visible subset, but it must be clearly labeled as viewport-derived and must preserve relative domain order. It must not be presented as the full query result set.
- A selected entity remains selected when filters/query change if the domain still resolves it as eligible. If it falls outside the new result set, the surface remains available and identifies it as outside current results; shared code does not clear it merely because an array is empty.
- A domain may explicitly invalidate selection when the entity no longer belongs to that domain's eligible publication contract. That is an invalid-entity transition, not an inference from missing payload fields.

### 6.2 Directional coordination

| Action | Required effect |
| --- | --- |
| Marker → list | Select same key. If the item exists in the rendered list, scroll it into view without moving focus away from the activated marker. If not in the current list subset, keep selection and surface; do not reorder/inject silently. |
| Marker → detail surface | Open/reveal selected content for the same key. |
| List → map | Select same key and pan only as needed to reveal the marker in the unobscured map region. Preserve zoom unless the marker cannot be meaningfully located at the current zoom. |
| List → detail surface | Open/reveal selected content for the same key while preserving focus on the initiating list control. |
| Mode switch | Preserve query, ordering, selection, and current viewport. When returning to map, reveal selected marker if one exists. |
| Viewport change | Preserve selection, result order, scroll position, and mode. Update derived visibility only after movement settles. |

Programmatic scrolling must honor reduced motion and must not create a focus jump. List scroll position is ephemeral per mounted route and is not URL state.

Genuine search-product choices remain domain-owned: Lesson query/filter/distance semantics and ordering, HYROX publication/filter semantics and ordering, whether a domain exposes “search this area,” and whether supplemental markers are useful. They may not redefine shared selection/history behavior.

## 7. Responsive selection surfaces and navigation

### 7.1 Desktop

- Map and result list may be simultaneous.
- Initial state has no selection surface unless a valid `selected` URL value is restored.
- Selection reveals a non-modal popover or side panel chosen by M1; map controls and list remain operable.
- Expanded content may use a larger panel or canonical detail navigation. Closing expanded content preserves compact selection; dismissing compact selection clears selection.
- A second entity selection replaces panel content in place and pushes the new selection history state.

### 7.2 Tablet

- The same state model applies whether layout is side-by-side or stacked.
- Selection content must not permanently cover the selected marker or all map controls.
- Layout breakpoint changes do not clear selection, restart a query, or create history.

### 7.3 Mobile

- When map is the active exclusive view, selection uses a bottom sheet as the primary surface.
- First selection opens the partial sheet. Expanding to full sheet is ephemeral presentation state. Collapsing full returns to partial and keeps selection. Dismissing partial clears selection.
- A second marker selection updates the same sheet to the new key; it does not stack sheets.
- Touches beginning inside the map operate the map; touches beginning on the sheet drag handle/designated sheet chrome operate the sheet. A pan/drag exceeding the implementation's tap tolerance must not activate a marker.
- The sheet and map honor safe-area insets. The partial sheet leaves enough unobscured map to understand selection and operate essential controls.
- The browser Back action follows URL history: it reverses the latest canonical selection/mode/domain/detail navigation. Sheet expansion itself adds no history, so Back from an expanded selected sheet dismisses the selection history state rather than creating an expansion-only stop.
- Full entity detail is canonical route navigation. Back returns to the map route and restores its selection/mode/query state.
- Search/filter keyboard appearance must keep the focused control visible, must not trigger map resize selection, and must not write transient viewport values to history.
- Orientation/resize preserves selection, query, mode, and location lifecycle. A full sheet may normalize to partial after reflow if needed to prevent trapping; that normalization is ephemeral and creates no history.

The shared interaction target expectation is at least 44 × 44 CSS pixels for marker activation areas, cluster controls, locate/mode/close controls, and sheet drag/close affordances. Visible glyphs may be smaller if the interactive area meets the expectation and does not overlap adjacent targets.

## 8. Current location lifecycle

Location authorization and position-fix state are separate from entity selection and domain evidence.

### 8.1 States

| State | Meaning |
| --- | --- |
| `not_requested` | No location request has been made in this visit. This is the required first-load state. |
| `requesting` | First user-initiated acquisition is pending. |
| `granted` | Permission is known granted; a usable fix may or may not yet exist. |
| `denied` | Permission is denied. This is not a map/data empty state. |
| `unavailable` | API unsupported, device setting unavailable, timeout, or acquisition error with no usable fix. |
| `obtained` | A usable position and provider timestamp exist. |
| `stale` | The last usable fix is older than five minutes or the provider marks it unsuitable for the requested refresh. It may remain visible as stale but cannot be described as current. |
| `refreshing` | A user-initiated refresh is pending while an old obtained/stale fix may remain visible. |

An acquisition error after a prior fix preserves that fix as `stale` and exposes retry; it does not erase it or become an entity/data error.

### 8.2 Required behavior

- Never request browser permission automatically on first render, hydration, map load, mode switch, or domain change.
- The locate control is an explicit user gesture. First activation moves `not_requested → requesting` and invokes the platform API.
- Success records permission/fix, displays a visually and semantically distinct user-location marker, and recenters to an unobscured region around the fix. It does not select the nearest entity, alter filters, or reorder results unless the domain separately owns an explicitly activated distance query.
- Repeat activation with a fresh obtained fix recenters without a new permission prompt. Repeat activation with a stale fix requests refresh and retains the stale marker until success.
- Known denial does not repeatedly invoke the API. It gives concise settings guidance and leaves map/query/selection unchanged.
- Unsupported, timeout, or transient acquisition failure leaves map/query/selection unchanged, distinguishes the error from denial, and allows retry when meaningful.
- User panning after locate is respected. The map does not snap back until locate is activated again.
- Location marker label/state never looks like an entity marker or opens an entity selection surface.
- Exact or approximate user coordinates, location permission, accuracy, timestamp, and location-derived center must never enter URL, history state, analytics payload, logs, persisted storage, or domain payload under M0.

## 9. URL and history authority

Existing route paths, Lesson `/search` keys (`q`, `weekday`, `timeRange`, `durationRange`, `brand`, `area`, `page`), anchors, canonical metadata, and route failure rules remain authoritative.

Parameter names belong in M0 only for cross-domain shared map state. M0 reserves:

- `selected=<publicKey>` for canonical selected entity;
- `view=map|list` only on responsive surfaces that expose an exclusive map/list switch.

These additions do not rename or reinterpret existing query keys. Domain filters/search retain their existing or separately reviewed names. `selected` and `view` are UI restoration state and remain excluded from SEO canonical URLs, as filters already are on `/search`.

| State | Classification | URL/history rule |
| --- | --- | --- |
| Domain | Canonical/restorable | Owned by canonical route (`/` Lesson entry, `/training/hyrox` HYROX). Never duplicated as a query key. |
| Selected entity | Canonical/restorable UI state | `selected=<stable publicKey>`. Explicit select/replace/clear uses `pushState`; repeated selection is a no-op. |
| Exclusive map/list mode | Canonical/restorable UI state when control exists | `view=map|list`. Explicit switch uses `pushState`. Omit when simultaneous/default layout makes it irrelevant. |
| Filters/search | Domain-owned canonical/restorable UI state where authority defines it | Preserve current Lesson search keys and domain behavior. M0 neither invents HYROX filter keys nor converts client-local filters automatically. Committed filter/search actions use the route contract; transient typing may use `replaceState`. |
| Center and zoom | Ephemeral | Never encoded by M0. Pan/zoom and programmatic reveal create no history. |
| Full detail | Canonical/restorable navigation | Use canonical detail route, currently `/locations/[slug]`; normal navigation pushes history. |
| Current location/fix/accuracy | Must not persist | Never URL/history/storage. A location-derived center is also excluded. |
| Sheet expansion, preview, hover, focus, list scroll, loading | Ephemeral | Never URL/history. |

### 9.1 Restoration and history transitions

- Direct load parses domain route, domain query state, `view`, then `selected`. Resolve the selected public key independently of viewport and list pagination.
- A valid restored selection is selected before presentation settles; the map reveals it without creating a new history entry.
- Back/Forward restores the full canonical state represented by that history entry. Restoration uses no additional push/replace call.
- Selecting A then B creates deterministic states A then B. Back restores A; another Back restores the prior unselected state. Clearing selection by background/close creates an explicit unselected entry, so Back restores the prior selection.
- Mode switch preserves selection and domain query state. Back restores the prior mode and same selection.
- Domain change is canonical route navigation. Selection is not carried across domains by default. A `selected` value on the destination is restored only if the destination domain independently resolves it as eligible.
- Invalid, stale, malformed, or ineligible `selected` state shows a concise non-domain error/notice, clears selection, and removes only `selected` with `replaceState`. It must not fabricate the first result, infer why the entity is absent, or create a Back loop.
- If an entity becomes invalid after it was selected during the visit, apply the same replace transition and move focus to the result heading or map container.

## 10. Loading, empty, partial, and error behavior

States are independent; one must not mask another.

| Boundary | Required distinction |
| --- | --- |
| Initial route/domain data | Show structural loading for domain results and selection resolution. Do not imply zero results. |
| Map provider/tiles | Keep list/query/selection usable where possible. A tile/provider error is not a domain-data error; provider fallback preserves canonical state. |
| Domain data failure | Show domain-data error and domain-provided retry/recovery. Do not report zero entities. |
| Partial domain data | Preserve successfully loaded result/list content, identify incomplete state, and avoid silently presenting partial count as complete. Domain decides truth/completeness wording. |
| Successful zero query results | Show a query empty state. It is not map-provider failure, missing coordinates, geolocation failure, or absence of HYROX evidence. |
| Results with no mappable coordinates | Keep result list available and state that map placement is unavailable. Do not convert to zero results. |
| Network error with stale cached data | Keep stale data if policy permits and distinguish it from current/complete data. Shared layer renders only a domain-supplied presentation status. |
| Geolocation denial/error | Local to locate control/status; never replaces domain results. |
| Stale URL entity | Follow section 9 invalid-selection behavior while leaving valid domain results usable. |

Loading, error, boolean, `null`, missing field, and empty collection are technical/data shapes, not domain conclusions. In particular, “zero query results” describes the active query only and says nothing about whether a HYROX facility has equipment or capability support.

## 11. Accessible behavior

- Every map workflow has a list/control equivalent; the visual map is never the only way to select or open detail.
- Entity markers and clusters are keyboard operable with meaningful accessible names supplied by the domain. `Enter` and `Space` activate them. Standard map pan/zoom keyboard controls remain available.
- Selected marker/list control exposes programmatic selected state (`aria-pressed`, `aria-selected`, or the semantically correct equivalent) and a non-color-only visible cue.
- Cluster names include member count; location marker is explicitly announced as current/stale user location and not as a facility.
- Pointer hover and keyboard focus show equivalent preview information where preview exists. Preview content is not the sole source of required actions.
- Focus stays on the initiating marker/list control after selection. Opening a modal/full-sheet state follows the appropriate focus-trap pattern; closing returns focus to the initiating control when it still exists.
- If rerender/virtualization removes the focused control, focus moves predictably to the selected surface heading, result heading, or map container in that order; never to document body without notice.
- `Escape` follows the deterministic close behavior in section 4. An explicit close control is always present on dismissible surfaces.
- Status changes that matter are announced politely; blocking data errors use alert semantics. Panning/bounds updates and every marker entering/leaving the viewport are not live-announced.
- Reduced-motion preference disables fly/scroll/sheet animation while preserving final state and focus.
- Touch/interaction targets follow the 44 × 44 CSS-pixel expectation in section 7.3.
- State must not rely on color, motion, marker size, or map position alone. Text, icon/shape, programmatic state, or list correspondence supplies a second channel.

## 12. Shared versus domain ownership

| Concern | Shared M0/M1 behavior or presentation ownership | Lesson ownership | HYROX/H3 ownership |
| --- | --- | --- | --- |
| One selection, transitions, URL/history | M0 behavior | Supplies eligible Lesson entity key | Supplies eligible HYROX entity key |
| Marker interaction states, cluster action, offscreen persistence | M0 behavior; M1 visual/provider implementation | May supply domain category token | May supply only H3-authorized domain token/status |
| Marker meaning/content | Renders supplied accessible/presentation data without inference | Lesson label/category meaning | Official/evidence/freshness meaning and permitted labels |
| Query result eligibility | No | Lesson search/filter/latest-period rules | HYROX publication/positive-evidence rules |
| Ordering | Preserves supplied order/relative order | Lesson ordering/distance policy | HYROX prefecture/city/name/ID order |
| Marker set vs query set | Enforces explicit separate inputs; derives viewport set | Decides intentional Lesson supplemental markers | Decides HYROX marker cohort from publication/query |
| “Search this area” | Settled-bounds action mechanics if present | Decides whether/how bounds affect Lesson query | Decides whether/how bounds affect HYROX query |
| Selection surface behavior | M0 responsive open/close/replace semantics; M1 container presentation | Lesson fields, hierarchy, actions, copy | HYROX panel fields, equipment/capability sections, disclosure, actions, copy |
| Current location | M0 permission/fix/privacy lifecycle; M1 presentation | Decides separately activated distance-query semantics | Decides whether domain offers distance query at all |
| Loading/error container | M0 distinctions; M1 visuals | Lesson recovery/completeness semantics | HYROX fail-closed/error/completeness semantics |
| Freshness | Shared renders a domain-provided status only | Lesson policy and status production | H3 policy and status production |
| Empty/null/false/arrays | Never interpreted | Lesson semantics | H3 positive/unknown semantics; no-negative inference |
| Detail destination/content | Shared navigation behavior | Lesson schedule content review | HYROX semantic content review |
| Exact tokens/colors/shapes/breakpoints | M1/U1 within this behavior | Domain visual composition | Domain visual composition and H3 labels |

The domain payload is opaque to the shared behavior layer. Shared code may check only transport/state facts explicitly supplied by the adapter, such as `isLoading`, `hasError`, `isEntityResolvable`, and coordinates suitable for rendering. It must never inspect an evidence array/boolean to generate copy, hide/show a semantic section, style a status, filter, rank, or select.

## 13. Deterministic interaction state machine

Let state be:

```text
S = {
  domainRoute,
  domainQuery,
  viewMode,
  selectedEntityKey,
  surface: hidden | compact | expanded,
  viewport,
  locationLifecycle
}
```

| Event | Preconditions | Next state | History |
| --- | --- | --- | --- |
| Direct load | URL parsed | Restore route/query/view; resolve `selected`; valid selection → `compact`, otherwise invalid transition | None during restoration; invalid key is removed with replace |
| Marker/list select A | A eligible | `selected=A`, `surface=compact`; reveal without changing query/order | Push `selected=A` |
| Select A again | `selected=A` | Preserve A; reveal/normalize to `compact` | None |
| Select B | `selected=A`, B eligible | Atomically `selected=B`, `surface=compact` | Push `selected=B` |
| Cluster activate | Any | Preserve selection; change viewport to reveal members | None |
| Pan/zoom/resize | Any | Preserve selection/surface/query; update settled viewport-derived set | None |
| Bare background tap | Selection or preview exists | Clear preview; `selected=null`, `surface=hidden` | Push removal of `selected` |
| Expand selection | Selected | `surface=expanded` | None |
| Close expanded | Selected, expanded | `surface=compact` | None |
| Close compact / Escape | Selected, compact | `selected=null`, `surface=hidden` | Push removal of `selected` |
| Open full detail | Selected | Navigate to canonical detail route | Normal route push |
| Browser Back/Forward | History entry exists | Restore exactly that canonical route/query/view/selection; choose compact selected surface | None during restoration |
| Mode switch | Control exists | Preserve selection/query/viewport; set requested mode and reveal selection when map returns | Push `view` |
| Domain change | Explicit route navigation | New domain query; clear selection unless destination URL explicitly supplies valid `selected`; location permission/fix may remain in memory but is never copied into URL | Normal route push |
| Query/filter commit | Domain action | Domain result/marker sets update; preserve selection if still eligible | Domain route contract |
| Selected key becomes invalid | Resolver is definitive | `selected=null`, `surface=hidden`; announce stale selection without inferring cause | Replace removal of `selected` |
| Locate | `not_requested`/stale/error | Request/refresh fix; preserve selection/query | None |
| Locate success | Requesting/refreshing | `obtained`; recenter viewport; preserve selection/query | None |

## 14. H3-10A semantic guardrails

These are hard acceptance requirements for shared map behavior and M1:

- Positive HYROX equipment/capability means only current published positive evidence supplied by reviewed H3 authority.
- Shared code does not inspect or interpret `equipment_slugs`, `capability_slugs`, `class_available`, `open_training_available`, evidence arrays, booleans, timestamps, or missing fields.
- Empty arrays, `false`, `null`, absent fields, missing payload, loading, failure, stale claims, and no positive evidence must never become absent, unavailable, unsupported, negative, “none,” “not confirmed,” “researching,” or any equivalent user-facing claim.
- Zero query results is not absence of HYROX positive evidence.
- A source error, 404, missing support, stale record, or omitted marker is not a negative facility fact.
- No-positive equipment/capability sections are omitted according to H3-10A. M0 does not design or supply the omission predicate, section, labels, badges, disclosure, filters, or freshness meaning.
- Clustering, de-emphasis, offscreen status, selection, empty result state, and error visuals must not imply evidence quality or availability.
- H3-10C may layer H3-authorized selected content later without changing this contract.

## 15. Explicit non-goals

M0 does not:

- implement or rewrite runtime maps;
- choose final marker design, colors, tokens, type, spacing, AppShell, Header, or generic primitives;
- implement M1, U1, Lesson migration, HYROX Map, H3-10B, or H3-10C;
- define Lesson search/filter/order/freshness meaning;
- define HYROX equipment/capability predicates, presentation, filters, labels, disclosure, freshness, or evidence DTO;
- authorize a global Map route, a global Saved concept, new favorites, or facility semantic changes;
- change routes beyond reserving shared UI-state parameter semantics for future reviewed implementation;
- change database/schema/RPC/Supabase, ingestion/crawlers, analytics, production data, or deployment;
- require Apple Maps, Leaflet, clustering library, UI framework, or a specific provider.

## 16. Downstream choices and readiness

### 16.1 M0-frozen

All invariants, transitions, URL/history classifications, privacy rules, responsive surface responsibilities, current-location lifecycle, accessible behavior, and ownership boundaries in this document.

### 16.2 Downstream visual choices (M1/U1)

Marker/cluster appearance and density threshold; desktop popover versus side-panel visual treatment; animation curves; exact breakpoints; sheet dimensions; visual tokens; provider-specific accessible implementation; maximum-zoom overlap presentation. These choices may not change M0 transitions.

### 16.3 Domain-owned decisions

- Lesson: query/filter/distance behavior, marker/query cohort policy, ordering, list/panel fields/actions, “search this area,” and freshness meaning.
- HYROX/H3: publication/query cohort, positive-evidence DTO and predicates, equipment/capability presentation and omission, labels/disclosure, badge/freshness meaning, panel fields/actions, and whether future HYROX search exposes bounds/distance.
- Route owners: implementation timing for currently client-local domain filters. Existing keys must be preserved; any new domain key needs its own reviewed route contract.

### 16.4 Genuinely blocked items

None block M0. Exact M1 visuals depend on U1 and M0. Production H3-10C remains gated by U1 and M1 and must consume H3-10A/H3 domain semantics.

M0 outcome:

- `M1_READY_FROM_M0`
- `H3_10C_NOT_STARTED`
- `H3_10C_STILL_GATED_BY_U1_AND_M1`
- `NO_RUNTIME_OR_PRODUCTION_CHANGE`

`M0 — SHARED MAP BEHAVIOR CONTRACT COMPLETE`
