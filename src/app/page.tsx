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
          MVP ではスタジオプログラム検索に絞り、店舗詳細と簡易データ確認画面までを用意しています。
        </p>
        <SearchForm brands={brands} />
      </section>

      <section className="panel quick-links">
        <div>
          <h2>この MVP でできること</h2>
          <p>プログラム名、曜日、時間帯、エリア、チェーン名で検索できます。</p>
        </div>
        <div className="link-row">
          <Link href="/search">検索結果ページへ</Link>
          <Link href="/admin/data">管理用データ確認画面</Link>
        </div>
      </section>

      <ResultsList results={featuredResults.slice(0, 4)} />
    </div>
  );
}
