import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { PendingFilterLinkLabel } from "@/components/navigation/pending-filter-link-label";
import { CardSurface, FreshnessIndicator } from "@/components/ui";
import { getProgramLandingBySlug, getProgramLandingSlugs } from "@/lib/data";
import { shouldIndexAreaProgramPage } from "@/lib/seo-indexing";
import { buildAreaProgramPath, buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/structured-data";
import type { Weekday } from "@/lib/types";
import {
  buildSearchQuery,
  formatDate,
  formatTime,
  formatWeekday,
  getAreaName,
  getLatestScheduleUpdatedAt,
  getLocationAddress,
} from "@/lib/utils";

import styles from "./program.module.css";

type ProgramLandingPageProps = {
  params: Promise<{ slug: string }>;
};

const weekdayOrder: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const timeRangeDefinitions = [
  { value: "morning", label: "午前", from: 6, to: 12 },
  { value: "afternoon", label: "午後", from: 12, to: 17 },
  { value: "evening", label: "夜", from: 17, to: 23 },
];

function buildProgramSearchPath(
  programName: string,
  filters: { weekday?: string; timeRange?: string; area?: string } = {},
) {
  const query = buildSearchQuery({
    q: programName,
    weekday: filters.weekday ?? "",
    timeRange: filters.timeRange ?? "",
    durationRange: "",
    brand: "",
    area: filters.area ?? "",
  });

  return `/search?${query}`;
}

function buildBrandSearchPath(brandName: string) {
  return `/search?${buildSearchQuery({
    q: "",
    area: "",
    weekday: "",
    timeRange: "",
    durationRange: "",
    brand: brandName,
  })}`;
}

export async function generateStaticParams() {
  // Pre-render every SEO landing page. On-demand ISR for decoded Japanese
  // route segments can fail on Vercel before the fallback page is cached.
  const slugs = await getProgramLandingSlugs();
  return slugs.map((slug) => ({ slug }));
}

// The complete SEO program set is generated above. Unknown slugs should be a
// router-level 404 rather than an on-demand render (often caused by crawlers).
export const dynamicParams = false;
export const revalidate = 86400;

export async function generateMetadata({ params }: ProgramLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getProgramLandingBySlug(slug);

  if (!page) {
    return {
      title: "プログラムが見つかりません",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const pageTitle = `${page.program.name}が受けられるジム・最新スケジュール`;
  const description = `${page.program.name}を受けられるジムを${page.locationCount}店舗・${page.schedules.length}件掲載。地域・曜日・時間帯から、通いやすい開催店舗とタイムテーブルを比較できます。`;

  return {
    title: pageTitle,
    description,
    alternates: {
      canonical: buildProgramPath(page.program.slug),
    },
    openGraph: {
      title: `${pageTitle} | GymMap`,
      description,
      url: buildCanonicalPath(buildProgramPath(page.program.slug)),
      locale: "ja_JP",
      type: "article",
    },
  };
}

export default async function ProgramLandingPage({ params }: ProgramLandingPageProps) {
  const { slug } = await params;
  const page = await getProgramLandingBySlug(slug);

  if (!page) {
    notFound();
  }

  const featuredPrefectures = page.prefectureNames
    .map((areaName) => {
      const areaSchedules = page.schedules.filter(
        (item) => item.location.prefecture === areaName,
      );
      const locationCount = new Set(areaSchedules.map((item) => item.location.id)).size;

      return {
        areaName,
        locationCount,
        scheduleCount: areaSchedules.length,
      };
    })
    .filter((area) => shouldIndexAreaProgramPage(area))
    .sort(
      (left, right) =>
        right.locationCount - left.locationCount ||
        right.scheduleCount - left.scheduleCount ||
        left.areaName.localeCompare(right.areaName, "ja"),
    );
  const featuredCities = page.areaNames
    .filter((areaName) => !page.prefectureNames.includes(areaName))
    .map((areaName) => {
      const areaSchedules = page.schedules.filter(
        (item) => getAreaName(item.location.prefecture, item.location.city) === areaName,
      );
      const locationCount = new Set(areaSchedules.map((item) => item.location.id)).size;

      return {
        areaName,
        locationCount,
        scheduleCount: areaSchedules.length,
      };
    })
    .filter((area) => shouldIndexAreaProgramPage(area))
    .sort(
      (left, right) =>
        right.locationCount - left.locationCount ||
        right.scheduleCount - left.scheduleCount ||
        left.areaName.localeCompare(right.areaName, "ja"),
    )
    .slice(0, 8);
  const locationGroups = page.schedules.reduce((groups, item) => {
    const existing = groups.get(item.location.id);

    if (existing) {
      existing.push(item);
    } else {
      groups.set(item.location.id, [item]);
    }

    return groups;
  }, new Map<string, typeof page.schedules>());
  const locationSummaries = Array.from(locationGroups.entries())
    .map(([locationId, schedules]) => ({
      locationId,
      first: schedules[0]!,
      schedules,
    }))
    .sort(
      (left, right) =>
        right.schedules.length - left.schedules.length ||
        left.first.location.name.localeCompare(right.first.location.name, "ja"),
    );
  const featuredLocations = locationSummaries.slice(0, 12);
  const weekdaySummaries = weekdayOrder
    .map((weekday) => ({
      weekday,
      count: page.schedules.filter((item) => item.schedule.weekday === weekday).length,
    }))
    .filter((item) => item.count > 0);
  const timeRangeSummaries = timeRangeDefinitions
    .map((range) => ({
      ...range,
      count: page.schedules.filter((item) => {
        const startHour = Number.parseInt(item.schedule.start_time.split(":")[0] ?? "", 10);
        return startHour >= range.from && startHour < range.to;
      }).length,
    }))
    .filter((item) => item.count > 0);
  const latestScheduleUpdatedAt = getLatestScheduleUpdatedAt(
    page.schedules.map((item) => item.schedule),
  );
  const pagePath = buildProgramPath(page.program.slug);
  const pageDescription = `${page.program.name}を受けられるジムを${page.locationCount}店舗・${page.schedules.length}件掲載。地域・曜日・時間帯から、通いやすい開催店舗とタイムテーブルを比較できます。`;
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: `${page.program.name}が受けられるジム・最新スケジュール`,
    description: pageDescription,
    path: pagePath,
    items: featuredLocations.map(({ first }) => ({
      name: first.location.name,
      path: `/locations/${first.location.slug}`,
    })),
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "GymMap", path: "/" },
    { name: page.program.name, path: pagePath },
  ]);

  return (
    <div className={`page-stack ${styles.page}`}>
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd]} />
      <nav className={styles.breadcrumb} aria-label="パンくずリスト">
        <Link href="/">レッスンを探す</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">プログラム</span>
      </nav>

      <CardSurface as="section" className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p>プログラムから探す</p>
            <h1>{page.program.name}</h1>
            <span>受けられる店舗と今週の開催時間を、地域や曜日から探せます。</span>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="#program-locations">
                受けられるジムを見る
              </Link>
              <FavoriteProgramButton id={page.program.id} slug={page.program.slug} name={page.program.name} />
              <Link href={buildProgramSearchPath(page.program.name)}>条件を追加して検索</Link>
            </div>
          </div>
          <dl className={styles.stats} aria-label="掲載状況">
            <div>
              <strong>{page.locationCount}</strong>
              <span>掲載店舗</span>
            </div>
            <div>
              <strong>{page.schedules.length}</strong>
              <span>週間レッスン</span>
            </div>
            <div>
              <strong>{page.prefectureNames.length}</strong>
              <span>都道府県</span>
            </div>
          </dl>
        </div>
        <div className={styles.heroFooter}>
          <FreshnessIndicator
            status="neutral"
            label={`スケジュール確認 ${formatDate(latestScheduleUpdatedAt)}`}
          />
          <div className={styles.brandLinks} aria-label="掲載ブランド">
            <span>掲載ブランド</span>
            {page.brandNames.map((brandName) => (
              <Link href={buildBrandSearchPath(brandName)} key={brandName}>
                {brandName}
              </Link>
            ))}
          </div>
        </div>
      </CardSurface>

      <section className={styles.locationSection} id="program-locations" aria-labelledby="program-locations-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p>開催店舗</p>
            <h2 id="program-locations-heading">{page.program.name}が受けられるジム</h2>
          </div>
          <Link href={buildProgramSearchPath(page.program.name)}>全{page.locationCount}店舗を検索</Link>
        </div>
        <div className={styles.locationList}>
          {featuredLocations.map(({ locationId, first, schedules }) => (
            <CardSurface className={styles.locationCard} key={locationId}>
              <div className={styles.locationIdentity}>
                <p>{first.brand.name}</p>
                <h3>{first.location.name}</h3>
                <span>
                  {getLocationAddress(
                    first.location.prefecture,
                    first.location.city,
                    first.location.address_line,
                  )}
                </span>
              </div>
              <ul className={styles.times} aria-label={`${first.location.name}の主な開催時間`}>
                {schedules.slice(0, 3).map((item) => (
                  <li key={item.schedule.id}>
                    <strong>{formatWeekday(item.schedule.weekday)}</strong>
                    <span>{formatTime(item.schedule.start_time)}–{formatTime(item.schedule.end_time)}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.locationAction}>
                <span>週間{schedules.length}件</span>
                <Link href={`/locations/${first.location.slug}`}>店舗のタイムテーブルを見る</Link>
              </div>
            </CardSurface>
          ))}
        </div>
      </section>

      <CardSurface as="section" className={styles.conditionSection}>
        <div className={styles.sectionHeading}>
          <div>
            <p>絞り込み</p>
            <h2>{page.program.name}を曜日・時間から探す</h2>
          </div>
        </div>
        <div className={styles.filterGroup}>
          <h3>曜日</h3>
          <div className={styles.filterLinks}>
            {weekdaySummaries.map(({ weekday, count }) => (
              <Link href={buildProgramSearchPath(page.program.name, { weekday })} key={weekday}>
                {formatWeekday(weekday)} <span>{count}件</span>
              </Link>
            ))}
          </div>
        </div>
        <div className={styles.filterGroup}>
          <h3>開始時間帯</h3>
          <div className={styles.filterLinks}>
            {timeRangeSummaries.map(({ value, label, count }) => (
              <Link href={buildProgramSearchPath(page.program.name, { timeRange: value })} key={value}>
                {label} <span>{count}件</span>
              </Link>
            ))}
          </div>
        </div>
      </CardSurface>

      {featuredPrefectures.length ? (
        <CardSurface as="section" className={styles.areaSection}>
          <p>地域</p>
          <h2>{page.program.name}を地域から探す</h2>
          <div className={styles.filterLinks}>
            {featuredPrefectures.map((area) => (
              <Link
                key={area.areaName}
                href={buildAreaProgramPath(area.areaName, page.program.slug)}
              >
                <PendingFilterLinkLabel label={area.areaName} countLabel={`${area.locationCount}店舗`} />
              </Link>
            ))}
          </div>
          {featuredCities.length ? (
            <div className={styles.cityGroup}>
              <h3>市区町村から絞り込む</h3>
              <div className={styles.filterLinks}>
                {featuredCities.map((area) => (
                  <Link
                    key={area.areaName}
                    href={buildAreaProgramPath(area.areaName, page.program.slug)}
                  >
                    <PendingFilterLinkLabel label={area.areaName} countLabel={`${area.locationCount}店舗`} />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </CardSurface>
      ) : null}
      <p className={styles.note}>開催内容は変更される場合があります。参加前に各ジムの公式サイトをご確認ください。</p>
    </div>
  );
}
