# M1-RT1 production focus hook evidence

Captured from the repository-authoritative Next.js production build for the bounded Leaflet marker focus-hook repair.

## Before

- `production-before-1440-native-rectangular-focus.png`: accepted candidate `0e0621d11d311526deaf81970f2b8635ecdd6031` before repair. The focused Leaflet `path.leaflet-interactive` has no M1 hook and uses the browser-native `rgb(0, 95, 204) auto 5px` rectangular outline.

## After — production build runtime

- `production-1440-default-focus.png`: default marker with keyboard focus.
- `production-1440-selected.png`: selected marker without keyboard focus.
- `production-1440-selected-focus.png`: selected marker with keyboard focus.
- `production-390-selected-focus-partial-sheet.png`: selected marker focus with the 390px partial sheet.
- `production-430-selected-focus-partial-sheet.png`: selected marker focus with the 430px partial sheet.

For both default and selected focus, the actual production element is an SVG `path` with `role="button"`, `tabindex="0"`, the stable CSS Modules `leafletMarkerFocusTarget` hook, `:focus-visible`, and the marker-following focus filter. The computed outline style is `none`; the native rectangular outline is absent.

## Dev comparison

- `dev-1440-selected-focus.png`: lifecycle-settled dev selected focus. Hook, focus-visible state, computed outline/filter, ARIA state, and marker geometry match production materially.
