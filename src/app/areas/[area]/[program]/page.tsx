import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { PendingFilterLinkLabel } from "@/components/navigation/pending-filter-link-label";
import { getAreaProgramLandingByParams } from "@/lib/data";
import { shouldIndexAreaProgramPage } from "@/lib/seo-indexing";
import { buildAreaProgramPath, buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/structured-data";
import { formatTime, formatWeekday, getLocationAddress } from "@/lib/utils";

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
    <div className="page-stack">
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd]} />
      <section className="panel">
        <p className="eyebrow">エリア別ガイド</p>
        <h1>{page.areaName}で{page.program.name}が受けられるジム・最新スケジュール</h1>
        <p className="muted">{page.locationCount}店舗・{page.schedules.length}レッスン掲載</p>
        <p className="muted">掲載ブランド: {page.brandNames.join(" / ")}</p>
        <div className="link-row">
          <Link href={programPath}>{page.program.name}の全国一覧</Link>
          {page.areaType === "city" && page.prefectureName ? (
            <Link href={buildAreaProgramPath(page.prefectureName, page.program.slug)}>
              {page.prefectureName}の{page.program.name}
            </Link>
          ) : null}
          <Link href={`/search?q=${encodeURIComponent(page.program.name)}&area=${encodeURIComponent(page.areaName)}`}>この条件で検索する</Link>
        </div>
      </section>

      {cityAreas.length ? (
        <section className="panel">
          <p className="eyebrow">市区町村から探す</p>
          <h2>{page.areaName}の{page.program.name}をさらに絞り込む</h2>
          <div className="program-filter-links">
            {cityAreas.map((city) => (
              <Link
                href={buildAreaProgramPath(city.cityName, page.program.slug)}
                key={city.cityName}
              >
                <PendingFilterLinkLabel label={city.cityName} countLabel={`${city.locationCount}店舗`} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>{page.areaName}の{page.program.name}掲載店舗</h2>
        <div className="result-list">
          {page.schedules.map((item) => (
            <article key={item.schedule.id} className="result-card">
              <div className="result-card-main">
                <p className="result-time">
                  {formatWeekday(item.schedule.weekday)} {formatTime(item.schedule.start_time)} - {formatTime(item.schedule.end_time)}
                </p>
                <h3>{item.location.name}</h3>
                <p className="muted">{item.brand.name}</p>
                <p className="muted">{getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line)}</p>
              </div>
              <dl className="result-meta">
                <div>
                  <dt>レッスン名</dt>
                  <dd>{item.schedule.raw_program_name}</dd>
                </div>
                <div>
                  <dt>店舗詳細</dt>
                  <dd>
                    <Link href={`/locations/${item.location.slug}`}>詳細を見る</Link>
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
