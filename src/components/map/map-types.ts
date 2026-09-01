export type Coordinates = {
  latitude: number;
  longitude: number;
};

export const LESSON_M1_MARKER_MIN_ZOOM = 12;

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type MapLocation = {
  id: string;
  name: string;
  brandName?: string;
  latitude: number | null;
  longitude: number | null;
};

export type MapComponentProps = {
  locations: MapLocation[];
  selectedLocationId: string | null;
  center: Coordinates;
  currentPosition: Coordinates | null;
  focusCenter?: boolean;
  onSelectLocation: (id: string) => void;
  onClearSelection?: () => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onProviderError?: (message: string) => void;
  unselectedCaption?: string;
  markerPresentationMode?: "individual" | "lesson-progressive";
};
