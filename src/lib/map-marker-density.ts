import type { MapLocation } from "@/components/map/map-types";

export const LESSON_DENSITY_INDIVIDUAL_ZOOM = 12;

export type DensityIndividual = {
  kind: "individual";
  location: MapLocation;
};

export type DensityCluster = {
  kind: "cluster";
  id: string;
  count: number;
  latitude: number;
  longitude: number;
  locations: MapLocation[];
};

export type MarkerDensityItem = DensityIndividual | DensityCluster;

type ProjectedPoint = {
  x: number;
  y: number;
};

const TILE_SIZE = 256;
const MAX_MERCATOR_LATITUDE = 85.05112878;

export function getLessonDensityGridSize(zoom: number) {
  if (zoom <= 7) return 64;
  if (zoom <= 9) return 56;
  return 48;
}

export function projectMarkerCoordinates(
  latitude: number,
  longitude: number,
  zoom: number,
): ProjectedPoint {
  const scale = TILE_SIZE * 2 ** zoom;
  const boundedLatitude = Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude));
  const latitudeRadians = (boundedLatitude * Math.PI) / 180;

  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      (0.5 - Math.log((1 + Math.sin(latitudeRadians)) / (1 - Math.sin(latitudeRadians))) / (4 * Math.PI)) *
      scale,
  };
}

export function buildDensityClusterLabel(count: number) {
  return `この周辺に${count}店舗。選択すると拡大します`;
}

export function buildLessonMarkerDensity({
  locations,
  zoom,
  selectedLocationId,
}: {
  locations: MapLocation[];
  zoom: number;
  selectedLocationId: string | null;
}): MarkerDensityItem[] {
  const validLocations = locations.filter(
    (location): location is MapLocation & { latitude: number; longitude: number } =>
      location.latitude !== null && location.longitude !== null,
  );

  if (zoom >= LESSON_DENSITY_INDIVIDUAL_ZOOM) {
    return validLocations.map((location) => ({ kind: "individual", location }));
  }

  const gridSize = getLessonDensityGridSize(zoom);
  const buckets = new Map<string, Array<{ location: MapLocation; sourceIndex: number }>>();
  const selectedItems: Array<{ item: DensityIndividual; sourceIndex: number }> = [];

  validLocations.forEach((location, sourceIndex) => {
    if (location.id === selectedLocationId) {
      selectedItems.push({ item: { kind: "individual", location }, sourceIndex });
      return;
    }

    const projected = projectMarkerCoordinates(location.latitude, location.longitude, zoom);
    const key = `${Math.floor(projected.x / gridSize)}:${Math.floor(projected.y / gridSize)}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push({ location, sourceIndex });
    buckets.set(key, bucket);
  });

  const densityItems: Array<{ item: MarkerDensityItem; sourceIndex: number }> = [...selectedItems];

  for (const [key, bucket] of buckets) {
    if (bucket.length === 1) {
      densityItems.push({
        item: { kind: "individual", location: bucket[0].location },
        sourceIndex: bucket[0].sourceIndex,
      });
      continue;
    }

    const clusterLocations = bucket
      .map(({ location }) => location)
      .sort((left, right) => left.id.localeCompare(right.id));
    const latitude =
      clusterLocations.reduce((total, location) => total + (location.latitude as number), 0) /
      clusterLocations.length;
    const longitude =
      clusterLocations.reduce((total, location) => total + (location.longitude as number), 0) /
      clusterLocations.length;

    densityItems.push({
      item: {
        kind: "cluster",
        id: `lesson-density-${zoom}-${key}-${clusterLocations.map((location) => location.id).join("-")}`,
        count: clusterLocations.length,
        latitude,
        longitude,
        locations: clusterLocations,
      },
      sourceIndex: Math.min(...bucket.map(({ sourceIndex }) => sourceIndex)),
    });
  }

  return densityItems
    .sort((left, right) => left.sourceIndex - right.sourceIndex)
    .map(({ item }) => item);
}

export function summarizeMarkerDensity(items: MarkerDensityItem[]) {
  const clusters = items.filter((item): item is DensityCluster => item.kind === "cluster");
  const individualCount = items.length - clusters.length;

  return {
    representedFacilityCount:
      individualCount + clusters.reduce((total, cluster) => total + cluster.count, 0),
    renderedIndividualCount: individualCount,
    renderedClusterCount: clusters.length,
    largestClusterCount: clusters.reduce((largest, cluster) => Math.max(largest, cluster.count), 0),
    keyboardStopCount: items.length,
  };
}
