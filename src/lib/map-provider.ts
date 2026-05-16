export type MapProvider = "osm" | "apple";

function normalizeMapProvider(value: string | undefined): MapProvider {
  return value?.toLowerCase() === "apple" ? "apple" : "osm";
}

export const configuredMapProvider = normalizeMapProvider(process.env.NEXT_PUBLIC_MAP_PROVIDER);
export const appleMapsToken = process.env.NEXT_PUBLIC_APPLE_MAPS_TOKEN?.trim() ?? "";

