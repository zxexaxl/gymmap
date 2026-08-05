import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LocationScheduleTable } from "@/components/location/location-schedule-table";
import { getLocationBySlug, getLocationSlugs } from "@/lib/data";
import { buildCanonicalPath } from "@/lib/site";
import { formatDate, formatTime, formatWeekday, getLocationAddress } from "@/lib/utils";

type LocationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getLocationSlugs();

  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getLocationBySlug(slug);

  if (!detail) {
    return {
      title: "店舗が見つかりません",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { brand, location, schedules } = detail;
  const address = getLocationAddress(location.prefecture, location.city, location.address_line);
  const programNames = Array.from(new Set(schedules.map((item) => item.program.name))).slice(0, 5);
  const descriptionParts = [
    address ? `${address}にある` : "",
    `${brand.name} ${location.name}のスタジオレッスン一覧ページです。`,
    programNames.length ? `${programNames.join("、")}などの開催スケジュールを確認できます。` : "",
  ].filter(Boolean);

  return {
    title: `${location.name}のスタジオレッスン一覧`,
    description: descriptionParts.join(" "),
    alternates: {
      canonical: `/locations/${slug}`,
    },
    openGraph: {
      title: `${location.name}のスタジオレッスン一覧 | GymMap`,
      description: descriptionParts.join(" "),
      url: buildCanonicalPath(`/locations/${slug}`),
      locale: "ja_JP",
      type: "article",
    },
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { slug } = await params;
  const detail = await getLocationBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { brand, location, schedules } = detail;
  const address = getLocationAddress(location.prefecture, location.city, location.address_line);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address || location.name,
  )}`;
  const locationJsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    name: location.name,
    description: `${brand.name} ${location.name}のスタジオレッスン情報ページ`,
    url: buildCanonicalPath(`/locations/${location.slug}`),
    sameAs: location.official_url || undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          addressCountry: "JP",
          addressRegion: location.prefecture || undefined,
          addressLocality: location.city || undefined,
          streetAddress: location.address_line || undefined,
          postalCode: location.postal_code || undefined,
        }
      : undefined,
    geo:
      location.latitude && location.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : undefined,
  };

  return (
    <div className="page-stack">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(locationJsonLd) }}
      />
      <section className="panel">
        <p className="eyebrow">{brand.name}</p>
        <h1>{location.name}</h1>
        <p className="muted">住所や公式サイトを確認しながら、この店舗の曜日別スケジュールをまとめて見られます。</p>
        <dl className="detail-list">
          <div>
            <dt>住所</dt>
            <dd>{address}</dd>
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
            <dt>店舗情報確認日</dt>
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
              {formatWeekday(item.schedule.weekday)} {formatTime(item.schedule.start_time)} - {formatTime(item.schedule.end_time)} / {item.program.name} /{" "}
              {item.schedule.studio_name ?? "スタジオ未設定"}
            </li>
          ))}
        </ul>
      </section>

      <LocationScheduleTable schedules={schedules} />
    </div>
  );
}
