import Image from "next/image";
import Link from "next/link";

import { LocationMapSection } from "@/components/map/location-map-section";
import { SearchForm } from "@/components/search/search-form";
import { JsonLd } from "@/components/seo/json-ld";
import { getBrands, getLocations, getMapLessonSearchIndex, getPopularPrograms } from "@/lib/data";
import { buildCanonicalPath, buildProgramPath, siteDescription, siteName } from "@/lib/site";

export const revalidate = 900;

export default async function HomePage() {
  const [brands, locations, lessonIndex, featuredPrograms] = await Promise.all([
    getBrands(),
    getLocations(),
    getMapLessonSearchIndex(),
    getPopularPrograms(8),
  ]);
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${buildCanonicalPath("/")}#website`,
    url: buildCanonicalPath("/"),
    name: siteName,
    alternateName: "ジムマップ",
    description: siteDescription,
    inLanguage: "ja-JP",
  };

  return (
    <div className="page-stack home-page">
      <JsonLd data={websiteJsonLd} />
      <section id="search-section" className="home-hero page-anchor-section">
        <div className="home-hero-intro">
          <div className="home-hero-copy">
            <p className="home-hero-kicker">FIND YOUR NEXT CLASS</p>
            <h1>
              行きたいレッスンが、
              <span>すぐ見つかる。</span>
            </h1>
            <p>
              ジムを一つずつ調べなくても大丈夫。受けたいプログラムと通いやすい条件から、いま参加できるスタジオレッスンをまとめて探せます。
            </p>
            <div className="home-hero-facts" aria-label="GymMapの掲載情報">
              <span><strong>{locations.length}</strong>店舗を掲載</span>
              <span><strong>{brands.length}</strong>ブランドに対応</span>
              <span>曜日・時間で絞り込み</span>
            </div>
          </div>
          <div className="hero-photo">
            <Image
              src="/images/hero-studio-program.png"
              alt="格闘系スタジオレッスンでパンチ動作をしている様子"
              fill
              priority
              sizes="(max-width: 760px) calc(100vw - 40px), 48vw"
            />
            <div className="hero-photo-caption">
              <span>今日の運動を、ここから。</span>
              <strong>スタジオプログラムを横断検索</strong>
            </div>
          </div>
        </div>
        <SearchForm brands={brands} variant="hero" />
      </section>

      {featuredPrograms.length ? (
        <section id="popular-programs" className="panel home-program-section page-anchor-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">POPULAR PROGRAMS</p>
              <h2>人気のレッスンから探す</h2>
              <p className="muted">気になるプログラムを選ぶだけで、開催中の店舗とスケジュールを確認できます。</p>
            </div>
            <Link className="section-text-link" href="/search">すべてのレッスンを検索</Link>
          </div>
          <div className="program-card-grid">
            {featuredPrograms.map((program, index) => (
              <Link className="program-card-link" key={program.slug} href={buildProgramPath(program.slug)}>
                <span className="program-card-number">{String(index + 1).padStart(2, "0")}</span>
                <strong>{program.name}</strong>
                <span className="program-card-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <LocationMapSection locations={locations} lessonIndex={lessonIndex} />
    </div>
  );
}
