"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { scoreProgramQueryMatch, normalizeSearchKeyword } from "@/lib/search-query";
import type { GymLocation, SearchResult } from "@/lib/types";
import { buildSearchQuery, getLocationAddress } from "@/lib/utils";

const LeafletGymMap = dynamic(
  () => import("@/components/map/leaflet-gym-map").then((module) => module.LeafletGymMap),
  {
    ssr: false,
    loading: () => <div className="map-canvas map-canvas-fallback">地図を読み込んでいます…</div>,
  },
);

type LocationMapSectionProps = {
  locations: GymLocation[];
  searchResults: SearchResult[];
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type GeolocationPermissionState = "granted" | "prompt" | "denied" | "unsupported" | "unknown";

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

export function LocationMapSection({ locations, searchResults }: LocationMapSectionProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [programQuery, setProgramQuery] = useState("");
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [geolocationStatus, setGeolocationStatus] = useState<"idle" | "loading" | "granted" | "denied" | "fallback" | "error">("idle");
  const [permissionState, setPermissionState] = useState<GeolocationPermissionState>("unknown");
  const [geolocationMessage, setGeolocationMessage] = useState("現在地を確認すると、近くのジムを優先して表示できます。");

  async function syncPermissionState() {
    if (!("geolocation" in navigator)) {
      setPermissionState("unsupported");
      setGeolocationStatus("fallback");
      setGeolocationMessage("この環境では位置情報に対応していないため、東京中心で表示しています。");
      return;
    }

    if (!("permissions" in navigator) || !navigator.permissions?.query) {
      setPermissionState("unknown");
      return;
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
      setPermissionState(permissionStatus.state);

      permissionStatus.onchange = () => {
        setPermissionState(permissionStatus.state);
      };
    } catch {
      setPermissionState("unknown");
    }
  }

  async function requestCurrentPosition() {
    if (!("geolocation" in navigator)) {
      setPermissionState("unsupported");
      setGeolocationStatus("fallback");
      setGeolocationMessage("この環境では位置情報に対応していないため、東京中心で表示しています。");
      return;
    }

    setGeolocationStatus("loading");
    setGeolocationMessage("現在地を取得しています…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeolocationStatus("granted");
        setPermissionState("granted");
        setGeolocationMessage("現在地を取得しました。近い順で表示しています。");
      },
      () => {
        setGeolocationStatus("denied");
        setGeolocationMessage(
          permissionState === "denied"
            ? "このサイトでは位置情報が拒否されています。ブラウザ設定から許可してください。"
            : "位置情報を取得できませんでした。許可設定または端末の位置情報設定をご確認ください。",
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }

  useEffect(() => {
    syncPermissionState();
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
  const fallbackCenter = currentPosition ?? TOKYO_CENTER;
  const filteredLocations = locations
    .filter((location) => location.latitude && location.longitude)
    .filter((location) => (normalizedQuery ? matchedLocationIds.has(location.id) : true))
    .map((location) => ({
      ...location,
      distanceKm:
        location.latitude && location.longitude
          ? haversineDistanceKm(fallbackCenter, {
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
  const selectedLocation =
    visibleLocations.find((location) => location.id === selectedLocationId) ?? visibleLocations[0] ?? null;
  const mapCenter =
    selectedLocation && selectedLocation.latitude && selectedLocation.longitude
      ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      : fallbackCenter;
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
        : geolocationStatus === "error"
          ? "位置情報を取得できなかったため、東京中心で表示中"
        : geolocationStatus === "fallback"
          ? "位置情報未対応のため、東京中心で表示中"
          : geolocationStatus === "loading"
            ? "現在地を取得中"
            : "現在地は未取得です";
  const resultSummary = normalizedQuery
    ? `「${programQuery.trim()}」に一致するレッスンがある${visibleLocations.length}店舗・${matchedResults.length}レッスンを表示中`
    : `${visibleLocations.length}店舗を現在地に近い順で表示中`;

  return (
    <section id="map-section" className="panel map-section page-anchor-section">
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
        <p className="map-status-detail muted">
          {permissionState === "prompt"
            ? "現在地の利用は未許可です。ボタンを押すとブラウザの許可確認が表示されます。"
            : permissionState === "denied"
              ? "このサイトでは位置情報が拒否されています。ブラウザ設定から許可してください。"
              : permissionState === "granted"
                ? "現在地が使えるため、近い順で一覧を更新しています。"
                : geolocationMessage}
        </p>
        {geolocationStatus !== "granted" ? (
          <div className="map-geolocation-help">
            <p className="muted">{geolocationMessage}</p>
            <button
              type="button"
              className="map-geolocation-button"
              onClick={() => {
                void syncPermissionState();
                void requestCurrentPosition();
              }}
              disabled={geolocationStatus === "loading"}
            >
              {geolocationStatus === "loading" ? "現在地を取得中…" : "現在地を使う"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="map-layout">
        <div className="map-canvas" aria-label="ジム位置マップ">
          <LeafletGymMap
            locations={visibleLocations.map((location) => ({
              id: location.id,
              name: location.name,
              brandName: location.brand?.name,
              latitude: location.latitude,
              longitude: location.longitude,
            }))}
            selectedLocationId={selectedLocation?.id ?? null}
            center={mapCenter}
            currentPosition={currentPosition}
            onSelectLocation={setSelectedLocationId}
          />
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
              role="button"
              tabIndex={0}
              onClick={() => setSelectedLocationId(location.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedLocationId(location.id);
                }
              }}
            >
              <p className="map-location-brand">{location.brand?.name ?? "-"}</p>
              <h3>{location.name}</h3>
              <p className="muted">{getLocationAddress(location.prefecture, location.city, location.address_line)}</p>
              <p className="muted">{formatDistanceLabel(location.distanceKm ?? null)}</p>
              {normalizedQuery && formatMatchedLessonSummary(location.id) ? (
                <p className="muted">一致レッスン: {formatMatchedLessonSummary(location.id)}</p>
              ) : null}
              <button
                type="button"
                className="map-select-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedLocationId(location.id);
                }}
              >
                地図で見る
              </button>
              <div className="map-link-row">
                {normalizedQuery ? (
                  <Link
                    href={buildLessonDetailHref(location)}
                    onClick={(event) => {
                      event.stopPropagation();
                    }}
                  >
                    レッスン詳細を見る
                  </Link>
                ) : null}
                <Link
                  href={`/locations/${location.slug}`}
                  onClick={(event) => {
                    event.stopPropagation();
                  }}
                >
                  店舗詳細を見る
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
