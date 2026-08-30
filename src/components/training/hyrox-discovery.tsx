"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import { HyroxFacilityCard } from "@/components/training/hyrox-facility-card";
import {
  filterHyroxLocations,
  getHyroxPrefectureOptions,
  type HyroxDiscoveryLocation,
} from "@/lib/hyrox-discovery";

const LeafletGymMap = dynamic(
  () => import("@/components/map/leaflet-gym-map").then((module) => module.LeafletGymMap),
  {
    ssr: false,
    loading: () => <div className="map-canvas map-canvas-fallback">地図を読み込んでいます…</div>,
  },
);

const JAPAN_CENTER = {
  latitude: 36.2048,
  longitude: 138.2529,
};

type HyroxDiscoveryProps = {
  locations: HyroxDiscoveryLocation[];
};

export function HyroxDiscovery({ locations }: HyroxDiscoveryProps) {
  const [prefecture, setPrefecture] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const prefectureOptions = useMemo(() => getHyroxPrefectureOptions(locations), [locations]);
  const filteredLocations = useMemo(
    () => filterHyroxLocations(locations, prefecture),
    [locations, prefecture],
  );
  const selectedLocation =
    filteredLocations.find((location) => location.id === selectedLocationId) ?? null;
  const mapCenter =
    filteredLocations.length === 1
      ? {
          latitude: filteredLocations[0].latitude,
          longitude: filteredLocations[0].longitude,
        }
      : JAPAN_CENTER;
  const mapLocations = filteredLocations.map((location) => ({
    id: location.id,
    name: location.name,
    brandName: location.brandName,
    latitude: location.latitude,
    longitude: location.longitude,
  }));

  return (
    <>
      <section className="panel hyrox-filter-panel" aria-labelledby="hyrox-filter-heading">
        <div>
          <p className="hyrox-eyebrow">エリアで探す</p>
          <h2 id="hyrox-filter-heading">都道府県から絞り込む</h2>
        </div>
        <label className="hyrox-prefecture-filter">
          <span>都道府県</span>
          <select
            value={prefecture}
            onChange={(event) => {
              setPrefecture(event.target.value);
              setSelectedLocationId(null);
            }}
          >
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
            <h2 id="hyrox-map-heading">地図から探す</h2>
          </div>
          <p aria-live="polite">{filteredLocations.length}施設を表示</p>
        </div>
        <div className="hyrox-map-canvas" aria-label="HYROX Official Training Clubの位置マップ">
          <LeafletGymMap
            locations={mapLocations}
            selectedLocationId={selectedLocationId}
            center={mapCenter}
            currentPosition={null}
            onSelectLocation={setSelectedLocationId}
            unselectedCaption={`${prefecture || "全国"}の${filteredLocations.length}施設を表示中`}
          />
        </div>
        {selectedLocation ? (
          <article className="hyrox-map-selection" aria-live="polite">
            <div>
              <span className="hyrox-official-badge">Official Training Club</span>
              <p>{selectedLocation.brandName}</p>
              <h3>{selectedLocation.name}</h3>
              <p className="muted">{selectedLocation.address}</p>
            </div>
            <div className="hyrox-card-actions">
              <Link href={`/locations/${selectedLocation.slug}`}>GymMapで詳細を見る</Link>
              {selectedLocation.officialUrl ? (
                <a
                  href={selectedLocation.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${selectedLocation.name}の公式サイトを新しいタブで開く`}
                >
                  施設公式サイト ↗
                </a>
              ) : null}
            </div>
          </article>
        ) : null}
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
                  setSelectedLocationId(locationId);
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
