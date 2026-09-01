"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CurrentLocationControl,
  MapChrome,
  MapSelectionSurface,
  MapStateNotice,
} from "@/components/map/map-presentation";
import {
  createCurrentLocationProximityOrigin,
  DEFAULT_LESSON_PROXIMITY_ORIGIN,
  rankLessonLocationsByProximity,
  type LessonCoordinates,
  type LessonProximityOrigin,
} from "@/components/map/lesson-proximity";
import { buildMapSelectionHref, resolveMapSelection } from "@/components/map/map-runtime-state";
import type { MapBounds } from "@/components/map/map-types";
import { configuredMapProvider, type MapProvider } from "@/lib/map-provider";
import { scoreProgramTextQueryMatch, normalizeSearchKeyword } from "@/lib/search-query";
import type { GymLocation, MapLessonSearchItem, MapLocationLessonIndex } from "@/lib/types";
import { buildSearchQuery, getLocationAddress } from "@/lib/utils";

const LeafletGymMap = dynamic(
  () => import("@/components/map/leaflet-gym-map").then((module) => module.LeafletGymMap),
  {
    ssr: false,
    loading: () => (
      <div className="map-canvas map-canvas-fallback">
        <MapStateNotice kind="loading">地図を読み込んでいます…</MapStateNotice>
      </div>
    ),
  },
);

const AppleGymMap = dynamic(
  () => import("@/components/map/apple-gym-map").then((module) => module.AppleGymMap),
  {
    ssr: false,
    loading: () => (
      <div className="map-canvas map-canvas-fallback">
        <MapStateNotice kind="loading">Apple Maps を読み込んでいます…</MapStateNotice>
      </div>
    ),
  },
);

type LocationMapSectionProps = {
  locations: GymLocation[];
  lessonIndex: MapLocationLessonIndex[];
};

type Coordinates = LessonCoordinates;

type GeolocationPermissionState = "granted" | "prompt" | "denied" | "unsupported" | "unknown";
type LocationLifecycleState = "not_requested" | "requesting" | "obtained" | "denied" | "unavailable" | "stale";

// Camera fallback authority only. Lesson distance authority lives in proximityOrigin.
const TOKYO_CENTER: Coordinates = {
  latitude: 35.681236,
  longitude: 139.767125,
};

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
  const [proximityOrigin, setProximityOrigin] = useState<LessonProximityOrigin>(
    DEFAULT_LESSON_PROXIMITY_ORIGIN,
  );
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [mapFocusCenter, setMapFocusCenter] = useState<Coordinates | null>(null);
  const [mapFocusRequestId, setMapFocusRequestId] = useState(0);
  const [geolocationStatus, setGeolocationStatus] = useState<LocationLifecycleState>("not_requested");
  const [geolocationMessage, setGeolocationMessage] = useState("現在地を確認すると、地図を現在地周辺へ移動できます。");
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);

  async function syncPermissionState(): Promise<GeolocationPermissionState> {
    if (!("geolocation" in navigator)) {
      return "unsupported";
    }

    if (!("permissions" in navigator) || !navigator.permissions?.query) {
      return "unknown";
    }

    try {
      const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
      return permissionStatus.state;
    } catch {
      return "unknown";
    }
  }

  async function requestCurrentPosition() {
    const nextPermissionState = await syncPermissionState();

    if (nextPermissionState === "unsupported") {
      setGeolocationStatus("unavailable");
      setGeolocationMessage("この環境では位置情報に対応していないため、東京中心で表示しています。");
      return;
    }

    if (nextPermissionState === "denied") {
      setGeolocationStatus("denied");
      setGeolocationMessage("このサイトでは位置情報が拒否されています。ブラウザ設定から許可してください。");
      return;
    }

    setGeolocationStatus("requesting");
    setGeolocationMessage("現在地を取得しています…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCurrentPosition(nextPosition);
        setMapFocusCenter(nextPosition);
        setMapFocusRequestId((requestId) => requestId + 1);
        setProximityOrigin(createCurrentLocationProximityOrigin(nextPosition));
        setListScope("nearby");
        setGeolocationStatus("obtained");
        setGeolocationMessage("現在地を取得し、現在地から近い順に店舗を表示しました。");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocationStatus("denied");
          setGeolocationMessage("このサイトでは位置情報が拒否されています。ブラウザ設定から許可してください。");
          return;
        }

        setGeolocationStatus(currentPosition ? "stale" : "unavailable");
        setGeolocationMessage("位置情報を取得できませんでした。端末の位置情報設定を確認して、もう一度お試しください。");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      },
    );
  }

  function handleCurrentLocationAction() {
    if (currentPosition) {
      setMapFocusCenter(currentPosition);
      setMapFocusRequestId((requestId) => requestId + 1);
      return;
    }

    void requestCurrentPosition();
  }

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
  const mappableLocations = useMemo(
    () =>
      rankLessonLocationsByProximity(
        locations.filter(
          (location): location is GymLocation & { latitude: number; longitude: number } =>
            location.latitude !== null && location.longitude !== null,
        ),
        proximityOrigin,
      ),
    [locations, proximityOrigin],
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
  const selectionEntities = useMemo(
    () => locations.map((location) => ({ id: location.id, publicKey: location.slug })),
    [locations],
  );
  const publicKeyByLocationId = useMemo(
    () => new Map(selectionEntities.map((entity) => [entity.id, entity.publicKey])),
    [selectionEntities],
  );
  const selectedLocation = useMemo(() => {
    const selectedMappableLocation =
      mappableLocations.find((location) => location.id === selectedLocationId) ?? null;
    const selectedDomainLocation = locations.find((location) => location.id === selectedLocationId) ?? null;

    return (
      selectedMappableLocation ??
      (selectedDomainLocation
        ? {
            ...selectedDomainLocation,
            distanceKm: null,
          }
        : null)
    );
  }, [locations, mappableLocations, selectedLocationId]);
  const mapCenter = useMemo(
    () =>
      mapFocusCenter ??
      (selectedLocation && selectedLocation.latitude !== null && selectedLocation.longitude !== null
        ? {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }
        : TOKYO_CENTER),
    [mapFocusCenter, selectedLocation],
  );
  const handleSelectLocation = useCallback(
    (locationId: string) => {
      const publicKey = publicKeyByLocationId.get(locationId);

      if (!publicKey) {
        return;
      }

      setMapFocusCenter(null);
      setSelectionNotice(null);

      if (selectedLocationId === locationId) {
        return;
      }

      setSelectedLocationId(locationId);
      window.history.pushState(null, "", buildMapSelectionHref(window.location.href, publicKey));
    },
    [publicKeyByLocationId, selectedLocationId],
  );
  const handleClearSelection = useCallback(() => {
    if (selectedLocationId === null) {
      return;
    }

    setSelectedLocationId(null);
    setSelectionNotice(null);
    window.history.pushState(null, "", buildMapSelectionHref(window.location.href, null));
  }, [selectedLocationId]);
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

  function renderSelectedLocationContent() {
    if (!selectedLocation) {
      return null;
    }

    return (
      <>
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
      </>
    );
  }

  useEffect(() => {
    function restoreSelectionFromUrl() {
      if (selectionEntities.length === 0) {
        setSelectedLocationId(null);
        setSelectionNotice(null);
        return;
      }

      const selection = resolveMapSelection(window.location.search, selectionEntities);

      setMapFocusCenter(null);

      if (selection.kind === "invalid") {
        setSelectedLocationId(null);
        setSelectionNotice("指定された店舗を表示できなかったため、選択を解除しました。");
        window.history.replaceState(null, "", buildMapSelectionHref(window.location.href, null));
        return;
      }

      setSelectedLocationId(selection.selectedId);
      setSelectionNotice(null);
    }

    window.addEventListener("popstate", restoreSelectionFromUrl);
    queueMicrotask(restoreSelectionFromUrl);

    return () => {
      window.removeEventListener("popstate", restoreSelectionFromUrl);
    };
  }, [selectionEntities]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClearSelection();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [handleClearSelection]);

  const statusLabel =
    geolocationStatus === "obtained"
      ? `現在地を地図に表示中 / ${proximityOrigin.label}を基準に近い順`
      : geolocationStatus === "requesting"
        ? "現在地を取得中"
        : `${proximityOrigin.label}を基準に近い順`;
  const resultSummary = normalizedQuery
    ? `「${programQuery.trim()}」に一致する${listCandidates.length}店舗・${matchedLessonCount}レッスンから上位10店舗を表示`
    : `${mappableLocations.length}店舗を地図に表示 / 条件に合う${listCandidates.length}店舗から上位10店舗を表示`;
  const MapComponent = activeMapProvider === "apple" ? AppleGymMap : LeafletGymMap;

  return (
    <section id="map-section" className="panel map-section page-anchor-section">
      <div className="section-heading">
        <div>
          <h2>近くのジムを地図から探す</h2>
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
            <span>{proximityOrigin.label}からの距離</span>
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
            aria-pressed={listScope === "nearby"}
          >
            近い順で見る
          </button>
          <button
            type="button"
            className={listScope === "map" ? "is-active" : ""}
            onClick={() => setListScope("map")}
            disabled={!mapBounds}
            aria-pressed={listScope === "map"}
          >
            この地図範囲から探す
          </button>
        </div>
        <p className="map-status muted">
          {statusLabel} / {resultSummary}
        </p>
        {selectionNotice ? <p className="map-status muted" aria-live="polite">{selectionNotice}</p> : null}
      </div>

      <div className="map-layout">
        <div className="map-canvas" aria-label="ジム位置マップ">
          <MapComponent
            locations={mapLocations}
            selectedLocationId={selectedLocation?.id ?? null}
            center={mapCenter}
            currentPosition={currentPosition}
            focusCenter={mapFocusCenter !== null}
            focusRequestId={mapFocusRequestId}
            onSelectLocation={handleSelectLocation}
            onClearSelection={handleClearSelection}
            onBoundsChange={setMapBounds}
            onProviderError={handleMapProviderError}
            markerPresentationMode="lesson-progressive"
          />
          <MapChrome label="地図の現在地コントロール">
            <CurrentLocationControl
              state={geolocationStatus}
              message={geolocationMessage}
              onClick={handleCurrentLocationAction}
              disabled={geolocationStatus === "requesting"}
            />
          </MapChrome>
          {selectedLocation ? (
            <MapSelectionSurface
              placement="mobile"
              ariaLabel="選択中の店舗"
              closeLabel="選択中の店舗を閉じる"
              onClose={handleClearSelection}
            >
              {renderSelectedLocationContent()}
            </MapSelectionSurface>
          ) : null}
        </div>

        <div className="map-sidebar">
          {selectedLocation ? (
            <MapSelectionSurface
              placement="desktop"
              ariaLabel="選択中の店舗"
              closeLabel="選択中の店舗を閉じる"
              onClose={handleClearSelection}
            >
              {renderSelectedLocationContent()}
            </MapSelectionSurface>
          ) : null}
          <div className="map-nearby-section">
            <div className="map-list-heading">
              <h3>
                {listScope === "map" ? "この地図範囲の店舗" : `${proximityOrigin.label}から近い10店舗`}
              </h3>
              <span>
                {listScope === "map"
                  ? `${proximityOrigin.label}から近い順 / ${listCandidates.length}件中（最大10件）`
                  : `${listCandidates.length}件中`}
              </span>
            </div>
            <div className="map-location-list">
              {nearbyLocations.length === 0 ? (
                <article className="map-location-item">
                  <h3>該当する店舗がありません</h3>
                  <p className="muted">条件を変更するか、「近い順で見る」に戻してください。</p>
                </article>
              ) : null}
              {nearbyLocations.map((location, index) => (
                <article
                  key={location.id}
                  className={`map-location-item map-location-item-compact${selectedLocation?.id === location.id ? " is-active" : ""}`}
                  role="button"
                  aria-pressed={selectedLocation?.id === location.id}
                  tabIndex={0}
                  onClick={() => handleSelectLocation(location.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectLocation(location.id);
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
