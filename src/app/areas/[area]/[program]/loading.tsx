export default function AreaProgramLoading() {
  return (
    <div className="page-stack">
      <section className="panel route-loading-panel" aria-live="polite" aria-busy="true">
        <span className="route-loading-spinner" aria-hidden="true" />
        <div>
          <p className="eyebrow">地域から探す</p>
          <h1>地域のレッスン情報を読み込んでいます…</h1>
        </div>
      </section>
    </div>
  );
}
