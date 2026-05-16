import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProgramLandingBySlug, getProgramLandingSlugs } from "@/lib/data";
import { buildAreaProgramPath, buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { formatWeekday, getAreaName, getLocationAddress } from "@/lib/utils";

type ProgramLandingPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getProgramLandingSlugs();
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

  const description = `${page.program.name}を受けられるジム・フィットネスクラブをまとめた一覧ページです。${page.locationCount}店舗・${page.schedules.length}件のレッスンから比較できます。`;

  return {
    title: `${page.program.name}が受けられるジム一覧`,
    description,
    alternates: {
      canonical: buildProgramPath(slug),
    },
    openGraph: {
      title: `${page.program.name}が受けられるジム一覧 | GymMap`,
      description,
      url: buildCanonicalPath(buildProgramPath(slug)),
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

  const featuredAreas = page.areaNames.slice(0, 8);
  const featuredSchedules = page.schedules.slice(0, 12);

  return (
    <div className="page-stack">
      <section className="panel">
        <p className="eyebrow">プログラム別ガイド</p>
        <h1>{page.program.name}が受けられるジム一覧</h1>
        <p className="muted">
          {page.program.name}を開催している {page.locationCount} 店舗・{page.schedules.length} 件のレッスンをまとめています。
          曜日、時間帯、ブランド、通いやすいエリアを見比べながら探せます。
        </p>
        <p className="muted">掲載ブランド: {page.brandNames.join(" / ")}</p>
        <div className="link-row">
          <Link href={`/search?q=${encodeURIComponent(page.program.name)}`}>この条件で検索する</Link>
          <Link href="/">検索トップへ戻る</Link>
        </div>
      </section>

      {featuredAreas.length ? (
        <section className="panel">
          <h2>{page.program.name}をエリア別に探す</h2>
          <div className="link-row">
            {featuredAreas.map((areaName) => (
              <Link key={areaName} href={buildAreaProgramPath(areaName, page.program.slug)}>
                {areaName}の{page.program.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>{page.program.name}の掲載レッスン</h2>
        <div className="result-list">
          {featuredSchedules.map((item) => (
            <article key={item.schedule.id} className="result-card">
              <div className="result-card-main">
                <p className="result-time">
                  {formatWeekday(item.schedule.weekday)} {item.schedule.start_time} - {item.schedule.end_time}
                </p>
                <h3>{item.location.name}</h3>
                <p className="muted">{item.brand.name}</p>
                <p className="muted">{getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line)}</p>
              </div>
              <dl className="result-meta">
                <div>
                  <dt>エリア</dt>
                  <dd>{getAreaName(item.location.prefecture, item.location.city) || "-"}</dd>
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
