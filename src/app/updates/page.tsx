import type { Metadata } from "next";

import { PublicUpdateItem } from "@/components/updates/public-update-item";
import { CardSurface } from "@/components/ui";
import { getPublicUpdates } from "@/lib/public-updates";
import { buildCanonicalPath } from "@/lib/site";

import styles from "./updates.module.css";

const pathname = "/updates";
const pageTitle = "更新情報";
const description = "GymMapで公開した主な機能改善やレッスン・HYROX情報の更新を確認できます。";

export const metadata: Metadata = {
  title: pageTitle,
  description,
  alternates: {
    canonical: pathname,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `${pageTitle} | GymMap`,
    description,
    url: buildCanonicalPath(pathname),
    locale: "ja_JP",
    type: "website",
  },
};

export const dynamic = "force-static";

export default function UpdatesPage() {
  const updates = getPublicUpdates();

  return (
    <div className={`page-stack ${styles.page}`}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>GYMMAP UPDATES</p>
        <h1>更新情報</h1>
        <p className={styles.lead}>
          GymMapで公開した主な更新をお知らせします。レッスンやHYROXの個別情報の確認日は、各ページの表示をご確認ください。
        </p>
      </header>

      {updates.length ? (
        <ol className={styles.list} aria-label="GymMapの更新情報">
          {updates.map((update) => (
            <li key={update.id}>
              <PublicUpdateItem update={update} />
            </li>
          ))}
        </ol>
      ) : (
        <CardSurface as="section" className={styles.emptyState} aria-live="polite">
          <h2>現在お知らせできる更新情報はありません。</h2>
          <p>公開できる更新がまとまり次第、こちらでお知らせします。</p>
        </CardSurface>
      )}
    </div>
  );
}
