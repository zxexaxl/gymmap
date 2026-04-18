import Link from "next/link";

import { ResultsList } from "@/components/search/results-list";
import { SearchForm } from "@/components/search/search-form";
import { durationRangeOptions, timeRangeOptions, weekdayOptions } from "@/lib/constants";
import { getBrands, getSearchResults } from "@/lib/data";
import { getProgramQueryDebug, normalizeSearchKeyword } from "@/lib/search-query";
import { normalizeSearchFilters } from "@/lib/utils";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeSearchFilters(resolvedSearchParams);
  const debugEnabled = resolvedSearchParams.debug === "1";
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const [brands, results] = await Promise.all([getBrands(), getSearchResults(filters)]);
  const weekdayLabel = weekdayOptions.find((option) => option.value === filters.weekday)?.label ?? "指定なし";
  const timeRangeLabel = timeRangeOptions.find((option) => option.value === filters.timeRange)?.label ?? "指定なし";
  const durationRangeLabel = durationRangeOptions.find((option) => option.value === filters.durationRange)?.label ?? "指定なし";
  const shouldTraceOimachi = [filters.q, filters.area, filters.brand]
    .join(" ")
    .toLowerCase()
    .match(/oimachi|大井町|bodypump|bodycombat/);

  if (debugEnabled && filters.q) {
    const normalizedQuery = normalizeSearchKeyword(filters.q);

    console.log(
      "[search-debug]",
      JSON.stringify(
        results.map((item) => ({
          raw_program_name: item.schedule.raw_program_name,
          canonical_program_name: item.schedule.canonical_program_name,
          hits: getProgramQueryDebug(item, normalizedQuery),
        })),
        null,
        2,
      ),
    );
  }

  if (shouldTraceOimachi) {
    console.log(
      "[search-trace]",
      JSON.stringify(
        {
          stage: "ui_render_input",
          filters,
          resultCount: results.length,
          trackedRecords: results
            .filter(
              (item) =>
                item.location.slug === "jexer-oimachi" &&
                item.schedule.weekday === "friday" &&
                ((item.schedule.start_time === "19:40" &&
                  ((item.schedule.canonical_program_name ?? "") === "BODYPUMP" ||
                    item.schedule.raw_program_name.includes("BODYPUMP"))) ||
                  (item.schedule.start_time === "20:50" &&
                    ((item.schedule.canonical_program_name ?? "") === "BODYCOMBAT" ||
                      item.schedule.raw_program_name.includes("BODYCOMBAT")))),
            )
            .map((item) => ({
              schedule_id: item.schedule.id,
              location_slug: item.location.slug,
              location_name: item.location.name,
              weekday: item.schedule.weekday,
              start_time: item.schedule.start_time,
              end_time: item.schedule.end_time,
              raw_program_name: item.schedule.raw_program_name,
              canonical_program_name: item.schedule.canonical_program_name ?? null,
            })),
        },
        null,
        2,
      ),
    );
  }

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
        {debugEnabled ? (
          <div className="search-debug-banner">
            <p>DEBUG MODE ON</p>
            <p>query={filters.q || "(empty)"}</p>
            <p>debug={String(debugEnabled)}</p>
            <p>resultCount={results.length}</p>
          </div>
        ) : null}
        <p className="search-summary">
          レッスン名: {filters.q || "指定なし"} / 曜日: {weekdayLabel} / 時間帯: {timeRangeLabel} / 所要時間: {durationRangeLabel} /
          エリア・店舗名: {filters.area || "指定なし"} / チェーン名: {filters.brand || "指定なし"}
        </p>
        <SearchForm brands={brands} initialValues={filters} />
      </section>
      <ResultsList results={results} hasActiveFilters={hasActiveFilters} query={filters.q} debugEnabled={debugEnabled} />
    </div>
  );
}
