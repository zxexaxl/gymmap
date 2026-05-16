import Image from "next/image";
import Link from "next/link";

import { LocationMapSection } from "@/components/map/location-map-section";
import { SearchForm } from "@/components/search/search-form";
import { getAreaProgramLandingParams, getBrands, getLocations, getProgramLandingPages, getSearchResults } from "@/lib/data";
import { buildAreaProgramPath, buildProgramPath } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [brands, locations, searchResults, programPages, areaProgramParams] = await Promise.all([
    getBrands(),
    getLocations(),
    getSearchResults({
      q: "",
      weekday: "",
      timeRange: "",
      durationRange: "",
      brand: "",
      area: "",
    }),
    getProgramLandingPages(),
    getAreaProgramLandingParams(),
  ]);
  const featuredPrograms = programPages.slice(0, 8);
  const featuredAreaPrograms = areaProgramParams.slice(0, 8);

  return (
    <div className="page-stack">
      <section id="search-section" className="hero panel page-anchor-section">
        <div className="hero-copy">
          <h1>受けたいレッスンを探す</h1>
          <p>
            受けたいレッスン名から、近くのジム・フィットネスクラブのスタジオレッスンを探せます。曜日・開始時間・エリア・店舗で絞り込みできます。
          </p>
        </div>
        <div className="hero-photo">
          <Image
            src="/images/hero-studio-program.png"
            alt="格闘系スタジオレッスンでパンチ動作をしている様子"
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1120px) calc(100vw - 80px), 1072px"
          />
        </div>
        <SearchForm brands={brands} />
      </section>

      {featuredPrograms.length ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>人気のレッスンから探す</h2>
              <p className="muted">検索されやすいプログラムごとに、受けられる店舗をまとめています。</p>
            </div>
          </div>
          <div className="link-row">
            {featuredPrograms.map((page) => (
              <Link key={page.program.slug} href={buildProgramPath(page.program.slug)}>
                {page.program.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {featuredAreaPrograms.length ? (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>エリア別に探す</h2>
              <p className="muted">通いやすい街ごとに、代表的なレッスンを比較できる固定ページです。</p>
            </div>
          </div>
          <div className="link-row">
            {featuredAreaPrograms.map((entry) => (
              <Link key={`${entry.area}-${entry.program}`} href={buildAreaProgramPath(entry.area, entry.program)}>
                {entry.area}の{featuredPrograms.find((page) => page.program.slug === entry.program)?.program.name ?? entry.program}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <LocationMapSection locations={locations} searchResults={searchResults} />
    </div>
  );
}
