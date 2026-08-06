import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { getAreaProgramLandingByParams } from "@/lib/data";
import { buildAreaProgramPath, buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/structured-data";
import { formatTime, formatWeekday, getLocationAddress } from "@/lib/utils";

type AreaProgramPageProps = {
  params: Promise<{ area: string; program: string }>;
};

// Vercel rejects Next.js cache-tag headers containing decoded Japanese route
// segments, so area pages render dynamically instead of using full-route ISR.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const description = `${page.areaName}で${page.program.name}が受けられるジム・フィットネスクラブの一覧です。${page.locationCount}店舗・${page.schedules.length}件のレッスンを比較できます。`;

  return {
    title: `${page.areaName}で${page.program.name}が受けられるジム一覧`,
    description,
    robots: {
      index: false,
      follow: true,
    },
    alternates: {
      canonical: buildAreaProgramPath(page.areaName, page.program.slug),
    },
    openGraph: {
      title: `${page.areaName}で${page.program.name}が受けられるジム一覧 | GymMap`,
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
  const pageDescription = `${page.areaName}で${page.program.name}が受けられるジム・フィットネスクラブの一覧です。${page.locationCount}店舗・${page.schedules.length}件のレッスンを比較できます。`;
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
    { name: page.areaName, path: pagePath },
  ]);

  return (
    <div className="page-stack">
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd]} />
      <section className="panel">
        <p className="eyebrow">エリア別ガイド</p>
        <h1>{page.areaName}で{page.program.name}が受けられるジム一覧</h1>
        <p className="muted">
          {page.areaName}で {page.program.name} を開催している {page.locationCount} 店舗・{page.schedules.length} 件のレッスンを掲載しています。
          通いやすい店舗や曜日の違いを見ながら比較できます。
        </p>
        <p className="muted">掲載ブランド: {page.brandNames.join(" / ")}</p>
        <div className="link-row">
          <Link href={programPath}>{page.program.name}の全国一覧</Link>
          <Link href={`/search?q=${encodeURIComponent(page.program.name)}&area=${encodeURIComponent(page.areaName)}`}>この条件で検索する</Link>
        </div>
      </section>

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
