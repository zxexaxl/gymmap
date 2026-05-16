export type Coordinates = {
  latitude: number;
  longitude: number;
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
  onSelectLocation: (id: string) => void;
  onProviderError?: (message: string) => void;
};

