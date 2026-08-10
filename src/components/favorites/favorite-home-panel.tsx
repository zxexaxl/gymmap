"use client";

import Link from "next/link";

import { useFavoritePrograms } from "@/components/favorites/use-favorite-programs";
import { buildProgramPath } from "@/lib/site";

export function FavoriteHomePanel() {
  const favorites = useFavoritePrograms();

  return (
    <section className={`panel favorite-home-panel ${favorites.length ? "has-favorites" : ""}`}>
      <div>
        <p className="eyebrow">MY PROGRAMS</p>
        <h2>{favorites.length ? "お気に入りの今週をチェック" : "好きなレッスンを、すぐ確認"}</h2>
        <p className="muted">
          {favorites.length
            ? `${favorites.length}件のお気に入りを保存中です。今週の開催をまとめて確認できます。`
            : "プログラムページの☆を押すと、複数店舗の今週の開催をここから確認できます。"}
        </p>
      </div>
      {favorites.length ? (
        <div className="favorite-home-programs" aria-label="お気に入りプログラム">
          {favorites.map((program) => (
            <Link key={program.id} href={buildProgramPath(program.slug)}>{program.name}</Link>
          ))}
        </div>
      ) : null}
      <Link className="primary-link-button" href={favorites.length ? "/favorites" : "/#popular-programs"}>
        {favorites.length ? "今週の開催を見る" : "レッスンを選ぶ"}
      </Link>
    </section>
  );
}
