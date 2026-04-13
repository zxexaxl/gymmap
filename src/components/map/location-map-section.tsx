"use client";

import Link from "next/link";
import { useState } from "react";

import type { GymLocation } from "@/lib/types";
import { getLocationAddress } from "@/lib/utils";

type LocationMapSectionProps = {
  locations: GymLocation[];
};

function toMapPoint(location: GymLocation) {
  const latitude = location.latitude ?? 35.68;
  const longitude = location.longitude ?? 139.76;

  return {
    ...location,
    top: `${12 + (35.9 - latitude) * 260}%`,
    left: `${8 + (longitude - 139.55) * 180}%`,
  };
}

export function LocationMapSection({ locations }: LocationMapSectionProps) {
  const visibleLocations = locations.filter((location) => location.latitude && location.longitude).slice(0, 6);
  const points = visibleLocations.map(toMapPoint);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(visibleLocations[0]?.id ?? null);
  const selectedLocation = visibleLocations.find((location) => location.id === selectedLocationId) ?? visibleLocations[0] ?? null;

  return (
    <section className="panel map-section">
      <div className="section-heading">
        <div>
          <h2>地図から店舗の場所をつかむ</h2>
          <p className="muted">どこにジムがあるかを地図で見ながら、気になる店舗を選んで詳細ページへ進めます。</p>
        </div>
        <Link href="/search">一覧から探す</Link>
      </div>

      <div className="map-layout">
        <div className="map-canvas" aria-label="ジム位置マップ">
          <div className="map-grid" />
          {points.map((point) => (
            <button
              key={point.id}
              type="button"
              className={`map-pin${selectedLocation?.id === point.id ? " is-active" : ""}`}
              style={{ top: point.top, left: point.left }}
              title={`${point.name} (${point.brand?.name ?? "Gym"})`}
              onClick={() => setSelectedLocationId(point.id)}
            >
              <span />
            </button>
          ))}
          {selectedLocation ? (
            <div className="map-info-card">
              <p className="map-location-brand">{selectedLocation.brand?.name ?? "-"}</p>
              <h3>{selectedLocation.name}</h3>
              <p className="muted">
                {selectedLocation.city}
                {selectedLocation.address_line ? ` ${selectedLocation.address_line}` : ""}
              </p>
              <Link href={`/locations/${selectedLocation.slug}`}>店舗詳細を見る</Link>
            </div>
          ) : null}
          <div className="map-caption">東京周辺の簡易マップ表示</div>
        </div>

        <div className="map-location-list">
          {visibleLocations.map((location) => (
            <article
              key={location.id}
              className={`map-location-item${selectedLocation?.id === location.id ? " is-active" : ""}`}
            >
              <p className="map-location-brand">{location.brand?.name ?? "-"}</p>
              <h3>{location.name}</h3>
              <p className="muted">{getLocationAddress(location.prefecture, location.city, location.address_line)}</p>
              <button type="button" className="map-select-button" onClick={() => setSelectedLocationId(location.id)}>
                地図で見る
              </button>
              <Link href={`/locations/${location.slug}`}>店舗詳細を見る</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
