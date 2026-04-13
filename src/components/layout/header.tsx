import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand-mark">
          GymMap MVP
        </Link>
        <nav className="header-nav">
          <Link href="/search">クラスを探す</Link>
        </nav>
      </div>
    </header>
  );
}
