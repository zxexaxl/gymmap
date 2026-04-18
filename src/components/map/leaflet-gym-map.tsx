"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type MapLocation = {
  id: string;
  name: string;
  brandName?: string;
  latitude: number | null;
  longitude: number | null;
};

type LeafletGymMapProps = {
  locations: MapLocation[];
  selectedLocationId: string | null;
  center: Coordinates;
  currentPosition: Coordinates | null;
  onSelectLocation: (id: string) => void;
};

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

  useEffect(() => {
    const handle = window.setTimeout(() => {
      map.invalidateSize();

      if (hasSelectedLocation || !bounds) {
        map.flyTo([center.latitude, center.longitude], 13, {
          animate: true,
          duration: 0.6,
        });
      } else if (bounds) {
        map.fitBounds(bounds, {
          padding: [28, 28],
          maxZoom: 14,
        });
      }
    }, 120);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(map.getContainer());

    return () => {
      window.clearTimeout(handle);
      resizeObserver.disconnect();
    };
  }, [bounds, center.latitude, center.longitude, hasSelectedLocation, map]);

  return null;
}

export function LeafletGymMap({ locations, selectedLocationId, center, currentPosition, onSelectLocation }: LeafletGymMapProps) {
  const [tileError, setTileError] = useState<string | null>(null);

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;

  const mapCenter: LatLngExpression = useMemo(() => {
    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      return [selectedLocation.latitude, selectedLocation.longitude];
    }

    return [center.latitude, center.longitude];
  }, [center.latitude, center.longitude, selectedLocation?.latitude, selectedLocation?.longitude]);

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
        zoom={12}
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
