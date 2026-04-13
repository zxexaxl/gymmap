import Link from "next/link";
import { notFound } from "next/navigation";

import { LocationScheduleTable } from "@/components/location/location-schedule-table";
import { getLocationBySlug } from "@/lib/data";
import { formatDate, formatWeekday, getLocationAddress } from "@/lib/utils";

type LocationPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;
  const detail = await getLocationBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { brand, location, schedules } = detail;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getLocationAddress(location.prefecture, location.city, location.address_line) || location.name,
  )}`;

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">{brand.name}</p>
        <h1>{location.name}</h1>
        <p className="muted">住所や公式サイトを確認しながら、この店舗の曜日別スケジュールをまとめて見られます。</p>
        <dl className="detail-list">
          <div>
            <dt>住所</dt>
            <dd>{getLocationAddress(location.prefecture, location.city, location.address_line)}</dd>
          </div>
          <div>
            <dt>公式サイト</dt>
            <dd>
              {location.official_url ? (
                <a href={location.official_url} target="_blank" rel="noreferrer">
                  公式ページを開く
                </a>
              ) : (
                "-"
              )}
            </dd>
          </div>
          <div>
            <dt>最終更新日</dt>
            <dd>{formatDate(location.last_verified_at)}</dd>
          </div>
        </dl>
        <div className="link-row">
          <Link href="/search">検索に戻る</Link>
          <a href={googleMapsUrl} target="_blank" rel="noreferrer">
            Google Mapsで見る
          </a>
          {location.official_url ? (
            <a href={location.official_url} target="_blank" rel="noreferrer">
              公式サイトを見る
            </a>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <h2>この店舗で開催されるクラス</h2>
        <ul className="plain-list">
          {schedules.map((item) => (
            <li key={item.schedule.id}>
              {formatWeekday(item.schedule.weekday)} {item.schedule.start_time} - {item.schedule.end_time} / {item.program.name} /{" "}
              {item.schedule.studio_name ?? "スタジオ未設定"}
            </li>
          ))}
        </ul>
      </section>

      <LocationScheduleTable schedules={schedules} />
    </div>
  );
}
