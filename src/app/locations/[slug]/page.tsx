import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { LocationScheduleTable } from "@/components/location/location-schedule-table";
import { JsonLd } from "@/components/seo/json-ld";
import { CardSurface, FreshnessIndicator } from "@/components/ui";
import { getLocationBySlug, getLocationSlugs } from "@/lib/data";
import { buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import {
  buildSearchQuery,
  formatDate,
  getLatestScheduleUpdatedAt,
  getLocationAddress,
} from "@/lib/utils";

import styles from "./location-detail.module.css";

type LocationPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getLocationSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Every public location URL is included in the deployment sitemap. Reject
// arbitrary slugs at the router so crawlers cannot trigger on-demand ISR.
export const dynamicParams = false;
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
  const brandSearchPath = `/search?${buildSearchQuery({
    q: "",
    area: "",
    weekday: "",
    timeRange: "",
    durationRange: "",
    brand: brand.name,
  })}`;
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
    <div className={`page-stack ${styles.page}`}>
      <JsonLd data={[locationJsonLd, breadcrumbJsonLd]} />
      <nav className={styles.breadcrumb} aria-label="パンくずリスト">
        <Link href="/search">レッスン検索</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">店舗詳細</span>
      </nav>

      <CardSurface as="section" className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.identity}>
            <Link className={styles.brandLink} href={brandSearchPath}>
              {brand.name}
            </Link>
            <h1>{location.name}</h1>
            <p className={styles.address}>{address || "住所情報は現在掲載されていません。"}</p>
            {hasSchedules && latestScheduleUpdatedAt ? (
              <FreshnessIndicator
                status="neutral"
                label={`スケジュール確認 ${formatDate(latestScheduleUpdatedAt)}`}
              />
            ) : null}
          </div>

          <dl className={styles.summary} aria-label="店舗の掲載情報">
            <div>
              <strong>{schedules.length}</strong>
              <span>週間レッスン</span>
            </div>
            <div>
              <strong>{availablePrograms.length}</strong>
              <span>プログラム</span>
            </div>
            <div>
              <strong>{formatDate(location.last_verified_at)}</strong>
              <span>店舗情報確認日</span>
            </div>
          </dl>
        </div>

        <div className={styles.actions}>
          <Link className={styles.primaryAction} href={hasSchedules ? "#location-schedule" : "/search"}>
            {hasSchedules ? "週間スケジュールを見る" : "レッスンを探す"}
          </Link>
          <Link href="/search">検索に戻る</Link>
          <a href={googleMapsUrl} target="_blank" rel="noreferrer">
            Google Mapsで見る ↗
          </a>
          {location.official_url ? (
            <a href={location.official_url} target="_blank" rel="noreferrer">
              施設公式サイト ↗
            </a>
          ) : null}
        </div>
      </CardSurface>

      {hasSchedules ? (
        <>
          <CardSurface as="section" className={styles.programSection}>
            <div className={styles.sectionHeading}>
              <div>
                <p>PROGRAMS</p>
                <h2>この店舗で受けられるプログラム</h2>
              </div>
              <span>{availablePrograms.length}種類</span>
            </div>
            <div className={styles.programGrid}>
              {featuredPrograms.map((program) => (
                <article className={styles.programItem} key={program.id}>
                  <Link href={buildProgramPath(program.slug)}>
                    <strong>{program.name}</strong>
                    <span>{program.scheduleCount}件の開催を見る</span>
                  </Link>
                  <FavoriteProgramButton {...program} compact iconOnly />
                </article>
              ))}
            </div>
            {remainingPrograms.length ? (
              <details className={styles.morePrograms}>
                <summary>ほか{remainingPrograms.length}種類をすべて見る</summary>
                <div className={styles.programGrid}>
                  {remainingPrograms.map((program) => (
                    <article className={styles.programItem} key={program.id}>
                      <Link href={buildProgramPath(program.slug)}>
                        <strong>{program.name}</strong>
                        <span>{program.scheduleCount}件の開催を見る</span>
                      </Link>
                      <FavoriteProgramButton {...program} compact iconOnly />
                    </article>
                  ))}
                </div>
              </details>
            ) : null}
          </CardSurface>

          <LocationScheduleTable schedules={schedules} />
        </>
      ) : (
        <CardSurface as="section" className={styles.emptySchedule}>
          <h2>スタジオスケジュール</h2>
          <p>この店舗のレッスンスケジュールは、現在GymMapに登録されていません。</p>
          {location.official_url ? (
            <a href={location.official_url} target="_blank" rel="noreferrer">
              施設公式サイトで確認する ↗
            </a>
          ) : null}
        </CardSurface>
      )}
    </div>
  );
}
