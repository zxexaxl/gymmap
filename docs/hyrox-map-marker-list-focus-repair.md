# HYROX marker/list focus repair

Status: candidate verification in progress. No main merge or Production promotion.

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

Exact Preview measurements and final validation results are recorded after deployment.
