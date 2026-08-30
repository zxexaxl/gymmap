import type { Metadata } from "next";
import Link from "next/link";

import { ResultsList } from "@/components/search/results-list";
import { SearchForm } from "@/components/search/search-form";
import { durationRangeOptions, timeRangeOptions, weekdayOptions } from "@/lib/constants";
import { getBrands, getSearchResultPage } from "@/lib/data";
import { getProgramQueryDebug, normalizeSearchKeyword } from "@/lib/search-query";
import { siteDescription } from "@/lib/site";
import { normalizeSearchFilters } from "@/lib/utils";

import styles from "./search.module.css";

type SearchPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = {
  title: "検索結果",
  description: siteDescription,
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeSearchFilters(resolvedSearchParams);
  const rawPage = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const debugEnabled = resolvedSearchParams.debug === "1";
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const [brands, resultPage] = await Promise.all([getBrands(), getSearchResultPage(filters, currentPage)]);
  const { results } = resultPage;
  const filterLabels = [
    filters.q && `プログラム: ${filters.q}`,
    filters.area && `エリア: ${filters.area}`,
    filters.weekday && `曜日: ${weekdayOptions.find((option) => option.value === filters.weekday)?.label ?? filters.weekday}`,
    filters.timeRange && `時間: ${timeRangeOptions.find((option) => option.value === filters.timeRange)?.label ?? filters.timeRange}`,
    filters.durationRange && `所要時間: ${durationRangeOptions.find((option) => option.value === filters.durationRange)?.label ?? filters.durationRange}`,
    filters.brand && `チェーン: ${filters.brand}`,
  ].filter((value): value is string => Boolean(value));
  const shouldTraceOimachi = [filters.q, filters.area, filters.brand].join(" ").toLowerCase().match(/oimachi|大井町|bodypump|bodycombat/);

  if (debugEnabled && filters.q) {
    const normalizedQuery = normalizeSearchKeyword(filters.q);
    console.log("[search-debug]", JSON.stringify(results.map((item) => ({
      raw_program_name: item.schedule.raw_program_name,
      canonical_program_name: item.schedule.canonical_program_name,
      hits: getProgramQueryDebug(item, normalizedQuery),
    })), null, 2));
  }

  if (shouldTraceOimachi) {
    console.log("[search-trace]", JSON.stringify({
      stage: "ui_render_input",
      filters,
      resultCount: resultPage.totalResults,
      trackedRecords: results.filter((item) =>
        item.location.slug === "jexer-oimachi" && item.schedule.weekday === "friday" &&
        ((item.schedule.start_time === "19:40" && ((item.schedule.canonical_program_name ?? "") === "BODYPUMP" || item.schedule.raw_program_name.includes("BODYPUMP"))) ||
        (item.schedule.start_time === "20:50" && ((item.schedule.canonical_program_name ?? "") === "BODYCOMBAT" || item.schedule.raw_program_name.includes("BODYCOMBAT"))))
      ).map((item) => ({
        schedule_id: item.schedule.id,
        location_slug: item.location.slug,
        location_name: item.location.name,
        weekday: item.schedule.weekday,
        start_time: item.schedule.start_time,
        end_time: item.schedule.end_time,
        raw_program_name: item.schedule.raw_program_name,
        canonical_program_name: item.schedule.canonical_program_name ?? null,
      })),
    }, null, 2));
  }

  return (
    <div className={`page-stack ${styles.page}`}>
      <section className={styles.searchSection} aria-labelledby="lesson-search-title">
        <div className={styles.heading}>
          <div>
            <p>LESSON DISCOVERY</p>
            <h1 id="lesson-search-title">レッスンを探す</h1>
            <span>プログラム、エリア、曜日を組み合わせて検索できます。</span>
          </div>
          <Link href="/">ホームへ戻る</Link>
        </div>
        {debugEnabled ? (
          <div className="search-debug-banner">
            <p>DEBUG MODE ON</p><p>query={filters.q || "(empty)"}</p><p>debug={String(debugEnabled)}</p><p>resultCount={results.length}</p>
          </div>
        ) : null}
        <SearchForm brands={brands} initialValues={filters} />
      </section>

      <div className={styles.resultIntro}>
        <div>
          <p>検索結果</p>
          <h2>{resultPage.totalResults.toLocaleString("ja-JP")}件</h2>
        </div>
        <div className={styles.appliedFilters} aria-label="適用中の検索条件">
          {filterLabels.length ? filterLabels.map((label) => <span key={label}>{label}</span>) : <span>すべてのレッスン</span>}
        </div>
      </div>

      <ResultsList
        results={results}
        totalResults={resultPage.totalResults}
        latestScheduleUpdate={resultPage.latestScheduleUpdate}
        hasActiveFilters={hasActiveFilters}
        query={filters.q}
        debugEnabled={debugEnabled}
        currentPage={resultPage.currentPage}
        searchParams={resolvedSearchParams}
      />
    </div>
  );
}
