# Lesson Map scope ranking repair evidence

## Contract exercised

- Nearby scope keeps the active Lesson proximity origin for ordering and distance filtering.
- Map scope keeps the same filtered viewport candidate set, then orders it by the current viewport center.
- The viewport center is transient and never replaces the proximity origin.
- Map-scope cards disclose `地図中心から約Xkm`; nearby cards retain the existing proximity distance.
- Returning to `近い順で見る` preserves the camera and restores proximity-origin ordering.

## Screenshots

- `desktop-map-scope.png`: desktop viewport displaced from the Tokyo Station origin. The top cards favor the viewport center (Kamata / Omorimachi) and disclose `地図の中心に近い順` plus per-card map-center distances.
- `desktop-nearby-restored.png`: the same camera after `近い順で見る`; the list returns to `東京駅から近い10店舗` and Ginza-area proximity results.
- `map-scope-390.png`: 390px responsive map-scope state.
- `map-scope-430.png`: 430px responsive map-scope state, including the map-scope list heading.

The browser's real geolocation permission was deliberately not requested for evidence capture. The existing acquired-location camera-only return behavior and absence of reacquisition are covered by `lesson-proximity.test.ts` and `map-runtime-conformance.test.ts`.

## Validation

- Focused map-scope / P4 regression: PASS
- Full test suite: 269 passed, 0 failed
- Typecheck: PASS
- Lint: PASS
- Production build: PASS (648 static pages generated)
- `git diff --check`: PASS
- S1 regression: PASS in full suite
- Map-purpose index regression: PASS in full suite
- HYROX regression: PASS in full suite
- Migration delta: none
- Dependency delta: none

Exact Preview URL is recorded after the candidate branch deployment completes.
