import Link from "next/link";

import { buildAreaProgramPath, buildProgramPath } from "@/lib/site";
import { getProgramQueryDebug, normalizeSearchKeyword } from "@/lib/search-query";
import type { SearchResult } from "@/lib/types";
import {
  formatDate,
  formatTime,
  formatWeekday,
  getAreaName,
  getLocationAddress,
  getScheduleUpdatedAt,
  isDateOlderThan,
} from "@/lib/utils";

const resultsPerPage = 20;
const staleScheduleDays = 45;

type ResultsListProps = {
  results: SearchResult[];
  hasActiveFilters?: boolean;
  query?: string;
  debugEnabled?: boolean;
  currentPage?: number;
  searchParams?: Record<string, string | string[] | undefined>;
};

function buildPageHref(searchParams: ResultsListProps["searchParams"], page: number) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, rawValue]) => {
    if (key === "page") {
      return;
    }

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value) {
      params.set(key, value);
    }
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return `/search${queryString ? `?${queryString}` : ""}#search-results`;
}

export function ResultsList({
  results,
  hasActiveFilters = false,
  query = "",
  debugEnabled = false,
  currentPage = 1,
  searchParams,
}: ResultsListProps) {
  if (!results.length) {
    return (
      <section className="panel empty-state">
        <div className="section-heading">
          <div>
            <h2>検索結果 0件</h2>
            <p className="muted">
              {hasActiveFilters
                ? "条件に合うクラスは見つかりませんでした。キーワードや時間帯を少し広げて、もう一度探してみてください。"
                : "まだ表示できるクラスがありません。データが入るとここに一覧が表示されます。"}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const normalizedQuery = normalizeSearchKeyword(query);
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const firstResultIndex = (safeCurrentPage - 1) * resultsPerPage;
  const visibleResults = results.slice(firstResultIndex, firstResultIndex + resultsPerPage);
  const latestScheduleUpdate = results
    .map((item) => getScheduleUpdatedAt(item.schedule))
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];
  const hasStaleSchedules = isDateOlderThan(latestScheduleUpdate, staleScheduleDays);
  const pageCandidates = [1, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, totalPages]
    .filter((page) => page >= 1 && page <= totalPages)
    .filter((page, index, pages) => pages.indexOf(page) === index)
    .sort((left, right) => left - right);

  return (
    <section id="search-results" className="panel page-anchor-section">
      <div className="section-heading">
        <div>
          <h2>検索結果 {results.length}件</h2>
          <p className="muted">
            {hasActiveFilters ? "条件に合うクラスを開始時刻順で表示しています。" : "登録されているクラスを開始時刻順で表示しています。"}
          </p>
          <p className="result-range">
            {firstResultIndex + 1}〜{Math.min(firstResultIndex + resultsPerPage, results.length)}件を表示
          </p>
        </div>
      </div>
      {hasStaleSchedules ? (
        <aside className="freshness-notice" aria-label="掲載情報の更新状況">
          掲載スケジュールの最新確認日は{formatDate(latestScheduleUpdate)}です。変更されている可能性があるため、来館前に店舗の公式サイトをご確認ください。
        </aside>
      ) : null}
      <div className="result-list">
        {visibleResults.map((item) => (
          <article key={item.schedule.id} className="result-card">
            <div className="result-card-main">
              <p className="result-time">
                {formatWeekday(item.schedule.weekday)} {formatTime(item.schedule.start_time)} - {formatTime(item.schedule.end_time)}
              </p>
              <h3>{item.schedule.raw_program_name}</h3>
              {item.schedule.canonical_program_name && item.schedule.canonical_program_name !== item.schedule.raw_program_name ? (
                <p className="muted">正規名: {item.schedule.canonical_program_name}</p>
              ) : null}
              <p className="result-location">{item.location.name}</p>
              <p className="muted">{item.brand.name}</p>
              <p className="muted">
                {getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line)}
              </p>
              <div className="link-row">
                <Link href={buildProgramPath(item.program.slug)}>{item.program.name}の一覧</Link>
                {getAreaName(item.location.prefecture, item.location.city) ? (
                  <Link href={buildAreaProgramPath(getAreaName(item.location.prefecture, item.location.city), item.program.slug)}>
                    {getAreaName(item.location.prefecture, item.location.city)}の{item.program.name}
                  </Link>
                ) : null}
              </div>
              {debugEnabled && normalizedQuery ? (
                <div className="search-debug">
                  <p className="search-debug-title">debug query: {query}</p>
                  {getProgramQueryDebug(item, normalizedQuery).map((hit, index) => (
                    <div key={`${item.schedule.id}-${hit.field}-${hit.value}-${index}`} className="search-debug-row">
                      <p className="search-debug-item">
                        matchedBy:{" "}
                        {hit.field === "raw_program_name"
                          ? "raw"
                          : hit.field === "canonical_program_name"
                            ? "canonical"
                            : hit.field === "program_brand"
                              ? "brand"
                              : hit.field === "brandAliases"
                                ? "brandAlias"
                            : "alias"}
                      </p>
                      <p className="search-debug-item">matchedValue: {hit.value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <dl className="result-meta">
              <div>
                <dt>所要時間</dt>
                <dd>{item.schedule.duration_minutes ? `${item.schedule.duration_minutes}分` : "-"}</dd>
              </div>
              <div>
                <dt>スケジュール確認日</dt>
                <dd>{formatDate(getScheduleUpdatedAt(item.schedule))}</dd>
              </div>
              <div>
                <dt>店舗詳細</dt>
                <dd>
                  <Link href={`/locations/${item.location.slug}`}>詳細を見る</Link>
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      {totalPages > 1 ? (
        <nav className="pagination" aria-label="検索結果のページ">
          {safeCurrentPage > 1 ? (
            <Link className="pagination-link pagination-direction" href={buildPageHref(searchParams, safeCurrentPage - 1)}>
              前へ
            </Link>
          ) : (
            <span className="pagination-link pagination-direction is-disabled">前へ</span>
          )}
          <div className="pagination-pages">
            {pageCandidates.map((page, index) => (
              <span key={page} className="pagination-page-item">
                {index > 0 && page - pageCandidates[index - 1] > 1 ? <span className="pagination-ellipsis">…</span> : null}
                {page === safeCurrentPage ? (
                  <span className="pagination-link is-current" aria-current="page">{page}</span>
                ) : (
                  <Link className="pagination-link" href={buildPageHref(searchParams, page)}>{page}</Link>
                )}
              </span>
            ))}
          </div>
          {safeCurrentPage < totalPages ? (
            <Link className="pagination-link pagination-direction" href={buildPageHref(searchParams, safeCurrentPage + 1)}>
              次へ
            </Link>
          ) : (
            <span className="pagination-link pagination-direction is-disabled">次へ</span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
