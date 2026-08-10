"use client";

import { maximumFavoritePrograms, toggleFavoriteProgram, type FavoriteProgram } from "@/lib/favorite-programs";
import { useFavoritePrograms } from "@/components/favorites/use-favorite-programs";

type FavoriteProgramButtonProps = FavoriteProgram & {
  compact?: boolean;
  iconOnly?: boolean;
};

export function FavoriteProgramButton({ id, slug, name, compact = false, iconOnly = false }: FavoriteProgramButtonProps) {
  const favorites = useFavoritePrograms();
  const isFavorite = favorites.some((program) => program.id === id);
  const hasReachedLimit = !isFavorite && favorites.length >= maximumFavoritePrograms;

  return (
    <button
      className={`favorite-program-button ${compact ? "is-compact" : ""} ${iconOnly ? "is-icon-only" : ""} ${isFavorite ? "is-active" : ""}`}
      type="button"
      aria-pressed={isFavorite}
      aria-label={`${name}を${isFavorite ? "お気に入りから外す" : "お気に入りに追加"}`}
      disabled={hasReachedLimit}
      title={hasReachedLimit ? `お気に入りは${maximumFavoritePrograms}件まで登録できます` : undefined}
      onClick={() => toggleFavoriteProgram({ id, slug, name })}
    >
      <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
      {iconOnly ? null : (
        <span>{compact ? (isFavorite ? "保存済み" : "保存") : isFavorite ? "お気に入りに保存済み" : "お気に入りに追加"}</span>
      )}
    </button>
  );
}
