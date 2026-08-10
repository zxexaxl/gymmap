import Image from "next/image";
import Link from "next/link";

import { LocationMapSection } from "@/components/map/location-map-section";
import { SearchForm } from "@/components/search/search-form";
import { JsonLd } from "@/components/seo/json-ld";
import { FavoriteHomePanel } from "@/components/favorites/favorite-home-panel";
import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { getBrands, getLocations, getMapLessonSearchIndex, getPopularPrograms } from "@/lib/data";
import { getFeaturedProgramBrand } from "@/lib/featured-programs";
import type { ProgramBrand } from "@/lib/program-master";
import { buildCanonicalPath, buildProgramPath, siteDescription, siteName } from "@/lib/site";

export const revalidate = 900;

const featuredBrandLimits: Array<[ProgramBrand, number]> = [
  ["Les Mills", 3],
  ["Radical Fitness", 2],
  ["MOSSA", 1],
  ["ZUMBA", 1],
  ["BAILA BAILA", 1],
];

const standardGenreNames = ["ヨガ", "ピラティス", "エアロビクス", "ステップ"];

export default async function HomePage() {
  const [brands, locations, lessonIndex, popularPrograms] = await Promise.all([
    getBrands(),
    getLocations(),
    getMapLessonSearchIndex(),
    getPopularPrograms(48),
  ]);
  const brandedPrograms = popularPrograms.flatMap((program) => {
    const programBrand = getFeaturedProgramBrand(program.name);
    return programBrand ? [{ ...program, programBrand }] : [];
  });
  const selectedProgramIds = new Set<string>();
  const featuredPrograms = featuredBrandLimits.flatMap(([brand, limit]) =>
    brandedPrograms
      .filter((program) => program.programBrand === brand)
      .slice(0, limit)
      .filter((program) => {
        selectedProgramIds.add(program.id);
        return true;
      }),
  );

  for (const program of brandedPrograms) {
    if (featuredPrograms.length >= 8) break;
    if (selectedProgramIds.has(program.id)) continue;
    featuredPrograms.push(program);
    selectedProgramIds.add(program.id);
  }

  const standardGenrePrograms = standardGenreNames
    .map((name) => popularPrograms.find((program) => program.name === name))
    .filter((program): program is (typeof popularPrograms)[number] => Boolean(program));
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
              <span className="home-hero-title-lead">
                <span>行きたい</span><span>レッスンが、</span>
              </span>
              <span className="home-hero-title-accent">すぐ見つかる。</span>
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

      <FavoriteHomePanel />

      {featuredPrograms.length ? (
        <section id="popular-programs" className="panel home-program-section page-anchor-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FEATURED BRANDS</p>
              <h2><span>ブランドプログラム</span><span>から探す</span></h2>
              <p className="muted">LES MILLSやRadical Fitnessなど、支持されているプログラムをブランド別に選びました。</p>
            </div>
            <Link className="section-text-link" href="/search">すべてのレッスンを検索</Link>
          </div>
          <div className="program-card-grid">
            {featuredPrograms.map((program) => (
              <article className="program-card" key={program.slug}>
                <Link className="program-card-link" href={buildProgramPath(program.slug)}>
                  <span className="program-card-brand">{program.programBrand}</span>
                  <strong>{program.name}</strong>
                  <span className="program-card-arrow" aria-hidden="true">→</span>
                </Link>
                <FavoriteProgramButton id={program.id} slug={program.slug} name={program.name} iconOnly />
              </article>
            ))}
          </div>
          {standardGenrePrograms.length ? (
            <div className="standard-genre-strip">
              <p>定番ジャンルから探す</p>
              <div>
                {standardGenrePrograms.map((program) => (
                  <Link key={program.slug} href={buildProgramPath(program.slug)}>{program.name}<span aria-hidden="true">→</span></Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <LocationMapSection locations={locations} lessonIndex={lessonIndex} />
    </div>
  );
}
