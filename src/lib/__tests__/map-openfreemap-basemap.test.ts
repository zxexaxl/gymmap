import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  normalizeMapBasemapMode,
  shouldRenderVectorBasemap,
} from "../map-basemap";

const repositoryRoot = process.cwd();
const readRepositoryFile = (filePath: string) =>
  readFileSync(path.join(repositoryRoot, filePath), "utf8");

test("vector is the candidate default and raster remains a bounded rollback", () => {
  assert.equal(normalizeMapBasemapMode(undefined), "vector");
  assert.equal(normalizeMapBasemapMode("VECTOR"), "vector");
  assert.equal(normalizeMapBasemapMode("raster"), "raster");
  assert.equal(normalizeMapBasemapMode("unexpected"), "vector");

  assert.equal(shouldRenderVectorBasemap({ mode: "vector", failureReason: null }), true);
  assert.equal(
    shouldRenderVectorBasemap({ mode: "vector", failureReason: "webgl-context-lost" }),
    false,
  );
  assert.equal(shouldRenderVectorBasemap({ mode: "raster", failureReason: null }), false);
});

test("owned style preserves OpenFreeMap authority and the Japanese station hierarchy", () => {
  const style = JSON.parse(
    readRepositoryFile("public/map/gymmap-openfreemap-liberty-v1.json"),
  );
  const transit = style.layers.find((layer: { id: string }) => layer.id === "poi_transit");
  const roadMinor = style.layers.find((layer: { id: string }) => layer.id === "road_minor");
  const roadMotorway = style.layers.find((layer: { id: string }) => layer.id === "road_motorway");
  const roadPrimary = style.layers.find((layer: { id: string }) => layer.id === "road_trunk_primary");
  const roadCasing = style.layers.find((layer: { id: string }) => layer.id === "road_motorway_casing");
  const majorRoadName = style.layers.find((layer: { id: string }) => layer.id === "highway-name-major");
  const minorRoadName = style.layers.find((layer: { id: string }) => layer.id === "highway-name-minor");
  const rail = style.layers.find((layer: { id: string }) => layer.id === "road_major_rail");
  const place = style.layers.find((layer: { id: string }) => layer.id === "label_city");

  assert.equal(style.metadata["gymmap:version"], "1");
  assert.equal(style.sources.openmaptiles.url, "https://tiles.openfreemap.org/planet");
  assert.match(style.sources.openmaptiles.attribution, /OpenFreeMap.*OpenMapTiles.*OpenStreetMap/);
  assert.deepEqual(transit.filter, [
    "match",
    ["get", "class"],
    ["railway", "rail"],
    true,
    false,
  ]);
  assert.deepEqual(transit.layout["text-field"].slice(0, 2), ["concat", "● "]);
  assert.deepEqual(transit.layout["text-field"][2].slice(0, 3), [
    "coalesce",
    ["get", "name:ja"],
    ["get", "name:nonlatin"],
  ]);
  assert.deepEqual(place.layout["text-field"].slice(0, 3), [
    "coalesce",
    ["get", "name:ja"],
    ["get", "name:nonlatin"],
  ]);
  assert.ok(rail.paint["line-opacity"] > roadMinor.paint["line-opacity"]);
  assert.deepEqual(
    [roadCasing.paint["line-opacity"], roadMotorway.paint["line-opacity"], roadPrimary.paint["line-opacity"], roadMinor.paint["line-opacity"]],
    [0.2, 0.52, 0.46, 0.42],
  );
  assert.deepEqual(
    [roadCasing.paint["line-color"], roadMotorway.paint["line-color"], roadPrimary.paint["line-color"], roadMinor.paint["line-color"]],
    ["#d9d7d2", "#ddd9d2", "#e3e0da", "#edeae5"],
  );
  assert.equal(majorRoadName.paint["text-opacity"], 0.68);
  assert.equal(minorRoadName.paint["text-opacity"], 0.54);
  assert.equal(style.layers.some((layer: { id: string }) => layer.id === "road_one_way_arrow"), false);
  assert.equal(style.layers.some((layer: { id: string }) => layer.id.startsWith("highway-shield")), false);
  assert.equal(style.layers.some((layer: { id: string }) => layer.id === "poi_r20"), false);
});

test("MapLibre is nested behind the map-only lazy seam with a complete worker pair", () => {
  const leafletSource = readRepositoryFile("src/components/map/leaflet-gym-map.tsx");
  const lessonSource = readRepositoryFile("src/components/map/location-map-section.tsx");
  const hyroxSource = readRepositoryFile("src/components/training/hyrox-discovery.tsx");
  const worker = readRepositoryFile("public/map/maplibre-gl-worker-v6.6.0.mjs");
  const vectorSource = readRepositoryFile("src/components/map/openfreemap-vector-basemap.tsx");
  const packageJson = JSON.parse(readRepositoryFile("package.json"));

  assert.match(leafletSource, /lazy\(\(\) =>\s*\n?\s*import\("@\/components\/map\/openfreemap-vector-basemap"\)/);
  assert.doesNotMatch(lessonSource, /maplibre-gl|openfreemap-vector-basemap/);
  assert.doesNotMatch(hyroxSource, /maplibre-gl|openfreemap-vector-basemap/);
  assert.match(worker, /maplibre-gl-shared\.mjs/);
  assert.match(vectorSource, /vectorMap\.on\("webglcontextlost", \(\) => fail\("webgl-context-lost"\)\)/);
  assert.match(vectorSource, /PROVIDER_ERROR_THRESHOLD = 3/);
  assert.match(vectorSource, /LOAD_TIMEOUT_MS = 10_000/);
  assert.equal(packageJson.dependencies["maplibre-gl"], "6.6.0");
  assert.equal(packageJson.dependencies["@maplibre/maplibre-gl-leaflet"], "0.1.4");
});

test("marker ownership and Lesson/HYROX consumer boundaries remain intact", () => {
  const leafletSource = readRepositoryFile("src/components/map/leaflet-gym-map.tsx");
  const lessonSource = readRepositoryFile("src/components/map/location-map-section.tsx");
  const hyroxSource = readRepositoryFile("src/components/training/hyrox-discovery.tsx");

  assert.match(leafletSource, /function AccessibleLocationMarker/);
  assert.match(leafletSource, /element\.setAttribute\("aria-pressed", String\(selected\)\)/);
  assert.match(leafletSource, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(lessonSource, /module\.LeafletGymMap/);
  assert.match(hyroxSource, /module\.LeafletGymMap/);
});
