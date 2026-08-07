"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { appleMapsToken } from "@/lib/map-provider";
import type { MapComponentProps } from "@/components/map/map-types";

const APPLE_MAPKIT_SCRIPT_URL = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
const MAPKIT_FALLBACK_MESSAGE = "Apple Maps を読み込めなかったため、OpenStreetMap に切り替えます。";

declare global {
  interface Window {
    mapkit?: any;
    __appleMapKitLoadPromise?: Promise<any>;
    __appleMapKitInitialized?: boolean;
  }
}

function loadAppleMapKit(token: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window is not available"));
  }

  if (!token) {
    return Promise.reject(new Error("NEXT_PUBLIC_APPLE_MAPS_TOKEN is missing"));
  }

  if (window.__appleMapKitLoadPromise) {
    return window.__appleMapKitLoadPromise;
  }

  window.__appleMapKitLoadPromise = new Promise((resolve, reject) => {
    const initializeMapKit = () => {
      try {
        if (!window.mapkit) {
          reject(new Error("MapKit JS did not load"));
          return;
        }

        if (!window.__appleMapKitInitialized) {
          window.mapkit.init({
            authorizationCallback: (done: (value: string) => void) => done(token),
            language: "ja",
          });
          window.__appleMapKitInitialized = true;
        }

        resolve(window.mapkit);
      } catch (error) {
        reject(error);
      }
    };

    if (window.mapkit) {
      initializeMapKit();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_MAPKIT_SCRIPT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", initializeMapKit, { once: true });
      existingScript.addEventListener("error", () => reject(new Error("MapKit JS script failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = APPLE_MAPKIT_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", initializeMapKit, { once: true });
    script.addEventListener("error", () => reject(new Error("MapKit JS script failed to load")), { once: true });
    document.head.appendChild(script);
  });

  return window.__appleMapKitLoadPromise;
}

export function AppleGymMap({
  locations,
  selectedLocationId,
  center,
  currentPosition,
  onSelectLocation,
  onBoundsChange,
  onProviderError,
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const annotationsRef = useRef<any[]>([]);
  const [mapkitState, setMapkitState] = useState<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;

  const selectedCenter = useMemo(
    () =>
      selectedLocation?.latitude && selectedLocation?.longitude
        ? {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }
        : center,
    [center, selectedLocation?.latitude, selectedLocation?.longitude],
  );

  useEffect(() => {
    let cancelled = false;

    loadAppleMapKit(appleMapsToken)
      .then((mapkit) => {
        if (cancelled) {
          return;
        }

        setMapkitState(mapkit);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("[map] Apple Maps initialization failed", error);
        setMapError(MAPKIT_FALLBACK_MESSAGE);
        onProviderError?.(MAPKIT_FALLBACK_MESSAGE);
      });

    return () => {
      cancelled = true;
    };
  }, [onProviderError]);

  useEffect(() => {
    if (!mapkitState || !containerRef.current || mapRef.current) {
      return;
    }

    try {
      const map = new mapkitState.Map(containerRef.current, {
        isRotationEnabled: false,
        isZoomEnabled: true,
        isScrollEnabled: true,
        showsCompass: mapkitState.FeatureVisibility?.Hidden,
        showsMapTypeControl: false,
      });

      map.center = new mapkitState.Coordinate(center.latitude, center.longitude);
      mapRef.current = map;

      console.info("[map] Apple Maps initialized", {
        locationCount: locations.length,
        selectedLocationId,
        center,
      });
    } catch (error) {
      console.error("[map] Apple Maps map init failed", error);
      setMapError(MAPKIT_FALLBACK_MESSAGE);
      onProviderError?.(MAPKIT_FALLBACK_MESSAGE);
    }
  }, [center, locations.length, mapkitState, onProviderError, selectedLocationId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapkitState) {
      return;
    }

    annotationsRef.current.forEach((annotation) => {
      try {
        map.removeAnnotation(annotation);
      } catch {
        // no-op
      }
    });
    annotationsRef.current = [];

    const annotations = locations
      .filter((location) => location.latitude !== null && location.longitude !== null)
      .map((location) => {
        const annotation = new mapkitState.MarkerAnnotation(
          new mapkitState.Coordinate(location.latitude as number, location.longitude as number),
          {
            title: location.name,
            subtitle: location.brandName ?? "",
            color: location.id === selectedLocationId ? "#7f2f16" : "#b0502d",
          },
        );

        if (annotation.addEventListener) {
          annotation.addEventListener("select", () => onSelectLocation(location.id));
        }

        map.addAnnotation(annotation);
        return annotation;
      });

    if (currentPosition) {
      const currentPositionAnnotation = new mapkitState.MarkerAnnotation(
        new mapkitState.Coordinate(currentPosition.latitude, currentPosition.longitude),
        {
          title: "現在地",
          color: "#2563eb",
        },
      );
      map.addAnnotation(currentPositionAnnotation);
      annotations.push(currentPositionAnnotation);
    }

    annotationsRef.current = annotations;
  }, [currentPosition, locations, mapkitState, onSelectLocation, selectedLocationId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapkitState) {
      return;
    }

    const nextCoordinate = new mapkitState.Coordinate(selectedCenter.latitude, selectedCenter.longitude);

    if (typeof map.setCenterAnimated === "function") {
      map.setCenterAnimated(nextCoordinate);
    } else {
      map.center = nextCoordinate;
    }

    if ("region" in map && mapkitState.CoordinateRegion && mapkitState.CoordinateSpan) {
      map.region = new mapkitState.CoordinateRegion(nextCoordinate, new mapkitState.CoordinateSpan(0.08, 0.08));
    }
  }, [mapkitState, selectedCenter.latitude, selectedCenter.longitude]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !onBoundsChange) {
      return;
    }

    const reportBounds = () => {
      const region = map.region;

      if (!region?.center || !region?.span) {
        return;
      }

      onBoundsChange({
        north: region.center.latitude + region.span.latitudeDelta / 2,
        south: region.center.latitude - region.span.latitudeDelta / 2,
        east: region.center.longitude + region.span.longitudeDelta / 2,
        west: region.center.longitude - region.span.longitudeDelta / 2,
      });
    };

    map.addEventListener?.("region-change-end", reportBounds);
    reportBounds();

    return () => {
      map.removeEventListener?.("region-change-end", reportBounds);
    };
  }, [mapkitState, onBoundsChange]);

  return (
    <div className="apple-map-root">
      <div ref={containerRef} className="apple-map-canvas" />
      <div className="map-caption">
        {selectedLocation
          ? `${selectedLocation.name} を中心に表示`
          : currentPosition
            ? "現在地周辺のジムを地図表示中"
            : "東京中心のフォールバック地図を表示中"}
      </div>
      {mapError ? <div className="map-overlay-message">{mapError}</div> : null}
      {locations.length === 0 ? <div className="map-overlay-message">表示できる店舗がないため、地図だけを表示しています。</div> : null}
    </div>
  );
}
