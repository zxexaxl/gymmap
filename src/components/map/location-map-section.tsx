"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { scoreProgramQueryMatch, normalizeSearchKeyword } from "@/lib/search-query";
import type { GymLocation, SearchResult } from "@/lib/types";
import { buildSearchQuery, getLocationAddress } from "@/lib/utils";

type LocationMapSectionProps = {
  locations: GymLocation[];
  searchResults: SearchResult[];
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

const TOKYO_CENTER: Coordinates = {
  latitude: 35.681236,
  longitude: 139.767125,
};

function haversineDistanceKm(from: Coordinates, to: Coordinates) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitudeA = toRadians(from.latitude);
  const latitudeB = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) * Math.sin(deltaLongitude / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceLabel(distanceKm: number | null) {
  if (distanceKm === null) {
    return "距離不明";
  }

  if (distanceKm < 1) {
    return `約${Math.round(distanceKm * 1000)}m`;
  }

  return `約${distanceKm.toFixed(1)}km`;
}

function buildViewport(center: Coordinates, locations: GymLocation[]) {
  const latitudes = locations.map((location) => location.latitude ?? center.latitude);
  const longitudes = locations.map((location) => location.longitude ?? center.longitude);
  const latitudePadding = 0.05;
  const longitudePadding = 0.05;
  const minLatitude = Math.min(center.latitude, ...latitudes) - latitudePadding;
  const maxLatitude = Math.max(center.latitude, ...latitudes) + latitudePadding;
  const minLongitude = Math.min(center.longitude, ...longitudes) - longitudePadding;
  const maxLongitude = Math.max(center.longitude, ...longitudes) + longitudePadding;

  return {
    minLatitude,
    maxLatitude,
    minLongitude,
    maxLongitude,
  };
}

function toMapPoint(location: GymLocation, viewport: ReturnType<typeof buildViewport>) {
  const latitude = location.latitude ?? TOKYO_CENTER.latitude;
  const longitude = location.longitude ?? TOKYO_CENTER.longitude;
  const latitudeRange = Math.max(viewport.maxLatitude - viewport.minLatitude, 0.01);
  const longitudeRange = Math.max(viewport.maxLongitude - viewport.minLongitude, 0.01);
  const normalizedTop = (viewport.maxLatitude - latitude) / latitudeRange;
  const normalizedLeft = (longitude - viewport.minLongitude) / longitudeRange;

  return {
    ...location,
    top: `${Math.min(90, Math.max(10, normalizedTop * 100))}%`,
    left: `${Math.min(92, Math.max(8, normalizedLeft * 100))}%`,
  };
}

export function LocationMapSection({ locations, searchResults }: LocationMapSectionProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [programQuery, setProgramQuery] = useState("");
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<"loading" | "granted" | "denied" | "fallback">("loading");

  function requestCurrentPosition() {
    if (!("geolocation" in navigator)) {
      setGeolocationStatus("fallback");
      return;
    }

    setGeolocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeolocationStatus("granted");
      },
      () => {
        setGeolocationStatus("denied");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }

  useEffect(() => {
    requestCurrentPosition();
  }, []);

  const normalizedQuery = normalizeSearchKeyword(programQuery);
  const matchedResults = normalizedQuery
    ? searchResults.filter((result) => scoreProgramQueryMatch(result, normalizedQuery) > 0)
    : searchResults;
  const matchedLocationIds = new Set(matchedResults.map((result) => result.location.id));
  const matchesByLocationId = new Map<string, SearchResult[]>();

  matchedResults.forEach((result) => {
    const matches = matchesByLocationId.get(result.location.id) ?? [];
    matches.push(result);
    matchesByLocationId.set(result.location.id, matches);
  });
  const center = currentPosition ?? TOKYO_CENTER;
  const filteredLocations = locations
    .filter((location) => location.latitude && location.longitude)
    .filter((location) => (normalizedQuery ? matchedLocationIds.has(location.id) : true))
    .map((location) => ({
      ...location,
      distanceKm:
        location.latitude && location.longitude
          ? haversineDistanceKm(center, {
              latitude: location.latitude,
              longitude: location.longitude,
            })
          : null,
    }))
    .sort((left, right) => {
      if (left.distanceKm === null && right.distanceKm === null) {
        return left.name.localeCompare(right.name);
      }

      if (left.distanceKm === null) {
        return 1;
      }

      if (right.distanceKm === null) {
        return -1;
      }

      return left.distanceKm - right.distanceKm;
    });
  const visibleLocations = filteredLocations;
  const viewport = buildViewport(center, visibleLocations);
  const points = visibleLocations.map((location) => toMapPoint(location, viewport));
  const selectedLocation =
    visibleLocations.find((location) => location.id === selectedLocationId) ?? visibleLocations[0] ?? null;
  const selectedLocationMatches = selectedLocation ? matchesByLocationId.get(selectedLocation.id) ?? [] : [];

  function formatMatchedLessonSummary(locationId: string) {
    const matches = matchesByLocationId.get(locationId) ?? [];

    if (!matches.length) {
      return null;
    }

    const uniqueNames = Array.from(new Set(matches.map((item) => item.schedule.raw_program_name)));
    const preview = uniqueNames.slice(0, 3);
    const restCount = uniqueNames.length - preview.length;

    return restCount > 0 ? `${preview.join(", ")} 他${restCount}件` : preview.join(", ");
  }

  function buildLessonDetailHref(location: GymLocation) {
    const query = buildSearchQuery({
      q: programQuery.trim(),
      weekday: "",
      timeRange: "",
      durationRange: "",
      brand: "",
      area: location.name,
    });

    return query ? `/search?${query}` : `/search?area=${encodeURIComponent(location.name)}`;
  }

  useEffect(() => {
    if (!visibleLocations.length) {
      setSelectedLocationId(null);
      return;
    }

    if (!selectedLocationId || !visibleLocations.some((location) => location.id === selectedLocationId)) {
      setSelectedLocationId(visibleLocations[0].id);
    }
  }, [selectedLocationId, visibleLocations]);

  const statusLabel =
    geolocationStatus === "granted"
      ? "現在地に近い順で表示中"
      : geolocationStatus === "denied"
        ? "位置情報が使えないため、東京中心で表示中"
        : geolocationStatus === "fallback"
          ? "位置情報未対応のため、東京中心で表示中"
          : "現在地を確認中";
  const resultSummary = normalizedQuery
    ? `「${programQuery.trim()}」に一致するレッスンがある${visibleLocations.length}店舗・${matchedResults.length}レッスンを表示中`
    : `${visibleLocations.length}店舗を現在地に近い順で表示中`;

  return (
    <section className="panel map-section">
      <div className="section-heading">
        <div>
          <h2>近くのジムを地図から探す</h2>
          <p className="muted">現在地に近い店舗を見ながら、気になるレッスンがあるジムだけを地図と一覧で絞り込めます。</p>
        </div>
        <Link href="/search">一覧から探す</Link>
      </div>
      <div className="map-toolbar">
        <label className="map-search-field">
          <span>レッスン名で絞り込む</span>
          <input
            type="search"
            value={programQuery}
            onChange={(event) => setProgramQuery(event.target.value)}
            placeholder="BODYCOMBAT / ヨガ / ピラティス など"
          />
        </label>
        <p className="map-status muted">
          {statusLabel} / {resultSummary}
        </p>
        {geolocationStatus !== "granted" ? (
          <div className="map-geolocation-help">
            <p className="muted">現在地を許可すると、近くのジムを優先して表示できます。</p>
            <button type="button" className="map-geolocation-button" onClick={requestCurrentPosition}>
              現在地を使う
            </button>
          </div>
        ) : null}
      </div>

      <div className="map-layout">
        <div className="map-canvas" aria-label="ジム位置マップ">
          <div className="map-grid" />
          {currentPosition ? <div className="map-user-dot" style={{ top: "50%", left: "50%" }} aria-hidden="true" /> : null}
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
              <p className="muted">{formatDistanceLabel(selectedLocation.distanceKm ?? null)}</p>
              {selectedLocationMatches.length > 0 ? (
                <p className="muted">一致レッスン: {formatMatchedLessonSummary(selectedLocation.id)}</p>
              ) : null}
              <Link href={`/locations/${selectedLocation.slug}`}>店舗詳細を見る</Link>
            </div>
          ) : null}
          <div className="map-caption">{currentPosition ? "現在地を中心にした簡易マップ表示" : "東京周辺の簡易マップ表示"}</div>
        </div>

        <div className="map-location-list">
          {visibleLocations.length === 0 ? (
            <article className="map-location-item">
              <h3>該当する店舗がありません</h3>
              <p className="muted">レッスン名を変えるか、検索語を空にして近くのジム一覧へ戻してください。</p>
            </article>
          ) : null}
          {visibleLocations.map((location) => (
            <article
              key={location.id}
              className={`map-location-item${selectedLocation?.id === location.id ? " is-active" : ""}`}
            >
              <p className="map-location-brand">{location.brand?.name ?? "-"}</p>
              <h3>{location.name}</h3>
              <p className="muted">{getLocationAddress(location.prefecture, location.city, location.address_line)}</p>
              <p className="muted">{formatDistanceLabel(location.distanceKm ?? null)}</p>
              {normalizedQuery && formatMatchedLessonSummary(location.id) ? (
                <p className="muted">一致レッスン: {formatMatchedLessonSummary(location.id)}</p>
              ) : null}
              <button type="button" className="map-select-button" onClick={() => setSelectedLocationId(location.id)}>
                地図で見る
              </button>
              {normalizedQuery ? <Link href={buildLessonDetailHref(location)}>レッスン詳細を見る</Link> : null}
              <Link href={`/locations/${location.slug}`}>店舗詳細を見る</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
