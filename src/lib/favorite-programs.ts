export type FavoriteProgram = {
  id: string;
  slug: string;
  name: string;
};

export type FavoriteScheduleItem = {
  scheduleId: string;
  weekday: string;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  rawProgramName: string;
  program: FavoriteProgram;
  location: {
    name: string;
    slug: string;
    prefecture: string | null;
    city: string | null;
  };
  brandName: string;
};

export type FavoriteScheduleResponse = {
  items: FavoriteScheduleItem[];
  totalResults: number;
  latestScheduleUpdate: string | null;
};

export const favoriteProgramsStorageKey = "gymmap:favorite-programs:v1";
export const favoriteProgramsChangedEvent = "gymmap:favorite-programs-changed";
export const maximumFavoritePrograms = 8;

export function parseFavoritePrograms(value: string | null): FavoriteProgram[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is FavoriteProgram =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as FavoriteProgram).id === "string" &&
          typeof (item as FavoriteProgram).slug === "string" &&
          typeof (item as FavoriteProgram).name === "string",
      )
      .slice(0, maximumFavoritePrograms);
  } catch {
    return [];
  }
}

export function readFavoriteProgramsSnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  try {
    return window.localStorage.getItem(favoriteProgramsStorageKey) ?? "[]";
  } catch {
    return "[]";
  }
}

export function writeFavoritePrograms(programs: FavoriteProgram[]) {
  const nextPrograms = programs.slice(0, maximumFavoritePrograms);

  try {
    window.localStorage.setItem(favoriteProgramsStorageKey, JSON.stringify(nextPrograms));
    window.dispatchEvent(new Event(favoriteProgramsChangedEvent));
  } catch {
    // Storage can be unavailable in strict privacy modes. Keep the UI usable.
  }
}

export function toggleFavoriteProgram(program: FavoriteProgram) {
  const favorites = parseFavoritePrograms(readFavoriteProgramsSnapshot());
  const isFavorite = favorites.some((item) => item.id === program.id);

  if (isFavorite) {
    writeFavoritePrograms(favorites.filter((item) => item.id !== program.id));
    return false;
  }

  writeFavoritePrograms([...favorites, program]);
  return true;
}
