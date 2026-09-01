export type LessonCoordinates = {
  latitude: number;
  longitude: number;
};

export type LessonProximityOrigin =
  | {
      type: "default_reference";
      label: "東京駅";
      coordinates: LessonCoordinates;
    }
  | {
      type: "current_location";
      label: "現在地";
      coordinates: LessonCoordinates;
    };

export const DEFAULT_LESSON_PROXIMITY_ORIGIN: LessonProximityOrigin = {
  type: "default_reference",
  label: "東京駅",
  coordinates: {
    latitude: 35.681236,
    longitude: 139.767125,
  },
};

export function createCurrentLocationProximityOrigin(
  coordinates: LessonCoordinates,
): LessonProximityOrigin {
  return {
    type: "current_location",
    label: "現在地",
    coordinates,
  };
}

export function haversineDistanceKm(from: LessonCoordinates, to: LessonCoordinates) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitudeA = toRadians(from.latitude);
  const latitudeB = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type MappableLessonLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

export function rankLessonLocationsByProximity<T extends MappableLessonLocation>(
  locations: readonly T[],
  origin: LessonProximityOrigin,
) {
  return locations
    .map((location) => ({
      ...location,
      distanceKm: haversineDistanceKm(origin.coordinates, {
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
}
