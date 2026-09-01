import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const UPSTREAM_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const UPSTREAM_SHA256 = "6010998863b4876911ac9a2d62c9a28d97c8877f6d20cd158b74808572257b60";
const OUTPUT_PATH = resolve("public/map/gymmap-openfreemap-liberty-v1.json");
const inputArgument = process.argv.find((argument) => argument.startsWith("--input="));

const upstreamText = inputArgument
  ? await readFile(resolve(inputArgument.slice("--input=".length)), "utf8")
  : await fetch(UPSTREAM_STYLE_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`OpenFreeMap Liberty fetch failed: ${response.status}`);
      }

      return response.text();
    });

const actualSha256 = createHash("sha256").update(upstreamText).digest("hex");

if (actualSha256 !== UPSTREAM_SHA256) {
  throw new Error(
    `Liberty source changed (expected ${UPSTREAM_SHA256}, received ${actualSha256}). Review before versioning a new GymMap style.`,
  );
}

const style = JSON.parse(upstreamText);
const japaneseFallback = [
  "coalesce",
  ["get", "name:ja"],
  ["get", "name:nonlatin"],
  ["get", "name"],
  ["get", "name:latin"],
  ["get", "name_en"],
];
const removedLayerIds = new Set([
  "building-3d",
  "poi_r20",
  "poi_r7",
  "poi_r1",
  "road_area_pattern",
  "road_one_way_arrow",
  "road_one_way_arrow_opposite",
  "highway-shield-non-us",
  "highway-shield-us-interstate",
  "road_shield_us",
]);
const roadPalette = {
  casing: { color: "#d9d7d2", opacity: 0.2 },
  expressway: { color: "#ddd9d2", opacity: 0.52 },
  primary: { color: "#e3e0da", opacity: 0.46 },
  minor: { color: "#edeae5", opacity: 0.42 },
};

style.name = "GymMap OpenFreeMap Liberty v1";
style.metadata = {
  ...(style.metadata ?? {}),
  "gymmap:version": "1",
  "gymmap:derived-from": UPSTREAM_STYLE_URL,
  "gymmap:upstream-sha256": UPSTREAM_SHA256,
  "gymmap:generated-at": "2026-09-01",
};
style.sources.openmaptiles.attribution =
  '<a href="https://openfreemap.org/">OpenFreeMap</a> © <a href="https://openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

style.layers = style.layers.filter((layer) => !removedLayerIds.has(layer.id));

for (const layer of style.layers) {
  layer.paint ??= {};

  if (layer.id === "background") {
    layer.paint["background-color"] = "#f6f4ef";
  }

  if (layer.id === "natural_earth") {
    layer.paint["raster-saturation"] = -0.7;
    layer.paint["raster-opacity"] = 0.45;
  }

  if (layer.id === "water") {
    layer.paint["fill-color"] = "#dce9ed";
  }

  if (layer.id.startsWith("waterway_") && layer.type === "line") {
    layer.paint["line-color"] = "#c8dce2";
    layer.paint["line-opacity"] = 0.72;
  }

  if (layer.id === "landuse_residential") {
    layer.paint["fill-color"] = "#f1efea";
  }

  if (layer.id.startsWith("landcover_") || layer.id === "park") {
    if (layer.type === "fill") {
      layer.paint["fill-opacity"] = 0.62;
    }
  }

  if (layer.id === "building") {
    layer.maxzoom = 24;
    layer.paint["fill-color"] = "#e7e4de";
    layer.paint["fill-outline-color"] = "#dcd8d0";
    layer.paint["fill-opacity"] = 0.68;
  }

  const isRail = /(?:major|transit)_rail/.test(layer.id);
  if (isRail && layer.type === "line") {
    layer.paint["line-color"] = layer.id.endsWith("hatching") ? "#707980" : "#8d969c";
    layer.paint["line-opacity"] = layer.id.startsWith("tunnel_") ? 0.5 : 0.88;
  }

  const isRoad = /^(?:tunnel|road|bridge)_(?:motorway|trunk|primary|secondary|tertiary|minor|street|service|link|path)/.test(
    layer.id,
  );
  if (isRoad && layer.type === "line" && !isRail) {
    const isCasing = layer.id.endsWith("_casing");
    const isExpressway = /motorway/.test(layer.id);
    const isPrimary = /trunk|primary/.test(layer.id);
    const roadClass = isCasing
      ? roadPalette.casing
      : isExpressway
        ? roadPalette.expressway
        : isPrimary
          ? roadPalette.primary
          : roadPalette.minor;
    layer.paint["line-color"] = roadClass.color;
    layer.paint["line-opacity"] = roadClass.opacity;
  }

  if (layer.id === "poi_transit") {
    layer.minzoom = 10;
    layer.filter = ["match", ["get", "class"], ["railway", "rail"], true, false];
    delete layer.layout["icon-image"];
    delete layer.layout["icon-size"];
    layer.layout["text-field"] = ["concat", "● ", japaneseFallback];
    layer.layout["text-font"] = ["Noto Sans Regular"];
    layer.layout["text-size"] = ["interpolate", ["linear"], ["zoom"], 10, 11, 14, 13];
    layer.paint["text-color"] = "#334f62";
    layer.paint["text-halo-color"] = "#fffefa";
    layer.paint["text-halo-width"] = 1.5;
  }

  if (
    layer.type === "symbol" &&
    ["place", "transportation_name"].includes(layer["source-layer"])
  ) {
    layer.layout["text-field"] = japaneseFallback;
    layer.paint["text-color"] = layer["source-layer"] === "place" ? "#40464a" : "#77736d";
    layer.paint["text-halo-color"] = "#fdfcf8";

    if (layer["source-layer"] === "transportation_name") {
      layer.paint["text-color"] = "#898680";
      layer.paint["text-opacity"] = layer.id === "highway-name-major" ? 0.68 : 0.54;
    }
  }

  if (layer.id === "highway-name-minor") {
    layer.minzoom = Math.max(layer.minzoom ?? 0, 15);
  }
}

const transitLayerIndex = style.layers.findIndex((layer) => layer.id === "poi_transit");
const firstPlaceLabelIndex = style.layers.findIndex((layer) => layer["source-layer"] === "place");

if (transitLayerIndex >= 0 && firstPlaceLabelIndex >= 0 && transitLayerIndex < firstPlaceLabelIndex) {
  const [transitLayer] = style.layers.splice(transitLayerIndex, 1);
  const insertionIndex = style.layers.findIndex((layer) => layer["source-layer"] === "place");
  style.layers.splice(insertionIndex, 0, transitLayer);
}

await writeFile(OUTPUT_PATH, `${JSON.stringify(style)}\n`);
console.info(`Wrote ${OUTPUT_PATH}`);
