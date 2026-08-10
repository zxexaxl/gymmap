import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
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

export async function generateStaticParams() {
  const slugs = await getProgramLandingSlugs(12);
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = true;
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
    <div className="page-stack program-landing-page">
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd]} />
      <section className="panel program-landing-hero">
        <p className="eyebrow">プログラム別ガイド</p>
        <h1>{page.program.name}が受けられるジム・最新スケジュール</h1>
        <div className="program-landing-stats" aria-label="掲載状況">
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
          <div>
            <strong>{formatDate(latestScheduleUpdatedAt)}</strong>
            <span>スケジュール更新日</span>
          </div>
        </div>
        <p className="muted">掲載ブランド: {page.brandNames.join(" / ")}</p>
        <div className="program-page-actions">
          <FavoriteProgramButton id={page.program.id} slug={page.program.slug} name={page.program.name} />
          <div className="link-row">
            <Link className="primary-link-button program-location-jump" href="#program-locations">
              受けられるジムを見る
            </Link>
            <Link href={buildProgramSearchPath(page.program.name)}>すべての条件で検索する</Link>
            <Link href="/">検索トップへ戻る</Link>
          </div>
        </div>
      </section>

      <section className="panel program-condition-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">曜日・時間から探す</p>
            <h2>{page.program.name}の開催条件を絞り込む</h2>
          </div>
        </div>
        <div className="program-filter-group">
          <h3>曜日</h3>
          <div className="program-filter-links">
            {weekdaySummaries.map(({ weekday, count }) => (
              <Link
                href={buildProgramSearchPath(page.program.name, { weekday })}
                key={weekday}
              >
                {formatWeekday(weekday)} <span>{count}件</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="program-filter-group">
          <h3>開始時間帯</h3>
          <div className="program-filter-links">
            {timeRangeSummaries.map(({ value, label, count }) => (
              <Link
                href={buildProgramSearchPath(page.program.name, { timeRange: value })}
                key={value}
              >
                {label} <span>{count}件</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featuredPrefectures.length ? (
        <section className="panel program-area-section">
          <p className="eyebrow">地域から探す</p>
          <h2>{page.program.name}を都道府県から探す</h2>
          <div className="program-filter-links">
            {featuredPrefectures.map((area) => (
              <Link
                key={area.areaName}
                href={buildAreaProgramPath(area.areaName, page.program.slug)}
              >
                {area.areaName} <span>{area.locationCount}店舗</span>
              </Link>
            ))}
          </div>
          {featuredCities.length ? (
            <div className="program-filter-group program-city-filter-group">
              <h3>市区町村から絞り込む</h3>
              <div className="program-filter-links">
                {featuredCities.map((area) => (
                  <Link
                    key={area.areaName}
                    href={buildAreaProgramPath(area.areaName, page.program.slug)}
                  >
                    {area.areaName} <span>{area.locationCount}店舗</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section
        className="panel page-anchor-section program-location-section"
        id="program-locations"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">開催店舗</p>
            <h2>{page.program.name}が受けられるジム</h2>
          </div>
          <Link
            className="program-all-locations-link"
            href={buildProgramSearchPath(page.program.name)}
          >
            全{page.locationCount}店舗を見る
          </Link>
        </div>
        <div className="result-list program-location-list">
          {featuredLocations.map(({ locationId, first, schedules }) => (
            <article key={locationId} className="result-card">
              <div className="result-card-main">
                <h3>
                  <Link href={`/locations/${first.location.slug}`}>{first.location.name}</Link>
                </h3>
                <p className="muted">{first.brand.name}</p>
                <p className="muted">
                  {getLocationAddress(
                    first.location.prefecture,
                    first.location.city,
                    first.location.address_line,
                  )}
                </p>
                <ul className="program-location-times">
                  {schedules.slice(0, 3).map((item) => (
                    <li key={item.schedule.id}>
                      {formatWeekday(item.schedule.weekday)} {formatTime(item.schedule.start_time)} -{" "}
                      {formatTime(item.schedule.end_time)}
                    </li>
                  ))}
                </ul>
              </div>
              <dl className="result-meta">
                <div>
                  <dt>週間開催</dt>
                  <dd>{schedules.length}件</dd>
                </div>
                <div>
                  <dt>店舗詳細</dt>
                  <dd>
                    <Link href={`/locations/${first.location.slug}`}>タイムテーブルを見る</Link>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <p className="muted">開催内容は変更される場合があります。参加前に各ジムの公式サイトをご確認ください。</p>
    </div>
  );
}
