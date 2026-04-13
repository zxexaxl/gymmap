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
        <h1>検索結果一覧</h1>
        <p className="muted">開始時刻順で表示しています。</p>
        <SearchForm brands={brands} initialValues={filters} />
      </section>
      <ResultsList results={results} />
    </div>
  );
}
