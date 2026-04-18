import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand-mark">
          ジム・フィットネスクラブのレッスン検索
        </Link>
        <nav className="header-nav">
          <Link href="/search">レッスンを探す</Link>
        </nav>
      </div>
    </header>
  );
}
