import Link from "next/link";
import { notFound } from "next/navigation";

import { LocationScheduleTable } from "@/components/location/location-schedule-table";
import { getLocationBySlug } from "@/lib/data";
import { formatDate, getLocationAddress } from "@/lib/utils";

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

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">{brand.name}</p>
        <h1>{location.name}</h1>
        <dl className="detail-list">
          <div>
            <dt>住所</dt>
            <dd>{getLocationAddress(location.prefecture, location.city, location.address_line)}</dd>
          </div>
          <div>
            <dt>公式URL</dt>
            <dd>
              {location.official_url ? (
                <a href={location.official_url} target="_blank" rel="noreferrer">
                  {location.official_url}
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
        </div>
      </section>

      <section className="panel">
        <h2>その店舗のクラス一覧</h2>
        <ul className="plain-list">
          {schedules.map((item) => (
            <li key={item.schedule.id}>
              {item.program.name} / {item.schedule.start_time} - {item.schedule.end_time} / {item.schedule.studio_name ?? "-"}
            </li>
          ))}
        </ul>
      </section>

      <LocationScheduleTable schedules={schedules} />
    </div>
  );
}
