import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  getMapMarkerPresentation,
  resolveMapMarkerState,
  type MapMarkerState,
} from "@/components/map/map-marker-presentation";

const presentationSource = readFileSync(
  new URL("../../components/map/map-presentation.tsx", import.meta.url),
  "utf8",
);
const presentationStyles = readFileSync(
  new URL("../../components/map/map-presentation.module.css", import.meta.url),
  "utf8",
);
const locationMapSource = readFileSync(
  new URL("../../components/map/location-map-section.tsx", import.meta.url),
  "utf8",
);
const leafletMapSource = readFileSync(
  new URL("../../components/map/leaflet-gym-map.tsx", import.meta.url),
  "utf8",
);
const appleMapSource = readFileSync(
  new URL("../../components/map/apple-gym-map.tsx", import.meta.url),
  "utf8",
);

test("M1 marker API is domain-neutral and limited to M0 states", () => {
  const states: MapMarkerState[] = [
    "default",
    "preview",
    "selected",
    "de-emphasized",
    "clustered",
    "offscreen",
  ];

  assert.deepEqual(states.map((state) => getMapMarkerPresentation(state).state), states);
  for (const forbidden of ["equipment", "capability", "freshness", "confidence", "lesson", "hyrox"]) {
    assert.doesNotMatch(presentationSource, new RegExp(forbidden, "i"));
  }
});

test("selected marker is immediate, semantic, and not color-only", () => {
  assert.equal(
    resolveMapMarkerState({ selected: true, previewed: true, hasSelection: true }),
    "selected",
  );
  assert.equal(
    resolveMapMarkerState({ selected: false, previewed: true, hasSelection: true }),
    "preview",
  );
  assert.equal(
    resolveMapMarkerState({ selected: false, previewed: false, hasSelection: true }),
    "de-emphasized",
  );

  const selected = getMapMarkerPresentation("selected");
  const standard = getMapMarkerPresentation("default");
  assert.ok(selected.radius > standard.radius);
  assert.ok(selected.weight > standard.weight);
  assert.equal(selected.glyphText, "✓");
  assert.match(leafletMapSource, /aria-pressed/);
  assert.match(appleMapSource, /aria-pressed/);
  assert.match(leafletMapSource, /data-marker-state/);
  assert.match(appleMapSource, /data-marker-state/);
});

test("keyboard focus keeps selected semantics and follows the marker silhouette", () => {
  assert.match(
    presentationStyles,
    /\.leafletMarkerFocusTarget:focus-visible,[\s\S]*apple-gym-map-marker:focus-visible[\s\S]*outline: none/,
  );
  assert.match(presentationStyles, /drop-shadow\(0 0 1px var\(--color-focus\)\)/);
  assert.doesNotMatch(
    presentationStyles,
    /\.leafletMarkerFocusTarget:focus-visible,[\s\S]*apple-gym-map-marker:focus-visible[\s\S]*outline: 3px/,
  );
  assert.match(
    leafletMapSource,
    /<CircleMarker[\s\S]*?className=\{presentationStyles\.leafletMarkerFocusTarget\}[\s\S]*?pathOptions=/,
  );
  assert.doesNotMatch(
    leafletMapSource,
    /className=\{[^}]*selected[^}]*\}/,
  );
  assert.doesNotMatch(
    leafletMapSource,
    /pathOptions=\{\{[\s\S]*?className:/,
  );
  assert.match(leafletMapSource, /aria-pressed", String\(selected\)/);
  assert.match(appleMapSource, /aria-pressed", String\(selected\)/);
});

test("selection panel accepts opaque domain children and owns no domain semantics", () => {
  assert.match(presentationSource, /type MapSelectionSurfaceProps[\s\S]*children: ReactNode/);
  assert.match(presentationSource, /\{children\}/);
  assert.match(presentationSource, /closeLabel/);
  assert.doesNotMatch(presentationSource, /slug|address|official|program|query|filter/i);
});

test("location presentation consumes the frozen lifecycle without acquiring location", () => {
  for (const state of [
    "not_requested",
    "requesting",
    "granted",
    "denied",
    "unavailable",
    "obtained",
    "stale",
    "refreshing",
  ]) {
    assert.match(presentationSource, new RegExp(state));
  }
  assert.doesNotMatch(presentationSource, /navigator\.geolocation|permissions\.query/);
  assert.match(locationMapSource, /CurrentLocationControl/);
});

test("loading empty and error presentation renders only supplied copy", () => {
  assert.match(presentationSource, /kind: "loading" \| "empty" \| "error"/);
  assert.match(presentationSource, /children: ReactNode/);
  assert.doesNotMatch(presentationSource, /no results|not found|設備|レッスン|店舗がありません/i);
});

test("M1 does not invent URL state and preserves M0-R1 selection state", () => {
  assert.doesNotMatch(presentationSource, /URL|searchParams|pushState|replaceState|selected=/);
  assert.doesNotMatch(leafletMapSource, /pushState|replaceState|searchParams/);
  assert.doesNotMatch(appleMapSource, /pushState|replaceState|searchParams/);
  assert.match(locationMapSource, /buildMapSelectionHref/);
  assert.match(locationMapSource, /resolveMapSelection/);
});

test("responsive panel becomes a partial sheet while selection stays canonical", () => {
  assert.match(presentationStyles, /@media \(max-width: 640px\)[\s\S]*\.mobileSurface[\s\S]*bottom: 8px/);
  assert.match(presentationStyles, /max-height: min\(58%, 340px\)/);
  assert.match(presentationStyles, /env\(safe-area-inset-bottom\)/);
  assert.match(locationMapSource, /selectedLocationId/);
  assert.doesNotMatch(locationMapSource, /mobileSelected|sheetSelected|panelSelected/);
});

test("future H3-10C can compose M1 without HYROX props or a presentation fork", () => {
  assert.match(presentationSource, /MapSelectionSurface/);
  assert.match(presentationSource, /MapChrome/);
  assert.match(presentationSource, /MapStateNotice/);
  assert.doesNotMatch(presentationSource, /Hyrox|equipment|capability|freshness|evidence/i);
  assert.doesNotMatch(leafletMapSource, /Hyrox|equipment|capability|freshness|evidence/i);
  assert.doesNotMatch(appleMapSource, /Hyrox|equipment|capability|freshness|evidence/i);
});
