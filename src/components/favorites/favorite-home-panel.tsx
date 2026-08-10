"use client";

import Link from "next/link";

import { useFavoritePrograms } from "@/components/favorites/use-favorite-programs";
import { buildProgramPath } from "@/lib/site";

export function FavoriteHomePanel() {
  const favorites = useFavoritePrograms();

  if (!favorites.length) {
    return (
      <aside className="panel favorite-home-panel is-empty">
        <span className="favorite-empty-icon" aria-hidden="true">☆</span>
        <div>
          <h2>気になるレッスンを保存できます</h2>
          <p className="muted">ブランドプログラムの☆を押すと、今週の開催をまとめて確認できます。</p>
        </div>
      </aside>
    );
  }

  return (
    <section className="panel favorite-home-panel has-favorites">
      <div>
        <p className="eyebrow">MY PROGRAMS</p>
        <h2>お気に入りの今週をチェック</h2>
        <p className="muted">
          {favorites.length}件のお気に入りを保存中です。今週の開催をまとめて確認できます。
        </p>
      </div>
      <div className="favorite-home-programs" aria-label="お気に入りプログラム">
        {favorites.map((program) => (
          <Link key={program.id} href={buildProgramPath(program.slug)}>{program.name}</Link>
        ))}
      </div>
      <Link className="primary-link-button" href="/favorites">
        今週の開催を見る
      </Link>
    </section>
  );
}
