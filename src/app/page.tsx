import Image from "next/image";
import Link from "next/link";

import { LocationMapSection } from "@/components/map/location-map-section";
import { SearchForm } from "@/components/search/search-form";
import { getBrands, getLocations, getMapLessonSearchIndex, getPopularPrograms } from "@/lib/data";
import { buildProgramPath } from "@/lib/site";

export const revalidate = 900;

export default async function HomePage() {
  const [brands, locations, lessonIndex, featuredPrograms] = await Promise.all([
    getBrands(),
    getLocations(),
    getMapLessonSearchIndex(),
    getPopularPrograms(8),
  ]);

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
            {featuredPrograms.map((program) => (
              <Link key={program.slug} href={buildProgramPath(program.slug)}>
                {program.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <LocationMapSection locations={locations} lessonIndex={lessonIndex} />
    </div>
  );
}
