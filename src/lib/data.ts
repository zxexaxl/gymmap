import { cache } from "react";
import { unstable_cache } from "next/cache";

import { programMaster } from "@/lib/program-master";
import { supplementalLandingProgramNames } from "@/lib/featured-programs";
import { normalizeProgramName } from "@/lib/normalizeProgramName";
import {
  expandProgramSearchKeyword,
  normalizeSearchKeyword,
  scoreProgramQueryMatch,
  scoreProgramTextQueryMatch,
} from "@/lib/search-query";
import { enrichScheduleWithNormalization, enrichSchedulesWithNormalization } from "@/lib/schedule-normalization";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabase";
import { filterLatestSchedulePeriods, getLatestSchedulePeriodByLocation } from "@/lib/latest-schedule-period";
import type {
  AdminDataset,
  AreaProgramLandingPage,
  ClassSchedule,
  GymBrand,
  GymLocation,
  LocationDetail,
  MapLocationLessonIndex,
  Program,
  ProgramLandingPage,
  SearchFilters,
  SearchResult,
  SearchResultPage,
  FavoriteScheduleWeek,
  SourcePage,
  IngestionItem,
  IngestionRun,
} from "@/lib/types";
import { getAreaName, getLocationAddress, isDurationInRange, isTimeInRange } from "@/lib/utils";

type SupabaseJoinedSchedule = ClassSchedule & {
  gym_locations: GymLocation & {
    gym_brands: GymBrand;
  };
  programs: Program;
};

const emptyAdminDataset = (): AdminDataset => ({
  gym_brands: [],
  gym_locations: [],
  programs: [],
  class_schedules: [],
  source_pages: [],
  ingestion_runs: [],
  ingestion_items: [],
});

const weekdaySortOrder: Record<ClassSchedule["weekday"], number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

const trackedSearchMarkers = ["oimachi", "大井町", "bodypump", "bodycombat"];
const staticProgramLandingPageLimit = 48;
const sharedDataRevalidateSeconds = 60 * 60;
const seoProgramNameSet = new Set([
  ...programMaster.map((entry) => entry.canonicalProgramName),
  ...supplementalLandingProgramNames,
]);
const emptySearchFilters: SearchFilters = {
  q: "",
  weekday: "",
  timeRange: "",
  durationRange: "",
  brand: "",
  area: "",
};
function isTrackedSearch(filters: SearchFilters) {
  const value = [filters.q, filters.area, filters.brand].join(" ").toLowerCase();
  return trackedSearchMarkers.some((marker) => value.includes(marker.toLowerCase()));
}

function isTrackedOimachiRecord(item: SearchResult) {
  if (item.location.slug !== "jexer-oimachi" || item.schedule.weekday !== "friday") {
    return false;
  }

  const canonical = item.schedule.canonical_program_name ?? "";
  const raw = item.schedule.raw_program_name;

  return (
    (item.schedule.start_time.startsWith("19:40") && (canonical === "BODYPUMP" || raw.includes("BODYPUMP"))) ||
    (item.schedule.start_time.startsWith("20:50") && (canonical === "BODYCOMBAT" || raw.includes("BODYCOMBAT")))
  );
}

function logTrackedSearchStage(label: string, filters: SearchFilters, results: SearchResult[]) {
  if (!isTrackedSearch(filters)) {
    return;
  }

  console.log(
    "[search-trace]",
    JSON.stringify(
      {
        stage: label,
        filters,
        resultCount: results.length,
        trackedRecords: results.filter(isTrackedOimachiRecord).map((item) => ({
          schedule_id: item.schedule.id,
          location_slug: item.location.slug,
          location_name: item.location.name,
          weekday: item.schedule.weekday,
          start_time: item.schedule.start_time,
          end_time: item.schedule.end_time,
          raw_program_name: item.schedule.raw_program_name,
          canonical_program_name: item.schedule.canonical_program_name ?? null,
        })),
      },
      null,
      2,
    ),
  );
}

function mapJoinedSchedule(row: SupabaseJoinedSchedule): SearchResult {
  const normalizedSchedule = enrichScheduleWithNormalization({
    ...row,
    location: undefined,
    program: undefined,
  });

  return {
    schedule: normalizedSchedule,
    location: {
      ...row.gym_locations,
      brand: row.gym_locations.gym_brands,
    },
    brand: row.gym_locations.gym_brands,
    program: row.programs,
  };
}

function filterResults(results: SearchResult[], filters: SearchFilters) {
  const keyword = normalizeSearchKeyword(filters.q);
  const brandKeyword = filters.brand.toLowerCase();
  const areaKeyword = filters.area.toLowerCase();
  logTrackedSearchStage("before_filter", filters, results);

  const filtered = results
    .map((item) => {
      if (filters.weekday && item.schedule.weekday !== filters.weekday) {
        return null;
      }

      if (!isTimeInRange(item.schedule.start_time, filters.timeRange)) {
        return null;
      }

      if (!isDurationInRange(item.schedule.duration_minutes, filters.durationRange)) {
        return null;
      }

      let score = 0;

      if (keyword) {
        score = scoreKeywordMatch(item, keyword);

        if (score <= 0) {
          return null;
        }
      }

      if (brandKeyword && !item.brand.name.toLowerCase().includes(brandKeyword)) {
        return null;
      }

      if (areaKeyword) {
        const locationText = [
          item.location.name,
          item.location.slug,
          item.location.prefecture,
          item.location.city,
          item.location.address_line,
          getLocationAddress(item.location.prefecture, item.location.city, item.location.address_line),
        ]
          .join(" ")
          .toLowerCase();

        if (!locationText.includes(areaKeyword)) {
          return null;
        }
      }

      return { item, score };
    })
    .filter((value): value is { item: SearchResult; score: number } => Boolean(value))
    .sort((left, right) => {
      const weekdayDiff =
        weekdaySortOrder[left.item.schedule.weekday] - weekdaySortOrder[right.item.schedule.weekday];

      if (weekdayDiff !== 0) {
        return weekdayDiff;
      }

      const startTimeDiff = left.item.schedule.start_time.localeCompare(right.item.schedule.start_time);

      if (startTimeDiff !== 0) {
        return startTimeDiff;
      }

      const leftDuration = left.item.schedule.duration_minutes ?? Number.MAX_SAFE_INTEGER;
      const rightDuration = right.item.schedule.duration_minutes ?? Number.MAX_SAFE_INTEGER;

      if (leftDuration !== rightDuration) {
        return leftDuration - rightDuration;
      }

      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.item.location.name.localeCompare(right.item.location.name);
    })
    .map((entry) => entry.item);

  logTrackedSearchStage("after_filter", filters, filtered);

  return filtered;
}

function scoreKeywordMatch(item: SearchResult, query: string) {
  return scoreProgramQueryMatch(item, query);
}

function normalizeLandingSlug(slug: string) {
  return decodeURIComponent(slug).trim().toLocaleLowerCase("en-US");
}

function getTimeBounds(timeRange: string) {
  if (timeRange === "morning") {
    return { from: "06:00:00", to: "12:00:00" };
  }

  if (timeRange === "afternoon") {
    return { from: "12:00:00", to: "17:00:00" };
  }

  if (timeRange === "evening") {
    return { from: "17:00:00", to: "23:00:00" };
  }

  return null;
}

async function getLocationIdsForFilters(filters?: SearchFilters) {
  if (!filters?.brand && !filters?.area) {
    return null;
  }

  const brandKeyword = filters.brand.toLowerCase();
  const areaKeyword = filters.area.toLowerCase();
  const locations = await getLocations();

  return locations
    .filter((location) => !brandKeyword || location.brand?.name.toLowerCase().includes(brandKeyword))
    .filter((location) => {
      if (!areaKeyword) {
        return true;
      }

      return [
        location.name,
        location.slug,
        location.prefecture,
        location.city,
        location.address_line,
        getLocationAddress(location.prefecture, location.city, location.address_line),
      ]
        .join(" ")
        .toLowerCase()
        .includes(areaKeyword);
    })
    .map((location) => location.id);
}

type CachedLessonSearchItem = {
  i: string;
  r: string;
  c: string | null;
  b: string | null;
  w: ClassSchedule["weekday"];
  s: string;
  d: number | null;
  u: string | null;
};

type CachedLocationLessonIndex = {
  l: string;
  n: string;
  x: CachedLessonSearchItem[];
};

type ScheduleQueryVariant =
  | { kind: "all" }
  | { kind: "ids"; values: string[] }
  | { kind: "programId"; value: string };

async function fetchLatestSchedulePeriodEntries() {
  const supabase = getSupabaseClient();
  const pageSize = 1000;
  const rows: Array<{ location_id: string; valid_from: string | null }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("class_schedules")
      .select("location_id, valid_from")
      .not("valid_from", "is", null)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return Array.from(getLatestSchedulePeriodByLocation(rows).entries());
}

const getLatestSchedulePeriodEntriesFromDataCache = unstable_cache(
  fetchLatestSchedulePeriodEntries,
  ["latest-schedule-period-by-location-v1"],
  { revalidate: sharedDataRevalidateSeconds, tags: ["class-schedules"] },
);

async function getScheduleQueryVariants(filters?: SearchFilters): Promise<ScheduleQueryVariant[]> {
  const query = normalizeSearchKeyword(filters?.q ?? "");

  if (!query) {
    return [{ kind: "all" }];
  }

  const index = await getLessonSearchIndexFromDataCache();
  const matchingIds = index.flatMap((locationEntry) =>
    locationEntry.x
      .filter(
        (lesson) =>
          scoreProgramTextQueryMatch(
            { rawProgramName: lesson.r, canonicalProgramName: lesson.c, programBrand: lesson.b },
            query,
          ) > 0,
      )
      .map((lesson) => lesson.i),
  );
  const chunkSize = 100;
  const variants: ScheduleQueryVariant[] = [];

  for (let from = 0; from < matchingIds.length; from += chunkSize) {
    variants.push({ kind: "ids", values: matchingIds.slice(from, from + chunkSize) });
  }

  return variants;
}

async function fetchJoinedSchedulesForVariant(
  filters: SearchFilters | undefined,
  locationIds: string[] | null,
  variant: ScheduleQueryVariant,
) {
  const supabase = getSupabaseClient();
  const pageSize = 1000;
  const rows: SupabaseJoinedSchedule[] = [];
  const timeBounds = getTimeBounds(filters?.timeRange ?? "");
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    let query = supabase
      .from("class_schedules")
      .select(
        `
          *,
          gym_locations (
            *,
            gym_brands (*)
          ),
          programs (*)
        `,
      );

    if (filters?.weekday) {
      query = query.eq("weekday", filters.weekday);
    }

    if (timeBounds) {
      query = query.gte("start_time", timeBounds.from).lt("start_time", timeBounds.to);
    }

    if (filters?.durationRange === "short") {
      query = query.lte("duration_minutes", 45);
    } else if (filters?.durationRange === "medium") {
      query = query.gte("duration_minutes", 46).lte("duration_minutes", 59);
    } else if (filters?.durationRange === "long") {
      query = query.gte("duration_minutes", 60);
    }

    if (locationIds) {
      query = query.in("location_id", locationIds);
    }

    if (variant.kind === "ids") {
      query = query.in("id", variant.values);
    } else if (variant.kind === "programId") {
      query = query.eq("program_id", variant.value);
    }

    const { data, error } = await query.order("start_time", { ascending: true }).range(from, to);

    if (error) {
      throw error;
    }

    const batch = (data as SupabaseJoinedSchedule[]) ?? [];
    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  const latestPeriods = new Map(await getLatestSchedulePeriodEntriesFromDataCache());
  return filterLatestSchedulePeriods(rows, latestPeriods);
}

async function fetchAllJoinedSchedules(filters?: SearchFilters) {
  const locationIds = await getLocationIdsForFilters(filters);

  if (locationIds?.length === 0) {
    return [];
  }

  const variants = await getScheduleQueryVariants(filters);

  if (!variants.length) {
    return [];
  }

  const batches = await Promise.all(
    variants.map((variant) => fetchJoinedSchedulesForVariant(filters, locationIds, variant)),
  );
  const rowsById = new Map<string, SupabaseJoinedSchedule>();

  batches.flat().forEach((row) => rowsById.set(row.id, row));
  return Array.from(rowsById.values());
}

export async function getSearchResults(filters: SearchFilters): Promise<SearchResult[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  if (isTrackedSearch(filters)) {
    console.log(
      "[search-trace]",
      JSON.stringify(
        {
          stage: "request",
          filters,
          dbQuery: {
            table: "class_schedules",
            orderBy: "start_time asc",
            limit: null,
            dedupe: false,
          },
        },
        null,
        2,
      ),
    );
  }

  let data: SupabaseJoinedSchedule[];

  try {
    data = await fetchAllJoinedSchedules(filters);
  } catch (error) {
    console.error("Failed to load schedules from Supabase:", error instanceof Error ? error.message : String(error));
    return [];
  }

  const mappedResults = data.map(mapJoinedSchedule);
  logTrackedSearchStage("db_response", filters, mappedResults);

  return filterResults(mappedResults, filters);
}

async function getSearchResultPageLegacy(
  filters: SearchFilters,
  requestedPage = 1,
  pageSize = 20,
): Promise<SearchResultPage> {
  if (!hasSupabaseEnv()) {
    return { results: [], totalResults: 0, currentPage: 1, pageSize, latestScheduleUpdate: null };
  }

  try {
    const query = normalizeSearchKeyword(filters.q);
    const locationIds = await getLocationIdsForFilters(filters);
    const locationIdSet = locationIds ? new Set(locationIds) : null;
    const index = await getLessonSearchIndexFromDataCache();
    const matches = index
      .flatMap((locationEntry) =>
        locationEntry.x.map((lesson) => ({ lesson, locationId: locationEntry.l, locationName: locationEntry.n })),
      )
      .filter((item) => !locationIdSet || locationIdSet.has(item.locationId))
      .filter((item) => !filters.weekday || item.lesson.w === filters.weekday)
      .filter((item) => isTimeInRange(item.lesson.s, filters.timeRange))
      .filter((item) => isDurationInRange(item.lesson.d, filters.durationRange))
      .map((item) => ({
        ...item,
        score: query
          ? scoreProgramTextQueryMatch(
              {
                rawProgramName: item.lesson.r,
                canonicalProgramName: item.lesson.c,
                programBrand: item.lesson.b,
              },
              query,
            )
          : 0,
      }))
      .filter(({ score }) => !query || score > 0)
      .sort((left, right) => {
        const weekdayDiff = weekdaySortOrder[left.lesson.w] - weekdaySortOrder[right.lesson.w];

        if (weekdayDiff !== 0) {
          return weekdayDiff;
        }

        const startTimeDiff = left.lesson.s.localeCompare(right.lesson.s);

        if (startTimeDiff !== 0) {
          return startTimeDiff;
        }

        const leftDuration = left.lesson.d ?? Number.MAX_SAFE_INTEGER;
        const rightDuration = right.lesson.d ?? Number.MAX_SAFE_INTEGER;

        if (leftDuration !== rightDuration) {
          return leftDuration - rightDuration;
        }

        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.locationName.localeCompare(right.locationName);
      });
    const totalResults = matches.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
    const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
    const firstResultIndex = (currentPage - 1) * pageSize;
    const visibleMatches = matches.slice(firstResultIndex, firstResultIndex + pageSize);
    const latestScheduleUpdate = matches
      .map(({ lesson }) => lesson.u)
      .filter((value): value is string => Boolean(value))
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;
    const rows = visibleMatches.length
      ? await fetchJoinedSchedulesForVariant(undefined, null, {
          kind: "ids",
          values: visibleMatches.map(({ lesson }) => lesson.i),
        })
      : [];
    const results = filterResults(rows.map(mapJoinedSchedule), filters);

    return { results, totalResults, currentPage, pageSize, latestScheduleUpdate };
  } catch (error) {
    console.error(
      "Failed to load paginated search results from Supabase:",
      error instanceof Error ? error.message : String(error),
    );
    return { results: [], totalResults: 0, currentPage: 1, pageSize, latestScheduleUpdate: null };
  }
}

type SearchSchedulePageRpcRow = {
  schedule_id: string | null;
  result_order: number | string;
  total_count: number | string;
  latest_schedule_update: string | null;
};

async function fetchSearchSchedulePageRpc(
  filters: SearchFilters,
  requestedPage: number,
  pageSize: number,
) {
  const supabase = getSupabaseClient();
  const query = normalizeSearchKeyword(filters.q);
  const queryCompact = query.replace(/\s+/g, "");
  const expansions = expandProgramSearchKeyword(filters.q);
  const offset = (Math.max(requestedPage, 1) - 1) * pageSize;
  const { data, error } = await supabase.rpc("search_class_schedule_page", {
    p_query: query,
    p_query_compact: queryCompact,
    p_canonical_names: expansions.canonicalNames,
    p_program_brands: expansions.programBrands,
    p_weekday: filters.weekday,
    p_time_range: filters.timeRange,
    p_duration_range: filters.durationRange,
    p_brand: filters.brand,
    p_area: filters.area,
    p_offset: offset,
    p_limit: pageSize,
  });

  if (error) {
    throw error;
  }

  const rpcRows = (data as SearchSchedulePageRpcRow[] | null) ?? [];
  const metadata = rpcRows[0] ?? null;

  return {
    scheduleIds: rpcRows.flatMap((row) => (row.schedule_id ? [row.schedule_id] : [])),
    totalResults: metadata ? Number(metadata.total_count) : 0,
    latestScheduleUpdate: metadata?.latest_schedule_update ?? null,
  };
}

async function fetchJoinedSchedulesByIds(scheduleIds: string[]) {
  if (!scheduleIds.length) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("class_schedules")
    .select(
      `
        *,
        gym_locations (
          *,
          gym_brands (*)
        ),
        programs (*)
      `,
    )
    .in("id", scheduleIds);

  if (error) {
    throw error;
  }

  const rows = (data as SupabaseJoinedSchedule[] | null) ?? [];
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  return scheduleIds.flatMap((id) => {
    const row = rowsById.get(id);
    return row ? [row] : [];
  });
}

type FavoriteScheduleWeekRpcRow = {
  schedule_id: string | null;
  result_order: number | string;
  total_count: number | string;
  latest_schedule_update: string | null;
};

export async function getFavoriteScheduleWeek(
  programIds: string[],
  area = "",
  startWeekday = 0,
  limit = 120,
): Promise<FavoriteScheduleWeek> {
  if (!hasSupabaseEnv() || !programIds.length) {
    return { results: [], totalResults: 0, latestScheduleUpdate: null };
  }

  const uniqueProgramIds = Array.from(new Set(programIds)).slice(0, 8);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("favorite_class_schedule_week", {
    p_program_ids: uniqueProgramIds,
    p_area: area.trim().slice(0, 80),
    p_start_weekday: Math.min(Math.max(Math.trunc(startWeekday), 0), 6),
    p_limit: Math.min(Math.max(Math.trunc(limit), 1), 200),
  });

  if (error) {
    throw error;
  }

  const rpcRows = (data as FavoriteScheduleWeekRpcRow[] | null) ?? [];
  const metadata = rpcRows[0] ?? null;
  const scheduleIds = rpcRows.flatMap((row) => (row.schedule_id ? [row.schedule_id] : []));
  const rows = await fetchJoinedSchedulesByIds(scheduleIds);

  return {
    results: rows.map(mapJoinedSchedule),
    totalResults: metadata ? Number(metadata.total_count) : 0,
    latestScheduleUpdate: metadata?.latest_schedule_update ?? null,
  };
}

export async function getSearchResultPage(
  filters: SearchFilters,
  requestedPage = 1,
  pageSize = 20,
): Promise<SearchResultPage> {
  if (!hasSupabaseEnv()) {
    return { results: [], totalResults: 0, currentPage: 1, pageSize, latestScheduleUpdate: null };
  }

  try {
    let page = await fetchSearchSchedulePageRpc(filters, requestedPage, pageSize);
    const totalPages = Math.max(1, Math.ceil(page.totalResults / pageSize));
    const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);

    if (currentPage !== requestedPage) {
      page = await fetchSearchSchedulePageRpc(filters, currentPage, pageSize);
    }

    const rows = await fetchJoinedSchedulesByIds(page.scheduleIds);
    const results = filterResults(rows.map(mapJoinedSchedule), filters);

    return {
      results,
      totalResults: page.totalResults,
      currentPage,
      pageSize,
      latestScheduleUpdate: page.latestScheduleUpdate,
    };
  } catch (error) {
    console.error(
      "Failed to use database-backed paginated search; falling back to the legacy search:",
      error instanceof Error ? error.message : String(error),
    );
    return getSearchResultPageLegacy(filters, requestedPage, pageSize);
  }
}

type MapLessonRow = {
  id: string;
  location_id: string;
  raw_program_name: string;
  weekday: ClassSchedule["weekday"];
  start_time: string;
  end_time: string;
  duration_minutes: number | null;
  valid_from: string | null;
  extracted_at: string | null;
  updated_at: string;
  gym_locations: { name: string } | Array<{ name: string }>;
};

async function fetchLessonSearchIndex(): Promise<CachedLocationLessonIndex[]> {
  const supabase = getSupabaseClient();
  const pageSize = 1000;
  const locationsById = new Map<string, CachedLocationLessonIndex>();
  let from = 0;

  const rows: MapLessonRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("class_schedules")
      .select(
        "id, location_id, raw_program_name, weekday, start_time, end_time, duration_minutes, valid_from, extracted_at, updated_at, gym_locations(name)",
      )
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const batch = (data as MapLessonRow[]) ?? [];

    rows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  filterLatestSchedulePeriods(rows).forEach((row) => {
      const locationName = Array.isArray(row.gym_locations)
        ? row.gym_locations[0]?.name
        : row.gym_locations.name;

      if (!locationName) {
        return;
      }

      const normalized = normalizeProgramName({
        rawProgramName: row.raw_program_name,
        startTime: row.start_time,
        endTime: row.end_time,
      });
      const locationEntry = locationsById.get(row.location_id) ?? {
        l: row.location_id,
        n: locationName,
        x: [],
      };

      locationEntry.x.push({
        i: row.id,
        r: row.raw_program_name,
        c: normalized.canonical_program_name,
        b: normalized.program_brand,
        w: row.weekday,
        s: row.start_time,
        d: normalized.duration_minutes ?? row.duration_minutes,
        u: row.extracted_at || row.updated_at || null,
      });
      locationsById.set(row.location_id, locationEntry);
  });

  return Array.from(locationsById.values());
}

const getLessonSearchIndexFromDataCache = unstable_cache(
  fetchLessonSearchIndex,
  ["lesson-search-index-v5-latest-period"],
  {
    revalidate: sharedDataRevalidateSeconds,
    tags: ["map-lesson-search-index", "class-schedules"],
  },
);

export async function getMapLessonSearchIndex(): Promise<MapLocationLessonIndex[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const index = await getLessonSearchIndexFromDataCache();

    return index.map((locationEntry) => ({
      locationId: locationEntry.l,
      lessons: locationEntry.x.map((lesson) => ({
        rawProgramName: lesson.r,
        canonicalProgramName: lesson.c,
        programBrand: lesson.b,
      })),
    }));
  } catch (error) {
    console.error(
      "Failed to load map lesson search index from Supabase:",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

async function fetchBrands(): Promise<GymBrand[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("gym_brands").select("*").order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

const getBrandsFromDataCache = unstable_cache(fetchBrands, ["gym-brands-v1"], {
  revalidate: sharedDataRevalidateSeconds,
  tags: ["gym-brands"],
});

export async function getBrands(): Promise<GymBrand[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    return await getBrandsFromDataCache();
  } catch (error) {
    console.error("Failed to load brands from Supabase:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

async function fetchLocations(): Promise<GymLocation[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("gym_locations")
    .select("*, gym_brands(*)")
    .order("name");

  if (error) {
    throw error;
  }

  return ((data as Array<GymLocation & { gym_brands: GymBrand }>) ?? []).map((row) => ({
    ...row,
    brand: row.gym_brands,
  }));
}

const getLocationsFromDataCache = unstable_cache(fetchLocations, ["gym-locations-v1"], {
  revalidate: sharedDataRevalidateSeconds,
  tags: ["gym-locations", "gym-brands"],
});

export async function getLocations(): Promise<GymLocation[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    return await getLocationsFromDataCache();
  } catch (error) {
    console.error("Failed to load locations from Supabase:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

async function fetchPopularPrograms(): Promise<Program[]> {
  const supabase = getSupabaseClient();
  const pageSize = 1000;
  const scheduleRows: Array<{ location_id: string; program_id: string; valid_from: string | null }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("class_schedules")
      .select("location_id, program_id, valid_from")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    const batch = data ?? [];

    scheduleRows.push(...batch);

    if (batch.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  const scheduleCounts = new Map<string, number>();
  filterLatestSchedulePeriods(scheduleRows).forEach(({ program_id }) => {
    scheduleCounts.set(program_id, (scheduleCounts.get(program_id) ?? 0) + 1);
  });

  const { data: programs, error: programsError } = await supabase.from("programs").select("*");

  if (programsError) {
    throw programsError;
  }

  return ((programs as Program[]) ?? [])
    .filter((program) => seoProgramNameSet.has(program.name) && scheduleCounts.has(program.id))
    .sort((left, right) => {
      const countDiff = (scheduleCounts.get(right.id) ?? 0) - (scheduleCounts.get(left.id) ?? 0);
      return countDiff || left.name.localeCompare(right.name, "ja");
    });
}

const getPopularProgramsFromDataCache = unstable_cache(fetchPopularPrograms, ["popular-programs-v2-latest-period"], {
  revalidate: sharedDataRevalidateSeconds,
  tags: ["popular-programs", "class-schedules", "programs"],
});

export async function getPopularPrograms(limit = 8): Promise<Program[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const programs = await getPopularProgramsFromDataCache();
    return programs.slice(0, Math.max(0, limit));
  } catch (error) {
    console.error(
      "Failed to load popular programs from Supabase:",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

export async function getLocationSlugs(): Promise<string[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("gym_locations").select("slug").eq("is_active", true).order("slug");

  if (error || !data) {
    return [];
  }

  return data.map((row) => row.slug).filter((slug): slug is string => Boolean(slug));
}

export const getLocationBySlug = cache(async (slug: string): Promise<LocationDetail | null> => {
  const locations = await getLocations();
  const location = locations.find((item) => item.slug === slug);
  const brand = location?.brand;

  if (!location || !brand) {
    return null;
  }

  try {
    const rows = await fetchJoinedSchedulesForVariant(undefined, [location.id], { kind: "all" });
    const schedules = rows.map(mapJoinedSchedule).sort((left, right) => {
      if (left.schedule.weekday === right.schedule.weekday) {
        return left.schedule.start_time.localeCompare(right.schedule.start_time);
      }

      return left.schedule.weekday.localeCompare(right.schedule.weekday);
    });

    return { location, brand, schedules };
  } catch (error) {
    console.error(
      `Failed to load schedules for location ${slug}:`,
      error instanceof Error ? error.message : String(error),
    );
    return { location, brand, schedules: [] };
  }
});

async function resolveLandingProgram(slug: string): Promise<Program | null> {
  const normalizedSlug = normalizeLandingSlug(slug);
  const programs = await getPopularPrograms(Number.MAX_SAFE_INTEGER);

  return (
    programs.find(
      (program) =>
        normalizeLandingSlug(program.slug) === normalizedSlug ||
        normalizeLandingSlug(program.name) === normalizedSlug,
    ) ?? null
  );
}

async function resolveLandingProgramWithoutDataCache(slug: string): Promise<Program | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const normalizedSlug = normalizeLandingSlug(slug);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("programs").select("*");

  if (error) {
    throw error;
  }

  return (
    ((data as Program[]) ?? []).find(
      (program) =>
        normalizeLandingSlug(program.slug) === normalizedSlug ||
        normalizeLandingSlug(program.name) === normalizedSlug,
    ) ?? null
  );
}

export async function getProgramLandingSlugs(limit = staticProgramLandingPageLimit): Promise<string[]> {
  const programs = await getPopularPrograms(limit);
  return programs.map((program) => program.slug);
}

export const getProgramLandingBySlug = cache(async (slug: string): Promise<ProgramLandingPage | null> => {
  const program = await resolveLandingProgram(slug);

  if (!program || !seoProgramNameSet.has(program.name)) {
    return null;
  }

  try {
    const rows = await fetchJoinedSchedulesForVariant(undefined, null, {
      kind: "programId",
      value: program.id,
    });
    const schedules = filterResults(rows.map(mapJoinedSchedule), emptySearchFilters);

    if (!schedules.length) {
      return null;
    }

    return {
      program,
      schedules,
      locationCount: new Set(schedules.map((item) => item.location.id)).size,
      areaNames: Array.from(
        new Set(schedules.map((item) => getAreaName(item.location.prefecture, item.location.city)).filter(Boolean)),
      ),
      brandNames: Array.from(new Set(schedules.map((item) => item.brand.name))),
    };
  } catch (error) {
    console.error(
      `Failed to load schedules for program ${slug}:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
});

export const getAreaProgramLandingByParams = cache(
  async (area: string, programSlug: string): Promise<AreaProgramLandingPage | null> => {
    const decodedArea = decodeURIComponent(area);

    try {
      // Unicode path segments become implicit Next.js cache tags. Vercel serializes
      // those tags into an ASCII-only response header, so this route must avoid
      // the shared Next.js data cache and load its small lookup sets directly.
      const [program, locations] = await Promise.all([
        resolveLandingProgramWithoutDataCache(programSlug),
        fetchLocations(),
      ]);

      if (!program || !seoProgramNameSet.has(program.name)) {
        return null;
      }

      const locationIds = locations
        .filter((location) => getAreaName(location.prefecture, location.city) === decodedArea)
        .map((location) => location.id);

      if (!locationIds.length) {
        return null;
      }

      const rows = await fetchJoinedSchedulesForVariant(undefined, locationIds, {
        kind: "programId",
        value: program.id,
      });
      const schedules = filterResults(rows.map(mapJoinedSchedule), emptySearchFilters);

      if (!schedules.length) {
        return null;
      }

      return {
        areaName: decodedArea,
        program,
        schedules,
        locationCount: new Set(schedules.map((item) => item.location.id)).size,
        brandNames: Array.from(new Set(schedules.map((item) => item.brand.name))),
      };
    } catch (error) {
      console.error(
        `Failed to load schedules for ${decodedArea}/${programSlug}:`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  },
);

async function fetchTable<T>(table: string): Promise<T[]> {
  if (!hasSupabaseEnv()) {
    return [] as T[];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(table).select("*").limit(100).order("created_at", { ascending: false });

  if (error || !data) {
    return [] as T[];
  }

  return data as T[];
}

export async function getAdminDataset(): Promise<AdminDataset> {
  if (!hasSupabaseEnv()) {
    return emptyAdminDataset();
  }

  const [gym_brands, gym_locations, programs, class_schedules, source_pages, ingestion_runs, ingestion_items] =
    await Promise.all([
      fetchTable<GymBrand>("gym_brands"),
      fetchTable<GymLocation>("gym_locations"),
      fetchTable<Program>("programs"),
      fetchTable<ClassSchedule>("class_schedules"),
      fetchTable<SourcePage>("source_pages"),
      fetchTable<IngestionRun>("ingestion_runs"),
      fetchTable<IngestionItem>("ingestion_items"),
    ]);

  return {
    gym_brands,
    gym_locations,
    programs,
    class_schedules: class_schedules.length ? enrichSchedulesWithNormalization(class_schedules) : [],
    source_pages,
    ingestion_runs,
    ingestion_items,
  };
}
