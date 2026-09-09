import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { getProgramCatalog } from "@/lib/data";
import { buildCanonicalPath, buildProgramPath } from "@/lib/site";
import { buildBreadcrumbJsonLd, buildCollectionPageJsonLd } from "@/lib/structured-data";

import styles from "./program-catalog.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "レッスンプログラム一覧",
  description: "BODYATTACK、BODYCOMBAT、ヨガなど、GymMapで現在受けられるレッスンをブランド・ジャンルから探せます。",
  alternates: { canonical: "/programs" },
  openGraph: {
    title: "レッスンプログラム一覧 | GymMap",
    description: "気になるプログラムから、受けられるジムと最新スケジュールを探せます。",
    url: buildCanonicalPath("/programs"),
    locale: "ja_JP",
    type: "website",
  },
};

export default async function ProgramCatalogPage() {
  const groups = await getProgramCatalog();
  const items = groups.flatMap((group) => group.items);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "GymMap", path: "/" },
    { name: "レッスンプログラム一覧", path: "/programs" },
  ]);
  const collectionJsonLd = buildCollectionPageJsonLd({
    name: "レッスンプログラム一覧",
    description: "GymMapで現在受けられるレッスンをブランド・ジャンルから探せるプログラムカタログです。",
    path: "/programs",
    items: items.map((item) => ({
      name: item.displayName,
      path: buildProgramPath(item.slug),
    })),
  });

  return (
    <div className={`page-stack ${styles.page}`}>
      <JsonLd data={[collectionJsonLd, breadcrumbJsonLd]} />

      <nav className={styles.breadcrumb} aria-label="パンくずリスト">
        <Link href="/">レッスンを探す</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">プログラム一覧</span>
      </nav>

      <header className={styles.hero}>
        <p>PROGRAM CATALOG</p>
        <h1>レッスンを探す</h1>
        <span>気になるプログラムから、受けられるジムを探せます。</span>
        <dl aria-label="掲載中のプログラム">
          <div><strong>{items.length}</strong><span>プログラム</span></div>
          <div><strong>{groups.length}</strong><span>カテゴリー</span></div>
        </dl>
      </header>

      {groups.length ? (
        <nav className={styles.groupNav} aria-label="プログラムカテゴリー">
          {groups.map((group) => (
            <a key={group.id} href={`#${group.id}`}>{group.label}<span>{group.items.length}</span></a>
          ))}
        </nav>
      ) : null}

      {groups.map((group) => (
        <section className={styles.group} id={group.id} key={group.id} aria-labelledby={`${group.id}-heading`}>
          <div className={styles.groupHeading}>
            <div>
              <p>{group.id === "standard" ? "GENRE" : "PROGRAM FAMILY"}</p>
              <h2 id={`${group.id}-heading`}>{group.label}</h2>
            </div>
            <span>{group.description}</span>
          </div>
          <div className={styles.grid}>
            {group.items.map((item) => (
              <article className={styles.card} key={item.canonicalProgramName}>
                <Link
                  href={buildProgramPath(item.slug)}
                  aria-label={`${item.displayName}を受けられるジムを見る（${item.facilityCount}店舗）`}
                >
                  <span className={styles.brand}>{item.programBrand ?? "スタンダード"}</span>
                  <strong>{item.displayName}</strong>
                  <span className={styles.count}>{item.facilityCount}店舗・週{item.weeklyLessonCount}件</span>
                  <span className={styles.arrow} aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}

      {!groups.length ? (
        <section className={styles.empty}>
          <h2>プログラムを読み込めませんでした</h2>
          <p>時間をおいてもう一度お試しいただくか、条件を指定して検索してください。</p>
          <Link href="/search">レッスン検索へ</Link>
        </section>
      ) : null}
    </div>
  );
}
