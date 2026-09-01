export type MapBasemapMode = "vector" | "raster";

export type VectorBasemapFailureReason =
  | "initialization"
  | "load-timeout"
  | "provider"
  | "webgl-context-lost";

export const OPENFREEMAP_STYLE_URL = "/map/gymmap-openfreemap-liberty-v1.json";
export const MAPLIBRE_WORKER_URL = "/map/maplibre-gl-worker-v6.6.0.mjs";

export function normalizeMapBasemapMode(value: string | undefined): MapBasemapMode {
  return value?.trim().toLowerCase() === "raster" ? "raster" : "vector";
}

export function shouldRenderVectorBasemap({
  mode,
  failureReason,
}: {
  mode: MapBasemapMode;
  failureReason: VectorBasemapFailureReason | null;
}) {
  return mode === "vector" && failureReason === null;
}

export const configuredMapBasemapMode = normalizeMapBasemapMode(
  process.env.NEXT_PUBLIC_MAP_BASEMAP_MODE,
);
