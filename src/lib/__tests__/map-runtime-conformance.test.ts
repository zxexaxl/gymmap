import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildMapSelectionHref,
  resolveMapSelection,
} from "@/components/map/map-runtime-state";

const locationMapSource = readFileSync(
  new URL("../../components/map/location-map-section.tsx", import.meta.url),
  "utf8",
);
const leafletMapSource = readFileSync(
  new URL("../../components/map/leaflet-gym-map.tsx", import.meta.url),
  "utf8",
);

test("M0-R1 keeps location not requested until the explicit locate action", () => {
  assert.match(
    locationMapSource,
    /useState<LocationLifecycleState>\("not_requested"\)/,
  );
  assert.doesNotMatch(
    locationMapSource,
    /useEffect\([\s\S]{0,500}requestCurrentPosition\(\)/,
  );
  assert.match(
    locationMapSource,
    /onClick=\{\(\) => \{\s*void requestCurrentPosition\(\);\s*\}\}/,
  );
  assert.match(locationMapSource, /navigator\.geolocation\.getCurrentPosition/);
});

test("M0-R1 location success changes only location viewport state", () => {
  const successCallback = locationMapSource.match(
    /navigator\.geolocation\.getCurrentPosition\(\s*\(position\) => \{([\s\S]*?)\n\s*\},\s*\n\s*\(error\)/,
  )?.[1];

  assert.ok(successCallback);
  assert.match(successCallback, /setCurrentPosition\(nextPosition\)/);
  assert.match(successCallback, /setMapFocusCenter\(nextPosition\)/);
  assert.doesNotMatch(successCallback, /setSelectedLocationId|setListScope|setProgramQuery|setBrandFilter|setPrefectureFilter|setDistanceFilter/);
  assert.doesNotMatch(locationMapSource, /findNearestLocationId/);
});

test("M0-R1 never derives initial selection from the first result", () => {
  assert.match(
    locationMapSource,
    /mappableLocations\.find\(\(location\) => location\.id === selectedLocationId\) \?\? null/,
  );
  assert.doesNotMatch(locationMapSource, /setSelectedLocationId\(mappableLocations\[0\]/);
  assert.doesNotMatch(locationMapSource, /selectedLocationId\) \?\? mappableLocations\[0\]/);
  assert.match(locationMapSource, /selectionEntities\.length === 0/);
  assert.match(locationMapSource, /\(\) => locations\.map\(\(location\) => \(\{ id: location\.id, publicKey: location\.slug \}\)\)/);
});

test("selected URL state uses the stable public key and preserves unrelated Lesson URL state", () => {
  const entities = [
    { id: "internal-1", publicKey: "lesson-shibuya" },
    { id: "internal-2", publicKey: "lesson-shinjuku" },
  ];

  assert.deepEqual(resolveMapSelection("?selected=lesson-shibuya", entities), {
    kind: "valid",
    selectedId: "internal-1",
  });
  assert.deepEqual(resolveMapSelection("?selected=missing", entities), {
    kind: "invalid",
    selectedId: null,
  });
  assert.deepEqual(resolveMapSelection("?q=yoga", entities), {
    kind: "none",
    selectedId: null,
  });

  assert.equal(
    buildMapSelectionHref(
      "https://gymmap.example/?q=yoga&brand=example#map-section",
      "lesson-shinjuku",
    ),
    "/?q=yoga&brand=example&selected=lesson-shinjuku#map-section",
  );
  assert.equal(
    buildMapSelectionHref(
      "https://gymmap.example/?q=yoga&selected=lesson-shinjuku#map-section",
      null,
    ),
    "/?q=yoga#map-section",
  );
});

test("selection history restores with popstate and never persists ephemeral map state", () => {
  assert.match(locationMapSource, /history\.pushState/);
  assert.match(locationMapSource, /history\.replaceState/);
  assert.match(locationMapSource, /addEventListener\("popstate"/);
  assert.doesNotMatch(
    readFileSync(new URL("../../components/map/map-runtime-state.ts", import.meta.url), "utf8"),
    /center|zoom|latitude|longitude|currentPosition|view/,
  );
});

test("bounded clear, Escape, keyboard marker, and selected semantics are wired without visual redesign", () => {
  assert.match(locationMapSource, /event\.key === "Escape"/);
  assert.match(locationMapSource, /onClearSelection=\{handleClearSelection\}/);
  assert.match(locationMapSource, /aria-pressed=\{selectedLocation\?\.id === location\.id\}/);
  assert.match(leafletMapSource, /onClearSelection\?\.\(\)/);
  assert.match(leafletMapSource, /event\.key === "Enter"/);
  assert.match(leafletMapSource, /element\.addEventListener\("keydown"/);
  assert.match(leafletMapSource, /element\.setAttribute\("aria-pressed", String\(selected\)\)/);
});

test("Lesson query, filters, viewport scope, ordering, and domain content stay in the Lesson consumer", () => {
  for (const token of [
    "scoreProgramTextQueryMatch",
    "programQuery",
    "brandFilter",
    "prefectureFilter",
    "distanceFilter",
    "listScope",
    "matchedLessonCount",
    "buildLessonDetailHref",
    "getLocationAddress",
  ]) {
    assert.match(locationMapSource, new RegExp(token));
  }
});
