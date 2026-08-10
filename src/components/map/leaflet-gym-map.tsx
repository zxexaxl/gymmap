"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

import type { Coordinates, MapBounds, MapComponentProps } from "@/components/map/map-types";

function MapBoundsReporter({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const lastBoundsRef = useRef<MapBounds | null>(null);

  useMapEvents({
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

function MapController({
  center,
  bounds,
  hasSelectedLocation,
}: {
  center: Coordinates;
  bounds: LatLngBoundsExpression | null;
  hasSelectedLocation: boolean;
}) {
  const map = useMap();
  const hasPositionedRef = useRef(false);

  useEffect(() => {
    if (hasSelectedLocation || !bounds) {
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
  }, [bounds, center.latitude, center.longitude, hasSelectedLocation, map]);

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
  onSelectLocation,
  onBoundsChange,
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
        <MapBoundsReporter onBoundsChange={onBoundsChange} />
        <MapController center={center} bounds={bounds} hasSelectedLocation={Boolean(selectedLocation)} />
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
              <CircleMarker
                key={location.id}
                center={[location.latitude as number, location.longitude as number]}
                radius={isSelected ? 11 : 8}
                pathOptions={{
                  color: isSelected ? "#7f2f16" : "#b0502d",
                  fillColor: isSelected ? "#7f2f16" : "#b0502d",
                  fillOpacity: 0.92,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onSelectLocation(location.id),
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {location.brandName ? `${location.brandName} / ${location.name}` : location.name}
                </Tooltip>
              </CircleMarker>
            );
          })}
      </MapContainer>
      <div className="map-caption">
        {selectedLocation
          ? `${selectedLocation.name} を中心に表示`
          : currentPosition
            ? "現在地周辺のジムを地図表示中"
            : "東京中心のフォールバック地図を表示中"}
      </div>
      {tileError ? <div className="map-overlay-message">{tileError}</div> : null}
      {locations.length === 0 ? <div className="map-overlay-message">表示できる店舗がないため、東京中心の地図だけを表示しています。</div> : null}
    </div>
  );
}
