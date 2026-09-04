# HYROX marker/list focus repair

Status: candidate ready for Human interaction review. No main merge or Production promotion.

## Cause traced before implementation

`HyroxDiscovery` passed `(locationId) => handleSelectLocation(locationId, true)` to both map providers. The second argument enables `revealInCompactList`: a requestAnimationFrame callback calls `document.getElementById('hyrox-map-list-' + locationId).scrollIntoView({block: 'nearest', behavior: ...})`. The compact list uses `overflow-y: auto`; scrolling the card into view can scroll both that independent container and the document to the lower list. This is explicit HYROX synchronization, not programmatic focus.

Both Leaflet click/Enter/Space and Apple marker activation call the supplied selection callback. HYROX validates the id, clears current-location camera override and selection notices, updates `selectedLocationId`, and pushes the public slug into `?selected=`. Derived state feeds the map, active card styling, and existing mobile/desktop `MapSelectionSurface` content. No selected-facility effect reveals/focuses a card. There are no card refs, virtualization, anchor defaults, or programmatic `focus()` in this path. Card lookup is exclusively by DOM id. URL updates use History API, preserve the hash, and do not navigate an anchor. Initial load and popstate restore selection through `resolveMapSelection`; invalid slugs are cleared with replaceState.

The shared detail surface is an accessible named region with polite live content and a labeled close button; it does not autofocus or implement modal focus trapping. Marker keyboard handlers prevent default for Enter/Space. Close and Escape clear selection and its URL parameter. The Leaflet camera controller explicitly skips recentering when selection is cleared; Apple has its own corresponding cleared-selection guard. Existing selection camera behavior stays intact.

Lesson's `LocationMapSection` has its own selection callback without HYROX's reveal option. Shared provider, marker, presentation, camera, and URL utilities are unchanged. No Lesson synchronization is removed.

## Narrow repair

Pass `handleSelectLocation` directly as HYROX's map callback. The optional reveal flag therefore remains false for marker activation. No source abstraction or shared primitive change is needed.

Compact-list click and Enter/Space keep their existing no-reveal selection behavior. Full `HyroxFacilityCard` map actions retain `handleSelectLocation(id, true)` and the explicit map-heading scroll. Active-card styling, URL/deep-link authority, detail routes/content, provider, current-location behavior, and map camera are unchanged.

## Regression coverage

`hyrox-map-interaction.test.ts` executes the actual transpiled component using deterministic hook/DOM adapters, without new dependencies. It checks first and second marker selection, both detail surfaces and selected content, active-card styling, URL updates/clearing, close, absence of card focus and list scroll calls, distinct compact/full-list behavior, initial deep-link restoration and popstate. These callback checks do not substitute for browser layout measurements.

Exact Preview measurements and final validation results follow below.

## Verified candidate and exact Preview

- Application candidate: `ae84390256c0caf81d41145b77b6e22be3063dcf`.
- Branch: `codex/hyrox-map-marker-list-focus-repair`.
- Exact Preview: https://gymmap-9sfjal9x4-tes-projects-f349e739.vercel.app/training/hyrox
- Vercel deployment: `H8hqPGU97ghh3LEWqK3yA8rzp2nG`, Preview environment; GitHub status success.
- Draft review PR: https://github.com/zxexaxl/gymmap/pull/1
- Evidence-only follow-up does not change application code from the tested candidate.

## Browser interaction evidence (2026-09-04)

Chrome, existing OpenFreeMap/Leaflet provider, nationwide 82 facilities. Each measured sequence starts after deep-link restoration to F45 Hamamatsucho, close, and manual setup of a nonzero list offset. This establishes adjacent markers for consecutive taps without intervening camera controls. The measured sequence itself uses coordinate taps on F45, then Gold's Gym Hamamatsucho, then close ×; no intervening page/list scrolls, zoom controls, or locator-induced focus setup. Both immediately-open and settled states were recorded.

| Viewport | Before page/list | First open + settled | Second open + settled | Close |
| --- | --- | --- | --- | --- |
| 390 × 844 | 1026.5 / 506.5 | 1026.5 / 506.5 | 1026.5 / 506.5 | 1026.5 / 506.5 |
| 430 × 932 | 1012.5 / 512.5 | 1012.5 / 512.5 | 1012.5 / 512.5 | 1012.5 / 512.5 |
| 1440 × 1000 | 862.5 / 500 | 862.5 / 500 | 862.5 / 500 | 862.5 / 500 |

All values are CSS pixels: `window.scrollY / .map-location-list.scrollTop`. Deltas are exactly zero. The list viewport changes height when detail appears (mobile 488→476, desktop 588→309→169); existing layout behavior is preserved while scrollTop remains constant. The active element after each tap is the selected SVG marker, never a list card. Close clears `?selected=` and both selected detail surfaces. The desktop selected-marker center before and after close was exactly `(500, 294.921875)`; screenshots also show the preserved map camera.

Screenshots and machine-readable transcribed measurements: `artifacts/hyrox-map-marker-list-focus-repair/`. For each width, `before`, `first-open`, `first-settled`, `second-open`, `second-settled`, and `close` PNGs capture the same page position. `measurements.json` records the measured sequence. Additional nationwide initial-selection evidence is in `nationwide-first-selection.json`.

Native keyboard Enter, Space, and Escape were verified after focus was established on the marker: page `645.5`, list `500` throughout, accessible detail/URL updates preserved; native Escape retains marker focus. The labeled 44px close button and polite live detail region remain intact. **Measurement caveat:** an earlier automation locator `press` call includes its own focus setup and moved the page (862.5→667.5→645.5), so those exploratory screenshots are not evidence of scroll-preserving native activation. Native key events were subsequently tested separately from that setup, including a settled post-Space reading. No focus-management implementation changes were made. Browser console warnings/errors: none during the captured checks. Apple provider runtime and screen-reader speech output were not separately exercised; their shared implementations are unchanged.

Full-list “地図で見る” was also exercised: it selected F45, retained focus on the originating action, and revealed the compact-list card (`scrollTop=1464`, page `1484.5`). Its existing competing scroll calls are preserved, not redesigned. Compact-list and deep-link behavior are covered by the focused callback tests. Lesson/shared code has zero diff and the shared regression suite passes; a separate Lesson browser sequence was not performed.

## Final validation

- `npm test`: 322/322 pass.
- Focused `hyrox-map*.test.ts` and `map*.test.ts`: 53/53 pass.
- New callback test negative control: restoring the original callback fails the marker no-scroll test, with the other two tests passing.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run build`: pass using exact lockfile dependencies and existing project environment.
- `git diff --check`: pass.
- Migration delta = 0; dependency/lockfile delta = 0; shared map/Lesson/data/coordinate/detail-route delta = 0.
- Build-generated sitemap and TypeScript cache changes were excluded from the candidate.

## Review boundary

GYMMAP_HYROX_MAP_MARKER_LIST_FOCUS_REPAIR_CANDIDATE_READY
HYROX_MAP_MARKER_DETAIL_OPEN_PRESERVED
HYROX_MAP_TO_LIST_AUTO_SCROLL_REMOVED
HYROX_MAP_TO_LIST_AUTO_FOCUS_REMOVED (no programmatic card focus existed; absence verified)
HYROX_PAGE_SCROLL_POSITION_PRESERVED
HYROX_LIST_SCROLL_POSITION_PRESERVED
HYROX_SECOND_MARKER_SELECTION_PASS
HYROX_CLOSE_POSITION_PRESERVED
HYROX_URL_SELECTION_AUTHORITY_PRESERVED
HYROX_A11Y_FOCUS_BEHAVIOR_PASS (native keyboard/semantic checks; not a screen-reader audit)
LESSON_MAP_BEHAVIOR_UNCHANGED (zero implementation diff; regression suite)
HYROX_82_FACILITY_AUTHORITY_PRESERVED
NO_DB_MIGRATION
NO_NEW_DEPENDENCY
READY_FOR_HUMAN_HYROX_MAP_INTERACTION_REVIEW
NO_MAIN_MERGE
NO_PRODUCTION_PROMOTION
