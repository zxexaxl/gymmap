import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand-mark">
          <span className="brand-symbol" aria-hidden="true">
            <svg viewBox="0 0 40 40" role="img">
              <path d="M20 3.5c-7.2 0-13 5.8-13 13 0 9.3 13 20 13 20s13-10.7 13-20c0-7.2-5.8-13-13-13Z" />
              <path d="M12.5 15.5h15M14.5 12.5v6M25.5 12.5v6" />
            </svg>
          </span>
          <span className="brand-wording">
            <strong>GymMap</strong>
            <small>スタジオレッスン検索</small>
          </span>
        </Link>
        <div className="header-navigation">
          <nav className="header-nav" aria-label="GymMapの主要ナビゲーション">
            <Link href="/">Lesson</Link>
            <Link className="header-domain-link" href="/training/hyrox">HYROX</Link>
          </nav>
          <details className="header-lesson-menu">
            <summary>Lesson メニュー</summary>
            <nav aria-label="Lessonのナビゲーション">
              <Link href="/#search-section">条件検索</Link>
              <Link href="/#popular-programs">ブランド</Link>
              <Link href="/#map-section">Lesson 地図</Link>
              <Link className="header-favorite-link" href="/favorites">
                <span aria-hidden="true">☆</span>
                <span>Lesson お気に入り</span>
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
