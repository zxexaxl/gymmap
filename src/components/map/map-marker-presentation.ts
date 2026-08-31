export type MapMarkerState =
  | "default"
  | "preview"
  | "selected"
  | "de-emphasized"
  | "clustered"
  | "offscreen";

export type MapMarkerPresentation = {
  state: MapMarkerState;
  color: string;
  fillColor: string;
  fillOpacity: number;
  radius: number;
  weight: number;
  dashArray?: string;
  glyphText?: string;
};

const presentations: Record<MapMarkerState, MapMarkerPresentation> = {
  default: {
    state: "default",
    color: "#78361f",
    fillColor: "#c7613d",
    fillOpacity: 0.94,
    radius: 9,
    weight: 2,
  },
  preview: {
    state: "preview",
    color: "#572615",
    fillColor: "#d96b43",
    fillOpacity: 1,
    radius: 11,
    weight: 3,
  },
  selected: {
    state: "selected",
    color: "#fffaf0",
    fillColor: "#7f2f16",
    fillOpacity: 1,
    radius: 13,
    weight: 4,
    dashArray: "2 2",
    glyphText: "✓",
  },
  "de-emphasized": {
    state: "de-emphasized",
    color: "#805d50",
    fillColor: "#a87562",
    fillOpacity: 0.6,
    radius: 8,
    weight: 2,
  },
  clustered: {
    state: "clustered",
    color: "#fffaf0",
    fillColor: "#5a392c",
    fillOpacity: 0.96,
    radius: 16,
    weight: 3,
  },
  offscreen: {
    state: "offscreen",
    color: "transparent",
    fillColor: "transparent",
    fillOpacity: 0,
    radius: 0,
    weight: 0,
  },
};

export function resolveMapMarkerState({
  selected,
  previewed,
  hasSelection,
}: {
  selected: boolean;
  previewed: boolean;
  hasSelection: boolean;
}): MapMarkerState {
  if (selected) return "selected";
  if (previewed) return "preview";
  if (hasSelection) return "de-emphasized";
  return "default";
}

export function getMapMarkerPresentation(state: MapMarkerState): MapMarkerPresentation {
  return presentations[state];
}
