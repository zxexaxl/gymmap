export default function SearchLoading() {
  return (
    <div className="page-stack" aria-live="polite" aria-busy="true">
      <section className="panel search-loading-summary">
        <p className="eyebrow">検索中</p>
        <h1>条件に合うレッスンを探しています…</h1>
        <p className="muted">店舗と最新スケジュールを確認しています。</p>
      </section>
      <section className="panel search-loading-results" aria-label="検索結果を読み込み中">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="search-loading-card">
            <span className="search-loading-line is-short" />
            <span className="search-loading-line is-title" />
            <span className="search-loading-line" />
          </div>
        ))}
      </section>
    </div>
  );
}
