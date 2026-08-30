import type { Metadata } from "next";
import Link from "next/link";

import { HyroxDiscovery } from "@/components/training/hyrox-discovery";
import { loadHyroxDiscoveryData } from "@/lib/hyrox-discovery-server";
import { HYROX_UNKNOWN_DATA_NOTICE } from "@/lib/hyrox-discovery";
import { buildCanonicalPath } from "@/lib/site";

const pathname = "/training/hyrox";
const pageTitle = "HYROXのトレーニングができるジム・公式Training Club一覧";
const description =
  "日本国内のHYROX Official Training Clubを地図と都道府県から探せます。施設の住所、GymMap店舗情報、施設公式サイトをまとめて確認できます。";

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

export const revalidate = 3600;

async function loadPageData() {
  try {
    return { data: await loadHyroxDiscoveryData(), error: null };
  } catch (error) {
    console.error("[training/hyrox] Failed to load publication data", error);
    return { data: null, error };
  }
}

export default async function HyroxTrainingPage() {
  const { data } = await loadPageData();

  if (!data) {
    return (
      <div className="page-stack hyrox-page">
        <nav className="hyrox-breadcrumb" aria-label="パンくずリスト">
          <Link href="/">ホーム</Link>
          <span aria-hidden="true">/</span>
          <span>HYROX</span>
        </nav>
        <section className="panel hyrox-error-state" role="alert">
          <h1>HYROX施設情報を取得できませんでした</h1>
          <p>施設が0件という意味ではありません。時間をおいて、もう一度このページを開いてください。</p>
          <Link href="/">GymMapトップへ戻る</Link>
        </section>
      </div>
    );
  }

  return (
      <div className="page-stack hyrox-page">
        <nav className="hyrox-breadcrumb" aria-label="パンくずリスト">
          <Link href="/">ホーム</Link>
          <span aria-hidden="true">/</span>
          <span>HYROX</span>
        </nav>

        <section className="panel hyrox-hero">
          <p className="hyrox-eyebrow">HYROX TRAINING IN JAPAN</p>
          <h1>HYROXのトレーニングができるジム</h1>
          <p className="hyrox-hero-copy">
            日本国内でHYROXのトレーニング拠点を探せます。HYROXの公式情報を根拠に確認できたOfficial
            Training Clubを、都道府県と地図から見つけられます。
          </p>
          <div className="hyrox-hero-stats" aria-label="公開施設数">
            <strong>{data.locations.length}</strong>
            <span>Official Training Clubs</span>
          </div>
        </section>

        <aside className="hyrox-unknown-note" aria-label="設備とクラス情報について">
          <strong>設備やクラス情報は現在確認中です。</strong>
          <span>{HYROX_UNKNOWN_DATA_NOTICE}</span>
        </aside>

        {data.missingOfficialUrlCount ? (
          <p className="hyrox-data-notice">
            施設公式サイトを確認できない店舗が{data.missingOfficialUrlCount}件あります。GymMapの店舗詳細は利用できます。
          </p>
        ) : null}

        {data.locations.length ? (
          <HyroxDiscovery locations={data.locations} />
        ) : (
          <section className="panel hyrox-empty-state" aria-live="polite">
            <h2>現在公開中の施設はありません</h2>
            <p>公開条件を満たすOfficial Training Clubが追加されると、こちらに表示されます。</p>
          </section>
        )}

        <aside className="panel hyrox-methodology-note">
          <h2>掲載基準について</h2>
          <p>
            Official Training Clubの表示は、HYROX governing-bodyの公開情報と確認日時に基づきます。GymMapはHYROXの公式サービスではありません。
          </p>
        </aside>
      </div>
  );
}
