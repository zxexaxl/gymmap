"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  favoriteProgramsChangedEvent,
  parseFavoritePrograms,
  readFavoriteProgramsSnapshot,
} from "@/lib/favorite-programs";

function subscribeToFavoritePrograms(callback: () => void) {
  window.addEventListener(favoriteProgramsChangedEvent, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(favoriteProgramsChangedEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useFavoritePrograms() {
  const snapshot = useSyncExternalStore(subscribeToFavoritePrograms, readFavoriteProgramsSnapshot, () => "[]");
  return useMemo(() => parseFavoritePrograms(snapshot), [snapshot]);
}
