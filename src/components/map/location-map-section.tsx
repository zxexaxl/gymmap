"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { MapBounds } from "@/components/map/map-types";
import { configuredMapProvider, type MapProvider } from "@/lib/map-provider";
import { scoreProgramTextQueryMatch, normalizeSearchKeyword } from "@/lib/search-query";
import type { GymLocation, MapLessonSearchItem, MapLocationLessonIndex } from "@/lib/types";
import { buildSearchQuery, getLocationAddress } from "@/lib/utils";

const LeafletGymMap = dynamic(
  () => import("@/components/map/leaflet-gym-map").then((module) => module.LeafletGymMap),
  {
    ssr: false,
    loading: () => <div className="map-canvas map-canvas-fallback">地図を読み込んでいます…</div>,
  },
);

const AppleGymMap = dynamic(
  () => import("@/components/map/apple-gym-map").then((module) => module.AppleGymMap),
  {
    ssr: false,
    loading: () => <div className="map-canvas map-canvas-fallback">Apple Maps を読み込んでいます…</div>,
  },
);

type LocationMapSectionProps = {
  locations: GymLocation[];
  lessonIndex: MapLocationLessonIndex[];
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

function isLocationInsideBounds(location: GymLocation, bounds: MapBounds | null) {
  if (!bounds || location.latitude === null || location.longitude === null) {
    return true;
  }

  return (
    location.latitude <= bounds.north &&
    location.latitude >= bounds.south &&
    location.longitude <= bounds.east &&
    location.longitude >= bounds.west
  );
}

export function LocationMapSection({ locations, lessonIndex }: LocationMapSectionProps) {
  const [activeMapProvider, setActiveMapProvider] = useState<MapProvider>(configuredMapProvider);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [programQuery, setProgramQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [prefectureFilter, setPrefectureFilter] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("");
  const [listScope, setListScope] = useState<"nearby" | "map">("nearby");
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
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
  const matchesByLocationId = new Map<string, MapLessonSearchItem[]>();
  let matchedLessonCount = 0;

  lessonIndex.forEach((locationEntry) => {
    const matches = normalizedQuery
      ? locationEntry.lessons.filter((lesson) => scoreProgramTextQueryMatch(lesson, normalizedQuery) > 0)
      : locationEntry.lessons;

    if (matches.length) {
      matchesByLocationId.set(locationEntry.locationId, matches);
      matchedLessonCount += matches.length;
    }
  });

  const matchedLocationIds = new Set(matchesByLocationId.keys());
  const fallbackCenter = currentPosition ?? TOKYO_CENTER;
  const mappableLocations = useMemo(
    () =>
      locations
        .filter((location) => location.latitude !== null && location.longitude !== null)
        .map((location) => ({
          ...location,
          distanceKm:
            location.latitude !== null && location.longitude !== null
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
        }),
    [fallbackCenter, locations],
  );
  const mapLocations = useMemo(
    () =>
      mappableLocations.map((location) => ({
        id: location.id,
        name: location.name,
        brandName: location.brand?.name,
        latitude: location.latitude,
        longitude: location.longitude,
      })),
    [mappableLocations],
  );
  const availableBrands = Array.from(
    new Set(mappableLocations.map((location) => location.brand?.name).filter((name): name is string => Boolean(name))),
  ).sort((left, right) => left.localeCompare(right, "ja"));
  const availablePrefectures = Array.from(
    new Set(mappableLocations.map((location) => location.prefecture).filter((name): name is string => Boolean(name))),
  ).sort((left, right) => left.localeCompare(right, "ja"));
  const maximumDistanceKm = distanceFilter ? Number(distanceFilter) : null;
  const listCandidates = mappableLocations.filter((location) => {
    if (normalizedQuery && !matchedLocationIds.has(location.id)) {
      return false;
    }

    if (brandFilter && location.brand?.name !== brandFilter) {
      return false;
    }

    if (prefectureFilter && location.prefecture !== prefectureFilter) {
      return false;
    }

    if (maximumDistanceKm !== null && (location.distanceKm === null || location.distanceKm > maximumDistanceKm)) {
      return false;
    }

    return listScope !== "map" || isLocationInsideBounds(location, mapBounds);
  });
  const nearbyLocations = listCandidates.slice(0, 10);
  const selectedLocation =
    mappableLocations.find((location) => location.id === selectedLocationId) ?? mappableLocations[0] ?? null;
  const mapCenter = useMemo(
    () =>
      selectedLocation && selectedLocation.latitude !== null && selectedLocation.longitude !== null
        ? {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }
        : fallbackCenter,
    [fallbackCenter, selectedLocation],
  );
  const handleMapProviderError = useCallback(() => {
    setActiveMapProvider((provider) => (provider === "osm" ? provider : "osm"));
  }, []);
  function formatMatchedLessonSummary(locationId: string) {
    const matches = matchesByLocationId.get(locationId) ?? [];

    if (!matches.length) {
      return null;
    }

    const uniqueNames = Array.from(new Set(matches.map((item) => item.rawProgramName)));
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
    if (!mappableLocations.length) {
      setSelectedLocationId(null);
      return;
    }

    if (!selectedLocationId || !mappableLocations.some((location) => location.id === selectedLocationId)) {
      setSelectedLocationId(mappableLocations[0].id);
    }
  }, [selectedLocationId, mappableLocations]);

  const statusLabel =
    geolocationStatus === "granted"
      ? "現在地を基準に近い順"
      : geolocationStatus === "loading"
        ? "現在地を取得中"
        : "東京駅を基準に近い順";
  const resultSummary = normalizedQuery
    ? `「${programQuery.trim()}」に一致する${listCandidates.length}店舗・${matchedLessonCount}レッスンから近い10店舗を表示`
    : `${mappableLocations.length}店舗を地図に表示 / 条件に合う${listCandidates.length}店舗から近い10店舗を表示`;
  const MapComponent = activeMapProvider === "apple" ? AppleGymMap : LeafletGymMap;

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
        <label className="map-search-field map-search-field-wide">
          <span>レッスン名で絞り込む</span>
          <input
            type="search"
            value={programQuery}
            onChange={(event) => setProgramQuery(event.target.value)}
            placeholder="BODYCOMBAT / ヨガ / ピラティス など"
          />
        </label>
        <div className="map-filter-grid">
          <label className="map-search-field">
            <span>ブランド</span>
            <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
              <option value="">すべて</option>
              {availableBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>
          <label className="map-search-field">
            <span>都道府県</span>
            <select value={prefectureFilter} onChange={(event) => setPrefectureFilter(event.target.value)}>
              <option value="">すべて</option>
              {availablePrefectures.map((prefecture) => (
                <option key={prefecture} value={prefecture}>
                  {prefecture}
                </option>
              ))}
            </select>
          </label>
          <label className="map-search-field">
            <span>基準地点からの距離</span>
            <select value={distanceFilter} onChange={(event) => setDistanceFilter(event.target.value)}>
              <option value="">指定なし</option>
              <option value="1">1km以内</option>
              <option value="3">3km以内</option>
              <option value="5">5km以内</option>
              <option value="10">10km以内</option>
            </select>
          </label>
        </div>
        <div className="map-scope-actions" aria-label="店舗一覧の表示範囲">
          <button
            type="button"
            className={listScope === "nearby" ? "is-active" : ""}
            onClick={() => setListScope("nearby")}
          >
            近い店舗から探す
          </button>
          <button
            type="button"
            className={listScope === "map" ? "is-active" : ""}
            onClick={() => setListScope("map")}
            disabled={!mapBounds}
          >
            この地図範囲から探す
          </button>
        </div>
        <p className="map-status muted">
          {statusLabel} / {resultSummary}
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
          <MapComponent
            locations={mapLocations}
            selectedLocationId={selectedLocation?.id ?? null}
            center={mapCenter}
            currentPosition={currentPosition}
            onSelectLocation={setSelectedLocationId}
            onBoundsChange={setMapBounds}
            onProviderError={handleMapProviderError}
          />
        </div>

        <div className="map-sidebar">
          {selectedLocation ? (
            <article className="map-location-item map-selected-location is-active" aria-live="polite">
              <p className="map-list-label">選択中の店舗</p>
              <p className="map-location-brand">{selectedLocation.brand?.name ?? "-"}</p>
              <h3>{selectedLocation.name}</h3>
              <p className="muted">
                {getLocationAddress(selectedLocation.prefecture, selectedLocation.city, selectedLocation.address_line)}
              </p>
              <p className="muted">{formatDistanceLabel(selectedLocation.distanceKm ?? null)}</p>
              {normalizedQuery && formatMatchedLessonSummary(selectedLocation.id) ? (
                <p className="muted">一致レッスン: {formatMatchedLessonSummary(selectedLocation.id)}</p>
              ) : null}
              <div className="map-link-row">
                {normalizedQuery ? <Link href={buildLessonDetailHref(selectedLocation)}>レッスン詳細を見る</Link> : null}
                <Link href={`/locations/${selectedLocation.slug}`}>店舗詳細を見る</Link>
              </div>
            </article>
          ) : null}

          <div className="map-nearby-section">
            <div className="map-list-heading">
              <h3>{listScope === "map" ? "地図範囲内の近い10店舗" : "近い10店舗"}</h3>
              <span>{listCandidates.length}件中</span>
            </div>
            <div className="map-location-list">
              {nearbyLocations.length === 0 ? (
                <article className="map-location-item">
                  <h3>該当する店舗がありません</h3>
                  <p className="muted">条件を変更するか、「近い店舗から探す」に戻してください。</p>
                </article>
              ) : null}
              {nearbyLocations.map((location, index) => (
                <article
                  key={location.id}
                  className={`map-location-item map-location-item-compact${selectedLocation?.id === location.id ? " is-active" : ""}`}
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
                  <span className="map-location-rank">{index + 1}</span>
                  <div>
                    <p className="map-location-brand">{location.brand?.name ?? "-"}</p>
                    <h3>{location.name}</h3>
                    <p className="muted">
                      {getLocationAddress(location.prefecture, location.city, location.address_line)} ・{" "}
                      {formatDistanceLabel(location.distanceKm ?? null)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="muted">
        一部の住所座標は
        <a href="https://maps.gsi.go.jp/" target="_blank" rel="noreferrer">
          国土地理院「地理院地図」
        </a>
        の検索結果を利用しています。
      </p>
    </section>
  );
}
