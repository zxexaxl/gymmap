"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { appleMapsToken } from "@/lib/map-provider";
import {
  getMapMarkerPresentation,
  resolveMapMarkerState,
  type MapMarkerState,
} from "@/components/map/map-marker-presentation";
import type { MapBounds, MapComponentProps } from "@/components/map/map-types";

const APPLE_MAPKIT_SCRIPT_URL = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
const MAPKIT_FALLBACK_MESSAGE = "Apple Maps を読み込めなかったため、OpenStreetMap に切り替えます。";

type AppleCoordinate = {
  latitude: number;
  longitude: number;
};

type AppleRegion = {
  center: AppleCoordinate;
  span: {
    latitudeDelta: number;
    longitudeDelta: number;
  };
};

interface AppleAnnotation extends EventTarget {
  accessibilityLabel: string | null;
  element: HTMLElement | null;
  selected: boolean;
}

interface AppleMap extends EventTarget {
  addAnnotation: (annotation: AppleAnnotation) => AppleAnnotation | null;
  center: AppleCoordinate;
  region: AppleRegion;
  removeAnnotation: (annotation: AppleAnnotation) => void;
  selectedAnnotation: AppleAnnotation | null;
  setCenterAnimated?: (coordinate: AppleCoordinate) => void;
  setRegionAnimated?: (region: AppleRegion) => void;
}

type AppleMapKit = {
  Coordinate: new (latitude: number, longitude: number) => AppleCoordinate;
  CoordinateRegion?: new (center: AppleCoordinate, span: AppleRegion["span"]) => AppleRegion;
  CoordinateSpan?: new (latitudeDelta: number, longitudeDelta: number) => AppleRegion["span"];
  FeatureVisibility?: {
    Hidden: unknown;
  };
  Map: new (container: HTMLElement, options: Record<string, unknown>) => AppleMap;
  MarkerAnnotation: new (
    coordinate: AppleCoordinate,
    options: Record<string, unknown>,
  ) => AppleAnnotation;
  init: (options: {
    authorizationCallback: (done: (value: string) => void) => void;
    language: string;
  }) => void;
};

declare global {
  interface Window {
    mapkit?: AppleMapKit;
    __appleMapKitLoadPromise?: Promise<AppleMapKit>;
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

function bindAccessibleAnnotationElement(
  annotation: AppleAnnotation,
  accessibleLabel: string,
  selected: boolean,
  markerState: MapMarkerState,
  onActivate: () => void,
) {
  const element = annotation.element;

  if (!element) {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onActivate();
  }

  element.setAttribute("tabindex", "0");
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", accessibleLabel);
  element.setAttribute("aria-pressed", String(selected));
  element.setAttribute("data-marker-state", markerState);
  element.classList.add("apple-gym-map-marker");
  element.classList.toggle("apple-gym-map-marker--selected", selected);
  element.addEventListener("keydown", handleKeyDown);

  return () => {
    element.removeEventListener("keydown", handleKeyDown);
  };
}

export function AppleGymMap({
  locations,
  selectedLocationId,
  center,
  currentPosition,
  focusCenter = false,
  focusRequestId = 0,
  onSelectLocation,
  onClearSelection,
  onBoundsChange,
  onProviderError,
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AppleMap | null>(null);
  const annotationsRef = useRef<AppleAnnotation[]>([]);
  const annotationCleanupRef = useRef<Array<() => void>>([]);
  const isSynchronizingSelectionRef = useRef(false);
  const lastCenterKeyRef = useRef<string | null>(null);
  const lastFocusRequestIdRef = useRef(focusRequestId);
  const previousSelectedLocationIdRef = useRef(selectedLocationId);
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const [mapkitState, setMapkitState] = useState<AppleMapKit | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;

  const selectedCenter = useMemo(
    () =>
      !focusCenter && selectedLocation && selectedLocation.latitude !== null && selectedLocation.longitude !== null
        ? {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }
        : { latitude: center.latitude, longitude: center.longitude },
    [center, focusCenter, selectedLocation],
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

      const initialCoordinate = new mapkitState.Coordinate(selectedCenter.latitude, selectedCenter.longitude);
      if (mapkitState.CoordinateRegion && mapkitState.CoordinateSpan) {
        map.region = new mapkitState.CoordinateRegion(initialCoordinate, new mapkitState.CoordinateSpan(0.08, 0.08));
      } else {
        map.center = initialCoordinate;
      }
      lastCenterKeyRef.current = `${selectedCenter.latitude}:${selectedCenter.longitude}`;
      mapRef.current = map;

      console.info("[map] Apple Maps initialized", {
        locationCount: locations.length,
        selectedLocationId,
        center,
      });
    } catch (error) {
      console.error("[map] Apple Maps map init failed", error);
      // This is the synchronous failure boundary for the external MapKit
      // constructor; the state is used only until the parent fallback runs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapError(MAPKIT_FALLBACK_MESSAGE);
      onProviderError?.(MAPKIT_FALLBACK_MESSAGE);
    }
  }, [center, locations.length, mapkitState, onProviderError, selectedCenter.latitude, selectedCenter.longitude, selectedLocationId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const handleBackgroundActivation = () => {
      onClearSelection?.();
    };

    map.addEventListener("single-tap", handleBackgroundActivation);

    return () => {
      map.removeEventListener("single-tap", handleBackgroundActivation);
    };
  }, [mapkitState, onClearSelection]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapkitState) {
      return;
    }

    annotationCleanupRef.current.forEach((cleanup) => cleanup());
    annotationCleanupRef.current = [];
    annotationsRef.current.forEach((annotation) => {
      try {
        map.removeAnnotation(annotation);
      } catch {
        // no-op
      }
    });
    annotationsRef.current = [];
    const pendingAccessibleBindings: Array<{
      annotation: AppleAnnotation;
      accessibleLabel: string;
      selected: boolean;
      markerState: MapMarkerState;
      onActivate: () => void;
    }> = [];

    const annotations = locations
      .filter((location) => location.latitude !== null && location.longitude !== null)
      .map((location) => {
        const selected = location.id === selectedLocationId;
        const markerState = resolveMapMarkerState({
          selected,
          previewed: false,
          hasSelection: selectedLocationId !== null,
        });
        const presentation = getMapMarkerPresentation(markerState);
        const annotation = new mapkitState.MarkerAnnotation(
          new mapkitState.Coordinate(location.latitude as number, location.longitude as number),
          {
            title: location.name,
            subtitle: location.brandName ?? "",
            color: presentation.fillColor,
            glyphText: presentation.glyphText ?? "",
          },
        );

        const accessibleLabel = location.brandName ? `${location.brandName} / ${location.name}` : location.name;
        annotation.accessibilityLabel = accessibleLabel;
        annotation.addEventListener("select", () => {
          if (!isSynchronizingSelectionRef.current) {
            onSelectLocation(location.id);
          }
        });

        map.addAnnotation(annotation);
        pendingAccessibleBindings.push({
          annotation,
          accessibleLabel,
          selected,
          markerState,
          onActivate: () => onSelectLocation(location.id),
        });
        return annotation;
      });

    if (currentPosition) {
      const currentPositionAnnotation = new mapkitState.MarkerAnnotation(
        new mapkitState.Coordinate(currentPosition.latitude, currentPosition.longitude),
        {
          title: "現在地",
          color: "#2563eb",
          glyphText: "◎",
        },
      );
      map.addAnnotation(currentPositionAnnotation);
      annotations.push(currentPositionAnnotation);
    }

    annotationsRef.current = annotations;
    const selectedLocationIndex = locations
      .filter((location) => location.latitude !== null && location.longitude !== null)
      .findIndex((location) => location.id === selectedLocationId);

    isSynchronizingSelectionRef.current = true;
    map.selectedAnnotation = selectedLocationIndex >= 0 ? annotations[selectedLocationIndex] : null;
    isSynchronizingSelectionRef.current = false;

    let annotationObserver: MutationObserver | null = null;
    const bindAvailableAnnotationElements = () => {
      for (let index = pendingAccessibleBindings.length - 1; index >= 0; index -= 1) {
        const pending = pendingAccessibleBindings[index];
        const cleanup = bindAccessibleAnnotationElement(
          pending.annotation,
          pending.accessibleLabel,
          pending.selected,
          pending.markerState,
          pending.onActivate,
        );

        if (cleanup) {
          annotationCleanupRef.current.push(cleanup);
          pendingAccessibleBindings.splice(index, 1);
        }
      }

      if (pendingAccessibleBindings.length === 0) {
        annotationObserver?.disconnect();
        annotationObserver = null;
      }
    };

    bindAvailableAnnotationElements();
    if (pendingAccessibleBindings.length > 0 && containerRef.current) {
      annotationObserver = new MutationObserver(bindAvailableAnnotationElements);
      annotationObserver.observe(containerRef.current, { childList: true, subtree: true });
      annotationCleanupRef.current.push(() => annotationObserver?.disconnect());
    }

    return () => {
      annotationCleanupRef.current.forEach((cleanup) => cleanup());
      annotationCleanupRef.current = [];
    };
  }, [currentPosition, locations, mapkitState, onSelectLocation, selectedLocationId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapkitState) {
      return;
    }

    const selectionWasCleared =
      previousSelectedLocationIdRef.current !== null && selectedLocationId === null;
    previousSelectedLocationIdRef.current = selectedLocationId;
    const focusWasRequested = lastFocusRequestIdRef.current !== focusRequestId;
    lastFocusRequestIdRef.current = focusRequestId;

    if (selectionWasCleared && !focusWasRequested) {
      return;
    }

    const nextCenterKey = `${selectedCenter.latitude}:${selectedCenter.longitude}`;
    if (!focusWasRequested && lastCenterKeyRef.current === nextCenterKey) {
      return;
    }

    const nextCoordinate = new mapkitState.Coordinate(selectedCenter.latitude, selectedCenter.longitude);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (mapkitState.CoordinateRegion && mapkitState.CoordinateSpan) {
      const narrow = containerRef.current ? containerRef.current.clientWidth <= 640 : false;
      const presentationAdjustedCoordinate = selectedLocation && !focusCenter
        ? new mapkitState.Coordinate(
            selectedCenter.latitude - (narrow ? 0.016 : 0),
            selectedCenter.longitude,
          )
        : nextCoordinate;
      const nextRegion = new mapkitState.CoordinateRegion(
        presentationAdjustedCoordinate,
        new mapkitState.CoordinateSpan(0.08, 0.08),
      );
      if (!reduceMotion && typeof map.setRegionAnimated === "function") {
        map.setRegionAnimated(nextRegion);
      } else {
        map.region = nextRegion;
      }
    } else if (!reduceMotion && typeof map.setCenterAnimated === "function") {
      map.setCenterAnimated(nextCoordinate);
    } else {
      map.center = nextCoordinate;
    }

    lastCenterKeyRef.current = nextCenterKey;
  }, [focusCenter, focusRequestId, mapkitState, selectedCenter.latitude, selectedCenter.longitude, selectedLocation, selectedLocationId]);

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

      const nextBounds = {
        north: region.center.latitude + region.span.latitudeDelta / 2,
        south: region.center.latitude - region.span.latitudeDelta / 2,
        east: region.center.longitude + region.span.longitudeDelta / 2,
        west: region.center.longitude - region.span.longitudeDelta / 2,
      };
      const previousBounds = lastBoundsRef.current;
      const isUnchanged =
        previousBounds !== null &&
        Math.abs(previousBounds.north - nextBounds.north) < 0.000001 &&
        Math.abs(previousBounds.south - nextBounds.south) < 0.000001 &&
        Math.abs(previousBounds.east - nextBounds.east) < 0.000001 &&
        Math.abs(previousBounds.west - nextBounds.west) < 0.000001;

      if (isUnchanged) {
        return;
      }

      lastBoundsRef.current = nextBounds;
      onBoundsChange(nextBounds);
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
