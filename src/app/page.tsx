import Link from "next/link";

import { FavoriteHomePanel } from "@/components/favorites/favorite-home-panel";
import { HyroxHomeEntry } from "@/components/lesson/hyrox-home-entry";
import { LocationMapSection } from "@/components/map/location-map-section";
import { FeaturedProgramTabs, type FeaturedProgramTab } from "@/components/programs/featured-program-tabs";
import { SearchForm } from "@/components/search/search-form";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getLessonDiscoveryBrands,
  getLessonDiscoveryLocations,
  getMapLessonSearchIndex,
  getPopularPrograms,
} from "@/lib/data";
import { featuredProgramShortcuts, getFeaturedProgramBrand } from "@/lib/featured-programs";
import type { ProgramBrand } from "@/lib/program-master";
import { buildCanonicalPath, buildProgramPath, siteDescription, siteName } from "@/lib/site";

import styles from "./home.module.css";

export const revalidate = 900;

const featuredBrandLimits: Array<[ProgramBrand, number]> = [
  ["Les Mills", 3], ["Radical Fitness", 2], ["MOSSA", 1], ["ZUMBA", 1], ["BAILA BAILA", 1],
];
const standardGenreNames = ["ヨガ", "ピラティス", "エアロビクス", "ステップ"];
const programPriority = [
  "BODYCOMBAT", "BODYPUMP", "BODYATTACK", "BODYJAM", "BODYBALANCE", "BODYSTEP",
  "FIGHT DO", "UBOUND", "メガダンス", "リトモス", "X55", "OXIGENO",
  "Group Fight", "Group Power", "Group Groove", "ZUMBA", "バイラバイラ",
];
const brandTabDefinitions: Array<{ id: string; label: string; brands: ProgramBrand[] }> = [
  { id: "les-mills", label: "LES MILLS", brands: ["Les Mills"] },
  { id: "radical", label: "Radical", brands: ["Radical Fitness"] },
  { id: "mossa", label: "MOSSA", brands: ["MOSSA"] },
  { id: "other", label: "その他", brands: ["ZUMBA", "BAILA BAILA"] },
];

export default async function HomePage() {
  const [brands, locations, lessonIndex, popularPrograms] = await Promise.all([
    getLessonDiscoveryBrands(),
    getLessonDiscoveryLocations(),
    getMapLessonSearchIndex(),
    getPopularPrograms(48),
  ]);
  const brandedPrograms = popularPrograms.flatMap((program) => {
    const programBrand = getFeaturedProgramBrand(program.name);
    return programBrand ? [{ ...program, programBrand }] : [];
  });
  const selectedProgramIds = new Set<string>();
  const featuredPrograms = featuredBrandLimits.flatMap(([brand, limit]) =>
    brandedPrograms.filter((program) => program.programBrand === brand).slice(0, limit).filter((program) => {
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
  const canonicalProgramNames = new Set(brandedPrograms.map((program) => program.name));
  const allBrandItems: FeaturedProgramTab["items"] = [
    ...brandedPrograms.map((program) => ({
      kind: "program" as const, id: program.id, slug: program.slug, name: program.name, brand: program.programBrand,
    })),
    ...featuredProgramShortcuts
      .filter((shortcut) => !canonicalProgramNames.has(shortcut.name))
      .map((shortcut) => ({ kind: "shortcut" as const, ...shortcut })),
  ].sort((left, right) => {
    const leftPriority = programPriority.indexOf(left.name);
    const rightPriority = programPriority.indexOf(right.name);
    return (leftPriority < 0 ? Number.MAX_SAFE_INTEGER : leftPriority)
      - (rightPriority < 0 ? Number.MAX_SAFE_INTEGER : rightPriority)
      || left.name.localeCompare(right.name, "ja");
  });
  const featuredTabs: FeaturedProgramTab[] = [
    {
      id: "featured",
      label: "注目",
      items: featuredPrograms.map((program) => ({
        kind: "program" as const, id: program.id, slug: program.slug, name: program.name, brand: program.programBrand,
      })),
    },
    ...brandTabDefinitions.map((tab) => ({
      id: tab.id,
      label: tab.label,
      items: allBrandItems.filter((item) => tab.brands.includes(item.brand as ProgramBrand)).slice(0, 8),
    })),
  ].filter((tab) => tab.items.length);
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
    <div className={`page-stack ${styles.page}`}>
      <JsonLd data={websiteJsonLd} />

      <section id="search-section" className={`page-anchor-section ${styles.hero}`}>
        <div className={styles.intro}>
          <p className={styles.kicker}>LESSON DISCOVERY</p>
          <h1><span>行きたいレッスンを、</span><span>ジムをまたいで探せる。</span></h1>
          <p className={styles.lead}>プログラム、エリア、曜日から、次に参加したいスタジオレッスンを横断検索できます。</p>
          <div className={styles.facts} aria-label="GymMapの掲載情報">
            <span><strong>{locations.length}</strong> 店舗</span>
            <span><strong>{brands.length}</strong> ブランド</span>
            <a href="#popular-programs">人気プログラムを見る</a>
          </div>
        </div>
        <SearchForm brands={brands} locations={locations} variant="hero" />
      </section>

      <div className={styles.favorite}><FavoriteHomePanel /></div>

      {featuredPrograms.length ? (
        <section id="popular-programs" className={`page-anchor-section ${styles.programSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p>プログラムから見つける</p>
              <h2>気になるレッスンを起点に探す</h2>
            </div>
            <Link href="/search">すべてのレッスンを見る <span aria-hidden="true">→</span></Link>
          </div>
          <FeaturedProgramTabs tabs={featuredTabs} />
          {standardGenrePrograms.length ? (
            <div className="standard-genre-strip">
              <p>定番ジャンル</p>
              <div>
                {standardGenrePrograms.map((program) => (
                  <Link key={program.slug} href={buildProgramPath(program.slug)}>{program.name}<span aria-hidden="true">→</span></Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <HyroxHomeEntry />

      <div className={styles.mapBoundary}><LocationMapSection locations={locations} lessonIndex={lessonIndex} /></div>
    </div>
  );
}
