import Link from "next/link";

import { getProgramQueryDebug, normalizeSearchKeyword } from "@/lib/search-query";
import type { SearchResult } from "@/lib/types";
import { formatDate, formatWeekday, getLocationAddress } from "@/lib/utils";

type ResultsListProps = {
  results: SearchResult[];
  hasActiveFilters?: boolean;
  query?: string;
  debugEnabled?: boolean;
};

export function ResultsList({ results, hasActiveFilters = false, query = "", debugEnabled = false }: ResultsListProps) {
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

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>検索結果 {results.length}件</h2>
          <p className="muted">
            {hasActiveFilters ? "条件に合うクラスを開始時刻順で表示しています。" : "登録されているクラスを開始時刻順で表示しています。"}
          </p>
        </div>
      </div>
      <div className="result-list">
        {results.map((item) => (
          <article key={item.schedule.id} className="result-card">
            <div className="result-card-main">
              <p className="result-time">
                {formatWeekday(item.schedule.weekday)} {item.schedule.start_time} - {item.schedule.end_time}
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
                <dt>最終更新日</dt>
                <dd>{formatDate(item.location.last_verified_at ?? item.schedule.updated_at)}</dd>
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
    </section>
  );
}
