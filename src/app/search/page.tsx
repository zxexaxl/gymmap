import Link from "next/link";

import { ResultsList } from "@/components/search/results-list";
import { SearchForm } from "@/components/search/search-form";
import { timeRangeOptions, weekdayOptions } from "@/lib/constants";
import { getBrands, getSearchResults } from "@/lib/data";
import { normalizeSearchFilters } from "@/lib/utils";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeSearchFilters(resolvedSearchParams);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const [brands, results] = await Promise.all([getBrands(), getSearchResults(filters)]);
  const weekdayLabel = weekdayOptions.find((option) => option.value === filters.weekday)?.label ?? "指定なし";
  const timeRangeLabel = timeRangeOptions.find((option) => option.value === filters.timeRange)?.label ?? "指定なし";

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h1>検索結果</h1>
            <p className="muted">
              {hasActiveFilters
                ? "条件に合うクラスを確認できます。条件を調整しながらそのまま再検索できます。"
                : "検索条件が未指定のため、登録されているクラスを一覧表示しています。"}
            </p>
          </div>
          <div className="link-row">
            <Link href="/">検索トップへ戻る</Link>
          </div>
        </div>
        <p className="search-summary">
          プログラム名: {filters.q || "指定なし"} / 曜日: {weekdayLabel} / 時間帯: {timeRangeLabel} /
          エリア・店舗名: {filters.area || "指定なし"} / チェーン名: {filters.brand || "指定なし"}
        </p>
        <SearchForm brands={brands} initialValues={filters} />
      </section>
      <ResultsList results={results} hasActiveFilters={hasActiveFilters} />
    </div>
  );
}
