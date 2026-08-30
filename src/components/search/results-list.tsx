import Link from "next/link";

import { FavoriteProgramButton } from "@/components/favorites/favorite-program-button";
import { CardSurface } from "@/components/ui/card-surface";
import { FreshnessIndicator } from "@/components/ui/freshness-indicator";
import { getProgramQueryDebug, normalizeSearchKeyword } from "@/lib/search-query";
import { buildAreaProgramPath, buildProgramPath } from "@/lib/site";
import type { SearchResult } from "@/lib/types";
import {
  formatDate, formatTime, formatWeekday, getAreaName, getLocationAddress, getScheduleUpdatedAt, isDateOlderThan,
} from "@/lib/utils";

import styles from "./results-list.module.css";

const resultsPerPage = 20;
const staleScheduleDays = 45;

type ResultsListProps = {
  results: SearchResult[];
  totalResults?: number;
  latestScheduleUpdate?: string | null;
  hasActiveFilters?: boolean;
  query?: string;
  debugEnabled?: boolean;
  currentPage?: number;
  searchParams?: Record<string, string | string[] | undefined>;
};

function buildPageHref(searchParams: ResultsListProps["searchParams"], page: number) {
  const params = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, rawValue]) => {
    if (key === "page") return;
    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    if (value) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  const queryString = params.toString();
  return `/search${queryString ? `?${queryString}` : ""}#search-results`;
}

export function ResultsList({
  results,
  totalResults = results.length,
  latestScheduleUpdate,
  hasActiveFilters = false,
  query = "",
  debugEnabled = false,
  currentPage = 1,
  searchParams,
}: ResultsListProps) {
  if (!totalResults) {
    return (
      <CardSurface as="section" className={styles.empty} aria-labelledby="empty-results-title">
        <p>検索結果</p>
        <h2 id="empty-results-title">該当するレッスンはありません</h2>
        <span>
          {hasActiveFilters
            ? "キーワードや時間帯を少し広げて、もう一度探してみてください。"
            : "まだ表示できるクラスがありません。データが入るとここに一覧が表示されます。"}
        </span>
      </CardSurface>
    );
  }

  const normalizedQuery = normalizeSearchKeyword(query);
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const firstResultIndex = (safeCurrentPage - 1) * resultsPerPage;
  const hasStaleSchedules = isDateOlderThan(latestScheduleUpdate, staleScheduleDays);
  const pageCandidates = [1, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, totalPages]
    .filter((page) => page >= 1 && page <= totalPages)
    .filter((page, index, pages) => pages.indexOf(page) === index)
    .sort((left, right) => left - right);

  return (
    <section id="search-results" className={`page-anchor-section ${styles.section}`} aria-labelledby="results-heading">
      <div className={styles.listHeading}>
        <h2 id="results-heading">レッスン一覧</h2>
        <p>{firstResultIndex + 1}〜{Math.min(firstResultIndex + results.length, totalResults)}件を表示</p>
      </div>

      {hasStaleSchedules ? (
        <aside className={styles.notice} aria-label="掲載情報の更新状況">
          掲載スケジュールの最新確認日は{formatDate(latestScheduleUpdate)}です。変更されている可能性があるため、来館前に店舗の公式サイトをご確認ください。
        </aside>
      ) : null}

      <div className={styles.list}>
        {results.map((item) => {
          const updatedAt = getScheduleUpdatedAt(item.schedule);
          const areaName = getAreaName(item.location.prefecture, item.location.city);
          const isStale = isDateOlderThan(updatedAt, staleScheduleDays);

          return (
            <CardSurface key={item.schedule.id} className={styles.card}>
              <div className={styles.schedule}>
                <span>{formatWeekday(item.schedule.weekday)}</span>
                <strong>{formatTime(item.schedule.start_time)}</strong>
                <small>{formatTime(item.schedule.end_time)}まで</small>
              </div>

              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <div>
                    <p className={styles.brand}>{item.brand.name}</p>
                    <h3>{item.schedule.raw_program_name}</h3>
                  </div>
                  <FavoriteProgramButton id={item.program.id} slug={item.program.slug} name={item.program.name} compact />
                </div>
                {item.schedule.canonical_program_name && item.schedule.canonical_program_name !== item.schedule.raw_program_name ? (
                  <p className={styles.canonical}>正規名: {item.schedule.canonical_program_name}</p>
                ) : null}
                <p className={styles.location}>{item.location.name}</p>
                <p className={styles.address}>{getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line)}</p>

                <div className={styles.meta}>
                  <span>{item.schedule.duration_minutes ? `${item.schedule.duration_minutes}分` : "時間未掲載"}</span>
                  <FreshnessIndicator status={isStale ? "stale" : "neutral"} label={`確認 ${formatDate(updatedAt)}`} />
                </div>

                <div className={styles.actions}>
                  <Link className={styles.detailLink} href={`/locations/${item.location.slug}`}>店舗詳細を見る <span aria-hidden="true">→</span></Link>
                  <Link href={buildProgramPath(item.program.slug)}>{item.program.name}の一覧</Link>
                  {areaName ? <Link href={buildAreaProgramPath(areaName, item.program.slug)}>{areaName}の{item.program.name}</Link> : null}
                </div>

                {debugEnabled && normalizedQuery ? (
                  <div className="search-debug">
                    <p className="search-debug-title">debug query: {query}</p>
                    {getProgramQueryDebug(item, normalizedQuery).map((hit, index) => (
                      <div key={`${item.schedule.id}-${hit.field}-${hit.value}-${index}`} className="search-debug-row">
                        <p className="search-debug-item">matchedBy: {hit.field}</p>
                        <p className="search-debug-item">matchedValue: {hit.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardSurface>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <nav className={styles.pagination} aria-label="検索結果のページ">
          {safeCurrentPage > 1 ? <Link href={buildPageHref(searchParams, safeCurrentPage - 1)}>前へ</Link> : <span aria-disabled="true">前へ</span>}
          <div>
            {pageCandidates.map((page, index) => (
              <span key={page} className={styles.pageItem}>
                {index > 0 && page - pageCandidates[index - 1] > 1 ? <i>…</i> : null}
                {page === safeCurrentPage
                  ? <span aria-current="page" className={styles.current}>{page}</span>
                  : <Link href={buildPageHref(searchParams, page)}>{page}</Link>}
              </span>
            ))}
          </div>
          {safeCurrentPage < totalPages ? <Link href={buildPageHref(searchParams, safeCurrentPage + 1)}>次へ</Link> : <span aria-disabled="true">次へ</span>}
        </nav>
      ) : null}
    </section>
  );
}
