import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const leafletMapSource = readFileSync(
  new URL("../../components/map/leaflet-gym-map.tsx", import.meta.url),
  "utf8",
);
const globalStyles = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
const packageManifest = readFileSync(new URL("../../../package.json", import.meta.url), "utf8");

test("P1 keeps the official OSM raster source and visible attribution", () => {
  assert.match(leafletMapSource, /url="https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png"/);
  assert.doesNotMatch(leafletMapSource, /\{s\}\.tile\.openstreetmap\.org/);
  assert.match(
    leafletMapSource,
    /attribution='&copy; <a href="https:\/\/www\.openstreetmap\.org\/copyright">OpenStreetMap<\/a> contributors'/,
  );
});

test("P1 quiets only the raster basemap tiles", () => {
  assert.match(leafletMapSource, /className="gymmap-basemap-tiles"/);
  assert.match(
    globalStyles,
    /\.leaflet-map \.gymmap-basemap-tiles\s*\{[\s\S]*?filter:\s*[^;]*saturate\([^)]*\)[^;]*contrast\([^)]*\)[^;]*brightness\([^)]*\)/,
  );
  assert.doesNotMatch(globalStyles, /\.leafletMarkerFocusTarget[\s\S]*?filter:\s*saturate/);
});

test("P1 v2 uses a bright low-chroma raster treatment without flattening neutral detail", () => {
  const match = globalStyles.match(
    /\.leaflet-map \.gymmap-basemap-tiles\s*\{[\s\S]*?filter:\s*saturate\(([^)]+)\)\s+contrast\(([^)]+)\)\s+brightness\(([^)]+)\)/,
  );

  assert.ok(match);

  const [, saturation, contrast, brightness] = match.map(Number);

  assert.ok(saturation <= 0.15, "road color competition should remain strongly suppressed");
  assert.ok(contrast >= 0.9, "neutral rail and station detail should not be flattened");
  assert.ok(brightness >= 1.1, "the raster should be brighter rather than darkened");
});

test("P1 adds no vector map dependency or client provider secret", () => {
  assert.doesNotMatch(packageManifest, /maplibre|mapbox-gl/i);
  assert.doesNotMatch(leafletMapSource, /api[_-]?key|access[_-]?token|NEXT_PUBLIC_.*(?:TILE|MAPBOX|CARTO)/i);
});
