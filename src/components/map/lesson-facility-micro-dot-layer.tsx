"use client";

import { useEffect, useRef } from "react";
import { CircleMarker } from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";

import type { MapLocation } from "@/components/map/map-types";
import {
  buildLessonMarkerSimplification,
  getLessonMicroDotPresentation,
} from "@/lib/map-marker-simplification";

import presentationStyles from "./map-presentation.module.css";

function FacilityMicroDot({ location, zoom }: { location: MapLocation; zoom: number }) {
  const markerRef = useRef<LeafletCircleMarker | null>(null);
  const presentation = getLessonMicroDotPresentation(zoom);

  useEffect(() => {
    const element = markerRef.current?.getElement();

    if (!element) {
      return;
    }

    element.setAttribute("aria-hidden", "true");
    element.setAttribute("focusable", "false");
    element.setAttribute("data-facility-micro-dot", "true");
    element.removeAttribute("tabindex");
    element.removeAttribute("role");
  }, []);

  return (
    <CircleMarker
      ref={markerRef}
      center={[location.latitude as number, location.longitude as number]}
      radius={presentation.radius}
      className={presentationStyles.facilityMicroDot}
      interactive={false}
      bubblingMouseEvents={false}
      pathOptions={{
        color: presentation.color,
        opacity: presentation.opacity,
        fillColor: presentation.fillColor,
        fillOpacity: presentation.fillOpacity,
        weight: presentation.weight,
      }}
    />
  );
}

export function LessonFacilityMicroDotLayer({
  locations,
  selectedLocationId,
  zoom,
}: {
  locations: MapLocation[];
  selectedLocationId: string | null;
  zoom: number;
}) {
  const { microDotLocations } = buildLessonMarkerSimplification({
    locations,
    zoom,
    selectedLocationId,
  });

  return microDotLocations.map((location) => (
    <FacilityMicroDot key={location.id} location={location} zoom={zoom} />
  ));
}
