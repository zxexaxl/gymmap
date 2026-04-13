import Link from "next/link";

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

  return (
    <section className="panel map-section">
      <div className="section-heading">
        <div>
          <h2>ジムの位置を見る</h2>
          <p className="muted">登録されている店舗の位置をざっくり確認できます。気になる店舗は詳細画面から確認してください。</p>
        </div>
        <Link href="/search">一覧から探す</Link>
      </div>

      <div className="map-layout">
        <div className="map-canvas" aria-label="ジム位置マップ">
          <div className="map-grid" />
          {points.map((point) => (
            <div
              key={point.id}
              className="map-pin"
              style={{ top: point.top, left: point.left }}
              title={`${point.name} (${point.brand?.name ?? "Gym"})`}
            >
              <span />
            </div>
          ))}
          <div className="map-caption">東京周辺の簡易マップ表示</div>
        </div>

        <div className="map-location-list">
          {visibleLocations.map((location) => (
            <article key={location.id} className="map-location-item">
              <p className="map-location-brand">{location.brand?.name ?? "-"}</p>
              <h3>{location.name}</h3>
              <p className="muted">{getLocationAddress(location.prefecture, location.city, location.address_line)}</p>
              <Link href={`/locations/${location.slug}`}>店舗詳細を見る</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
