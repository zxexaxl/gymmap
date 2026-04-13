import Link from "next/link";

import { ResultsList } from "@/components/search/results-list";
import { SearchForm } from "@/components/search/search-form";
import { getBrands, getSearchResults } from "@/lib/data";
import { normalizeSearchFilters } from "@/lib/utils";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeSearchFilters(resolvedSearchParams);
  const [brands, results] = await Promise.all([getBrands(), getSearchResults(filters)]);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h1>検索結果</h1>
            <p className="muted">条件を調整しながら、開始時刻順でクラスを確認できます。</p>
          </div>
          <div className="link-row">
            <Link href="/">検索トップへ戻る</Link>
          </div>
        </div>
        <SearchForm brands={brands} initialValues={filters} />
      </section>
      <ResultsList results={results} />
    </div>
  );
}
