import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LocationScheduleTable } from "@/components/location/location-schedule-table";
import { JsonLd } from "@/components/seo/json-ld";
import { getLocationBySlug } from "@/lib/data";
import { buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { formatDate, getLatestScheduleUpdatedAt, getLocationAddress } from "@/lib/utils";

type LocationPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;
export const revalidate = 86400;

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

  const { location, schedules } = detail;
  const address = getLocationAddress(location.prefecture, location.city, location.address_line);
  const programNames = Array.from(new Set(schedules.map((item) => item.program.name))).slice(0, 5);
  const hasSchedules = schedules.length > 0;
  const pageTitle = hasSchedules
    ? `${location.name}のスタジオスケジュール`
    : `${location.name}の店舗情報`;
  const descriptionParts = [
    address ? `${address}にある` : "",
    hasSchedules
      ? `${location.name}の最新スタジオスケジュール・タイムテーブルです。`
      : `${location.name}の店舗情報ページです。住所や公式サイトを確認できます。`,
    programNames.length ? `${programNames.join("、")}などの曜日・時間を確認できます。` : "",
  ].filter(Boolean);

  return {
    title: pageTitle,
    description: descriptionParts.join(" "),
    alternates: {
      canonical: `/locations/${slug}`,
    },
    openGraph: {
      title: `${pageTitle} | GymMap`,
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
  const hasSchedules = schedules.length > 0;
  const latestScheduleUpdatedAt = getLatestScheduleUpdatedAt(schedules.map((item) => item.schedule));
  const programCounts = new Map<
    string,
    { id: string; name: string; slug: string; scheduleCount: number }
  >();

  schedules.forEach(({ program }) => {
    const existing = programCounts.get(program.id);

    programCounts.set(program.id, {
      id: program.id,
      name: program.name,
      slug: program.slug,
      scheduleCount: (existing?.scheduleCount ?? 0) + 1,
    });
  });

  const availablePrograms = Array.from(programCounts.values()).sort(
    (left, right) =>
      right.scheduleCount - left.scheduleCount || left.name.localeCompare(right.name, "ja"),
  );
  const featuredPrograms = availablePrograms.slice(0, 12);
  const remainingPrograms = availablePrograms.slice(12);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address || location.name,
  )}`;
  const locationJsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    "@id": `${buildCanonicalPath(`/locations/${location.slug}`)}#health-club`,
    name: location.name,
    description: hasSchedules
      ? `${location.name}のスタジオスケジュール・タイムテーブル情報ページ`
      : `${location.name}の住所・公式サイトなどを確認できる店舗情報ページ`,
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
      location.latitude !== null && location.longitude !== null
        ? {
            "@type": "GeoCoordinates",
            latitude: location.latitude,
            longitude: location.longitude,
          }
        : undefined,
    parentOrganization: {
      "@type": "Organization",
      name: brand.name,
      url: brand.official_url || undefined,
    },
  };
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "GymMap", path: "/" },
    { name: location.name, path: `/locations/${location.slug}` },
  ]);

  return (
    <div className="page-stack">
      <JsonLd data={[locationJsonLd, breadcrumbJsonLd]} />
      <section className="panel">
        <p className="eyebrow">{brand.name}</p>
        <h1>{hasSchedules ? `${location.name}のスタジオスケジュール` : location.name}</h1>
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
          {hasSchedules ? (
            <div>
              <dt>スケジュール更新日</dt>
              <dd>{formatDate(latestScheduleUpdatedAt)}</dd>
            </div>
          ) : null}
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

      {hasSchedules ? (
        <>
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>この店舗で受けられる主なプログラム</h2>
                <p className="muted">{availablePrograms.length}種類</p>
              </div>
            </div>
            <div className="location-program-chips">
              {featuredPrograms.map((program) => (
                <Link
                  className="location-program-chip"
                  href={buildProgramPath(program.slug)}
                  key={program.id}
                >
                  <span>{program.name}</span>
                  <small>{program.scheduleCount}件</small>
                </Link>
              ))}
            </div>
            {remainingPrograms.length ? (
              <details className="location-program-more">
                <summary>ほか{remainingPrograms.length}種類をすべて見る</summary>
                <div className="location-program-chips">
                  {remainingPrograms.map((program) => (
                    <Link
                      className="location-program-chip"
                      href={buildProgramPath(program.slug)}
                      key={program.id}
                    >
                      <span>{program.name}</span>
                      <small>{program.scheduleCount}件</small>
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </section>

          <LocationScheduleTable schedules={schedules} />
        </>
      ) : (
        <section className="panel">
          <h2>スタジオスケジュール</h2>
          <p className="muted">この店舗のレッスンスケジュールは、現在GymMapに登録されていません。</p>
          {location.official_url ? (
            <a href={location.official_url} target="_blank" rel="noreferrer">
              公式サイトでスケジュールを確認する
            </a>
          ) : null}
        </section>
      )}
    </div>
  );
}
