import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { PendingFilterLinkLabel } from "@/components/navigation/pending-filter-link-label";
import { CardSurface, FreshnessIndicator } from "@/components/ui";
import { getAreaProgramLandingByParams } from "@/lib/data";
import { shouldIndexAreaProgramPage } from "@/lib/seo-indexing";
import { buildAreaProgramPath, buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/structured-data";
import {
  formatDate,
  formatTime,
  formatWeekday,
  getLatestScheduleUpdatedAt,
  getLocationAddress,
} from "@/lib/utils";

import styles from "./area-program.module.css";

type AreaProgramPageProps = {
  params: Promise<{ area: string; program: string }>;
};

type AreaProgramStaticParam = {
  area: string;
  program: string;
};

export async function generateStaticParams(): Promise<AreaProgramStaticParam[]> {
  // `prebuild` creates this sitemap from the same active data set. Reading it
  // here keeps the public, indexable route set static without adding a second
  // large Supabase traversal during the build.
  const sitemap = await readFile(join(process.cwd(), "public", "sitemap-areas.xml"), "utf8");
  const matches = sitemap.matchAll(/<loc>[^<]*\/areas\/([^/]+)\/([^<]+)<\/loc>/g);

  return Array.from(matches, ([, area, program]) => ({
    area: decodeURIComponent(area),
    program: decodeURIComponent(program),
  }));
}

// Area pages formerly used force-dynamic because Unicode route values could
// not be placed in Next's data-cache tags on Vercel. Pre-rendering the sitemap
// set avoids that response-header path; unknown combinations become a cheap
// router-level 404 instead of invoking Supabase on every crawler request.
export const dynamic = "force-static";
export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: AreaProgramPageProps): Promise<Metadata> {
  const { area, program } = await params;
  const page = await getAreaProgramLandingByParams(area, program);

  if (!page) {
    return {
      title: "ページが見つかりません",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const pageTitle = `${page.areaName}で${page.program.name}が受けられるジム・最新スケジュール`;
  const description = `${page.areaName}で${page.program.name}を受けられるジムを${page.locationCount}店舗・${page.schedules.length}件掲載。曜日・時間帯・店舗ごとのタイムテーブルを比較できます。`;
  const isIndexable = shouldIndexAreaProgramPage({
    locationCount: page.locationCount,
    scheduleCount: page.schedules.length,
  });

  return {
    title: pageTitle,
    description,
    robots: {
      index: isIndexable,
      follow: true,
    },
    alternates: {
      canonical: buildAreaProgramPath(page.areaName, page.program.slug),
    },
    openGraph: {
      title: `${pageTitle} | GymMap`,
      description,
      url: buildCanonicalPath(buildAreaProgramPath(page.areaName, page.program.slug)),
      locale: "ja_JP",
      type: "article",
    },
  };
}

export default async function AreaProgramPage({ params }: AreaProgramPageProps) {
  const { area, program } = await params;
  const page = await getAreaProgramLandingByParams(area, program);

  if (!page) {
    notFound();
  }

  const programPath = buildProgramPath(page.program.slug);
  const pagePath = buildAreaProgramPath(page.areaName, page.program.slug);
  const latestScheduleUpdatedAt = getLatestScheduleUpdatedAt(
    page.schedules.map((item) => item.schedule),
  );
  const pageDescription = `${page.areaName}で${page.program.name}を受けられるジムを${page.locationCount}店舗・${page.schedules.length}件掲載。曜日・時間帯・店舗ごとのタイムテーブルを比較できます。`;
  const cityAreas =
    page.areaType === "prefecture"
      ? Array.from(
          new Set(
            page.schedules
              .map((item) => item.location.city)
              .filter((name): name is string => Boolean(name)),
          ),
        )
          .map((cityName) => {
            const citySchedules = page.schedules.filter(
              (item) => item.location.city === cityName,
            );

            return {
              cityName,
              locationCount: new Set(citySchedules.map((item) => item.location.id)).size,
              scheduleCount: citySchedules.length,
            };
          })
          .filter((city) => shouldIndexAreaProgramPage(city))
          .sort(
            (left, right) =>
              right.locationCount - left.locationCount ||
              right.scheduleCount - left.scheduleCount ||
              left.cityName.localeCompare(right.cityName, "ja"),
          )
      : [];
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: `${page.areaName}で${page.program.name}が受けられるジム一覧`,
    description: pageDescription,
    path: pagePath,
    items: page.schedules.map((item) => ({
      name: item.location.name,
      path: `/locations/${item.location.slug}`,
    })),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "GymMap", path: "/" },
    { name: page.program.name, path: programPath },
    ...(page.areaType === "city" && page.prefectureName
      ? [
          {
            name: page.prefectureName,
            path: buildAreaProgramPath(page.prefectureName, page.program.slug),
          },
        ]
      : []),
    { name: page.areaName, path: pagePath },
  ]);

  return (
    <div className={`page-stack ${styles.page}`}>
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd]} />
      <nav className={styles.breadcrumb} aria-label="パンくずリスト">
        <Link href={programPath}>{page.program.name}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{page.areaName}</span>
      </nav>

      <CardSurface as="section" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p>地域から探す</p>
          <h1>{page.areaName}で{page.program.name}を探す</h1>
          <span>{page.locationCount}店舗・{page.schedules.length}件の週間レッスンを掲載しています。</span>
        </div>
        <dl className={styles.stats} aria-label="掲載状況">
          <div><strong>{page.locationCount}</strong><span>掲載店舗</span></div>
          <div><strong>{page.schedules.length}</strong><span>週間レッスン</span></div>
          <div><strong>{page.brandNames.length}</strong><span>ブランド</span></div>
        </dl>
        <div className={styles.heroFooter}>
          <FreshnessIndicator status="neutral" label={`スケジュール確認 ${formatDate(latestScheduleUpdatedAt)}`} />
          <div className={styles.actions}>
            <FavoriteProgramButton id={page.program.id} slug={page.program.slug} name={page.program.name} compact />
            <Link className={styles.primaryAction} href={`/search?q=${encodeURIComponent(page.program.name)}&area=${encodeURIComponent(page.areaName)}`}>
              この条件で検索する
            </Link>
            <Link href={programPath}>{page.program.name}の全国一覧</Link>
            {page.areaType === "city" && page.prefectureName ? (
              <Link href={buildAreaProgramPath(page.prefectureName, page.program.slug)}>
                {page.prefectureName}の{page.program.name}
              </Link>
            ) : null}
          </div>
        </div>
      </CardSurface>

      {cityAreas.length ? (
        <CardSurface as="section" className={styles.citySection}>
          <p>市区町村</p>
          <h2>{page.areaName}の{page.program.name}をさらに絞り込む</h2>
          <div className={styles.cityLinks}>
            {cityAreas.map((city) => (
              <Link
                href={buildAreaProgramPath(city.cityName, page.program.slug)}
                key={city.cityName}
              >
                <PendingFilterLinkLabel label={city.cityName} countLabel={`${city.locationCount}店舗`} />
              </Link>
            ))}
          </div>
        </CardSurface>
      ) : null}

      <section className={styles.results} aria-labelledby="area-results-heading">
        <div className={styles.resultsHeading}>
          <div>
            <p>開催レッスン</p>
            <h2 id="area-results-heading">{page.areaName}の{page.program.name}</h2>
          </div>
          <span>{page.schedules.length}件</span>
        </div>
        <div className={styles.resultList}>
          {page.schedules.map((item) => (
            <CardSurface key={item.schedule.id} className={styles.resultCard}>
              <div className={styles.time}>
                <span>{formatWeekday(item.schedule.weekday)}</span>
                <strong>{formatTime(item.schedule.start_time)}</strong>
                <small>{formatTime(item.schedule.end_time)}まで</small>
              </div>
              <div className={styles.resultMain}>
                <p>{item.brand.name}</p>
                <h3>{item.schedule.raw_program_name}</h3>
                <strong>{item.location.name}</strong>
                <span>{getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line)}</span>
                <div className={styles.resultMeta}>
                  {item.schedule.duration_minutes ? <span>{item.schedule.duration_minutes}分</span> : null}
                  {item.schedule.studio_name ? <span>{item.schedule.studio_name}</span> : null}
                </div>
                <Link href={`/locations/${item.location.slug}`}>店舗のタイムテーブルを見る</Link>
              </div>
            </CardSurface>
          ))}
        </div>
      </section>
    </div>
  );
}
