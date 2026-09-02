import { performance } from "node:perf_hooks";

import { createClient } from "@supabase/supabase-js";

import { filterLatestSchedulePeriods } from "../src/lib/latest-schedule-period";
import {
  buildMapLessonPurposeIndex,
  formatMapLessonMatchPreview,
  getMapLessonQueryMatches,
  type MapLessonPurposeSourceRow,
} from "../src/lib/map-lesson-purpose-index";
import { normalizeProgramName } from "../src/lib/normalizeProgramName";
import { normalizeSearchKeyword, scoreProgramTextQueryMatch } from "../src/lib/search-query";

type OldRow = MapLessonPurposeSourceRow & {
  id: string;
  weekday: string;
  start_time: string;
  end_time: string;
  duration_minutes: number | null;
  extracted_at: string | null;
  updated_at: string;
  gym_locations: { name: string } | Array<{ name: string }>;
};

type OldCachedLesson = {
  i: string;
  r: string;
  c: string | null;
  b: string | null;
  w: string;
  s: string;
  d: number | null;
  u: string | null;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error("Supabase environment is required");

const supabase = createClient(url, key);

async function fetchPages<T>(select: string) {
  const rows: T[] = [];
  let responseBytes = 0;
  let queries = 0;
  const started = performance.now();

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("class_schedules")
      .select(select)
      .eq("gym_locations.is_active", true)
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    const batch = (data as T[]) ?? [];
    queries += 1;
    responseBytes += Buffer.byteLength(JSON.stringify(batch));
    rows.push(...batch);
    if (batch.length < 1000) break;
  }

  return { rows, queries, responseBytes, fetchMs: performance.now() - started };
}

async function main() {
const oldSource = await fetchPages<OldRow>(
  "id, location_id, raw_program_name, weekday, start_time, end_time, duration_minutes, valid_from, extracted_at, updated_at, gym_locations!inner(name, lesson_location_memberships!inner(location_id))",
);
const oldAggregationStarted = performance.now();
const oldLocations = new Map<string, { l: string; n: string; x: OldCachedLesson[] }>();
for (const row of filterLatestSchedulePeriods(oldSource.rows)) {
  const locationName = Array.isArray(row.gym_locations) ? row.gym_locations[0]?.name : row.gym_locations.name;
  if (!locationName) continue;
  const normalized = normalizeProgramName({
    rawProgramName: row.raw_program_name,
    startTime: row.start_time,
    endTime: row.end_time,
  });
  const entry = oldLocations.get(row.location_id) ?? { l: row.location_id, n: locationName, x: [] };
  entry.x.push({
    i: row.id,
    r: row.raw_program_name,
    c: normalized.canonical_program_name,
    b: normalized.program_brand,
    w: row.weekday,
    s: row.start_time,
    d: normalized.duration_minutes ?? row.duration_minutes,
    u: row.extracted_at || row.updated_at || null,
  });
  oldLocations.set(row.location_id, entry);
}
const oldIndex = Array.from(oldLocations.values());
const oldAggregationMs = performance.now() - oldAggregationStarted;
const oldSerializationStarted = performance.now();
const oldSerialized = JSON.stringify(oldIndex);
const oldSerializationMs = performance.now() - oldSerializationStarted;
const oldMapDto = oldIndex.map((location) => ({
  locationId: location.l,
  lessons: location.x.map((item) => ({
    rawProgramName: item.r,
    canonicalProgramName: item.c,
    programBrand: item.b,
  })),
}));

const purposeSource = await fetchPages<MapLessonPurposeSourceRow>(
  "location_id, raw_program_name, valid_from, gym_locations!inner(lesson_location_memberships!inner())",
);
const purposeAggregationStarted = performance.now();
const purposeIndex = buildMapLessonPurposeIndex(purposeSource.rows);
const purposeAggregationMs = performance.now() - purposeAggregationStarted;
const purposeSerializationStarted = performance.now();
const purposeSerialized = JSON.stringify(purposeIndex);
const purposeSerializationMs = performance.now() - purposeSerializationStarted;

const equivalence = [
  "",
  "ヨガ",
  "BODYCOMBAT",
  "ボディコンバット",
  "Les Mills",
  "レズミルズ",
  "body",
  "combat",
].map((query) => {
  const normalizedQuery = normalizeSearchKeyword(query);
  const oldMatches = oldMapDto.flatMap((location) => {
    const matches = normalizedQuery
      ? location.lessons.filter((lesson) => scoreProgramTextQueryMatch(lesson, normalizedQuery) > 0)
      : location.lessons;
    return matches.length ? [{ locationId: location.locationId, count: matches.length }] : [];
  });
  const { matchesByLocationId, matchedLessonCount } = getMapLessonQueryMatches(purposeIndex, normalizedQuery);
  const purposeMatches = Array.from(matchesByLocationId, ([locationId, matches]) => ({
    locationId,
    count: matches.reduce((count, lesson) => count + lesson[3], 0),
    preview: formatMapLessonMatchPreview(matches),
  }));
  const oldComparable = oldMatches.map((match) => ({
    ...match,
    preview: formatMapLessonMatchPreview(
      (oldMapDto.find((location) => location.locationId === match.locationId)?.lessons ?? [])
        .filter((lesson) => !normalizedQuery || scoreProgramTextQueryMatch(lesson, normalizedQuery) > 0)
        .map((lesson) => [
          lesson.rawProgramName,
          lesson.canonicalProgramName,
          lesson.programBrand,
          1,
        ]),
    ),
  }));
  if (JSON.stringify(oldComparable) !== JSON.stringify(purposeMatches)) {
    throw new Error(`Map semantic mismatch for query: ${query || "<blank>"}`);
  }

  return {
    query: query || "<blank>",
    locations: purposeMatches.length,
    schedules: matchedLessonCount,
    status: "PASS",
  };
});

console.log(JSON.stringify({
  old: {
    sourceRows: oldSource.rows.length,
    latestRows: oldIndex.reduce((count, location) => count + location.x.length, 0),
    locations: oldIndex.length,
    queries: oldSource.queries,
    sourceBytes: oldSource.responseBytes,
    fetchMs: Number(oldSource.fetchMs.toFixed(1)),
    aggregationMs: Number(oldAggregationMs.toFixed(1)),
    serializationMs: Number(oldSerializationMs.toFixed(1)),
    indexBytes: Buffer.byteLength(oldSerialized),
    mapDtoBytes: Buffer.byteLength(JSON.stringify(oldMapDto)),
  },
  purpose: {
    sourceRows: purposeSource.rows.length,
    aggregateItems: purposeIndex.reduce((count, location) => count + location.lessons.length, 0),
    scheduleCount: purposeIndex.reduce(
      (count, location) => count + location.lessons.reduce((sum, lesson) => sum + lesson[3], 0),
      0,
    ),
    locations: purposeIndex.length,
    queries: purposeSource.queries,
    sourceBytes: purposeSource.responseBytes,
    fetchMs: Number(purposeSource.fetchMs.toFixed(1)),
    aggregationMs: Number(purposeAggregationMs.toFixed(1)),
    serializationMs: Number(purposeSerializationMs.toFixed(1)),
    indexBytes: Buffer.byteLength(purposeSerialized),
    mapDtoBytes: Buffer.byteLength(purposeSerialized),
  },
  equivalence,
}, null, 2));
}

void main();
