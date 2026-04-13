import Link from "next/link";

import { ResultsList } from "@/components/search/results-list";
import { SearchForm } from "@/components/search/search-form";
import { getBrands, getSearchResults } from "@/lib/data";
import { defaultSearchFilters } from "@/lib/constants";

export default async function HomePage() {
  const [brands, featuredResults] = await Promise.all([
    getBrands(),
    getSearchResults(defaultSearchFilters),
  ]);

  return (
    <div className="page-stack">
      <section className="hero panel">
        <p className="eyebrow">Gym studio schedule search</p>
        <h1>曜日・時間・プログラム名からジムのスタジオ枠を横断検索</h1>
        <p className="hero-copy">
          気になるクラスを、曜日や時間帯、エリア、チェーン名からまとめて探せるシンプルな MVP です。
        </p>
        <SearchForm brands={brands} />
      </section>

      <section className="panel quick-links">
        <div>
          <h2>まずはシンプルに探せます</h2>
          <p>プログラム名、曜日、開始時刻帯、エリア、チェーン名で絞り込み、店舗詳細まで確認できます。</p>
        </div>
        <div className="link-row">
          <Link href="/search">条件なしで一覧を見る</Link>
        </div>
      </section>

      <ResultsList results={featuredResults.slice(0, 4)} />
    </div>
  );
}
