"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CurrentLocationControl,
  MapChrome,
  MapSelectionSurface,
  MapStateNotice,
} from "@/components/map/map-presentation";
import { buildMapSelectionHref, resolveMapSelection } from "@/components/map/map-runtime-state";
import { HyroxFacilityCard } from "@/components/training/hyrox-facility-card";
import { HyroxMapSelectionContent } from "@/components/training/hyrox-map-selection-content";
import { configuredMapProvider, type MapProvider } from "@/lib/map-provider";
import {
  filterHyroxLocations,
  getHyroxPrefectureOptions,
  type HyroxDiscoveryLocation,
} from "@/lib/hyrox-discovery";

import styles from "./hyrox-map-ui.module.css";

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

const JAPAN_CENTER = {
  latitude: 36.2048,
  longitude: 138.2529,
};

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationLifecycleState =
  | "not_requested"
  | "requesting"
  | "obtained"
  | "denied"
  | "unavailable"
  | "stale";

type HyroxDiscoveryProps = {
  locations: HyroxDiscoveryLocation[];
};

export function HyroxDiscovery({ locations }: HyroxDiscoveryProps) {
  const [activeMapProvider, setActiveMapProvider] = useState<MapProvider>(configuredMapProvider);
  const [prefecture, setPrefecture] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [mapFocusCenter, setMapFocusCenter] = useState<Coordinates | null>(null);
  const [mapFocusRequestId, setMapFocusRequestId] = useState(0);
  const [geolocationStatus, setGeolocationStatus] =
    useState<LocationLifecycleState>("not_requested");
  const [geolocationMessage, setGeolocationMessage] = useState(
    "現在地を確認すると、地図を現在地周辺へ移動できます。",
  );
  const prefectureOptions = useMemo(() => getHyroxPrefectureOptions(locations), [locations]);
  const filteredLocations = useMemo(
    () => filterHyroxLocations(locations, prefecture),
    [locations, prefecture],
  );
  const selectionEntities = useMemo(
    () => locations.map((location) => ({ id: location.id, publicKey: location.slug })),
    [locations],
  );
  const publicKeyByLocationId = useMemo(
    () => new Map(selectionEntities.map((entity) => [entity.id, entity.publicKey])),
    [selectionEntities],
  );
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );
  const selectedFilteredLocation = useMemo(
    () => filteredLocations.find((location) => location.id === selectedLocationId) ?? null,
    [filteredLocations, selectedLocationId],
  );
  const mapCenter =
    mapFocusCenter ??
    (selectedFilteredLocation
      ? {
          latitude: selectedFilteredLocation.latitude,
          longitude: selectedFilteredLocation.longitude,
        }
      : filteredLocations.length === 1
        ? {
            latitude: filteredLocations[0].latitude,
            longitude: filteredLocations[0].longitude,
          }
        : JAPAN_CENTER);
  const mapLocations = useMemo(
    () =>
      filteredLocations.map((location) => ({
        id: location.id,
        name: location.name,
        brandName: location.brandName,
        latitude: location.latitude,
        longitude: location.longitude,
      })),
    [filteredLocations],
  );
  const MapComponent = activeMapProvider === "apple" ? AppleGymMap : LeafletGymMap;

  const handleSelectLocation = useCallback(
    (locationId: string, revealInCompactList = false) => {
      const publicKey = publicKeyByLocationId.get(locationId);

      if (!publicKey) {
        return;
      }

      setMapFocusCenter(null);
      setSelectionNotice(null);

      if (selectedLocationId !== locationId) {
        setSelectedLocationId(locationId);
        window.history.pushState(null, "", buildMapSelectionHref(window.location.href, publicKey));
      }

      if (revealInCompactList) {
        requestAnimationFrame(() => {
          document.getElementById(`hyrox-map-list-${locationId}`)?.scrollIntoView({
            block: "nearest",
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
        });
      }
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

  async function requestCurrentPosition() {
    if (!("geolocation" in navigator)) {
      setGeolocationStatus("unavailable");
      setGeolocationMessage("この環境では位置情報を利用できません。地図と施設一覧は引き続き利用できます。");
      return;
    }

    if ("permissions" in navigator && navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });

        if (permission.state === "denied") {
          setGeolocationStatus("denied");
          setGeolocationMessage("位置情報が拒否されています。ブラウザ設定から許可してください。");
          return;
        }
      } catch {
        // Some browsers expose geolocation without supporting the permission query.
      }
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
        setGeolocationStatus("obtained");
        setGeolocationMessage("現在地を表示しました。施設の絞り込みと選択は変更していません。");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeolocationStatus("denied");
          setGeolocationMessage("位置情報が拒否されています。ブラウザ設定から許可してください。");
          return;
        }

        setGeolocationStatus(currentPosition ? "stale" : "unavailable");
        setGeolocationMessage("現在地を取得できませんでした。設定を確認して、もう一度お試しください。");
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

  function renderSelectedLocationContent() {
    if (!selectedLocation) {
      return null;
    }

    return (
      <HyroxMapSelectionContent
        location={selectedLocation}
        outsideCurrentResults={!filteredLocations.some((location) => location.id === selectedLocation.id)}
      />
    );
  }

  useEffect(() => {
    function restoreSelectionFromUrl() {
      const selection = resolveMapSelection(window.location.search, selectionEntities);

      setMapFocusCenter(null);

      if (selection.kind === "invalid") {
        setSelectedLocationId(null);
        setSelectionNotice("指定された施設を表示できなかったため、選択を解除しました。");
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

  return (
    <>
      <section className="panel hyrox-filter-panel" aria-labelledby="hyrox-filter-heading">
        <div>
          <p className="hyrox-eyebrow">エリアで探す</p>
          <h2 id="hyrox-filter-heading">都道府県から絞り込む</h2>
        </div>
        <label className="hyrox-prefecture-filter">
          <span>都道府県</span>
          <select value={prefecture} onChange={(event) => setPrefecture(event.target.value)}>
            <option value="">全国 ({locations.length})</option>
            {prefectureOptions.map((option) => (
              <option key={option.prefecture} value={option.prefecture}>
                {option.prefecture} ({option.count})
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel hyrox-map-panel" aria-labelledby="hyrox-map-heading">
        <div className="section-heading hyrox-section-heading">
          <div>
            <p className="hyrox-eyebrow">MAP</p>
            <h2 id="hyrox-map-heading" className={styles.mapHeading}>地図から探す</h2>
          </div>
          <p aria-live="polite">{filteredLocations.length}施設を表示</p>
        </div>
        {selectionNotice ? <p className="map-status muted" aria-live="polite">{selectionNotice}</p> : null}
        <div className="map-layout">
          <div
            className={`map-canvas ${styles.mapCanvas}`}
            aria-label="HYROX Official Training Clubの位置マップ"
          >
            <MapComponent
              locations={mapLocations}
              selectedLocationId={selectedFilteredLocation?.id ?? null}
              center={mapCenter}
              currentPosition={currentPosition}
              focusCenter={mapFocusCenter !== null}
              focusRequestId={mapFocusRequestId}
              onSelectLocation={(locationId) => handleSelectLocation(locationId, true)}
              onClearSelection={handleClearSelection}
              onProviderError={handleMapProviderError}
              unselectedCaption={`${prefecture || "全国"}の${filteredLocations.length}施設を表示中`}
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
                ariaLabel="選択中のHYROX施設"
                closeLabel="選択中のHYROX施設を閉じる"
                onClose={handleClearSelection}
              >
                {renderSelectedLocationContent()}
              </MapSelectionSurface>
            ) : null}
          </div>

          <div
            className={`map-sidebar ${styles.mapSidebar}${selectedLocation ? "" : ` ${styles.sidebarWithoutSelection}`}`}
          >
            {selectedLocation ? (
              <MapSelectionSurface
                placement="desktop"
                ariaLabel="選択中のHYROX施設"
                closeLabel="選択中のHYROX施設を閉じる"
                onClose={handleClearSelection}
              >
                {renderSelectedLocationContent()}
              </MapSelectionSurface>
            ) : null}
            <div className="map-nearby-section">
              <div className="map-list-heading">
                <h3>{prefecture || "全国"}の施設</h3>
                <span>{filteredLocations.length}件</span>
              </div>
              <div className="map-location-list" aria-label="地図に表示中のHYROX施設">
                {filteredLocations.map((location) => (
                  <article
                    id={`hyrox-map-list-${location.id}`}
                    key={location.id}
                    className={`map-location-item map-location-item-compact ${styles.compactListItem}${selectedLocation?.id === location.id ? " is-active" : ""}`}
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
                    <div>
                      <p className="map-location-brand">{location.brandName}</p>
                      <h3>{location.name}</h3>
                      <p className="muted">
                        {location.prefecture} {location.city}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel" aria-labelledby="hyrox-results-heading">
        <div className="section-heading hyrox-section-heading">
          <div>
            <p className="hyrox-eyebrow">OFFICIAL CLUBS</p>
            <h2 id="hyrox-results-heading">Official Training Club一覧</h2>
          </div>
          <p aria-live="polite">{filteredLocations.length}施設</p>
        </div>
        {filteredLocations.length ? (
          <div className="hyrox-location-grid">
            {filteredLocations.map((location) => (
              <HyroxFacilityCard
                key={location.id}
                location={location}
                onMapFocus={(locationId) => {
                  handleSelectLocation(locationId, true);
                  document.getElementById("hyrox-map-heading")?.scrollIntoView({ behavior: "smooth" });
                }}
              />
            ))}
          </div>
        ) : (
          <p className="hyrox-empty-state">この都道府県には現在公開中の施設がありません。</p>
        )}
      </section>
    </>
  );
}
