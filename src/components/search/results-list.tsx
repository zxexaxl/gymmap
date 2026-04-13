import Link from "next/link";

import type { SearchResult } from "@/lib/types";
import { formatDate, formatWeekday, getLocationAddress } from "@/lib/utils";

type ResultsListProps = {
  results: SearchResult[];
};

export function ResultsList({ results }: ResultsListProps) {
  if (!results.length) {
    return (
      <section className="panel">
        <h2>検索結果</h2>
        <p>条件に一致するクラスが見つかりませんでした。キーワードや時間帯を変えてみてください。</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>検索結果</h2>
        <p>{results.length} 件</p>
      </div>
      <div className="result-list">
        {results.map((item) => (
          <article key={item.schedule.id} className="result-card">
            <div className="result-card-main">
              <h3>{item.program.name}</h3>
              <p className="muted">
                {formatWeekday(item.schedule.weekday)} {item.schedule.start_time} - {item.schedule.end_time}
              </p>
              <p>
                {item.brand.name} / {item.location.name}
              </p>
              <p className="muted">
                {getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line)}
              </p>
            </div>
            <dl className="result-meta">
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
