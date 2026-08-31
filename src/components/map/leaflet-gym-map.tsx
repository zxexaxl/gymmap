"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker, LatLngBoundsExpression, LatLngExpression } from "leaflet";

import type { Coordinates, MapBounds, MapComponentProps } from "@/components/map/map-types";

function MapInteractionReporter({
  onBoundsChange,
  onClearSelection,
}: {
  onBoundsChange?: (bounds: MapBounds) => void;
  onClearSelection?: () => void;
}) {
  const lastBoundsRef = useRef<MapBounds | null>(null);

  useMapEvents({
    click(event) {
      const target = event.originalEvent.target;

      if (target instanceof Element && target.closest(".leaflet-interactive, .leaflet-control")) {
        return;
      }

      onClearSelection?.();
    },
    moveend(event) {
      const bounds = event.target.getBounds();
      const nextBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
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
      onBoundsChange?.(nextBounds);
    },
  });

  return null;
}

function AccessibleLocationMarker({
  location,
  selected,
  onSelect,
}: {
  location: MapComponentProps["locations"][number];
  selected: boolean;
  onSelect: () => void;
}) {
  const markerRef = useRef<LeafletCircleMarker | null>(null);
  const accessibleLabel = location.brandName ? `${location.brandName} / ${location.name}` : location.name;

  useEffect(() => {
    const element = markerRef.current?.getElement();

    if (!element) {
      return;
    }

    element.setAttribute("tabindex", "0");
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", accessibleLabel);
    element.setAttribute("aria-pressed", String(selected));

    function handleKeyDown(event: Event) {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onSelect();
      }
    }

    element.addEventListener("keydown", handleKeyDown);

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, [accessibleLabel, onSelect, selected]);

  return (
    <CircleMarker
      ref={markerRef}
      center={[location.latitude as number, location.longitude as number]}
      radius={selected ? 11 : 8}
      pathOptions={{
        color: selected ? "#7f2f16" : "#b0502d",
        fillColor: selected ? "#7f2f16" : "#b0502d",
        fillOpacity: 0.92,
        weight: 2,
      }}
      eventHandlers={{
        click: onSelect,
      }}
    >
      <Tooltip direction="top" offset={[0, -8]}>
        {accessibleLabel}
      </Tooltip>
    </CircleMarker>
  );
}

function MapController({
  center,
  bounds,
  hasSelectedLocation,
  focusCenter,
}: {
  center: Coordinates;
  bounds: LatLngBoundsExpression | null;
  hasSelectedLocation: boolean;
  focusCenter: boolean;
}) {
  const map = useMap();
  const hasPositionedRef = useRef(false);

  useEffect(() => {
    if (hasSelectedLocation || focusCenter || !bounds) {
      const nextCenter: LatLngExpression = [center.latitude, center.longitude];
      const isAlreadyAtTarget =
        map.distance(map.getCenter(), nextCenter) < 1 && Math.abs(map.getZoom() - 13) < 0.01;

      if (!isAlreadyAtTarget) {
        if (hasPositionedRef.current) {
          map.flyTo(nextCenter, 13, {
            animate: true,
            duration: 0.35,
          });
        } else {
          map.setView(nextCenter, 13, { animate: false });
        }
      }
    } else {
      map.fitBounds(bounds, {
        animate: hasPositionedRef.current,
        padding: [28, 28],
        maxZoom: 14,
      });
    }

    hasPositionedRef.current = true;
  }, [bounds, center.latitude, center.longitude, focusCenter, hasSelectedLocation, map]);

  useEffect(() => {
    const container = map.getContainer();
    let previousWidth = container.clientWidth;
    let previousHeight = container.clientHeight;

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;

      if (nextWidth === previousWidth && nextHeight === previousHeight) {
        return;
      }

      previousWidth = nextWidth;
      previousHeight = nextHeight;
      map.invalidateSize({ animate: false, debounceMoveend: true, pan: false });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

export function LeafletGymMap({
  locations,
  selectedLocationId,
  center,
  currentPosition,
  focusCenter = false,
  onSelectLocation,
  onClearSelection,
  onBoundsChange,
  unselectedCaption,
}: MapComponentProps) {
  const [tileError, setTileError] = useState<string | null>(null);

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;

  const mapCenter: LatLngExpression = useMemo(() => {
    if (selectedLocation && selectedLocation.latitude !== null && selectedLocation.longitude !== null) {
      return [selectedLocation.latitude, selectedLocation.longitude];
    }

    return [center.latitude, center.longitude];
  }, [center, selectedLocation]);

  const bounds = useMemo<LatLngBoundsExpression | null>(() => {
    const points = locations
      .filter((location) => location.latitude !== null && location.longitude !== null)
      .map((location) => [location.latitude as number, location.longitude as number] as [number, number]);

    if (currentPosition) {
      points.push([currentPosition.latitude, currentPosition.longitude]);
    }

    if (points.length >= 2) {
      return points;
    }

    return null;
  }, [currentPosition, locations]);

  return (
    <div className="leaflet-map-root">
      <MapContainer
        center={mapCenter}
        zoom={selectedLocation ? 13 : 12}
        scrollWheelZoom={true}
        className="leaflet-map"
        whenReady={() => {
          console.info("[map] initialized", {
            locationCount: locations.length,
            selectedLocationId,
            center,
          });
        }}
      >
        <MapInteractionReporter onBoundsChange={onBoundsChange} onClearSelection={onClearSelection} />
        <MapController
          center={center}
          bounds={bounds}
          hasSelectedLocation={Boolean(selectedLocation)}
          focusCenter={focusCenter}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: (event) => {
              console.error("[map] tile request failed", event);
              setTileError("地図タイルの読み込みに失敗しました。ネットワーク接続をご確認ください。");
            },
            load: () => {
              setTileError(null);
            },
          }}
        />
        {currentPosition ? (
          <CircleMarker center={[currentPosition.latitude, currentPosition.longitude]} radius={8} pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.9 }}>
            <Tooltip direction="top" offset={[0, -8]} permanent={false}>
              現在地
            </Tooltip>
          </CircleMarker>
        ) : null}
        {locations
          .filter((location) => location.latitude !== null && location.longitude !== null)
          .map((location) => {
            const isSelected = location.id === selectedLocationId;

            return (
              <AccessibleLocationMarker
                key={location.id}
                location={location}
                selected={isSelected}
                onSelect={() => onSelectLocation(location.id)}
              />
            );
          })}
      </MapContainer>
      <div className="map-caption">
        {selectedLocation
          ? `${selectedLocation.name} を中心に表示`
          : currentPosition
            ? "現在地周辺のジムを地図表示中"
            : (unselectedCaption ?? "東京中心のフォールバック地図を表示中")}
      </div>
      {tileError ? <div className="map-overlay-message">{tileError}</div> : null}
      {locations.length === 0 ? <div className="map-overlay-message">表示できる店舗がないため、東京中心の地図だけを表示しています。</div> : null}
    </div>
  );
}
