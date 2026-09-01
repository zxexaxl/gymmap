export type Coordinates = {
  latitude: number;
  longitude: number;
};

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
  markerDensityMode?: "individual" | "lesson";
  onSelectLocation: (id: string) => void;
  onClearSelection?: () => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onProviderError?: (message: string) => void;
  unselectedCaption?: string;
};
