import { filterLatestSchedulePeriods } from "@/lib/latest-schedule-period";
import { normalizeProgramName } from "@/lib/normalizeProgramName";
import { scoreProgramTextValues } from "@/lib/search-query";
import type { MapLessonSearchItem, MapLocationLessonIndex } from "@/lib/types";

export type MapLessonPurposeSourceRow = {
  location_id: string;
  raw_program_name: string;
  valid_from: string | null;
};

/**
 * Build the compact, Map-only Lesson program index directly from schedule rows.
 * Input order is significant: callers order by schedule id so the current Map
 * preview keeps its first-occurrence authority.
 */
export function buildMapLessonPurposeIndex(rows: MapLessonPurposeSourceRow[]): MapLocationLessonIndex[] {
  const locationsById = new Map<
    string,
    { entry: MapLocationLessonIndex; lessonsByRawName: Map<string, MapLessonSearchItem> }
  >();
  const normalizationByRawName = new Map<
    string,
    { canonicalProgramName: string | null; programBrand: string | null }
  >();

  for (const row of filterLatestSchedulePeriods(rows)) {
    let location = locationsById.get(row.location_id);
    if (!location) {
      location = {
        entry: { locationId: row.location_id, lessons: [] },
        lessonsByRawName: new Map(),
      };
      locationsById.set(row.location_id, location);
    }

    const existing = location.lessonsByRawName.get(row.raw_program_name);
    if (existing) {
      existing[3] += 1;
      continue;
    }

    let normalized = normalizationByRawName.get(row.raw_program_name);
    if (!normalized) {
      const result = normalizeProgramName({ rawProgramName: row.raw_program_name });
      normalized = {
        canonicalProgramName: result.canonical_program_name,
        programBrand: result.program_brand,
      };
      normalizationByRawName.set(row.raw_program_name, normalized);
    }

    const lesson: MapLessonSearchItem = [
      row.raw_program_name,
      normalized.canonicalProgramName,
      normalized.programBrand,
      1,
    ];
    location.entry.lessons.push(lesson);
    location.lessonsByRawName.set(row.raw_program_name, lesson);
  }

  return Array.from(locationsById.values(), ({ entry }) => entry);
}

export function getMapLessonQueryMatches(index: MapLocationLessonIndex[], normalizedQuery: string) {
  const matchesByLocationId = new Map<string, MapLessonSearchItem[]>();
  let matchedLessonCount = 0;

  for (const locationEntry of index) {
    const matches = normalizedQuery
      ? locationEntry.lessons.filter(
          (lesson) => scoreProgramTextValues(lesson[0], lesson[1], lesson[2], normalizedQuery) > 0,
        )
      : locationEntry.lessons;

    if (matches.length) {
      matchesByLocationId.set(locationEntry.locationId, matches);
      matchedLessonCount += matches.reduce((count, lesson) => count + lesson[3], 0);
    }
  }

  return { matchesByLocationId, matchedLessonCount };
}

export function formatMapLessonMatchPreview(matches: MapLessonSearchItem[]) {
  const uniqueNames = Array.from(new Set(matches.map((item) => item[0])));
  const preview = uniqueNames.slice(0, 3);
  const restCount = uniqueNames.length - preview.length;

  return restCount > 0 ? `${preview.join(", ")} 他${restCount}件` : preview.join(", ");
}
