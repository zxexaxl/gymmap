import Link from "next/link";

export function UtilityFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <Link className="site-footer__brand" href="/">GymMap</Link>
        <nav aria-label="ユーティリティナビゲーション">
          <Link href="/updates">更新情報</Link>
        </nav>
      </div>
    </footer>
  );
}
