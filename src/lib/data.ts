import { normalizeSearchKeyword, scoreProgramQueryMatch } from "@/lib/search-query";
import { enrichScheduleWithNormalization, enrichSchedulesWithNormalization } from "@/lib/schedule-normalization";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabase";
import type {
  AdminDataset,
  ClassSchedule,
  GymBrand,
  GymLocation,
  LocationDetail,
  Program,
  SearchFilters,
  SearchResult,
  SourcePage,
  IngestionItem,
  IngestionRun,
} from "@/lib/types";
import { getLocationAddress, isDurationInRange, isTimeInRange } from "@/lib/utils";

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

async function fetchAllJoinedSchedules() {
  const supabase = getSupabaseClient();
  const pageSize = 1000;
  const rows: SupabaseJoinedSchedule[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
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
      .order("start_time", { ascending: true })
      .range(from, to);

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

  return rows;
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
    data = await fetchAllJoinedSchedules();
  } catch (error) {
    console.error("Failed to load schedules from Supabase:", error instanceof Error ? error.message : String(error));
    return [];
  }

  const mappedResults = data.map(mapJoinedSchedule);
  logTrackedSearchStage("db_response", filters, mappedResults);

  return filterResults(mappedResults, filters);
}

export async function getBrands(): Promise<GymBrand[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("gym_brands").select("*").order("name");

  if (error || !data) {
    return [];
  }

  return data;
}

export async function getLocations(): Promise<GymLocation[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("gym_locations")
    .select("*, gym_brands(*)")
    .order("name");

  if (error || !data) {
    return [];
  }

  return (data as Array<GymLocation & { gym_brands: GymBrand }>).map((row) => ({
    ...row,
    brand: row.gym_brands,
  }));
}

export async function getLocationBySlug(slug: string): Promise<LocationDetail | null> {
  const results = await getSearchResults({
    q: "",
    weekday: "",
    timeRange: "",
    durationRange: "",
    brand: "",
    area: "",
  });

  const schedules = results.filter((item) => item.location.slug === slug);
  const first = schedules[0];

  if (!first) {
    return null;
  }

  return {
    location: first.location,
    brand: first.brand,
    schedules: schedules.sort((a, b) => {
      if (a.schedule.weekday === b.schedule.weekday) {
        return a.schedule.start_time.localeCompare(b.schedule.start_time);
      }

      return a.schedule.weekday.localeCompare(b.schedule.weekday);
    }),
  };
}

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
