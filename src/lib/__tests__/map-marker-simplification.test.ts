import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { MapLocation } from "../../components/map/map-types";
import {
  buildLessonMarkerSimplification,
  getLessonMicroDotPresentation,
  LESSON_M1_MARKER_MIN_ZOOM,
  usesLessonMicroDots,
} from "../map-marker-simplification";

const locations: MapLocation[] = [
  { id: "a", name: "A", latitude: 35.6812, longitude: 139.7671 },
  { id: "b", name: "B", latitude: 35.682, longitude: 139.768 },
  { id: "c", name: "C", latitude: 35.683, longitude: 139.769 },
];

test("low zoom preserves every valid facility at its exact coordinate without thinning", () => {
  const first = buildLessonMarkerSimplification({ locations, zoom: 7, selectedLocationId: null });
  const second = buildLessonMarkerSimplification({ locations, zoom: 7, selectedLocationId: null });

  assert.deepEqual(first, second);
  assert.equal(first.microDotLocations.length, 3);
  assert.equal(first.m1Locations.length, 0);
  assert.deepEqual(
    first.microDotLocations.map(({ id, latitude, longitude }) => ({ id, latitude, longitude })),
    locations.map(({ id, latitude, longitude }) => ({ id, latitude, longitude })),
  );
});

test("selected facility remains one full M1 marker and is not duplicated as a micro-dot", () => {
  const result = buildLessonMarkerSimplification({ locations, zoom: 7, selectedLocationId: "b" });

  assert.deepEqual(result.m1Locations.map((location) => location.id), ["b"]);
  assert.deepEqual(result.microDotLocations.map((location) => location.id), ["a", "c"]);
  assert.equal(result.microDotLocations.length + result.m1Locations.length, locations.length);
});

test("local zoom returns the exact existing M1 marker set in source order", () => {
  const result = buildLessonMarkerSimplification({
    locations,
    zoom: LESSON_M1_MARKER_MIN_ZOOM,
    selectedLocationId: "b",
  });

  assert.deepEqual(result.microDotLocations, []);
  assert.deepEqual(result.m1Locations, locations);
});

test("invalid coordinates are not invented by the presentation layer", () => {
  const invalid: MapLocation = {
    id: "invalid",
    name: "Invalid",
    latitude: null,
    longitude: null,
  };
  const result = buildLessonMarkerSimplification({
    locations: [...locations, invalid],
    zoom: 9,
    selectedLocationId: null,
  });

  assert.equal(result.microDotLocations.length, locations.length);
  assert.ok(result.microDotLocations.every((location) => location.id !== "invalid"));
});

test("zoom presentation progresses from 4 to 6 to 8 pixels before M1", () => {
  assert.equal(getLessonMicroDotPresentation(7).radius * 2, 4);
  assert.equal(getLessonMicroDotPresentation(9).radius * 2, 6);
  assert.equal(getLessonMicroDotPresentation(11).radius * 2, 8);
  assert.equal(usesLessonMicroDots(11), true);
  assert.equal(usesLessonMicroDots(12), false);
});

test("simplification source cannot reintroduce numbered clusters, heatmaps, or randomness", () => {
  const source = readFileSync("src/lib/map-marker-simplification.ts", "utf8");

  assert.doesNotMatch(source, /cluster|heatmap|centroid|grid|Math\.random|count bubble/i);
});

test("low-zoom dots are presentation-only while selected and local markers retain M1", () => {
  const leafletSource = readFileSync("src/components/map/leaflet-gym-map.tsx", "utf8");
  const dotLayerSource = readFileSync(
    "src/components/map/lesson-facility-micro-dot-layer.tsx",
    "utf8",
  );
  const styles = readFileSync("src/components/map/map-presentation.module.css", "utf8");

  assert.match(dotLayerSource, /data-facility-micro-dot/);
  assert.match(dotLayerSource, /aria-hidden", "true"/);
  assert.match(dotLayerSource, /focusable", "false"/);
  assert.match(dotLayerSource, /interactive=\{false\}/);
  assert.match(styles, /\.facilityMicroDot[\s\S]*pointer-events: none/);
  assert.match(leafletSource, /<AccessibleLocationMarker[\s\S]*selected=\{isSelected\}/);
  assert.match(leafletSource, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(leafletSource, /aria-pressed", String\(selected\)/);
});

test("Lesson opts in without changing HYROX, MapChrome, or P1 basemap ownership", () => {
  const leafletSource = readFileSync("src/components/map/leaflet-gym-map.tsx", "utf8");
  const lessonSource = readFileSync("src/components/map/location-map-section.tsx", "utf8");
  const hyroxSource = readFileSync("src/components/training/hyrox-discovery.tsx", "utf8");
  const basemapSource = readFileSync("src/components/map/openfreemap-vector-basemap.tsx", "utf8");
  const markerSource = readFileSync("src/components/map/map-marker-presentation.ts", "utf8");

  assert.match(lessonSource, /markerPresentationMode="lesson-progressive"/);
  assert.doesNotMatch(hyroxSource, /markerPresentationMode|facilityMicroDot/);
  assert.match(leafletSource, /lazy\(\(\) =>[\s\S]*lesson-facility-micro-dot-layer/);
  assert.match(basemapSource, /OPENFREEMAP_STYLE_URL/);
  assert.match(markerSource, /selected:[\s\S]*fillColor: "#7f2f16"/);
  assert.match(lessonSource, /<MapChrome label="地図の現在地コントロール">/);
});

test("non-map route remains outside the map and simplification lazy boundary", () => {
  const updatesSource = readFileSync("src/app/updates/page.tsx", "utf8");

  assert.doesNotMatch(updatesSource, /LeafletGymMap|MapLibre|marker-simplification|facilityMicroDot/);
});
