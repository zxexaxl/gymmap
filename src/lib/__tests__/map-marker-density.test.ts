import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { MapLocation } from "../../components/map/map-types";
import {
  buildDensityClusterLabel,
  buildLessonMarkerDensity,
  LESSON_DENSITY_INDIVIDUAL_ZOOM,
  summarizeMarkerDensity,
} from "../map-marker-density";

const nearbyLocations: MapLocation[] = [
  { id: "a", name: "A", latitude: 35.6812, longitude: 139.7671 },
  { id: "b", name: "B", latitude: 35.682, longitude: 139.768 },
  { id: "c", name: "C", latitude: 35.683, longitude: 139.769 },
];

test("low zoom aggregates every nearby facility without random hiding", () => {
  const first = buildLessonMarkerDensity({ locations: nearbyLocations, zoom: 7, selectedLocationId: null });
  const second = buildLessonMarkerDensity({ locations: nearbyLocations, zoom: 7, selectedLocationId: null });
  const summary = summarizeMarkerDensity(first);

  assert.deepEqual(first, second);
  assert.equal(summary.representedFacilityCount, 3);
  assert.equal(summary.renderedIndividualCount, 0);
  assert.equal(summary.renderedClusterCount, 1);
  assert.equal(summary.largestClusterCount, 3);
  assert.equal(summary.keyboardStopCount, 1);
});

test("local zoom restores the exact individual M1 marker set", () => {
  const items = buildLessonMarkerDensity({
    locations: nearbyLocations,
    zoom: LESSON_DENSITY_INDIVIDUAL_ZOOM,
    selectedLocationId: null,
  });

  assert.deepEqual(items.map((item) => item.kind), ["individual", "individual", "individual"]);
  assert.deepEqual(
    items.map((item) => (item.kind === "individual" ? item.location.id : null)),
    ["a", "b", "c"],
  );
});

test("selected facility remains individually represented below the clustering threshold", () => {
  const items = buildLessonMarkerDensity({ locations: nearbyLocations, zoom: 7, selectedLocationId: "b" });
  const selected = items.find(
    (item) => item.kind === "individual" && item.location.id === "b",
  );
  const summary = summarizeMarkerDensity(items);

  assert.ok(selected);
  assert.equal(summary.representedFacilityCount, 3);
  assert.equal(summary.renderedIndividualCount, 1);
  assert.equal(summary.renderedClusterCount, 1);
});

test("density counts use only the currently supplied filtered dataset", () => {
  const filtered = nearbyLocations.filter((location) => location.id !== "c");
  const items = buildLessonMarkerDensity({ locations: filtered, zoom: 7, selectedLocationId: null });

  assert.equal(summarizeMarkerDensity(items).representedFacilityCount, 2);
  assert.equal(items[0].kind === "cluster" ? items[0].count : 0, 2);
});

test("invalid-coordinate locations are not invented in the marker presentation", () => {
  const items = buildLessonMarkerDensity({
    locations: [...nearbyLocations, { id: "invalid", name: "Invalid", latitude: null, longitude: null }],
    zoom: 7,
    selectedLocationId: null,
  });

  assert.equal(summarizeMarkerDensity(items).representedFacilityCount, 3);
});

test("cluster label announces the count and deterministic action", () => {
  assert.equal(buildDensityClusterLabel(17), "この周辺に17店舗。選択すると拡大します");
});

test("Lesson opts into density while HYROX and P1 basemap remain unchanged", () => {
  const lessonSource = readFileSync("src/components/map/location-map-section.tsx", "utf8");
  const hyroxSource = readFileSync("src/components/training/hyrox-discovery.tsx", "utf8");
  const leafletSource = readFileSync("src/components/map/leaflet-gym-map.tsx", "utf8");
  const basemapSource = readFileSync("src/components/map/openfreemap-vector-basemap.tsx", "utf8");
  const presentationSource = readFileSync("src/components/map/map-marker-presentation.ts", "utf8");

  assert.match(lessonSource, /markerDensityMode="lesson"/);
  assert.doesNotMatch(hyroxSource, /markerDensityMode/);
  assert.match(leafletSource, /markerDensityMode = "individual"/);
  assert.match(leafletSource, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(basemapSource, /OPENFREEMAP_STYLE_URL/);
  assert.match(presentationSource, /selected:[\s\S]*fillColor: "#7f2f16"/);
});
