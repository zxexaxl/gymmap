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
        <h1>曜日や時間帯から、気になるスタジオプログラムをまとめて探す</h1>
        <p className="hero-copy">
          プログラム名、曜日、時間帯、エリア、チェーン名から、複数のジムのクラス情報を横断して探せます。
        </p>
        <SearchForm brands={brands} />
      </section>

      <section className="panel quick-links">
        <div>
          <h2>できること</h2>
          <p>クラスを絞り込んで一覧表示し、気になった店舗は詳細ページで曜日別スケジュールまで確認できます。</p>
        </div>
        <div className="link-row">
          <Link href="/search">条件なしで一覧を見る</Link>
        </div>
      </section>

      <ResultsList results={featuredResults.slice(0, 4)} />
    </div>
  );
}
