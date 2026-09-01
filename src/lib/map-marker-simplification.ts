import {
  LESSON_M1_MARKER_MIN_ZOOM,
  type MapLocation,
} from "@/components/map/map-types";

export { LESSON_M1_MARKER_MIN_ZOOM };

export type LessonMicroDotPresentation = {
  radius: number;
  color: string;
  opacity: number;
  fillColor: string;
  fillOpacity: number;
  weight: number;
};

export type LessonMarkerSimplification = {
  microDotLocations: MapLocation[];
  m1Locations: MapLocation[];
};

const LOW_ZOOM_PRESENTATION: LessonMicroDotPresentation = {
  radius: 2,
  color: "#a46752",
  opacity: 0,
  fillColor: "#a46752",
  fillOpacity: 0.34,
  weight: 0,
};

const MID_ZOOM_PRESENTATION: LessonMicroDotPresentation = {
  radius: 3,
  color: "#a46752",
  opacity: 0,
  fillColor: "#a46752",
  fillOpacity: 0.42,
  weight: 0,
};

const TRANSITION_ZOOM_PRESENTATION: LessonMicroDotPresentation = {
  radius: 4,
  color: "#a46752",
  opacity: 0,
  fillColor: "#a46752",
  fillOpacity: 0.5,
  weight: 0,
};

export function usesLessonMicroDots(zoom: number) {
  return zoom < LESSON_M1_MARKER_MIN_ZOOM;
}

export function getLessonMicroDotPresentation(zoom: number): LessonMicroDotPresentation {
  if (zoom <= 8) return LOW_ZOOM_PRESENTATION;
  if (zoom <= 10) return MID_ZOOM_PRESENTATION;
  return TRANSITION_ZOOM_PRESENTATION;
}

export function buildLessonMarkerSimplification({
  locations,
  zoom,
  selectedLocationId,
}: {
  locations: MapLocation[];
  zoom: number;
  selectedLocationId: string | null;
}): LessonMarkerSimplification {
  const validLocations = locations.filter(
    (location): location is MapLocation & { latitude: number; longitude: number } =>
      location.latitude !== null && location.longitude !== null,
  );

  if (!usesLessonMicroDots(zoom)) {
    return {
      microDotLocations: [],
      m1Locations: validLocations,
    };
  }

  return {
    microDotLocations: validLocations.filter((location) => location.id !== selectedLocationId),
    m1Locations: validLocations.filter((location) => location.id === selectedLocationId),
  };
}
